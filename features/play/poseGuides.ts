import type { StageRuleConfig } from "@/features/meme/types";

type GuidePoint = {
  x: number;
  y: number;
};

export type PoseGuideDefinition = {
  label: string;
  cue: string;
  points: Record<
    | "head"
    | "leftShoulder"
    | "rightShoulder"
    | "leftElbow"
    | "rightElbow"
    | "leftWrist"
    | "rightWrist"
    | "leftHip"
    | "rightHip"
    | "leftKnee"
    | "rightKnee"
    | "leftAnkle"
    | "rightAnkle",
    GuidePoint
  >;
};

const GUIDE_LIBRARY: Record<string, PoseGuideDefinition> = {
  arms_up: {
    label: "Arms Up",
    cue: "Lift both hands above your shoulders and keep your torso tall.",
    points: {
      head: { x: 0.5, y: 0.12 },
      leftShoulder: { x: 0.38, y: 0.28 },
      rightShoulder: { x: 0.62, y: 0.28 },
      leftElbow: { x: 0.28, y: 0.16 },
      rightElbow: { x: 0.72, y: 0.16 },
      leftWrist: { x: 0.22, y: 0.06 },
      rightWrist: { x: 0.78, y: 0.06 },
      leftHip: { x: 0.43, y: 0.5 },
      rightHip: { x: 0.57, y: 0.5 },
      leftKnee: { x: 0.44, y: 0.72 },
      rightKnee: { x: 0.56, y: 0.72 },
      leftAnkle: { x: 0.42, y: 0.94 },
      rightAnkle: { x: 0.58, y: 0.94 },
    },
  },
  side_pop_left: {
    label: "Side Pop",
    cue: "Shift left, keep one arm long, and stay slightly bent at the knees.",
    points: {
      head: { x: 0.48, y: 0.12 },
      leftShoulder: { x: 0.32, y: 0.3 },
      rightShoulder: { x: 0.56, y: 0.26 },
      leftElbow: { x: 0.24, y: 0.42 },
      rightElbow: { x: 0.74, y: 0.24 },
      leftWrist: { x: 0.16, y: 0.52 },
      rightWrist: { x: 0.86, y: 0.22 },
      leftHip: { x: 0.39, y: 0.5 },
      rightHip: { x: 0.53, y: 0.48 },
      leftKnee: { x: 0.38, y: 0.74 },
      rightKnee: { x: 0.56, y: 0.7 },
      leftAnkle: { x: 0.34, y: 0.94 },
      rightAnkle: { x: 0.62, y: 0.9 },
    },
  },
  crown_lock: {
    label: "Crown Lock",
    cue: "Bring both hands near your head and stay centered.",
    points: {
      head: { x: 0.5, y: 0.12 },
      leftShoulder: { x: 0.4, y: 0.28 },
      rightShoulder: { x: 0.6, y: 0.28 },
      leftElbow: { x: 0.34, y: 0.18 },
      rightElbow: { x: 0.66, y: 0.18 },
      leftWrist: { x: 0.42, y: 0.08 },
      rightWrist: { x: 0.58, y: 0.08 },
      leftHip: { x: 0.44, y: 0.5 },
      rightHip: { x: 0.56, y: 0.5 },
      leftKnee: { x: 0.45, y: 0.72 },
      rightKnee: { x: 0.55, y: 0.72 },
      leftAnkle: { x: 0.43, y: 0.94 },
      rightAnkle: { x: 0.57, y: 0.94 },
    },
  },
  laser_point: {
    label: "Laser Point",
    cue: "Point hard to the right while keeping a low, stable stance.",
    points: {
      head: { x: 0.46, y: 0.14 },
      leftShoulder: { x: 0.38, y: 0.3 },
      rightShoulder: { x: 0.6, y: 0.28 },
      leftElbow: { x: 0.32, y: 0.2 },
      rightElbow: { x: 0.74, y: 0.24 },
      leftWrist: { x: 0.24, y: 0.1 },
      rightWrist: { x: 0.88, y: 0.22 },
      leftHip: { x: 0.42, y: 0.52 },
      rightHip: { x: 0.56, y: 0.5 },
      leftKnee: { x: 0.38, y: 0.76 },
      rightKnee: { x: 0.58, y: 0.72 },
      leftAnkle: { x: 0.32, y: 0.94 },
      rightAnkle: { x: 0.64, y: 0.9 },
    },
  },
  shock_face: {
    label: "Shock Freeze",
    cue: "Hands near your cheeks, elbows wide, torso staying centered.",
    points: {
      head: { x: 0.5, y: 0.12 },
      leftShoulder: { x: 0.4, y: 0.28 },
      rightShoulder: { x: 0.6, y: 0.28 },
      leftElbow: { x: 0.3, y: 0.24 },
      rightElbow: { x: 0.7, y: 0.24 },
      leftWrist: { x: 0.42, y: 0.18 },
      rightWrist: { x: 0.58, y: 0.18 },
      leftHip: { x: 0.44, y: 0.5 },
      rightHip: { x: 0.56, y: 0.5 },
      leftKnee: { x: 0.45, y: 0.72 },
      rightKnee: { x: 0.55, y: 0.72 },
      leftAnkle: { x: 0.43, y: 0.94 },
      rightAnkle: { x: 0.57, y: 0.94 },
    },
  },
  winner_frame: {
    label: "Winner Frame",
    cue: "Raise both hands to frame your face and keep your spine tall.",
    points: {
      head: { x: 0.5, y: 0.12 },
      leftShoulder: { x: 0.4, y: 0.28 },
      rightShoulder: { x: 0.6, y: 0.28 },
      leftElbow: { x: 0.34, y: 0.2 },
      rightElbow: { x: 0.66, y: 0.2 },
      leftWrist: { x: 0.4, y: 0.08 },
      rightWrist: { x: 0.6, y: 0.08 },
      leftHip: { x: 0.44, y: 0.5 },
      rightHip: { x: 0.56, y: 0.5 },
      leftKnee: { x: 0.45, y: 0.72 },
      rightKnee: { x: 0.55, y: 0.72 },
      leftAnkle: { x: 0.43, y: 0.94 },
      rightAnkle: { x: 0.57, y: 0.94 },
    },
  },
  combo_drop: {
    label: "Combo Drop",
    cue: "Drop your hips, widen your base, and flare both arms.",
    points: {
      head: { x: 0.5, y: 0.14 },
      leftShoulder: { x: 0.36, y: 0.32 },
      rightShoulder: { x: 0.64, y: 0.32 },
      leftElbow: { x: 0.22, y: 0.28 },
      rightElbow: { x: 0.78, y: 0.28 },
      leftWrist: { x: 0.14, y: 0.24 },
      rightWrist: { x: 0.86, y: 0.24 },
      leftHip: { x: 0.42, y: 0.54 },
      rightHip: { x: 0.58, y: 0.54 },
      leftKnee: { x: 0.32, y: 0.76 },
      rightKnee: { x: 0.68, y: 0.76 },
      leftAnkle: { x: 0.24, y: 0.94 },
      rightAnkle: { x: 0.76, y: 0.94 },
    },
  },
  siren_twist: {
    label: "Siren Twist",
    cue: "Twist your shoulders and keep one arm lifted high.",
    points: {
      head: { x: 0.5, y: 0.12 },
      leftShoulder: { x: 0.38, y: 0.28 },
      rightShoulder: { x: 0.6, y: 0.34 },
      leftElbow: { x: 0.3, y: 0.16 },
      rightElbow: { x: 0.72, y: 0.44 },
      leftWrist: { x: 0.26, y: 0.06 },
      rightWrist: { x: 0.82, y: 0.52 },
      leftHip: { x: 0.44, y: 0.52 },
      rightHip: { x: 0.56, y: 0.48 },
      leftKnee: { x: 0.42, y: 0.74 },
      rightKnee: { x: 0.58, y: 0.72 },
      leftAnkle: { x: 0.4, y: 0.94 },
      rightAnkle: { x: 0.62, y: 0.92 },
    },
  },
  flash_cross: {
    label: "Flash Cross",
    cue: "Cross both arms over your torso and stay locked in place.",
    points: {
      head: { x: 0.5, y: 0.12 },
      leftShoulder: { x: 0.4, y: 0.28 },
      rightShoulder: { x: 0.6, y: 0.28 },
      leftElbow: { x: 0.54, y: 0.36 },
      rightElbow: { x: 0.46, y: 0.36 },
      leftWrist: { x: 0.62, y: 0.46 },
      rightWrist: { x: 0.38, y: 0.46 },
      leftHip: { x: 0.44, y: 0.52 },
      rightHip: { x: 0.56, y: 0.52 },
      leftKnee: { x: 0.45, y: 0.74 },
      rightKnee: { x: 0.55, y: 0.74 },
      leftAnkle: { x: 0.43, y: 0.94 },
      rightAnkle: { x: 0.57, y: 0.94 },
    },
  },
  boss_finish: {
    label: "Boss Finish",
    cue: "One arm high, one arm low, and your base completely locked.",
    points: {
      head: { x: 0.48, y: 0.12 },
      leftShoulder: { x: 0.36, y: 0.28 },
      rightShoulder: { x: 0.58, y: 0.3 },
      leftElbow: { x: 0.26, y: 0.16 },
      rightElbow: { x: 0.74, y: 0.44 },
      leftWrist: { x: 0.2, y: 0.06 },
      rightWrist: { x: 0.86, y: 0.56 },
      leftHip: { x: 0.42, y: 0.52 },
      rightHip: { x: 0.56, y: 0.5 },
      leftKnee: { x: 0.4, y: 0.74 },
      rightKnee: { x: 0.62, y: 0.78 },
      leftAnkle: { x: 0.36, y: 0.94 },
      rightAnkle: { x: 0.7, y: 0.94 },
    },
  },
};

export const getPoseGuide = (ruleConfig: StageRuleConfig) =>
  GUIDE_LIBRARY[ruleConfig.targetPoseKey] ?? GUIDE_LIBRARY.arms_up;
