# Avaliação de Startups

Plataforma web multi-institucional para **gestão e avaliação de startups e projetos acadêmicos**. Instituições organizam bancas, avaliadores lançam notas com rubricas e o sistema calcula o ranking, exibe o pódio e exporta os resultados.

> **Estado atual:** frontend (React) + API (Express) + banco PostgreSQL no Supabase, com autenticação por cookie HttpOnly, autorização por papel no servidor e isolamento por instituição em todas as consultas e mutações.

## Funcionalidades

- **Várias instituições, dados separados.** Cada instituição vê apenas os próprios projetos, bancas e resultados. Uma pessoa pode ter papéis diferentes em instituições diferentes e alternar entre elas.
- **Cadastro com aprovação.** O visitante solicita acesso e o administrador aprova ou recusa (com justificativa).
- **Projetos e bancas.** Cadastro, filtros, paginação, detalhes, equipes e avaliadores designados.
- **Rubricas por critério.** Peso, escala de notas (mínimo e máximo) e descritores por faixa de nota.
- **Avaliação.** Cada avaliador atribui notas por critério, revisa antes de enviar e recebe um recibo com protocolo. Cada projeto só pode ser avaliado uma vez por avaliador em cada banca.
- **Ranking ponderado.** A pontuação é a média ponderada por critério. O desempate usa a maior nota média no critério de maior peso; se o empate persistir, ele é exibido como tal.
- **Resultados e pódio.** Publicação do resultado, "modo pódio" com animação (e som opcional) e exportação em `.xlsx`.
- **Dashboard** com indicadores e gráficos por período e por status.
- **Auditoria** de aprovações, notas e permissões.

## Perfis e acesso

| Papel | O que acessa |
|---|---|
| Visitante | Landing, solicitação de acesso, login, recuperação de senha |
| Pendente / Recusado | Tela de situação da conta |
| Superadministrador | Instituições (criar e editar) e projetos de todas |
| Administrador | Dashboard, projetos, bancas, aprovações, pessoas e permissões, critérios, auditoria |
| Coordenador | Dashboard, projetos, bancas (criar, editar, publicar resultado) |
| Orientador / Aluno | Dashboard, seus projetos, bancas e resultados publicados |
| Avaliador | Minhas bancas, avaliação e recibo |

Quem tem mais de um vínculo ativo escolhe a instituição em `/trocar-instituicao` (também pelo botão no topo). As contas de demonstração (senha `12345678`) estão listadas na tela de login.

## Stack

