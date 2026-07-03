import { useState, useEffect } from "react";
import { Building2, Home, Receipt, Banknote, LogOut, Wallet, FileText, CheckCircle2, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useAuth } from "./AuthContext";
import {
  departamentosApi, cargosApi, pagosApi, tiposCargosApi,
  type Departamento, type Cargo, type Pago, type EstadoCargo,
} from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

type ResidentViewProps = { onLogout: () => void };

function formatMoney(n: number | null | undefined) {
  if (n == null) return "$ 0.00";
  return `$ ${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-EC");
}

function StatusBadge({ estado }: { estado: EstadoCargo }) {
  const colors: Record<EstadoCargo, string> = {
    PENDIENTE: "bg-amber-100 text-amber-700",
    PARCIAL: "bg-blue-100 text-blue-700",
    PAGADO: "bg-green-100 text-green-700",
    ANULADO: "bg-red-100 text-red-700",
  };
  return <Badge className={colors[estado]}>{estado}</Badge>;
}

export default function ResidentView({ onLogout }: ResidentViewProps) {
  const { user } = useAuth();
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Departamento | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await departamentosApi.listar();
        setDepartamentos(data);
        if (data.length > 0) setSelected(data[0]);
      } catch (e) {
        console.error("Error cargando departamentos:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">HACCPHOENIX</h1>
            <p className="text-xs text-slate-500">Portal del propietario</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.nombre} {user?.apellido}</p>
            <p className="text-xs text-slate-500">{user?.rol}</p>
          </div>
          <button onClick={onLogout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {loading ? (
          <p className="text-center text-slate-500 py-8">Cargando...</p>
        ) : departamentos.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Home className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500">No tienes departamentos asignados.</p>
              <p className="text-xs text-slate-400 mt-2">Contacta al administrador para vincular tu usuario.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {departamentos.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {departamentos.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelected(d)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${
                      selected?.id === d.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Home className="w-4 h-4 inline mr-1" />
                    {d.identificadorCompleto || `${d.edificio?.nombre} - ${d.numero}`}
                  </button>
                ))}
              </div>
            )}

            {selected && <DepartamentoDetalle departamento={selected} />}
          </>
        )}
      </main>
    </div>
  );
}

function DepartamentoDetalle({ departamento }: { departamento: Departamento }) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [tipos, setTipos] = useState<{ id: number; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, t] = await Promise.all([
          cargosApi.listarPorDepartamento(departamento.id),
          pagosApi.listarPorDepartamento(departamento.id),
          tiposCargosApi.listarActivos(),
        ]);
        setCargos(c);
        setPagos(p);
        setTipos(t);
      } catch (e) {
        console.error("Error cargando detalle:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [departamento.id]);

  const cargosPendientes = cargos.filter((c) => c.estado === "PENDIENTE" || c.estado === "PARCIAL");
  const totalPendiente = cargosPendientes.reduce((s, c) => s + (c.valor || 0), 0);
  const totalPagado = pagos.reduce((s, p) => s + (p.montoTotal || 0), 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            {departamento.identificadorCompleto || `${departamento.edificio?.nombre} - ${departamento.numero}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-500">Piso</p><p className="font-medium">{departamento.piso || "-"}</p></div>
            <div><p className="text-slate-500">Area</p><p className="font-medium">{departamento.area ?? "-"}</p></div>
            <div><p className="text-slate-500">Alicuota</p><p className="font-medium">{departamento.alicuota}</p></div>
            <div><p className="text-slate-500">Propietario</p><p className="font-medium">{departamento.propietario?.cedula || "-"}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pendiente</p>
                <p className="text-2xl font-bold text-amber-600">{formatMoney(totalPendiente)}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pagado (total)</p>
                <p className="text-2xl font-bold text-green-600">{formatMoney(totalPagado)}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Cargos registrados</p>
                <p className="text-2xl font-bold">{cargos.length}</p>
              </div>
              <Receipt className="w-10 h-10 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Cargos del departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-slate-500 py-4">Cargando...</p>
          ) : cargos.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No hay cargos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Descripcion</th>
                    <th className="py-3 px-3">Generado</th>
                    <th className="py-3 px-3">Vence</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cargos.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-3">{c.tipoCargo?.nombre}</td>
                      <td className="py-3 px-3">{c.descripcion || "-"}</td>
                      <td className="py-3 px-3">{formatDate(c.fechaGeneracion)}</td>
                      <td className="py-3 px-3">{formatDate(c.fechaVencimiento)}</td>
                      <td className="py-3 px-3 font-medium">{formatMoney(c.valor)}</td>
                      <td className="py-3 px-3"><StatusBadge estado={c.estado} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="w-5 h-5" />
            Historial de pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-slate-500 py-4">Cargando...</p>
          ) : pagos.length === 0 ? (
            <p className="text-center text-slate-500 py-4">No hay pagos registrados.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Monto</th>
                    <th className="py-3 px-3">Metodo</th>
                    <th className="py-3 px-3">Comprobante</th>
                    <th className="py-3 px-3">Pagado por</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-3">{formatDate(p.fecha)}</td>
                      <td className="py-3 px-3 font-medium text-green-600">{formatMoney(p.montoTotal)}</td>
                      <td className="py-3 px-3">{p.metodoPago || "-"}</td>
                      <td className="py-3 px-3">{p.numeroComprobante || "-"}</td>
                      <td className="py-3 px-3">{p.pagadoPor || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
