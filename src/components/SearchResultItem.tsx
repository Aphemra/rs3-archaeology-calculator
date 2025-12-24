import "./SearchResultItem.css";
import Icon from "./Icon";
import Tooltip from "./Tooltip";
import type { Artefact } from "../types/archaeology";

type Props = {
  artefact: Artefact;
  onSelect: () => void;
};

export default function SearchResultItem({ artefact, onSelect }: Props) {
  return (
    <button
      className="option"
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
    >
      <div className="option-row">
        <div className="option-artefact">
          <Icon icon_type="artefacts" id={artefact.id} box={false} />
          <span className="option-name">{artefact.name}</span>
        </div>
        <div className="option-materials">
          {Object.values(artefact.materials_required).map((material) => {
            return (
              <Tooltip key={`${artefact.id}-${material.material_id}`} content={<div>{artefact.name}</div>}>
                <Icon icon_type={"materials"} id={material.material_id} />
              </Tooltip>
            );
          })}
        </div>
        <span className="option-level">
          <Icon icon_type="skills" id="archaeology" box={false} />
          {artefact.level}
        </span>
      </div>
    </button>
  );
}
