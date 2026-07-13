import React, { useState } from "react";
import { Mail, Lock, LogIn, Key, UserCheck, AlertCircle, X, HelpCircle } from "lucide-react";
import { googleSignIn } from "../lib/firebaseAuth";

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
  onNavigateToRegister: () => void;
}

export default function Login({ onLoginSuccess, onNotify, onNavigateToRegister }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password flow states
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [sandboxCode, setSandboxCode] = useState<string | null>(null);

  const handleRequestCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      onNotify("Please enter your registered email address", "error");
      return;
    }

    setForgotLoading(true);
    setSandboxCode(null);

    fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail.trim() })
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify(resJson.message || "Recovery code generated", "success");
          
          if (resJson.sandboxHelp) {
            setSandboxCode(resJson.sandboxHelp.code);
          }
          
          setForgotStep(2);
        } else {
          onNotify(resJson.message || "Password recovery request failed", "error");
        }
        setForgotLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Could not connect to the recovery server", "error");
        setForgotLoading(false);
      });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      onNotify("Please enter the verification code", "error");
      return;
    }
    if (!newPassword) {
      onNotify("Please specify your new password", "error");
      return;
    }
    if (newPassword.length < 6) {
      onNotify("Password must be at least 6 characters", "error");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      onNotify("Passwords do not match", "error");
      return;
    }

    setForgotLoading(true);

    fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: forgotEmail.trim(),
        code: verificationCode.trim(),
        newPassword
      })
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify("Your password has been reset successfully!", "success");
          setIsForgotOpen(false);
          setForgotStep(1);
          setForgotEmail("");
          setVerificationCode("");
          setNewPassword("");
          setConfirmNewPassword("");
          setSandboxCode(null);
        } else {
          onNotify(resJson.message || "Failed to reset password", "error");
        }
        setForgotLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Could not connect to the reset server", "error");
        setForgotLoading(false);
      });
  };

  const handleOpenForgotModal = () => {
    setIsForgotOpen(true);
    setForgotStep(1);
    setVerificationCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setSandboxCode(null);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const authResult = await googleSignIn();
      if (!authResult) {
        onNotify("Google Sign-In canceled or failed", "error");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authResult.user.email,
          name: authResult.user.displayName,
          photo: authResult.user.photoURL,
        }),
      });

      const resJson = await response.json();
      if (resJson.success) {
        onNotify("Authenticated via Google successfully!", "success");
        onLoginSuccess(resJson.user);
      } else {
        onNotify(resJson.message || "Failed to link Google account to faculty records", "error");
      }
    } catch (err: any) {
      console.error(err);
      onNotify(err.message || "Google authentication failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      onNotify("Please enter both email and password credentials", "error");
      return;
    }

    setLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then((res) => res.json())
      .then((resJson) => {
        if (resJson.success) {
          onNotify("Authenticated successfully!", "success");
          
          if (rememberMe) {
            localStorage.setItem("remember_faculty_email", email);
          } else {
            localStorage.removeItem("remember_faculty_email");
          }

          onLoginSuccess(resJson.user);
        } else {
          onNotify(resJson.message || "Invalid account credentials", "error");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        onNotify("Authentication server connection failure", "error");
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Brand logo card header */}
      <div className="w-full max-w-md text-center space-y-2 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-md shadow-blue-500/25">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-display font-bold text-slate-800 dark:text-white">
          University Attendance Console
        </h1>
        <p className="text-xs text-gray-400">
          Faculty and Academic Coordinator Secure Authentication Portal
        </p>
      </div>

      {/* Main card box */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-md p-8 rounded-3xl border border-slate-200/40 dark:border-slate-800 shadow-xl space-y-6">
        <div>
          <h2 className="font-display font-semibold text-sm text-slate-800 dark:text-white uppercase tracking-wider">
            Faculty Sign In
          </h2>
          <p className="text-[10px] text-gray-500">Provide registration credentials to access roll management metrics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="email"
                placeholder="professor@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Password</label>
              <button
                type="button"
                onClick={handleOpenForgotModal}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-11 pr-4 py-2.5 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Remember me & submit */}
          <div className="flex items-center justify-between py-1 text-xs">
            <label className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 bg-slate-50 border-slate-300 h-4 w-4"
              />
              <span className="text-[11px] font-semibold">Remember Session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-blue-500/15 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <span>Log In</span>
          </button>
        </form>

        {/* OR Divider */}
        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
          <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase select-none">
            Or Sign In With
          </span>
          <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center space-x-2.5 transition-all cursor-pointer disabled:opacity-40"
        >
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Register link */}
        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Are you a new faculty coordinator?</span>{" "}
          <button
            onClick={onNavigateToRegister}
            className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
          >
            Register Account Node
          </button>
        </div>

      </div>

      {/* Forgot Password Modal Dialog */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-xl border border-slate-150 dark:border-slate-800 overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800 dark:text-white">
                {forgotStep === 1 ? "Forgot Account Password" : "Reset Password"}
              </h3>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestCodeSubmit} className="p-5 space-y-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Provide your official university email registration link below. Our security dispatcher will generate a temporary recovery code.
                </p>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Official Email Address</label>
                  <input
                    type="email"
                    placeholder="professor@college.edu"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {forgotLoading ? "Sending Code..." : "Send Reset Code"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="p-5 space-y-4">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  We sent a 6-digit recovery code. Please check your inbox and fill out the form below to choose a new password.
                </p>

                {sandboxCode && (
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50 p-3 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 tracking-wider uppercase flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 mr-1 text-amber-600 shrink-0" />
                      Sandbox Simulation Alert
                    </span>
                    <p className="text-[10px] text-amber-600 dark:text-amber-350 leading-normal">
                      SMTP is not set up on this container. Your recovery code is:{" "}
                      <strong className="text-xs text-amber-800 dark:text-amber-200 select-all tracking-wider font-mono bg-amber-100 dark:bg-amber-900 px-1.5 py-0.5 rounded">
                        {sandboxCode}
                      </strong>
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all text-slate-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-between space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(false)}
                      className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/10 cursor-pointer transition-all disabled:opacity-50"
                    >
                      {forgotLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
