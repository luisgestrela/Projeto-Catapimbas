import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "./Button";
import Card from "./Card";
import Select from "./Select";

export default function ProjetoAcessoRapido({ projetoId, projetoNome, bancas = [], podeGerar = false, onGerarLink }) {
  const [qr, setQr] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [bancaId, setBancaId] = useState("");
  const [avaliadorId, setAvaliadorId] = useState("");
  const [token, setToken] = useState("");
  const [gerando, setGerando] = useState(false);
  const [erroGeracao, setErroGeracao] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const bancaSelecionada = bancas.find((b) => String(b.id) === String(bancaId));
  const link = typeof window === "undefined" || !token ? "" : `${window.location.origin}/acesso-avaliacao/${token}`;
  const rotaProjeto = `/projetos/${projetoId}`;
  const jaEstaNoProjeto = location.pathname === rotaProjeto;

  useEffect(() => {
    let ativo = true;
    if (!link) return undefined;
    QRCode.toDataURL(link, { width: 220, margin: 2, errorCorrectionLevel: "M" })
      .then((url) => { if (ativo) setQr(url); })
      .catch(() => { if (ativo) setQr(""); });
    return () => { ativo = false; };
  }, [link]);

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      window.prompt("Copie o link do projeto:", link);
    }
  }

  async function gerar() {
    if (!bancaId || !avaliadorId || !onGerarLink) return;
    setGerando(true);
    setErroGeracao("");
    const r = await onGerarLink(Number(bancaId), Number(avaliadorId));
    setGerando(false);
    if (r?.erro) { setErroGeracao(r.erro); return; }
    setToken(r.resultado?.token || "");
    if (!r.resultado?.token) setErroGeracao("O servidor não retornou um link seguro. Tente novamente.");
  }

  return (
    <Card title="Acesso rápido ao projeto" className="quick-access-card">
      <div className="quick-access">
        {qr ? <img className="project-qr" src={qr} alt={`QR Code para abrir o projeto ${projetoNome || ""}`} /> : <div className="project-qr project-qr-loading" aria-hidden="true">Gerando QR Code…</div>}
        <div className="quick-access-copy">
          <p>{token ? "Link individual gerado. O avaliador será levado diretamente para a avaliação deste projeto." : "Gere um link individual para um avaliador acessar este projeto com segurança."}</p>
          {erroGeracao && <div className="alert" role="alert">{erroGeracao}</div>}
          {podeGerar && (
            <div className="quick-access-generator" aria-label="Gerar link individual">
              <div className="grid-2">
                <Select label="Banca" name="banca-acesso" placeholder={bancas.length ? "Selecione a banca" : "Nenhuma banca disponível"} value={bancaId} disabled={!bancas.length} onChange={(e) => { setBancaId(e.target.value); setAvaliadorId(""); setToken(""); }} options={bancas.map((b) => ({ value: b.id, label: b.nome }))} />
                <Select label="Avaliador" name="avaliador-acesso" placeholder={bancaSelecionada?.avaliadores?.length ? "Selecione o avaliador" : "Selecione uma banca primeiro"} value={avaliadorId} disabled={!bancaSelecionada?.avaliadores?.length} onChange={(e) => { setAvaliadorId(e.target.value); setToken(""); }} options={(bancaSelecionada?.avaliadores || []).map((a) => ({ value: a.id, label: a.nome }))} />
              </div>
              <Button size="sm" onClick={gerar} disabled={!bancaId || !avaliadorId || gerando}>{gerando ? "Gerando link…" : "Gerar link individual"}</Button>
            </div>
          )}
          {podeGerar && bancas.length === 0 && <div className="alert alert-info">Este projeto ainda não está associado a uma banca. Associe o projeto a uma banca e designe os avaliadores para liberar a geração do link.</div>}
          <label className="field quick-link-field">
            <span>{token ? "Link individual de uso único" : "Link seguro de avaliação"}</span>
            <input readOnly value={link || "Gere um link individual para liberar o acesso"} aria-label="Link individual de avaliação" onFocus={(e) => e.target.select()} />
          </label>
          <div className="row">
            <Button onClick={copiar} disabled={!link}>{copiado ? "Link copiado" : "Copiar link"}</Button>
            <Button variant="secondary" disabled={jaEstaNoProjeto} onClick={() => navigate(rotaProjeto)}>
              {jaEstaNoProjeto ? "Você já está neste projeto" : "Abrir projeto"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
