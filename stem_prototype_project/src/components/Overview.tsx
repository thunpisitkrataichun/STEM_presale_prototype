import { useState } from "react";
import {
  MACHINES, RUL_TREND, TOTAL_MACHINES,
  type MachinePrediction,
} from "../../data/modelData";

import OverviewHeader from "./overview/OverviewHeader";
import KpiSection from "./overview/KpiSection";
import ChartsRow from "./overview/ChartsRow";
import PredictionsPanel from "./overview/PredictionsPanel";
import MachineDetailModal from "./overview/MachineDetailModal";

export default function Overview() {
  const [selected, setSelected] = useState<MachinePrediction | null>(null);

  const predictedFailures = MACHINES.filter((m) => m.daysToFailure < 7).length;
  const avgDays =
    MACHINES.reduce((s, m) => s + m.daysToFailure, 0) / MACHINES.length;
  const underMaint = MACHINES.filter((m) => m.underMaintenance).length;

  return (
    <main className="pdm-main">
      <OverviewHeader />
      <KpiSection
        total={TOTAL_MACHINES}
        predictedFailures={predictedFailures}
        avgDays={avgDays}
        underMaint={underMaint}
      />
      <ChartsRow
        trend={RUL_TREND}
        machines={MACHINES}
        onSelect={setSelected}
      />
      <PredictionsPanel machines={MACHINES} onSelect={setSelected} />

      {selected && (
        <MachineDetailModal
          machine={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}
