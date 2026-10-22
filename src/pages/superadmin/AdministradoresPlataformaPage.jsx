import { useState } from "react";
import { PageHeader, Card, DataTable, Badge, Button, Input, Select } from "../../components";

const VAZIO = { instituicaoId: "", usuarioId: "", busca: "", nome: "", email: "", senha: "" };

// Define quem administra cada instituição (visão do superadmin).
// Duas formas: escolher alguém que já tem conta, ou criar a conta do administrador na hora.
export default function AdministradoresPlataformaPage({ administradores = [], instituicoes = [], usuarios = [], erros = {}, aviso, onAdicionar, onRevogar }) {
  const [modo, setModo] = useState("existente");
  const [f, setF] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const porInstituicao = new Map();
  for (const a of administradores) porInstituicao.set(a.instituicaoId, [...(porInstituicao.get(a.instituicaoId) || []), a]);
  const semAdmin = instituicoes.filter((i) => !porInstituicao.has(i.id));

  const termo = f.busca.trim().toLowerCase();
  const candidatos = usuarios.filter((u) => !termo || u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)).slice(0, 200);

  async function enviar(e) {
    e.preventDefault();
    if (!f.instituicaoId) return;
    const corpo = modo === "existente" ? { usuarioId: Number(f.usuarioId) } : { nome: f.nome.trim(), email: f.email.trim(), senha: f.senha };
    if (modo === "existente" && !f.usuarioId) return;
    setEnviando(true);
    const ok = await onAdicionar?.(Number(f.instituicaoId), corpo);
    setEnviando(false);
    if (ok) setF({ ...VAZIO, instituicaoId: f.instituicaoId });
  }

  const colunas = [
    { key: "nome", header: "Instituição", render: (i) => (
      <div>
        <strong>{i.nome}</strong>
        {i.status !== "ativa" && <> <Badge status={i.status} /></>}
      </div>
    ) },
    { key: "admins", header: "Administradores", render: (i) => {
      const lista = porInstituicao.get(i.id) || [];
      if (!lista.length) return <Badge tone="warning">Sem administrador</Badge>;
      return (
        <ul className="lista-simples">
          {lista.map((a) => (
            <li key={a.id} className="row">
              <span><strong>{a.nome}</strong> <span className="muted">{a.email}</span></span>
              <Badge status={a.situacao} />
              <Button variant="danger" size="sm" onClick={() => onRevogar?.(a)}>Remover</Button>
            </li>
          ))}
        </ul>
      );
    } },
    { key: "acoes", header: "Ações", render: (i) => (
      <Button size="sm" variant="secondary" onClick={() => { setF({ ...f, instituicaoId: String(i.id) }); document.getElementById("instituicaoId")?.focus(); }}>
        Definir administrador
      </Button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Administradores por instituição" subtitle="Defina quem cuida de cada instituição. Cada instituição pode ter mais de um administrador." />
      {aviso && <div className={`alert ${aviso.tipo === "erro" ? "" : "alert-ok"}`} role="status">{aviso.texto}</div>}
      {semAdmin.length > 0 && (
        <div className="alert alert-aviso" role="status">
          <strong>{semAdmin.length === 1 ? "1 instituição sem administrador" : `${semAdmin.length} instituições sem administrador`}</strong>
          <p>{semAdmin.map((i) => i.nome).join(", ")}.</p>
        </div>
      )}
      <Card title="Definir administrador">
        <div className="row" role="group" aria-label="Como definir o administrador">
          <Button size="sm" variant={modo === "existente" ? "primary" : "secondary"} aria-pressed={modo === "existente"} onClick={() => setModo("existente")}>Usuário já cadastrado</Button>
          <Button size="sm" variant={modo === "novo" ? "primary" : "secondary"} aria-pressed={modo === "novo"} onClick={() => setModo("novo")}>Criar nova conta</Button>
        </div>
        <form className="form" onSubmit={enviar}>
          <Select label="Instituição" name="instituicaoId" value={f.instituicaoId} placeholder="Selecione"
            options={instituicoes.map((i) => ({ value: String(i.id), label: i.nome }))} onChange={set("instituicaoId")} required />
          {modo === "existente" ? (
            <>
              <Input label="Buscar por nome ou e-mail" name="busca" value={f.busca} onChange={set("busca")} />
              <Select label="Usuário" name="usuarioId" value={f.usuarioId} placeholder={candidatos.length ? "Selecione o usuário" : "Nenhum usuário encontrado"}
                options={candidatos.map((u) => ({ value: String(u.id), label: `${u.nome} — ${u.email}` }))} onChange={set("usuarioId")} error={erros.email || erros.usuarioId}
                hint="Se a pessoa já tem vínculo nesta instituição, o papel dela passa a ser administrador." required />
            </>
          ) : (
            <>
              <Input label="Nome completo" name="nome" value={f.nome} onChange={set("nome")} error={erros.nome} required />
              <Input label="E-mail" name="email" type="email" value={f.email} onChange={set("email")} error={erros.email} required
                hint="Se este e-mail já tiver conta, ela será usada e a senha abaixo é ignorada." />
              <Input label="Senha provisória" name="senha" type="password" value={f.senha} onChange={set("senha")} error={erros.senha} minLength={8} maxLength={72} required
                hint="Mínimo de 8 caracteres. Combine com a pessoa de trocar depois do primeiro acesso." autoComplete="new-password" />
            </>
          )}
          <div className="row"><Button type="submit" disabled={enviando}>{enviando ? "Salvando..." : "Definir como administrador"}</Button></div>
        </form>
      </Card>
      <DataTable columns={colunas} rows={instituicoes} emptyTitle="Nenhuma instituição cadastrada"
        emptyDescription="Cadastre uma instituição em “Instituições” antes de definir o administrador." />
    </>
  );
}
