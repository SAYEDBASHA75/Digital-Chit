import { useState, useEffect } from "react";
import { supabaseClient as supabase } from "../lib/supabaseClient";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import {
  IndianRupee, Mail, Phone, Lock, User, ArrowLeft,
  Shield, Users, CheckCircle2, Eye, EyeOff, AlertCircle,
  Info, RefreshCw, Clock,
} from "lucide-react";
import { Alert } from "./ui/alert";
import { projectId, publicAnonKey } from "/utils/supabase/info";

export type UserRole = "admin" | "member";

interface LoginPageProps {
  onLoginSuccess: (user: any, accessToken: string, role: UserRole, lastLogin?: string | null) => void;
}

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf`;
const HEADERS = { "Content-Type": "application/json", Authorization: `Bearer ${publicAnonKey}` };

// ── Error message mapper ─────────────────────────────────────────────────────
function toFriendlyError(err: any, context: "email_reset" | "phone_otp" | "otp_verify" | "general" = "general"): string {
  if (!err) return "An unexpected error occurred. Please try again.";
  const msg = (err.message || err.error_description || String(err)).toLowerCase();
  const status = err.status || 0;

  // Rate limiting
  if (status === 429 || msg.includes("rate limit") || msg.includes("too many")) {
    return "Too many requests. Please wait a few minutes before trying again.";
  }
  // Phone provider
  if (msg.includes("unsupported phone provider") || msg.includes("phone provider not enabled") || msg.includes("phone_provider_disabled")) {
    return ""; // Handled separately with an info card
  }
  // SMS not configured
  if (msg.includes("sms") && (msg.includes("not configured") || msg.includes("provider"))) {
    return ""; // Handled separately
  }
  // Invalid email
  if (msg.includes("invalid email") || (context === "email_reset" && msg.includes("email"))) {
    return "Invalid email address. Please check and try again.";
  }
  // Invalid phone
  if (msg.includes("invalid phone") || msg.includes("e.164")) {
    return "Invalid phone number. Please use 10-digit Indian format (e.g. 9876543210).";
  }
  // OTP / token errors
  if (context === "otp_verify") {
    if (msg.includes("expired")) return "OTP has expired. Please request a new code.";
    if (msg.includes("invalid") || msg.includes("incorrect") || msg.includes("token")) return "Invalid OTP. Please check the code and try again.";
    if (msg.includes("not found")) return "OTP not found. Please request a new code.";
  }
  // Network
  if (msg.includes("fetch") || msg.includes("network") || msg.includes("failed to fetch")) {
    return "Network error. Please check your internet connection and try again.";
  }
  // Auth errors
  if (msg.includes("invalid credentials") || msg.includes("invalid login")) {
    return "Invalid credentials. Please check your email/password.";
  }
  if (msg.includes("email not confirmed")) {
    return "Your email has not been confirmed. Please check your inbox.";
  }
  // Generic
  return "Something went wrong. Please try again later.";
}


// ── Cooldown hook ─────────────────────────────────────────────────────────────
function useCooldown(seconds: number) {
  const [remaining, setRemaining] = useState(0);
  const start = () => {
    setRemaining(seconds);
    const iv = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(iv); return 0; }
        return r - 1;
      });
    }, 1000);
  };
  return { remaining, inCooldown: remaining > 0, start };
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [view, setView] = useState<"login" | "signup" | "forgot">("login");

  // Login — single field, auto-detect email vs phone
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem("remembered_identifier");
    const savedPassword = localStorage.getItem("remembered_password");
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
  }, []);

  // Detect input type on the fly
  const detectedType = (v: string): "email" | "phone" =>
    /^[^\s@]+@[^\s@]+/.test(v.trim()) ? "email" : "phone";

  // Signup
  const [signupData, setSignupData] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "", role: "member" as UserRole,
  });
  const [showSignupPwd, setShowSignupPwd] = useState(false);

  // Forgot password — email only
  const [forgotEmail, setForgotEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dev diagnostics (only in development)
  const isDev = import.meta.env.DEV;
  const log = (label: string, data?: any) => {
    if (isDev) console.log(`[ForgotPwd][${label}]`, data ?? "");
  };

  // 60s cooldown between email reset requests
  const emailCooldown = useCooldown(60);

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePhone = (p: string) => /^[6-9]\d{9}$/.test(p.replace(/\s/g, ""));

  const clearMessages = () => { setError(""); setSuccess(""); };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async () => {
    clearMessages();
    const val = identifier.trim();
    if (!val || !password) { setError("Please fill in all fields"); return; }

    const loginType = detectedType(val);
    if (loginType === "email" && !validateEmail(val)) { setError("Enter a valid email address"); return; }
    if (loginType === "phone" && !validatePhone(val)) { setError("Enter a valid 10-digit phone number (e.g. 9876543210)"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/signin`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({ identifier: val, password, loginType }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Invalid credentials"); setLoading(false); return; }

      const role: UserRole = data.role === "admin" ? "admin" : "member";
      localStorage.setItem("chitfund_user", JSON.stringify(data.user));
      localStorage.setItem("chitfund_token", data.session.access_token);
      localStorage.setItem("chitfund_role", role);

      // Save or clear login details based on checkbox state
      if (rememberMe) {
        localStorage.setItem("remembered_identifier", val);
        localStorage.setItem("remembered_password", password);
      } else {
        localStorage.removeItem("remembered_identifier");
        localStorage.removeItem("remembered_password");
      }

      onLoginSuccess(data.user, data.session.access_token, role, data.lastLogin);
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  // ── Signup ─────────────────────────────────────────────────────────────────
  const handleSignup = async () => {
    clearMessages();
    const { name, email, phone, password: pwd, confirmPassword, role } = signupData;

    if (!name || !email || !phone || !pwd || !confirmPassword) { setError("Please fill in all fields"); return; }
    if (!validateEmail(email)) { setError("Enter a valid email address"); return; }
    if (!validatePhone(phone)) { setError("Enter a valid 10-digit phone number"); return; }
    if (pwd.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (pwd !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/auth/signup`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({ name, email, phone, password: pwd, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Account creation failed"); setLoading(false); return; }

      setSuccess("Account created! Logging you in…");

      const signinRes = await fetch(`${BASE}/auth/signin`, {
        method: "POST", headers: HEADERS,
        body: JSON.stringify({ identifier: email, password: pwd, loginType: "email" }),
      });
      const signinData = await signinRes.json();
      if (!signinRes.ok) {
        setSuccess("");
        setError("Account created but auto-login failed. Please log in manually.");
        setView("login");
        setIdentifier(email);
        setLoading(false);
        return;
      }

      const returnedRole: UserRole = signinData.role === "admin" ? "admin" : "member";
      localStorage.setItem("chitfund_user", JSON.stringify(signinData.user));
      localStorage.setItem("chitfund_token", signinData.session.access_token);
      localStorage.setItem("chitfund_role", returnedRole);
      onLoginSuccess(signinData.user, signinData.session.access_token, returnedRole);
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  };

  // ── Forgot — Email reset via Supabase Auth ────────────────────────────────
  const handleEmailReset = async () => {
    clearMessages();
    if (!forgotEmail.trim()) { setError("Enter your registered email address"); return; }
    if (!validateEmail(forgotEmail.trim())) { setError("Enter a valid email address"); return; }

    if (emailCooldown.inCooldown) {
      setError(`Please wait ${emailCooldown.remaining}s before requesting another reset email.`);
      return;
    }

    setLoading(true);
    log("EMAIL_RESET_REQUEST", { email: forgotEmail.trim() });

    try {
      const redirectTo = window.location.origin;
      log("EMAIL_RESET_REDIRECT_TO", redirectTo);

      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
        forgotEmail.trim(),
        { redirectTo }
      );

      log("EMAIL_RESET_RESPONSE", { error: resetErr });

      if (resetErr) {
        const errMsg = resetErr.message.toLowerCase();
        log("EMAIL_RESET_ERROR", { code: resetErr.status, message: resetErr.message });

        if (resetErr.status === 429 || errMsg.includes("rate limit") || errMsg.includes("too many")) {
          setError("Too many reset requests. Supabase allows up to 3 per hour on the free plan. Please wait before trying again.");
        } else if (errMsg.includes("not found") || errMsg.includes("user not found")) {
          // Don't reveal whether email exists — show generic success for security
          setSuccess("If this email is registered, you'll receive a password reset link shortly. Check your inbox and spam folder.");
          emailCooldown.start();
        } else {
          setError(toFriendlyError(resetErr, "email_reset"));
        }
        setLoading(false);
        return;
      }

      emailCooldown.start();
      setSuccess("Password reset email sent! Check your inbox (and spam folder). Click the link to set a new password.");
      log("EMAIL_RESET_SUCCESS", "Reset email dispatched by Supabase");
    } catch (err: any) {
      log("EMAIL_RESET_EXCEPTION", err);
      setError(toFriendlyError(err, "email_reset"));
    } finally {
      setLoading(false);
    }
  };

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center p-4 overflow-y-auto"
      style={{ minHeight: "100dvh", paddingTop: "max(1rem, env(safe-area-inset-top))", paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center size-16 bg-primary rounded-full mb-4">
            <IndianRupee className="size-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-1">Chit Fund Manager</h1>
          <p className="text-muted-foreground text-sm">Manage your chit groups securely</p>
        </div>

        <Card>
          {/* ═══ LOGIN ═══ */}
          {view === "login" && (
            <>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>Login to access your chit groups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Single adaptive identifier field — auto-detects email vs phone */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email or Phone Number</label>
                  <div className="relative">
                    {detectedType(identifier) === "phone" && identifier.length > 0
                      ? <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      : <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />}
                    <Input
                      type="email"
                      inputMode="email"
                      placeholder="your@email.com or 9876543210"
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); clearMessages(); }}
                      className="pl-10"
                      autoComplete="username"
                    />
                    {identifier.trim().length > 0 && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        detectedType(identifier) === "email"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}>
                        {detectedType(identifier) === "email" ? "Email" : "Phone"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the email or phone number you registered with
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showPwd ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearMessages(); }}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary size-4"
                    />
                    <span className="text-sm text-muted-foreground">Save login details</span>
                  </label>

                  <button onClick={() => {
                    setView("forgot"); clearMessages();
                    if (detectedType(identifier) === "email") setForgotEmail(identifier);
                  }} className="text-sm text-primary hover:underline">
                    Forgot Password?
                  </button>
                </div>

                {error && <ErrorAlert>{error}</ErrorAlert>}

                <Button onClick={handleLogin} disabled={loading} className="w-full h-11">
                  {loading ? "Logging in…" : "Login"}
                </Button>

                <div className="text-center pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <button onClick={() => { setView("signup"); clearMessages(); }}
                      className="text-primary font-medium hover:underline">Create Account</button>
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* ═══ SIGNUP ═══ */}
          {view === "signup" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Button variant="ghost" size="icon" onClick={() => { setView("login"); clearMessages(); }}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Join the chit fund community</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                <div>
                  <p className="text-sm font-medium mb-2">I am signing up as</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["admin", "member"] as UserRole[]).map((r) => (
                      <button key={r} type="button" onClick={() => setSignupData(d => ({ ...d, role: r }))}
                        className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          signupData.role === r
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                        }`}>
                        {signupData.role === r && <CheckCircle2 className="absolute top-2 right-2 size-4 text-primary" />}
                        <div className={`size-10 rounded-full flex items-center justify-center ${signupData.role === r ? "bg-primary/15" : "bg-muted"}`}>
                          {r === "admin"
                            ? <Shield className={`size-5 ${signupData.role === r ? "text-primary" : "text-muted-foreground"}`} />
                            : <Users className={`size-5 ${signupData.role === r ? "text-primary" : "text-muted-foreground"}`} />}
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold capitalize ${signupData.role === r ? "text-primary" : ""}`}>{r}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            {r === "admin" ? "Create & manage groups" : "Join & participate"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Your role is saved securely and cannot be changed after signup without admin approval.
                  </p>
                </div>

                {[
                  { label: "Full Name", icon: User, key: "name", type: "text", placeholder: "Your full name" },
                  { label: "Email Address", icon: Mail, key: "email", type: "email", placeholder: "your@email.com" },
                  { label: "Phone Number", icon: Phone, key: "phone", type: "tel", placeholder: "9876543210" },
                ].map(({ label, icon: Icon, key, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-sm font-medium mb-1.5 block">{label}</label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input type={type} placeholder={placeholder}
                        value={(signupData as any)[key]}
                        onChange={(e) => { setSignupData(d => ({ ...d, [key]: e.target.value })); clearMessages(); }}
                        className="pl-10" />
                    </div>
                    {key === "phone" && <p className="text-xs text-muted-foreground mt-1">10-digit Indian mobile number</p>}
                  </div>
                ))}

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input type={showSignupPwd ? "text" : "password"} placeholder="Min 6 characters"
                      value={signupData.password}
                      onChange={(e) => { setSignupData(d => ({ ...d, password: e.target.value })); clearMessages(); }}
                      className="pl-10 pr-10" />
                    <button type="button" onClick={() => setShowSignupPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showSignupPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input type="password" placeholder="Re-enter your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => { setSignupData(d => ({ ...d, confirmPassword: e.target.value })); clearMessages(); }}
                      className="pl-10" />
                  </div>
                </div>

                {error && <ErrorAlert>{error}</ErrorAlert>}
                {success && <SuccessAlert>{success}</SuccessAlert>}

                <Button onClick={handleSignup} disabled={loading} className="w-full h-11">
                  {loading ? "Creating Account…" : `Sign Up as ${signupData.role === "admin" ? "Admin" : "Member"}`}
                </Button>

                <div className="text-center pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button onClick={() => { setView("login"); clearMessages(); }}
                      className="text-primary font-medium hover:underline">Login</button>
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* ═══ FORGOT PASSWORD ═══ */}
          {view === "forgot" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setView("login"); clearMessages();
                    setForgotEmail("");
                  }}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <div>
                    <CardTitle>Reset Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Registered Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); clearMessages(); }}
                      onKeyDown={(e) => e.key === "Enter" && handleEmailReset()}
                      className="pl-10"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <Info className="size-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    We'll send a secure reset link to your email. Click it to set a new password.
                    The link expires in 1 hour. Check your spam folder if it doesn't arrive.
                  </p>
                </div>

                {emailCooldown.inCooldown && (
                  <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg">
                    <Clock className="size-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Resend available in <strong>{emailCooldown.remaining}s</strong>
                    </p>
                  </div>
                )}

                {error && <ErrorAlert>{error}</ErrorAlert>}
                {success && <SuccessAlert>{success}</SuccessAlert>}

                <Button
                  onClick={handleEmailReset}
                  disabled={loading || emailCooldown.inCooldown}
                  className="w-full h-11"
                >
                  {loading ? (
                    <><RefreshCw className="size-4 mr-2 animate-spin" /> Sending…</>
                  ) : emailCooldown.inCooldown ? (
                    <><Clock className="size-4 mr-2" /> Wait {emailCooldown.remaining}s</>
                  ) : (
                    <><Mail className="size-4 mr-2" /> Send Reset Email</>
                  )}
                </Button>

                <div className="text-center pt-1">
                  <button onClick={() => { setView("login"); clearMessages(); setForgotEmail(""); }}
                    className="text-sm text-muted-foreground hover:text-foreground hover:underline">
                    Back to Login
                  </button>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

// ── Small reusable alert components ───────────────────────────────────────────
function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="bg-destructive/10 text-destructive border-destructive/20 text-sm flex items-start gap-2">
      <AlertCircle className="size-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </Alert>
  );
}

function SuccessAlert({ children }: { children: React.ReactNode }) {
  return (
    <Alert className="bg-green-50 text-green-700 border-green-200 text-sm flex items-start gap-2">
      <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
      <span>{children}</span>
    </Alert>
  );
}
