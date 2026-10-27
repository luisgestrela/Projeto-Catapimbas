-- Links individuais de acesso à avaliação.
-- O token em texto puro nunca é salvo; somente o hash SHA-256 é persistido.
create table avaliacao_acesso (
  id bigint generated always as identity primary key,
  instituicao_id bigint not null references instituicao (id),
  banca_id bigint not null,
  projeto_id bigint not null,
  avaliador_id bigint not null references usuario (id),
  token_hash text not null unique,
  criado_por bigint not null references usuario (id),
  criado_em timestamptz not null default now(),
  expira_em timestamptz not null,
  usado_em timestamptz,
  constraint avaliacao_acesso_banca_fk foreign key (banca_id, instituicao_id) references banca (id, instituicao_id) on delete cascade,
  constraint avaliacao_acesso_projeto_fk foreign key (projeto_id, instituicao_id) references projeto (id, instituicao_id) on delete cascade
);
create index if not exists avaliacao_acesso_hash_idx on avaliacao_acesso (token_hash);
create index if not exists avaliacao_acesso_contexto_idx on avaliacao_acesso (instituicao_id, banca_id, projeto_id, avaliador_id);

revoke all on table avaliacao_acesso from public, anon, authenticated;
grant all on table avaliacao_acesso to service_role;

notify pgrst, 'reload schema';
