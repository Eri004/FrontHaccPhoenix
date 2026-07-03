import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard, Building2, Users, CreditCard, Receipt, Wallet,
  Settings, LogOut, Plus, Edit2, Trash2, Search, Download,
  TrendingUp, TrendingDown, DollarSign, Banknote, FileText,
  BarChart3, Home, UserCog, IdCard, Menu, X, RefreshCw, CheckCircle2,
  AlertTriangle, Clock, ChevronRight, Mail, Phone, MapPin,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { useAuth } from "./AuthContext";
import {
  edificiosApi, departamentosApi, propietariosApi, inquilinosApi,
  cargosApi, pagosApi, gastosApi, tiposCargosApi, tiposGastosApi,
  reportesApi,
  type Edificio, type Departamento, type Propietario, type Inquilino,
  type Cargo, type Pago, type Gasto, type TipoCargo, type TipoGasto,
  type EstadoCargo,
} from "../api";
import { ApiError } from "../api/client";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

type Section =
  | "dashboard"
  | "edificios"
  | "departamentos"
  | "propietarios"
  | "inquilinos"
  | "cargos"
  | "pagos"
  | "gastos"
  | "tipos-cargos"
  | "tipos-gastos"
  | "reportes"
  | "settings";

type AdminDashboardProps = { onLogout: () => void };

