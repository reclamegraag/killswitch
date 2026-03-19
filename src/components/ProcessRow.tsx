import { ProcessInfo } from "../types";

interface Props {
  process: ProcessInfo;
  killing: boolean;
  onKill: (pid: number) => void;
}

export default function ProcessRow({ process, killing, onKill }: Props) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 hover:bg-white/20 transition group ${killing ? "killing" : ""}`}
    >
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
        {process.icon_base64 ? (
          <img
            src={`data:image/png;base64,${process.icon_base64}`}
            alt=""
            className="w-5 h-5 object-contain"
          />
        ) : (
          <i className="fa-solid fa-window-maximize text-gray-400 text-sm" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-800 truncate">
          {process.name}
        </div>
        <div className="text-[10px] text-gray-400">
          PID {process.pid} &middot; {process.cpu_usage.toFixed(1)}% CPU &middot; {process.memory_mb.toFixed(1)} MB
        </div>
      </div>

      <button
        onClick={() => onKill(process.pid)}
        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-full bg-red-500/80 hover:bg-red-600 text-white transition cursor-pointer"
        title="Kill process"
      >
        <i className="fa-solid fa-power-off text-xs" />
      </button>
    </div>
  );
}
