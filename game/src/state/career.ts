import { config } from '../config';

export type CareerLevel = 'junior' | 'senior' | 'principal' | 'fellow';

/** Career level from reputation (0-1); thresholds live in config. */
export function careerLevel(esteem: number | undefined): CareerLevel {
  const e = esteem ?? 0;
  for (const l of config.career.levels) if (e >= l.min) return l.level;
  return 'junior';
}

/** 1 (junior) .. 4 (fellow): number of chevrons on the map badge. */
export function careerStep(level: CareerLevel): number {
  return ['junior', 'senior', 'principal', 'fellow'].indexOf(level) + 1;
}
