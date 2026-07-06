import { useState } from "react";
import { Calendar, Filter, ChevronDown } from "lucide-react";

export type PeriodMode = "current" | "all" | "month";

export type PeriodValue = { mode: PeriodMode; month?: number; year?: number };

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function periodLabel(p: PeriodValue): string {
  if (p.mode === "all") return "Historico completo";
  if (p.mode === "current") {
    const now = new Date();
    return `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  }
  if (p.mode === "month" && p.month != null && p.year != null) {
    return `${MONTHS[p.month]} ${p.year}`;
  }
  return "Periodo";
}

export function periodRange(p: PeriodValue): { inicio: string; fin: string } | null {
  if (p.mode === "all") return null;
  if (p.mode === "current") {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const inicio = new Date(y, m, 1);
    const fin = new Date(y, m + 1, 0);
    return { inicio: inicio.toISOString().substring(0, 10), fin: fin.toISOString().substring(0, 10) };
  }
  if (p.mode === "month" && p.month != null && p.year != null) {
    const inicio = new Date(p.year, p.month, 1);
    const fin = new Date(p.year, p.month + 1, 0);
    return { inicio: inicio.toISOString().substring(0, 10), fin: fin.toISOString().substring(0, 10) };
  }
  return null;
}

function inRange(dateStr: string | null | undefined, p: PeriodValue): boolean {
  if (!dateStr) return false;
  const r = periodRange(p);
  if (!r) return true;
  const d = dateStr.substring(0, 10);
  return d >= r.inicio && d <= r.fin;
}

export function filterByPeriod<T extends { fechaGeneracion?: string; fecha?: string; fechaVencimiento?: string }>(
  list: T[] | null | undefined,
  p: PeriodValue,
  field: "fechaGeneracion" | "fecha" | "fechaVencimiento" = "fecha"
): T[] {
  const arr = list || [];
  if (p.mode === "all") return arr;
  return arr.filter((item) => inRange(item[field] as string | null | undefined, p));
}

type Props = {
  value: PeriodValue;
  onChange: (p: PeriodValue) => void;
};

export default function PeriodFilter({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [tmpMonth, setTmpMonth] = useState<number>(value.month ?? now.getMonth());
  const [tmpYear, setTmpYear] = useState<number>(value.year ?? now.getFullYear());

  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
        <button
          onClick={() => onChange({ mode: "current" })}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            value.mode === "current"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Mes actual
        </button>
        <button
          onClick={() => onChange({ mode: "all" })}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            value.mode === "all"
              ? "bg-blue-600 text-white shadow"
              : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Historico
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap ${
              value.mode === "month"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mes especifico</span>
            <span className="sm:hidden">Mes</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 w-64">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-medium text-slate-500">Mes</label>
                  <select
                    value={tmpMonth}
                    onChange={(e) => setTmpMonth(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-slate-500">Anio</label>
                  <select
                    value={tmpYear}
                    onChange={(e) => setTmpYear(Number(e.target.value))}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onChange({ mode: "month", month: tmpMonth, year: tmpYear });
                    setOpen(false);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
          {periodLabel(value)}
        </span>
      </div>
    </div>
  );
}
