import { GroupedProcess } from "../hooks/useProcesses";
import ProcessRow from "./ProcessRow";

interface Props {
  processes: GroupedProcess[];
  killingNames: Set<string>;
  onKill: (name: string) => void;
}

export default function ProcessList({ processes, killingNames, onKill }: Props) {
  if (processes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        No processes found
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {processes.map((p) => (
        <ProcessRow
          key={p.name}
          process={p}
          killing={killingNames.has(p.name)}
          onKill={onKill}
        />
      ))}
    </div>
  );
}
