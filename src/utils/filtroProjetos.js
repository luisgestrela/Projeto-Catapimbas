// Filtro único de projetos, usado pela listagem (tela) e pela exportação para Excel (servidor), para que ambas mostrem o mesmo resultado.
const norm = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const contem = (a, b) => !b || norm(a).includes(norm(b));

// Um projeto é "anterior" quando está arquivado ou pertence a um semestre já encerrado.
export function projetoAnterior(p, hoje = new Date()) {
  const atual = hoje.getFullYear() * 10 + (hoje.getMonth() < 6 ? 1 : 2);
  return p.status === "arquivado" || p.ano * 10 + Number(p.semestre) < atual;
}

// `f`: nome, busca, orientador, equipe, aluno, curso, ano, semestre, mes (1-12), dataInicio, dataFim (AAAA-MM-DD), situacao ("ativo" | "arquivado" | "anteriores").
// `nomeDe(id)` devolve o nome de uma pessoa, para buscar por orientador e alunos.
export function filtrarProjetos(lista, f = {}, nomeDe = () => "") {
  return lista.filter((p) => {
    const orientador = nomeDe(p.orientadorId);
    const alunos = p.alunosIds.map(nomeDe).join(" ");
    const data = p.dataRealizacao || "";
    return contem(p.nome, f.nome) && contem(orientador, f.orientador) && contem(p.equipe, f.equipe) && contem(alunos, f.aluno)
      && contem(`${p.nome} ${p.descricao} ${p.curso} ${p.equipe} ${orientador} ${alunos} ${p.ano}/${p.semestre}`, f.busca)
      && (!f.curso || norm(p.curso) === norm(f.curso))
      && (!f.ano || p.ano === Number(f.ano)) && (!f.semestre || p.semestre === String(f.semestre))
      && (!f.mes || (data && Number(data.slice(5, 7)) === Number(f.mes)))
      && (!f.dataInicio || (data && data >= f.dataInicio)) && (!f.dataFim || (data && data <= f.dataFim))
      && (!f.situacao || (f.situacao === "anteriores" ? projetoAnterior(p) : p.status === f.situacao));
  });
}

export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const formatarData = (iso) => (iso ? iso.split("-").reverse().join("/") : "");
