import { IconCpu } from "../icons";

// Badge that marks a section/value as coming from the ML model.
export default function ModelBadge({ inline }: { inline?: boolean }) {
  return (
    <span className={inline ? "pdm-inline-badge" : "pdm-model-badge"}>
      <IconCpu size={10} />
      Model
    </span>
  );
}
