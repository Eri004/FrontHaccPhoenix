import { useState, useEffect } from "react";
import {
  LayoutDashboard, Building2, Receipt, Banknote, LogOut, Home, Menu, X,
  DollarSign, CheckCircle2, Clock, AlertTriangle, UserCog, Mail, Phone, MapPin,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import {
  departamentosApi, cargosApi, pagosApi, tiposCargosApi,
  type Departamento, type Cargo, type Pago, type EstadoCargo,
} from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

type ResidentViewProps = { onLogout: () => void };

type Section = "dashboard" | "departamentos" | "cargos" | "pagos" | "perfil";

const NAV: { id: Section; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "departamentos", label: "Mis Departamentos", icon: Home },
  { id: "cargos", label: "Cargos", icon: Receipt },
  { id: "pagos", label: "Pagos", icon: Banknote },
  { id: "perfil", label: "Mi Perfil", icon: UserCog },
];

const SECTION_SUBTITLES: Record<Section, string> = {
  dashboard: "Resumen de tu cuenta en el condominio",
  departamentos: "Informacion de tus departamentos",
  cargos: "Cargos aplicados a tus departamentos",
  pagos: "Historial de tus pagos realizados",
  perfil: "Tu informacion personal",
};

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
    PENDIENTE: "bg-amber-100 text-amber-700 border-amber-200",
    PARCIAL: "bg-blue-100 text-blue-700 border-blue-200",
    PAGADO: "bg-green-100 text-green-700 border-green-200",
    ANULADO: "bg-red-100 text-red-700 border-red-200",
  };
  return <Badge className={`${colors[estado]} border`}>{estado}</Badge>;
}

export default function ResidentView({ onLogout }: ResidentViewProps) {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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

  const currentSection = NAV.find((n) => n.id === section);
  const currentSubtitle = SECTION_SUBTITLES[section];

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 flex overflow-hidden">
      {mobileSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside className={`${sidebarOpen ? "w-64" : "w-20"} ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:relative md:transform-none inset-y-0 left-0 z-40 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all flex flex-col h-full`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white truncate">HACCPHOENIX</span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setSidebarOpen(!sidebarOpen); setMobileSidebarOpen(false); }}
              className="hidden md:flex p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
              title={sidebarOpen ? "Colapsar" : "Expandir"}
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2 text-xs">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.nombre} {user?.apellido}</p>
              <p className="text-slate-500 dark:text-slate-400 truncate">{user?.rol}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span>Salir</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pl-2 pr-3 md:pl-3 md:pr-4 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-xl font-bold text-slate-900 dark:text-white truncate">
                {currentSection?.label}
              </h1>
              {currentSubtitle && (
                <p className="text-xs md:text-sm font-normal text-slate-500 dark:text-slate-400 truncate">
                  {currentSubtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden md:block text-xs md:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
              {new Date().toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 md:px-4 md:py-5 bg-slate-50 dark:bg-slate-950">
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
              {section === "dashboard" && <ResidentDashboard departamento={selected} />}
              {section === "departamentos" && (
                <>
                  {departamentos.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-4">
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
              {section === "cargos" && selected && <ResidentCargos departamento={selected} />}
              {section === "pagos" && selected && <ResidentPagos departamento={selected} />}
              {section === "perfil" && <ResidentProfile user={user} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ResidentDashboard({ departamento }: { departamento: Departamento | null }) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [pagos, setPagos] = useState<Pago[]>([]);
  useEffect(() => {
    if (!departamento) return;
    Promise.all([
      cargosApi.listarPorDepartamento(departamento.id).catch(() => [] as Cargo[]),
      pagosApi.listarPorDepartamento(departamento.id).catch(() => [] as Pago[]),
    ]).then(([c, p]) => { setCargos(c); setPagos(p); });
  }, [departamento?.id]);

  if (!departamento) return null;

  const cargosPendientes = cargos.filter((c) => c.estado === "PENDIENTE" || c.estado === "PARCIAL");
  const totalPendiente = cargosPendientes.reduce((s, c) => s + (c.valor || 0), 0);
  const totalPagado = pagos.reduce((s, p) => s + (p.montoTotal || 0), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Pendiente</p>
                <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1">{formatMoney(totalPendiente)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Pagado (total)</p>
                <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{formatMoney(totalPagado)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Cargos registrados</p>
                <p className="text-xl md:text-2xl font-bold mt-1">{cargos.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DepartamentoDetalle({ departamento }: { departamento: Departamento }) {
  return (
    <Card>
      <CardHeader className="pb-3">
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
  );
}

function ResidentCargos({ departamento }: { departamento: Departamento }) {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    cargosApi.listarPorDepartamento(departamento.id)
      .then(setCargos)
      .catch(() => setCargos([]))
      .finally(() => setLoading(false));
  }, [departamento.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
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
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
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
  );
}

function ResidentPagos({ departamento }: { departamento: Departamento }) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    pagosApi.listarPorDepartamento(departamento.id)
      .then(setPagos)
      .catch(() => setPagos([]))
      .finally(() => setLoading(false));
  }, [departamento.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
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
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
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
  );
}

function ResidentProfile({ user }: { user: any }) {
  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Mi Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <UserCog className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="font-medium">{user?.nombre} {user?.apellido}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <Mail className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <UserCog className="w-5 h-5 text-slate-500" />
            <div>
              <p className="text-xs text-slate-500">Rol</p>
              <p className="font-medium">{user?.rol}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
