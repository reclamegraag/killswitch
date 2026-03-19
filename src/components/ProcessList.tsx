import { useEffect, RefObject } from "react";
import { GroupedProcess } from "../hooks/useProcesses";
import ProcessRow from "./ProcessRow";

interface Props {
  processes: GroupedProcess[];
  killingNames: Set<string>;
  onKill: (name: string) => void;
  selectedIndex: number;
  listRef: RefObject<HTMLDivElement | null>;
}

export default function ProcessList({ processes, killingNames, onKill, selectedIndex, listRef }: Props) {
  // Auto-scroll selected item into view
  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    const row = container.children[selectedIndex] as HTMLElement | undefined;
    if (row) {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, listRef]);

  if (processes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No processes found
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-2" ref={listRef}>
      {processes.map((p, i) => (
        <ProcessRow
          key={p.name}
          process={p}
          killing={killingNames.has(p.name)}
          onKill={onKill}
          selected={i === selectedIndex}
        />
      ))}
    </div>
  );
}
