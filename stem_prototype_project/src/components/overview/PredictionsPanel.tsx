import { type MachinePrediction } from "../../../data/modelData";
import PredictionsTable from "./PredictionsTable";

interface Props {
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
}

export default function PredictionsPanel({ machines, onSelect }: Props) {
  return (
    <div className="pdm-table-wrap">
      <PredictionsTable machines={machines} onSelect={onSelect} />
    </div>
  );
}
