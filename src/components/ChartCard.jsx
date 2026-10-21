import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import Card from "./Card";
import EmptyState from "./EmptyState";

// Paleta alinhada aos tokens do tema; os rótulos/legenda identificam cada fatia, a cor não é o único sinal.
const COR_PRIMARIA = "#3a53d6";
const CORES = [COR_PRIMARIA, "#d9a21b", "#2f8f5f", "#c4503f", "#7a8bd9", "#8d97a8"];

export default function ChartCard({ title, description, type = "bar", data = [], nameKey = "nome", dataKey = "valor", highlightTop = false }) {
  return (
    <Card title={title}>
      {description && <p className="chart-desc">{description}</p>}
      {data.length === 0 ? (
        <EmptyState title="Sem dados para o período" description="Ajuste os filtros ou cadastre registros." />
      ) : (
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            {type === "pie" ? (
              <PieChart>
                <Pie data={data} dataKey={dataKey} nameKey={nameKey} outerRadius={90}>
                  {data.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e5ec" vertical={false} />
                <XAxis dataKey={nameKey} tick={{ fill: "#586376", fontSize: 13 }} stroke="#c8cfdb" /><YAxis allowDecimals={false} tick={{ fill: "#586376", fontSize: 13 }} stroke="#c8cfdb" /><Tooltip cursor={{ fill: "#eceffd" }} />
                <Bar dataKey={dataKey} fill={COR_PRIMARIA} radius={[6, 6, 0, 0]} maxBarSize={56}>
                  {highlightTop && data.map((_, i) => <Cell key={i} fill={["#d9a21b", "#8d97a8", "#b97b4a"][i] || COR_PRIMARIA} />)}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
