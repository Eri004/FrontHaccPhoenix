import { api } from "./client";
import type { Departamento } from "./departamentos";
import type { TipoCargo } from "./tiposCargos";
import type { Usuario } from "./auth";

export type EstadoCargo = "PENDIENTE" | "PARCIAL" | "PAGADO" | "ANULADO";

export type Cargo = {
  id: number;
  departamento: Departamento;
  tipoCargo: TipoCargo;
  usuario: Usuario | null;
  fechaGeneracion: string;
  fechaVencimiento: string | null;
  descripcion: string | null;
  valor: number;
  estado: EstadoCargo;
  createdAt?: string;
  updatedAt?: string;
};

export const cargosApi = {
  listar: () => api.get<Cargo[]>("/cargos"),
  listarPorDepartamento: (departamentoId: number) =>
    api.get<Cargo[]>(`/cargos/departamento/${departamentoId}`),
  listarPorEstado: (estado: EstadoCargo) =>
    api.get<Cargo[]>(`/cargos/estado/${estado}`),
  listarPendientes: () => api.get<Cargo[]>("/cargos/pendientes"),
  listarPorPeriodo: (inicio: string, fin: string) =>
    api.get<Cargo[]>(`/cargos/periodo?inicio=${inicio}&fin=${fin}`),
  obtener: (id: number) => api.get<Cargo>(`/cargos/${id}`),
  crear: (
    departamentoId: number,
    tipoCargoId: number,
    usuarioId: number | null,
    data: Partial<Cargo>
  ) => {
    const qs = usuarioId ? `?usuarioId=${usuarioId}` : "";
    return api.post<{ mensaje: string; id: number; valor: number; estado: EstadoCargo }>(
      `/cargos/registro/${departamentoId}/${tipoCargoId}${qs}`,
      data
    );
  },
  actualizar: (id: number, data: Partial<Cargo>) =>
    api.put<{ mensaje: string; id: number }>(`/cargos/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/cargos/${id}`),
};
