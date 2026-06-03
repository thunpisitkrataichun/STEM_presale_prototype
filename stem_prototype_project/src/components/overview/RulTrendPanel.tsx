import { type TrendPoint } from "../../../data/modelData";
import ModelBadge from "./ModelBadge";
import RulTrendChart from "./RulTrendChart";

export default function RulTrendPanel({ data }: { data: TrendPoint[] }) {
  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <span className="pdm-pt">
          RUL Trend (Days To Failure) <ModelBadge inline />
        </span>
      </div>
      <RulTrendChart data={data} />
    </div>
  );
}
