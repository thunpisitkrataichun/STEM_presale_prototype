import { type MachinePrediction, type TrendPoint } from "../../../data/modelData";
import RulTrendPanel from "./RulTrendPanel";
import AtRiskPanel from "./AtRiskPanel";

interface Props {
  trend: TrendPoint[];
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
}

export default function ChartsRow({ trend, machines, onSelect }: Props) {
  return (
    <div className="pdm-row2">
      <RulTrendPanel data={trend} />
      <AtRiskPanel machines={machines} onSelect={onSelect} />
    </div>
  );
}
