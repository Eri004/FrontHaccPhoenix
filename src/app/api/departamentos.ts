import { api } from "./client";
import type { Edificio } from "./edificios";
import type { Propietario } from "./propietarios";

export type Departamento = {
  id: number;
  edificio: Edificio;
  propietario: Propietario;
  numero: string;
  piso: number | null;
  area: number | null;
  alicuota: number;
  observaciones: string | null;
  identificadorCompleto?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const departamentosApi = {
  listar: () => api.get<Departamento[]>("/departamentos"),
  listarPorEdificio: (edificioId: number) =>
    api.get<{ edificioId: number; total: number; departamentos: Departamento[] }>(
      `/departamentos/edificio/${edificioId}`
    ),
  listarPorPropietario: (propietarioId: number) =>
    api.get<{ propietarioId: number; total: number; departamentos: Departamento[] }>(
      `/departamentos/propietario/${propietarioId}`
    ),
  obtener: (id: number) => api.get<Departamento>(`/departamentos/${id}`),
  crear: (edificioId: number, propietarioId: number, data: Partial<Departamento>) =>
    api.post<{ mensaje: string; id: number; numero: string }>(
      `/departamentos/registro/${edificioId}/${propietarioId}`,
      data
    ),
  actualizar: (id: number, data: Partial<Departamento>) =>
    api.put<{ mensaje: string; id: number }>(`/departamentos/${id}`, data),
  eliminar: (id: number) =>
    api.delete<{ mensaje: string; id: number }>(`/departamentos/${id}`),
};
