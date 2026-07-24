export interface Comp {
  name: string;
  tier: "S" | "A" | "B";
  coreUnits: string[];
  carry: string;
  tank: string;
  requiredTraits: string[];
  optionalTraits: string[];
  emblemHolders: {
    trait: string;
    holder: string;
  }[];
  difficulty: number;
}
