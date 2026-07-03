import { api } from "./client";
import type { Edificio } from "./edificios";
import type { TipoGasto } from "./tiposGastos";
import type { Usuario } from "./auth";

export type Gasto = {
  id: number;
  edificio: Edificio;
  tipoGasto: TipoGasto;
  usuario: Usuario | null;
  fecha: string;
  descripcion: string;
  valor: number;
  comprobante: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const gastosApi = {
  listar: () => api.get<Gasto[]>("/gastos"),
  listarPorEdificio: (edificioId: number) =>
    api.get<Gasto[]>(`/gastos/edificio/${edificioId}`),
  listarPorTipoGasto: (tipoGastoId: number) =>
    api.get<Gasto[]>(`/gastos/tipo-gasto/${tipoGastoId}`),
  listarPorPeriodo: (inicio: string, fin: string) =>
    api.get<Gasto[]>(`/gastos/periodo?inicio=${inicio}&fin=${fin}`),
  obtener: (id: number) => api.get<Gasto>(`/gastos/${id}`),
  crear: (
    edificioId: number,
    tipoGastoId: number,
    usuarioId: number | null,
    data: Partial<Gasto>
  ) => {
    const qs = usuarioId ? `?usuarioId=${usuarioId}` : "";
    return api.post<{ mensaje: string; id: number; valor: number }>(
      `/gastos/registro/${edificioId}/${tipoGastoId}${qs}`,
      data
    );
  },
  actualizar: (id: number, data: Partial<Gasto>) =>
    api.put<{ mensaje: string; id: number }>(`/gastos/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/gastos/${id}`),
};
