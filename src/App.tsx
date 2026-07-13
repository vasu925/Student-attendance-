import React, { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import Departments from "./components/Departments";
import Subjects from "./components/Subjects";
import Students from "./components/Students";
import Attendance from "./components/Attendance";
import Reports from "./components/Reports";
import Profile from "./components/Profile";
import Login from "./components/Login";
import Register from "./components/Register";
import NotFound from "./components/NotFound";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function App() {
  const [facultyUser, setFacultyUser] = useState<any | null>(null);
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Dark appearance states
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Dashboard statistics reload triggers
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Custom visual toast alerts
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    // Restore persistent session from localStorage if existing
    const savedUser = localStorage.getItem("faculty_user");
    if (savedUser) {
      try {
        setFacultyUser(JSON.parse(savedUser));
      } catch (err) {
        console.error(err);
      }
    }

    // Listen to secure session expiry triggers
    const handleSessionExpired = () => {
      setFacultyUser(null);
      localStorage.removeItem("faculty_user");
      handleNotify("Your session has expired. Please sign in again for security.", "error");
    };

    window.addEventListener("auth_session_expired", handleSessionExpired);
    return () => {
      window.removeEventListener("auth_session_expired", handleSessionExpired);
    };
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleNotify = (msg: string, type: "success" | "error" | "info") => {
    setNotification({ msg, type });
    // Dismiss after 4s
    setTimeout(() => {
      setNotification((curr) => (curr?.msg === msg ? null : curr));
    }, 4000);
  };

  const handleLogout = () => {
    fetch("/api/auth/logout", { method: "POST" })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          localStorage.removeItem("faculty_user");
          setFacultyUser(null);
          setAuthView("login");
          handleNotify("Session terminated securely", "info");
        }
      })
      .catch((err) => {
        console.error(err);
        // Local fallback
        localStorage.removeItem("faculty_user");
        setFacultyUser(null);
        setAuthView("login");
      });
  };

  const handleLoginSuccess = (user: any) => {
    setFacultyUser(user);
    localStorage.setItem("faculty_user", JSON.stringify(user));
  };

  const handleRegisterSuccess = (user: any) => {
    setFacultyUser(user);
    localStorage.setItem("faculty_user", JSON.stringify(user));
  };

  // Render correct panel mapping
  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            triggerRefresh={refreshTrigger}
          />
        );
      case "departments":
        return (
          <Departments
            onNotify={handleNotify}
            triggerRefresh={triggerRefresh}
          />
        );
      case "subjects":
        return (
          <Subjects
            onNotify={handleNotify}
            triggerRefresh={triggerRefresh}
          />
        );
      case "students":
        return (
          <Students
            onNotify={handleNotify}
            triggerRefresh={triggerRefresh}
          />
        );
      case "attendance":
        return (
          <Attendance
            onNotify={handleNotify}
            triggerRefresh={triggerRefresh}
            facultyUser={facultyUser}
          />
        );
      case "reports":
        return (
          <Reports
            onNotify={handleNotify}
          />
        );

      case "profile":
        return (
          <Profile
            onNotify={handleNotify}
            facultyUser={facultyUser}
            setFacultyUser={setFacultyUser}
          />
        );
      default:
        return <NotFound onBackToHome={() => setActiveTab("dashboard")} />;
    }
  };

  // 1. Guard check for unauthenticated routes
  if (!facultyUser) {
    if (authView === "register") {
      return (
        <Register
          onRegisterSuccess={handleRegisterSuccess}
          onNotify={handleNotify}
          onNavigateToLogin={() => setAuthView("login")}
        />
      );
    }
    return (
      <Login
        onLoginSuccess={handleLoginSuccess}
        onNotify={handleNotify}
        onNavigateToRegister={() => setAuthView("register")}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden relative">
      
      {/* 2. Primary Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false); // Close drawer on mobile click
        }}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        facultyUser={facultyUser}
      />

      {/* 3. Main Frame Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden lg:pl-64">
        
        {/* Dynamic header navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          activeTab={activeTab}
          facultyUser={facultyUser}
          onLogout={handleLogout}
        />

        {/* Dynamic central dashboard slot */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderTabContent()}
          </div>
        </main>

      </div>

      {/* 4. Global Toast Alert Banner */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 flex items-center space-x-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl animate-slide-in max-w-sm">
          {notification.type === "success" && (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          )}
          {notification.type === "error" && (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          )}
          {notification.type === "info" && (
            <Info className="h-5 w-5 text-blue-500 shrink-0" />
          )}
          
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {notification.msg}
          </span>

          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
