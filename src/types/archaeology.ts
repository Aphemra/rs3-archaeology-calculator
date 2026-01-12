// Material related types

export type MaterialData = {
  materials: Record<string, Material>;
};

export type Material = {
  id: string;
  name: string;
  level: number;
  locations: MaterialLocation[];
};

export type MaterialLocation = {
  location: string;
  requirement: string[];
};

export type MaterialRequirement = {
  material_id: string;
  qty: number;
};

// Artefact related types

export type ArtefactData = {
  artefacts: Record<string, Artefact>;
};

export type Artefact = {
  id: string;
  name: string;
  level: number;
  xp: number;
  chronote_value: number;
  materials_required: MaterialRequirement[];
  collections: string[];
  other_uses: number;
  other_uses_notes: string;
  god: string;
  source: string;
};

export type ArtefactIndex = {
  normalized_name: string;
  normalized_id: string;
  tokens: string[];
};

// Calculator state types

export type SelectedArtefact = {
  artefact_id: string;
  qty: number;
};

export type SelectedCollection = {
  collection_id: string;
  qty: number;
};

export type SearchMode = "artefacts" | "collections";

// Collection related types

export type CollectionData = {
  collections: Record<string, Collection>;
};

export type Collection = {
  id: string;
  name: string;
  level: number;
  chronote_reward: number;
  collector_id: string;
  artefacts_required: string[];
};

export type CollectionIndex = {
  id: string;
  name: string;
  normalized_name: string;
  tokens: string[];
  level: number;
  chronote_reward: number;
  collector_id: string;
  artefacts_required: string[];
  artefacts_required_count: number;
};

// Collector related types

export type Collector = {
  id: string;
  name: string;
  location: string;
};

export type CollectorData = {
  collectors: Record<string, Collector>;
};
