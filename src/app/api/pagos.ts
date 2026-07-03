import { api } from "./client";
import type { Departamento } from "./departamentos";
import type { Usuario } from "./auth";

export type Pago = {
  id: number;
  departamento: Departamento;
  usuario: Usuario | null;
  fecha: string;
  montoTotal: number;
  metodoPago: string | null;
  numeroComprobante: string | null;
  pagadoPor: string | null;
  observaciones: string | null;
  pagoCargos?: { id: number; monto: number; cargo: { id: number } }[];
  createdAt?: string;
};

export type PagoRegistroRequest = {
  pago: Partial<Pago>;
  cargosIds?: number[];
};

export const pagosApi = {
  listar: () => api.get<Pago[]>("/pagos"),
  listarPorDepartamento: (departamentoId: number) =>
    api.get<Pago[]>(`/pagos/departamento/${departamentoId}`),
  listarPorUsuario: (usuarioId: number) =>
    api.get<Pago[]>(`/pagos/usuario/${usuarioId}`),
  listarPorPeriodo: (inicio: string, fin: string) =>
    api.get<Pago[]>(`/pagos/periodo?inicio=${inicio}&fin=${fin}`),
  obtener: (id: number) => api.get<Pago>(`/pagos/${id}`),
  crear: (
    departamentoId: number,
    usuarioId: number | null,
    body: PagoRegistroRequest
  ) => {
    const qs = usuarioId ? `?usuarioId=${usuarioId}` : "";
    return api.post<{ mensaje: string; id: number; montoTotal: number }>(
      `/pagos/registro/${departamentoId}${qs}`,
      body
    );
  },
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/pagos/${id}`),
};
