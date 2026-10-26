// The company around the people: quarters (four parts of the year, rule winter_every_ticks), the
// freeze (the year's winter), the idea slots of the quarter (rule quarter_idea_slots minus the ideas
// approved in it, plus the slots carried over when policy slot_scadono_a_fine_trimestre is off), the strategic themes (texts of the policies in `themeCategory`) and the career
// ladder (fame thresholds from `promotion_*` rules, never demoted). Facts only: nothing here decides.
import type { Rule } from '../lorebase/rules.ts';
import type { EntityKind, RtRuleKey } from './world.ts';

export interface CompanyConfig {
  name: string;
  /** Rule category whose policies are the strategic themes of the quarter. */
  themeCategory: string;
  /** Career ladder, lowest first: each step above the first names the fame rule that earns it. */
  careers: Array<{ code: string; rule?: RtRuleKey }>;
  /** Career at arrival, by kind of person. */
  startCareer: Partial<Record<EntityKind, string>>;
}

export interface QuarterStats {
  proposed: number;
  submitted: number;
  approved: number;
  killed: number;
}

export interface QuarterTurn {
  /** The quarter that ended (label) and what happened in it. */
  ended: string;
  stats: QuarterStats;
  /** The quarter that began. */
  began: string;
}

const empty = (): QuarterStats => ({ proposed: 0, submitted: 0, approved: 0, killed: 0 });

/** Quarter label, e.g. Q2. Pure. */
export const quarterLabel = (q: number) => `Q${Math.min(4, Math.max(1, Math.round(q)))}`;

/** The career a person holds with this fame: the highest step reached, never below `current`. Pure. */
export function careerFor(ladder: CompanyConfig['careers'], fame: number, current: string | undefined, r: (k: RtRuleKey) => number): string {
  const at = Math.max(0, ladder.findIndex((c) => c.code === current));
  let best = at;
  ladder.forEach((c, i) => {
    if (i > best && c.rule && fame >= r(c.rule)) best = i;
  });
  return ladder[best]?.code ?? current ?? '';
}

export class Company {
  readonly cfg: CompanyConfig;
  stats: QuarterStats = empty();
  /** Approval slots carried over from earlier quarters (only when they do not expire). */
  carried = 0;
  /** Year and quarter the stats belong to (e.g. "1-Q1"). */
  private key = '';
  private label = '';

  constructor(cfg: CompanyConfig) {
    this.cfg = cfg;
  }

  /**
   * Called every tick with the world's year and quarter: returns the turn when a quarter ended. `carry`, when given,
   * is the per-quarter slot count and the unused slots of the ending quarter pass to the next one.
   */
  track(year: number, quarter: number, carry?: number): QuarterTurn | undefined {
    const key = `${year}-${quarter}`;
    const label = quarterLabel(quarter);
    if (!this.key) {
      this.key = key;
      this.label = label;
      return undefined;
    }
    if (key === this.key) return undefined;
    const turn = { ended: this.label, stats: this.stats, began: label };
    this.carried = carry === undefined ? 0 : this.slotsLeft(carry);
    this.key = key;
    this.label = label;
    this.stats = empty();
    return turn;
  }

  slotsLeft(slots: number): number {
    return Math.max(0, Math.floor(slots) + this.carried - this.stats.approved);
  }

  /** Slots of the current quarter: the policy's count plus what was carried over. */
  slotsTotal(slots: number): number {
    return Math.floor(slots) + this.carried;
  }

  themes(laws: Rule[]): string[] {
    return laws.filter((r) => r.category === this.cfg.themeCategory).map((r) => r.text);
  }

  startCareer(kind: EntityKind): string {
    return this.cfg.startCareer[kind] ?? this.cfg.careers[0]?.code ?? '';
  }
}
