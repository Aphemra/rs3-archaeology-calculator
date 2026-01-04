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
  onCraft: () => void;
};

export default function ArtefactCard({ artefact, materials, qty, onQuantityChange, onDelete, onCraft }: Props) {
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

          <div className="card-utility-actions">
            <button className="card-icon-button" type="button" onClick={onCraft} title="Craft One">
              <Icon icon_type="utility" id="craft" box={false} extension="svg" />
            </button>
            <button className="card-icon-button" type="button" onClick={onDelete} title="Delete Artefact">
              <Icon icon_type="utility" id="remove" box={false} extension="svg" />
            </button>
          </div>
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
