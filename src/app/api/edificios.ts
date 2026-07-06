import { api } from "./client";

export type Edificio = {
  id: number;
  nombre: string;
  direccion: string;
  numeroPisos: number | null;
  descripcion: string | null;
  estado: string;
  imagen?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const edificiosApi = {
  listar: () => api.get<{ total: number; edificios: Edificio[] }>("/edificios"),
  listarActivos: () => api.get<Edificio[]>("/edificios/activos"),
  obtener: (id: number) => api.get<Edificio>(`/edificios/${id}`),
  crear: (data: Partial<Edificio>) => api.post<Edificio>("/edificios", data),
  actualizar: (id: number, data: Partial<Edificio>) =>
    api.put<{ mensaje: string; id: number }>(`/edificios/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/edificios/${id}`),
};
