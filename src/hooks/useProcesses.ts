import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProcessSnapshot } from "../types";

export interface GroupedProcess {
  name: string;
  count: number;
  pids: number[];
  cpu_usage: number;
  memory_mb: number;
  icon_base64: string | null;
}

const CPU_SMOOTHING = 0.35;

export function useProcesses() {
  const [processes, setProcesses] = useState<GroupedProcess[]>([]);
  const [totalCpuUsage, setTotalCpuUsage] = useState(0);
  const [totalMemoryMb, setTotalMemoryMb] = useState(0);
  const [totalMemoryUsage, setTotalMemoryUsage] = useState(0);
  const [killingNames, setKillingNames] = useState<Set<string>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    try {
      const snapshot = await invoke<ProcessSnapshot>("list_processes");

      const map = new Map<string, GroupedProcess>();
      for (const p of snapshot.processes) {
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

      setProcesses((previous) => {
        const previousCpuByName = new Map(
          previous.map((process) => [process.name, process.cpu_usage])
        );

        return Array.from(map.values()).map((process) => {
          const previousCpu = previousCpuByName.get(process.name);
          return previousCpu === undefined
            ? process
            : {
                ...process,
                cpu_usage:
                  previousCpu * (1 - CPU_SMOOTHING) +
                  process.cpu_usage * CPU_SMOOTHING,
              };
        });
      });
      setTotalCpuUsage(snapshot.total_cpu_usage);
      setTotalMemoryMb(snapshot.total_memory_mb);
      setTotalMemoryUsage(snapshot.total_memory_usage);
    } catch (e) {
      console.error("Failed to list processes:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 1000);
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

  return { processes, killingNames, killByName, totalCpuUsage, totalMemoryMb, totalMemoryUsage };
}
