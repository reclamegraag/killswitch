import { useState, useCallback, useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import SearchBar, { SearchBarHandle } from "./components/SearchBar";
import SortControls from "./components/SortControls";
import ProcessList from "./components/ProcessList";
import Tooltip from "./components/Tooltip";
import { useProcesses } from "./hooks/useProcesses";
import { useSort } from "./hooks/useSort";

export default function App() {
  const { processes, killingNames, killByName, totalCpuUsage, totalMemoryMb, totalMemoryUsage } = useProcesses();
  const [search, setSearch] = useState("");
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const searchRef = useRef<SearchBarHandle>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = processes.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const { sorted, field, direction, toggle } = useSort(filtered);

  // Resolve selectedName to current index — -1 when nothing is selected
  const selectedIndex =
    selectedName !== null ? sorted.findIndex((p) => p.name === selectedName) : -1;

  // Clear selection if the list is empty or the selected process disappeared
  useEffect(() => {
    if (sorted.length === 0) {
      setSelectedName(null);
    } else if (selectedName !== null && !sorted.some((p) => p.name === selectedName)) {
      setSelectedName(null);
    }
  }, [sorted, selectedName]);

  const selectByIndex = useCallback((indexFn: (current: number) => number) => {
    const current = selectedIndex >= 0 ? selectedIndex : -1;
    const newIndex = Math.max(0, Math.min(indexFn(current), sorted.length - 1));
    setSelectedName(sorted[newIndex]?.name ?? null);
  }, [selectedIndex, sorted]);

  const handleSelect = useCallback((name: string) => {
    setSelectedName((prev) => (prev === name ? null : name));
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearch(q);
    setSelectedName(null);
  }, []);

  // Global keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Escape closes the app
      if (e.key === "Escape") {
        if (search) {
          searchRef.current?.clear();
        } else {
          getCurrentWindow().hide();
        }
        return;
      }

      // Arrow navigation
      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectByIndex((i) => i + 1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        selectByIndex((i) => i - 1);
        return;
      }

      // Page navigation (10 items per page)
      if (e.key === "PageDown") {
        e.preventDefault();
        selectByIndex((i) => i + 10);
        return;
      }
      if (e.key === "PageUp") {
        e.preventDefault();
        selectByIndex((i) => i - 10);
        return;
      }

      // Home / End
      if (e.key === "Home") {
        e.preventDefault();
        selectByIndex(() => 0);
        return;
      }
      if (e.key === "End") {
        e.preventDefault();
        selectByIndex(() => sorted.length - 1);
        return;
      }

      // Kill selected process
      if (e.key === "Enter" || e.key === "Delete") {
        if (selectedIndex >= 0 && sorted[selectedIndex]) {
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
  }, [sorted, selectedIndex, search, killByName, toggle, selectByIndex]);

  // Auto-focus search on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

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
          className="flex items-center justify-between px-5 pt-4 pb-2 select-none flex-shrink-0"
        >
          <div className="flex items-center gap-2" data-tauri-drag-region>
            <i className="fa-solid fa-bolt text-blue-500" style={{ fontSize: 13 }} />
            <span className="text-[13px] font-bold text-gray-700 tracking-tight">KillSwitch</span>
          </div>
          <Tooltip content="Sluiten" shortcut={["Esc"]} position="bottom">
            <button
              onClick={() => getCurrentWindow().hide()}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/15 text-gray-400 hover:text-red-500 transition cursor-pointer"
              tabIndex={-1}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
            </button>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="px-5 flex-shrink-0">
          <SearchBar onSearch={handleSearch} ref={searchRef} />
        </div>

        {/* Sort */}
        <div className="px-5 pb-2 flex-shrink-0">
          <SortControls
            field={field}
            direction={direction}
            onToggle={toggle}
            totalCpuUsage={totalCpuUsage}
            totalMemoryMb={totalMemoryMb}
            totalMemoryUsage={totalMemoryUsage}
          />
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-black/5 flex-shrink-0" />

        {/* Process list — px-2 offsets content from rounded container edge */}
        <ProcessList
          processes={sorted}
          killingNames={killingNames}
          onKill={killByName}
          onSelect={handleSelect}
          selectedIndex={selectedIndex}
          listRef={listRef}
        />

        {/* Footer */}
        <div className="px-4 py-1.5 text-[10px] text-gray-400 text-center flex-shrink-0 border-t border-black/5">
          {filtered.length} of {processes.length} processes · <span className="text-gray-300">↑↓ PgUp/Dn navigate · Enter kill · Esc close</span>
        </div>
      </div>
    </div>
  );
}
