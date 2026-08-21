import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProcessInfo } from "../types";

export interface GroupedProcess {
  name: string;
  count: number;
  pids: number[];
  cpu_usage: number;
  memory_mb: number;
  icon_base64: string | null;
}

const BROWSER_MOCK: GroupedProcess[] = [
  { name: "chrome.exe", count: 12, pids: [1], cpu_usage: 42.1, memory_mb: 812.4, icon_base64: null },
  { name: "Code.exe", count: 8, pids: [2], cpu_usage: 18.3, memory_mb: 540.2, icon_base64: null },
  { name: "Discord.exe", count: 3, pids: [3], cpu_usage: 6.2, memory_mb: 210.5, icon_base64: null },
  { name: "explorer.exe", count: 1, pids: [4], cpu_usage: 1.1, memory_mb: 95.0, icon_base64: null },
  { name: "node.exe", count: 4, pids: [5], cpu_usage: 9.8, memory_mb: 180.3, icon_base64: null },
  { name: "Spotify.exe", count: 2, pids: [6], cpu_usage: 3.4, memory_mb: 156.7, icon_base64: null },
  { name: "Teams.exe", count: 5, pids: [7], cpu_usage: 11.2, memory_mb: 420.1, icon_base64: null },
];

export function useProcesses() {
  const [processes, setProcesses] = useState<GroupedProcess[]>([]);
  const [killingNames, setKillingNames] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    try {
      const list = await invoke<ProcessInfo[]>("list_processes");

      const map = new Map<string, GroupedProcess>();
      for (const p of list) {
        const existing = map.get(p.name);
        if (existing) {
          existing.count++;
          existing.pids.push(p.pid);
          existing.cpu_usage += p.cpu_usage;
          existing.memory_mb += p.memory_mb;
          if (!existing.icon_base64 && p.icon_base64) {
            existing.icon_base64 = p.icon_base64;
          }
        } else {
          map.set(p.name, {
            name: p.name,
            count: 1,
            pids: [p.pid],
            cpu_usage: p.cpu_usage,
            memory_mb: p.memory_mb,
            icon_base64: p.icon_base64,
          });
        }
      }

      setProcesses(Array.from(map.values()));
    } catch (e) {
      // Browser preview (geen Tauri): toon mock data zodat UI te testen is
      if (import.meta.env.DEV) {
        setProcesses(BROWSER_MOCK);
      } else {
        console.error("Failed to list processes:", e);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 2000);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  const killByName = useCallback(async (name: string) => {
    setKillingNames((prev) => new Set(prev).add(name));
    try {
      await invoke("kill_processes_by_name", { name });
    } catch (e) {
      if (import.meta.env.DEV) {
        setProcesses((prev) => prev.filter((p) => p.name !== name));
      } else {
        console.error("Failed to kill processes:", e);
      }
    }
    setTimeout(() => {
      setKillingNames((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
      refresh();
    }, 250);
  }, [refresh]);

  return { processes, killingNames, killByName };
}
