import { useState } from "react";
import { Building2 } from "lucide-react";

const FALLBACK =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5sPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==";

function hashStringToInt(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function buildingImageUrl(nombre: string, id: number): string {
  const seed = (id * 7919 + hashStringToInt(nombre)) % 1000;
  return `https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=70&seed=${seed}`;
}

type Props = {
  nombre: string;
  id: number;
  className?: string;
};

export default function EdificioImage({ nombre, id, className }: Props) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className={`relative w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center ${className || ""}`}>
        <Building2 className="w-16 h-16 text-white/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>
    );
  }
  return (
    <img
      src={buildingImageUrl(nombre, id)}
      alt={nombre}
      className={className}
      onError={() => {
        if (!errored) {
          setErrored(true);
        }
      }}
    />
  );
}
