import { Building2, User, Lock, UserPlus, AlertCircle, Settings, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { authApi } from "../api";
import { apiMode, API_URL, isApiConfigured } from "../api/client";
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

  const showConfigWarning = !isApiConfigured;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showConfigWarning && (
            <div className="mb-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-amber-200">Configuracion requerida</p>
                  <p className="text-amber-100/90 text-sm mt-1">
                    La variable <code className="px-1 py-0.5 rounded bg-amber-500/20 text-amber-100 font-mono text-xs">VITE_API_URL</code> no esta definida. El frontend no puede comunicarse con el backend.
                  </p>
                  <p className="text-amber-100/90 text-sm mt-2">
                    <strong>Solucion:</strong> en Vercel, ve a <em>Project Settings → Environment Variables</em> y agrega:
                  </p>
                  <pre className="mt-2 px-3 py-2 rounded-lg bg-slate-900/60 text-amber-100 font-mono text-xs overflow-x-auto">
{`Name:  VITE_API_URL
Value: https://backendhacc-production.up.railway.app`}
                  </pre>
                  <p className="text-amber-100/90 text-xs mt-2">
                    Luego haz redeploy. Mas informacion en <a href="https://vercel.com/docs/projects/environment-variables" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">Vercel docs <ExternalLink className="w-3 h-3" /></a>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-lg overflow-hidden">
                <img src="/hacc-icon.png" alt="HACC" className="w-full h-full object-cover" />
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
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm break-words">
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

            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-center">
              <p className="text-[10px] text-slate-400 font-mono break-all">
                API: {API_URL || "(no configurada)"} · modo: {apiMode}
              </p>
            </div>
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
