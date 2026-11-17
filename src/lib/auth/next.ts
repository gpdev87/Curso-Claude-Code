// Valida o parâmetro `next` (para onde voltar depois do login).
// Só aceita caminhos internos: começa com "/" e não com "//" nem "/\".
export function safeNext(value: string | string[] | null | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string" || !v.startsWith("/")) return "/";
  if (v.startsWith("//") || v.startsWith("/\\")) return "/";
  return v;
}
