import "./CollectionCard.css";
import type { Artefact, ArtefactData, MaterialData, Collection, CollectorData } from "../types/archaeology";
import collectorsJson from "../data/collectors.json";
import NumericInput from "./NumericInput";
import Icon from "./Icon";
import Tooltip from "./Tooltip";

type Props = {
  collection: Collection;
  artefact_data: ArtefactData;
  materials: MaterialData;

  qty: number;
  onQuantityChange: (new_qty: number) => void;
  onDelete: () => void;
  onCraft: () => void;
};

function computeCollectionMaterials(artefact_data: ArtefactData, artefactIds: string[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const artefactId of artefactIds) {
    const artefact = artefact_data.artefacts[artefactId];
    if (!artefact) continue;

    for (const req of artefact.materials_required) {
      totals[req.material_id] = (totals[req.material_id] ?? 0) + req.qty;
    }
  }

  return totals;
}

function getCollectorInfo(collectorId: string) {
  const data = collectorsJson as CollectorData;
  const collector = data.collectors?.[collectorId];

  if (!collector) {
    return { name: collectorId, location: "" };
  }

  return { name: collector.name, location: collector.location };
}

export default function CollectionCard({ collection, artefact_data, materials, qty, onQuantityChange, onDelete, onCraft }: Props) {
  const materialTotals = computeCollectionMaterials(artefact_data, collection.artefacts_required);
  const { name: collectorName, location: collectorLocation } = getCollectorInfo(collection.collector_id);

  const artefacts: Artefact[] = collection.artefacts_required.map((id) => artefact_data.artefacts[id]).filter((a): a is Artefact => !!a);

  return (
    <div className="card collection-card">
      <div className="card-header">
        <div className="card-header-left">
          <div className="collection-badge">
            <Tooltip content={<div>{collectorName}</div>}>
              <Icon icon_type="collectors" id={collection.collector_id} />
            </Tooltip>
          </div>
          <div className="card-title">
            <div className="card-name">{collection.name}</div>
            <div className="card-meta">
              Lvl. {collection.level} • {collection.chronote_reward.toLocaleString()} chronotes • {collectorLocation}
            </div>
          </div>
        </div>

        <div className="card-actions">
          <div className="card-quantity">
            <label className="card-quantity-label" htmlFor={`qty-collection-${collection.id}`}>
              Quantity
            </label>

            <NumericInput id={`qty-collection-${collection.id}`} min={1} value={qty} onChange={onQuantityChange} />
          </div>

          <div className="card-utility-actions">
            <button className="card-icon-button" type="button" onClick={onCraft} title="Craft One Collection">
              <Icon icon_type="utility" id="craft" box={false} extension="svg" />
            </button>
            <button className="card-icon-button" type="button" onClick={onDelete} title="Delete Collection">
              <Icon icon_type="utility" id="remove" box={false} extension="svg" />
            </button>
          </div>
        </div>
      </div>

      <div className="collection-artefact-icons">
        {artefacts.map((a) => (
          <Tooltip key={a.id} content={<div>{a.name}</div>}>
            <span className="collection-artefact-icon">
              <Icon icon_type="artefacts" id={a.id} />
            </span>
          </Tooltip>
        ))}
      </div>

      <div className="card-section-title">Material Requirements:</div>
      <ul className="card-materials">
        {Object.entries(materialTotals).map(([materialId, amount]) => {
          const material = materials.materials[materialId];
          const materialName = material ? material.name : materialId;

          return (
            <li key={materialId} className="card-material-row">
              <div className="card-material-row-left">
                <Icon icon_type="materials" id={materialId} box={false} />
                <span className="card-material-name">{materialName}</span>
              </div>
              <span className="card-material-quantity">{amount}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
