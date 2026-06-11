import type { FailureComponent } from "../../data/failureData";

// Demo-friendly display names for the anonymous Comp1–4 component codes in
// the Azure PdM dataset. Display-only: data keys and filters keep Comp1–4.
export const COMPONENT_LABEL: Record<FailureComponent, string> = {
  Comp1: "Motor",
  Comp2: "Bearings",
  Comp3: "Hydraulics",
  Comp4: "Drive Belt",
};
