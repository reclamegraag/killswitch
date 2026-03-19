import { ProcessInfo } from "../types";

interface Props {
  process: ProcessInfo;
  killing: boolean;
  onKill: (pid: number) => void;
}

export default function ProcessRow({ process, killing, onKill }: Props) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-[7px] hover:bg-black/[0.03] transition-all group ${killing ? "killing" : ""}`}
    >
      {/* Icon */}
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
        {process.icon_base64 ? (
          <img
            src={`data:image/png;base64,${process.icon_base64}`}
            alt=""
            className="w-4 h-4 object-contain"
          />
        ) : (
          <i className="fa-regular fa-window-maximize text-gray-300" style={{ fontSize: 12 }} />
        )}
      </div>

      {/* Name + details */}
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-gray-700 truncate leading-tight">
          {process.name}
        </div>
        <div className="text-[10px] text-gray-400 leading-tight">
          PID {process.pid} · {process.cpu_usage.toFixed(1)}% · {process.memory_mb.toFixed(1)} MB
        </div>
      </div>

      {/* Kill button */}
      <button
        onClick={() => onKill(process.pid)}
        className="opacity-0 group-hover:opacity-100 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-red-500/80 hover:bg-red-600 text-white transition-all cursor-pointer"
        title="Kill process"
      >
        <i className="fa-solid fa-power-off" style={{ fontSize: 9 }} />
      </button>
    </div>
  );
}
