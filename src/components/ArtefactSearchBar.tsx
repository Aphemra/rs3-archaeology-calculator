import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeText, tokenize, isSubsequence } from "../utils/helperUtils";
import "./ArtefactSearchBar.css";
import SearchResultItem from "./SearchResultItem";

import artefactData from "../data/artefacts.json";
import type { ArtefactData, ArtefactIndex, Artefact } from "../types/archaeology";

type Props = {
  onSelectArtefact: (artefact_id: string) => void;
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

export default function ArtefactSearchBar({ onSelectArtefact, onClearAll }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const data = artefactData as ArtefactData;

  const artefactList = useMemo(() => {
    return Object.values(data.artefacts);
  }, [data]);

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

  const filtered = useMemo<Artefact[]>(() => {
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

  function handleChange(value: string) {
    setQuery(value);
    if (value.trim().length > 0) setIsOpen(true);
    else setIsOpen(false);
  }

  function handleSelect(id: string) {
    onSelectArtefact(id);

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

  const shouldShowDropdown = isOpen && query.trim().length > 0;

  return (
    <div className="search" ref={rootRef}>
      <label className="search-label" htmlFor="search">
        Search Artefacts
      </label>

      <div className="search-control">
        <div className="search-row">
          <input
            id="search"
            className="search-input"
            type="text"
            placeholder="Enter an artefact name..."
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
        </div>

        {shouldShowDropdown && (
          <div className="search-dropdown">
            {filtered.length === 0 ? (
              <div style={{ padding: "10px 10px", opacity: 0.8 }}>No results.</div>
            ) : (
              filtered.map((artefact) => <SearchResultItem key={artefact.id} artefact={artefact} onSelect={() => handleSelect(artefact.id)} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
