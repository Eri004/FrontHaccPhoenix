import { api } from "./client";

export type TipoGasto = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

export const tiposGastosApi = {
  listar: () => api.get<TipoGasto[]>("/tipos-gastos"),
  listarActivos: () => api.get<TipoGasto[]>("/tipos-gastos/activos"),
  obtener: (id: number) => api.get<TipoGasto>(`/tipos-gastos/${id}`),
  crear: (data: Partial<TipoGasto>) => api.post<TipoGasto>("/tipos-gastos", data),
  actualizar: (id: number, data: Partial<TipoGasto>) =>
    api.put<TipoGasto>(`/tipos-gastos/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/tipos-gastos/${id}`),
};
