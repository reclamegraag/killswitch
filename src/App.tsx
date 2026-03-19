import { useState, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import SearchBar from "./components/SearchBar";
import SortControls from "./components/SortControls";
import ProcessList from "./components/ProcessList";
import { useProcesses } from "./hooks/useProcesses";
import { useSort } from "./hooks/useSort";

export default function App() {
  const { processes, killingNames, killByName } = useProcesses();
  const [search, setSearch] = useState("");

  const filtered = processes.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, field, direction, toggle } = useSort(filtered);

  const handleSearch = useCallback((q: string) => setSearch(q), []);

  return (
    <div className="h-full p-2">
      <div
        className="h-full flex flex-col rounded-2xl overflow-hidden border border-white/30"
        style={{
          background: "var(--glass-bg)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        {/* Titlebar */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-4 pt-3 pb-2 select-none flex-shrink-0"
        >
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <i className="fa-solid fa-bolt text-blue-500" style={{ fontSize: 13 }} />
            <span className="text-[13px] font-bold text-gray-700 tracking-tight">KillSwitch</span>
          </div>
          <button
            onClick={() => getCurrentWindow().destroy()}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/15 text-gray-400 hover:text-red-500 transition cursor-pointer"
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 flex-shrink-0">
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Sort */}
        <div className="px-3 pb-1 flex-shrink-0">
          <SortControls field={field} direction={direction} onToggle={toggle} />
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-black/5 flex-shrink-0" />

        {/* Process list */}
        <ProcessList processes={sorted} killingNames={killingNames} onKill={killByName} />

        {/* Footer */}
        <div className="px-4 py-1.5 text-[10px] text-gray-400 text-center flex-shrink-0 border-t border-black/5">
          {filtered.length} of {processes.length} processes
        </div>
      </div>
    </div>
  );
}
