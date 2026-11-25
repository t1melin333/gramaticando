import { useRef, useState } from "react";
import { TextoFormatado } from "./TextoFormatado";

type Acao = { rotulo: string; titulo: string; antes: string; depois?: string; linha?: boolean; exemplo: string };

const ACOES: Acao[] = [
  { rotulo: "B", titulo: "Negrito", antes: "**", depois: "**", exemplo: "texto em negrito" },
  { rotulo: "I", titulo: "Itálico", antes: "*", depois: "*", exemplo: "texto em itálico" },
  { rotulo: "T1", titulo: "Título grande", antes: "## ", linha: true, exemplo: "Título" },
  { rotulo: "T2", titulo: "Subtítulo", antes: "### ", linha: true, exemplo: "Subtítulo" },
  { rotulo: "• Lista", titulo: "Lista com marcadores", antes: "- ", linha: true, exemplo: "item" },
  { rotulo: "1. Lista", titulo: "Lista numerada", antes: "1. ", linha: true, exemplo: "item" },
  { rotulo: "❝ Citação", titulo: "Citação ou exemplo", antes: "> ", linha: true, exemplo: "exemplo" },
];

export function EditorTexto({ name, defaultValue = "", rows = 8 }: { name: string; defaultValue?: string; rows?: number }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [texto, setTexto] = useState(defaultValue);
  const [previa, setPrevia] = useState(false);

  function aplicar(a: Acao) {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: ini, selectionEnd: fim, value } = el;
    const selecionado = value.slice(ini, fim) || a.exemplo;
    let novo: string;
    let cursorIni: number;
    if (a.linha) {
      const inicioLinha = value.lastIndexOf("\n", ini - 1) + 1;
      const trecho = value.slice(inicioLinha, fim) || a.exemplo;
      const formatado = trecho.split("\n").map((l) => a.antes + l).join("\n");
      novo = value.slice(0, inicioLinha) + formatado + value.slice(Math.max(fim, inicioLinha));
      cursorIni = inicioLinha;
      setTexto(novo);
      requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursorIni, cursorIni + formatado.length); });
      return;
    }
    novo = value.slice(0, ini) + a.antes + selecionado + (a.depois ?? "") + value.slice(fim);
    cursorIni = ini + a.antes.length;
    setTexto(novo);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(cursorIni, cursorIni + selecionado.length); });
  }

  const botao = "rounded border border-line px-2.5 py-1 font-mono text-xs text-ink hover:bg-ink/5";
  return (
    <div className="mt-1">
      <div role="toolbar" aria-label="Formatação do texto" className="flex flex-wrap gap-1.5 rounded-t-md border border-b-0 border-line bg-paper p-2">
        {ACOES.map((a) => (
          <button key={a.titulo} type="button" title={a.titulo} aria-label={a.titulo} disabled={previa} onClick={() => aplicar(a)}
            className={`${botao} ${a.rotulo === "B" ? "font-bold" : a.rotulo === "I" ? "italic" : ""} disabled:opacity-40`}>
            {a.rotulo}
          </button>
        ))}
        <button type="button" onClick={() => setPrevia((p) => !p)} aria-pressed={previa} className={`${botao} ml-auto`}>
          {previa ? "Editar" : "Pré-visualizar"}
        </button>
      </div>
      {previa ? (
        <div className="min-h-32 rounded-b-md border border-line bg-paper px-3 py-2 text-sm text-ink">
          {texto.trim() ? <TextoFormatado texto={texto} /> : <p className="text-muted">Nada escrito ainda.</p>}
        </div>
      ) : null}
      <textarea ref={ref} name={name} rows={rows} value={texto} onChange={(e) => setTexto(e.target.value)}
        hidden={previa}
        className="w-full rounded-b-md border border-line bg-paper px-3 py-2 text-sm text-ink" />
    </div>
  );
}
