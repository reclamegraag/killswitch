import { useState, useMemo } from "react";
import { ProcessInfo, SortField, SortDirection } from "../types";

export function useSort(processes: ProcessInfo[]) {
  const [field, setField] = useState<SortField>("name");
  const [direction, setDirection] = useState<SortDirection>("asc");

  const toggle = (f: SortField) => {
    if (f === field) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setField(f);
      setDirection(f === "name" ? "asc" : "desc");
    }
  };

  const sorted = useMemo(() => {
    const mult = direction === "asc" ? 1 : -1;
    return [...processes].sort((a, b) => {
      switch (field) {
        case "name":
          return mult * a.name.localeCompare(b.name);
        case "cpu":
          return mult * (a.cpu_usage - b.cpu_usage);
        case "memory":
          return mult * (a.memory_mb - b.memory_mb);
      }
    });
  }, [processes, field, direction]);

  return { sorted, field, direction, toggle };
}
