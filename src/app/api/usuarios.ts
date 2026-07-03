import { api } from "./client";
import type { Rol, Usuario } from "./auth";

export type { Rol, Usuario };

export type CreateUsuarioRequest = {
  nombre: string;
  apellido?: string | null;
  email: string;
  passwordHash: string;
  rol: Rol;
  activo?: boolean;
};

export const usuariosApi = {
  listar: () => api.get<Usuario[]>("/usuarios").catch(() => [] as Usuario[]),
  obtener: (id: number) => api.get<Usuario>(`/usuarios/${id}`),
  crear: (data: CreateUsuarioRequest) => api.post<Usuario>("/usuarios", data),
  actualizar: (id: number, data: Partial<Usuario>) =>
    api.put<{ mensaje: string; id: number }>(`/usuarios/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/usuarios/${id}`),
};
