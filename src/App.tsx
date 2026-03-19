import { useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import SearchBar from "./components/SearchBar";
import SortControls from "./components/SortControls";
import ProcessList from "./components/ProcessList";
import { useProcesses } from "./hooks/useProcesses";
import { useSort } from "./hooks/useSort";

export default function App() {
  const { processes, killingPids, killProcess } = useProcesses();
  const [search, setSearch] = useState("");

  const filtered = processes.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, field, direction, toggle } = useSort(filtered);

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  return (
    <div className="h-full p-2">
      <div className="h-full flex flex-col rounded-2xl shadow-xl border border-white/30 overflow-hidden"
        style={{ background: "var(--glass-bg)", backdropFilter: "blur(var(--glass-blur))" }}
      >
        {/* Custom titlebar */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-4 py-3 select-none"
        >
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <i className="fa-solid fa-bolt text-blue-500 text-sm" />
            <span className="text-sm font-semibold text-gray-800">KillSwitch</span>
          </div>
          <button
            onClick={() => getCurrentWindow().close()}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-xs" />
          </button>
        </div>

        <SearchBar onSearch={handleSearch} />
        <SortControls field={field} direction={direction} onToggle={toggle} />
        <ProcessList processes={sorted} killingPids={killingPids} onKill={killProcess} />

        <div className="px-4 py-2 text-[10px] text-gray-400 text-center">
          {processes.length} processes
        </div>
      </div>
    </div>
  );
}
