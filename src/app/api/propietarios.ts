import { api } from "./client";

export type Propietario = {
  id: number;
  usuario: { id: number; nombre: string; apellido: string | null; email: string } | null;
  cedula: string;
  telefono: string | null;
  direccion: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const propietariosApi = {
  listar: () => api.get<Propietario[]>("/propietarios"),
  obtener: (id: number) => api.get<Propietario>(`/propietarios/${id}`),
  crear: (data: Partial<Propietario>) => api.post<Propietario>("/propietarios", data),
  actualizar: (id: number, data: Partial<Propietario>) =>
    api.put<{ mensaje: string; id: number }>(`/propietarios/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/propietarios/${id}`),
};
