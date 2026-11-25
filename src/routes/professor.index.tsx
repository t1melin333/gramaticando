import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Cabecalho } from "@/components/Cabecalho";
import { Rodape } from "@/components/Rodape";
import { EditorTexto } from "@/components/EditorTexto";
import { EtiquetaNivel } from "@/components/EtiquetaNivel";
import { sessaoAtual } from "@/lib/auth.functions";
import { listarConteudos, listarNiveis, salvarConteudo, excluirConteudo } from "@/lib/conteudos.functions";
import { respostasDosAlunos } from "@/lib/exercicios.functions";

export const Route = createFileRoute("/professor/")({
  ssr: false,
  loader: async () => {
    const usuario = await sessaoAtual();
    if (!usuario) throw redirect({ to: "/entrar" });
    if (usuario.tipo !== "professor") throw redirect({ to: "/aluno" });
    const [niveis, conteudos, respostas] = await Promise.all([
      listarNiveis(),
      listarConteudos({ data: { id_nivel: null, apenasMeus: true } }),
      respostasDosAlunos({ data: { id_conteudo: null } }),
    ]);
    return { usuario, niveis, conteudos, respostas };
  },
  head: () => ({
    meta: [
      { title: "Painel do professor — Gramaticando" },
      { name: "description", content: "Cadastre conteúdos e exercícios e acompanhe as respostas dos alunos." },
      { property: "og:title", content: "Painel do professor — Gramaticando" },
      { property: "og:description", content: "Cadastre conteúdos e exercícios e acompanhe as respostas dos alunos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PainelProfessor,
});

const campo = "mt-1 w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink";
const rotulo = "block font-mono text-[11px] uppercase tracking-wide text-muted";
const botao = "rounded-md bg-accent px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper hover:bg-accent/90 disabled:opacity-60";

function PainelProfessor() {
  const { usuario, niveis, conteudos, respostas } = Route.useLoaderData();
  const router = useRouter();
  const salvar = useServerFn(salvarConteudo);
  const excluir = useServerFn(excluirConteudo);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function criar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setErro("");
    setEnviando(true);
    try {
      const { id } = await salvar({ data: Object.fromEntries(f) });
      form.reset();
      router.navigate({ to: "/professor/conteudo/$id", params: { id: String(id) } });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover(id: number) {
    if (!confirm("Excluir este conteúdo e todos os seus exercícios?")) return;
    try {
      await excluir({ data: { id } });
      await router.invalidate();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  return (
    <>
      <Cabecalho usuario={usuario} />
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="pt-12 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Área do professor</p>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
            Olá, {usuario.nome.split(" ")[0]}
          </h1>
          <div className="mt-4 h-[3px] w-16 bg-accent" />
        </section>

        {erro ? <p role="alert" className="mb-6 rounded-md border border-accent p-3 text-sm text-accent">{erro}</p> : null}

        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <form onSubmit={criar} className="space-y-4 rounded-lg border border-line p-5">
            <h2 className="font-display text-2xl font-semibold text-ink">Novo conteúdo</h2>
            <label className={rotulo}>Título<input name="titulo" required maxLength={255} className={campo} /></label>
            <label className={rotulo}>Nível escolar
              <select name="id_nivel" required className={campo}>
                {niveis.map((n) => <option key={n.id_nivel} value={n.id_nivel}>{n.nome}</option>)}
              </select>
            </label>
            <label className={rotulo}>Resumo<textarea name="resumo" rows={2} maxLength={2000} className={campo} /></label>
            <label className={rotulo}>Explicação<EditorTexto name="explicacao" rows={8} /></label>
            <label className={rotulo}>Link do vídeo (opcional)<input name="video" type="url" placeholder="https://" className={campo} /></label>
            <button type="submit" disabled={enviando} className={botao}>{enviando ? "Salvando…" : "Cadastrar conteúdo"}</button>
          </form>

          <section>
            <h2 className="font-display text-2xl font-semibold text-ink">Meus conteúdos</h2>
            {conteudos.length === 0 ? (
              <p className="mt-4 rounded-md border border-dashed border-line p-6 text-sm text-muted">Você ainda não cadastrou conteúdos.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {conteudos.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-4">
                    <div>
                      <EtiquetaNivel idNivel={c.id_nivel} nome={niveis.find((n) => n.id_nivel === c.id_nivel)?.nome} />
                      <p className="mt-2 font-display text-lg font-semibold text-ink">{c.titulo}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/professor/conteudo/$id" params={{ id: String(c.id) }} className={botao}>Editar e exercícios</Link>
                      <button type="button" onClick={() => remover(c.id)} className="rounded-md border border-line px-3 py-2 font-mono text-xs uppercase text-ink hover:bg-ink/5">Excluir</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-ink">Respostas dos alunos</h2>
          {respostas.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-line p-6 text-sm text-muted">Nenhuma resposta nos seus exercícios ainda.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-[11px] uppercase tracking-wide text-muted">
                  <tr><th className="py-2 pr-4">Aluno</th><th className="pr-4">Conteúdo</th><th className="pr-4">Pergunta</th><th className="pr-4">Resposta</th><th className="pr-4">Resultado</th><th>Nota</th></tr>
                </thead>
                <tbody>
                  {respostas.map((r) => (
                    <tr key={r.id_resposta} className="border-t border-line align-top text-ink">
                      <td className="py-2 pr-4">{r.aluno}</td>
                      <td className="pr-4">{r.conteudo}</td>
                      <td className="pr-4">{r.pergunta}</td>
                      <td className="pr-4">{r.resposta ?? "—"}</td>
                      <td className="pr-4">{r.acertou == null ? "Para correção" : r.acertou ? "Acertou" : "Errou"}</td>
                      <td>{r.nota ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Rodape />
    </>
  );
}
