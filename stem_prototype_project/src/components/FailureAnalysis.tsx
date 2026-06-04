import { useState } from "react";
import { type FailureEvent, type FailureComponent } from "../../data/failureData";

import FailureHeader from "./failure/FailureHeader";
import FailureKpiSection from "./failure/FailureKpiSection";
import FailureDistributionPanel from "./failure/FailureDistributionPanel";
import TopOffendersPanel from "./failure/TopOffendersPanel";
import FailureTrendPanel from "./failure/FailureTrendPanel";
import FailureHeatmapPanel from "./failure/FailureHeatmapPanel";
import FailureEventsTable from "./failure/FailureEventsTable";
import FailureDetailModal from "./failure/FailureDetailModal";

export default function FailureAnalysis() {
  const [rangeDays, setRangeDays] = useState(90);
  const [compFilter, setCompFilter] = useState<FailureComponent | null>(null);
  const [machineFilter, setMachineFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FailureEvent | null>(null);

  const clearFilters = () => {
    setCompFilter(null);
    setMachineFilter(null);
  };

  return (
    <main className="pdm-main">
      <FailureHeader rangeDays={rangeDays} onChangeRange={setRangeDays} />
      <FailureKpiSection />

      <div className="pdm-row2">
        <FailureDistributionPanel
          selected={compFilter}
          onSelectComponent={setCompFilter}
        />
        <TopOffendersPanel
          selected={machineFilter}
          onSelectMachine={setMachineFilter}
        />
      </div>

      <div className="pdm-row2">
        <FailureTrendPanel />
        <FailureHeatmapPanel />
      </div>

      <FailureEventsTable
        rangeDays={rangeDays}
        componentFilter={compFilter}
        machineFilter={machineFilter}
        onSelectEvent={setSelectedEvent}
        onClearFilters={clearFilters}
      />

      {selectedEvent && (
        <FailureDetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </main>
  );
}
