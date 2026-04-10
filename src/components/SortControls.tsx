import { SortField, SortDirection } from "../types";
import Tooltip from "./Tooltip";

interface Props {
  field: SortField;
  direction: SortDirection;
  onToggle: (field: SortField) => void;
}

const pills: { label: string; value: SortField; keyIndex: number }[] = [
  { label: "Name", value: "name", keyIndex: 1 },
  { label: "CPU", value: "cpu", keyIndex: 2 },
  { label: "Memory", value: "memory", keyIndex: 3 },
];

export default function SortControls({ field, direction, onToggle }: Props) {
  return (
    <div className="flex gap-1.5 mb-2">
      {pills.map((p) => {
        const active = field === p.value;
        return (
          <Tooltip key={p.value} content={`Sorteer op ${p.label}`} shortcut={["Ctrl", p.keyIndex.toString()]} position="bottom">
            <button
              onClick={() => onToggle(p.value)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                active
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-black/[0.04] text-gray-500 hover:bg-black/[0.07]"
              }`}
            >
              {p.label}
              {active && (
                <i
                  className={`fa-solid fa-chevron-${direction === "asc" ? "up" : "down"} ml-1`}
                  style={{ fontSize: 8 }}
                />
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
