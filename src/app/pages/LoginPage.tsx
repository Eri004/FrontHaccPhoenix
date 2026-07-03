import { Building2, User, Lock, UserPlus, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { authApi } from "../api";
import RegisterModal from "../components/RegisterModal";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showRegister, setShowRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const data = await authApi.login({ email, password });
      if (data.success) {
        login({
          id: data.id,
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          rol: data.rol,
        });
      } else {
        setError(data.mensaje || "Credenciales invalidas");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error de conexion";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSuccess = (message: string) => {
    setSuccessMessage(message);
    setEmail("");
    setPassword("");
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">HACCPHOENIX</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Plataforma de gestion residencial
            </p>
          </div>

          {successMessage && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm mb-4 text-center flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Correo electronico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ingrese su correo"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Contrasena
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contrasena"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Registrate aqui
            </button>
          </div>
        </div>
      </div>
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSuccess={handleRegisterSuccess}
      />
    </>
  );
}
