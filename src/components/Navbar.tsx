import React, { useState } from "react";
import { Menu, Bell, Sun, Moon, LogOut, User, CheckCircle, Info } from "lucide-react";

interface NavbarProps {
  onToggleSidebar: () => void;
  activeTab: string;
  facultyUser: any;
  onLogout: () => void;
}

export default function Navbar({ onToggleSidebar, activeTab, facultyUser, onLogout }: NavbarProps) {
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setIsDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard Analytics";
      case "departments": return "Departments Registry";
      case "subjects": return "Syllabus Subjects";
      case "students": return "Students Directory";
      case "attendance": return "Attendance Module";
      case "reports": return "Reports & Sheets";
      case "profile": return "Profile Settings";
      default: return "Attendance Management System";
    }
  };

  // Mock list of university alerts/notifications
  const mockNotifications = [
    { title: "Syllabus Update", desc: "CS-401 lecture plan modified.", time: "10m ago", read: false },
    { title: "Shortage Alert", desc: "Roll 2023CSE03 is under 75% attendance.", time: "1h ago", read: false },
    { title: "Sync Status", desc: "Roster synchronized with core database.", time: "3h ago", read: true }
  ];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      
      {/* Left Menu toggle & Active page title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 rounded-lg transition-all lg:hidden cursor-pointer"
        >
          <Menu className="h-4 w-4" />
        </button>

        <h1 className="font-sans font-bold text-slate-900 dark:text-white text-sm tracking-tight capitalize">
          {getTabTitle()}
        </h1>
      </div>

      {/* Right controls: Theme, notification dropdown, mini profile */}
      <div className="flex items-center space-x-4">
        
        {/* Theme mode slider button */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all cursor-pointer"
          title="Toggle Visual Theme"
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications badge dropdown button */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all relative cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 overflow-hidden animate-scale-up">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Notifications Center</span>
                <span className="bg-blue-550/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono">3 NEW</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {mockNotifications.map((notif, idx) => (
                  <div key={idx} className="px-4 py-2.5 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 dark:text-gray-200">{notif.title}</span>
                      <span className="text-[9px] text-gray-400 font-mono">{notif.time}</span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">{notif.desc}</p>
                  </div>
                ))}
              </div>
              <div className="px-4 py-1.5 text-center bg-slate-50 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[9px] text-blue-600 hover:text-blue-700 font-bold uppercase tracking-wider"
                >
                  Dismiss all alerts
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Small desktop profile widget */}
        {facultyUser && (
          <div className="hidden sm:flex items-center space-x-2.5 pl-2 border-l border-slate-200/60 dark:border-slate-800">
            <img
              src={facultyUser.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}
              alt=""
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-200/40"
            />
            <div className="text-left text-xs leading-none">
              <p className="font-semibold text-slate-700 dark:text-gray-200">{facultyUser.full_name}</p>
              <span className="text-[9px] text-gray-400 font-mono">@{facultyUser.username}</span>
            </div>
          </div>
        )}

      </div>

    </header>
  );
}
