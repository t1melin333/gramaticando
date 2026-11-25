import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { areaInicial, permiteAcao, podeEstudar } from "./permissoes";

const GESTAO = ["professor", "administrador"];

describe("Permissões", () => {
  test("aluno estuda e responde, mas não gerencia conteúdos", () => {
    strictEqual(permiteAcao("aluno"), true);
    strictEqual(permiteAcao("aluno", ["aluno"]), true);
    strictEqual(permiteAcao("aluno", GESTAO), false);
  });
  test("professor gerencia conteúdos e exercícios", () => {
    strictEqual(permiteAcao("professor"), true);
    strictEqual(permiteAcao("professor", GESTAO), true);
  });
  test("professor não envia respostas de aluno", () => {
    strictEqual(permiteAcao("professor", ["aluno"]), false);
  });
  test("administradores não têm acesso ao site", () => {
    strictEqual(podeEstudar("administrador"), false);
    strictEqual(permiteAcao("administrador", GESTAO), false);
  });
  test("após o login, professor vai para a área do professor", () => {
    strictEqual(areaInicial("professor"), "/professor");
    strictEqual(areaInicial("aluno"), "/aluno");
  });
});
