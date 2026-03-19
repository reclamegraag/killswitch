import { SortField, SortDirection } from "../types";

interface Props {
  field: SortField;
  direction: SortDirection;
  onToggle: (field: SortField) => void;
}

const pills: { label: string; value: SortField }[] = [
  { label: "Name", value: "name" },
  { label: "CPU", value: "cpu" },
  { label: "Memory", value: "memory" },
];

export default function SortControls({ field, direction, onToggle }: Props) {
  return (
    <div className="flex gap-2 px-4 mb-3">
      {pills.map((p) => {
        const active = field === p.value;
        return (
          <button
            key={p.value}
            onClick={() => onToggle(p.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
              active
                ? "bg-blue-500/80 text-white shadow-sm"
                : "bg-white/30 text-gray-600 hover:bg-white/50"
            }`}
          >
            {p.label}
            {active && (
              <i
                className={`fa-solid fa-arrow-${direction === "asc" ? "up" : "down"} ml-1 text-[10px]`}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
