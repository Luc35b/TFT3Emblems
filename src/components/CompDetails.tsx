import { Comp } from "../types/Comp";
import { ArrowLeft } from "lucide-react";

interface CompDetailsProps {
  comp: Comp;
  onBack: () => void;
}

export function CompDetails({ comp, onBack }: CompDetailsProps) {
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

  return (
    <div className="comp-details">
      <button
        onClick={onBack}
        data-tauri-drag-region="false"
        className="comp-details-back"
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>

      <div className="comp-details-header">
        <div>
          <h2 className="comp-details-title">{comp.name}</h2>
          <div className="comp-details-badges">
            <span
              className={`comp-details-tier ${getTierClass(comp.tier)}`}
            >
              {comp.tier} Tier
            </span>
            <span className={`comp-details-difficulty ${getDifficultyClass(comp.difficulty)}`}>
              Difficulty: {comp.difficulty}/5
            </span>
          </div>
        </div>
      </div>

      <div className="comp-details-stats">
        <div className="comp-details-stat">
          <h3 className="comp-details-stat-label">Carry</h3>
          <p className="comp-details-stat-value">{comp.carry}</p>
        </div>
        <div className="comp-details-stat">
          <h3 className="comp-details-stat-label">Tank</h3>
          <p className="comp-details-stat-value">{comp.tank}</p>
        </div>
      </div>

      <div className="comp-details-section">
        <h3 className="comp-details-section-title">Core Units</h3>
        <div className="comp-details-tags">
          {comp.coreUnits.map((unit) => (
            <span
              key={unit}
              className="comp-details-tag"
            >
              {unit}
            </span>
          ))}
        </div>
      </div>

      <div className="comp-details-section">
        <h3 className="comp-details-section-title">
          Required Traits
        </h3>
        <div className="comp-details-tags">
          {comp.requiredTraits.map((trait) => (
            <span
              key={trait}
              className="comp-details-tag blue"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div className="comp-details-section">
        <h3 className="comp-details-section-title">
          Optional Traits
        </h3>
        <div className="comp-details-tags">
          {comp.optionalTraits.map((trait) => (
            <span
              key={trait}
              className="comp-details-tag gray"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="comp-details-section-title">
          Emblem Holders
        </h3>
        <div className="comp-details-holders">
          {comp.emblemHolders.map((holder, index) => (
            <div
              key={index}
              className="comp-details-holder"
            >
              <span className="comp-details-holder-trait">{holder.trait}</span>
              <span className="comp-details-holder-arrow">→</span>
              <span className="comp-details-holder-name">{holder.holder}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
