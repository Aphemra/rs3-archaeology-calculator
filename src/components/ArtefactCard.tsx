import "./ArtefactCard.css";
import type { Artefact, MaterialData } from "../types/archaeology";
import Icon from "./Icon";
import NumericInput from "./NumericInput";

type Props = {
  artefact: Artefact;
  materials: MaterialData;
  qty: number;
  onQuantityChange: (new_qty: number) => void;
  onDelete: () => void;
};

export default function ArtefactCard({ artefact, materials, qty, onQuantityChange, onDelete }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <Icon icon_type="artefacts" id={artefact.id} box={false} />
          <div className="card-title">
            <div className="card-name">{artefact.name}</div>
            <div className="card-meta">Lvl. {artefact.level}</div>
          </div>
        </div>
        <div className="card-actions">
          <div className="card-quantity">
            <label className="card-quantity-label" htmlFor={`qty-${artefact.id}`}>
              Quantity
            </label>

            <NumericInput id={`qty-${artefact.id}`} min={1} value={qty} onChange={onQuantityChange} />
          </div>

          <button className="card-delete" type="button" onClick={onDelete}>
            Remove
          </button>
        </div>
      </div>
      <div className="card-section-title">Material Requirements:</div>
      <ul className="card-materials">
        {artefact.materials_required.map((requirement) => {
          const material = materials.materials[requirement.material_id];
          const materialName = material ? material.name : requirement.material_id;

          return (
            <li key={requirement.material_id} className="card-material-row">
              <div className="card-material-row-left">
                <Icon icon_type="materials" id={requirement.material_id} box={false} />
                <span className="card-material-name">{materialName}</span>
              </div>
              <span className="card-material-quantity">{requirement.qty}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
