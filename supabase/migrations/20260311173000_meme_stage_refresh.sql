with seeded_meme_assets as (
  select *
  from (
    values
      ('success-kid', 'Success Kid', 'image', '/success-memes/success-kid.jpg', '{"accent":"#b8ff41","successSticker":"FIST PUMP"}'::jsonb, 101),
      ('doge-classic', 'Doge', 'image', '/success-memes/doge.jpg', '{"accent":"#f7d154","successSticker":"SUCH CLEAR"}'::jsonb, 102),
      ('this-is-fine-classic', 'This Is Fine', 'image', '/success-memes/this-is-fine.jpeg', '{"accent":"#ff9152","successSticker":"CALM CHAOS"}'::jsonb, 103),
      ('disaster-girl-classic', 'Disaster Girl', 'image', '/success-memes/disaster-girl.jpg', '{"accent":"#ff5c7a","successSticker":"BURN IT"}'::jsonb, 104),
      ('distracted-boyfriend-classic', 'Distracted Boyfriend', 'image', '/success-memes/distracted-boyfriend.jpg', '{"accent":"#7dd3fc","successSticker":"LOOK AWAY"}'::jsonb, 105),
      ('trollface-classic', 'Trollface', 'image', '/success-memes/trollface.jpg', '{"accent":"#f97316","successSticker":"MAD GENIUS"}'::jsonb, 106),
      ('hide-the-pain-harold-classic', 'Hide the Pain Harold', 'image', '/success-memes/hide-the-pain-harold.jpg', '{"accent":"#94a3b8","successSticker":"SMILE THROUGH IT"}'::jsonb, 107),
      ('woman-yelling-at-cat-classic', 'Woman Yelling at Cat', 'image', '/success-memes/woman-yelling-at-cat.jpg', '{"accent":"#f472b6","successSticker":"TABLE CHAOS"}'::jsonb, 108),
      ('one-does-not-simply-classic', 'One Does Not Simply', 'image', '/success-memes/one-does-not-simply.jpg', '{"accent":"#f59e0b","successSticker":"SIMPLY CLEAR"}'::jsonb, 109),
      ('roll-safe-classic', 'Roll Safe', 'image', '/success-memes/roll-safe.jpg', '{"accent":"#fde68a","successSticker":"BIG BRAIN"}'::jsonb, 110),
      ('surprised-pikachu-classic', 'Surprised Pikachu', 'image', '/success-memes/surprised-pikachu.png', '{"accent":"#fde047","successSticker":"NO WAY"}'::jsonb, 111),
      ('mocking-spongebob-classic', 'Mocking SpongeBob', 'image', '/success-memes/mocking-spongebob.jpg', '{"accent":"#facc15","successSticker":"mOcKiNg"}'::jsonb, 112),
      ('expanding-brain-classic', 'Expanding Brain', 'image', '/success-memes/expanding-brain.png', '{"accent":"#67e8f9","successSticker":"GALAXY MODE"}'::jsonb, 113),
      ('deal-with-it-classic', 'Deal With It', 'animated_image', '/success-memes/deal-with-it.gif', '{"accent":"#ffffff","successSticker":"DEAL WITH IT"}'::jsonb, 114),
      ('rickroll-classic', 'Rickroll', 'image', '/success-memes/rickroll.jpg', '{"accent":"#60a5fa","successSticker":"NEVER GONNA"}'::jsonb, 115),
      ('pepe-the-frog-classic', 'Pepe the Frog', 'image', '/success-memes/pepe-the-frog.jpg', '{"accent":"#86efac","successSticker":"FEELS GOOD"}'::jsonb, 116),
      ('grumpy-cat-classic', 'Grumpy Cat', 'image', '/success-memes/grumpy-cat.jpg', '{"accent":"#cbd5e1","successSticker":"NOPE"}'::jsonb, 117),
      ('keyboard-cat-classic', 'Keyboard Cat', 'image', '/success-memes/keyboard-cat.jpg', '{"accent":"#c084fc","successSticker":"SOLO TIME"}'::jsonb, 118),
      ('nyan-cat-classic', 'Nyan Cat', 'image', '/success-memes/nyan-cat.jpg', '{"accent":"#f472b6","successSticker":"RAINBOW RUN"}'::jsonb, 119),
      ('picard-facepalm-classic', 'Picard Facepalm', 'image', '/success-memes/picard-facepalm.jpg', '{"accent":"#fca5a5","successSticker":"FACEPALM"}'::jsonb, 120)
  ) as m(slug, title, asset_type, storage_path, overlay_preset, sort_order)
)
insert into meme.meme_assets (
  slug,
  title,
  asset_type,
  storage_path,
  overlay_preset,
  sort_order,
  is_active
)
select
  m.slug,
  m.title,
  m.asset_type,
  m.storage_path,
  m.overlay_preset,
  m.sort_order,
  true
