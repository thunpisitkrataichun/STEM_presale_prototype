import { type TrendPoint } from "../../../data/modelData";
import ModelBadge from "./ModelBadge";
import RulTrendChart from "./RulTrendChart";

export default function RulTrendPanel({ data }: { data: TrendPoint[] }) {
  return (
    <div className="pdm-panel">
      <div className="pdm-phead">
        <div>
          <span className="pdm-pt">
            Avg Days To Failure <ModelBadge inline />
          </span>
          <div className="pdm-phead-sub">Fleet-wide average · last 8 weeks</div>
        </div>
      </div>
      <RulTrendChart data={data} />
    </div>
  );
}
