import { useState } from "react";

interface Props {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}

// Layout: «  ‹  1 ... 4 5 6 ... 20  ›  »
// Clicking an ellipsis swaps it for a numeric input so the user can jump anywhere.
export default function Pagination({ page, totalPages, onChange }: Props) {
  const [editing, setEditing] = useState<"L" | "R" | null>(null);
  const [val, setVal] = useState("");

  if (totalPages <= 1) return <></>;

  // Always render: page 1, last page, and current ± 1
  const shown = new Set<number>([1, totalPages]);
  for (let p = page - 1; p <= page + 1; p++) {
    if (p >= 1 && p <= totalPages) shown.add(p);
  }
  const sorted = [...shown].sort((a, b) => a - b);

  type Item = { kind: "page"; n: number } | { kind: "gap"; side: "L" | "R" };
  const items: Item[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      items.push({ kind: "gap", side: sorted[i] <= page ? "L" : "R" });
    }
    items.push({ kind: "page", n: sorted[i] });
  }

  const submit = () => {
    const n = parseInt(val, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= totalPages) onChange(n);
    setEditing(null);
    setVal("");
  };

  return (
    <>
      <button className="pdm-page-btn" onClick={() => onChange(1)}
              disabled={page === 1} aria-label="First page">«</button>
      <button className="pdm-page-btn" onClick={() => onChange(page - 1)}
              disabled={page === 1} aria-label="Previous page">‹</button>

      {items.map((it, i) => {
        if (it.kind === "gap") {
          if (editing === it.side) {
            return (
              <input
                key={`gap-${i}`}
                className="pdm-page-input"
                type="number"
                min={1}
                max={totalPages}
                value={val}
                autoFocus
                onChange={(e) => setVal(e.target.value)}
                onBlur={submit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                  else if (e.key === "Escape") { setEditing(null); setVal(""); }
                }}
              />
            );
          }
          return (
            <button
              key={`gap-${i}`}
              className="pdm-page-ellipsis"
              onClick={() => { setEditing(it.side); setVal(""); }}
              aria-label="Jump to page"
              title="Click to enter a page number"
            >…</button>
          );
        }
        return (
          <button
            key={it.n}
            className={"pdm-page-btn" + (it.n === page ? " active" : "")}
            onClick={() => onChange(it.n)}
            aria-current={it.n === page ? "page" : undefined}
          >{it.n}</button>
        );
      })}

      <button className="pdm-page-btn" onClick={() => onChange(page + 1)}
              disabled={page === totalPages} aria-label="Next page">›</button>
      <button className="pdm-page-btn" onClick={() => onChange(totalPages)}
              disabled={page === totalPages} aria-label="Last page">»</button>
    </>
  );
}
