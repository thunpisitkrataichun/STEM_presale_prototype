import { type MachinePrediction } from "../../../data/modelData";
import FleetStatusPanel from "./FleetStatusPanel";
import AtRiskPanel from "./AtRiskPanel";

interface Props {
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
}

export default function ChartsRow({ machines, onSelect }: Props) {
  return (
    <div className="pdm-row2">
      <FleetStatusPanel machines={machines} />
      <AtRiskPanel machines={machines} onSelect={onSelect} />
    </div>
  );
}
