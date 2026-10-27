-- Consulta e filtragem de projetos: curso (ex.: DS) e data de realização, para filtrar por mês, ano ou intervalo.
alter table projeto add column if not exists curso varchar;
alter table projeto add column if not exists data_realizacao date;
update projeto set data_realizacao = criado_em::date where data_realizacao is null;
create index if not exists projeto_curso_idx on projeto (instituicao_id, curso);
create index if not exists projeto_data_idx on projeto (instituicao_id, data_realizacao);

create or replace function salvar_projeto(p_inst bigint, p_id bigint, p_dados jsonb, p_ator bigint)
returns bigint language plpgsql as $$
declare
  v_id bigint := p_id;
  v_equipe bigint;
  v_orientador bigint := nullif(p_dados->>'orientadorId', '')::bigint;
  v_aluno bigint;
  v_nome text := trim(p_dados->>'nome');
  v_status status_projeto := coalesce(nullif(p_dados->>'status', ''), 'ativo')::status_projeto;
  v_curso text := nullif(trim(p_dados->>'curso'), '');
  v_data date := nullif(p_dados->>'dataRealizacao', '')::date;
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
    insert into projeto (instituicao_id, nome, descricao, ano, semestre, status, criado_por, arquivado_em, curso, data_realizacao)
    values (p_inst, v_nome, p_dados->>'descricao', (p_dados->>'ano')::int2, p_dados->>'semestre', v_status, p_ator,
      case when v_status = 'arquivado' then now() end, v_curso, coalesce(v_data, current_date))
    returning id into v_id;
  else
    update projeto set nome = v_nome, descricao = p_dados->>'descricao', ano = (p_dados->>'ano')::int2,
      semestre = p_dados->>'semestre', status = v_status, curso = v_curso,
      data_realizacao = coalesce(v_data, data_realizacao),
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

revoke all on all functions in schema public from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

notify pgrst, 'reload schema';
