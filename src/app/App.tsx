import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import ResidentView from "./pages/ResidentView";
import { useAuth } from "./pages/AuthContext";

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (user?.rol === "PROPIETARIO") {
    return <ResidentView onLogout={logout} />;
  }

  return <AdminDashboard onLogout={logout} />;
}
