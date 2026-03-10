import { getPoseTarget } from "@/features/play/poseTargets";
import type { ResultTier, StageRuleConfig } from "@/features/meme/types";

type Point = {
  x: number;
  y: number;
  visibility?: number;
};

type LandmarkMap = Record<string, Point | undefined>;

const distance = (a: Point, b: Point) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const calculateAngle = (a: Point, b: Point, c: Point) => {
  const angleRadians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);
  const angleDegrees = Math.abs((angleRadians * 180) / Math.PI);
  return angleDegrees > 180 ? 360 - angleDegrees : angleDegrees;
};

export const LANDMARK_INDICES = {
  nose: 0,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
} as const;

export const toLandmarkMap = (
  landmarks: { x: number; y: number; visibility?: number }[] | undefined,
) => {
  if (!landmarks) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(LANDMARK_INDICES).map(([key, index]) => [
      key,
      landmarks[index],
    ]),
  ) as LandmarkMap;
};

const normalizeJointScores = (
  landmarkMap: LandmarkMap,
  ruleConfig: StageRuleConfig,
) => {
  const poseTarget = getPoseTarget(ruleConfig);
  const weights = ruleConfig.weights;
  let weightedScore = 0;
  let totalWeight = 0;

  const jointResolvers: Record<string, () => number | null> = {
    leftShoulder: () => {
      const leftHip = landmarkMap.leftHip;
      const leftShoulder = landmarkMap.leftShoulder;
      const leftElbow = landmarkMap.leftElbow;
      if (!leftHip || !leftShoulder || !leftElbow) return null;
      return calculateAngle(leftHip, leftShoulder, leftElbow);
    },
    rightShoulder: () => {
      const rightHip = landmarkMap.rightHip;
      const rightShoulder = landmarkMap.rightShoulder;
      const rightElbow = landmarkMap.rightElbow;
      if (!rightHip || !rightShoulder || !rightElbow) return null;
      return calculateAngle(rightHip, rightShoulder, rightElbow);
    },
    leftElbow: () => {
      const leftShoulder = landmarkMap.leftShoulder;
      const leftElbow = landmarkMap.leftElbow;
      const leftWrist = landmarkMap.leftWrist;
      if (!leftShoulder || !leftElbow || !leftWrist) return null;
      return calculateAngle(leftShoulder, leftElbow, leftWrist);
    },
    rightElbow: () => {
      const rightShoulder = landmarkMap.rightShoulder;
      const rightElbow = landmarkMap.rightElbow;
      const rightWrist = landmarkMap.rightWrist;
      if (!rightShoulder || !rightElbow || !rightWrist) return null;
      return calculateAngle(rightShoulder, rightElbow, rightWrist);
    },
    leftHip: () => {
      const leftShoulder = landmarkMap.leftShoulder;
      const leftHip = landmarkMap.leftHip;
      const leftKnee = landmarkMap.leftKnee;
      if (!leftShoulder || !leftHip || !leftKnee) return null;
      return calculateAngle(leftShoulder, leftHip, leftKnee);
    },
    rightHip: () => {
      const rightShoulder = landmarkMap.rightShoulder;
      const rightHip = landmarkMap.rightHip;
      const rightKnee = landmarkMap.rightKnee;
      if (!rightShoulder || !rightHip || !rightKnee) return null;
      return calculateAngle(rightShoulder, rightHip, rightKnee);
    },
    leftKnee: () => {
      const leftHip = landmarkMap.leftHip;
      const leftKnee = landmarkMap.leftKnee;
      const leftAnkle = landmarkMap.leftAnkle;
      if (!leftHip || !leftKnee || !leftAnkle) return null;
      return calculateAngle(leftHip, leftKnee, leftAnkle);
    },
    rightKnee: () => {
      const rightHip = landmarkMap.rightHip;
      const rightKnee = landmarkMap.rightKnee;
      const rightAnkle = landmarkMap.rightAnkle;
      if (!rightHip || !rightKnee || !rightAnkle) return null;
      return calculateAngle(rightHip, rightKnee, rightAnkle);
    },
  };

  for (const [jointName, target] of Object.entries(poseTarget.joints)) {
    const actual = jointResolvers[jointName]?.();
    if (actual == null) continue;

    const normalizedDifference = Math.min(
      Math.abs(actual - target.angle) / target.tolerance,
      1,
    );
    const score = (1 - normalizedDifference) * 100;
    const weight = weights[target.weightKey] ?? 0;
    weightedScore += score * weight;
    totalWeight += weight;
  }

  const leftShoulder = landmarkMap.leftShoulder;
  const rightShoulder = landmarkMap.rightShoulder;
  const leftHip = landmarkMap.leftHip;
  const rightHip = landmarkMap.rightHip;

  let centerScore = 0;
  if (leftShoulder && rightShoulder && leftHip && rightHip) {
    const shoulderWidth = distance(leftShoulder, rightShoulder);
    const shoulderCenter = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const hipCenter = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };
    const centerDelta = Math.min(
      distance(shoulderCenter, hipCenter) / Math.max(shoulderWidth, 0.0001),
      1,
    );
    const hipLevelDelta = Math.min(
      Math.abs(leftHip.y - rightHip.y) / poseTarget.hipLevelTolerance,
      1,
    );
    centerScore =
      ((1 - centerDelta) * 70 + (1 - hipLevelDelta) * 30) * 1;
    weightedScore += centerScore * poseTarget.centerWeight;
    totalWeight += poseTarget.centerWeight;
  }

  return {
    score: totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0,
    centerScore: Math.round(centerScore),
  };
};

export const getResultTier = (score: number): ResultTier => {
  if (score >= 90) return "perfect";
  if (score >= 75) return "success";
  if (score >= 60) return "close";
  return "fail";
};

export const scorePose = (
  landmarks: { x: number; y: number; visibility?: number }[] | undefined,
  ruleConfig: StageRuleConfig,
) => {
  const landmarkMap = toLandmarkMap(landmarks);
  if (!landmarkMap) {
    return {
      score: 0,
      tier: "fail" as ResultTier,
      breakdown: {
        overall: 0,
        center: 0,
      },
    };
  }

  const { score, centerScore } = normalizeJointScores(landmarkMap, ruleConfig);
  return {
    score,
    tier: getResultTier(score),
    breakdown: {
      overall: score,
      center: centerScore,
    },
  };
};
