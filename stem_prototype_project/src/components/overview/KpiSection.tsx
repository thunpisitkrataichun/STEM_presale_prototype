import KpiCard from "./KpiCard";

interface Props {
  total: number;
  predictedFailures: number;
  avgDays: number;
  underMaint: number;
}

export default function KpiSection({
  total, predictedFailures, avgDays, underMaint,
}: Props) {
  return (
    <div className="pdm-kpis">
      <KpiCard
        label="Total Machines"
        value={total}
        foot="Across 4 Models"
      />
      <KpiCard
        label="Predicted Failures < 7 Days"
        value={predictedFailures}
        foot="Immediate Action"
        model
      />
      <KpiCard
        label="Average Days To Failure"
        value={avgDays.toFixed(1)}
        unit="Days"
        foot="Fleet Average"
        model
      />
      <KpiCard
        label="Machines Under Maintenance"
        value={underMaint}
        foot="Currently Serviced"
      />
    </div>
  );
}
