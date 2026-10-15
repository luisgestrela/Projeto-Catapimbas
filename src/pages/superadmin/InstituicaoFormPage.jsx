import { useState } from "react";
import { PageHeader, Card, Input, Select, Button } from "../../components";

export default function InstituicaoFormPage({ inicial = {}, erros = {}, onSubmit, onCancelar }) {
  const [f, setF] = useState({
    nome: inicial.nome || "", identificador: inicial.identificador || "", status: inicial.status || "ativa",
    corPrimaria: inicial.corPrimaria || "#0f5e73", logoUrl: inicial.logoUrl || "",
  });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <PageHeader title={inicial.id ? "Editar instituição" : "Nova instituição"} />
      <Card>
        <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit?.(f); }}>
          <Input label="Nome" name="nome" value={f.nome} onChange={set("nome")} error={erros.nome} required />
          <Input label="Identificador único" name="identificador" value={f.identificador} onChange={set("identificador")}
            hint="Usado na URL e nos vínculos. Ex.: ucsal" error={erros.identificador} required />
          <Select label="Status" name="status" value={f.status} onChange={set("status")}
            options={[{ value: "ativa", label: "Ativa" }, { value: "suspensa", label: "Suspensa" }]} />
          <Input label="Cor principal" name="corPrimaria" type="color" value={f.corPrimaria} onChange={set("corPrimaria")} />
          <Input label="URL do logotipo" name="logoUrl" type="url" value={f.logoUrl} onChange={set("logoUrl")} />
          <div className="row">
            <Button type="submit">Salvar</Button>
            <Button variant="secondary" onClick={onCancelar}>Cancelar</Button>
          </div>
        </form>
      </Card>
    </>
  );
}
