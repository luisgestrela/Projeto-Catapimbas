create type status_instituicao as enum ('ativa', 'suspensa');
create type status_usuario as enum ('ativo', 'bloqueado');
create type situacao_vinculo as enum ('pendente', 'ativo', 'recusado', 'bloqueado', 'revogado');
create type status_projeto as enum ('ativo', 'arquivado');
create type resultado_banca as enum ('rascunho', 'publicado');
create type status_avaliacao as enum ('rascunho', 'enviada', 'substituida', 'anulada');

create table papel (
  codigo text primary key,
  nome text not null
);

create table permissao (
  codigo text primary key,
  descricao text not null
);

create table papel_permissao (
  papel_codigo text not null references papel (codigo),
  permissao_codigo text not null references permissao (codigo),
  primary key (papel_codigo, permissao_codigo)
);

create table instituicao (
  id bigint generated always as identity primary key,
  nome varchar not null,
  identificador varchar not null,
  status status_instituicao not null default 'ativa',
  cor_primaria varchar not null default '#0f5e73' check (cor_primaria ~ '^#[0-9a-fA-F]{6}$'),
  logo_url text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint instituicao_identificador_uk unique (identificador),
  constraint instituicao_identificador_ck check (identificador ~ '^[a-z0-9][a-z0-9-]*$')
);

