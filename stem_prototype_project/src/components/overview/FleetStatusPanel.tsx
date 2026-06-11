import { type MachinePrediction, type RiskStatus } from "../../../data/modelData";
import ModelBadge from "./ModelBadge";
import FleetStatusPie from "./FleetStatusPie";

interface Props {
  machines: MachinePrediction[];
  statusFilter: RiskStatus | null;
  onSelectStatus: (s: RiskStatus) => void;
}

export default function FleetStatusPanel({ machines, statusFilter, onSelectStatus }: Props) {
  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">
            Fleet Health Status <ModelBadge inline />
          </span>
          <div className="pdm-phead-sub">
            Distribution across {machines.length} machines · Click a slice to filter the table
          </div>
        </div>
      </div>
      <FleetStatusPie
        machines={machines}
        selected={statusFilter}
        onSelect={onSelectStatus}
      />
    </div>
  );
}
