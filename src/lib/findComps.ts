import { Comp } from "../types/Comp";
import { scoreComp } from "./scoreComp";

export function findComps(comps: Comp[], selectedTraits: string[]): Comp[] {
  // Score all compositions
  const scoredComps = comps.map(comp => ({
    comp,
    score: scoreComp(comp, selectedTraits)
  }));

  // Sort by score descending
  scoredComps.sort((a, b) => b.score - a.score);

  // Return only compositions with positive scores
  return scoredComps
    .filter(item => item.score > 0)
    .map(item => item.comp);
}
