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

export const DEFAULT_POSE_TARGETS: Record<string, PoseTargetDefinition> = {
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

export const getPoseTarget = (ruleConfig: StageRuleConfig) =>
  DEFAULT_POSE_TARGETS[ruleConfig.targetPoseKey] ?? DEFAULT_POSE_TARGETS.arms_up;
