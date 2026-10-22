-- Fluxos por perfil: aluno só vê seus projetos, orientador acompanha (somente leitura) e coordenador designa avaliadores.
-- Alteração idempotente: pode ser reaplicada sem efeito colateral.

-- Aluno: sem área de bancas, resultados nem dashboard. Continua vendo os projetos em que é integrante.
delete from papel_permissao
where papel_codigo = 'aluno' and permissao_codigo in ('banca:ver', 'resultado:ver', 'dashboard:ver');

-- Orientador: acompanha os projetos vinculados a ele e seus integrantes (somente leitura). Não cadastra nem edita
-- projetos e não consulta o ranking das bancas (isso é da coordenação e da administração).
delete from papel_permissao
where papel_codigo = 'orientador' and permissao_codigo in ('projeto:criar', 'projeto:editar', 'resultado:ver');

-- Coordenador: designa (ou remove) avaliadores de uma banca mesmo depois de existirem notas.
-- Quem já lançou nota não pode ser removido; só pode ser incluído quem é avaliador ativo da instituição.
create or replace function designar_avaliadores(p_inst bigint, p_banca bigint, p_avaliadores jsonb, p_ator bigint)
returns void language plpgsql as $$
declare
  v_nome text;
  v_resultado resultado_banca;
  v_lista jsonb := coalesce(p_avaliadores, '[]'::jsonb);
begin
  select nome, resultado into v_nome, v_resultado from banca where id = p_banca and instituicao_id = p_inst for update;
  if not found then
    raise exception 'nao_encontrado';
  end if;
  if v_resultado = 'publicado' then
    raise exception 'banca_indisponivel';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(v_lista) a(id)
    where not exists (
      select 1 from vinculo_institucional vi
      where vi.usuario_id = a.id::bigint and vi.instituicao_id = p_inst and vi.papel = 'avaliador' and vi.situacao = 'ativo'
    )
  ) then
    raise exception 'avaliador_invalido';
  end if;
  if exists (
    select 1 from banca_avaliador ba
    join vinculo_institucional vi on vi.id = ba.vinculo_id
    where ba.banca_id = p_banca and ba.instituicao_id = p_inst
      and exists (select 1 from avaliacao av where av.banca_avaliador_id = ba.id)
      and vi.usuario_id::text not in (select a.id from jsonb_array_elements_text(v_lista) a(id))
  ) then
    raise exception 'avaliador_com_notas';
  end if;
  delete from banca_avaliador ba
  where ba.banca_id = p_banca and ba.instituicao_id = p_inst
    and not exists (select 1 from avaliacao av where av.banca_avaliador_id = ba.id)
    and ba.vinculo_id not in (
      select vi.id from vinculo_institucional vi
      join jsonb_array_elements_text(v_lista) a(id) on vi.usuario_id = a.id::bigint
      where vi.instituicao_id = p_inst
    );
  insert into banca_avaliador (instituicao_id, banca_id, vinculo_id, designado_por)
  select p_inst, p_banca, vi.id, p_ator
  from jsonb_array_elements_text(v_lista) a(id)
  join vinculo_institucional vi on vi.usuario_id = a.id::bigint and vi.instituicao_id = p_inst
  on conflict (banca_id, vinculo_id) do nothing;
  perform registrar_auditoria(p_inst, p_ator, 'banca', v_nome, 'Avaliadores designados');
end;
$$;

-- A função nova só pode ser executada pela API (service_role), como as demais.
revoke all on function designar_avaliadores(bigint, bigint, jsonb, bigint) from public, anon, authenticated;
grant execute on all functions in schema public to service_role;

notify pgrst, 'reload schema';
