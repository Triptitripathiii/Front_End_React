import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

interface UserProfile {
  name: string;
  email: string;
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);

  // Auto-restore login session from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem("user_session");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user_session");
      }
    }
  }, []);

  const handleLoginSuccess = (name: string, email: string) => {
    const sessionUser = { name, email };
    setUser(sessionUser);
    localStorage.setItem("user_session", JSON.stringify(sessionUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user_session");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;