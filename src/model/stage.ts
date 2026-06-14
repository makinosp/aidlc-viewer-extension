type StageKeys = keyof typeof stages;
export type Stage = typeof stages[StageKeys];

const stages = {
  inception: 'inception',
  construction: 'construction',
  operations: 'operations',
  unknown: 'unknown',
} as const satisfies Record<string, string>;

export function detectStageFromPath(filePath: string): Omit<Stage, 'unknown'> | undefined {
  const normalized = filePath.toLowerCase();
  if (normalized.includes(`/${stages.operations}/`)) {
    return stages.operations;
  }
  if (normalized.includes(`/${stages.construction}/`)) {
    return stages.construction;
  }
  if (normalized.includes(`/${stages.inception}/`)) {
    return stages.inception;
  }
  return undefined;
}

export function inferStageFromCounts(counts: Record<StageKeys, number>): Stage {
  if (counts.operations > 0) {
    return stages.operations;
  }
  if (counts.construction > 0) {
    return stages.construction;
  }
  if (counts.inception > 0) {
    return stages.inception;
  }
  return stages.unknown;
}
