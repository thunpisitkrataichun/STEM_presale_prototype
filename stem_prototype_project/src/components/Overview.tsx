import { useEffect, useState } from "react";
import {
  M006_BASELINE, TEST_MACHINE_ID,
  type MachinePrediction,
} from "../../data/modelData";
import { useDataContext } from "../context/DataContext";

import OverviewHeader from "./overview/OverviewHeader";
import KpiSection from "./overview/KpiSection";
import ChartsRow from "./overview/ChartsRow";
import PredictionsPanel from "./overview/PredictionsPanel";
import MachineDetailModal from "./overview/MachineDetailModal";

export default function Overview() {
  const { machines: contextMachines, setMachines: setContextMachines, uploadInfo } = useDataContext();
  const [machines, setMachinesLocal] = useState<MachinePrediction[]>(contextMachines);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Sync local state when a new xlsx is loaded or data is reset
  useEffect(() => {
    setMachinesLocal(contextMachines);
    setSelectedId(null);
  }, [contextMachines]);

  const updateMachine = (updated: MachinePrediction) => {
    const next = machines.map((m) => (m.machineID === updated.machineID ? updated : m));
    setMachinesLocal(next);
    setContextMachines(next);
  };

  const selected = selectedId
    ? machines.find((m) => m.machineID === selectedId) ?? null
    : null;

  const predictedFailures = machines.filter((m) => m.daysToFailure < 7).length;
  const avgDays = machines.length > 0
    ? machines.reduce((s, m) => s + m.daysToFailure, 0) / machines.length
    : 0;
  const underMaint = machines.filter((m) => m.underMaintenance).length;
  const totalMachines = uploadInfo ? uploadInfo.rowCount : machines.length;

  const isTest = selected?.machineID === TEST_MACHINE_ID;

  return (
    <main className="pdm-main">
      <OverviewHeader />
      <KpiSection
        total={totalMachines}
        predictedFailures={predictedFailures}
        avgDays={avgDays}
        underMaint={underMaint}
      />
      <ChartsRow
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
          onSave={isTest ? updateMachine : undefined}
          onClose={() => setSelectedId(null)}
        />
      )}
    </main>
  );
}
