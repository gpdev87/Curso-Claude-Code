import type { MarkStatus } from "@/lib/marks-rules";

export function parseListTab(value: string | string[] | undefined): MarkStatus {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "visto" ? "visto" : "quero";
}
