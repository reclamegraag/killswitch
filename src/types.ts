export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_mb: number;
  icon_base64: string | null;
}

export interface ProcessSnapshot {
  processes: ProcessInfo[];
  total_cpu_usage: number;
  total_memory_mb: number;
  total_memory_usage: number;
}

export type SortField = "name" | "cpu" | "memory";
export type SortDirection = "asc" | "desc";
