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
      console.error("Failed to list processes:", e);
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
      console.error("Failed to kill processes:", e);
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
