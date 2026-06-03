import { useState } from "react";
import {
  MACHINES, RUL_TREND, TOTAL_MACHINES, M006_BASELINE, TEST_MACHINE_ID,
  type MachinePrediction,
} from "../../data/modelData";

import OverviewHeader from "./overview/OverviewHeader";
import KpiSection from "./overview/KpiSection";
import ChartsRow from "./overview/ChartsRow";
import PredictionsPanel from "./overview/PredictionsPanel";
import MachineDetailModal from "./overview/MachineDetailModal";

export default function Overview() {
  // Live fleet — M006 may be edited at runtime, so we keep it in state.
  const [machines, setMachines] = useState<MachinePrediction[]>(MACHINES);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Look up the currently-selected machine from state so it reflects edits.
  const selected = selectedId
    ? machines.find((m) => m.machineID === selectedId) ?? null
    : null;

  const predictedFailures = machines.filter((m) => m.daysToFailure < 7).length;
  const avgDays =
    machines.reduce((s, m) => s + m.daysToFailure, 0) / machines.length;
  const underMaint = machines.filter((m) => m.underMaintenance).length;

  const handleSave = (updated: MachinePrediction) => {
    setMachines((prev) =>
      prev.map((m) => (m.machineID === updated.machineID ? updated : m)),
    );
  };

  const isTest = selected?.machineID === TEST_MACHINE_ID;

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
        machines={machines}
        onSelect={(m) => setSelectedId(m.machineID)}
      />
      <PredictionsPanel
        machines={machines}
        onSelect={(m) => setSelectedId(m.machineID)}
      />

      {selected && (
        <MachineDetailModal
          machine={selected}
          baseline={isTest ? M006_BASELINE : undefined}
          onSave={isTest ? handleSave : undefined}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
