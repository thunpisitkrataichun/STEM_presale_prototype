import {
  statusFromDays, STATUS_COLOR,
  type MachinePrediction,
} from "../../../data/modelData";

interface Props {
  machines: MachinePrediction[];
  onSelect: (m: MachinePrediction) => void;
}

// Top-5 machines closest to failure. Each row opens the detail modal.
export default function AtRiskList({ machines, onSelect }: Props) {
  const top = [...machines]
    .sort((a, b) => a.daysToFailure - b.daysToFailure)
    .slice(0, 5);

  return (
    <>
      {top.map((m) => {
        const st = statusFromDays(m.daysToFailure);
        return (
          <div
            className="pdm-risk-item clickable"
            key={m.machineID}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(m)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(m);
              }
            }}
          >
            <span
              className="pdm-led"
              style={{ background: STATUS_COLOR[st] }}
            />
            <span className="pdm-risk-id">{m.machineID}</span>
            <span className="pdm-risk-meta">
              {m.model} · Age {m.age}
            </span>
            <span className="pdm-risk-days" style={{ color: STATUS_COLOR[st] }}>
              {m.daysToFailure.toFixed(1)}d
            </span>
          </div>
        );
      })}
    </>
  );
}
