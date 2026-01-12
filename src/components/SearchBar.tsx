import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeText, tokenize, isSubsequence } from "../utils/helperUtils";
import "./SearchBar.css";
import SearchResultItem from "./SearchResultItem";

import artefactJson from "../data/artefacts.json";
import collectionJson from "../data/collections.json";
import type { ArtefactData, ArtefactIndex, Artefact, SearchMode, CollectionData, CollectionIndex } from "../types/archaeology";

const SEARCH_MODE_KEY = "archaeology_calculator_search_mode";

type Props = {
  onSelectArtefact: (artefact_id: string) => void;
  onSelectCollection: (collection_id: string) => void;
  onClearAll: () => void;
};

function scoreArtefact(artefactIndex: ArtefactIndex, queryNormalized: string, queryTokens: string[], allowFuzzy: boolean): number {
  if (!queryNormalized) return 0;

  const normalizedName = artefactIndex.normalized_name;
  const normalizedId = artefactIndex.normalized_id;

  let score = 0;

  if (normalizedName.startsWith(queryNormalized) || normalizedId.startsWith(queryNormalized)) score += 120;
  if (normalizedName.includes(queryNormalized) || normalizedId.includes(queryNormalized)) score += 60;

  if (queryTokens.length > 0) {
    const nameTokens = artefactIndex.tokens;

    let allTokensMatch = true;
    let tokenQuality = 0;

    const idTokens = tokenize(normalizedId);

    for (const queryToken of queryTokens) {
      if (nameTokens.includes(queryToken)) {
        tokenQuality += 18;
        continue;
      }

      const hasPrefix = nameTokens.some((token) => token.startsWith(queryToken));
      if (hasPrefix) {
        tokenQuality += 12;
        continue;
      }

      const hasIdPrefex = idTokens.some((token) => token.startsWith(queryToken) || token === queryToken);
      if (hasIdPrefex) {
        tokenQuality += 10;
        continue;
      }

      allTokensMatch = false;
      break;
    }

    if (allTokensMatch) score += 50 + tokenQuality;
  }

  const index = normalizedName.indexOf(queryNormalized);
  if (index === 0) score += 15;
  else if (index > 0 && index < 6) score += 8;

  score -= Math.min(10, Math.floor(normalizedName.length / 25));

  if (score <= 0 && allowFuzzy) {
    const compactNeedle = queryNormalized.replace(/\s+/g, "");
    const compactHayName = normalizedName.replace(/\s+/g, "");
    const compactHayId = normalizedId.replace(/\s+/g, "");

    if (compactNeedle.length >= 2 && (isSubsequence(compactNeedle, compactHayName) || isSubsequence(compactNeedle, compactHayId))) {
      score = 18;
    }
  }
  return score;
}

function scoreCollection(collection: CollectionIndex, queryNormalized: string, queryTokens: string[], allowFuzzy: boolean): number {
  if (!queryNormalized) return 0;

  const normalizedName = collection.normalized_name;

  let score = 0;

  if (normalizedName.startsWith(queryNormalized)) score += 120;
  if (normalizedName.includes(queryNormalized)) score += 60;

  if (queryTokens.length > 0) {
    const nameTokens = collection.tokens;

    let allTokensMatch = true;
    let tokenQuality = 0;

    for (const queryToken of queryTokens) {
      if (nameTokens.includes(queryToken)) {
        tokenQuality += 18;
        continue;
      }

      const hasPrefix = nameTokens.some((token) => token.startsWith(queryToken));
      if (hasPrefix) {
        tokenQuality += 12;
        continue;
      }

      allTokensMatch = false;
      break;
    }

    if (allTokensMatch) score += 50 + tokenQuality;
  }

  const index = normalizedName.indexOf(queryNormalized);
  if (index === 0) score += 15;
  else if (index > 0 && index < 6) score += 8;

  score -= Math.min(10, Math.floor(normalizedName.length / 25));

  if (score <= 0 && allowFuzzy) {
    const compactNeedle = queryNormalized.replace(/\s+/g, "");
    const compactHay = normalizedName.replace(/\s+/g, "");

    if (compactNeedle.length >= 2 && isSubsequence(compactNeedle, compactHay)) score = 18;
  }

  return score;
}

