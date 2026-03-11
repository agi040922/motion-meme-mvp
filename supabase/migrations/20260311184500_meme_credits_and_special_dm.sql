create table if not exists meme.credit_wallets (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_wallets_balance_check check (balance >= 0)
);

create table if not exists meme.credit_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  delta integer not null,
  balance_after integer not null,
  reason text not null,
  reference_type text not null default 'manual',
  reference_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint credit_ledger_balance_after_check check (balance_after >= 0)
);

create table if not exists meme.conversation_requests (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references meme.conversations (id) on delete cascade,
  requester_user_id uuid not null references auth.users (id) on delete cascade,
  target_user_id uuid not null references auth.users (id) on delete cascade,
  intent text not null,
  theme text not null default 'default',
  credits_spent integer not null default 0,
  opening_message text not null default '',
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_requests_intent_check check (intent in ('dating_intro', 'brand_collab')),
  constraint conversation_requests_status_check check (status in ('sent', 'accepted', 'rejected', 'expired', 'refunded')),
  constraint conversation_requests_credits_spent_check check (credits_spent >= 0)
);

create index if not exists credit_ledger_user_recent_idx
  on meme.credit_ledger (user_id, created_at desc);

create index if not exists conversation_requests_requester_recent_idx
  on meme.conversation_requests (requester_user_id, created_at desc);

create index if not exists conversation_requests_target_recent_idx
  on meme.conversation_requests (target_user_id, created_at desc);

create index if not exists conversation_requests_conversation_recent_idx
  on meme.conversation_requests (conversation_id, created_at desc);

drop trigger if exists set_credit_wallets_updated_at on meme.credit_wallets;
create trigger set_credit_wallets_updated_at
  before update on meme.credit_wallets
  for each row execute procedure meme.set_updated_at();

drop trigger if exists set_conversation_requests_updated_at on meme.conversation_requests;
create trigger set_conversation_requests_updated_at
  before update on meme.conversation_requests
  for each row execute procedure meme.set_updated_at();

create or replace function meme.get_viewer_credit_balance()
returns integer
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into meme.credit_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select balance
    into v_balance
  from meme.credit_wallets
  where user_id = v_user_id;

  return coalesce(v_balance, 0);
end;
$$;

create or replace function meme.purchase_mock_credits(
  p_credits integer,
  p_package_id text default null
)
returns integer
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_balance integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_credits is null or p_credits <= 0 then
    raise exception 'A positive credit amount is required';
  end if;

  insert into meme.credit_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  update meme.credit_wallets
  set balance = balance + p_credits,
      updated_at = now()
  where user_id = v_user_id
  returning balance into v_balance;

  insert into meme.credit_ledger (
    user_id,
    delta,
    balance_after,
    reason,
    reference_type,
    metadata
  )
  values (
    v_user_id,
    p_credits,
    v_balance,
    'mock_purchase',
    'credit_package',
    jsonb_build_object(
      'package_id', p_package_id,
      'credits', p_credits
    )
  );

  return v_balance;
end;
$$;

create or replace function meme.start_special_conversation(
  p_other_user_id uuid,
  p_intent text,
  p_theme text default null,
  p_opening_message text default ''
)
returns table (
  conversation_id uuid,
  request_id uuid,
  balance integer
)
language plpgsql
security definer
set search_path = meme, public
as $$
declare
  v_user_id uuid;
  v_conversation_id uuid;
  v_request_id uuid;
  v_balance integer;
  v_cost integer;
  v_theme text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_other_user_id is null or p_other_user_id = v_user_id then
    raise exception 'A different recipient is required';
  end if;

  if p_intent not in ('dating_intro', 'brand_collab') then
    raise exception 'Unsupported special DM intent';
  end if;

  v_cost := case
    when p_intent = 'dating_intro' then 20
    when p_intent = 'brand_collab' then 50
    else 0
  end;

  v_theme := case
    when p_theme is not null and char_length(trim(p_theme)) > 0 then trim(p_theme)
    when p_intent = 'dating_intro' then 'blossom'
    when p_intent = 'brand_collab' then 'brand-dark'
    else 'default'
  end;

  insert into meme.credit_wallets (user_id, balance)
  values (v_user_id, 0)
  on conflict (user_id) do nothing;

  select balance
    into v_balance
  from meme.credit_wallets
  where user_id = v_user_id
  for update;

  if coalesce(v_balance, 0) < v_cost then
    raise exception 'Not enough credits';
  end if;

  v_conversation_id := meme.get_or_create_direct_conversation(p_other_user_id);

  select id
    into v_request_id
  from meme.conversation_requests
  where conversation_id = v_conversation_id
    and requester_user_id = v_user_id
    and target_user_id = p_other_user_id
    and intent = p_intent
    and status = 'sent'
  order by created_at desc
  limit 1;

  if v_request_id is null then
    update meme.credit_wallets
    set balance = balance - v_cost,
        updated_at = now()
    where user_id = v_user_id
    returning balance into v_balance;

    insert into meme.credit_ledger (
      user_id,
      delta,
      balance_after,
      reason,
      reference_type,
      metadata
    )
    values (
      v_user_id,
      -v_cost,
      v_balance,
      p_intent || '_send',
      'conversation_request',
      jsonb_build_object(
        'intent', p_intent,
        'target_user_id', p_other_user_id,
        'conversation_id', v_conversation_id
      )
    );

    insert into meme.conversation_requests (
      conversation_id,
      requester_user_id,
      target_user_id,
      intent,
      theme,
      credits_spent,
      opening_message,
      status
    )
    values (
      v_conversation_id,
      v_user_id,
      p_other_user_id,
      p_intent,
      v_theme,
      v_cost,
      coalesce(trim(p_opening_message), ''),
      'sent'
    )
    returning id into v_request_id;
  end if;

  return query
  select v_conversation_id, v_request_id, v_balance;
end;
$$;

grant execute on function meme.get_viewer_credit_balance() to authenticated, service_role;
grant execute on function meme.purchase_mock_credits(integer, text) to authenticated, service_role;
grant execute on function meme.start_special_conversation(uuid, text, text, text) to authenticated, service_role;

alter table meme.credit_wallets enable row level security;
alter table meme.credit_ledger enable row level security;
alter table meme.conversation_requests enable row level security;

drop policy if exists credit_wallets_select_own on meme.credit_wallets;
create policy credit_wallets_select_own
  on meme.credit_wallets
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists credit_ledger_select_own on meme.credit_ledger;
create policy credit_ledger_select_own
  on meme.credit_ledger
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists conversation_requests_select_participants on meme.conversation_requests;
create policy conversation_requests_select_participants
  on meme.conversation_requests
  for select
  to authenticated
  using (
    requester_user_id = (select auth.uid())
    or target_user_id = (select auth.uid())
  );
