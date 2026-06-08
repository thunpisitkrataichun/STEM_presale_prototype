import { statusFromDays, STATUS_COLOR } from "../../../data/modelData";
import { useDataContext } from "../../context/DataContext";

interface Props {
  onSelectMachine: (machineID: string | null) => void;
  selected: string | null;
}

export default function TopOffendersPanel({ onSelectMachine, selected }: Props) {
  const { topOffenders: TOP_OFFENDERS, machines: MACHINES } = useDataContext();
  const maxCount = Math.max(...TOP_OFFENDERS.map((o) => o.count), 1);

  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <span className="pdm-pt">Top Offenders</span>
      </div>
      <div className="pdm-phead-sub" style={{ marginTop: -8, marginBottom: 8 }}>
        Most failures in current period
      </div>

      {TOP_OFFENDERS.map((o) => {
        const machine = MACHINES.find((m) => m.machineID === o.machineID);
        const st = machine ? statusFromDays(machine.daysToFailure) : "Normal";
        const widthPct = (o.count / maxCount) * 100;
        return (
          <div
            key={o.machineID}
            className={"pdm-risk-item clickable" + (selected === o.machineID ? " pdm-row-active" : "")}
            role="button"
            tabIndex={0}
            onClick={() => onSelectMachine(selected === o.machineID ? null : o.machineID)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectMachine(selected === o.machineID ? null : o.machineID);
              }
            }}
          >
            <span className="pdm-led" style={{ background: STATUS_COLOR[st] }} />
            <span className="pdm-risk-id">{o.machineID}</span>
            <div style={{ flex: 1, marginRight: 8 }}>
              <div style={{
                height: 6, background: "var(--blue-50)", borderRadius: 3,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${widthPct}%`, height: "100%",
                  background: STATUS_COLOR[st],
                }} />
              </div>
            </div>
            <span className="pdm-risk-days" style={{ color: "var(--ink)" }}>
              {o.count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
