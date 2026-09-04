import type { HarnessStage } from "../domain/types";
import { stageLabel, stageOrder } from "../domain/state-machine";

export type GuidedDemoProgress = {
  current: number;
  total: number;
  percent: number;
  stageLabel: string;
  complete: boolean;
};

export function getGuidedDemoProgress(stage: HarnessStage): GuidedDemoProgress {
  const index = stageOrder.indexOf(stage);
  if (index < 0) throw new Error(`Unknown guided-demo stage: ${stage}`);
  const current = index + 1;
  const total = stageOrder.length;
  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
    stageLabel: stageLabel[stage],
    complete: stage === "READY_FOR_PRODUCTION",
  };
}
