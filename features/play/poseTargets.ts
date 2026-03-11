import type { StageRuleConfig } from "@/features/meme/types";

type JointTarget = {
  angle: number;
  tolerance: number;
  weightKey: string;
};

export type PoseTargetDefinition = {
  label: string;
  joints: Record<string, JointTarget>;
  centerWeight: number;
  hipLevelTolerance: number;
};

const BASE_POSE_TARGETS: Record<string, PoseTargetDefinition> = {
  arms_up: {
    label: "Arms Up",
    joints: {
      leftShoulder: { angle: 38, tolerance: 42, weightKey: "arms" },
      rightShoulder: { angle: 38, tolerance: 42, weightKey: "arms" },
      leftElbow: { angle: 170, tolerance: 22, weightKey: "arms" },
      rightElbow: { angle: 170, tolerance: 22, weightKey: "arms" },
    },
    centerWeight: 15,
    hipLevelTolerance: 0.12,
  },
  side_pop_left: {
    label: "Side Pop",
    joints: {
      leftShoulder: { angle: 65, tolerance: 35, weightKey: "arms" },
      rightShoulder: { angle: 125, tolerance: 40, weightKey: "torso" },
      leftKnee: { angle: 165, tolerance: 25, weightKey: "legs" },
      rightKnee: { angle: 155, tolerance: 28, weightKey: "legs" },
    },
    centerWeight: 20,
    hipLevelTolerance: 0.18,
  },
  crown_lock: {
    label: "Crown Lock",
    joints: {
      leftElbow: { angle: 78, tolerance: 25, weightKey: "arms" },
      rightElbow: { angle: 78, tolerance: 25, weightKey: "arms" },
      leftShoulder: { angle: 75, tolerance: 25, weightKey: "arms" },
      rightShoulder: { angle: 75, tolerance: 25, weightKey: "arms" },
    },
    centerWeight: 20,
    hipLevelTolerance: 0.1,
  },
  laser_point: {
    label: "Laser Point",
    joints: {
      leftShoulder: { angle: 150, tolerance: 35, weightKey: "arms" },
      rightShoulder: { angle: 48, tolerance: 30, weightKey: "arms" },
      leftKnee: { angle: 135, tolerance: 30, weightKey: "legs" },
      rightKnee: { angle: 148, tolerance: 25, weightKey: "legs" },
    },
    centerWeight: 18,
    hipLevelTolerance: 0.16,
  },
  shock_face: {
    label: "Shock Freeze",
    joints: {
      leftElbow: { angle: 60, tolerance: 25, weightKey: "arms" },
      rightElbow: { angle: 60, tolerance: 25, weightKey: "arms" },
      leftShoulder: { angle: 95, tolerance: 25, weightKey: "arms" },
      rightShoulder: { angle: 95, tolerance: 25, weightKey: "arms" },
    },
    centerWeight: 22,
    hipLevelTolerance: 0.12,
  },
  winner_frame: {
    label: "Winner Frame",
    joints: {
      leftElbow: { angle: 95, tolerance: 22, weightKey: "arms" },
      rightElbow: { angle: 95, tolerance: 22, weightKey: "arms" },
      leftShoulder: { angle: 82, tolerance: 22, weightKey: "arms" },
      rightShoulder: { angle: 82, tolerance: 22, weightKey: "arms" },
    },
    centerWeight: 15,
    hipLevelTolerance: 0.08,
  },
  combo_drop: {
    label: "Combo Drop",
    joints: {
      leftKnee: { angle: 110, tolerance: 26, weightKey: "legs" },
      rightKnee: { angle: 110, tolerance: 26, weightKey: "legs" },
      leftShoulder: { angle: 98, tolerance: 28, weightKey: "arms" },
      rightShoulder: { angle: 98, tolerance: 28, weightKey: "arms" },
    },
    centerWeight: 20,
    hipLevelTolerance: 0.2,
  },
  siren_twist: {
    label: "Siren Twist",
    joints: {
      leftShoulder: { angle: 50, tolerance: 24, weightKey: "arms" },
      rightShoulder: { angle: 135, tolerance: 30, weightKey: "torso" },
      leftHip: { angle: 150, tolerance: 22, weightKey: "torso" },
      rightHip: { angle: 110, tolerance: 26, weightKey: "torso" },
    },
    centerWeight: 18,
    hipLevelTolerance: 0.16,
  },
  flash_cross: {
    label: "Flash Cross",
    joints: {
      leftElbow: { angle: 70, tolerance: 25, weightKey: "arms" },
      rightElbow: { angle: 70, tolerance: 25, weightKey: "arms" },
      leftShoulder: { angle: 55, tolerance: 22, weightKey: "arms" },
      rightShoulder: { angle: 55, tolerance: 22, weightKey: "arms" },
    },
    centerWeight: 20,
    hipLevelTolerance: 0.12,
  },
  boss_finish: {
    label: "Boss Finish",
    joints: {
      leftShoulder: { angle: 38, tolerance: 20, weightKey: "arms" },
      rightShoulder: { angle: 145, tolerance: 28, weightKey: "arms" },
      leftKnee: { angle: 160, tolerance: 20, weightKey: "legs" },
      rightKnee: { angle: 138, tolerance: 22, weightKey: "legs" },
    },
    centerWeight: 22,
    hipLevelTolerance: 0.16,
  },
};

