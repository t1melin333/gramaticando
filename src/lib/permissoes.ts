export function podeEstudar(tipo: string): boolean {
  return tipo === "aluno" || tipo === "professor";
}

/** Sem lista: qualquer conta de estudo. Com lista: apenas os tipos listados (administrador nunca entra). */
export function permiteAcao(tipo: string, tipos?: readonly string[]): boolean {
  return podeEstudar(tipo) && (!tipos || tipos.includes(tipo));
}

export function areaInicial(tipo: string): "/professor" | "/aluno" {
  return tipo === "professor" ? "/professor" : "/aluno";
}
