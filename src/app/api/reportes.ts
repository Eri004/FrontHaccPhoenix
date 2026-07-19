import { API_URL, apiRequest } from "./client";

export type ReportRequest = {
  type: string;
  period: string;
  format: "pdf" | "excel";
  edificioId?: number | null;
};

export const reportesApi = {
  async generar(req: ReportRequest): Promise<Blob> {
    const res = await fetch(`${API_URL}/api/reports/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Error HTTP ${res.status}: ${text}`);
    }
    return res.blob();
  },

  descargarReporte(blob: Blob, formato: "pdf" | "excel") {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = formato === "pdf" ? "reporte.pdf" : "reporte.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};