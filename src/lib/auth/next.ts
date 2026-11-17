// Valida o parâmetro `next` (para onde voltar depois do login).
// Só aceita caminhos internos: começa com "/" e não com "//" nem "/\".
export function safeNext(value: string | string[] | null | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  if (typeof v !== "string" || !v.startsWith("/")) return "/";
  // Controles, espaços e "\" são removidos/convertidos pelos navegadores
  // (por exemplo, "/<TAB>/evil.com" vira "//evil.com"), então não passam.
  if (/[\x00-\x20\x7f-\x9f\\]/.test(v)) return "/";
  if (v.startsWith("//")) return "/";
  // Confirma que continua no mesmo site depois de interpretado como URL.
  try {
    const u = new URL(v, "http://x");
    if (u.origin !== "http://x") return "/";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/";
  }
}
