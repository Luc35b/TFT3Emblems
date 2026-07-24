import { Check } from "lucide-react";

interface EmblemButtonProps {
  trait: string;
  image?: string;
  isSelected: boolean;
  onClick: () => void;
}

export function EmblemButton({ trait, image, isSelected, onClick }: EmblemButtonProps) {
  return (
    <button
      onClick={onClick}
      data-tauri-drag-region="false"
      className={`emblem-button ${isSelected ? "selected" : "unselected"}`}
    >
      {image ? (
        <img src={image} alt={trait} className="emblem-button-image" />
      ) : (
        <span className="emblem-button-label">{trait}</span>
      )}
      <Check className={`emblem-button-check ${isSelected ? "" : "hidden"}`} />
    </button>
  );
}
