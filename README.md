# Avaliação de Startups

Plataforma web multi-institucional para **gestão e avaliação de startups e projetos acadêmicos**. Instituições organizam bancas, avaliadores lançam notas com rubricas e o sistema calcula o ranking, exibe o pódio e exporta os resultados.

> **Estado atual:** somente o frontend (componentes e páginas). Os dados ficam em memória (`src/state/`) e somem ao recarregar a página. Não há API, banco de dados nem autenticação real; esses serão as próximas partes do projeto.

## Funcionalidades

- **Várias instituições, dados separados.** Cada instituição vê apenas os próprios projetos, bancas e resultados. Uma pessoa pode ter papéis diferentes em instituições diferentes e alternar entre elas.
- **Cadastro com aprovação.** O visitante solicita acesso e o administrador aprova ou recusa (com justificativa).
- **Projetos e bancas.** Cadastro, filtros, paginação, detalhes, equipes e avaliadores designados.
- **Rubricas por critério.** Peso, escala de notas (mínimo e máximo) e descritores por faixa de nota.
- **Avaliação.** Cada avaliador atribui notas por critério, revisa antes de enviar e recebe um recibo com protocolo. Cada projeto só pode ser avaliado uma vez por avaliador em cada banca.
- **Ranking ponderado.** A pontuação é a média ponderada por critério. O desempate usa a maior nota média no critério de maior peso; se o empate persistir, ele é exibido como tal.
- **Resultados e pódio.** Publicação do resultado, "modo pódio" com animação (e som opcional) e exportação em CSV (abre no Excel).
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

## Próximos passos

- API e banco de dados para persistir os dados.
- Autenticação e permissões reais (hoje o login compara com os dados de demonstração).
- Exportação em `.xlsx` (hoje é CSV).
- Envio real de e-mails de aprovação e recuperação de senha.
