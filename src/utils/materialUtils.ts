import materialData from "../data/materials.json";
import type { Material } from "../types/archaeology";

const materialMap: Record<string, Material> = materialData.materials;

export function getMaterial(materialId: string): Material {
  return materialMap[materialId];
}
