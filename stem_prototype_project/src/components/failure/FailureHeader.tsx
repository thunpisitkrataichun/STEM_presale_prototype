import { ANALYSIS_PERIOD } from "../../../data/failureData";

interface Props {
  rangeDays: number;
  onChangeRange: (d: number) => void;
}

const RANGES = [30, 60, 90];

export default function FailureHeader({ rangeDays, onChangeRange }: Props) {
  return (
    <div className="pdm-top">
      <div>
        <h1 className="pdm-title">Failure Analysis</h1>
        <p className="pdm-sub">Root cause patterns · historical failures · MTBF</p>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span className="pdm-pill" style={{ marginRight: 6 }}>
          Period · {ANALYSIS_PERIOD.start} → {ANALYSIS_PERIOD.end}
        </span>
        <div className="pdm-chip-row">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              className={"pdm-chip" + (rangeDays === d ? " active" : "")}
              onClick={() => onChangeRange(d)}
            >
              Last {d}d
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
