export interface ProcessInfo {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_mb: number;
  icon_base64: string | null;
}

export type SortField = "name" | "cpu" | "memory";
export type SortDirection = "asc" | "desc";
