import "./ArtefactCalculator.css";

import { useEffect, useMemo, useState } from "react";
import ArtefactSearchBar from "./ArtefactSearchBar";
import ArtefactCard from "./ArtefactCard";
import MaterialsReceipt from "./MaterialsReceipt";
import MaterialsStorage from "./MaterialsStorage";

import artefactsJson from "../data/artefacts.json";
import materialsJson from "../data/materials.json";

import type { ArtefactData, MaterialData, SelectedArtefact } from "../types/archaeology";

const STORAGE_KEY = "archaeology_calculator_material_storage";
const SELECTED_KEY = "archaeology_calculator_selected_artefacts";

export default function ArtefactCalculator() {
  const artefactData = artefactsJson as ArtefactData;
  const materialData = materialsJson as MaterialData;

  const [selected, setSelected] = useState<SelectedArtefact[]>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_KEY);
      return raw ? (JSON.parse(raw) as SelectedArtefact[]) : [];
    } catch {
      return [];
    }
  });

  const [storage, setStorage] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(SELECTED_KEY, JSON.stringify(selected));
  }, [selected]);

  function addArtefact(artefactId: string) {
    setSelected((prev) => {
      const index = prev.findIndex((x) => x.artefact_id === artefactId);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = { ...copy[index], qty: copy[index].qty + 1 };
        return copy;
      }
      return [...prev, { artefact_id: artefactId, qty: 1 }];
    });
  }

  function changeQuantity(artefactId: string, newQuantity: number) {
    const safe = Number.isFinite(newQuantity) ? Math.max(0, Math.floor(newQuantity)) : 0;

    setSelected((prev) => prev.map((x) => (x.artefact_id === artefactId ? { ...x, qty: safe } : x)));
  }

  function removeArtefact(artefactId: string) {
    setSelected((prev) => prev.filter((x) => x.artefact_id !== artefactId));
  }

  const cards = useMemo(() => {
    return selected
      .map((s) => ({
        qty: s.qty,
        artefact: artefactData.artefacts[s.artefact_id],
      }))
      .filter((x) => !!x.artefact);
  }, [selected, artefactData]);

  return (
    <div className="calculator">
      <ArtefactSearchBar
        onSelectArtefact={addArtefact}
        onClearAll={() => {
          setSelected([]);
          localStorage.removeItem(SELECTED_KEY);
        }}
      />

      <div className="calculator-body">
        <div className="calculator-cards">
          {cards.map(({ artefact, qty }) => (
            <ArtefactCard
              key={artefact.id}
              artefact={artefact}
              materials={materialData}
              qty={qty}
              onQuantityChange={(n) => changeQuantity(artefact.id, n)}
              onDelete={() => removeArtefact(artefact.id)}
            />
          ))}
        </div>
        <div className="calculator-sidebar">
          <MaterialsStorage
            material_data={materialData}
            artefact_data={artefactData}
            selected_artefacts={selected}
            storage={storage}
            onStorageChange={setStorage}
          />
          <MaterialsReceipt selected={selected} artefact_data={artefactData} material_data={materialData} storage={storage} />
        </div>
      </div>
    </div>
  );
}
