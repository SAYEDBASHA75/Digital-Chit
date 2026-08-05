import { useState, useEffect } from "react";
import { useLanguage } from "../../contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "../ui/dialog";
import {
  User, Mail, Phone, Lock, Bell, Shield, Edit2, Save, X,
  Eye, EyeOff, CheckCircle2, AlertCircle, Loader2,
  Smartphone, KeyRound, ShieldCheck, ShieldOff, RefreshCw,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";

interface ProfilePageProps {
  user: any;
  accessToken: string;
}

// ── Password strength helper ──
function getStrength(pwd: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, label: "Very Weak", color: "bg-red-500" };
  if (score === 2) return { score, label: "Weak", color: "bg-orange-400" };
  if (score === 3) return { score, label: "Fair", color: "bg-yellow-400" };
  if (score === 4) return { score, label: "Strong", color: "bg-blue-500" };
  return { score, label: "Very Strong", color: "bg-green-500" };
}

export function ProfilePage({ user, accessToken }: ProfilePageProps) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.name || "");
  const [phone, setPhone] = useState(user?.user_metadata?.phone || "");
  const email = user?.email || "";

  // Notifications toggles
  const [notifs, setNotifs] = useState([true, true, false]);

  // ── Change Password state ──
  const [showPwdDialog, setShowPwdDialog] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // ── 2FA state ──
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAStep, setTwoFAStep] = useState<1 | 2 | 3>(1);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAError, setTwoFAError] = useState("");
  const [twoFAOtp, setTwoFAOtp] = useState("");
  const [twoFADemoCode, setTwoFADemoCode] = useState("");
  const [twoFAPhone, setTwoFAPhone] = useState("");

  const initials = name
    ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase();

  const strength = getStrength(newPwd);

  // Load 2FA status on mount
  useEffect(() => {
    if (!accessToken) return;
    fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/auth/2fa/status`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((r) => r.json())
      .then((d) => setTwoFAEnabled(d.enabled ?? false))
      .catch(() => {});
  }, [accessToken]);

  // ── Change password submit ──
  const handleChangePassword = async () => {
    setPwdError("");
    if (!currentPwd) { setPwdError("Please enter your current password"); return; }
    if (newPwd.length < 8) { setPwdError("New password must be at least 8 characters"); return; }
    if (newPwd !== confirmPwd) { setPwdError("New passwords do not match"); return; }
    if (newPwd === currentPwd) { setPwdError("New password must differ from current password"); return; }

    setPwdLoading(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setPwdError(data.error || "Failed to change password"); return; }
      setPwdSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => { setShowPwdDialog(false); setPwdSuccess(false); }, 2200);
    } catch {
      setPwdError("Network error. Please try again.");
    } finally {
      setPwdLoading(false);
    }
  };

  const openPwdDialog = () => {
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    setPwdError(""); setPwdSuccess(false);
    setShowCurrent(false); setShowNew(false); setShowConfirm(false);
    setShowPwdDialog(true);
  };

  // ── 2FA: send OTP ──
  const handleSend2FA = async () => {
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/auth/2fa/setup`,
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) { setTwoFAError(data.error || "Failed to send code"); return; }
      setTwoFAPhone(data.phone || "");
      setTwoFADemoCode(data.otp || "");
      setTwoFAStep(2);
    } catch {
      setTwoFAError("Network error. Please try again.");
    } finally {
      setTwoFALoading(false);
    }
  };

  // ── 2FA: verify OTP ──
  const handleVerify2FA = async () => {
    if (twoFAOtp.length !== 6) { setTwoFAError("Enter the 6-digit code"); return; }
    setTwoFALoading(true);
    setTwoFAError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/auth/2fa/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ otp: twoFAOtp }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setTwoFAError(data.error || "Verification failed"); return; }
      setTwoFAStep(3);
      setTwoFAEnabled(true);
    } catch {
      setTwoFAError("Network error. Please try again.");
    } finally {
      setTwoFALoading(false);
    }
  };

  const open2FADialog = () => {
    setTwoFAStep(1); setTwoFAOtp(""); setTwoFAError("");
    setTwoFADemoCode(""); setTwoFAPhone("");
    setShow2FADialog(true);
  };

  const close2FADialog = () => {
    if (twoFALoading) return;
    setShow2FADialog(false);
    setTimeout(() => { setTwoFAStep(1); setTwoFAOtp(""); setTwoFAError(""); }, 300);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-1">Manage your account details and preferences</p>
      </div>

      {/* Avatar card */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-5">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center shrink-0 border-4 border-primary/20">
              <span className="text-2xl font-bold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">{name || "Your Name"}</h2>
              <p className="text-sm text-muted-foreground truncate">{email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-xs font-medium">
                  <Shield className="size-3" /> Active Member
                </span>
                {twoFAEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                    <ShieldCheck className="size-3" /> 2FA On
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{t("profile.personalInfo")}</CardTitle>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="size-3.5 mr-1.5" /> {t("common.edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setEditing(false)}>
                  <Save className="size-3.5 mr-1.5" /> {t("common.save")}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">{t("profile.fullName")}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!editing} className="pl-9" placeholder="Your full name" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">{t("profile.emailAddr")}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={email} disabled className="pl-9 bg-muted/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block text-muted-foreground">{t("profile.phoneNum")}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!editing} className="pl-9" placeholder="10-digit mobile number" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("profile.security")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Change Password */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Lock className="size-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{t("auth.password")}</p>
                <p className="text-xs text-muted-foreground">{t("profile.changePassword")}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={openPwdDialog}>{t("common.change")}</Button>
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`size-9 rounded-lg flex items-center justify-center ${twoFAEnabled ? "bg-blue-100" : "bg-primary/10"}`}>
                {twoFAEnabled
                  ? <ShieldCheck className="size-4 text-blue-600" />
                  : <Shield className="size-4 text-primary" />}
              </div>
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  {twoFAEnabled ? "Your account is protected with 2FA" : "Add an extra layer of security"}
                </p>
              </div>
            </div>
            <Button
              variant={twoFAEnabled ? "secondary" : "outline"}
              size="sm"
              onClick={open2FADialog}
              className={twoFAEnabled ? "text-blue-700 bg-blue-100 hover:bg-blue-200 border-blue-200" : ""}
            >
              {twoFAEnabled ? "Manage" : "Enable"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Contribution reminders", desc: "Get notified 3 days before due date" },
            { label: "Bid results", desc: "Notify when bid auction closes" },
            { label: "Dividend credited", desc: "Notify when dividend is received" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <Bell className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => setNotifs((prev) => prev.map((v, idx) => idx === i ? !v : v))}
                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none ${notifs[i] ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform ${notifs[i] ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════
          CHANGE PASSWORD DIALOG
      ═══════════════════════════════════════ */}
      <Dialog open={showPwdDialog} onOpenChange={(o) => { if (!pwdLoading) { setShowPwdDialog(o); } }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>

          {pwdSuccess ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <p className="font-bold text-lg text-green-700">Password Updated!</p>
              <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                {/* Current password */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showCurrent ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPwd}
                      onChange={(e) => { setCurrentPwd(e.target.value); setPwdError(""); }}
                      className="pl-9 pr-10"
                      disabled={pwdLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* New password */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showNew ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={newPwd}
                      onChange={(e) => { setNewPwd(e.target.value); setPwdError(""); }}
                      className="pl-9 pr-10"
                      disabled={pwdLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {newPwd && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-muted"}`} />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${strength.score <= 2 ? "text-red-500" : strength.score === 3 ? "text-yellow-600" : "text-green-600"}`}>
                        {strength.label}
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Confirm New Password</label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPwd}
                      onChange={(e) => { setConfirmPwd(e.target.value); setPwdError(""); }}
                      className={`pl-9 pr-10 ${confirmPwd && confirmPwd !== newPwd ? "border-red-400" : confirmPwd && confirmPwd === newPwd ? "border-green-400" : ""}`}
                      disabled={pwdLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {confirmPwd && confirmPwd === newPwd && (
                    <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="size-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error */}
                {pwdError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="size-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{pwdError}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPwdDialog(false)} disabled={pwdLoading}>Cancel</Button>
                <Button onClick={handleChangePassword} disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}>
                  {pwdLoading ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Updating...</> : "Update Password"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════
          TWO-FACTOR AUTH DIALOG
      ═══════════════════════════════════════ */}
      <Dialog open={show2FADialog} onOpenChange={(o) => { if (!twoFALoading) close2FADialog(); }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-blue-600" />
              {twoFAEnabled && twoFAStep === 1 ? "Two-Factor Authentication" : "Enable Two-Factor Authentication"}
            </DialogTitle>
          </DialogHeader>

          {/* Step 1 — Intro */}
          {twoFAStep === 1 && (
            <>
              <div className="py-3 space-y-4">
                {twoFAEnabled ? (
                  <div className="flex flex-col items-center gap-4 text-center py-4">
                    <div className="size-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <ShieldCheck className="size-9 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-800 text-lg">2FA is Active</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your account is protected with two-factor authentication via SMS.
                      </p>
                    </div>
                    <div className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                      <p className="text-xs text-blue-700">
                        Every login will require a one-time code sent to your registered phone number.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-3 text-center py-2">
                      <div className="size-14 bg-blue-100 rounded-full flex items-center justify-center">
                        <Smartphone className="size-7 text-blue-600" />
                      </div>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Add an extra security layer. Each login will require a one-time code sent to your phone.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: "1", text: "We send a 6-digit code to your phone" },
                        { icon: "2", text: "You enter the code to verify your identity" },
                        { icon: "3", text: "2FA is activated on your account" },
                      ].map((step) => (
                        <div key={step.icon} className="flex items-center gap-3 p-2.5 bg-muted rounded-lg">
                          <span className="size-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                            {step.icon}
                          </span>
                          <p className="text-sm">{step.text}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {twoFAError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="size-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{twoFAError}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={close2FADialog}>
                  {twoFAEnabled ? "Close" : "Cancel"}
                </Button>
                {!twoFAEnabled && (
                  <Button onClick={handleSend2FA} disabled={twoFALoading}>
                    {twoFALoading
                      ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Sending...</>
                      : <><Smartphone className="size-4 mr-1.5" /> Send Verification Code</>}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}

          {/* Step 2 — Enter OTP */}
          {twoFAStep === 2 && (
            <>
              <div className="py-3 space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <Smartphone className="size-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Code sent!</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      A 6-digit verification code was sent to
                      {twoFAPhone ? ` ••••••${twoFAPhone.slice(-4)}` : " your registered phone"}.
                    </p>
                  </div>
                </div>

                {/* Demo OTP hint */}
                {twoFADemoCode && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="size-4 text-yellow-600 shrink-0" />
                    <p className="text-xs text-yellow-700">
                      <strong>Demo mode:</strong> Your code is <strong className="font-mono text-sm">{twoFADemoCode}</strong>
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Enter Verification Code</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={twoFAOtp}
                    onChange={(e) => { setTwoFAOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setTwoFAError(""); }}
                    className="text-center text-2xl font-mono tracking-widest h-14"
                    disabled={twoFALoading}
                  />
                </div>

                {twoFAError && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="size-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{twoFAError}</p>
                  </div>
                )}

                <button
                  onClick={() => { setTwoFAStep(1); setTwoFAOtp(""); setTwoFAError(""); }}
                  className="text-xs text-primary underline underline-offset-2 hover:opacity-80 flex items-center gap-1"
                >
                  <RefreshCw className="size-3" /> Resend code
                </button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setTwoFAStep(1); setTwoFAOtp(""); setTwoFAError(""); }} disabled={twoFALoading}>
                  Back
                </Button>
                <Button onClick={handleVerify2FA} disabled={twoFALoading || twoFAOtp.length !== 6}>
                  {twoFALoading
                    ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Verifying...</>
                    : <><ShieldCheck className="size-4 mr-1.5" /> Verify & Enable</>}
                </Button>
              </DialogFooter>
            </>
          )}

          {/* Step 3 — Success */}
          {twoFAStep === 3 && (
            <>
              <div className="py-6 flex flex-col items-center gap-4 text-center">
                <div className="size-20 bg-green-100 rounded-full flex items-center justify-center">
                  <ShieldCheck className="size-10 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-xl text-green-700">2FA Enabled!</p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    Two-factor authentication is now active. Your account is more secure.
                  </p>
                </div>
                <div className="w-full p-3 bg-green-50 border border-green-200 rounded-lg text-left space-y-1">
                  <p className="text-xs font-semibold text-green-800">What happens next:</p>
                  <p className="text-xs text-green-700">• Each login will ask for a phone verification code</p>
                  <p className="text-xs text-green-700">• Keep your phone accessible when logging in</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={close2FADialog} className="w-full">Done</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}