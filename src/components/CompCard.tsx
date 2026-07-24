import { Comp } from "../types/Comp";
import { Trophy } from "lucide-react";

interface CompCardProps {
  comp: Comp;
  rank: number;
  onClick: () => void;
}

export function CompCard({ comp, rank, onClick }: CompCardProps) {
  const getTierClass = (tier: string) => {
    switch (tier) {
      case "S":
        return "s";
      case "A":
        return "a";
      case "B":
        return "b";
      default:
        return "default";
    }
  };

  const getDifficultyClass = (difficulty: number) => {
    if (difficulty <= 2) return "easy";
    if (difficulty <= 4) return "medium";
    return "hard";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return "Easy";
    if (difficulty <= 4) return "Medium";
    return "Hard";
  };

  return (
    <button
      onClick={onClick}
      data-tauri-drag-region="false"
      className="comp-card"
    >
      <div className="comp-card-header">
        <div className="flex items-center gap-3">
          <div className="comp-card-rank">
            {rank}
          </div>
          <div>
            <h3 className="comp-card-title">
              {comp.name}
            </h3>
            <div className="comp-card-badges">
              <span
                className={`comp-card-tier ${getTierClass(comp.tier)}`}
              >
                {comp.tier}
              </span>
              <span
                className={`comp-card-difficulty ${getDifficultyClass(comp.difficulty)}`}
              >
                {getDifficultyLabel(comp.difficulty)}
              </span>
            </div>
          </div>
        </div>
        <Trophy className="comp-card-trophy" />
      </div>

      <div className="comp-card-traits">
        {comp.requiredTraits.slice(0, 4).map((trait) => (
          <span
            key={trait}
            className="comp-card-trait"
          >
            {trait}
          </span>
        ))}
      </div>

      <div className="comp-card-units">
        {comp.coreUnits.slice(0, 5).map((unit) => (
          <div
            key={unit}
            className="comp-card-unit"
            title={unit}
          >
            {unit.charAt(0)}
          </div>
        ))}
        {comp.coreUnits.length > 5 && (
          <div className="comp-card-units-more">
            +{comp.coreUnits.length - 5}
          </div>
        )}
      </div>
    </button>
  );
}
