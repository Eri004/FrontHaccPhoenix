import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, AlertTriangle, Clock, Receipt, Wallet, CheckCircle2, X } from "lucide-react";
import { cargosApi, gastosApi, comprobanteEsPendiente } from "../api";
import type { Cargo, Gasto } from "../api";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export type Notificacion = {
  id: string;
  tipo: "cargo_vencido" | "cargo_pendiente" | "gasto_comprobante";
  titulo: string;
  descripcion: string;
  fecha: string;
  prioridad: "alta" | "media" | "baja";
  modulo: "cargos" | "gastos";
};

const PRIORITY_STYLES: Record<Notificacion["prioridad"], string> = {
  alta: "border-l-red-500 bg-red-50 dark:bg-red-950/20",
  media: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
  baja: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
};

const PRIORITY_LABEL: Record<Notificacion["prioridad"], string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

const PRIORITY_BADGE: Record<Notificacion["prioridad"], string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  baja: "bg-blue-100 text-blue-700 border-blue-200",
};

function buildNotifications(cargos: Cargo[] | null, gastos: Gasto[] | null): Notificacion[] {
  const out: Notificacion[] = [];
  const today = new Date();

  (cargos || []).forEach((c) => {
    if (c.estado !== "PENDIENTE" && c.estado !== "PARCIAL") return;
    const vence = c.fechaVencimiento ? new Date(c.fechaVencimiento) : null;
    const vencido = vence ? vence < today : false;
    const idDepto =
      c.departamento?.identificadorCompleto ||
      `${c.departamento?.edificio?.nombre || ""} - ${c.departamento?.numero || ""}`;
    out.push({
      id: `cargo-${c.id}`,
      tipo: vencido ? "cargo_vencido" : "cargo_pendiente",
      titulo: vencido ? "Cargo vencido" : "Cargo pendiente",
      descripcion: `${c.tipoCargo?.nombre || "Cargo"} - ${idDepto} - $${(c.valor || 0).toFixed(2)}`,
      fecha: c.fechaVencimiento || c.fechaGeneracion,
      prioridad: vencido ? "alta" : "media",
      modulo: "cargos",
    });
  });

  (gastos || []).forEach((g) => {
    if (!comprobanteEsPendiente(g)) return;
    out.push({
      id: `gasto-${g.id}`,
      tipo: "gasto_comprobante",
      titulo: "Comprobante pendiente",
      descripcion: `${g.descripcion} - ${g.edificio?.nombre || ""} - $${(g.valor || 0).toFixed(2)}`,
      fecha: g.fecha,
      prioridad: "alta",
      modulo: "gastos",
    });
  });

  return out.sort((a, b) => {
    const order = { alta: 0, media: 1, baja: 2 } as const;
    return order[a.prioridad] - order[b.prioridad];
  });
}

const STORAGE_KEY = "haccphoenix_notif_leidas";

function readLeidas(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLeidas(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* noop */
  }
}

export function NotificationBell({
  onNavigate,
}: {
  onNavigate: (section: "cargos" | "gastos") => void;
}) {
  const [open, setOpen] = useState(false);
  const [cargos, setCargos] = useState<Cargo[] | null>(null);
  const [gastos, setGastos] = useState<Gasto[] | null>(null);
  const [leidas, setLeidas] = useState<string[]>(() => readLeidas());
  const ref = useRef<HTMLDivElement>(null);

  const reload = async () => {
    try {
      const [c, g] = await Promise.all([
        cargosApi.listar().catch(() => [] as Cargo[]),
        gastosApi.listar().catch(() => [] as Gasto[]),
      ]);
      setCargos(c);
      setGastos(g);
    } catch {
      /* noop */
    }
  };

  useEffect(() => {
    reload();
    const t = setInterval(reload, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const notifs = useMemo(() => buildNotifications(cargos, gastos), [cargos, gastos]);
  const unread = notifs.filter((n) => !leidas.includes(n.id));

  const markAll = () => {
    const all = Array.from(new Set([...leidas, ...notifs.map((n) => n.id)]));
    setLeidas(all);
    writeLeidas(all);
  };

  const markOne = (id: string) => {
    const next = Array.from(new Set([...leidas, id]));
    setLeidas(next);
    writeLeidas(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Notificaciones"
      >
        <Bell className="w-5 h-5 text-slate-700 dark:text-slate-200" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-900 dark:text-white">Notificaciones</h3>
              {unread.length > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200">
                  {unread.length} pendiente{unread.length === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread.length > 0 && (
                <Button size="sm" variant="ghost" onClick={markAll} className="text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Marcar todo
                </Button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[440px] overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Sin notificaciones</p>
                <p className="text-xs text-slate-500 mt-1">Todo esta al dia.</p>
              </div>
            ) : (
              notifs.map((n) => {
                const Icon = n.tipo === "gasto_comprobante" ? Wallet : n.tipo === "cargo_vencido" ? AlertTriangle : Receipt;
                const leida = leidas.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className={`border-l-4 ${PRIORITY_STYLES[n.prioridad]} border-b border-slate-100 dark:border-slate-800 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      leida ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                        <Icon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-200" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{n.titulo}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${PRIORITY_BADGE[n.prioridad]}`}>
                            {PRIORITY_LABEL[n.prioridad]}
                          </span>
                          {!leida && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 break-words">{n.descripcion}</p>
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(n.fecha).toLocaleDateString("es-EC")}
                          </span>
                          <div className="flex items-center gap-1">
                            {!leida && (
                              <button
                                onClick={() => markOne(n.id)}
                                className="text-[11px] text-blue-600 hover:underline"
                              >
                                Marcar leida
                              </button>
                            )}
                            <button
                              onClick={() => {
                                onNavigate(n.modulo);
                                setOpen(false);
                              }}
                              className="text-[11px] text-blue-600 hover:underline font-medium"
                            >
                              Ver
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
