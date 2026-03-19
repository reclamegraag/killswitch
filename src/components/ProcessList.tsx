import { ProcessInfo } from "../types";
import ProcessRow from "./ProcessRow";

interface Props {
  processes: ProcessInfo[];
  killingPids: Set<number>;
  onKill: (pid: number) => void;
}

export default function ProcessList({ processes, killingPids, onKill }: Props) {
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
          key={p.pid}
          process={p}
          killing={killingPids.has(p.pid)}
          onKill={onKill}
        />
      ))}
    </div>
  );
}