const MEME_POSE_VARIANTS: Record<
  string,
  | { label: string; baseKey: keyof typeof BASE_POSE_TARGETS }
  | PoseTargetDefinition
> = {
  success_kid_fist_pump: {
    label: "Success Kid Fist Pump",
    joints: {
      leftShoulder: { angle: 132, tolerance: 34, weightKey: "arms" },
      rightShoulder: { angle: 78, tolerance: 24, weightKey: "arms" },
      leftElbow: { angle: 158, tolerance: 28, weightKey: "arms" },
      rightElbow: { angle: 62, tolerance: 20, weightKey: "arms" },
    },
    centerWeight: 18,
    hipLevelTolerance: 0.14,
  },
  doge_wow_lean: {
    label: "Doge Wow Lean",
    joints: {
      leftShoulder: { angle: 98, tolerance: 26, weightKey: "arms" },
      rightShoulder: { angle: 98, tolerance: 26, weightKey: "arms" },
      leftElbow: { angle: 60, tolerance: 18, weightKey: "arms" },
      rightElbow: { angle: 60, tolerance: 18, weightKey: "arms" },
    },
    centerWeight: 28,
    hipLevelTolerance: 0.1,
  },
  surprised_pikachu_gasp: {
    label: "Surprised Pikachu Gasp",
    joints: {
      leftShoulder: { angle: 76, tolerance: 22, weightKey: "arms" },
      rightShoulder: { angle: 76, tolerance: 22, weightKey: "arms" },
      leftElbow: { angle: 38, tolerance: 16, weightKey: "arms" },
      rightElbow: { angle: 38, tolerance: 16, weightKey: "arms" },
    },
    centerWeight: 26,
    hipLevelTolerance: 0.1,
  },
  roll_safe_tap_temple: {
    label: "Roll Safe Tap Temple",
    joints: {
      leftShoulder: { angle: 58, tolerance: 20, weightKey: "arms" },
      rightShoulder: { angle: 132, tolerance: 30, weightKey: "arms" },
      leftElbow: { angle: 52, tolerance: 18, weightKey: "arms" },
      rightElbow: { angle: 154, tolerance: 24, weightKey: "arms" },
    },
    centerWeight: 20,
    hipLevelTolerance: 0.14,
  },
  one_does_not_simply_warning: {
    label: "One Does Not Simply Warning",
    joints: {
      leftShoulder: { angle: 86, tolerance: 24, weightKey: "arms" },
      rightShoulder: { angle: 126, tolerance: 28, weightKey: "arms" },
      leftElbow: { angle: 92, tolerance: 22, weightKey: "arms" },
      rightElbow: { angle: 150, tolerance: 24, weightKey: "arms" },
    },
    centerWeight: 22,
    hipLevelTolerance: 0.12,
  },
  deal_with_it_shades_drop: { label: "Deal With It Shades Drop", baseKey: "winner_frame" },
  distracted_boyfriend_turn: { label: "Distracted Boyfriend Turn", baseKey: "side_pop_left" },
  woman_yelling_cat_table_drama: { label: "Woman Yelling Cat Table Drama", baseKey: "flash_cross" },
  this_is_fine_composed_pose: { label: "This Is Fine Composed Pose", baseKey: "winner_frame" },
  expanding_brain_unlock: { label: "Expanding Brain Unlock", baseKey: "arms_up" },
  disaster_girl_glance: { label: "Disaster Girl Glance", baseKey: "boss_finish" },
  harold_polite_pain: { label: "Harold Polite Pain", baseKey: "winner_frame" },
  mocking_spongebob_slouch: { label: "Mocking SpongeBob Slouch", baseKey: "flash_cross" },
  pepe_sly_twist: { label: "Pepe Sly Twist", baseKey: "siren_twist" },
  grumpy_cat_compact: { label: "Grumpy Cat Compact", baseKey: "crown_lock" },
  keyboard_cat_drop: { label: "Keyboard Cat Drop", baseKey: "combo_drop" },
  nyan_cat_launch: { label: "Nyan Cat Launch", baseKey: "combo_drop" },
  picard_facepalm_react: { label: "Picard Facepalm React", baseKey: "shock_face" },
  rickroll_showman: { label: "Rickroll Showman", baseKey: "siren_twist" },
  trollface_victory: { label: "Trollface Victory", baseKey: "boss_finish" },
};

export const getPoseTarget = (ruleConfig: StageRuleConfig) => {
  const variant = MEME_POSE_VARIANTS[ruleConfig.targetPoseKey];
  if (variant) {
    if ("joints" in variant) {
      return variant;
    }
    return {
      ...BASE_POSE_TARGETS[variant.baseKey],
      label: variant.label,
    };
  }

  return BASE_POSE_TARGETS[ruleConfig.targetPoseKey] ?? BASE_POSE_TARGETS.arms_up;
};
