import { useEffect, useRef, useState } from "react";
import {
  type LiveSnapshot, type ActiveAlarm,
  buildInitialSnapshot, tickSnapshot, deriveAlarms,
} from "../../data/liveMonitorData";
import { loadSettings } from "../../data/settingsData";
import { useDataContext } from "../context/DataContext";

import LiveHeader from "./live/LiveHeader";
import LiveKpiSection from "./live/LiveKpiSection";
import MachineGrid from "./live/MachineGrid";
import ActiveAlarmsPanel from "./live/ActiveAlarmsPanel";
import FleetHeatmap from "./live/FleetHeatmap";
import LiveDetailModal from "./live/LiveDetailModal";

const TICK_MS = 5000;

export default function LiveMonitor() {
  const { machines } = useDataContext();
  const settings = useRef(loadSettings());

  const [snapshot, setSnapshot] = useState<LiveSnapshot[]>(() =>
    buildInitialSnapshot(machines, settings.current.thresholds.sensor),
  );
  const [alarms, setAlarms] = useState<ActiveAlarm[]>(() =>
    deriveAlarms(snapshot, []),
  );
  const [acknowledged, setAcknowledged] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [selected, setSelected] = useState<LiveSnapshot | null>(null);
  const [highlightedMachine, setHighlightedMachine] = useState<string | null>(null);

  const ackIds = useRef<Set<string>>(new Set());

  // Re-seed when uploaded dataset changes
  useEffect(() => {
    const fresh = buildInitialSnapshot(machines, settings.current.thresholds.sensor);
    setSnapshot(fresh);
    setAlarms(deriveAlarms(fresh, []));
    setSelected(null);
    ackIds.current.clear();
  }, [machines]);

  const tick = () => {
    setSnapshot((prev) => {
      const next = tickSnapshot(prev, settings.current.thresholds.sensor);
      setAlarms((prevAlarms) => {
        const fresh = deriveAlarms(next, prevAlarms.filter((a) => !ackIds.current.has(a.id)));
        return fresh.filter((a) => !ackIds.current.has(a.id));
      });
      return next;
    });
    setLastUpdate(new Date());
  };

  useEffect(() => {
    if (paused) return;
    const id = setInterval(tick, TICK_MS);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (!selected) return;
    const fresh = snapshot.find((m) => m.machineID === selected.machineID);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [snapshot, selected]);

  const handleAcknowledge = (id: string) => {
    ackIds.current.add(id);
    setAlarms((prev) => prev.filter((a) => a.id !== id));
    setAcknowledged((n) => n + 1);
  };

  const handleJumpToMachine = (machineID: string) => {
    setHighlightedMachine(machineID);
    const m = snapshot.find((x) => x.machineID === machineID);
    if (m) setSelected(m);
    setTimeout(() => setHighlightedMachine(null), 2500);
  };

  return (
    <main className="pdm-main">
      <LiveHeader
        lastUpdate={lastUpdate}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
        onRefresh={tick}
      />

      <LiveKpiSection snapshot={snapshot} alarms={alarms} />

      <div className="pdm-live-row">
        <MachineGrid
          snapshot={snapshot}
          highlightedMachine={highlightedMachine}
          onSelect={setSelected}
        />
        <ActiveAlarmsPanel
          alarms={alarms}
          acknowledged={acknowledged}
          onAcknowledge={handleAcknowledge}
          onJumpToMachine={handleJumpToMachine}
        />
      </div>

      <FleetHeatmap snapshot={snapshot} onSelect={setSelected} />

      {selected && (
        <LiveDetailModal
          snap={selected}
          onClose={() => setSelected(null)}
          onAcknowledge={
            selected.status === "alarm"
              ? () => {
                  const a = alarms.find((x) => x.machineID === selected.machineID);
                  if (a) handleAcknowledge(a.id);
                }
              : undefined
          }
          onScheduleMaintenance={() => {
            alert(`Schedule maintenance for ${selected.machineID} — go to Maintenance page`);
          }}
        />
      )}
    </main>
  );
}
