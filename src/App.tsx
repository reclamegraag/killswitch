import { useState, useCallback, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import SearchBar, { SearchBarHandle } from "./components/SearchBar";
import SortControls from "./components/SortControls";
import ProcessList from "./components/ProcessList";
import { useProcesses } from "./hooks/useProcesses";
import { useSort } from "./hooks/useSort";

export default function App() {
  const { processes, killingNames, killByName } = useProcesses();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<SearchBarHandle>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = processes.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, field, direction, toggle } = useSort(filtered);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setSelectedIndex(0);
  }, []);

  // Keep selectedIndex in bounds
  useEffect(() => {
    if (selectedIndex >= sorted.length) {
      setSelectedIndex(Math.max(0, sorted.length - 1));
    }
  }, [sorted.length, selectedIndex]);

  // Global keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape closes the app
      if (e.key === "Escape") {
        if (search) {
          setSearch("");
          searchRef.current?.focus();
        } else {
          getCurrentWindow().destroy();
        }
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, sorted.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      // Kill selected process
      if (e.key === "Enter" || e.key === "Delete") {
        if (sorted[selectedIndex]) {
          e.preventDefault();
          killByName(sorted[selectedIndex].name);
        }
        return;
      }

      // Focus search
      if ((e.ctrlKey && e.key === "f") || e.key === "F3") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }

      // Sort shortcuts
      if (e.ctrlKey && e.key === "1") { e.preventDefault(); toggle("name"); return; }
      if (e.ctrlKey && e.key === "2") { e.preventDefault(); toggle("cpu"); return; }
      if (e.ctrlKey && e.key === "3") { e.preventDefault(); toggle("memory"); return; }

      // Any printable character focuses search
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sorted, selectedIndex, search, killByName, toggle]);

  // Auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="h-full p-2">
      <div
        className="h-full flex flex-col rounded-2xl border border-white/30"
        style={{
          background: "var(--glass-bg)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        {/* Titlebar */}
        <div
          data-tauri-drag-region
          className="flex items-center justify-between px-5 pt-4 pb-2 select-none flex-shrink-0"
        >
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <i className="fa-solid fa-bolt text-blue-500" style={{ fontSize: 13 }} />
            <span className="text-[13px] font-bold text-gray-700 tracking-tight">KillSwitch</span>
          </div>
          <button
            onClick={() => getCurrentWindow().destroy()}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/15 text-gray-400 hover:text-red-500 transition cursor-pointer"
            tabIndex={-1}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 flex-shrink-0">
          <SearchBar onSearch={handleSearch} ref={searchRef} />
        </div>

        {/* Sort */}
        <div className="px-5 pb-2 flex-shrink-0">
          <SortControls field={field} direction={direction} onToggle={toggle} />
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-black/5 flex-shrink-0" />

        {/* Process list — px-2 offsets content from rounded container edge */}
        <ProcessList
          processes={sorted}
          killingNames={killingNames}
          onKill={killByName}
          selectedIndex={selectedIndex}
          listRef={listRef}
        />

        {/* Footer */}
        <div className="px-4 py-1.5 text-[10px] text-gray-400 text-center flex-shrink-0 border-t border-black/5">
          {filtered.length} of {processes.length} processes · <span className="text-gray-300">↑↓ navigate · Enter kill · Esc close</span>
        </div>
      </div>
    </div>
  );
}