from seeded_meme_assets m
on conflict (slug) do update
set title = excluded.title,
    asset_type = excluded.asset_type,
    storage_path = excluded.storage_path,
    overlay_preset = excluded.overlay_preset,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active,
    updated_at = now();

with seeded_stages as (
  select *
  from (
    values
      (1, 'success-kid', 'Success Kid', 'Pop a tiny fist-pump win pose like the classic success meme.', 'Curl one fist in, keep your chest proud, and hold the mini-win.', 10, 30, 'success-kid', '{"targetPoseKey":"success_kid_fist_pump","holdMs":450,"weights":{"arms":35,"torso":25,"hold":40}}'::jsonb),
      (2, 'doge', 'Doge', 'Lean into a playful side pose with wide-eyed “wow” energy.', 'Shift your torso left and throw one arm out like you just discovered a great idea.', 10, 32, 'doge-classic', '{"targetPoseKey":"doge_wow_lean","holdMs":500,"weights":{"arms":35,"torso":25,"legs":10,"hold":30}}'::jsonb),
      (3, 'surprised-pikachu', 'Surprised Pikachu', 'Hit the classic shocked reaction with your hands lifted near your face.', 'Bring both hands near your cheeks, elbows wide, and freeze the reaction.', 10, 34, 'surprised-pikachu-classic', '{"targetPoseKey":"surprised_pikachu_gasp","holdMs":520,"weights":{"arms":35,"torso":20,"hold":45}}'::jsonb),
      (4, 'roll-safe', 'Roll Safe', 'Angle your body like you just made a suspiciously clever plan.', 'Point with confidence and keep a sly upper-body twist.', 10, 36, 'roll-safe-classic', '{"targetPoseKey":"roll_safe_tap_temple","holdMs":560,"weights":{"arms":30,"torso":25,"legs":10,"hold":35}}'::jsonb),
      (5, 'one-does-not-simply', 'One Does Not Simply', 'Frame yourself like you are delivering a dramatic warning to the room.', 'Lift your arms into a guarded crown-like pose and stay centered.', 11, 38, 'one-does-not-simply-classic', '{"targetPoseKey":"one_does_not_simply_warning","holdMs":600,"weights":{"arms":35,"torso":20,"hold":45}}'::jsonb),
      (6, 'deal-with-it', 'Deal With It', 'Stand tall and frame your face like the sunglasses are about to drop.', 'Raise your hands around your face and lock the stance.', 11, 40, 'deal-with-it-classic', '{"targetPoseKey":"deal_with_it_shades_drop","holdMs":620,"weights":{"arms":35,"torso":20,"hold":45}}'::jsonb),
      (7, 'distracted-boyfriend', 'Distracted Boyfriend', 'Twist your body like your attention just snapped to the side.', 'Rotate your shoulders, throw one arm long, and make the pivot obvious.', 11, 42, 'distracted-boyfriend-classic', '{"targetPoseKey":"distracted_boyfriend_turn","holdMs":660,"weights":{"arms":30,"torso":30,"legs":10,"hold":30}}'::jsonb),
      (8, 'woman-yelling-at-cat', 'Woman Yelling at Cat', 'Cross the arms and give the moment some table-flip drama.', 'Bring your arms across your torso and hold the argument pose.', 11, 44, 'woman-yelling-at-cat-classic', '{"targetPoseKey":"woman_yelling_cat_table_drama","holdMs":700,"weights":{"arms":35,"torso":20,"hold":45}}'::jsonb),
      (9, 'this-is-fine', 'This Is Fine', 'Stay weirdly calm while the whole room is supposedly on fire.', 'Keep your posture compact and composed like you are pretending everything is okay.', 12, 46, 'this-is-fine-classic', '{"targetPoseKey":"this_is_fine_composed_pose","holdMs":740,"weights":{"arms":30,"torso":25,"hold":45}}'::jsonb),
      (10, 'expanding-brain', 'Expanding Brain', 'Open up into a big “level unlocked” reaction.', 'Throw your arms up and stand tall like the idea just hit.', 12, 48, 'expanding-brain-classic', '{"targetPoseKey":"expanding_brain_unlock","holdMs":780,"weights":{"arms":35,"torso":20,"hold":45}}'::jsonb),
      (11, 'disaster-girl', 'Disaster Girl', 'Own the frame like chaos is happening exactly according to plan.', 'Lock a confident full-body finish pose and keep it still.', 12, 50, 'disaster-girl-classic', '{"targetPoseKey":"disaster_girl_glance","holdMs":820,"weights":{"arms":30,"legs":15,"torso":10,"hold":45}}'::jsonb),
      (12, 'hide-the-pain-harold', 'Hide the Pain Harold', 'Frame the body like you are smiling through an awkward moment.', 'Keep your upper body neat, hands controlled, and posture a little too polite.', 12, 52, 'hide-the-pain-harold-classic', '{"targetPoseKey":"harold_polite_pain","holdMs":860,"weights":{"arms":30,"torso":20,"hold":50}}'::jsonb),
      (13, 'mocking-spongebob', 'Mocking SpongeBob', 'Snap into a bent, exaggerated parody stance.', 'Cross in close and make the posture look intentionally annoying.', 13, 54, 'mocking-spongebob-classic', '{"targetPoseKey":"mocking_spongebob_slouch","holdMs":900,"weights":{"arms":35,"torso":20,"hold":45}}'::jsonb),
      (14, 'pepe-the-frog', 'Pepe the Frog', 'Tilt and twist into a smug frog-energy pose.', 'Rotate the torso, keep one side lifted, and stay relaxed.', 13, 56, 'pepe-the-frog-classic', '{"targetPoseKey":"pepe_sly_twist","holdMs":940,"weights":{"torso":30,"arms":20,"hold":50}}'::jsonb),
      (15, 'grumpy-cat', 'Grumpy Cat', 'Stay small, centered, and absolutely unimpressed.', 'Bring the arms in close and hold a tight, controlled pose.', 13, 58, 'grumpy-cat-classic', '{"targetPoseKey":"grumpy_cat_compact","holdMs":980,"weights":{"arms":30,"torso":20,"hold":50}}'::jsonb),
      (16, 'keyboard-cat', 'Keyboard Cat', 'Drop low and spread out like you are about to solo on the keys.', 'Lower your hips, widen your stance, and flare both arms.', 13, 60, 'keyboard-cat-classic', '{"targetPoseKey":"keyboard_cat_drop","holdMs":1020,"weights":{"legs":30,"arms":20,"hold":50}}'::jsonb),
      (17, 'nyan-cat', 'Nyan Cat', 'Make the whole body feel like a rainbow-powered launch.', 'Sink into a low combo stance and keep the energy wide.', 14, 62, 'nyan-cat-classic', '{"targetPoseKey":"nyan_cat_launch","holdMs":1060,"weights":{"legs":30,"arms":20,"hold":50}}'::jsonb),
      (18, 'picard-facepalm', 'Picard Facepalm', 'Hit the dramatic “I cannot believe this” reaction.', 'Hands up toward the face, elbows out, and freeze the exasperation.', 14, 64, 'picard-facepalm-classic', '{"targetPoseKey":"picard_facepalm_react","holdMs":1100,"weights":{"arms":35,"torso":15,"hold":50}}'::jsonb),
      (19, 'rickroll', 'Rickroll', 'Throw yourself into a shameless performance pose.', 'Open the body, turn a little, and hold the showman stance.', 14, 66, 'rickroll-classic', '{"targetPoseKey":"rickroll_showman","holdMs":1140,"weights":{"torso":30,"arms":20,"hold":50}}'::jsonb),
      (20, 'trollface', 'Trollface', 'Finish with a full-body troll victory pose that owns the screen.', 'One arm high, one arm low, and lock the stance like you got away with it.', 15, 68, 'trollface-classic', '{"targetPoseKey":"trollface_victory","holdMs":1200,"weights":{"arms":30,"legs":15,"torso":10,"hold":45}}'::jsonb)
  ) as s(stage_number, slug, title, description, instruction_text, time_limit_seconds, min_score_to_clear, success_meme_slug, rule_config)
)
insert into meme.stages (
  stage_number,
  slug,
  title,
  description,
  instruction_text,
  time_limit_seconds,
  min_score_to_clear,
  rule_config,
  success_meme_asset_id,
  is_active
)
select
  s.stage_number,
  s.slug,
  s.title,
  s.description,
  s.instruction_text,
  s.time_limit_seconds,
  s.min_score_to_clear,
  s.rule_config,
  ma.id,
  true
from seeded_stages s
join meme.meme_assets ma
  on ma.slug = s.success_meme_slug
on conflict (stage_number) do update
set slug = excluded.slug,
    title = excluded.title,
    description = excluded.description,
    instruction_text = excluded.instruction_text,
    time_limit_seconds = excluded.time_limit_seconds,
    min_score_to_clear = excluded.min_score_to_clear,
    rule_config = excluded.rule_config,
    success_meme_asset_id = excluded.success_meme_asset_id,
    is_active = excluded.is_active,
    updated_at = now();
