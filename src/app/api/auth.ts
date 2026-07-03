import { api } from "./client";

export type Rol = "ADMIN" | "PROPIETARIO";

export type Usuario = {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string;
  passwordHash?: string;
  rol: Rol;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  success: boolean;
  id: number;
  nombre: string;
  apellido: string | null;
  rol: string;
  email: string;
  mensaje?: string;
};

export const authApi = {
  login: (creds: LoginRequest) => api.post<LoginResponse>("/auth/login", creds),
};