export default function SearchBar({ onSelectArtefact, onSelectCollection, onClearAll }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<SearchMode>(() => {
    const raw = localStorage.getItem(SEARCH_MODE_KEY);
    return raw === "collections" || raw === "artefacts" ? raw : "artefacts";
  });

  const artefactData = artefactJson as ArtefactData;
  const collectionData = collectionJson as CollectionData;

  const artefactList = useMemo(() => {
    return Object.values(artefactData.artefacts);
  }, [artefactData]);

  const indexById = useMemo<Record<string, ArtefactIndex>>(() => {
    const index: Record<string, ArtefactIndex> = {};

    for (const artefact of artefactList) {
      const normalizedName = normalizeText(artefact.name);
      const normalizedId = normalizeText(artefact.id);

      index[artefact.id] = {
        normalized_name: normalizedName,
        normalized_id: normalizedId,
        tokens: tokenize(normalizedName),
      };
    }
    return index;
  }, [artefactList]);

  const collectionIndex = useMemo<CollectionIndex[]>(() => {
    const list = Object.values(collectionData.collections ?? {});
    return list.map((collection) => {
      const normalizedName = normalizeText(collection.name);
      return {
        id: collection.id,
        name: collection.name,
        normalized_name: normalizedName,
        tokens: tokenize(normalizedName),
        level: collection.level,
        chronote_reward: collection.chronote_reward,
        collector_id: collection.collector_id,
        artefacts_required: collection.artefacts_required,
        artefacts_required_count: (collection.artefacts_required ?? []).length,
      };
    });
  }, [collectionData]);

  const filteredArtefacts = useMemo<Artefact[]>(() => {
    const queryNormalized = normalizeText(query);
    const queryTokens = tokenize(queryNormalized);

    if (!queryNormalized) return [];

    const scoredStrict = artefactList
      .map((artefact) => {
        const index = indexById[artefact.id];
        return { artefact: artefact, score: index ? scoreArtefact(index, queryNormalized, queryTokens, false) : 0 };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredStrict.length > 0) {
      return scoredStrict.slice(0, 10).map((x) => x.artefact);
    }

    const scoredFuzzy = artefactList
      .map((artefact) => {
        const index = indexById[artefact.id];
        return { artefact: artefact, score: index ? scoreArtefact(index, queryNormalized, queryTokens, true) : 0 };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scoredFuzzy.slice(0, 10).map((x) => x.artefact);
  }, [query, artefactList, indexById]);

  const filteredCollections = useMemo<CollectionIndex[]>(() => {
    const queryNormalized = normalizeText(query);
    const queryTokens = tokenize(queryNormalized);

    if (!queryNormalized) return [];

    const scoredStrict = collectionIndex
      .map((c) => ({ c, score: scoreCollection(c, queryNormalized, queryTokens, false) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredStrict.length > 0) return scoredStrict.slice(0, 10).map((x) => x.c);

    const scoredFuzzy = collectionIndex
      .map((c) => ({ c, score: scoreCollection(c, queryNormalized, queryTokens, true) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scoredFuzzy.slice(0, 10).map((x) => x.c);
  }, [query, collectionIndex]);

  function handleChange(value: string) {
    setQuery(value);
    if (value.trim().length > 0) setIsOpen(true);
    else setIsOpen(false);
  }

  function handleSelectArtefact(id: string) {
    onSelectArtefact(id);

    setQuery("");
    setIsOpen(false);
  }

  function handleSelectCollection(id: string) {
    onSelectCollection(id);

    setQuery("");
    setIsOpen(false);
  }

  useEffect(() => {
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const root = rootRef.current;
      if (!root) return;

      const target = e.target as Node | null;
      if (!target) return;

      if (!root.contains(target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(SEARCH_MODE_KEY, mode);
  }, [mode]);

  const shouldShowDropdown = isOpen && query.trim().length > 0;

  return (
    <div className="search" ref={rootRef}>
      <label className="search-label" htmlFor="search">
        {mode === "artefacts" ? "Search Artefacts" : "Search Collections"}
      </label>

      <div className="search-control">
        <div className="search-row">
          <input
            id="search"
            className="search-input"
            type="text"
            placeholder={mode === "artefacts" ? "Enter an artefact name..." : "Enter a collection name..."}
            autoComplete="off"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              if (query.trim().length > 0) setIsOpen(true);
            }}
          />
          <button
            className="search-clear"
            type="button"
            onClick={() => {
              onClearAll();
              setIsOpen(false);
            }}
          >
            Clear All
          </button>

          <button
            className="search-toggle"
            type="button"
            onClick={() => {
              setMode((mode) => (mode === "artefacts" ? "collections" : "artefacts"));
              if (query.trim().length > 0) setIsOpen(true);
            }}
            title="Toggle search mode"
          >
            {mode === "artefacts" ? "Artefacts" : "Collections"}
          </button>
        </div>

        {shouldShowDropdown && (
          <div className="search-dropdown">
            {mode === "artefacts" ? (
              filteredArtefacts.length === 0 ? (
                <div style={{ padding: "10px 10px", opacity: 0.8 }}>No results.</div>
              ) : (
                filteredArtefacts.map((artefact) => (
                  <SearchResultItem key={artefact.id} kind="artefact" artefact={artefact} onSelect={() => handleSelectArtefact(artefact.id)} />
                ))
              )
            ) : filteredCollections.length === 0 ? (
              <div style={{ padding: "10px 10px", opacity: 0.8 }}>No results.</div>
            ) : (
              filteredCollections.map((collection) => (
                <SearchResultItem
                  key={collection.id}
                  kind="collection"
                  collection={{
                    id: collection.id,
                    name: collection.name,
                    level: collection.level,
                    chronote_reward: collection.chronote_reward,
                    collector_id: collection.collector_id,
                    artefacts_required: collection.artefacts_required,
                  }}
                  artefact_data={artefactData}
                  onSelect={() => handleSelectCollection(collection.id)}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
