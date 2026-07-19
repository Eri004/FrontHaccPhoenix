import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutDashboard, Building2, CreditCard, Receipt, Wallet,
  Settings, LogOut, Plus, Edit2, Trash2, Search, Download,
  TrendingUp, TrendingDown, DollarSign, Banknote, FileText,
  BarChart3, Home, UserCog, IdCard, Menu, X, RefreshCw, CheckCircle2,
  AlertTriangle, Clock, Mail, Phone, MapPin, Filter, Calendar,
  ChevronRight, ArrowLeft, Layers, Hash, Square, Upload, ImageIcon,
  Hash as HashIcon, Users, FileSpreadsheet,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { useAuth } from "./AuthContext";
import {
  edificiosApi, departamentosApi, propietariosApi,
  cargosApi, pagosApi, gastosApi, tiposCargosApi, tiposGastosApi, reportesApi,
  type Edificio, type Departamento, type Propietario, type Inquilino,
  type Cargo, type Pago, type Gasto, type EstadoCargo, type TipoCargo, type TipoGasto,
  COMPROBANTE_PENDIENTE, comprobanteEsPendiente,
  inquilinosApi,
} from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { NotificationBell } from "../components/NotificationBell";
import PeriodFilter, { type PeriodValue, filterByPeriod, periodLabel } from "../components/PeriodFilter";
import EdificioImage from "../components/EdificioImage";

type Section =
  | "dashboard"
  | "edificios"
  | "departamentos"
  | "propietarios"
  | "cargos"
  | "pagos"
  | "gastos"
  | "reportes"
  | "settings";

type AdminDashboardProps = { onLogout: () => void };

const NAV: { id: Section; label: string; icon: any; group: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Principal" },
  { id: "edificios", label: "Edificios", icon: Building2, group: "Estructura" },
  { id: "departamentos", label: "Departamentos", icon: Home, group: "Estructura" },
  { id: "propietarios", label: "Propietarios", icon: UserCog, group: "Personas" },
  { id: "cargos", label: "Cargos", icon: Receipt, group: "Finanzas" },
  { id: "pagos", label: "Pagos", icon: Banknote, group: "Finanzas" },
  { id: "gastos", label: "Gastos", icon: Wallet, group: "Finanzas" },
  { id: "reportes", label: "Reportes", icon: BarChart3, group: "Otros" },
  { id: "settings", label: "Ajustes", icon: Settings, group: "Otros" },
];

const SECTION_SUBTITLES: Record<Section, string> = {
  dashboard: "Resumen general del condominio",
  edificios: "Vista general de los edificios administrados",
  departamentos: "Departamentos por edificio con su detalle",
  propietarios: "Consulta los propietarios y los departamentos que administran",
  cargos: "Gestiona los cargos aplicados a los departamentos",
  pagos: "Historial de pagos realizados",
  gastos: "Control de gastos y comprobantes del condominio",
  reportes: "Genera y descarga reportes financieros",
  settings: "Perfil de usuario y preferencias",
};

const CHART_COLORS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06B6D4"];

function formatMoney(n: number | null | undefined) {
  if (n == null) return "$ 0.00";
  return `$ ${n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("es-EC");
}

function Toast({ message, type, onClose }: { message: string; type: "ok" | "err"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm ${
      type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
    </div>
  );
}

function Modal({
  open, onClose, title, children, footer, size = "md",
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; size?: "md" | "lg" | "xl" }) {
  if (!open) return null;
  const sizes = { md: "max-w-2xl", lg: "max-w-3xl", xl: "max-w-5xl" };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700`}>
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end bg-slate-50 dark:bg-slate-900/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, onConfirm, onCancel }: {
  open: boolean; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onCancel} title="Confirmar accion" footer={
      <>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">Eliminar</Button>
      </>
    }>
      <p className="text-slate-700 dark:text-slate-300">{message}</p>
    </Modal>
  );
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

function EmptyState({ title, description, icon: Icon }: { title: string; description: string; icon: any }) {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <p className="text-slate-700 dark:text-slate-200 font-medium">{title}</p>
      <p className="text-sm text-slate-500 mt-1">{description}</p>
    </div>
  );
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "err" } | null>(null);

  const showToast = (message: string, type: "ok" | "err") => setToast({ message, type });

  const currentSection = NAV.find((n) => n.id === section);
  const currentSubtitle = SECTION_SUBTITLES[section];

  return (
    <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 flex overflow-hidden">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

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
              <img src="/hacc-icon.png" alt="HACC" className="w-9 h-9 rounded-xl object-cover shrink-0" />
              <span className="font-bold text-slate-900 dark:text-white truncate">HACC</span>
            </div>
          ) : (
            <img src="/hacc-icon.png" alt="HACC" className="w-9 h-9 rounded-xl object-cover shrink-0" />
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
            <NotificationBell onNavigate={(s) => setSection(s as Section)} />
            <div className="hidden md:block text-xs md:text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0 pr-12">
              {new Date().toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 md:px-4 md:py-5 bg-slate-50 dark:bg-slate-950">
          {section === "dashboard" && <DashboardSection />}
          {section === "edificios" && <EdificiosSection onToast={showToast} />}
          {section === "departamentos" && <DepartamentosSection onToast={showToast} />}
          {section === "propietarios" && <PropietariosSection onToast={showToast} />}
          {section === "cargos" && <CargosSection onToast={showToast} />}
          {section === "pagos" && <PagosSection onToast={showToast} />}
          {section === "gastos" && <GastosSection onToast={showToast} />}
          {section === "reportes" && <ReportesSection onToast={showToast} />}
          {section === "settings" && <SettingsSection user={user} />}
        </div>
      </main>
    </div>
  );
}

function useFetch<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetcherRef.current();
      setData(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  if (!action) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {action}
    </div>
  );
}

function TableCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function LoadingOrError({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) return <div className="p-8 text-center text-slate-500">Cargando...</div>;
  if (error) return (
    <div className="p-8 text-center">
      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
      <p className="text-red-600 mb-3">{error}</p>
      <Button variant="outline" onClick={onRetry}><RefreshCw className="w-4 h-4 mr-2" />Reintentar</Button>
    </div>
  );
  return null;
}

