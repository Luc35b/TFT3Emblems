import { Comp } from "../types/Comp";

export function scoreComp(comp: Comp, selectedTraits: string[]): number {
  let score = 0;

  // Score based on required traits
  const matchedRequired = comp.requiredTraits.filter(trait =>
    selectedTraits.includes(trait)
  ).length;
  score += matchedRequired * 20;

  // Score based on optional traits
  const matchedOptional = comp.optionalTraits.filter(trait =>
    selectedTraits.includes(trait)
  ).length;
  score += matchedOptional * 10;

  // Score based on tier
  if (comp.tier === "S") {
    score += 15;
  } else if (comp.tier === "A") {
    score += 5;
  }

  // Penalize if no required traits match
  if (matchedRequired === 0) {
    score -= 30;
  }

  // Bonus for multiple emblem holders that match selected traits
  const matchedEmblemHolders = comp.emblemHolders.filter(holder =>
    selectedTraits.includes(holder.trait)
  ).length;
  score += matchedEmblemHolders * 5;

  return score;
}