- [React 19](https://react.dev) + [Vite](https://vite.dev), em JavaScript (sem TypeScript)
- [React Router](https://reactrouter.com) para as rotas
- [Recharts](https://recharts.org) para os gráficos
- [canvas-confetti](https://github.com/catdad/canvas-confetti) para a animação do pódio
- [Oxlint](https://oxc.rs) para lint
- CSS puro com variáveis (tokens de design), sem framework de UI

## Como rodar

Requer Node.js 20.19 ou superior (exigência do Vite).

```bash
npm install
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
npm run lint
```

## Estrutura

```
src/
├── components/   # componentes reutilizáveis (Button, Card, DataTable, Podium, Icon...)
├── pages/        # telas, agrupadas por área
│   ├── publicas/        # landing, login, cadastro, recuperar senha, erros
│   ├── compartilhadas/  # dashboard, projetos, bancas, resultados, pódio
│   ├── admin/           # aprovações, pessoas, critérios, auditoria
│   ├── avaliador/       # minhas bancas, avaliação, recibo
│   └── superadmin/      # instituições
├── routes/
│   ├── AppRoutes.jsx    # rotas e restrição por papel
│   └── telas.jsx        # liga cada página aos dados e às ações
├── state/
│   ├── AppContext.jsx   # estado global, menus por papel, cálculo do ranking
│   └── seed.js          # dados de demonstração
└── styles/global.css    # tokens de design e estilos de todos os componentes
```

As páginas em `pages/` são apresentacionais: recebem dados e callbacks por props. Toda a ligação com o estado fica em `routes/telas.jsx`, o que facilita trocar os dados em memória por chamadas a uma API.

## Rotas principais

| Rota | Descrição |
|---|---|
| `/`, `/login`, `/cadastro`, `/recuperar-senha`, `/conta-pendente` | Públicas |
| `/instituicoes`, `/instituicoes/nova`, `/instituicoes/:id/editar` | Superadmin |
| `/dashboard`, `/projetos`, `/projetos/:id`, `/projetos/novo` | Área institucional |
| `/bancas`, `/bancas/:id`, `/bancas/:id/resultados`, `/bancas/:id/podio` | Bancas e resultados |
| `/aprovacoes`, `/pessoas`, `/criterios`, `/auditoria` | Administrador |
| `/minhas-bancas`, `/minhas-bancas/:id/avaliar`, `/minhas-bancas/:id/recibo/:avaliacaoId` | Avaliador |

## Design e acessibilidade

- Interface clara, com uma cor primária para ações e item ativo, e semânticas para sucesso, atenção e erro. Os tons dourado, prata e bronze aparecem só no ranking.
- Estilos centralizados em variáveis CSS (cores, espaçamento, raios, sombras, foco). Para mudar o tema, edite o bloco `:root` de `global.css`.
- Ícones em traço (`components/Icon.jsx`), sem dependência externa. O símbolo de ranking é um pódio.
- Foco visível, link "Pular para o conteúdo", modal com foco gerenciado, tabelas roláveis por teclado e status que não dependem só da cor.
- Respeita `prefers-reduced-motion` (sem animações e sem confete).
- Responsivo: o menu lateral vira gaveta em telas até 860px.

## Backend e Supabase

### 1. Criar o banco

No projeto Supabase, abra **SQL Editor**, cole e execute `supabase/migrations/20261021000000_schema.sql` (ou use `supabase db push` com a CLI). A migração cria tabelas, restrições (PK, FK compostas com `instituicao_id`, UNIQUE, CHECK), índices, gatilhos, funções transacionais (`salvar_projeto`, `salvar_banca`, `salvar_criterio`, `enviar_avaliacao`, `corrigir_nota`, `publicar_resultado`), papéis/permissões iniciais e habilita RLS em todas as tabelas sem políticas para `anon`/`authenticated`. Somente a API, com a chave `service_role`, acessa os dados.

### 2. Configurar variáveis

```bash
cp .env.example .env
```

Preencha `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Settings > API) e um `JWT_SECRET` longo e aleatório. A chave `service_role` nunca deve ir para o frontend nem para o Git.

### 3. Instalar, testar a conexão e popular

```bash
npm install
npm run db:check
npm run seed
```

O seed cria duas instituições e as contas de demonstração (senha `12345678`) listadas na tela de login.

### 4. Rodar

```bash
npm run server:dev
npm run dev
```

O Vite encaminha `/api` para `http://localhost:3001`. Em produção, sirva o frontend e a API sob o mesmo domínio com HTTPS ou defina `VITE_API_URL` e `CORS_ORIGIN`.

### 5. Testes de autorização e isolamento

Com a API rodando e o seed aplicado:

```bash
npm test
```

Cobrem sessão ausente, CSRF, conta pendente, troca de instituição e de ID, permissões por papel, avaliação duplicada, avaliador não designado e nota fora da escala.

### Modelo de segurança

- Senhas com bcrypt (custo 12); sessão em cookie HttpOnly, SameSite=Lax e Secure em produção.
- Mutações exigem o cabeçalho `X-CSRF: 1`; CORS restrito a `CORS_ORIGIN`.
- O contexto institucional vem do cabeçalho `X-Instituicao-Id` e é validado a cada requisição contra um vínculo ativo; mudanças de papel, bloqueio ou revogação valem na requisição seguinte.
- Toda consulta e função SQL filtra por `instituicao_id`; FKs compostas impedem associações entre instituições.
- Notas enviadas são imutáveis (gatilho). Correções criam nova versão da avaliação (`substitui_id`, `versao`, justificativa) e registram auditoria com valores antes e depois.
- Limite de tentativas de login e tokens de recuperação armazenados apenas como hash SHA-256.

### Rotas da API

| Método e rota | Permissão |
|---|---|
| `POST /api/auth/login`, `/sair`, `/cadastro`, `/recuperar`, `/redefinir` | públicas |
| `GET /api/instituicoes/publicas` | pública |
| `GET /api/estado` | autenticado (dados filtrados por papel) |
| `POST/PUT /api/instituicoes`, `PATCH /api/instituicoes/:id/status` | superadmin |
| `POST /api/solicitacoes/:usuarioId/aprovar` e `/recusar` | administrador |
| `PATCH /api/usuarios/:usuarioId/papel` e `/bloqueio`, `DELETE /api/usuarios/:usuarioId/vinculo` | administrador |
| `POST /api/projetos`, `PUT /api/projetos/:id` | administrador, coordenador, orientador (apenas os próprios) |
| `POST /api/instrumentos`, `POST /api/instrumentos/:id/criterios` | administrador |
| `POST/PUT /api/bancas`, `POST /api/bancas/:id/publicar` | administrador, coordenador |
| `POST /api/bancas/:id/avaliacoes` | avaliador designado |
| `PATCH /api/avaliacoes/:id/notas/:criterioId` | administrador, coordenador |
| `GET /api/bancas/:id/ranking`, `GET /api/bancas/:id/exportacao` | gestores; demais papéis só com resultado publicado |
| `GET /api/relatorios/exportacao/projetos` | filtros e permissões do solicitante |

### Limitações conhecidas

- O envio de e-mail não está integrado: em desenvolvimento o link de redefinição aparece no console da API, e a tela de nova senha ainda não existe no frontend (a rota `POST /api/auth/redefinir` está pronta).
- As consultas retornam até 5.000 linhas por tabela; paginação no servidor é o próximo passo para volumes maiores.
- O desempate configurável por banca está registrado em `banca.criterio_desempate`; a política implementada é a da seção "Ranking ponderado".
