// Ícones em traço (24x24, stroke 1.75) — mesma família visual, herdam a cor do texto.
// "ranking" é um pódio: três colunas de alturas diferentes com o 1º lugar ao centro.
const PATHS = {
<<<<<<< HEAD
  trofeu: (
    <>
      <path d="M8 4h8v5a4 4 0 01-8 0z" />
      <path d="M8 6H4.5v1.5A3.5 3.5 0 008 11M16 6h3.5v1.5A3.5 3.5 0 0116 11" />
      <path d="M12 13v4M8.5 20h7M10 17h4" />
    </>
  ),
  alvo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  diferenca: (
    <>
      <path d="M4 17l5-5 4 4 7-8" />
      <path d="M15 8h5v5" />
    </>
  ),
  equipes: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6 20c.4-3.3 2.6-5 6-5s5.6 1.7 6 5" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="19" cy="10" r="2" />
    </>
  ),
=======
>>>>>>> 7be79beb46e4d4880b4be0153fc9f95c47a13ec5
  ranking: (
    <>
      <path d="M3 21h18" />
      <rect x="9" y="8" width="6" height="13" rx="1" />
      <rect x="2.5" y="13" width="6.5" height="8" rx="1" />
      <rect x="15" y="16" width="6.5" height="5" rx="1" />
      <path d="M12 3.2l.9 1.8 2 .3-1.45 1.4.35 2-1.8-.95-1.8.95.35-2L9.1 5.3l2-.3z" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.5" />
      <rect x="3" y="15" width="7.5" height="6" rx="1.5" />
    </>
  ),
  projetos: (
    <>
      <path d="M3 7.5A1.5 1.5 0 014.5 6H9l2 2.5h8.5A1.5 1.5 0 0121 10v8.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5z" />
    </>
  ),
  bancas: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c.4-3.5 3-5.5 6.5-5.5s6.1 2 6.5 5.5" />
      <path d="M16 5.2a3.2 3.2 0 010 5.6M18 14.8c2 .6 3.2 2.2 3.5 5.2" />
    </>
  ),
  aprovacoes: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.3l2.8 2.8L16.3 9.5" />
    </>
  ),
  pessoas: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.4-3 8-7.5 9.5-4.5-1.5-7.5-5.1-7.5-9.5V6z" />
      <circle cx="12" cy="10" r="2.2" />
      <path d="M8.3 16c.5-1.6 1.9-2.5 3.7-2.5s3.2.9 3.7 2.5" />
    </>
  ),
  criterios: (
    <>
      <path d="M4 6h10M4 12h16M4 18h8" />
      <circle cx="17" cy="6" r="2" />
      <circle cx="15" cy="18" r="2" />
    </>
  ),
  auditoria: (
    <>
      <path d="M7 3h8l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M14.5 3v4.5H19M9 12h6M9 16h6" />
    </>
  ),
  instituicoes: (
    <>
      <path d="M3 9.5L12 4l9 5.5" />
      <path d="M5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 20h18" />
    </>
  ),
  avaliar: (
    <>
      <path d="M4 20l1-4L16.5 4.5a2 2 0 013 3L8 19z" />
      <path d="M14.5 6.5l3 3" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  fechar: <path d="M6 6l12 12M18 6L6 18" />,
};

export default function Icon({ name, label, className = "" }) {
  const content = PATHS[name];
  if (!content) return null;
  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      focusable="false"
    >
      {content}
    </svg>
  );
}