create table usuario (
  id bigint generated always as identity primary key,
  nome varchar not null,
  email varchar not null,
  senha_hash text not null,
  status status_usuario not null default 'ativo',
 is_superadmin boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create unique index usuario_email_uk on usuario (lower(email));

create table vinculo_institucional (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  usuario_id bigint not null references usuario (id),
  papel text not null references papel (codigo),
  situacao situacao_vinculo not null default 'pendente',
  justificativa text,
  solicitado_em timestamptz not null default now(),
  decidido_em timestamptz,
  decidido_por bigint references usuario (id),
  constraint vinculo_uk unique (instituicao_id, usuario_id),
  constraint vinculo_tenant_uk unique (id, instituicao_id),
  constraint vinculo_recusa_ck check (situacao <> 'recusado' or coalesce(length(trim(justificativa)), 0) > 0)
);
create index vinculo_usuario_idx on vinculo_institucional (usuario_id);

create table projeto (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  nome varchar not null,
  descricao text,
  ano int2 not null check (ano between 2000 and 2100),
  semestre varchar(1) not null check (semestre in ('1', '2')),
  status status_projeto not null default 'ativo',
  criado_por bigint references usuario (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  arquivado_em timestamptz,
  constraint projeto_tenant_uk unique (id, instituicao_id)
);
create index projeto_inst_idx on projeto (instituicao_id, ano, semestre);

create table equipe (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  projeto_id bigint not null,
  nome varchar not null,
  criado_em timestamptz not null default now(),
  constraint equipe_projeto_uk unique (projeto_id),
  constraint equipe_tenant_uk unique (id, instituicao_id),
  constraint equipe_projeto_fk foreign key (projeto_id, instituicao_id) references projeto (id, instituicao_id) on delete cascade
);

create table integrante (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  equipe_id bigint not null,
  usuario_id bigint not null references usuario (id),
  funcao varchar not null default 'Aluno',
  criado_em timestamptz not null default now(),
  constraint integrante_uk unique (equipe_id, usuario_id),
  constraint integrante_equipe_fk foreign key (equipe_id, instituicao_id) references equipe (id, instituicao_id) on delete cascade
);
create index integrante_usuario_idx on integrante (usuario_id);

create table orientacao (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  projeto_id bigint not null,
  orientador_id bigint not null references usuario (id),
  criado_em timestamptz not null default now(),
  constraint orientacao_projeto_uk unique (projeto_id),
  constraint orientacao_projeto_fk foreign key (projeto_id, instituicao_id) references projeto (id, instituicao_id) on delete cascade
);
create index orientacao_orientador_idx on orientacao (orientador_id);

create table instrumento (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  nome varchar not null,
  descricao text,
  arquivado_em timestamptz,
  criado_por bigint references usuario (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint instrumento_tenant_uk unique (id, instituicao_id)
);

create table criterio (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  instrumento_id bigint not null,
  ordem int2 not null default 1,
  arquivado_em timestamptz,
  criado_em timestamptz not null default now(),
  constraint criterio_tenant_uk unique (id, instituicao_id),
  constraint criterio_instrumento_fk foreign key (instrumento_id, instituicao_id) references instrumento (id, instituicao_id)
);
create index criterio_instrumento_idx on criterio (instrumento_id);

create table criterio_versao (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  criterio_id bigint not null,
  versao int4 not null default 1,
  titulo varchar not null,
  descricao text,
  nota_min int2 not null default 1,
  nota_max int2 not null default 5,
  peso_sugerido numeric(6, 2) not null default 1 check (peso_sugerido > 0),
  criado_por bigint references usuario (id),
  criado_em timestamptz not null default now(),
  constraint criterio_versao_uk unique (criterio_id, versao),
  constraint criterio_versao_tenant_uk unique (id, instituicao_id),
  constraint criterio_versao_escala_ck check (nota_min < nota_max),
  constraint criterio_versao_criterio_fk foreign key (criterio_id, instituicao_id) references criterio (id, instituicao_id)
);

create table descritor (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  criterio_versao_id bigint not null,
  nota int2 not null,
  texto text not null,
  constraint descritor_uk unique (criterio_versao_id, nota),
  constraint descritor_versao_fk foreign key (criterio_versao_id, instituicao_id) references criterio_versao (id, instituicao_id) on delete cascade
);

create table banca (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  instrumento_id bigint not null,
  nome varchar not null,
  inicio date not null,
  fim date not null,
  resultado resultado_banca not null default 'rascunho',
  criterio_desempate varchar not null default 'maior_nota_criterio_de_maior_peso',
  publicado_em timestamptz,
  publicado_por bigint references usuario (id),
  criado_por bigint references usuario (id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint banca_tenant_uk unique (id, instituicao_id),
  constraint banca_periodo_ck check (fim >= inicio),
  constraint banca_instrumento_fk foreign key (instrumento_id, instituicao_id) references instrumento (id, instituicao_id)
);
create index banca_inst_idx on banca (instituicao_id, inicio);

create table banca_projeto (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  banca_id bigint not null,
  projeto_id bigint not null,
  elegivel boolean not null default true,
  motivo_inelegibilidade text,
  ordem_apresentacao int2,
  criado_em timestamptz not null default now(),
  constraint banca_projeto_uk unique (banca_id, projeto_id),
  constraint banca_projeto_tenant_uk unique (id, instituicao_id),
  constraint banca_projeto_banca_fk foreign key (banca_id, instituicao_id) references banca (id, instituicao_id) on delete cascade,
  constraint banca_projeto_projeto_fk foreign key (projeto_id, instituicao_id) references projeto (id, instituicao_id)
);
create index banca_projeto_projeto_idx on banca_projeto (projeto_id);

create table banca_avaliador (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  banca_id bigint not null,
  vinculo_id bigint not null,
  designado_em timestamptz not null default now(),
  designado_por bigint references usuario (id),
  constraint banca_avaliador_uk unique (banca_id, vinculo_id),
  constraint banca_avaliador_tenant_uk unique (id, instituicao_id),
  constraint banca_avaliador_banca_fk foreign key (banca_id, instituicao_id) references banca (id, instituicao_id) on delete cascade,
  constraint banca_avaliador_vinculo_fk foreign key (vinculo_id, instituicao_id) references vinculo_institucional (id, instituicao_id)
);

create table banca_criterio (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  banca_id bigint not null,
  criterio_versao_id bigint not null,
  peso numeric(6, 2) not null check (peso > 0),
  ordem int2 not null default 1,
  constraint banca_criterio_uk unique (banca_id, criterio_versao_id),
  constraint banca_criterio_tenant_uk unique (id, instituicao_id),
  constraint banca_criterio_banca_fk foreign key (banca_id, instituicao_id) references banca (id, instituicao_id) on delete cascade,
  constraint banca_criterio_versao_fk foreign key (criterio_versao_id, instituicao_id) references criterio_versao (id, instituicao_id)
);

create sequence avaliacao_protocolo_seq;

create table avaliacao (
  id bigint generated always as identity primary key,
  protocolo varchar not null default ('AV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('avaliacao_protocolo_seq')::text, 6, '0')),
  instituicao_id bigint not null references instituicao (id),
  banca_id bigint not null,
  banca_projeto_id bigint not null,
  banca_avaliador_id bigint not null,
  status status_avaliacao not null default 'enviada',
  versao int4 not null default 1,
  substitui_id bigint references avaliacao (id),
  motivo_correcao text,
  comentario text,
  enviada_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint avaliacao_protocolo_uk unique (protocolo),
  constraint avaliacao_tenant_uk unique (id, instituicao_id),
  constraint avaliacao_banca_fk foreign key (banca_id, instituicao_id) references banca (id, instituicao_id),
  constraint avaliacao_banca_projeto_fk foreign key (banca_projeto_id, instituicao_id) references banca_projeto (id, instituicao_id),
  constraint avaliacao_banca_avaliador_fk foreign key (banca_avaliador_id, instituicao_id) references banca_avaliador (id, instituicao_id),
  constraint avaliacao_correcao_ck check (versao = 1 or (substitui_id is not null and coalesce(length(trim(motivo_correcao)), 0) > 0))
);
create unique index avaliacao_ativa_uk on avaliacao (banca_projeto_id, banca_avaliador_id) where status = 'enviada';
create index avaliacao_banca_idx on avaliacao (banca_id, status);

create table avaliacao_nota (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  avaliacao_id bigint not null,
  banca_criterio_id bigint not null,
  nota int2 not null,
  constraint avaliacao_nota_uk unique (avaliacao_id, banca_criterio_id),
  constraint avaliacao_nota_avaliacao_fk foreign key (avaliacao_id, instituicao_id) references avaliacao (id, instituicao_id),
  constraint avaliacao_nota_criterio_fk foreign key (banca_criterio_id, instituicao_id) references banca_criterio (id, instituicao_id)
);

create table resultado_projeto (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  banca_id bigint not null,
  banca_projeto_id bigint not null,
  pontuacao numeric(8, 4) not null,
  desempate numeric(8, 4) not null,
  posicao int2 not null,
  empatado boolean not null default false,
  avaliacoes int2 not null,
  publicado_em timestamptz not null default now(),
  constraint resultado_projeto_uk unique (banca_id, banca_projeto_id),
  constraint resultado_banca_fk foreign key (banca_id, instituicao_id) references banca (id, instituicao_id) on delete cascade,
  constraint resultado_banca_projeto_fk foreign key (banca_projeto_id, instituicao_id) references banca_projeto (id, instituicao_id) on delete cascade
);

create table auditoria (
  id bigint generated always as identity primary key,
  instituicao_id bigint references instituicao (id),
  ator_id bigint references usuario (id),
  ator_nome varchar,
  operacao varchar not null,
  entidade varchar,
  entidade_id bigint,
  detalhes text,
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);
create index auditoria_inst_idx on auditoria (instituicao_id, criado_em desc);

create table recuperacao_senha (
  id bigint generated always as identity primary key,
  usuario_id bigint not null references usuario (id),
  token_hash bytea not null,
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  usado_em timestamptz,
  ip inet,
  constraint recuperacao_token_uk unique (token_hash)
);
create index recuperacao_usuario_idx on recuperacao_senha (usuario_id);

insert into papel (codigo, nome) values
  ('administrador', 'Administrador institucional'),
  ('coordenador', 'Coordenador'),
  ('orientador', 'Orientador'),
  ('avaliador', 'Avaliador'),
  ('aluno', 'Aluno');

insert into permissao (codigo, descricao) values
  ('usuario:aprovar', 'Aprovar ou recusar solicitações de ingresso'),
  ('usuario:permissao', 'Alterar papéis, bloquear e revogar acessos'),
  ('projeto:criar', 'Cadastrar projetos'),
  ('projeto:editar', 'Editar projetos'),
  ('projeto:ver_todos', 'Ver todos os projetos da instituição'),
  ('banca:gerir', 'Criar e editar bancas'),
  ('banca:ver', 'Ver bancas'),
  ('banca:publicar', 'Publicar resultados'),
  ('criterio:gerir', 'Gerir instrumentos, critérios e descritores'),
  ('nota:lancar', 'Lançar notas como avaliador designado'),
  ('nota:corrigir', 'Corrigir notas com justificativa'),
  ('resultado:ver', 'Ver resultados publicados'),
  ('resultado:ver_rascunho', 'Ver resultados em rascunho'),
  ('auditoria:ver', 'Consultar auditoria'),
  ('dashboard:ver', 'Ver dashboard'),
  ('relatorio:exportar', 'Exportar planilhas');

insert into papel_permissao (papel_codigo, permissao_codigo) values
  ('administrador', 'usuario:aprovar'), ('administrador', 'usuario:permissao'), ('administrador', 'projeto:criar'),
  ('administrador', 'projeto:editar'), ('administrador', 'projeto:ver_todos'), ('administrador', 'banca:gerir'),
  ('administrador', 'banca:ver'), ('administrador', 'banca:publicar'), ('administrador', 'criterio:gerir'),
  ('administrador', 'nota:corrigir'), ('administrador', 'resultado:ver'), ('administrador', 'resultado:ver_rascunho'),
  ('administrador', 'auditoria:ver'), ('administrador', 'dashboard:ver'), ('administrador', 'relatorio:exportar'),
  ('coordenador', 'projeto:criar'), ('coordenador', 'projeto:editar'), ('coordenador', 'projeto:ver_todos'),
  ('coordenador', 'banca:gerir'), ('coordenador', 'banca:ver'), ('coordenador', 'banca:publicar'),
  ('coordenador', 'nota:corrigir'), ('coordenador', 'resultado:ver'), ('coordenador', 'resultado:ver_rascunho'),
  ('coordenador', 'dashboard:ver'), ('coordenador', 'relatorio:exportar'),
  ('orientador', 'projeto:criar'), ('orientador', 'projeto:editar'), ('orientador', 'banca:ver'),
  ('orientador', 'resultado:ver'), ('orientador', 'dashboard:ver'), ('orientador', 'relatorio:exportar'),
  ('aluno', 'banca:ver'), ('aluno', 'resultado:ver'), ('aluno', 'dashboard:ver'), ('aluno', 'relatorio:exportar'),
  ('avaliador', 'nota:lancar');

create function registrar_auditoria(p_inst bigint, p_ator bigint, p_operacao text, p_entidade text, p_detalhes text)
returns void language sql as $$
  insert into auditoria (instituicao_id, ator_id, ator_nome, operacao, entidade, detalhes)
  values (p_inst, p_ator, (select nome from usuario where id = p_ator), p_operacao, p_entidade, p_detalhes);
$$;

create function validar_nota() returns trigger language plpgsql as $$
declare
  v_min int2;
  v_max int2;
begin
  select cv.nota_min, cv.nota_max into v_min, v_max
  from banca_criterio bc join criterio_versao cv on cv.id = bc.criterio_versao_id
  where bc.id = new.banca_criterio_id;
  if new.nota < v_min or new.nota > v_max then
    raise exception 'nota_fora_da_escala';
  end if;
  return new;
end;
$$;
create trigger avaliacao_nota_validar before insert on avaliacao_nota for each row execute function validar_nota();

create function bloquear_alteracao_nota() returns trigger language plpgsql as $$
begin
  raise exception 'nota_imutavel';
end;
$$;
create trigger avaliacao_nota_imutavel before update or delete on avaliacao_nota for each row execute function bloquear_alteracao_nota();

create function atualizar_timestamp() returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;
create trigger instituicao_ts before update on instituicao for each row execute function atualizar_timestamp();
create trigger usuario_ts before update on usuario for each row execute function atualizar_timestamp();
create trigger projeto_ts before update on projeto for each row execute function atualizar_timestamp();
create trigger instrumento_ts before update on instrumento for each row execute function atualizar_timestamp();
create trigger banca_ts before update on banca for each row execute function atualizar_timestamp();
create trigger avaliacao_ts before update on avaliacao for each row execute function atualizar_timestamp();

create function salvar_projeto(p_inst bigint, p_id bigint, p_dados jsonb, p_ator bigint)
returns bigint language plpgsql as $$
declare
  v_id bigint := p_id;
  v_equipe bigint;
  v_orientador bigint := nullif(p_dados->>'orientadorId', '')::bigint;
  v_aluno bigint;
  v_nome text := trim(p_dados->>'nome');
  v_status status_projeto := coalesce(nullif(p_dados->>'status', ''), 'ativo')::status_projeto;
begin
  if coalesce(v_nome, '') = '' then
    raise exception 'nome_obrigatorio';
  end if;
  if v_orientador is not null and not exists (
    select 1 from vinculo_institucional where instituicao_id = p_inst and usuario_id = v_orientador and papel = 'orientador' and situacao = 'ativo'
  ) then
    raise exception 'orientador_invalido';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(coalesce(p_dados->'alunosIds', '[]'::jsonb)) a(id)
    where not exists (
      select 1 from vinculo_institucional where instituicao_id = p_inst and usuario_id = a.id::bigint and papel = 'aluno' and situacao = 'ativo'
    )
  ) then
    raise exception 'aluno_invalido';
  end if;
  if v_id is null then
    insert into projeto (instituicao_id, nome, descricao, ano, semestre, status, criado_por, arquivado_em)
    values (p_inst, v_nome, p_dados->>'descricao', (p_dados->>'ano')::int2, p_dados->>'semestre', v_status, p_ator,
      case when v_status = 'arquivado' then now() end)
    returning id into v_id;
  else
    update projeto set nome = v_nome, descricao = p_dados->>'descricao', ano = (p_dados->>'ano')::int2,
      semestre = p_dados->>'semestre', status = v_status,
      arquivado_em = case when v_status = 'arquivado' then coalesce(arquivado_em, now()) end
    where id = v_id and instituicao_id = p_inst;
    if not found then
      raise exception 'nao_encontrado';
    end if;
  end if;
  insert into equipe (instituicao_id, projeto_id, nome)
  values (p_inst, v_id, coalesce(nullif(trim(p_dados->>'equipe'), ''), v_nome))
  on conflict (projeto_id) do update set nome = excluded.nome
  returning id into v_equipe;
  delete from integrante where equipe_id = v_equipe and instituicao_id = p_inst;
  for v_aluno in select a.id::bigint from jsonb_array_elements_text(coalesce(p_dados->'alunosIds', '[]'::jsonb)) a(id) loop
    insert into integrante (instituicao_id, equipe_id, usuario_id, funcao) values (p_inst, v_equipe, v_aluno, 'Aluno')
    on conflict do nothing;
  end loop;
  delete from orientacao where projeto_id = v_id and instituicao_id = p_inst;
  if v_orientador is not null then
    insert into orientacao (instituicao_id, projeto_id, orientador_id) values (p_inst, v_id, v_orientador);
  end if;
  perform registrar_auditoria(p_inst, p_ator, 'projeto', v_nome, case when p_id is null then 'Projeto cadastrado' else 'Projeto editado' end);
  return v_id;
end;
$$;

create function salvar_criterio(p_inst bigint, p_instrumento bigint, p_versao_id bigint, p_dados jsonb, p_ator bigint)
returns bigint language plpgsql as $$
declare
  v_criterio bigint;
  v_versao int4;
  v_novo bigint;
  v_titulo text := trim(p_dados->>'titulo');
  v_min int2 := coalesce((p_dados->'escala'->>'min')::int2, 1);
  v_max int2 := coalesce((p_dados->'escala'->>'max')::int2, 5);
  v_peso numeric := coalesce((p_dados->>'peso')::numeric, 1);
begin
  if coalesce(v_titulo, '') = '' then
    raise exception 'titulo_obrigatorio';
  end if;
  if v_peso <= 0 then
    raise exception 'peso_invalido';
  end if;
  if not exists (select 1 from instrumento where id = p_instrumento and instituicao_id = p_inst) then
    raise exception 'nao_encontrado';
  end if;
  if p_versao_id is null then
    insert into criterio (instituicao_id, instrumento_id, ordem)
    values (p_inst, p_instrumento, coalesce((select max(ordem) from criterio where instrumento_id = p_instrumento), 0) + 1)
    returning id into v_criterio;
    v_versao := 1;
  else
    select cv.criterio_id into v_criterio
    from criterio_versao cv join criterio c on c.id = cv.criterio_id
    where cv.id = p_versao_id and cv.instituicao_id = p_inst and c.instrumento_id = p_instrumento;
    if v_criterio is null then
      raise exception 'nao_encontrado';
    end if;
    select max(versao) + 1 into v_versao from criterio_versao where criterio_id = v_criterio;
  end if;
  insert into criterio_versao (instituicao_id, criterio_id, versao, titulo, descricao, nota_min, nota_max, peso_sugerido, criado_por)
  values (p_inst, v_criterio, v_versao, v_titulo, p_dados->>'descricao', v_min, v_max, v_peso, p_ator)
  returning id into v_novo;
  insert into descritor (instituicao_id, criterio_versao_id, nota, texto)
  select p_inst, v_novo, d.nota::int2, d.texto
  from (
    select case when key ~ '^[0-9]{1,3}$' then key::int end as nota, value as texto
    from jsonb_each_text(coalesce(p_dados->'descritores', '{}'::jsonb))
  ) d
  where d.nota between v_min and v_max and trim(d.texto) <> '';
  perform registrar_auditoria(p_inst, p_ator, 'criterio', v_titulo,
    case when p_versao_id is null then 'Critério criado (peso ' || v_peso || ')' else 'Nova versão do critério (peso ' || v_peso || ')' end);
  return v_novo;
end;
$$;

create function salvar_banca(p_inst bigint, p_id bigint, p_dados jsonb, p_ator bigint)
returns bigint language plpgsql as $$
declare
  v_id bigint := p_id;
  v_instrumento bigint := (p_dados->>'instrumentoId')::bigint;
  v_nome text := trim(p_dados->>'nome');
  v_ordem int2 := 0;
  v_pid text;
begin
  if coalesce(v_nome, '') = '' then
    raise exception 'nome_obrigatorio';
  end if;
  if (p_dados->>'fim')::date < (p_dados->>'inicio')::date then
    raise exception 'periodo_invalido';
  end if;
  if v_id is null then
    if not exists (select 1 from instrumento where id = v_instrumento and instituicao_id = p_inst and arquivado_em is null) then
      raise exception 'instrumento_invalido';
    end if;
    insert into banca (instituicao_id, instrumento_id, nome, inicio, fim, criado_por)
    values (p_inst, v_instrumento, v_nome, (p_dados->>'inicio')::date, (p_dados->>'fim')::date, p_ator)
    returning id into v_id;
  else
    perform 1 from banca where id = v_id and instituicao_id = p_inst and resultado = 'rascunho' for update;
    if not found then
      raise exception 'banca_indisponivel';
    end if;
    update banca set nome = v_nome, inicio = (p_dados->>'inicio')::date, fim = (p_dados->>'fim')::date where id = v_id;
  end if;
  if p_id is not null and exists (select 1 from avaliacao where banca_id = v_id) then
    perform registrar_auditoria(p_inst, p_ator, 'banca', v_nome, 'Banca editada (nome e período)');
    return v_id;
  end if;
  if p_id is not null then
    if not exists (select 1 from instrumento where id = v_instrumento and instituicao_id = p_inst and arquivado_em is null) then
      raise exception 'instrumento_invalido';
    end if;
    update banca set instrumento_id = v_instrumento where id = v_id;
    delete from banca_projeto where banca_id = v_id;
    delete from banca_avaliador where banca_id = v_id;
    delete from banca_criterio where banca_id = v_id;
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(coalesce(p_dados->'projetosIds', '[]'::jsonb)) a(id)
    where not exists (select 1 from projeto where id = a.id::bigint and instituicao_id = p_inst)
  ) then
    raise exception 'projeto_invalido';
  end if;
  for v_pid in select a.id from jsonb_array_elements_text(coalesce(p_dados->'projetosIds', '[]'::jsonb)) a(id) loop
    v_ordem := v_ordem + 1;
    insert into banca_projeto (instituicao_id, banca_id, projeto_id, ordem_apresentacao) values (p_inst, v_id, v_pid::bigint, v_ordem);
  end loop;
  insert into banca_avaliador (instituicao_id, banca_id, vinculo_id, designado_por)
  select p_inst, v_id, vi.id, p_ator
  from jsonb_array_elements_text(coalesce(p_dados->'avaliadoresIds', '[]'::jsonb)) a(id)
  join vinculo_institucional vi on vi.usuario_id = a.id::bigint and vi.instituicao_id = p_inst and vi.papel = 'avaliador' and vi.situacao = 'ativo';
  if (select count(*) from banca_avaliador where banca_id = v_id) <> jsonb_array_length(coalesce(p_dados->'avaliadoresIds', '[]'::jsonb)) then
    raise exception 'avaliador_invalido';
  end if;
  insert into banca_criterio (instituicao_id, banca_id, criterio_versao_id, peso, ordem)
  select p_inst, v_id, cv.id,
    coalesce(nullif((p_dados->'pesos'->>(cv.id::text))::numeric, 0), cv.peso_sugerido), c.ordem
  from criterio c
  join lateral (select * from criterio_versao x where x.criterio_id = c.id order by x.versao desc limit 1) cv on true
  where c.instrumento_id = v_instrumento and c.instituicao_id = p_inst and c.arquivado_em is null;
  perform registrar_auditoria(p_inst, p_ator, 'banca', v_nome,
    case when p_id is null then 'Banca cadastrada' else 'Banca editada (inclui pesos dos critérios)' end);
  return v_id;
end;
$$;

create function enviar_avaliacao(p_inst bigint, p_banca bigint, p_projeto bigint, p_usuario bigint, p_notas jsonb)
returns bigint language plpgsql as $$
declare
  v_banca banca%rowtype;
  v_bp bigint;
  v_ba bigint;
  v_av bigint;
  v_protocolo text;
  v_projeto_nome text;
begin
  select * into v_banca from banca where id = p_banca and instituicao_id = p_inst;
  if not found then
    raise exception 'nao_encontrado';
  end if;
  if v_banca.resultado = 'publicado' or current_date > v_banca.fim then
    raise exception 'banca_fechada';
  end if;
  select ba.id into v_ba
  from banca_avaliador ba join vinculo_institucional vi on vi.id = ba.vinculo_id
  where ba.banca_id = p_banca and ba.instituicao_id = p_inst and vi.usuario_id = p_usuario and vi.situacao = 'ativo' and vi.papel = 'avaliador';
  if v_ba is null then
    raise exception 'avaliador_nao_designado';
  end if;
  select id into v_bp from banca_projeto where banca_id = p_banca and projeto_id = p_projeto and instituicao_id = p_inst;
  if v_bp is null then
    raise exception 'projeto_fora_da_banca';
  end if;
  if exists (select 1 from avaliacao where banca_projeto_id = v_bp and banca_avaliador_id = v_ba and status = 'enviada') then
    raise exception 'avaliacao_duplicada';
  end if;
  if exists (
    select 1 from banca_criterio bc where bc.banca_id = p_banca and (p_notas->>(bc.criterio_versao_id::text)) is null
  ) then
    raise exception 'nota_ausente';
  end if;
  insert into avaliacao (instituicao_id, banca_id, banca_projeto_id, banca_avaliador_id, status, enviada_em)
  values (p_inst, p_banca, v_bp, v_ba, 'enviada', now())
  returning id, protocolo into v_av, v_protocolo;
  insert into avaliacao_nota (instituicao_id, avaliacao_id, banca_criterio_id, nota)
  select p_inst, v_av, bc.id, (p_notas->>(bc.criterio_versao_id::text))::int2
  from banca_criterio bc where bc.banca_id = p_banca;
  select nome into v_projeto_nome from projeto where id = p_projeto;
  perform registrar_auditoria(p_inst, p_usuario, 'nota', v_projeto_nome, 'Avaliação enviada (' || v_protocolo || ')');
  return v_av;
exception
  when unique_violation then
    raise exception 'avaliacao_duplicada';
end;
$$;

create function corrigir_nota(p_inst bigint, p_avaliacao bigint, p_criterio_versao bigint, p_nova int, p_justificativa text, p_ator bigint)
returns bigint language plpgsql as $$
declare
  v_old avaliacao%rowtype;
  v_new bigint;
  v_protocolo text;
  v_antes int2;
  v_titulo text;
  v_projeto text;
begin
  if coalesce(length(trim(p_justificativa)), 0) = 0 then
    raise exception 'justificativa_obrigatoria';
  end if;
  select * into v_old from avaliacao where id = p_avaliacao and instituicao_id = p_inst and status = 'enviada' for update;
  if not found then
    raise exception 'nao_encontrado';
  end if;
  select an.nota, cv.titulo into v_antes, v_titulo
  from avaliacao_nota an
  join banca_criterio bc on bc.id = an.banca_criterio_id
  join criterio_versao cv on cv.id = bc.criterio_versao_id
  where an.avaliacao_id = p_avaliacao and bc.criterio_versao_id = p_criterio_versao;
  if v_antes is null then
    raise exception 'nao_encontrado';
  end if;
  update avaliacao set status = 'substituida' where id = v_old.id;
  insert into avaliacao (instituicao_id, banca_id, banca_projeto_id, banca_avaliador_id, status, versao, substitui_id, motivo_correcao, comentario, enviada_em)
  values (p_inst, v_old.banca_id, v_old.banca_projeto_id, v_old.banca_avaliador_id, 'enviada', v_old.versao + 1, v_old.id, trim(p_justificativa), v_old.comentario, now())
  returning id, protocolo into v_new, v_protocolo;
  insert into avaliacao_nota (instituicao_id, avaliacao_id, banca_criterio_id, nota)
  select p_inst, v_new, an.banca_criterio_id,
    case when bc.criterio_versao_id = p_criterio_versao then p_nova::int2 else an.nota end
  from avaliacao_nota an join banca_criterio bc on bc.id = an.banca_criterio_id
  where an.avaliacao_id = v_old.id;
  select p.nome into v_projeto from banca_projeto bp join projeto p on p.id = bp.projeto_id where bp.id = v_old.banca_projeto_id;
  insert into auditoria (instituicao_id, ator_id, ator_nome, operacao, entidade, entidade_id, detalhes, antes, depois)
  values (p_inst, p_ator, (select nome from usuario where id = p_ator), 'nota', v_projeto, v_new,
    v_titulo || ': ' || v_antes || ' → ' || p_nova || ' (' || v_protocolo || '). Justificativa: ' || trim(p_justificativa),
    jsonb_build_object('avaliacao_id', v_old.id, 'nota', v_antes), jsonb_build_object('avaliacao_id', v_new, 'nota', p_nova));
  return v_new;
end;
$$;

create function publicar_resultado(p_inst bigint, p_banca bigint, p_ator bigint, p_linhas jsonb)
returns void language plpgsql as $$
declare
  v_nome text;
begin
  update banca set resultado = 'publicado', publicado_em = now(), publicado_por = p_ator
  where id = p_banca and instituicao_id = p_inst
  returning nome into v_nome;
  if not found then
    raise exception 'nao_encontrado';
  end if;
  delete from resultado_projeto where banca_id = p_banca;
  insert into resultado_projeto (instituicao_id, banca_id, banca_projeto_id, pontuacao, desempate, posicao, empatado, avaliacoes)
  select p_inst, p_banca, bp.id, l.pontuacao, l.desempate, l.posicao, l.empatado, l.avaliacoes
  from jsonb_to_recordset(p_linhas) as l(projeto_id bigint, pontuacao numeric, desempate numeric, posicao int, empatado boolean, avaliacoes int)
  join banca_projeto bp on bp.banca_id = p_banca and bp.projeto_id = l.projeto_id;
  perform registrar_auditoria(p_inst, p_ator, 'banca', v_nome, 'Resultado publicado');
end;
$$;

do $$
declare
  t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;
