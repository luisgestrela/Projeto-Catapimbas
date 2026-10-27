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
  const navigate = useNavigate();
  const location = useLocation();
  const bancaSelecionada = bancas.find((b) => String(b.id) === String(bancaId));
  const link = typeof window === "undefined" ? "" : `${window.location.origin}${token ? `/acesso-avaliacao/${token}` : `/projetos/${projetoId}`}`;
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
    const r = await onGerarLink(Number(bancaId), Number(avaliadorId));
    setGerando(false);
    if (r?.erro) return;
    setToken(r.resultado?.token || "");
  }

  return (
    <Card title="Acesso rápido ao projeto" className="quick-access-card">
      <div className="quick-access">
        {qr ? <img className="project-qr" src={qr} alt={`QR Code para abrir o projeto ${projetoNome || ""}`} /> : <div className="project-qr project-qr-loading" aria-hidden="true">Gerando QR Code…</div>}
        <div className="quick-access-copy">
          <p>{token ? "Link individual gerado. O avaliador será levado diretamente para a avaliação deste projeto." : "Gere um link individual para um avaliador acessar este projeto com segurança."}</p>
          {podeGerar && bancas.length > 0 && (
            <div className="quick-access-generator">
              <div className="grid-2">
                <Select label="Banca" name="banca-acesso" placeholder="Selecione a banca" value={bancaId} onChange={(e) => { setBancaId(e.target.value); setAvaliadorId(""); setToken(""); }} options={bancas.map((b) => ({ value: b.id, label: b.nome }))} />
                <Select label="Avaliador" name="avaliador-acesso" placeholder="Selecione o avaliador" value={avaliadorId} onChange={(e) => { setAvaliadorId(e.target.value); setToken(""); }} options={(bancaSelecionada?.avaliadores || []).map((a) => ({ value: a.id, label: a.nome }))} />
              </div>
              <Button size="sm" onClick={gerar} disabled={!bancaId || !avaliadorId || gerando}>{gerando ? "Gerando link…" : "Gerar link individual"}</Button>
            </div>
          )}
          <label className="field quick-link-field">
            <span>{token ? "Link individual de uso único" : "Link direto do projeto"}</span>
            <input readOnly value={link} aria-label="Link direto do projeto" onFocus={(e) => e.target.select()} />
          </label>
          <div className="row">
            <Button onClick={copiar}>{copiado ? "Link copiado" : "Copiar link"}</Button>
            <Button variant="secondary" disabled={jaEstaNoProjeto} onClick={() => navigate(rotaProjeto)}>
              {jaEstaNoProjeto ? "Você já está neste projeto" : "Abrir projeto"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
