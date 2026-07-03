import { api } from "./client";
import type { Departamento } from "./departamentos";

export type Inquilino = {
  id: number;
  departamento: Departamento | null;
  cedula: string;
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  fechaIngreso: string | null;
  fechaSalida: string | null;
  estado: string;
  createdAt?: string;
  updatedAt?: string;
};

export const inquilinosApi = {
  listar: () => api.get<Inquilino[]>("/inquilinos"),
  listarActivos: () => api.get<Inquilino[]>("/inquilinos/activos"),
  obtener: (id: number) => api.get<Inquilino>(`/inquilinos/${id}`),
  crear: (departamentoId: number, data: Partial<Inquilino>) =>
    api.post<{ mensaje: string; id: number; nombre: string; departamentoId: number }>(
      `/inquilinos/registro/${departamentoId}`,
      data
    ),
  actualizar: (id: number, data: Partial<Inquilino>) =>
    api.put<{ mensaje: string; id: number }>(`/inquilinos/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/inquilinos/${id}`),
};
