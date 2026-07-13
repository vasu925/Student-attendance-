import React from "react";
import { 
  LayoutDashboard, 
  Building2, 
  BookOpen, 
  Users, 
  CalendarCheck, 
  FileSpreadsheet, 
  UserSquare2, 
  LogOut,
  Sun,
  Moon,
  GraduationCap,
  Mail
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  facultyUser: any;
  onLogout: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isSidebarOpen, 
  setIsSidebarOpen, 
  darkMode, 
  setDarkMode, 
  facultyUser, 
  onLogout 
}: SidebarProps) {
  
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "students", label: "Students", icon: Users },
    { id: "attendance", label: "Take Attendance", icon: CalendarCheck },
    { id: "reports", label: "Reports & Analytics", icon: FileSpreadsheet },
    { id: "profile", label: "Faculty Profile", icon: UserSquare2 },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backing Mask */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20 lg:hidden"
        />
      )}

      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed top-0 lg:left-0 z-30 transition-all duration-300 shadow-xl border-r border-slate-800 ${isSidebarOpen ? "left-0" : "-left-64"}`}>
        {/* Branding Header */}
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-sm flex items-center justify-center text-white">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight text-white leading-tight">CAMPUS REGISTER</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">B.Tech Attendance</p>
          </div>
        </div>

        {/* Logged Faculty Info */}
        {facultyUser && (
          <div className="p-3 border border-slate-800/80 bg-slate-800/40 flex items-center space-x-3 mx-4 my-4 rounded-xl">
            <img 
              src={facultyUser.photo || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"} 
              alt="Profile Avatar" 
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-700 shadow-sm"
            />
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold text-white truncate">{facultyUser.full_name}</h4>
              <p className="text-[10px] text-slate-500 truncate font-mono">Faculty Access</p>
            </div>
          </div>
        )}

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto pt-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-left text-xs font-medium transition-colors duration-150 ${
                isActive 
                  ? "bg-blue-600 text-white shadow-sm font-semibold" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform ${isActive ? "scale-105" : ""}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Option Bar */}
      <div className="p-4 border-t border-slate-800 space-y-2 bg-slate-900/50">
        {/* Secure Cryptographic Badge */}
        <div className="px-3 py-1.5 flex items-center space-x-2 text-[9px] text-emerald-400 font-mono tracking-wider bg-slate-950/40 rounded-lg border border-slate-800/40 select-none">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>AES-256 JWT SHIELD ACTIVE</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-left text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <div className="flex items-center space-x-3">
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-400" />}
            <span>{darkMode ? "Light Appearance" : "Dark Appearance"}</span>
          </div>
          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {darkMode ? "DARK" : "LIGHT"}
          </span>
        </button>

        {/* Secure Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left text-xs font-medium text-rose-400 hover:bg-rose-550/10 hover:text-rose-300 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Log Out Securely</span>
        </button>
      </div>
    </aside>
   </>
  );
}
