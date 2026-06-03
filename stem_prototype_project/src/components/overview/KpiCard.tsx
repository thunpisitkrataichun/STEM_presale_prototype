import ModelBadge from "./ModelBadge";

interface KpiProps {
  label: string;
  value: string | number;
  unit?: string;
  foot?: string;
  model?: boolean;
}

export default function KpiCard({ label, value, unit, foot, model }: KpiProps) {
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
