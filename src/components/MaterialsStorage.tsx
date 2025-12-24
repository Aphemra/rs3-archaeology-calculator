import { useEffect, useMemo, useRef, useState } from "react";
import "./MaterialsStorage.css";
import Icon from "./Icon";
import NumericInput from "./NumericInput";
import type { MaterialData, SelectedArtefact, ArtefactData } from "../types/archaeology";

import { clampNumber } from "../utils/helperUtils";

type Props = {
  material_data: MaterialData;
  storage: Record<string, number>;
  onStorageChange: (next: Record<string, number>) => void;

  selected_artefacts: SelectedArtefact[];
  artefact_data: ArtefactData;
};

const STORAGE_KEY = "archaeology_calculator_material_storage";
const STORAGE_OPEN_KEY = "archaeology_calculator_material_storage_open";
const STEP_KEY = "archaeology_calculator_material_step_value";
const SHOW_ALL_KEY = "archaeology_calculator_material_show_all";

export default function MaterialsStorage({ material_data, storage, onStorageChange, selected_artefacts, artefact_data }: Props) {
  const materials = useMemo(() => Object.values(material_data.materials), [material_data]);

  const [showAll, setShowAll] = useState<boolean>(() => {
    const raw = localStorage.getItem(SHOW_ALL_KEY);
    return raw ? raw === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(SHOW_ALL_KEY, String(showAll));
  }, [showAll]);

  const relevantMaterialIds = useMemo(() => {
    const ids = new Set<string>();

    for (const selection of selected_artefacts) {
      const artefact = artefact_data.artefacts[selection.artefact_id];
      if (!artefact) continue;

      for (const requirement of artefact.materials_required) {
        ids.add(requirement.material_id);
      }
    }
    return ids;
  }, [selected_artefacts, artefact_data]);

  const [stepX, setStepX] = useState<number>(() => {
    const raw = localStorage.getItem(STEP_KEY);
    const parsed = raw ? Number(raw) : 100;
    return clampNumber(parsed || 100);
  });

  useEffect(() => {
    localStorage.setItem(STEP_KEY, String(stepX));
  }, [stepX]);

  const [open, setOpen] = useState<boolean>(() => {
    const raw = localStorage.getItem(STORAGE_OPEN_KEY);
    return raw ? raw === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_OPEN_KEY, String(open));
  }, [open]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editingId) {
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [editingId]);

  const baseList = useMemo(() => {
    if (showAll) return materials;
    return materials.filter((material) => relevantMaterialIds.has(material.id));
  }, [materials, showAll, relevantMaterialIds]);

  const sorted = useMemo(() => {
    return [...baseList].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  }, [baseList]);

  function setValue(id: string, value: number) {
    const next = { ...storage, [id]: clampNumber(value, 100000) };
    onStorageChange(next);
  }

  function addDelta(id: string, delta: number) {
    const current = storage[id] ?? 0;
    setValue(id, current + delta);
  }

  function beginEdit(id: string) {
    setEditingId(id);
    setDraft(String(storage[id] ?? 0));
  }

  function commitEdit() {
    if (!editingId) return;

    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      setValue(editingId, parsed);
    }

    cancelEdit();
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage));
  }, [storage]);

  return (
    <div className="storage" data-open={open ? "true" : "false"}>
      <button type="button" className="storage-summary" onClick={() => setOpen((open) => !open)}>
        <span>Materials Storage</span>
        <span className="storage-summary-right">{open ? "▾" : "▸"}</span>
      </button>

      <div className="storage-body">
        <div className="storage-step">
          <div className="storage-step-left">
            <div className="storage-step-title">Quick Step</div>
          </div>

          <NumericInput min={0} max={9999} value={stepX} onChange={(n) => setStepX(n)} />
        </div>

        <div className="storage-toggle-row">
          <label className="storage-toggle">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
            <span>Show all materials</span>
          </label>

          {!showAll && <span className="storage-toggle-hint">Showing {sorted.length} relevant</span>}
        </div>

        <div className="storage-list">
          {sorted.map((material) => {
            const value = storage[material.id] ?? 0;
            const isEditing = editingId === material.id;

            return (
              <div key={material.id} className="storage-row">
                <div className="storage-left">
                  <Icon icon_type="materials" id={material.id} box={false} />
                  <div className="storage-name-block">
                    <div className="storage-name">{material.name}</div>
                  </div>
                </div>

                {isEditing ? (
                  <input
                    ref={inputRef}
                    className="storage-value-input"
                    type="text"
                    inputMode="numeric"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitEdit();
                      if (e.key === "Escape") cancelEdit();
                    }}
                  />
                ) : (
                  <span
                    className="storage-value"
                    tabIndex={0}
                    onClick={() => beginEdit(material.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") beginEdit(material.id);
                    }}
                    title="Click to edit"
                  >
                    {value}
                  </span>
                )}

                <div className="storage-controls">
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, -stepX)}>
                    -{stepX}
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, -100)}>
                    -100
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, -10)}>
                    -10
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, -1)}>
                    -1
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, 1)}>
                    +1
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, 10)}>
                    +10
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, 100)}>
                    +100
                  </button>
                  <button type="button" className="storage-button" onClick={() => addDelta(material.id, stepX)}>
                    +{stepX}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="storage-footer">
          <button
            type="button"
            className="storage-reset"
            onClick={() => {
              const ok = window.confirm("Are you sure you want to clear Materials Storage?\n\nThis will reset every material count to 0.");
              if (ok) {
                onStorageChange({});
                localStorage.removeItem(STORAGE_KEY);
              }
            }}
          >
            Clear Storage
          </button>
        </div>
      </div>
    </div>
  );
}
