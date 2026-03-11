with stage_pose_keys as (
  select *
  from (
    values
      (1, 'success_kid_fist_pump'),
      (2, 'doge_wow_lean'),
      (3, 'surprised_pikachu_gasp'),
      (4, 'roll_safe_tap_temple'),
      (5, 'one_does_not_simply_warning'),
      (6, 'deal_with_it_shades_drop'),
      (7, 'distracted_boyfriend_turn'),
      (8, 'woman_yelling_cat_table_drama'),
      (9, 'this_is_fine_composed_pose'),
      (10, 'expanding_brain_unlock'),
      (11, 'disaster_girl_glance'),
      (12, 'harold_polite_pain'),
      (13, 'mocking_spongebob_slouch'),
      (14, 'pepe_sly_twist'),
      (15, 'grumpy_cat_compact'),
      (16, 'keyboard_cat_drop'),
      (17, 'nyan_cat_launch'),
      (18, 'picard_facepalm_react'),
      (19, 'rickroll_showman'),
      (20, 'trollface_victory')
  ) as x(stage_number, target_pose_key)
)
update meme.stages stage_row
set rule_config = jsonb_set(
      stage_row.rule_config,
      '{targetPoseKey}',
      to_jsonb(stage_pose_keys.target_pose_key),
      false
    ),
    updated_at = now()
from stage_pose_keys
where stage_row.stage_number = stage_pose_keys.stage_number;
