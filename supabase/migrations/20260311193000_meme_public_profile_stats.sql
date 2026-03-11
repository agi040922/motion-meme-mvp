create or replace function meme.list_public_profile_stats(p_user_ids uuid[])
returns table (
  user_id uuid,
  post_count bigint,
  follower_count bigint,
  following_count bigint,
  best_score integer,
  total_play_count bigint,
  uploaded_play_count bigint,
  last_played_at timestamptz
)
language sql
security definer
set search_path = meme, public
as $$
  select
    p.user_id,
    count(distinct po.id) filter (where po.deleted_at is null) as post_count,
    count(distinct f1.follower_user_id) as follower_count,
    count(distinct f2.following_user_id) as following_count,
    coalesce(max(ps.score), 0) as best_score,
    count(distinct ps.id) as total_play_count,
    count(distinct ps.id) filter (where ps.uploaded_at is not null) as uploaded_play_count,
    max(ps.attempt_finished_at) as last_played_at
  from meme.profiles p
  left join meme.posts po
    on po.author_user_id = p.user_id
  left join meme.follows f1
    on f1.following_user_id = p.user_id
  left join meme.follows f2
    on f2.follower_user_id = p.user_id
  left join meme.play_sessions ps
    on ps.user_id = p.user_id
  where p.user_id = any(p_user_ids)
  group by p.user_id;
$$;

grant execute on function meme.list_public_profile_stats(uuid[]) to anon, authenticated, service_role;