function DashboardSection() {
  const { data: edificios } = useFetch(() => edificiosApi.listar());
  const { data: propietarios } = useFetch(() => propietariosApi.listar());
  const { data: departamentos } = useFetch(() => departamentosApi.listar());
  const { data: cargos } = useFetch(() => cargosApi.listar());
  const { data: pagos } = useFetch(() => pagosApi.listar());
  const { data: gastos } = useFetch(() => gastosApi.listar());

  const totalCargos = cargos?.reduce((s, c) => s + (c.valor || 0), 0) || 0;
  const totalPagos = pagos?.reduce((s, p) => s + (p.montoTotal || 0), 0) || 0;
  const totalGastos = gastos?.reduce((s, g) => s + (g.valor || 0), 0) || 0;
  const cargosPendientes = cargos?.filter((c) => c.estado === "PENDIENTE" || c.estado === "PARCIAL") || [];
  const totalPendiente = cargosPendientes.reduce((s, c) => s + (c.valor || 0), 0);

  const stats = [
    { label: "Edificios", value: edificios?.edificios?.length || 0, icon: Building2, color: "from-blue-500 to-blue-600" },
    { label: "Propietarios", value: propietarios?.length || 0, icon: UserCog, color: "from-purple-500 to-purple-600" },
    { label: "Departamentos", value: departamentos?.length || 0, icon: Home, color: "from-cyan-500 to-cyan-600" },
    { label: "Cargos", value: cargos?.length || 0, icon: Receipt, color: "from-amber-500 to-amber-600" },
    { label: "Pagos", value: pagos?.length || 0, icon: Banknote, color: "from-green-500 to-green-600" },
    { label: "Gastos", value: gastos?.length || 0, icon: Wallet, color: "from-red-500 to-red-600" },
  ];

  const estadoCargosData = useMemo(() => {
    if (!cargos) return [];
    const count: Record<string, number> = {};
    cargos.forEach((c) => { count[c.estado] = (count[c.estado] || 0) + 1; });
    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }, [cargos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden border-slate-200 dark:border-slate-800">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Recaudado</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{formatMoney(totalPagos)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Gastos</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{formatMoney(totalGastos)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Por Cobrar</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{formatMoney(totalPendiente)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {estadoCargosData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Estado de Cargos</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={estadoCargosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {estadoCargosData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EdificiosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => edificiosApi.listar());
  const { data: departamentosData } = useFetch(() => departamentosApi.listar());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Edificio | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; nombre: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data?.edificios || [];
    return list.filter((e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (e.direccion || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const handleSave = async (form: Partial<Edificio>) => {
    try {
      if (editing) {
        await edificiosApi.actualizar(editing.id, form);
        onToast("Edificio actualizado", "ok");
      } else {
        await edificiosApi.crear(form);
        onToast("Edificio creado", "ok");
      }
      setOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await edificiosApi.eliminar(id);
      onToast("Edificio eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const countDepartamentos = (edificioId: number) =>
    (departamentosData || []).filter((d) => d.edificio?.id === edificioId).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Edificios"
        subtitle="Vista general de los edificios administrados"
        action={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                className="pl-10 w-full md:w-72"
                placeholder="Buscar edificio o direccion..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Nuevo edificio
            </Button>
          </>
        }
      />

      <LoadingOrError loading={loading} error={error} onRetry={reload} />

      {data && !loading && !error && (
        filtered.length === 0 ? (
          <Card>
            <EmptyState title="Sin edificios registrados" description="Crea el primer edificio para comenzar." icon={Building2} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((e) => (
              <Card key={e.id} className="overflow-hidden group hover:shadow-xl transition-all border-slate-200 dark:border-slate-800">
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">
                  <EdificioImage nombre={e.nombre} id={e.id} imagen={e.imagen} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge className={e.estado === "ACTIVO" ? "bg-green-500 text-white" : "bg-slate-500 text-white"}>
                      {e.estado}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <button
                      onClick={() => { setEditing(e); setOpen(true); }}
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 shadow-sm"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirm({ id: e.id, nombre: e.nombre })}
                      className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-red-600 shadow-sm"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white/80 text-xs font-medium">Pisos: {e.numeroPisos || "-"}</p>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1">{e.nombre}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-start gap-1.5 line-clamp-2">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{e.direccion}</span>
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{countDepartamentos(e.id)} departamentos</span>
                    </div>
                    {e.descripcion && (
                      <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[140px]" title={e.descripcion}>
                        {e.descripcion}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <EdificioForm open={open} onClose={() => { setOpen(false); setEditing(null); }} editing={editing} onSave={handleSave} />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el edificio "${confirm?.nombre}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function EdificioForm({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: Edificio | null; onSave: (data: Partial<Edificio>) => void;
}) {
  const [form, setForm] = useState<Partial<Edificio>>({});
  useEffect(() => { setForm(editing || { estado: "ACTIVO" }); }, [editing, open]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen no puede pesar mas de 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm({ ...form, imagen: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => setForm({ ...form, imagen: null });

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar Edificio" : "Nuevo Edificio"} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave(form)}>Guardar</Button>
      </>
    }>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Nombre *</label>
          <Input value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Direccion *</label>
          <Input value={form.direccion || ""} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Estado</label>
          <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={form.estado || "ACTIVO"} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Descripcion</label>
          <Input value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Imagen del edificio (opcional)</label>
          <div className="mt-1 flex items-start gap-3">
            <div className="w-24 h-24 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
              {form.imagen ? (
                <img src={form.imagen} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {form.imagen ? "Cambiar imagen" : "Subir imagen"}
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              {form.imagen && (
                <button type="button" onClick={removeImage} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                  <X className="w-3.5 h-3.5" />
                  Quitar imagen
                </button>
              )}
              <p className="text-[11px] text-slate-500">JPG, PNG o WebP. Max 2MB. Si no subes ninguna, se usara una imagen por defecto.</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function DepartamentosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => departamentosApi.listar());
  const { data: edificiosData } = useFetch(() => edificiosApi.listar());
  const { data: propietariosData } = useFetch(() => propietariosApi.listar());
  const { data: inquilinosData } = useFetch(() => inquilinosApi.listar());
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; numero: string } | null>(null);
  const [edificioFilter, setEdificioFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Departamento | null>(null);

  const edificios = edificiosData?.edificios || [];
  const propietarios = propietariosData || [];
  const inquilinos = inquilinosData || [];

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((d) => {
      const matchEdif = edificioFilter === "all" || d.edificio?.id === edificioFilter;
      const s = search.toLowerCase();
      const matchSearch = !s ||
        d.numero.toLowerCase().includes(s) ||
        d.edificio?.nombre.toLowerCase().includes(s) ||
        (d.propietario?.cedula || "").includes(search) ||
        (d.propietario?.usuario?.nombre || "").toLowerCase().includes(s);
      return matchEdif && matchSearch;
    });
  }, [data, edificioFilter, search]);

  useEffect(() => {
    if (selected && !filtered.some((d) => d.id === selected.id)) {
      setSelected(null);
    }
  }, [filtered, selected]);

  const handleSave = async (edificioId: number, propietarioId: number, form: Partial<Departamento>) => {
    try {
      if (editing) {
        await departamentosApi.actualizar(editing.id, form);
        onToast("Departamento actualizado", "ok");
      } else {
        await departamentosApi.crear(edificioId, propietarioId, form);
        onToast("Departamento creado", "ok");
      }
      setOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await departamentosApi.eliminar(id);
      onToast("Departamento eliminado", "ok");
      setConfirm(null);
      if (selected?.id === id) setSelected(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const getInquilinoActivo = (departamentoId: number): Inquilino | null => {
    return inquilinos.find((i) => i.departamento?.id === departamentoId && i.estado === "ACTIVO") || null;
  };

  return (
    <div className="space-y-4">
      <SectionHeader
         
        
        action={
          <>
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                className="pl-9 pr-3 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[180px]"
                value={edificioFilter}
                onChange={(e) => setEdificioFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Todos los edificios</option>
                {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Layers className="w-4 h-4 mr-2" />Crear en masa
            </Button>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Nuevo
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={selected ? "lg:col-span-5 xl:col-span-4" : "lg:col-span-12"}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Listado de departamentos</CardTitle>
                <Badge variant="secondary">{filtered.length}</Badge>
              </div>
              <div className="relative pt-2">
                <Search className="absolute left-3 top-4 w-4 h-4 text-slate-400" />
                <Input
                  className="pl-10"
                  placeholder="Buscar por numero, edificio, propietario..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[60vh] lg:max-h-[68vh] overflow-y-auto">
              <LoadingOrError loading={loading} error={error} onRetry={reload} />
              {data && !loading && !error && (
                filtered.length === 0 ? (
                  <EmptyState title="Sin departamentos" description="No hay departamentos con los filtros actuales." icon={Home} />
                ) : (
                  <div className="space-y-2">
                    {filtered.map((d) => {
                      const isSelected = selected?.id === d.id;
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSelected(d)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 shadow-md"
                              : "border-slate-200 dark:border-slate-800 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                  {d.numero}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    Depto. {d.numero}
                                  </p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {d.edificio?.nombre}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                                {d.piso != null && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Piso {d.piso}</span>
                                )}
                                {d.area != null && (
                                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{d.area} m2</span>
                                )}
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                  Alicuota {formatMoney(d.alicuota)}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {getInquilinoActivo(d.id) ? (
                                <Badge className="bg-purple-100 text-purple-700 border-purple-200 border text-[10px]">Con inquilino</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-700 border-slate-200 border text-[10px]">Sin inquilino</Badge>
                              )}
                              <ChevronRight className={`w-4 h-4 text-slate-400 ${isSelected ? "text-blue-600" : ""}`} />
                            </div>
                          </div>
                          <div className="mt-2 flex justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditing(d); setOpen(true); }}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirm({ id: d.id, numero: d.numero }); }}
                              className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {selected && (
          <div className="lg:col-span-7 xl:col-span-8">
            <DepartamentoDetalle
              departamento={selected}
              inquilinoActivo={getInquilinoActivo(selected.id)}
              onClose={() => setSelected(null)}
              onEdit={() => { setEditing(selected); setOpen(true); }}
            />
          </div>
        )}
      </div>

      <DepartamentoForm
        open={open} onClose={() => { setOpen(false); setEditing(null); }}
        editing={editing} edificios={edificios} propietarios={propietarios} onSave={handleSave}
      />
      <DepartamentoBulkForm
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        edificios={edificios}
        propietarios={propietarios}
        onToast={onToast}
        onDone={() => { setBulkOpen(false); reload(); }}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el departamento "${confirm?.numero}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function DepartamentoBulkForm({ open, onClose, edificios, propietarios, onToast, onDone }: {
  open: boolean; onClose: () => void;
  edificios: Edificio[]; propietarios: Propietario[];
  onToast: (m: string, t: "ok" | "err") => void;
  onDone: () => void;
}) {
  const [edificioId, setEdificioId] = useState<number | null>(null);
  const [propietarioId, setPropietarioId] = useState<number | null>(null);
  const [desde, setDesde] = useState<number>(101);
  const [hasta, setHasta] = useState<number>(141);
  const [area, setArea] = useState<number | null>(null);
  const [alicuota, setAlicuota] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const total = hasta >= desde ? hasta - desde + 1 : 0;

  const handleSubmit = async () => {
    if (!edificioId || !propietarioId) {
      onToast("Selecciona edificio y propietario", "err");
      return;
    }
    if (total <= 0) {
      onToast("El rango desde-hasta no es valido", "err");
      return;
    }
    if (total > 500) {
      onToast("El rango es demasiado grande (max 500)", "err");
      return;
    }
    if (alicuota == null) {
      onToast("La alicuota es obligatoria", "err");
      return;
    }
    setLoading(true);
    let ok = 0;
    let fail = 0;
    for (let n = desde; n <= hasta; n++) {
      try {
        await departamentosApi.crear(edificioId, propietarioId, {
          numero: String(n),
          piso: null,
          area: area ?? null,
          alicuota,
          observaciones: "",
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setLoading(false);
    if (ok > 0) {
      onToast(`Creados ${ok} departamento${ok === 1 ? "" : "s"}${fail > 0 ? ` (fallaron ${fail})` : ""}`, "ok");
      onDone();
    } else {
      onToast(`No se creo ninguno (fallaron ${fail})`, "err");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Crear departamentos en masa" footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={loading || !edificioId || !propietarioId}>
          {loading ? "Creando..." : `Crear ${total} departamento${total === 1 ? "" : "s"}`}
        </Button>
      </>
    }>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Edificio *</label>
            <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={edificioId || ""} onChange={(e) => setEdificioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Propietario *</label>
            <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={propietarioId || ""} onChange={(e) => setPropietarioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {propietarios.map((p) => <option key={p.id} value={p.id}>{p.cedula} {p.usuario ? `- ${p.usuario.nombre}` : ""}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Numero desde *</label>
            <Input type="number" value={desde} onChange={(e) => setDesde(Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm font-medium">Numero hasta *</label>
            <Input type="number" value={hasta} onChange={(e) => setHasta(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Area (m2)</label>
            <Input type="number" step="0.01" value={area ?? ""} onChange={(e) => setArea(e.target.value ? Number(e.target.value) : null)} />
          </div>
          <div>
            <label className="text-sm font-medium">Alicuota *</label>
            <Input type="number" step="0.01" value={alicuota ?? ""} onChange={(e) => setAlicuota(e.target.value ? Number(e.target.value) : null)} />
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Se crearan {total} departamento{total === 1 ? "" : "s"} con numero {desde}..{hasta} en el edificio seleccionado,
          todos asignados al mismo propietario. Los que ya existan se omitiran.
        </p>
      </div>
    </Modal>
  );
}

function DepartamentoDetalle({
  departamento, inquilinoActivo, onClose, onEdit,
}: {
  departamento: Departamento; inquilinoActivo: Inquilino | null; onClose: () => void; onEdit: () => void;
}) {
  const info: { label: string; value: React.ReactNode; icon: any }[] = [
    { label: "Numero", value: departamento.numero, icon: Hash },
    { label: "Edificio", value: departamento.edificio?.nombre || "-", icon: Building2 },
    { label: "Piso", value: departamento.piso ?? "-", icon: Layers },
    { label: "Area", value: departamento.area ? `${departamento.area} m2` : "-", icon: Square },
    { label: "Alicuota", value: formatMoney(departamento.alicuota), icon: DollarSign },
    { label: "Identificador", value: departamento.identificadorCompleto || `${departamento.edificio?.nombre}-${departamento.numero}`, icon: HashIcon },
  ];

  const prop = departamento.propietario;
  const persona = inquilinoActivo || prop;
  const personaTitulo = inquilinoActivo ? "Inquilino activo" : "Propietario";

  const personaInfo: { label: string; value: React.ReactNode; icon: any }[] = persona
    ? [
        { label: "Cedula", value: ("cedula" in persona ? persona.cedula : prop?.cedula) || "-", icon: IdCard },
        { label: "Nombre", value: persona.nombre || `${prop?.usuario?.nombre || ""} ${prop?.usuario?.apellido || ""}`.trim() || "-", icon: UserCog },
        { label: "Apellido", value: persona.apellido || prop?.usuario?.apellido || "-", icon: UserCog },
        { label: "Email", value: ("correo" in persona ? persona.correo : prop?.usuario?.email) || prop?.usuario?.email || "-", icon: Mail },
        { label: "Telefono", value: ("telefono" in persona ? persona.telefono : prop?.telefono) || "-", icon: Phone },
        ...(inquilinoActivo && inquilinoActivo.fechaIngreso
          ? [{ label: "Fecha ingreso", value: formatDate(inquilinoActivo.fechaIngreso), icon: Calendar }]
          : []),
        ...(inquilinoActivo
          ? [{ label: "Estado", value: <Badge className="bg-green-100 text-green-700 border-green-200 border">{inquilinoActivo.estado}</Badge>, icon: CheckCircle2 }]
          : []),
      ]
    : [];

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {departamento.numero}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base">Departamento {departamento.numero}</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {departamento.edificio?.nombre} {departamento.identificadorCompleto ? `- ${departamento.identificadorCompleto}` : ""}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit2 className="w-3.5 h-3.5 mr-1" />Editar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 max-h-[60vh] lg:max-h-[68vh] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/40">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Informacion del departamento</h3>
            </div>
            <dl className="space-y-2.5">
              {info.map((it) => {
                const Icon = it.icon;
                return (
                  <div key={it.label} className="flex items-start gap-3 text-sm">
                    <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <dt className="text-xs text-slate-500">{it.label}</dt>
                      <dd className="font-medium text-slate-900 dark:text-white break-words">{it.value}</dd>
                    </div>
                  </div>
                );
              })}
              {departamento.observaciones && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Observaciones</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{departamento.observaciones}</p>
                </div>
              )}
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${inquilinoActivo ? "bg-purple-100 dark:bg-purple-900/40" : "bg-emerald-100 dark:bg-emerald-900/40"}`}>
                  <UserCog className={`w-4 h-4 ${inquilinoActivo ? "text-purple-600" : "text-emerald-600"}`} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{personaTitulo}</h3>
              </div>
              {inquilinoActivo ? (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 border">Inquilino</Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border">Propietario</Badge>
              )}
            </div>
            {persona ? (
              <dl className="space-y-2.5">
                {personaInfo.map((it) => {
                  const Icon = it.icon;
                  return (
                    <div key={it.label} className="flex items-start gap-3 text-sm">
                      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <dt className="text-xs text-slate-500">{it.label}</dt>
                        <dd className="font-medium text-slate-900 dark:text-white break-words">{it.value}</dd>
                      </div>
                    </div>
                  );
                })}
              </dl>
            ) : (
              <EmptyState title="Sin informacion" description="No hay propietario asignado." icon={UserCog} />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DepartamentoForm({ open, onClose, editing, edificios, propietarios, onSave }: {
  open: boolean; onClose: () => void; editing: Departamento | null;
  edificios: Edificio[]; propietarios: Propietario[];
  onSave: (edificioId: number, propietarioId: number, data: Partial<Departamento>) => void;
}) {
  const [form, setForm] = useState<Partial<Departamento>>({});
  const [edificioId, setEdificioId] = useState<number | null>(null);
  const [propietarioId, setPropietarioId] = useState<number | null>(null);

  useEffect(() => {
    if (editing) {
      setForm(editing);
      setEdificioId(editing.edificio?.id || null);
      setPropietarioId(editing.propietario?.id || null);
    } else {
      setForm({});
      setEdificioId(null);
      setPropietarioId(null);
    }
  }, [editing, open]);

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar Departamento" : "Nuevo Departamento"} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!edificioId || !propietarioId}
          onClick={() => edificioId && propietarioId && onSave(edificioId, propietarioId, form)}
        >
          Guardar
        </Button>
      </>
    }>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Edificio *</label>
            <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={edificioId || ""} onChange={(e) => setEdificioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Propietario *</label>
            <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={propietarioId || ""} onChange={(e) => setPropietarioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {propietarios.map((p) => <option key={p.id} value={p.id}>{p.cedula} {p.usuario ? `- ${p.usuario.nombre}` : ""}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Numero *</label>
            <Input value={form.numero || ""} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Piso</label>
            <Input type="number" value={form.piso ?? ""} onChange={(e) => setForm({ ...form, piso: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="text-sm font-medium">Area</label>
            <Input type="number" step="0.01" value={form.area ?? ""} onChange={(e) => setForm({ ...form, area: e.target.value ? Number(e.target.value) : null })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Alicuota *</label>
          <Input type="number" step="0.01" value={form.alicuota ?? ""} onChange={(e) => setForm({ ...form, alicuota: e.target.value ? Number(e.target.value) : 0 })} />
        </div>
        <div>
          <label className="text-sm font-medium">Observaciones</label>
          <Input value={form.observaciones || ""} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}

function PropietariosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => propietariosApi.listar());
  const { data: edificiosData } = useFetch(() => edificiosApi.listar());
  const { data: departamentosData } = useFetch(() => departamentosApi.listar());
  const [confirm, setConfirm] = useState<{ id: number; cedula: string } | null>(null);
  const [edificioFilter, setEdificioFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);

  const edificios = edificiosData?.edificios || [];

  const departamentosPorPropietario = useMemo(() => {
    const map: Record<number, Departamento[]> = {};
    (departamentosData || []).forEach((d) => {
      const pid = d.propietario?.id;
      if (pid != null) {
        if (!map[pid]) map[pid] = [];
        map[pid].push(d);
      }
    });
    return map;
  }, [departamentosData]);

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((p) => {
      const dpts = departamentosPorPropietario[p.id] || [];
      const matchEdif = edificioFilter === "all" || dpts.some((d) => d.edificio?.id === edificioFilter);
      const s = search.toLowerCase();
      const matchSearch = !s ||
        p.cedula.includes(search) ||
        (p.usuario?.nombre || "").toLowerCase().includes(s) ||
        (p.usuario?.apellido || "").toLowerCase().includes(s) ||
        (p.usuario?.email || "").toLowerCase().includes(s);
      return matchEdif && matchSearch;
    });
  }, [data, edificioFilter, search, departamentosPorPropietario]);

  const handleDelete = async (id: number) => {
    try {
      await propietariosApi.eliminar(id);
      onToast("Propietario eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Propietarios"
        subtitle="Consulta los propietarios y los departamentos que administran"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                className="pl-9 pr-3 h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm min-w-[180px]"
                value={edificioFilter}
                onChange={(e) => setEdificioFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
              >
                <option value="all">Todos los edificios</option>
                {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                className="pl-10 w-full md:w-72"
                placeholder="Buscar cedula, nombre, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setBulkOpen(true)}>
              <Users className="w-4 h-4 mr-2" />Crear inquilinos en masa
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-0">
          <LoadingOrError loading={loading} error={error} onRetry={reload} />
          {data && !loading && !error && (
            filtered.length === 0 ? (
              <EmptyState title="Sin propietarios" description="No hay propietarios con los filtros actuales." icon={UserCog} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <th className="py-3 px-4">Cedula</th>
                      <th className="py-3 px-4">Nombre</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Telefono</th>
                      <th className="py-3 px-4">Edificios / Deptos</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p) => {
                      const dpts = departamentosPorPropietario[p.id] || [];
                      const edifsSet = new Set(dpts.map((d) => d.edificio?.id).filter(Boolean));
                      return (
                        <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="py-3 px-4 font-medium">{p.cedula}</td>
                          <td className="py-3 px-4">{p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido || ""}` : "-"}</td>
                          <td className="py-3 px-4 text-slate-500">{p.usuario?.email || "-"}</td>
                          <td className="py-3 px-4">{p.telefono || "-"}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200 border text-[10px]">
                                {edifsSet.size} edificio{edifsSet.size === 1 ? "" : "s"}
                              </Badge>
                              <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border text-[10px]">
                                {dpts.length} depto{dpts.length === 1 ? "" : "s"}
                              </Badge>
                              {dpts.slice(0, 3).map((d) => (
                                <span key={d.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {d.identificadorCompleto || `${d.edificio?.nombre}-${d.numero}`}
                                </span>
                              ))}
                              {dpts.length > 3 && <span className="text-[10px] text-slate-500">+{dpts.length - 3}</span>}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button onClick={() => setConfirm({ id: p.id, cedula: p.cedula })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el propietario con cedula ${confirm?.cedula}?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
      <InquilinoBulkForm
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        propietarios={data || []}
        onToast={onToast}
        onDone={() => { setBulkOpen(false); reload(); }}
      />
    </div>
  );
}

function InquilinoBulkForm({ open, onClose, propietarios, onToast, onDone }: {
  open: boolean; onClose: () => void;
  propietarios: Propietario[];
  onToast: (m: string, t: "ok" | "err") => void;
  onDone: () => void;
}) {
  const [propietarioId, setPropietarioId] = useState<number | null>(null);
  const [deptos, setDeptos] = useState<Departamento[]>([]);
  const [deptosConInquilino, setDeptosConInquilino] = useState<Set<number>>(new Set());
  const [nombreBase, setNombreBase] = useState("Inquilino");
  const [cedulaInicial, setCedulaInicial] = useState<number>(1000000001);
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [modo, setModo] = useState<"manual" | "excel">("manual");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [filas, setFilas] = useState<any[] | null>(null);

  useEffect(() => {
    if (!open) {
      setPropietarioId(null);
      setDeptos([]);
      setDeptosConInquilino(new Set());
      setNombreBase("Inquilino");
      setCedulaInicial(1000000001);
      setTelefono("");
      setCorreo("");
      setFechaIngreso("");
      setModo("manual");
      setArchivo(null);
      setFilas(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !propietarioId) {
      setDeptos([]);
      setDeptosConInquilino(new Set());
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const resp = await departamentosApi.listarPorPropietario(propietarioId);
        const list = resp?.departamentos || [];
        if (cancelled) return;
        setDeptos(list);
        const iguales = await inquilinosApi.listar();
        if (cancelled) return;
        const ocupados = new Set<number>();
        (iguales || []).forEach((i) => {
          if (i.departamento?.id != null) ocupados.add(i.departamento.id);
        });
        setDeptosConInquilino(ocupados);
      } catch {
        if (!cancelled) {
          setDeptos([]);
          setDeptosConInquilino(new Set());
        }
      }
    })();
    return () => { cancelled = true; };
  }, [open, propietarioId]);

  const disponibles = deptos.filter((d) => !deptosConInquilino.has(d.id));
  const total = disponibles.length;

  const handleSubmit = async () => {
    if (!propietarioId) {
      onToast("Selecciona un propietario", "err");
      return;
    }
    if (total === 0) {
      onToast("No hay departamentos disponibles (todos tienen inquilino)", "err");
      return;
    }
    if (!nombreBase.trim()) {
      onToast("El nombre base es obligatorio", "err");
      return;
    }
    setLoading(true);
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < disponibles.length; i++) {
      const d = disponibles[i];
      try {
        await inquilinosApi.crear(d.id, {
          cedula: String(cedulaInicial + i),
          nombre: `${nombreBase} ${d.numero}`.trim(),
          apellido: null,
          telefono: telefono || null,
          correo: correo || null,
          fechaIngreso: fechaIngreso || null,
          fechaSalida: null,
          estado: "ACTIVO",
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setLoading(false);
    if (ok > 0) {
      onToast(`Creados ${ok} inquilino${ok === 1 ? "" : "s"}${fail > 0 ? ` (fallaron ${fail})` : ""}`, "ok");
      onDone();
    } else {
      onToast(`No se creo ninguno (fallaron ${fail})`, "err");
    }
  };

  const handleDownloadPlantilla = () => {
    import("xlsx").then((XLSX) => {
      const wsData = [
        ["departamentoNumero", "cedula", "nombre", "apellido", "telefono", "correo", "fechaIngreso"],
        ["101", "0901234567", "Juan", "Perez", "0987654321", "juan@example.com", "2026-01-01"],
        ["102", "0902345678", "Maria", "Lopez", "0991234567", "maria@example.com", "2026-01-15"],
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 24 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inquilinos");
      XLSX.writeFile(wb, "plantilla_inquilinos.xlsx");
    }).catch(() => onToast("No se pudo generar la plantilla", "err"));
  };

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setFilas(null);
    import("xlsx").then((XLSX) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = new Uint8Array(ev.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
          setFilas(rows);
        } catch {
          onToast("No se pudo leer el archivo Excel", "err");
          setFilas(null);
        }
      };
      reader.readAsArrayBuffer(f);
    }).catch(() => onToast("Libreria xlsx no disponible", "err"));
  };

  const handleExcelSubmit = async () => {
    if (!propietarioId) {
      onToast("Selecciona un propietario", "err");
      return;
    }
    if (!filas || filas.length === 0) {
      onToast("El archivo no tiene filas validas", "err");
      return;
    }
    const porNumero = new Map<number, Departamento>();
    deptos.forEach((d) => {
      if (d.numero && !isNaN(Number(d.numero))) porNumero.set(Number(d.numero), d);
    });
    let ok = 0;
    let fail = 0;
    const noMatch: string[] = [];
    setLoading(true);
    for (const r of filas) {
      const num = r.departamentoNumero ?? r["Departamento"] ?? r["departamento"];
      const cedula = String(r.cedula ?? r["Cedula"] ?? "").trim();
      const nombre = String(r.nombre ?? r["Nombre"] ?? "").trim();
      const apellido = (r.apellido ?? r["Apellido"] ?? "").toString().trim() || null;
      const tel = (r.telefono ?? r["Telefono"] ?? "").toString().trim() || null;
      const correo = (r.correo ?? r["Correo"] ?? "").toString().trim() || null;
      const fecha = (r.fechaIngreso ?? r["FechaIngreso"] ?? "").toString().trim() || null;
      const numKey = Number(num);
      const d = porNumero.get(numKey);
      if (!d) { noMatch.push(String(num)); fail++; continue; }
      if (!cedula || !nombre) { fail++; continue; }
      if (deptosConInquilino.has(d.id)) { fail++; continue; }
      try {
        await inquilinosApi.crear(d.id, {
          cedula, nombre, apellido, telefono: tel, correo,
          fechaIngreso: fecha, fechaSalida: null, estado: "ACTIVO",
        });
        ok++;
      } catch {
        fail++;
      }
    }
    setLoading(false);
    if (ok > 0) {
      const msg = `Creados ${ok} inquilino${ok === 1 ? "" : "s"}${fail > 0 ? ` (fallaron ${fail})` : ""}${noMatch.length ? ` - deptos no encontrados: ${noMatch.slice(0, 5).join(", ")}${noMatch.length > 5 ? "..." : ""}` : ""}`;
      onToast(msg, "ok");
      onDone();
    } else {
      onToast(`No se creo ninguno (fallaron ${fail})${noMatch.length ? ` - deptos no encontrados: ${noMatch.slice(0, 5).join(", ")}` : ""}`, "err");
    }
  };

  return (
    <Modal open={open} onClose={onClose} size="lg" title="Crear inquilinos en masa" footer={
      <>
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
        {modo === "manual" ? (
          <Button onClick={handleSubmit} disabled={loading || !propietarioId || total === 0}>
            {loading ? "Creando..." : `Crear ${total} inquilino${total === 1 ? "" : "s"}`}
          </Button>
        ) : (
          <Button onClick={handleExcelSubmit} disabled={loading || !propietarioId || !filas || filas.length === 0}>
            {loading ? "Creando..." : `Crear ${filas?.length || 0} inquilino${(filas?.length || 0) === 1 ? "" : "s"}`}
          </Button>
        )}
      </>
    }>
      <div className="space-y-3">
        {propietarios.length === 0 && (
          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-700 dark:text-amber-300">
            No hay propietarios registrados. Crea al menos un propietario primero.
          </div>
        )}

        <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden">
          <button onClick={() => setModo("manual")} className={`flex-1 py-1.5 px-3 text-sm font-medium transition-colors ${modo === "manual" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600"}`}>
            Datos comunes (rapido)
          </button>
          <button onClick={() => setModo("excel")} className={`flex-1 py-1.5 px-3 text-sm font-medium transition-colors ${modo === "excel" ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-900 text-slate-600"}`}>
            <FileSpreadsheet className="w-4 h-4 inline mr-1" />Importar Excel
          </button>
        </div>

        <div>
          <label className="text-sm font-medium">Propietario *</label>
          <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={propietarioId || ""} onChange={(e) => setPropietarioId(e.target.value ? Number(e.target.value) : null)} disabled={propietarios.length === 0}>
            <option value="">Seleccionar...</option>
            {propietarios.map((p) => <option key={p.id} value={p.id}>{p.cedula} {p.usuario ? `- ${p.usuario.nombre}` : ""}</option>)}
          </select>
        </div>

        {propietarioId && (
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
            Departamentos del propietario: <strong>{deptos.length}</strong> ·
            Disponibles (sin inquilino): <strong>{total}</strong>
          </div>
        )}

        {modo === "manual" ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Nombre base *</label>
                <Input value={nombreBase} onChange={(e) => setNombreBase(e.target.value)} placeholder="Ej: Inquilino" />
              </div>
              <div>
                <label className="text-sm font-medium">Cedula inicial *</label>
                <Input type="number" value={cedulaInicial} onChange={(e) => setCedulaInicial(Number(e.target.value))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Telefono</label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Correo</label>
                <Input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de ingreso</label>
              <Input type="date" value={fechaIngreso} onChange={(e) => setFechaIngreso(e.target.value)} />
            </div>
            <p className="text-xs text-slate-500">
              Se creara un inquilino por cada departamento disponible del propietario.
              El nombre sera `{nombreBase || "Inquilino"} &lt;numero de departamento&gt;` y la cedula incrementa desde {cedulaInicial}.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="text-sm">
                <FileSpreadsheet className="w-5 h-5 inline mr-1 text-emerald-600" />
                Plantilla Excel con el formato esperado
              </div>
              <Button variant="outline" onClick={handleDownloadPlantilla}>
                <Download className="w-4 h-4 mr-2" />Descargar plantilla
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium">Archivo Excel (.xlsx) *</label>
              <Input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleArchivo}
                className="cursor-pointer"
              />
            </div>
            {archivo && filas && (
              <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <CheckCircle2 className="w-4 h-4 inline mr-1 text-emerald-600" />
                  {filas.length} fila{filas.length === 1 ? "" : "s"} detectada{filas.length === 1 ? "" : "s"}
                </p>
                <div className="max-h-32 overflow-y-auto mt-1">
                  <table className="w-full text-[11px]">
                    <thead><tr className="text-slate-400">{Object.keys(filas[0] || {}).slice(0, 6).map((h) => <th key={h} className="text-left pr-2">{h}</th>)}</tr></thead>
                    <tbody>
                      {filas.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-t border-slate-200 dark:border-slate-700">
                          {Object.values(r).slice(0, 6).map((v, j) => <td key={j} className="pr-2 py-0.5">{String(v)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filas.length > 5 && <p className="text-slate-400 mt-1">...y {filas.length - 5} mas</p>}
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Formato: columnas <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">departamentoNumero, cedula, nombre, apellido, telefono, correo, fechaIngreso</code>.
              El <strong>departamentoNumero</strong> debe coincidir con un departamento del propietario seleccionado.
              Las fechas en formato AAAA-MM-DD. Los que ya tengan inquilino se omitiran.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

function CargosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => cargosApi.listar());
  const { data: departamentosData } = useFetch(() => departamentosApi.listar());
  const { data: tiposData } = useFetch(() => tiposCargosApi.listarActivos());
  const [open, setOpen] = useState(false);
  const [pagoOpen, setPagoOpen] = useState<Cargo | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; descripcion: string } | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodValue>({ mode: "current" });
  const [generating, setGenerating] = useState(false);

  const filteredByPeriod = useMemo(() => filterByPeriod(data || [], period, "fechaGeneracion"), [data, period]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return filteredByPeriod.filter((c) =>
      (c.descripcion || "").toLowerCase().includes(s) ||
      c.departamento?.identificadorCompleto?.toLowerCase().includes(s) ||
      c.tipoCargo?.nombre.toLowerCase().includes(s)
    );
  }, [filteredByPeriod, search]);

  const totalCargos = filteredByPeriod.reduce((s, c) => s + (c.valor || 0), 0);
  const totalPagado = filteredByPeriod.filter((c) => c.estado === "PAGADO").reduce((s, c) => s + (c.valor || 0), 0);
  const totalPendiente = filteredByPeriod.filter((c) => c.estado === "PENDIENTE" || c.estado === "PARCIAL").reduce((s, c) => s + (c.valor || 0), 0);

  const handleSave = async (departamentoId: number, tipoCargoId: number, form: Partial<Cargo>) => {
    try {
      await cargosApi.crear(departamentoId, tipoCargoId, null, form);
      onToast("Cargo creado", "ok");
      setOpen(false);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await cargosApi.eliminar(id);
      onToast("Cargo eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleGenerarAlicuotas = async () => {
    const now = new Date();
    setGenerating(true);
    try {
      const depts = (departamentosData || []) as Departamento[];
      const tipos = (tiposData as TipoCargo[]) || [];
      const tipoAlicuota =
        tipos.find((t) => /alicuota|al[ií]cuota/i.test(t.nombre)) || tipos[0];

      if (!tipoAlicuota) {
        onToast("No hay tipos de cargo configurados. Crea al menos uno antes de generar alicuotas.", "err");
        return;
      }
      if (depts.length === 0) {
        onToast("No hay departamentos registrados.", "err");
        return;
      }

      const fechaGen = now.toISOString().substring(0, 10);
      const vencimiento = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().substring(0, 10);

      let ok = 0;
      let fallidos = 0;
      for (const d of depts) {
        const alicuota = Number(d.alicuota) || 0;
        if (alicuota <= 0) { fallidos++; continue; }
        try {
          await cargosApi.crear(d.id, tipoAlicuota.id, null, {
            valor: alicuota,
            estado: "PENDIENTE",
            fechaGeneracion: fechaGen,
            fechaVencimiento: vencimiento,
            descripcion: `Alicuota ${now.toLocaleDateString("es-EC", { month: "long", year: "numeric" })}`,
          });
          ok++;
        } catch {
          fallidos++;
        }
      }
      onToast(`Alicuotas generadas: ${ok} creadas${fallidos > 0 ? `, ${fallidos} omitidas` : ""}`, "ok");
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error al generar alicuotas", "err");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Cargos"
        subtitle="Gestiona los cargos aplicados a los departamentos"
        action={
          <>
            <Button variant="outline" onClick={handleGenerarAlicuotas} disabled={generating} className="whitespace-nowrap">
              <Receipt className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{generating ? "Generando..." : "Generar Alicuotas"}</span>
              <span className="md:hidden">Alicuotas</span>
            </Button>
            <Button onClick={() => setOpen(true)} className="whitespace-nowrap">
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline">Nuevo cargo</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
          </>
        }
      />

      <Card>
        <CardContent className="p-4">
          <PeriodFilter value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Cargos ({periodLabel(period)})</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{formatMoney(totalCargos)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Cobrado</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{formatMoney(totalPagado)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Pendiente</p>
              <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1">{formatMoney(totalPendiente)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </CardContent></Card>
      </div>

      <TableCard
        title="Cargos aplicados"
        action={
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input className="pl-10 w-64" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        }
      >
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && !loading && !error && (
          filtered.length === 0 ? (
            <EmptyState title="Sin cargos" description="No hay cargos en el periodo seleccionado." icon={Receipt} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-3 px-3">Departamento</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Descripcion</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Vencimiento</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">{c.departamento?.identificadorCompleto || "-"}</td>
                      <td className="py-3 px-3">{c.tipoCargo?.nombre}</td>
                      <td className="py-3 px-3 text-slate-500">{c.descripcion || "-"}</td>
                      <td className="py-3 px-3 font-medium">{formatMoney(c.valor)}</td>
                      <td className="py-3 px-3">{formatDate(c.fechaVencimiento)}</td>
                      <td className="py-3 px-3"><StatusBadge estado={c.estado} /></td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          {c.estado !== "PAGADO" && c.estado !== "ANULADO" && (
                            <Button size="sm" onClick={() => setPagoOpen(c)} className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700">
                              <CreditCard className="w-3 h-3 mr-1" />Pagar
                            </Button>
                          )}
                          <button onClick={() => setConfirm({ id: c.id, descripcion: c.descripcion || `Cargo ${c.id}` })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </TableCard>

      <CargoForm
        open={open} onClose={() => setOpen(false)}
        departamentos={departamentosData || []} tipos={(tiposData as TipoCargo[]) || []} onSave={handleSave}
      />
      <PagoForm
        open={!!pagoOpen} cargo={pagoOpen} onClose={() => setPagoOpen(null)}
        onSaved={() => { setPagoOpen(null); reload(); onToast("Pago registrado correctamente", "ok"); }}
        onError={(m) => onToast(m, "err")}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el cargo "${confirm?.descripcion}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function CargoForm({ open, onClose, departamentos, tipos, onSave }: {
  open: boolean; onClose: () => void;
  departamentos: Departamento[]; tipos: TipoCargo[];
  onSave: (departamentoId: number, tipoCargoId: number, data: Partial<Cargo>) => void;
}) {
  const [form, setForm] = useState<Partial<Cargo>>({});
  const [departamentoId, setDepartamentoId] = useState<number | null>(null);
  const [tipoCargoId, setTipoCargoId] = useState<number | null>(null);
  useEffect(() => {
    if (open) {
      setForm({ estado: "PENDIENTE", fechaGeneracion: new Date().toISOString().substring(0, 10) });
      setDepartamentoId(null);
      setTipoCargoId(null);
    }
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Nuevo Cargo" footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!departamentoId || !tipoCargoId}
          onClick={() => departamentoId && tipoCargoId && onSave(departamentoId, tipoCargoId, form)}
        >
          Guardar
        </Button>
      </>
    }>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Departamento *</label>
          <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={departamentoId || ""} onChange={(e) => setDepartamentoId(Number(e.target.value))}>
            <option value="">Seleccionar...</option>
            {departamentos.map((d) => <option key={d.id} value={d.id}>{d.identificadorCompleto || `${d.edificio?.nombre} - ${d.numero}`}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Tipo de Cargo *</label>
          <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={tipoCargoId || ""} onChange={(e) => setTipoCargoId(Number(e.target.value))}>
            <option value="">Seleccionar...</option>
            {tipos.map((t: any) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Fecha generacion *</label>
            <Input type="date" value={form.fechaGeneracion || ""} onChange={(e) => setForm({ ...form, fechaGeneracion: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Fecha vencimiento</label>
            <Input type="date" value={form.fechaVencimiento || ""} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Valor *</label>
          <Input type="number" step="0.01" value={form.valor ?? ""} onChange={(e) => setForm({ ...form, valor: e.target.value ? Number(e.target.value) : 0 })} />
        </div>
        <div>
          <label className="text-sm font-medium">Descripcion</label>
          <Input value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}

function PagoForm({ open, cargo, onClose, onSaved, onError }: {
  open: boolean; cargo: Cargo | null; onClose: () => void;
  onSaved: () => void; onError: (m: string) => void;
}) {
  const [form, setForm] = useState<Partial<Pago>>({});
  useEffect(() => {
    if (open) {
      setForm({
        fecha: new Date().toISOString().substring(0, 10),
        montoTotal: cargo?.valor || 0,
        metodoPago: "TRANSFERENCIA",
        numeroComprobante: "",
        pagadoPor: "",
      });
    }
  }, [open, cargo]);

  const submit = async () => {
    if (!cargo) return;
    try {
      await pagosApi.crear(cargo.departamento.id, null, {
        pago: { ...form, fecha: form.fecha || new Date().toISOString().substring(0, 10) },
        cargosIds: [cargo.id],
      });
      onSaved();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Error al registrar pago");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Registrar pago - ${formatMoney(cargo?.valor)}`} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={submit} className="bg-green-600 hover:bg-green-700">
          <CheckCircle2 className="w-4 h-4 mr-2" />Registrar pago
        </Button>
      </>
    }>
      {cargo && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500">Cargo</p>
            <p className="font-medium">{cargo.tipoCargo?.nombre} - {cargo.departamento?.identificadorCompleto}</p>
            <p className="text-sm text-slate-500 mt-1">Valor: <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(cargo.valor)}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium ">Fecha *</label>
              <Input type="date" value={form.fecha || ""} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Monto *</label>
              <Input type="number" step="0.01" value={form.montoTotal ?? 0} onChange={(e) => setForm({ ...form, montoTotal: e.target.value ? Number(e.target.value) : 0 })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Metodo de pago</label>
              <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={form.metodoPago || "TRANSFERENCIA"} onChange={(e) => setForm({ ...form, metodoPago: e.target.value })}>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="CHEQUE">Cheque</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Nro. comprobante</label>
              <Input value={form.numeroComprobante || ""} onChange={(e) => setForm({ ...form, numeroComprobante: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Pagado por</label>
            <Input value={form.pagadoPor || ""} onChange={(e) => setForm({ ...form, pagadoPor: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Observaciones</label>
            <Input value={form.observaciones || ""} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>
        </div>
      )}
    </Modal>
  );
}

function PagosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => pagosApi.listar());
  const [confirm, setConfirm] = useState<{ id: number; monto: number } | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodValue>({ mode: "current" });

  const filteredByPeriod = useMemo(() => filterByPeriod(data || [], period, "fecha"), [data, period]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return filteredByPeriod.filter((p) =>
      p.departamento?.identificadorCompleto?.toLowerCase().includes(s) ||
      (p.pagadoPor || "").toLowerCase().includes(s) ||
      (p.numeroComprobante || "").toLowerCase().includes(s)
    );
  }, [filteredByPeriod, search]);

  const total = filteredByPeriod.reduce((s, p) => s + (p.montoTotal || 0), 0);

  const handleDelete = async (id: number) => {
    try {
      await pagosApi.eliminar(id);
      onToast("Pago eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Pagos"
        subtitle="Historial de pagos realizados"
      />

      <Card>
        <CardContent className="p-4">
          <PeriodFilter value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Pagos ({periodLabel(period)})</p>
              <p className="text-xl md:text-2xl font-bold text-green-600 mt-1">{formatMoney(total)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Cantidad de pagos</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{filteredByPeriod.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent></Card>
      </div>

      <TableCard title="Pagos registrados" action={
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input className="pl-10 w-64" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      }>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && !loading && !error && (
          filtered.length === 0 ? (
            <EmptyState title="Sin pagos" description="No hay pagos en el periodo seleccionado." icon={Banknote} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Departamento</th>
                    <th className="py-3 px-3">Monto</th>
                    <th className="py-3 px-3">Metodo</th>
                    <th className="py-3 px-3">Comprobante</th>
                    <th className="py-3 px-3">Pagado por</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">{formatDate(p.fecha)}</td>
                      <td className="py-3 px-3">{p.departamento?.identificadorCompleto || "-"}</td>
                      <td className="py-3 px-3 font-medium text-green-600">{formatMoney(p.montoTotal)}</td>
                      <td className="py-3 px-3">{p.metodoPago || "-"}</td>
                      <td className="py-3 px-3">{p.numeroComprobante || "-"}</td>
                      <td className="py-3 px-3">{p.pagadoPor || "-"}</td>
                      <td className="py-3 px-3 text-right">
                        <button onClick={() => setConfirm({ id: p.id, monto: p.montoTotal })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </TableCard>

      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el pago por ${formatMoney(confirm?.monto)}?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function GastosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => gastosApi.listar());
  const { data: edificiosData } = useFetch(() => edificiosApi.listar());
  const { data: tiposData } = useFetch(() => tiposGastosApi.listarActivos());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gasto | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; descripcion: string } | null>(null);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<PeriodValue>({ mode: "current" });
  const [generating, setGenerating] = useState(false);

  const filteredByPeriod = useMemo(() => filterByPeriod(data || [], period, "fecha"), [data, period]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return filteredByPeriod.filter((g) =>
      g.descripcion.toLowerCase().includes(s) ||
      g.edificio?.nombre.toLowerCase().includes(s) ||
      g.tipoGasto?.nombre.toLowerCase().includes(s)
    );
  }, [filteredByPeriod, search]);

  const total = filteredByPeriod.reduce((s, g) => s + (g.valor || 0), 0);
  const pendientesComprobante = filteredByPeriod.filter(comprobanteEsPendiente).length;

  const handleSave = async (edificioId: number, tipoGastoId: number, form: Partial<Gasto>) => {
    try {
      if (editing) {
        await gastosApi.actualizar(editing.id, form);
        onToast("Gasto actualizado", "ok");
      } else {
        await gastosApi.crear(edificioId, tipoGastoId, null, form);
        onToast("Gasto registrado", "ok");
      }
      setOpen(false);
      setEditing(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await gastosApi.eliminar(id);
      onToast("Gasto eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  const handleGenerarMensuales = async () => {
    const now = new Date();
    setGenerating(true);
    try {
      const result = await gastosApi.generarMensuales({ mes: now.getMonth() + 1, anio: now.getFullYear() });
      onToast(`Gastos mensuales generados: ${result.gastosCreados}`, "ok");
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error al generar gastos mensuales", "err");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Gastos"
        subtitle="Control de gastos y comprobantes del condominio"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleGenerarMensuales} disabled={generating}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {generating ? "Generando..." : "Generar Gastos Mensuales"}
            </Button>
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Nuevo gasto
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="p-4">
          <PeriodFilter value={period} onChange={setPeriod} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Total Gastos ({periodLabel(period)})</p>
              <p className="text-xl md:text-2xl font-bold text-red-600 mt-1">{formatMoney(total)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Comprobantes pendientes</p>
              <p className="text-xl md:text-2xl font-bold text-amber-600 mt-1">{pendientesComprobante}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Cantidad de gastos</p>
              <p className="text-xl md:text-2xl font-bold mt-1">{filteredByPeriod.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent></Card>
      </div>

      <TableCard title="Gastos registrados" action={
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <Input className="pl-10 w-64" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      }>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && !loading && !error && (
          filtered.length === 0 ? (
            <EmptyState title="Sin gastos" description="No hay gastos en el periodo seleccionado." icon={Wallet} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <th className="py-3 px-3">Fecha</th>
                    <th className="py-3 px-3">Edificio</th>
                    <th className="py-3 px-3">Tipo</th>
                    <th className="py-3 px-3">Descripcion</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Comprobante</th>
                    <th className="py-3 px-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((g) => {
                    const pend = comprobanteEsPendiente(g);
                    return (
                      <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-3">{formatDate(g.fecha)}</td>
                        <td className="py-3 px-3">{g.edificio?.nombre}</td>
                        <td className="py-3 px-3">{g.tipoGasto?.nombre}</td>
                        <td className="py-3 px-3">{g.descripcion}</td>
                        <td className="py-3 px-3 font-medium text-red-600">{formatMoney(g.valor)}</td>
                        <td className="py-3 px-3">
                          {pend ? (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 border text-[10px]">
                              {COMPROBANTE_PENDIENTE}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1" title={g.comprobante || ""}>
                              {g.comprobante}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => { setEditing(g); setOpen(true); }} className="h-7 px-2 text-xs">
                              <Edit2 className="w-3 h-3 mr-1" />Editar
                            </Button>
                            <button onClick={() => setConfirm({ id: g.id, descripcion: g.descripcion })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </TableCard>

      <GastoForm
        open={open} onClose={() => { setOpen(false); setEditing(null); }}
        edificios={edificiosData?.edificios || []} tipos={tiposData || []} editing={editing} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el gasto "${confirm?.descripcion}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

function GastoForm({ open, onClose, edificios, tipos, editing, onSave }: {
  open: boolean; onClose: () => void;
  edificios: Edificio[]; tipos: TipoGasto[]; editing: Gasto | null;
  onSave: (edificioId: number, tipoGastoId: number, data: Partial<Gasto>) => void;
}) {
  const [form, setForm] = useState<Partial<Gasto>>({});
  const [edificioId, setEdificioId] = useState<number | null>(null);
  const [tipoGastoId, setTipoGastoId] = useState<number | null>(null);
  useEffect(() => {
    if (editing) {
      setForm({ ...editing, comprobante: editing.comprobante || COMPROBANTE_PENDIENTE });
      setEdificioId(editing.edificio?.id || null);
      setTipoGastoId(editing.tipoGasto?.id || null);
    } else {
      setForm({
        fecha: new Date().toISOString().substring(0, 10),
        comprobante: COMPROBANTE_PENDIENTE,
        periodicidadMensual: false,
      });
      setEdificioId(null);
      setTipoGastoId(null);
    }
  }, [editing, open]);
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar Gasto" : "Nuevo Gasto"} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!edificioId || !tipoGastoId}
          onClick={() => edificioId && tipoGastoId && onSave(edificioId, tipoGastoId, form)}
        >
          Guardar
        </Button>
      </>
    }>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Edificio *</label>
            <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={edificioId || ""} onChange={(e) => setEdificioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Tipo *</label>
            <select className="w-full h-9 px-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={tipoGastoId || ""} onChange={(e) => setTipoGastoId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Fecha *</label>
            <Input type="date" value={form.fecha || ""} onChange={(e) => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Valor *</label>
            <Input type="number" step="0.01" value={form.valor ?? ""} onChange={(e) => setForm({ ...form, valor: e.target.value ? Number(e.target.value) : 0 })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Descripcion *</label>
          <Input value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Comprobante (URL, referencia o texto)</label>
          <Input
            placeholder={COMPROBANTE_PENDIENTE}
            value={form.comprobante || ""}
            onChange={(e) => setForm({ ...form, comprobante: e.target.value })}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Si se deja vacio o con el valor por defecto "{COMPROBANTE_PENDIENTE}", se considerara pendiente de revision.
          </p>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <input
            id="periodicidad"
            type="checkbox"
            checked={!!form.periodicidadMensual}
            onChange={(e) => setForm({ ...form, periodicidadMensual: e.target.checked })}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="periodicidad" className="text-sm">
            <span className="font-medium">Periodicidad mensual</span>
            <span className="block text-[11px] text-slate-500">El sistema generara automaticamente los meses futuros.</span>
          </label>
        </div>
      </div>
    </Modal>
  );
}

function ReportesSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const [period, setPeriod] = useState("current");
  const [edificioId, setEdificioId] = useState<string>("");
  const [edificios, setEdificios] = useState<Edificio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    edificiosApi.listarActivos()
      .then((data) => setEdificios(Array.isArray(data) ? data : []))
      .catch(() => setEdificios([]));
  }, []);

  const handleDownload = async (format: "pdf" | "excel") => {
    setLoading(true);
    try {
      const blob = await reportesApi.generar({
        type: "financial",
        period,
        format,
        edificioId: edificioId ? Number(edificioId) : null,
      });
      reportesApi.descargarReporte(blob, format);
      onToast("Reporte generado", "ok");
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />Reporte Financiero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Edificio</label>
            <select
              className="w-full px-3 py-2 mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              value={edificioId}
              onChange={(e) => setEdificioId(e.target.value)}
            >
              <option value="">Todos los edificios</option>
              {edificios.map((e) => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Periodo</label>
            <select className="w-full h-9 px-3 mt-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="current">Mes actual</option>
              <option value="jun-2026">Junio 2026</option>
            </select>
          </div>
          <div className="flex gap-3">
            <Button disabled={loading} onClick={() => handleDownload("pdf")} className="flex-1">
              <Download className="w-4 h-4 mr-2" />PDF
            </Button>
            <Button disabled={loading} variant="outline" onClick={() => handleDownload("excel")} className="flex-1">
              <Download className="w-4 h-4 mr-2" />Excel
            </Button>
          </div>
          {loading && <p className="text-sm text-slate-500 text-center">Generando reporte...</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informacion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            El reporte incluye el detalle de pagos realizados en el periodo y edificio seleccionados,
            con totales y desglose por departamento y metodo de pago. Adicionalmente, se incluye una
            seccion con el detalle completo de los residentes (propietarios e inquilinos):
            cedula, nombre, telefono, correo y estado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection({ user }: { user: any }) {
  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Perfil de Usuario</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
            <IdCard className="w-5 h-5 text-slate-500" />
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
