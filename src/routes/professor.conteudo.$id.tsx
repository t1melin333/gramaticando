import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { EditorTexto } from "@/components/EditorTexto";
import { sessaoAtual } from "@/lib/auth.functions";
import { listarNiveis, obterConteudo, salvarConteudo } from "@/lib/conteudos.functions";
import {
  cadastrarExercicio,
  excluirExercicio,
  listarExerciciosDoConteudo,
  type TipoExercicio,
} from "@/lib/exercicios.functions";

export const Route = createFileRoute("/professor/conteudo/$id")({
  ssr: false,
  loader: async ({ params }) => {
    const usuario = await sessaoAtual();
    if (!usuario) throw redirect({ to: "/entrar" });
    if (usuario.tipo !== "professor") throw redirect({ to: "/aluno" });
    const id = Number(params.id);
    const [niveis, conteudo, exercicios] = await Promise.all([
      listarNiveis(),
      obterConteudo({ data: { id } }),
      listarExerciciosDoConteudo({ data: { id_conteudo: id } }),
    ]);
    return { usuario, niveis, conteudo, exercicios };
  },
  head: () => ({
    meta: [
      { title: "Editar conteúdo — Gramaticando" },
      { name: "description", content: "Edite o conteúdo e gerencie exercícios e alternativas." },
      { property: "og:title", content: "Editar conteúdo — Gramaticando" },
      { property: "og:description", content: "Edite o conteúdo e gerencie exercícios e alternativas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditarConteudo,
});

const campo = "mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink";
const rotulo = "block font-mono text-[11px] uppercase tracking-wide text-muted";
const botao = "rounded-md bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper hover:bg-accent/90 disabled:opacity-60";
const secundario = "rounded-md border border-line px-3 py-2 font-mono text-xs uppercase text-ink hover:bg-ink/5";

type Alt = { texto: string; correta: boolean };

function EditarConteudo() {
  const { usuario, niveis, conteudo, exercicios } = Route.useLoaderData();
  const router = useRouter();
  const salvar = useServerFn(salvarConteudo);
  const novoExercicio = useServerFn(cadastrarExercicio);
  const apagarExercicio = useServerFn(excluirExercicio);
  const [aviso, setAviso] = useState("");
  const [erro, setErro] = useState("");
  const [tipo, setTipo] = useState<TipoExercicio>("Multipla Escolha");
  const [alts, setAlts] = useState<Alt[]>([{ texto: "", correta: true }, { texto: "", correta: false }]);

  function mudarTipo(t: TipoExercicio) {
    setTipo(t);
    if (t === "Verdadeiro/Falso") setAlts([{ texto: "Verdadeiro", correta: true }, { texto: "Falso", correta: false }]);
    else if (t === "Multipla Escolha") setAlts([{ texto: "", correta: true }, { texto: "", correta: false }]);
  }

  async function executar(acao: () => Promise<unknown>, sucesso: string) {
    setErro(""); setAviso("");
    try {
      await acao();
      setAviso(sucesso);
      await router.invalidate();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Algo deu errado.");
    }
  }

  function salvarDados(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(e.currentTarget));
    executar(() => salvar({ data: { ...dados, id: conteudo.id } }), "Conteúdo salvo.");
  }

  function adicionarExercicio(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    executar(async () => {
      await novoExercicio({
        data: {
          id_conteudo: conteudo.id,
          pergunta: f.get("pergunta"),
          explicacao: f.get("explicacao"),
          tipo,
          alternativas: tipo === "Dissertativa" ? [] : alts,
        },
      });
      form.reset();
      mudarTipo(tipo);
    }, "Exercício cadastrado.");
  }

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <Link to="/professor" className="mt-8 inline-block font-mono text-xs uppercase text-muted hover:text-ink">← Voltar ao painel</Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">{conteudo.titulo}</h1>
        <div className="mt-4 h-[3px] w-16 bg-accent" />

        {erro ? <p role="alert" className="mt-6 rounded-md border border-accent p-3 text-sm text-accent">{erro}</p> : null}
        {aviso ? <p role="status" className="mt-6 rounded-md border border-line p-3 text-sm text-ink">{aviso}</p> : null}

        <form onSubmit={salvarDados} className="mt-8 space-y-4 rounded-lg border border-line p-5">
          <h2 className="font-display text-2xl font-semibold text-ink">Dados do conteúdo</h2>
          <label className={rotulo}>Título<input name="titulo" required defaultValue={conteudo.titulo} className={campo} /></label>
          <label className={rotulo}>Nível escolar
            <select name="id_nivel" defaultValue={conteudo.id_nivel} className={campo}>
              {niveis.map((n) => <option key={n.id_nivel} value={n.id_nivel}>{n.nome}</option>)}
            </select>
          </label>
          <label className={rotulo}>Resumo<textarea name="resumo" rows={2} defaultValue={conteudo.resumo ?? ""} className={campo} /></label>
          <label className={rotulo}>Explicação<EditorTexto name="explicacao" rows={10} defaultValue={conteudo.explicacao ?? ""} /></label>
          <label className={rotulo}>Link do vídeo<input name="video" type="url" defaultValue={conteudo.video ?? ""} className={campo} /></label>
          <button type="submit" className={botao}>Salvar alterações</button>
        </form>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-ink">Exercícios ({exercicios.length})</h2>
          <ul className="mt-4 space-y-3">
            {exercicios.map((ex, i) => (
              <li key={ex.id_exercicio} className="rounded-lg border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase text-muted">{i + 1}. {ex.tipo}</p>
                    <p className="mt-1 text-ink">{ex.pergunta}</p>
                  </div>
                  <button type="button" className={secundario}
                    onClick={() => confirm("Excluir este exercício?") && executar(() => apagarExercicio({ data: { id_exercicio: ex.id_exercicio } }), "Exercício excluído.")}>
                    Excluir
                  </button>
                </div>
                {ex.alternativas.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {ex.alternativas.map((a) => (
                      <li key={a.id_alternativa} className={a.correta ? "font-semibold text-accent" : "text-muted"}>
                        {a.correta ? "✓ " : "○ "}{a.texto}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>

          <form onSubmit={adicionarExercicio} className="mt-6 space-y-4 rounded-lg border-2 border-dashed border-line p-5">
            <h3 className="font-display text-xl font-semibold text-ink">Novo exercício</h3>
            <label className={rotulo}>Tipo
              <select value={tipo} onChange={(e) => mudarTipo(e.target.value as TipoExercicio)} className={campo}>
                <option value="Multipla Escolha">Múltipla escolha</option>
                <option value="Verdadeiro/Falso">Verdadeiro/Falso</option>
                <option value="Dissertativa">Dissertativa</option>
              </select>
            </label>
            <label className={rotulo}>Pergunta<textarea name="pergunta" required rows={2} className={campo} /></label>
            {tipo !== "Dissertativa" ? (
              <fieldset className="space-y-2">
                <legend className={rotulo}>Alternativas — marque a correta</legend>
                {alts.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correta" checked={a.correta} aria-label={`Alternativa ${i + 1} é a correta`}
                      onChange={() => setAlts(alts.map((x, j) => ({ ...x, correta: j === i })))} />
                    <input value={a.texto} required readOnly={tipo === "Verdadeiro/Falso"} placeholder={`Alternativa ${i + 1}`}
                      onChange={(e) => setAlts(alts.map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)))}
                      className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink" />
                    {tipo === "Multipla Escolha" && alts.length > 2 ? (
                      <button type="button" className={secundario} onClick={() => setAlts(alts.filter((_, j) => j !== i))}>Remover</button>
                    ) : null}
                  </div>
                ))}
                {tipo === "Multipla Escolha" && alts.length < 6 ? (
                  <button type="button" className={secundario} onClick={() => setAlts([...alts, { texto: "", correta: false }])}>+ Alternativa</button>
                ) : null}
              </fieldset>
            ) : null}
            <label className={rotulo}>Explicação da resposta<textarea name="explicacao" rows={2} className={campo} /></label>
            <button type="submit" className={botao}>Cadastrar exercício</button>
          </form>
        </section>
      </main>
      <Rodape />
    </>
  );
}
