import "./SearchResultItem.css";
import Icon from "./Icon";
import Tooltip from "./Tooltip";
import collectorsJson from "../data/collectors.json";
import type { Artefact, ArtefactData, Collection, CollectorData } from "../types/archaeology";

type Props =
  | {
      kind: "artefact";
      artefact: Artefact;
      onSelect: () => void;
    }
  | {
      kind: "collection";
      collection: Collection;
      artefact_data: ArtefactData;
      onSelect: () => void;
    };

function getCollectorInfo(collectorId: string) {
  const data = collectorsJson as CollectorData;
  const collector = data.collectors?.[collectorId];

  if (!collector) {
    return { name: collectorId, location: "" };
  }

  return { name: collector.name, location: collector.location };
}

export default function SearchResultItem(props: Props) {
  return (
    <button
      className="option"
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        props.onSelect();
      }}
    >
      {props.kind === "artefact" ? (
        <div className="option-row">
          <div className="option-artefact">
            <Icon icon_type="artefacts" id={props.artefact.id} box={false} />
            <span className="option-name">{props.artefact.name}</span>
          </div>

          <div className="option-materials">
            {Object.values(props.artefact.materials_required).map((material) => {
              return (
                <Tooltip key={`${props.artefact.id}-${material.material_id}`} content={<div>{props.artefact.name}</div>}>
                  <Icon icon_type={"materials"} id={material.material_id} />
                </Tooltip>
              );
            })}
          </div>

          <span className="option-level">
            <Icon icon_type="skills" id="archaeology" box={false} />
            {props.artefact.level}
          </span>
        </div>
      ) : (
        (() => {
          const { name: collectorName, location: collectorLocation } = getCollectorInfo(props.collection.collector_id);

          const artefacts = props.collection.artefacts_required.map((id) => props.artefact_data.artefacts[id]).filter((a): a is Artefact => !!a);

          const shownArtefacts = artefacts.slice(0, 15);
          const hiddenCount = Math.max(0, artefacts.length - shownArtefacts.length);

          return (
            <div className="option-row">
              <div className="option-collection">
                <div className="option-collection-icon">
                  <Tooltip content={<div>{collectorName}</div>}>
                    <Icon icon_type="collectors" id={props.collection.collector_id} />
                  </Tooltip>
                </div>

                <div className="option-collection-text">
                  <span className="option-name">{props.collection.name}</span>

                  <span className="option-collection-sub">
                    {props.collection.chronote_reward.toLocaleString()} chronotes •{collectorLocation ? ` ${collectorLocation}` : ""}
                  </span>
                </div>
              </div>

              <div className="option-materials">
                {shownArtefacts.map((a) => (
                  <Tooltip key={`${props.collection.id}-${a.id}`} content={<div>{a.name}</div>}>
                    <Icon icon_type="artefacts" id={a.id} />
                  </Tooltip>
                ))}

                {hiddenCount > 0 && <span className="option-more">+{hiddenCount}</span>}
              </div>

              <span className="option-level">
                <Icon icon_type="skills" id="archaeology" box={false} />
                {props.collection.level}
              </span>
            </div>
          );
        })()
      )}
    </button>
  );
}
