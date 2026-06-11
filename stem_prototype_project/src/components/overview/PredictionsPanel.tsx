import { type MachinePrediction, type RiskStatus } from "../../../data/modelData";
import PredictionsTable from "./PredictionsTable";

interface Props {
  machines: MachinePrediction[];
  statusFilter: RiskStatus | null;
  onClearStatusFilter: () => void;
  onSelect: (m: MachinePrediction) => void;
}

export default function PredictionsPanel({
  machines, statusFilter, onClearStatusFilter, onSelect,
}: Props) {
  return (
    <div className="pdm-table-wrap">
      <PredictionsTable
        machines={machines}
        statusFilter={statusFilter}
        onClearStatusFilter={onClearStatusFilter}
        onSelect={onSelect}
      />
    </div>
  );
}
