import {
  MACHINES, RUL_TREND, TOTAL_MACHINES, LAST_SYNC,
  statusFromDays, STATUS_COLOR,
  type MachinePrediction, type TrendPoint,
} from "../../data/modelData";
import { IconCpu } from "./icons";
// ── badge บอกว่า "ส่วนนี้ใช้ผลจาก model" ─────────────────
function ModelBadge({ inline }: { inline?: boolean }) {
  return (
    <span className={inline ? "pdm-inline-badge" : "pdm-model-badge"}>
      <IconCpu size={10} />
      Model
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────
interface KpiProps {
  label: string;
  value: string | number;
  unit?: string;
  foot?: string;
  model?: boolean;
}
function KpiCard({ label, value, unit, foot, model }: KpiProps) {
  return (
    <div className={"pdm-kpi" + (model ? " model" : "")}>
      {model && <ModelBadge />}
      <p className="pdm-kpi-lbl">{label}</p>
      <div>
        <span className="pdm-kpi-val">{value}</span>
        {unit && <span className="pdm-kpi-unit">{unit}</span>}
      </div>
      {foot && <div className="pdm-kpi-foot">{foot}</div>}
    </div>
  );
}

// ── RUL trend chart (inline SVG area + line) ──────────────
function RulTrendChart({ data }: { data: TrendPoint[] }) {
  const W = 560,
    H = 150,
    P = 28;
  const max = Math.max(...data.map((d) => d.value)) * 1.15;
  const min = 0;
  const x = (i: number) => P + (i * (W - P * 2)) / (data.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - P * 2);

  const linePts = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const areaPts = `${P},${H - P} ${linePts} ${W - P},${H - P}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="150"
      role="img"
      aria-label="RUL trend chart showing average days to failure over recent weeks"
    >
      {[0.25, 0.5, 0.75, 1].map((g, i) => (
        <line
          key={i}
          x1={P}
          x2={W - P}
          y1={y(max * g)}
          y2={y(max * g)}
          stroke="#eef4fc"
          strokeWidth={1}
        />
      ))}
      <polygon points={areaPts} fill="#e3eefb" />
      <polyline
        points={linePts}
        fill="none"
        stroke="#2a5896"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r={3.5} fill="#2a5896" />
          <text
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            fontSize={9}
            fill="#7790ad"
          >
            {d.label.replace("Week ", "W")}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ── At-risk list ──────────────────────────────────────────
function AtRiskList({ machines }: { machines: MachinePrediction[] }) {
  const top = [...machines]
    .sort((a, b) => a.daysToFailure - b.daysToFailure)
    .slice(0, 5);
  return (
    <>
      {top.map((m) => {
        const st = statusFromDays(m.daysToFailure);
        return (
          <div className="pdm-risk-item" key={m.machineID}>
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

// ── Predictions table ─────────────────────────────────────
function PredictionsTable({ machines }: { machines: MachinePrediction[] }) {
  const rows = [...machines].sort((a, b) => a.daysToFailure - b.daysToFailure);
  return (
    <table className="pdm-table">
      <thead>
        <tr>
          <th>Machine</th>
          <th>Model</th>
          <th>Age</th>
          <th>Days To Failure</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => {
          const st = statusFromDays(m.daysToFailure);
          return (
            <tr key={m.machineID}>
              <td style={{ fontWeight: 600 }}>{m.machineID}</td>
              <td>{m.model}</td>
              <td>{m.age}</td>
              <td className="pdm-days-cell" style={{ color: STATUS_COLOR[st] }}>
                {m.daysToFailure.toFixed(1)}
              </td>
              <td>
                <span className={"pdm-status " + st.toLowerCase()}>{st}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Overview page ─────────────────────────────────────────
export default function Overview() {
  const predictedFailures = MACHINES.filter((m) => m.daysToFailure < 7).length;
  const avgDays =
    MACHINES.reduce((s, m) => s + m.daysToFailure, 0) / MACHINES.length;
  const underMaint = MACHINES.filter((m) => m.underMaintenance).length;

  return (
    <main className="pdm-main">
      <div className="pdm-top">
        <div>
          <h1 className="pdm-title">Overview</h1>
          <p className="pdm-sub">Fleet Health &amp; Remaining Useful Life</p>
        </div>
        <span className="pdm-pill">
          {TOTAL_MACHINES} Machines · Last Sync {LAST_SYNC}
        </span>
      </div>

      <div className="pdm-kpis">
        <KpiCard
          label="Total Machines"
          value={TOTAL_MACHINES}
          foot="Across 4 Models"
        />
        <KpiCard
          label="Predicted Failures < 7 Days"
          value={predictedFailures}
          foot="Immediate Action"
          model
        />
        <KpiCard
          label="Average Days To Failure"
          value={avgDays.toFixed(1)}
          unit="Days"
          foot="Fleet Average"
          model
        />
        <KpiCard
          label="Machines Under Maintenance"
          value={underMaint}
          foot="Currently Serviced"
        />
      </div>

      <div className="pdm-row2">
        <div className="pdm-panel">
          <div className="pdm-phead">
            <span className="pdm-pt">
              RUL Trend (Days To Failure) <ModelBadge inline />
            </span>
          </div>
          <RulTrendChart data={RUL_TREND} />
        </div>
        <div className="pdm-panel">
          <div className="pdm-phead">
            <span className="pdm-pt">
              At-Risk Machines <ModelBadge inline />
            </span>
          </div>
          <AtRiskList machines={MACHINES} />
        </div>
      </div>

      <div className="pdm-table-wrap">
        <div className="pdm-phead">
          <span className="pdm-pt">
            Machine RUL Predictions <ModelBadge inline />
          </span>
          <span className="pdm-pill">Sorted By Days ↑</span>
        </div>
        <PredictionsTable machines={MACHINES} />
      </div>
    </main>
  );
}
