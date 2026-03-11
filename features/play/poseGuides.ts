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

const MEME_GUIDE_VARIANTS: Record<
  string,
  | { label: string; cue: string; baseKey: keyof typeof GUIDE_LIBRARY }
  | PoseGuideDefinition
> = {
  success_kid_fist_pump: {
    label: "Success Kid",
    cue: "Clench one fist near your chest and lift the other arm in a tiny victory burst.",
    points: {
      head: { x: 0.54, y: 0.12 },
      leftShoulder: { x: 0.42, y: 0.30 },
      rightShoulder: { x: 0.63, y: 0.31 },
      leftElbow: { x: 0.36, y: 0.48 },
      rightElbow: { x: 0.69, y: 0.45 },
      leftWrist: { x: 0.34, y: 0.67 },
      rightWrist: { x: 0.58, y: 0.49 },
      leftHip: { x: 0.46, y: 0.54 },
      rightHip: { x: 0.60, y: 0.56 },
      leftKnee: { x: 0.46, y: 0.75 },
      rightKnee: { x: 0.60, y: 0.77 },
      leftAnkle: { x: 0.44, y: 0.94 },
      rightAnkle: { x: 0.60, y: 0.95 },
    },
  },
  doge_wow_lean: {
    label: "Doge",
    cue: "Lean sideways with one arm stretched out like you just spotted something amazing.",
    points: {
      head: { x: 0.50, y: 0.12 },
      leftShoulder: { x: 0.43, y: 0.31 },
      rightShoulder: { x: 0.59, y: 0.33 },
      leftElbow: { x: 0.39, y: 0.46 },
      rightElbow: { x: 0.63, y: 0.45 },
      leftWrist: { x: 0.45, y: 0.51 },
      rightWrist: { x: 0.57, y: 0.49 },
      leftHip: { x: 0.46, y: 0.55 },
      rightHip: { x: 0.57, y: 0.57 },
      leftKnee: { x: 0.47, y: 0.75 },
      rightKnee: { x: 0.57, y: 0.76 },
      leftAnkle: { x: 0.46, y: 0.94 },
      rightAnkle: { x: 0.58, y: 0.95 },
    },
  },
  surprised_pikachu_gasp: {
    label: "Surprised Pikachu",
    cue: "Bring both hands up near your cheeks and freeze in a shocked reaction.",
    points: {
      head: { x: 0.50, y: 0.12 },
      leftShoulder: { x: 0.40, y: 0.31 },
      rightShoulder: { x: 0.60, y: 0.31 },
      leftElbow: { x: 0.33, y: 0.39 },
      rightElbow: { x: 0.67, y: 0.39 },
      leftWrist: { x: 0.42, y: 0.22 },
      rightWrist: { x: 0.58, y: 0.22 },
      leftHip: { x: 0.45, y: 0.55 },
      rightHip: { x: 0.55, y: 0.55 },
      leftKnee: { x: 0.45, y: 0.75 },
      rightKnee: { x: 0.55, y: 0.75 },
      leftAnkle: { x: 0.44, y: 0.94 },
      rightAnkle: { x: 0.56, y: 0.94 },
    },
  },
  roll_safe_tap_temple: {
    label: "Roll Safe",
    cue: "Angle your torso and point one arm outward like you just had a suspiciously smart idea.",
    points: {
      head: { x: 0.50, y: 0.12 },
      leftShoulder: { x: 0.39, y: 0.30 },
      rightShoulder: { x: 0.60, y: 0.28 },
      leftElbow: { x: 0.33, y: 0.24 },
      rightElbow: { x: 0.70, y: 0.44 },
      leftWrist: { x: 0.37, y: 0.12 },
      rightWrist: { x: 0.74, y: 0.58 },
      leftHip: { x: 0.43, y: 0.52 },
      rightHip: { x: 0.56, y: 0.50 },
      leftKnee: { x: 0.42, y: 0.74 },
      rightKnee: { x: 0.58, y: 0.74 },
      leftAnkle: { x: 0.40, y: 0.94 },
      rightAnkle: { x: 0.60, y: 0.94 },
    },
  },
  one_does_not_simply_warning: {
    label: "One Does Not Simply",
    cue: "Lift both arms into a guarded, dramatic warning pose and stay centered.",
    points: {
      head: { x: 0.50, y: 0.12 },
      leftShoulder: { x: 0.40, y: 0.29 },
      rightShoulder: { x: 0.61, y: 0.29 },
      leftElbow: { x: 0.35, y: 0.27 },
      rightElbow: { x: 0.69, y: 0.41 },
      leftWrist: { x: 0.41, y: 0.22 },
      rightWrist: { x: 0.73, y: 0.56 },
      leftHip: { x: 0.44, y: 0.52 },
      rightHip: { x: 0.56, y: 0.52 },
      leftKnee: { x: 0.45, y: 0.74 },
      rightKnee: { x: 0.55, y: 0.74 },
      leftAnkle: { x: 0.43, y: 0.94 },
      rightAnkle: { x: 0.57, y: 0.94 },
    },
  },
  deal_with_it_shades_drop: {
    label: "Deal With It",
    cue: "Raise both hands around your face like the sunglasses are dropping into place.",
    baseKey: "winner_frame",
  },
  distracted_boyfriend_turn: {
    label: "Distracted Boyfriend",
    cue: "Twist your shoulders and throw one arm out as if your attention snapped to the side.",
    baseKey: "side_pop_left",
  },
  woman_yelling_cat_table_drama: {
    label: "Woman Yelling at Cat",
    cue: "Cross your arms in front of your body and hold a tense, confrontational stance.",
    baseKey: "flash_cross",
  },
  this_is_fine_composed_pose: {
    label: "This Is Fine",
    cue: "Keep your posture compact and calm, framing your upper body like nothing is wrong.",
    baseKey: "winner_frame",
  },
  expanding_brain_unlock: {
    label: "Expanding Brain",
    cue: "Throw both arms up and open your chest like your brain just leveled up.",
    baseKey: "arms_up",
  },
  disaster_girl_glance: {
    label: "Disaster Girl",
    cue: "Stand tall with one arm angled up and the other relaxed like you own the chaos behind you.",
    baseKey: "boss_finish",
  },
  harold_polite_pain: {
    label: "Hide the Pain Harold",
    cue: "Frame your face neatly with a restrained upper body, like a polite smile hiding discomfort.",
    baseKey: "winner_frame",
  },
  mocking_spongebob_slouch: {
    label: "Mocking SpongeBob",
    cue: "Bend inward and cross your arms in a sarcastic, exaggerated copycat pose.",
    baseKey: "flash_cross",
  },
  pepe_sly_twist: {
    label: "Pepe the Frog",
    cue: "Twist your torso with one side lifted and keep the pose loose, smug, and slightly off-center.",
    baseKey: "siren_twist",
  },
  grumpy_cat_compact: {
    label: "Grumpy Cat",
    cue: "Keep your arms close, body centered, and posture tight like you want the moment to end immediately.",
    baseKey: "crown_lock",
  },
  keyboard_cat_drop: {
    label: "Keyboard Cat",
    cue: "Drop low with a wide base and spread your arms like you are about to hammer out a dramatic solo.",
    baseKey: "combo_drop",
  },
  nyan_cat_launch: {
    label: "Nyan Cat",
    cue: "Lower into a playful wide stance and keep both arms flared like rainbow energy is blasting outward.",
    baseKey: "combo_drop",
  },
  picard_facepalm_react: {
    label: "Picard Facepalm",
    cue: "Bring both hands up toward your face and freeze in a full-body exasperation reaction.",
    baseKey: "shock_face",
  },
  rickroll_showman: {
    label: "Rickroll",
    cue: "Open your torso, turn slightly, and hold a shameless performer pose with one arm leading the frame.",
    baseKey: "siren_twist",
  },
  trollface_victory: {
    label: "Trollface",
    cue: "Lock one arm high, one arm low, and plant your stance like you just got away with everything.",
    baseKey: "boss_finish",
  },
};

export const getPoseGuide = (ruleConfig: StageRuleConfig) => {
  const variant = MEME_GUIDE_VARIANTS[ruleConfig.targetPoseKey];
  if (variant) {
    if ("points" in variant) {
      return variant;
    }
    return {
      ...GUIDE_LIBRARY[variant.baseKey],
      label: variant.label,
      cue: variant.cue,
    };
  }

  return GUIDE_LIBRARY[ruleConfig.targetPoseKey] ?? GUIDE_LIBRARY.arms_up;
};
