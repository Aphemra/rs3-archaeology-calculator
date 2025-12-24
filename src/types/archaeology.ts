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
