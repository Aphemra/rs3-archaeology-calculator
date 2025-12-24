import artefactData from "../data/artefacts.json";
import type { Artefact } from "../types/archaeology";

const artefactMap: Record<string, Artefact> = artefactData.artefacts;

export function getArtefact(artefactId: string): Artefact {
  return artefactMap[artefactId];
}
