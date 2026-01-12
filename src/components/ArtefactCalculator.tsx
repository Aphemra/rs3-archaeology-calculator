import "./ArtefactCalculator.css";

import { useEffect, useMemo, useState } from "react";
import SearchBar from "./SearchBar";
import ArtefactCard from "./ArtefactCard";
import CollectionCard from "./CollectionCard";
import MaterialsReceipt from "./MaterialsReceipt";
import MaterialsStorage from "./MaterialsStorage";

import artefactsJson from "../data/artefacts.json";
import materialsJson from "../data/materials.json";
import collectionsJson from "../data/collections.json";

import type { ArtefactData, MaterialData, SelectedArtefact, CollectionData, SelectedCollection } from "../types/archaeology";

const STORAGE_KEY = "archaeology_calculator_material_storage";
const SELECTED_ARTEFACTS_KEY = "archaeology_calculator_selected_artefacts";
const SELECTED_COLLECTIONS_KEY = "archaeology_calculator_selected_collections";

export default function ArtefactCalculator() {
  const artefactData = artefactsJson as ArtefactData;
  const materialData = materialsJson as MaterialData;
  const collectionData = collectionsJson as CollectionData;

  const [selectedArtefacts, setSelectedArtefacts] = useState<SelectedArtefact[]>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_ARTEFACTS_KEY);
      return raw ? (JSON.parse(raw) as SelectedArtefact[]) : [];
    } catch {
      return [];
    }
  });

  const [selectedCollections, setSelectedCollections] = useState<SelectedCollection[]>(() => {
    try {
      const raw = localStorage.getItem(SELECTED_COLLECTIONS_KEY);
      return raw ? (JSON.parse(raw) as SelectedCollection[]) : [];
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
    localStorage.setItem(SELECTED_ARTEFACTS_KEY, JSON.stringify(selectedArtefacts));
  }, [selectedArtefacts]);

  useEffect(() => {
    localStorage.setItem(SELECTED_COLLECTIONS_KEY, JSON.stringify(selectedCollections));
  }, [selectedCollections]);

  function addArtefact(artefactId: string) {
    setSelectedArtefacts((prev) => {
      const index = prev.findIndex((x) => x.artefact_id === artefactId);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = { ...copy[index], qty: copy[index].qty + 1 };
        return copy;
      }
      return [...prev, { artefact_id: artefactId, qty: 1 }];
    });
  }

  function addCollection(collectionId: string) {
    setSelectedCollections((prev) => {
      const index = prev.findIndex((x) => x.collection_id === collectionId);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = { ...copy[index], qty: copy[index].qty + 1 };
        return copy;
      }
      return [...prev, { collection_id: collectionId, qty: 1 }];
    });
  }

  function changeArtefactQuantity(artefactId: string, newQuantity: number) {
    const safe = Number.isFinite(newQuantity) ? Math.max(0, Math.floor(newQuantity)) : 0;

    setSelectedArtefacts((prev) => prev.map((x) => (x.artefact_id === artefactId ? { ...x, qty: safe } : x)));
  }

  function changeCollectionQuantity(collectionId: string, newQuantity: number) {
    const safe = Number.isFinite(newQuantity) ? Math.max(0, Math.floor(newQuantity)) : 0;

    setSelectedCollections((prev) => prev.map((x) => (x.collection_id === collectionId ? { ...x, qty: safe } : x)));
  }

  function removeArtefact(artefactId: string) {
    setSelectedArtefacts((prev) => prev.filter((x) => x.artefact_id !== artefactId));
  }

  function removeCollection(collectionId: string) {
    setSelectedCollections((prev) => prev.filter((x) => x.collection_id !== collectionId));
  }

  function craftOneArtefact(artefactId: string) {
    const artefact = artefactData.artefacts[artefactId];
    if (!artefact) return;

    const hasEnough = artefact.materials_required.every((requirement) => {
      const have = storage[requirement.material_id] ?? 0;
      return have >= requirement.qty;
    });

    if (!hasEnough) {
      alert("Insufficient materials in Material Storage!");
      return;
    }

    setSelectedArtefacts((prev) => {
      const index = prev.findIndex((x) => x.artefact_id === artefactId);
      if (index < 0) return prev;

      const currentQuantity = prev[index].qty;
      const nextQuantity = Math.max(0, currentQuantity - 1);

      if (nextQuantity <= 0) {
        return prev.filter((x) => x.artefact_id !== artefactId);
      }

      const copy = [...prev];
      copy[index] = { ...copy[index], qty: nextQuantity };
      return copy;
    });

    setStorage((prev) => {
      const next: Record<string, number> = { ...prev };

      for (const requirement of artefact.materials_required) {
        const have = next[requirement.material_id] ?? 0;
        const remaining = have - requirement.qty;

        if (remaining <= 0) delete next[requirement.material_id];
        else next[requirement.material_id] = remaining;
      }

      return next;
    });
  }

  function craftOneCollection(collectionId: string) {
    const collection = collectionData.collections?.[collectionId];
    if (!collection) return;

    const requiredTotals: Record<string, number> = {};

    for (const artefactId of collection.artefacts_required) {
      const artefact = artefactData.artefacts[artefactId];
      if (!artefact) continue;

      for (const req of artefact.materials_required) {
        requiredTotals[req.material_id] = (requiredTotals[req.material_id] ?? 0) + req.qty;
      }
    }

    const hasEnough = Object.entries(requiredTotals).every(([matId, qty]) => (storage[matId] ?? 0) >= qty);

    if (!hasEnough) {
      alert("Insufficient materials in Material Storage!");
      return;
    }

    setSelectedCollections((prev) => {
      const index = prev.findIndex((x) => x.collection_id === collectionId);
      if (index < 0) return prev;

      const currentQuantity = prev[index].qty;
      const nextQuantity = Math.max(0, currentQuantity - 1);

      if (nextQuantity <= 0) return prev.filter((x) => x.collection_id !== collectionId);

      const copy = [...prev];
      copy[index] = { ...copy[index], qty: nextQuantity };
      return copy;
    });

    setStorage((prev) => {
      const next: Record<string, number> = { ...prev };

      for (const [matId, qty] of Object.entries(requiredTotals)) {
        const have = next[matId] ?? 0;
        const remaining = have - qty;

        if (remaining <= 0) delete next[matId];
        else next[matId] = remaining;
      }

      return next;
    });
  }

  const artefactCards = useMemo(() => {
    return selectedArtefacts
      .map((s) => ({
        qty: s.qty,
        artefact: artefactData.artefacts[s.artefact_id],
      }))
      .filter((x) => !!x.artefact);
  }, [selectedArtefacts, artefactData]);

  const collectionCards = useMemo(() => {
    return selectedCollections
      .map((s) => {
        const collection = collectionData.collections?.[s.collection_id];
        if (!collection) return null;
        return { qty: s.qty, collection };
      })
      .filter((x): x is NonNullable<typeof x> => !!x);
  }, [selectedCollections, collectionData]);

  return (
    <div className="calculator">
      <SearchBar
        onSelectArtefact={addArtefact}
        onSelectCollection={addCollection}
        onClearAll={() => {
          setSelectedArtefacts([]);
          setSelectedCollections([]);
          localStorage.removeItem(SELECTED_ARTEFACTS_KEY);
          localStorage.removeItem(SELECTED_COLLECTIONS_KEY);
        }}
      />

      <div className="calculator-body">
        <div className="calculator-cards">
          {collectionCards.map(({ collection, qty }) => (
            <CollectionCard
              key={`collection-${collection.id}`}
              collection={collection}
              artefact_data={artefactData}
              materials={materialData}
              qty={qty}
              onQuantityChange={(n) => changeCollectionQuantity(collection.id, n)}
              onDelete={() => removeCollection(collection.id)}
              onCraft={() => craftOneCollection(collection.id)}
            />
          ))}
          {artefactCards.map(({ artefact, qty }) => (
            <ArtefactCard
              key={artefact.id}
              artefact={artefact}
              materials={materialData}
              qty={qty}
              onQuantityChange={(n) => changeArtefactQuantity(artefact.id, n)}
              onDelete={() => removeArtefact(artefact.id)}
              onCraft={() => craftOneArtefact(artefact.id)}
            />
          ))}
        </div>
        <div className="calculator-sidebar">
          <MaterialsStorage
            material_data={materialData}
            artefact_data={artefactData}
            selected_artefacts={selectedArtefacts}
            selected_collections={selectedCollections}
            collections_data={collectionData}
            storage={storage}
            onStorageChange={setStorage}
          />
          <MaterialsReceipt
            selected={selectedArtefacts}
            selected_collections={selectedCollections}
            artefact_data={artefactData}
            collections_data={collectionData}
            material_data={materialData}
            storage={storage}
          />
        </div>
      </div>
    </div>
  );
}
