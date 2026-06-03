// In-browser XGBoost evaluator.
//
// Loads tree-dump JSON produced by model/src/generate_predictions.py and
// runs the same prediction logic in pure JS so the demo works offline
// (no Python/FastAPI/network round-trip needed).
//
// XGBoost prediction = baseScore + Σ tree.leaf(features)
// (The learning rate is already baked into leaf values during training.)

import treesData from "../../data/modelTrees.json";

type LeafNode = { id: number; leaf: number };
type SplitNode = {
  id: number;
  f: string;   // feature name
  s: number;   // split value
  y: number;   // yes child id (feature < split)
  n: number;   // no child id  (feature >= split)
  m: number;   // missing child id
};
type TreeNode = LeafNode | SplitNode;

interface ModelData {
  baseScore: number;
  features: string[];
  trees: TreeNode[][];
}

const MODEL = treesData as ModelData;

// Inputs the UI exposes for the editable test machine.
export interface PredictInput {
  age: number;
  model: string;   // "model1" | "model2" | "model3" | "model4"
  volt: number;
  rotate: number;
  pressure: number;
  vibration: number;
  underMaintenance: boolean;
}

// Build the full 23-feature vector the model expects.
// Rolling stats are filled with the current sensor reading (mean) and 0 (std)
// because we have no history for the synthetic test machine; cum_* are 0.
function buildFeatures(input: PredictInput): Record<string, number> {
  return {
    age: input.age,
    volt: input.volt,
    rotate: input.rotate,
    pressure: input.pressure,
    vibration: input.vibration,
    has_error: 0,
    has_maint: input.underMaintenance ? 1 : 0,
    hour: 12,
    dayofweek: 3,
    volt_roll_mean_24h: input.volt,
    volt_roll_std_24h: 0,
    rotate_roll_mean_24h: input.rotate,
    rotate_roll_std_24h: 0,
    pressure_roll_mean_24h: input.pressure,
    pressure_roll_std_24h: 0,
    vibration_roll_mean_24h: input.vibration,
    vibration_roll_std_24h: 0,
    cum_errors: 0,
    cum_maint: 0,
    model_model1: input.model === "model1" ? 1 : 0,
    model_model2: input.model === "model2" ? 1 : 0,
    model_model3: input.model === "model3" ? 1 : 0,
    model_model4: input.model === "model4" ? 1 : 0,
  };
}

function traverse(tree: TreeNode[], features: Record<string, number>): number {
  // Build id → node lookup once per call. Tree size is small (max ~127 nodes).
  const byId = new Map<number, TreeNode>();
  for (const node of tree) byId.set(node.id, node);

  let cursor = byId.get(0);
  while (cursor) {
    if ("leaf" in cursor) return cursor.leaf;
    const v = features[cursor.f];
    if (v === undefined || Number.isNaN(v)) {
      cursor = byId.get(cursor.m);
    } else if (v < cursor.s) {
      cursor = byId.get(cursor.y);
    } else {
      cursor = byId.get(cursor.n);
    }
  }
  return 0;
}

export function predictDaysToFailure(input: PredictInput): number {
  const features = buildFeatures(input);
  let sum = MODEL.baseScore;
  for (const tree of MODEL.trees) {
    sum += traverse(tree, features);
  }
  return Math.max(0, Math.round(sum * 10) / 10);
}
