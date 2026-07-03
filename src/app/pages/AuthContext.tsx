import { createContext, useContext, useEffect, useState } from "react";

export type UsuarioSesion = {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string;
  rol: string;
};

type AuthContextType = {
  user: UsuarioSesion | null;
  isAuthenticated: boolean;
  login: (data: UsuarioSesion) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UsuarioSesion | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("haccphoenix_usuario");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("haccphoenix_usuario");
      }
    }
  }, []);

  const login = (data: UsuarioSesion) => {
    setUser(data);
    localStorage.setItem("haccphoenix_usuario", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("haccphoenix_usuario");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
