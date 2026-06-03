import { type MachinePrediction } from "../../../data/modelData";
import ModelBadge from "./ModelBadge";
import AtRiskList from "./AtRiskList";

interface Props {
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
}

export default function AtRiskPanel({ machines, onSelect }: Props) {
  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <span className="pdm-pt">
          At-Risk Machines <ModelBadge inline />
        </span>
      </div>
      <AtRiskList machines={machines} onSelect={onSelect} />
    </div>
  );
}
