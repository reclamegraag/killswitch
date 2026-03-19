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
    <div className="flex gap-1.5 mb-2">
      {pills.map((p) => {
        const active = field === p.value;
        return (
          <button
            key={p.value}
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
        );
      })}
    </div>
  );
}
