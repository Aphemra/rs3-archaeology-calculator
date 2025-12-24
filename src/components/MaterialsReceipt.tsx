import "./MaterialsReceipt.css";
import { useEffect, useRef, useState } from "react";
import type { ArtefactData, MaterialData, SelectedArtefact } from "../types/archaeology";
import Icon from "./Icon";

type Props = {
  selected: SelectedArtefact[];
  artefact_data: ArtefactData;
  material_data: MaterialData;

  storage: Record<string, number>;
};

const SHOW_BREAKDOWN_KEY = "archaeology_calculator_material_show_breakdown";

type MaterialTotals = Record<string, number>;

function addToTotals(totals: MaterialTotals, materialId: string, quantityToAdd: number) {
  totals[materialId] = (totals[materialId] ?? 0) + quantityToAdd;
}

function computeWithStorage(required: number, stored: number) {
  const req = Math.max(0, Math.floor(required));
  const have = Math.max(0, Math.floor(stored));
  const remaining = Math.max(0, required - have);
  return { req, have, remaining };
}

export default function MaterialsReceipt({ selected, artefact_data, material_data, storage }: Props) {
  const [showBreakdown, setShowBreakdown] = useState<boolean>(() => {
    const raw = localStorage.getItem(SHOW_BREAKDOWN_KEY);
    return raw ? raw === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem(SHOW_BREAKDOWN_KEY, String(showBreakdown));
  }, [showBreakdown]);

  const breakdownInnerRef = useRef<HTMLDivElement | null>(null);
  const [breakdownMaxHeight, setBreakdownMaxHeight] = useState<number>(0);

  useEffect(() => {
    const element = breakdownInnerRef.current;
    if (!element) return;

    const measure = () => setBreakdownMaxHeight(element.scrollHeight);

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(element);

    return () => ro.disconnect();
  }, [selected.length]);

  const perArtefact = selected
    .map((selection) => {
      const artefact = artefact_data.artefacts[selection.artefact_id];
      if (!artefact) return null;

      const totals: MaterialTotals = {};
      for (const requirement of artefact.materials_required) {
        addToTotals(totals, requirement.material_id, requirement.qty * selection.qty);
      }

      return {
        artefactId: selection.artefact_id,
        name: artefact.name,
        level: artefact.level,
        qty: selection.qty,
        totals,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const grandTotal: MaterialTotals = {};
  for (const line of perArtefact) {
    for (const [material_id, qty] of Object.entries(line.totals)) {
      addToTotals(grandTotal, material_id, qty);
    }
  }

  const sortedGrandTotal = Object.entries(grandTotal).sort(([aId], [bId]) => {
    const aName = material_data.materials[aId]?.name ?? aId;
    const bName = material_data.materials[bId]?.name ?? bId;
    return aName.localeCompare(bName);
  });

  return (
    <div className="receipt">
      <div className="receipt-header">
        <div className="receipt-header-row">
          <div className="receipt-title">Materials Needed</div>

          <label className="receipt-toggle">
            <input type="checkbox" checked={showBreakdown} onChange={(e) => setShowBreakdown(e.target.checked)} />
            <span>Show breakdown</span>
          </label>
        </div>
      </div>

      <div className="receipt-total-box">
        <div className="receipt-total-heading">TOTAL</div>

        {selected.length === 0 ? (
          <div className="receipt-empty">No artefacts selected yet.</div>
        ) : sortedGrandTotal.length === 0 ? (
          <div className="receipt-empty">No materials found for selected artefacts.</div>
        ) : (
          <ul className="receipt-list">
            {sortedGrandTotal.map(([materialId, requiredQuantity]) => {
              const name = material_data.materials[materialId]?.name ?? materialId;
              const storedQuantity = storage[materialId] ?? 0;
              const { req, have, remaining } = computeWithStorage(requiredQuantity, storedQuantity);

              return (
                <li key={materialId} className="receipt-row">
                  <div className="receipt-row-left">
                    <Icon icon_type="materials" id={materialId} box={false} />
                    <span className="receipt-left">{name}</span>
                  </div>
                  <div className="receipt-right-stack">
                    {remaining === 0 ? <div className="receipt-total-ok">{req}</div> : <div className="receipt-total-missing">{remaining}</div>}
                    <div className="receipt-math">
                      ({req} - {have})
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {selected.length > 0 && (
        <div className="receipt-breakdown" data-open={showBreakdown ? "true" : "false"} style={{ maxHeight: showBreakdown ? breakdownMaxHeight : 0 }}>
          <div ref={breakdownInnerRef} className="receipt-breakdown-inner">
            <div className="receipt-breakdown-heading"></div>

            {perArtefact.map((line) => {
              const materials = Object.entries(line.totals).sort(([aId], [bId]) => {
                const aName = material_data.materials[aId]?.name ?? aId;
                const bName = material_data.materials[bId]?.name ?? bId;
                return aName.localeCompare(bName);
              });

              return (
                <div key={line.artefactId} className="receipt-block">
                  <div className="receipt-block-header">
                    <div className="receipt-block-header-left">
                      <Icon icon_type="artefacts" id={line.artefactId} box={false} />
                      <div className="receipt-block-title">
                        <span className="receipt-artefact-name">{line.name}</span>
                        <span className="receipt-artefact-meta">Lvl. {line.level}</span>
                      </div>
                    </div>

                    <div className="receipt-artefact-quantity">{line.qty}</div>
                  </div>
                  <span className="receipt-block-title">Materials:</span>

                  <ul className="receipt-list">
                    {materials.map(([materialId, qty]) => {
                      const name = material_data.materials[materialId]?.name ?? materialId;
                      return (
                        <li key={materialId} className="receipt-row">
                          <div className="receipt-row-left">
                            <Icon icon_type="materials" id={materialId} box={false} />
                            <span className="receipt-left">{name}</span>
                          </div>
                          <span className="receipt-right">{qty}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
