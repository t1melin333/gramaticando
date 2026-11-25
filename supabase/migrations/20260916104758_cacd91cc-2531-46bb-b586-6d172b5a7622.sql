CREATE TYPE public.usuario_tipo AS ENUM ('aluno','professor','administrador');
CREATE TYPE public.exercicio_tipo AS ENUM ('Multipla Escolha','Dissertativa','Verdadeiro/Falso');

CREATE TABLE public.usuario (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  tel VARCHAR(20),
  senha VARCHAR(255) NOT NULL,
  data_nascimento DATE,
  tipo public.usuario_tipo NOT NULL DEFAULT 'aluno'
);
GRANT ALL ON public.usuario TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.usuario_id_seq TO service_role;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.niveis (
  id_nivel SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL
);
GRANT ALL ON public.niveis TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.niveis_id_nivel_seq TO service_role;
ALTER TABLE public.niveis ENABLE ROW LEVEL SECURITY;

INSERT INTO public.niveis (id_nivel, nome) VALUES
  (1, 'Ensino Fundamental I'),
  (2, 'Ensino Fundamental II'),
  (3, 'Ensino Médio');
SELECT setval('public.niveis_id_nivel_seq', 3, true);

CREATE TABLE public.conteudos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  resumo TEXT,
  explicacao TEXT,
  video VARCHAR(255),
  data_publicacao DATE NOT NULL DEFAULT CURRENT_DATE,
  id_nivel INT NOT NULL REFERENCES public.niveis(id_nivel),
  id_usuario INT REFERENCES public.usuario(id) ON DELETE SET NULL
);
GRANT ALL ON public.conteudos TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.conteudos_id_seq TO service_role;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
CREATE INDEX conteudos_id_nivel_idx ON public.conteudos (id_nivel);

CREATE TABLE public.exercicios (
  id_exercicio SERIAL PRIMARY KEY,
  pergunta TEXT NOT NULL,
  tipo public.exercicio_tipo NOT NULL DEFAULT 'Multipla Escolha',
  explicacao TEXT,
  id_conteudo INT NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE
);
GRANT ALL ON public.exercicios TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.exercicios_id_exercicio_seq TO service_role;
ALTER TABLE public.exercicios ENABLE ROW LEVEL SECURITY;
CREATE INDEX exercicios_id_conteudo_idx ON public.exercicios (id_conteudo);

CREATE TABLE public.alternativas (
  id_alternativa SERIAL PRIMARY KEY,
  texto TEXT NOT NULL,
  correta BOOLEAN NOT NULL DEFAULT false,
  id_exercicio INT NOT NULL REFERENCES public.exercicios(id_exercicio) ON DELETE CASCADE
);
GRANT ALL ON public.alternativas TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.alternativas_id_alternativa_seq TO service_role;
ALTER TABLE public.alternativas ENABLE ROW LEVEL SECURITY;
CREATE INDEX alternativas_id_exercicio_idx ON public.alternativas (id_exercicio);

CREATE TABLE public.respostas (
  id_resposta SERIAL PRIMARY KEY,
  resposta TEXT,
  nota DECIMAL(5,2),
  acertou BOOLEAN,
  feedback TEXT,
  data_resposta TIMESTAMP NOT NULL DEFAULT now(),
  id_usuario INT NOT NULL REFERENCES public.usuario(id) ON DELETE CASCADE,
  id_exercicio INT NOT NULL REFERENCES public.exercicios(id_exercicio) ON DELETE CASCADE
);
GRANT ALL ON public.respostas TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.respostas_id_resposta_seq TO service_role;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;
CREATE INDEX respostas_id_usuario_idx ON public.respostas (id_usuario);
CREATE INDEX respostas_id_exercicio_idx ON public.respostas (id_exercicio);