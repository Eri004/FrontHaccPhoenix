import { User, Mail, Lock, UserCircle, X, CreditCard, Phone, MapPin, IdCard } from "lucide-react";
import { useState } from "react";
import { usuariosApi, propietariosApi } from "../api";
import type { Rol } from "../api";

type RegisterModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
};

export default function RegisterModal({ isOpen, onClose, onSuccess }: RegisterModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
    rol: "PROPIETARIO" as Rol,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.nombre || !formData.apellido || !formData.cedula || !formData.email || !formData.password) {
        setError("Todos los campos obligatorios (*) deben ser llenados");
        setLoading(false);
        return;
      }
      if (!/^\d+$/.test(formData.cedula)) {
        setError("La cedula debe contener solo numeros");
        setLoading(false);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setError("Ingrese un correo electronico valido");
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError("La contrasena debe tener al menos 6 caracteres");
        setLoading(false);
        return;
      }

      const usuarioCreado = await usuariosApi.crear({
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        passwordHash: formData.password,
        rol: formData.rol,
        activo: true,
      });

      if (formData.rol === "PROPIETARIO") {
        await propietariosApi.crear({
          cedula: formData.cedula,
          telefono: formData.telefono || null,
          direccion: formData.direccion || null,
          usuario: { id: usuarioCreado.id } as never,
        });
      }

      onSuccess("Cuenta creada correctamente. Ya puedes iniciar sesion.");
      onClose();
      setFormData({
        nombre: "",
        apellido: "",
        cedula: "",
        email: "",
        password: "",
        telefono: "",
        direccion: "",
        rol: "PROPIETARIO",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Registrar Usuario</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol *</label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <select
                id="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PROPIETARIO">Propietario</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="nombre"
                  type="text"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Apellido *</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  id="apellido"
                  type="text"
                  value={formData.apellido}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cedula *</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="cedula"
                type="text"
                value={formData.cedula}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Correo electronico *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contrasena *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefono (opcional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Direccion (opcional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                id="direccion"
                type="text"
                value={formData.direccion}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
