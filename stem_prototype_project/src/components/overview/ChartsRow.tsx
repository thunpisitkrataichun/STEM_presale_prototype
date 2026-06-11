import { type MachinePrediction, type RiskStatus } from "../../../data/modelData";
import FleetStatusPanel from "./FleetStatusPanel";
import AtRiskPanel from "./AtRiskPanel";

interface Props {
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
  statusFilter: RiskStatus | null;
  onSelectStatus: (s: RiskStatus) => void;
}

export default function ChartsRow({ machines, onSelect, statusFilter, onSelectStatus }: Props) {
  return (
    <div className="pdm-row2">
      <FleetStatusPanel
        machines={machines}
        statusFilter={statusFilter}
        onSelectStatus={onSelectStatus}
      />
      <AtRiskPanel machines={machines} onSelect={onSelect} />
    </div>
  );
}
