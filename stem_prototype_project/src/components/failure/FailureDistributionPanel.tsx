import { useState } from "react";
import {
  FAILURE_BY_COMPONENT, COMPONENT_COLOR, type FailureComponent,
} from "../../../data/failureData";

interface Props {
  onSelectComponent: (c: FailureComponent | null) => void;
  selected: FailureComponent | null;
}

const COMPS: FailureComponent[] = ["Comp1", "Comp2", "Comp3", "Comp4"];

export default function FailureDistributionPanel({ onSelectComponent, selected }: Props) {
  const [hover, setHover] = useState<FailureComponent | null>(null);
  const total = COMPS.reduce((s, c) => s + FAILURE_BY_COMPONENT[c], 0);
  const maxCount = Math.max(...COMPS.map((c) => FAILURE_BY_COMPONENT[c]));

  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">Failure Distribution</span>
          <div className="pdm-phead-sub">Click bar to filter event list · {total} total</div>
        </div>
      </div>

      <div className="pdm-bar-list">
        {COMPS.map((c) => {
          const n = FAILURE_BY_COMPONENT[c];
          const pct = total === 0 ? 0 : (n / total) * 100;
          const widthPct = maxCount === 0 ? 0 : (n / maxCount) * 100;
          const isActive = selected === c || hover === c;
          return (
            <div
              key={c}
              className={"pdm-bar-row" + (selected === c ? " selected" : "")}
              onClick={() => onSelectComponent(selected === c ? null : c)}
              onMouseEnter={() => setHover(c)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="pdm-bar-label">{c}</div>
              <div className="pdm-bar-track">
                <div
                  className="pdm-bar-fill"
                  style={{
                    width: `${widthPct}%`,
                    background: COMPONENT_COLOR[c],
                    opacity: isActive ? 1 : 0.85,
                  }}
                />
              </div>
              <div className="pdm-bar-val">
                <strong>{n}</strong>
                <span> · {pct.toFixed(1)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
