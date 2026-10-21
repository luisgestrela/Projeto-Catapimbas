-- Colunas que o backend já lê/grava (login, bloqueio temporário, anonimização, auditoria) e que a migração inicial não definia.
-- Alteração somente aditiva e idempotente: não remove nem reescreve nada, e pode ser reaplicada sem efeito colateral.

-- Controle de acesso da conta (routes/auth.js, auth.js, criar-usuario.js).
alter table usuario add column if not exists ultimo_login_em timestamptz;
alter table usuario add column if not exists tentativas_login_falhas int4 not null default 0 check (tentativas_login_falhas >= 0);
alter table usuario add column if not exists bloqueado_ate timestamptz;
alter table usuario add column if not exists anonimizado_em timestamptz;

-- Endereço IP de quem executou a operação auditada (auditoria.js).
alter table auditoria add column if not exists ip inet;

-- Faz o PostgREST (API do Supabase) enxergar as novas colunas sem precisar reiniciar o projeto.
notify pgrst, 'reload schema';
