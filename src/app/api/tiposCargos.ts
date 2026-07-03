import { api } from "./client";

export type TipoCargo = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

export const tiposCargosApi = {
  listar: () => api.get<TipoCargo[]>("/tipos-cargos"),
  listarActivos: () => api.get<TipoCargo[]>("/tipos-cargos/activos"),
  obtener: (id: number) => api.get<TipoCargo>(`/tipos-cargos/${id}`),
  crear: (data: Partial<TipoCargo>) => api.post<TipoCargo>("/tipos-cargos", data),
  actualizar: (id: number, data: Partial<TipoCargo>) =>
    api.put<TipoCargo>(`/tipos-cargos/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/tipos-cargos/${id}`),
};
