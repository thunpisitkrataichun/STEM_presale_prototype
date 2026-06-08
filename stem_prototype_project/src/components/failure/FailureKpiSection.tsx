import { useDataContext } from "../../context/DataContext";

function Delta({ now, prev, lowerBetter }: { now: number; prev: number; lowerBetter?: boolean }) {
  const diff = now - prev;
  const good = lowerBetter ? diff < 0 : diff > 0;
  const sign = diff > 0 ? "+" : "";
  return (
    <span style={{ color: good ? "var(--risk-normal)" : "var(--risk-critical)", fontWeight: 600 }}>
      {sign}{diff.toFixed(1)}
    </span>
  );
}

export default function FailureKpiSection() {
  const k = useDataContext().failureKpis;
  return (
    <div className="pdm-kpis">
      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">Total Failures</p>
        <div><span className="pdm-kpi-val">{k.totalLast90}</span></div>
        <div className="pdm-kpi-foot">
          <Delta now={k.totalLast90} prev={k.totalPrev90} lowerBetter /> vs prev period
        </div>
      </div>

      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">MTBF</p>
        <div>
          <span className="pdm-kpi-val">{k.mtbfDays}</span>
          <span className="pdm-kpi-unit">Days</span>
        </div>
        <div className="pdm-kpi-foot">
          <Delta now={k.mtbfDays} prev={k.mtbfPrevDays} /> vs prev period
        </div>
      </div>

      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">Top Failed Component</p>
        <div><span className="pdm-kpi-val">{k.topComponent}</span></div>
        <div className="pdm-kpi-foot">
          {k.topComponentPct}% of all failures
        </div>
      </div>

      <div className="pdm-kpi">
        <p className="pdm-kpi-lbl">Avg Recovery Time</p>
        <div>
          <span className="pdm-kpi-val">{k.avgRecoveryHours}</span>
          <span className="pdm-kpi-unit">hrs</span>
        </div>
        <div className="pdm-kpi-foot">
          <Delta now={k.avgRecoveryHours} prev={k.avgRecoveryPrev} lowerBetter /> vs prev period
        </div>
      </div>
    </div>
  );
}
