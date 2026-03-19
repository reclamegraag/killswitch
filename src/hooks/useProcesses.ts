import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { ProcessInfo } from "../types";

export function useProcesses() {
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [killingPids, setKillingPids] = useState<Set<number>>(new Set());
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    try {
      const list = await invoke<ProcessInfo[]>("list_processes");
      setProcesses(list);
    } catch (e) {
      console.error("Failed to list processes:", e);
    }
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, 2000);
    return () => clearInterval(intervalRef.current);
  }, [refresh]);

  const killProcess = useCallback(async (pid: number) => {
    setKillingPids((prev) => new Set(prev).add(pid));
    try {
      await invoke("kill_process", { pid });
    } catch (e) {
      console.error("Failed to kill process:", e);
    }
    setTimeout(() => {
      setKillingPids((prev) => {
        const next = new Set(prev);
        next.delete(pid);
        return next;
      });
      refresh();
    }, 250);
  }, [refresh]);

  return { processes, killingPids, killProcess };
}
