import artefactData from "../data/artefacts.json";
import materialData from "../data/materials.json";
import collectionData from "../data/collections.json";
import collectorData from "../data/collectors.json";
import mysteryData from "../data/mysteries.json";

import { getMaterial } from "../utils/materialUtils";
import { getArtefact } from "../utils/artefactUtils";

import Icon from "./Icon";
import Tooltip from "./Tooltip";

export default function ArtefactList() {
  return (
    <div>
      <div>
        <h2>Materials:</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
          {Object.values(materialData.materials).map((material) => {
            return (
              <li
                key={material.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                <Tooltip content={<div>{material.name}</div>}>
                  <Icon icon_type="materials" id={material.id} />
                </Tooltip>

                <span style={{ fontFamily: "monospace", minWidth: "5ch" }}>Lvl. {material.level}</span>

                <strong>{material.name}</strong>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2>Artefacts:</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
          {Object.values(artefactData.artefacts).map((artefact) => {
            return (
              <li
                key={artefact.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                <Tooltip content={<div>{artefact.name}</div>}>
                  <Icon icon_type="artefacts" id={artefact.id} />
                </Tooltip>

                <span style={{ fontFamily: "monospace", minWidth: "5ch" }}>Lvl. {artefact.level}</span>
                <strong>{artefact.name}</strong>
                <span> - </span>

                {Object.values(artefact.materials_required).map((requirement) => {
                  const material = getMaterial(requirement.material_id);
                  return (
                    <Tooltip
                      key={`${artefact.id}-${requirement.material_id}`}
                      content={<div>{`${requirement.qty}x ${material?.name ?? requirement.material_id}`}</div>}
                    >
                      <Icon icon_type="materials" id={requirement.material_id} />
                    </Tooltip>
                  );
                })}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2>Collections:</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
          {Object.values(collectionData.collections).map((collection) => {
            return (
              <li
                key={collection.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                <span style={{ fontFamily: "monospace", minWidth: "5ch" }}>Lvl. {collection.level}</span>
                <strong>{collection.name}</strong>
                <span> - </span>

                {Object.values(collection.artefacts_required).map((requirement) => {
                  const artefact = getArtefact(requirement);
                  return (
                    <Tooltip key={artefact.id} content={<div>{artefact.name}</div>}>
                      <Icon icon_type="artefacts" id={artefact.id} />
                    </Tooltip>
                  );
                })}
                <span> {collection.artefacts_required.length} Total Artefacts</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2>Collectors:</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
          {Object.values(collectorData.collectors).map((collector) => {
            return (
              <li
                key={collector.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                <Tooltip content={<div>{collector.name}</div>}>
                  <Icon icon_type="collectors" id={collector.id} />
                </Tooltip>

                <strong>{collector.name}</strong>
                <span style={{ fontFamily: "monospace", minWidth: "5ch" }}> - {collector.location}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h2>Mysteries:</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, textAlign: "left" }}>
          {Object.values(mysteryData.mysteries).map((mystery) => {
            return (
              <li
                key={mystery.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "4px 0",
                }}
              >
                <Tooltip content={<div>{mystery.alignment}</div>}>
                  <Icon icon_type="mysteries" id={mystery.alignment} />
                </Tooltip>

                <strong>{mystery.name}</strong>
                <span style={{ fontFamily: "monospace", minWidth: "5ch" }}> - {mystery.dig_site} Dig Site</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
