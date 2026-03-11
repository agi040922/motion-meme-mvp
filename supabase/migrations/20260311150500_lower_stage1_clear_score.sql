update meme.stages
set min_score_to_clear = 30,
    updated_at = now()
where stage_number = 1;