const NAV: { id: Section; label: string; icon: any; group: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Principal" },
  { id: "edificios", label: "Edificios", icon: Building2, group: "Estructura" },
  { id: "departamentos", label: "Departamentos", icon: Home, group: "Estructura" },
  { id: "propietarios", label: "Propietarios", icon: UserCog, group: "Personas" },
  { id: "inquilinos", label: "Inquilinos", icon: Users, group: "Personas" },
  { id: "cargos", label: "Cargos", icon: Receipt, group: "Finanzas" },
  { id: "pagos", label: "Pagos", icon: Banknote, group: "Finanzas" },
  { id: "gastos", label: "Gastos", icon: Wallet, group: "Finanzas" },
  { id: "tipos-cargos", label: "Tipos de Cargo", icon: FileText, group: "Catalogos" },
  { id: "tipos-gastos", label: "Tipos de Gasto", icon: FileText, group: "Catalogos" },
  { id: "reportes", label: "Reportes", icon: BarChart3, group: "Otros" },
  { id: "settings", label: "Ajustes", icon: Settings, group: "Otros" },
];

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
    <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm ${
      type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
    }`}>
      {type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {message}
    </div>
  );
}

function Modal({
  open, onClose, title, children, footer,
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="p-5 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">{footer}</div>}
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
    PENDIENTE: "bg-amber-100 text-amber-700",
    PARCIAL: "bg-blue-100 text-blue-700",
    PAGADO: "bg-green-100 text-green-700",
    ANULADO: "bg-red-100 text-red-700",
  };
  return <Badge className={colors[estado]}>{estado}</Badge>;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { user } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "ok" | "err" } | null>(null);

  const showToast = (message: string, type: "ok" | "err") => setToast({ message, type });

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <aside className={`${sidebarOpen ? "w-64" : "w-20"} bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all flex flex-col`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-white">HACCPHOENIX</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
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

        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
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

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {NAV.find((n) => n.id === section)?.label}
          </h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString("es-EC", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </header>

        <div className="p-6">
          {section === "dashboard" && <DashboardSection />}
          {section === "edificios" && <EdificiosSection onToast={showToast} />}
          {section === "departamentos" && <DepartamentosSection onToast={showToast} />}
          {section === "propietarios" && <PropietariosSection onToast={showToast} />}
          {section === "inquilinos" && <InquilinosSection onToast={showToast} />}
          {section === "cargos" && <CargosSection onToast={showToast} />}
          {section === "pagos" && <PagosSection onToast={showToast} />}
          {section === "gastos" && <GastosSection onToast={showToast} />}
          {section === "tipos-cargos" && <TiposCargosSection onToast={showToast} />}
          {section === "tipos-gastos" && <TiposGastosSection onToast={showToast} />}
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
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetcher();
      setData(r);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load, setData };
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
    { label: "Edificios", value: edificios?.edificios?.length || 0, icon: Building2, color: "bg-blue-500" },
    { label: "Propietarios", value: propietarios?.length || 0, icon: UserCog, color: "bg-purple-500" },
    { label: "Departamentos", value: departamentos?.length || 0, icon: Home, color: "bg-cyan-500" },
    { label: "Cargos", value: cargos?.length || 0, icon: Receipt, color: "bg-amber-500" },
    { label: "Pagos", value: pagos?.length || 0, icon: Banknote, color: "bg-green-500" },
    { label: "Gastos", value: gastos?.length || 0, icon: Wallet, color: "bg-red-500" },
  ];

  const estadoCargosData = useMemo(() => {
    if (!cargos) return [];
    const count: Record<string, number> = {};
    cargos.forEach((c) => { count[c.estado] = (count[c.estado] || 0) + 1; });
    return Object.entries(count).map(([name, value]) => ({ name, value }));
  }, [cargos]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
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
              <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
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
              <TrendingDown className="w-10 h-10 text-red-500 opacity-50" />
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
              <Clock className="w-10 h-10 text-amber-500 opacity-50" />
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
  const { data, loading, error, reload, setData } = useFetch(() => edificiosApi.listar());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Edificio | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; nombre: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data?.edificios || [];
    return list.filter((e) => e.nombre.toLowerCase().includes(search.toLowerCase()));
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

  return (
    <>
      <TableCard
        title="Edificios registrados"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nuevo
          </Button>
        }
      >
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Direccion</th>
                  <th className="py-3 px-3">Pisos</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{e.id}</td>
                    <td className="py-3 px-3 font-medium">{e.nombre}</td>
                    <td className="py-3 px-3 text-slate-500">{e.direccion}</td>
                    <td className="py-3 px-3">{e.numeroPisos || "-"}</td>
                    <td className="py-3 px-3"><Badge>{e.estado}</Badge></td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => { setEditing(e); setOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => setConfirm({ id: e.id, nombre: e.nombre })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <EdificioForm open={open} onClose={() => { setOpen(false); setEditing(null); }} editing={editing} onSave={handleSave} />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el edificio "${confirm?.nombre}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function EdificioForm({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: Edificio | null; onSave: (data: Partial<Edificio>) => void;
}) {
  const [form, setForm] = useState<Partial<Edificio>>({});
  useEffect(() => { setForm(editing || { estado: "ACTIVO" }); }, [editing, open]);
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
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Numero de pisos</label>
            <Input type="number" value={form.numeroPisos || ""} onChange={(e) => setForm({ ...form, numeroPisos: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={form.estado || "ACTIVO"} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Descripcion</label>
          <Input value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}

function DepartamentosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => departamentosApi.listar());
  const { data: edificiosData } = useFetch(() => edificiosApi.listar());
  const { data: propietariosData } = useFetch(() => propietariosApi.listar());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Departamento | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; numero: string } | null>(null);
  const [search, setSearch] = useState("");

  const edificios = edificiosData?.edificios || [];
  const propietarios = propietariosData || [];

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((d) =>
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.edificio?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (d.propietario?.cedula || "").includes(search)
    );
  }, [data, search]);

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
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <>
      <TableCard
        title="Departamentos"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nuevo
          </Button>
        }
      >
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar por numero, edificio o cedula..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Numero</th>
                  <th className="py-3 px-3">Edificio</th>
                  <th className="py-3 px-3">Piso</th>
                  <th className="py-3 px-3">Area</th>
                  <th className="py-3 px-3">Alicuota</th>
                  <th className="py-3 px-3">Propietario</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{d.id}</td>
                    <td className="py-3 px-3 font-medium">{d.numero}</td>
                    <td className="py-3 px-3">{d.edificio?.nombre}</td>
                    <td className="py-3 px-3">{d.piso || "-"}</td>
                    <td className="py-3 px-3">{d.area ?? "-"}</td>
                    <td className="py-3 px-3">{d.alicuota}</td>
                    <td className="py-3 px-3">{d.propietario?.cedula || "-"}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => { setEditing(d); setOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => setConfirm({ id: d.id, numero: d.numero })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <DepartamentoForm
        open={open} onClose={() => { setOpen(false); setEditing(null); }}
        editing={editing} edificios={edificios} propietarios={propietarios} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el departamento "${confirm?.numero}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
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
            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={edificioId || ""} onChange={(e) => setEdificioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Propietario *</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={propietarioId || ""} onChange={(e) => setPropietarioId(Number(e.target.value))}>
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
  const [confirm, setConfirm] = useState<{ id: number; cedula: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((p) =>
      p.cedula.includes(search) ||
      (p.usuario?.nombre || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.usuario?.email || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

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
    <>
      <TableCard title="Propietarios">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar por cedula, nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Cedula</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Telefono</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{p.id}</td>
                    <td className="py-3 px-3 font-medium">{p.cedula}</td>
                    <td className="py-3 px-3">{p.usuario ? `${p.usuario.nombre} ${p.usuario.apellido || ""}` : "-"}</td>
                    <td className="py-3 px-3 text-slate-500">{p.usuario?.email || "-"}</td>
                    <td className="py-3 px-3">{p.telefono || "-"}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => setConfirm({ id: p.id, cedula: p.cedula })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el propietario con cedula ${confirm?.cedula}?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function InquilinosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => inquilinosApi.listar());
  const { data: departamentosData } = useFetch(() => departamentosApi.listar());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Inquilino | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; nombre: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((i) =>
      i.nombre.toLowerCase().includes(search.toLowerCase()) ||
      i.cedula.includes(search)
    );
  }, [data, search]);

  const handleSave = async (departamentoId: number, form: Partial<Inquilino>) => {
    try {
      if (editing) {
        await inquilinosApi.actualizar(editing.id, form);
        onToast("Inquilino actualizado", "ok");
      } else {
        await inquilinosApi.crear(departamentoId, form);
        onToast("Inquilino creado", "ok");
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
      await inquilinosApi.eliminar(id);
      onToast("Inquilino eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <>
      <TableCard
        title="Inquilinos"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nuevo
          </Button>
        }
      >
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar por nombre o cedula..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Cedula</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Departamento</th>
                  <th className="py-3 px-3">Telefono</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{i.id}</td>
                    <td className="py-3 px-3 font-medium">{i.cedula}</td>
                    <td className="py-3 px-3">{i.nombre} {i.apellido || ""}</td>
                    <td className="py-3 px-3">{i.departamento?.identificadorCompleto || "-"}</td>
                    <td className="py-3 px-3">{i.telefono || "-"}</td>
                    <td className="py-3 px-3"><Badge>{i.estado}</Badge></td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => { setEditing(i); setOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => setConfirm({ id: i.id, nombre: i.nombre })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <InquilinoForm
        open={open} onClose={() => { setOpen(false); setEditing(null); }}
        editing={editing} departamentos={departamentosData || []} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar al inquilino "${confirm?.nombre}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function InquilinoForm({ open, onClose, editing, departamentos, onSave }: {
  open: boolean; onClose: () => void; editing: Inquilino | null;
  departamentos: Departamento[]; onSave: (departamentoId: number, data: Partial<Inquilino>) => void;
}) {
  const [form, setForm] = useState<Partial<Inquilino>>({});
  const [departamentoId, setDepartamentoId] = useState<number | null>(null);
  useEffect(() => {
    if (editing) {
      setForm(editing);
      setDepartamentoId(editing.departamento?.id || null);
    } else {
      setForm({ estado: "ACTIVO" });
      setDepartamentoId(null);
    }
  }, [editing, open]);
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar Inquilino" : "Nuevo Inquilino"} footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button
          disabled={!departamentoId}
          onClick={() => departamentoId && onSave(departamentoId, form)}
        >
          Guardar
        </Button>
      </>
    }>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">Departamento *</label>
          <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={departamentoId || ""} onChange={(e) => setDepartamentoId(Number(e.target.value))}>
            <option value="">Seleccionar...</option>
            {departamentos.map((d) => <option key={d.id} value={d.id}>{d.identificadorCompleto || `${d.edificio?.nombre} - ${d.numero}`}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Cedula *</label>
            <Input value={form.cedula || ""} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Nombre *</label>
            <Input value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Apellido</label>
          <Input value={form.apellido || ""} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Telefono</label>
            <Input value={form.telefono || ""} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Correo</label>
            <Input type="email" value={form.correo || ""} onChange={(e) => setForm({ ...form, correo: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Fecha ingreso</label>
            <Input type="date" value={form.fechaIngreso || ""} onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })} />
          </div>
          <div>
            <label className="text-sm font-medium">Estado</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={form.estado || "ACTIVO"} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CargosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => cargosApi.listar());
  const { data: departamentosData } = useFetch(() => departamentosApi.listar());
  const { data: tiposData } = useFetch(() => tiposCargosApi.listarActivos());
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: number; descripcion: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((c) =>
      (c.descripcion || "").toLowerCase().includes(search.toLowerCase()) ||
      c.departamento?.identificadorCompleto?.toLowerCase().includes(search.toLowerCase()) ||
      c.tipoCargo?.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const totalCargos = data?.reduce((s, c) => s + (c.valor || 0), 0) || 0;
  const totalPagado = data?.filter((c) => c.estado === "PAGADO").reduce((s, c) => s + (c.valor || 0), 0) || 0;
  const totalPendiente = data?.filter((c) => c.estado === "PENDIENTE" || c.estado === "PARCIAL").reduce((s, c) => s + (c.valor || 0), 0) || 0;

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

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Cargos</p><p className="text-xl font-bold">{formatMoney(totalCargos)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Cobrado</p><p className="text-xl font-bold text-green-600">{formatMoney(totalPagado)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Pendiente</p><p className="text-xl font-bold text-amber-600">{formatMoney(totalPendiente)}</p></CardContent></Card>
      </div>
      <TableCard
        title="Cargos aplicados"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Nuevo cargo
          </Button>
        }
      >
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
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
                  <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{c.id}</td>
                    <td className="py-3 px-3">{c.departamento?.identificadorCompleto || "-"}</td>
                    <td className="py-3 px-3">{c.tipoCargo?.nombre}</td>
                    <td className="py-3 px-3">{c.descripcion || "-"}</td>
                    <td className="py-3 px-3 font-medium">{formatMoney(c.valor)}</td>
                    <td className="py-3 px-3">{formatDate(c.fechaVencimiento)}</td>
                    <td className="py-3 px-3"><StatusBadge estado={c.estado} /></td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => setConfirm({ id: c.id, descripcion: c.descripcion || `Cargo ${c.id}` })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <CargoForm
        open={open} onClose={() => setOpen(false)}
        departamentos={departamentosData || []} tipos={tiposData || []} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el cargo "${confirm?.descripcion}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
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
          <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={departamentoId || ""} onChange={(e) => setDepartamentoId(Number(e.target.value))}>
            <option value="">Seleccionar...</option>
            {departamentos.map((d) => <option key={d.id} value={d.id}>{d.identificadorCompleto || `${d.edificio?.nombre} - ${d.numero}`}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Tipo de Cargo *</label>
          <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={tipoCargoId || ""} onChange={(e) => setTipoCargoId(Number(e.target.value))}>
            <option value="">Seleccionar...</option>
            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
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

function PagosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => pagosApi.listar());
  const [confirm, setConfirm] = useState<{ id: number; monto: number } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((p) =>
      p.departamento?.identificadorCompleto?.toLowerCase().includes(search.toLowerCase()) ||
      (p.pagadoPor || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.numeroComprobante || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const total = data?.reduce((s, p) => s + (p.montoTotal || 0), 0) || 0;

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
    <>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Total Pagos</p><p className="text-xl font-bold text-green-600">{formatMoney(total)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-slate-500">Cantidad de pagos</p><p className="text-xl font-bold">{data?.length || 0}</p></CardContent></Card>
      </div>
      <TableCard title="Pagos registrados">
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar por departamento, pagado por o comprobante..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
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
                  <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{p.id}</td>
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
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el pago por ${formatMoney(confirm?.monto)}?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function GastosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => gastosApi.listar());
  const { data: edificiosData } = useFetch(() => edificiosApi.listar());
  const { data: tiposData } = useFetch(() => tiposGastosApi.listarActivos());
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ id: number; descripcion: string } | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = data || [];
    return list.filter((g) =>
      g.descripcion.toLowerCase().includes(search.toLowerCase()) ||
      g.edificio?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      g.tipoGasto?.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const total = data?.reduce((s, g) => s + (g.valor || 0), 0) || 0;

  const handleSave = async (edificioId: number, tipoGastoId: number, form: Partial<Gasto>) => {
    try {
      await gastosApi.crear(edificioId, tipoGastoId, null, form);
      onToast("Gasto registrado", "ok");
      setOpen(false);
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

  return (
    <>
      <Card className="mb-4"><CardContent className="p-4"><p className="text-xs text-slate-500">Total Gastos</p><p className="text-xl font-bold text-red-600">{formatMoney(total)}</p></CardContent></Card>
      <TableCard
        title="Gastos registrados"
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />Nuevo gasto
          </Button>
        }
      >
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input className="pl-10" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Edificio</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Descripcion</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{g.id}</td>
                    <td className="py-3 px-3">{formatDate(g.fecha)}</td>
                    <td className="py-3 px-3">{g.edificio?.nombre}</td>
                    <td className="py-3 px-3">{g.tipoGasto?.nombre}</td>
                    <td className="py-3 px-3">{g.descripcion}</td>
                    <td className="py-3 px-3 font-medium text-red-600">{formatMoney(g.valor)}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => setConfirm({ id: g.id, descripcion: g.descripcion })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <GastoForm
        open={open} onClose={() => setOpen(false)}
        edificios={edificiosData?.edificios || []} tipos={tiposData || []} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el gasto "${confirm?.descripcion}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function GastoForm({ open, onClose, edificios, tipos, onSave }: {
  open: boolean; onClose: () => void;
  edificios: Edificio[]; tipos: TipoGasto[];
  onSave: (edificioId: number, tipoGastoId: number, data: Partial<Gasto>) => void;
}) {
  const [form, setForm] = useState<Partial<Gasto>>({});
  const [edificioId, setEdificioId] = useState<number | null>(null);
  const [tipoGastoId, setTipoGastoId] = useState<number | null>(null);
  useEffect(() => {
    if (open) {
      setForm({ fecha: new Date().toISOString().substring(0, 10) });
      setEdificioId(null);
      setTipoGastoId(null);
    }
  }, [open]);
  return (
    <Modal open={open} onClose={onClose} title="Nuevo Gasto" footer={
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
            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={edificioId || ""} onChange={(e) => setEdificioId(Number(e.target.value))}>
              <option value="">Seleccionar...</option>
              {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Tipo *</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={tipoGastoId || ""} onChange={(e) => setTipoGastoId(Number(e.target.value))}>
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
          <label className="text-sm font-medium">Comprobante (URL o texto)</label>
          <Input value={form.comprobante || ""} onChange={(e) => setForm({ ...form, comprobante: e.target.value })} />
        </div>
      </div>
    </Modal>
  );
}

function TiposCargosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => tiposCargosApi.listar());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoCargo | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; nombre: string } | null>(null);

  const handleSave = async (form: Partial<TipoCargo>) => {
    try {
      if (editing) {
        await tiposCargosApi.actualizar(editing.id, form);
        onToast("Tipo de cargo actualizado", "ok");
      } else {
        await tiposCargosApi.crear(form);
        onToast("Tipo de cargo creado", "ok");
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
      await tiposCargosApi.eliminar(id);
      onToast("Tipo de cargo eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <>
      <TableCard
        title="Tipos de Cargo"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nuevo
          </Button>
        }
      >
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Descripcion</th>
                  <th className="py-3 px-3">Activo</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{t.id}</td>
                    <td className="py-3 px-3 font-medium">{t.nombre}</td>
                    <td className="py-3 px-3 text-slate-500">{t.descripcion || "-"}</td>
                    <td className="py-3 px-3">{t.activo ? "Si" : "No"}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => { setEditing(t); setOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => setConfirm({ id: t.id, nombre: t.nombre })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <TipoCargoForm
        open={open} onClose={() => { setOpen(false); setEditing(null); }}
        editing={editing} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el tipo de cargo "${confirm?.nombre}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function TipoCargoForm({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: TipoCargo | null; onSave: (data: Partial<TipoCargo>) => void;
}) {
  const [form, setForm] = useState<Partial<TipoCargo>>({});
  useEffect(() => { setForm(editing || { activo: true }); }, [editing, open]);
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar Tipo de Cargo" : "Nuevo Tipo de Cargo"} footer={
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
          <label className="text-sm font-medium">Descripcion</label>
          <Input value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.activo ?? true} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          <label className="text-sm">Activo</label>
        </div>
      </div>
    </Modal>
  );
}

function TiposGastosSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const { data, loading, error, reload } = useFetch(() => tiposGastosApi.listar());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TipoGasto | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; nombre: string } | null>(null);

  const handleSave = async (form: Partial<TipoGasto>) => {
    try {
      if (editing) {
        await tiposGastosApi.actualizar(editing.id, form);
        onToast("Tipo de gasto actualizado", "ok");
      } else {
        await tiposGastosApi.crear(form);
        onToast("Tipo de gasto creado", "ok");
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
      await tiposGastosApi.eliminar(id);
      onToast("Tipo de gasto eliminado", "ok");
      setConfirm(null);
      reload();
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Error", "err");
    }
  };

  return (
    <>
      <TableCard
        title="Tipos de Gasto"
        action={
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Nuevo
          </Button>
        }
      >
        <LoadingOrError loading={loading} error={error} onRetry={reload} />
        {data && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Nombre</th>
                  <th className="py-3 px-3">Descripcion</th>
                  <th className="py-3 px-3">Activo</th>
                  <th className="py-3 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-3 px-3">{t.id}</td>
                    <td className="py-3 px-3 font-medium">{t.nombre}</td>
                    <td className="py-3 px-3 text-slate-500">{t.descripcion || "-"}</td>
                    <td className="py-3 px-3">{t.activo ? "Si" : "No"}</td>
                    <td className="py-3 px-3 text-right">
                      <button onClick={() => { setEditing(t); setOpen(true); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded mr-1">
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button onClick={() => setConfirm({ id: t.id, nombre: t.nombre })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <TipoGastoForm
        open={open} onClose={() => { setOpen(false); setEditing(null); }}
        editing={editing} onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirm}
        message={`Eliminar el tipo de gasto "${confirm?.nombre}"?`}
        onConfirm={() => confirm && handleDelete(confirm.id)}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}

function TipoGastoForm({ open, onClose, editing, onSave }: {
  open: boolean; onClose: () => void; editing: TipoGasto | null; onSave: (data: Partial<TipoGasto>) => void;
}) {
  const [form, setForm] = useState<Partial<TipoGasto>>({});
  useEffect(() => { setForm(editing || { activo: true }); }, [editing, open]);
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Editar Tipo de Gasto" : "Nuevo Tipo de Gasto"} footer={
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
          <label className="text-sm font-medium">Descripcion</label>
          <Input value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.activo ?? true} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
          <label className="text-sm">Activo</label>
        </div>
      </div>
    </Modal>
  );
}

function ReportesSection({ onToast }: { onToast: (m: string, t: "ok" | "err") => void }) {
  const [period, setPeriod] = useState("current");
  const [loading, setLoading] = useState(false);

  const handleDownload = async (format: "pdf" | "excel") => {
    setLoading(true);
    try {
      const blob = await reportesApi.generar({ type: "financial", period, format });
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
            <label className="text-sm font-medium">Periodo</label>
            <select className="w-full px-3 py-2 mt-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" value={period} onChange={(e) => setPeriod(e.target.value)}>
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
            El reporte incluye el detalle de pagos realizados en el periodo seleccionado, con totales y desglose por departamento y metodo de pago.
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
