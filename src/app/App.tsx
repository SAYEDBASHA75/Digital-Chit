import { useState, useEffect, useRef } from "react";
import { supabaseClient as supabaseAuth } from "./lib/supabaseClient";
import { useLanguage, LanguageProvider } from "./contexts/LanguageContext";
import { ChitGroupCard } from "./components/ChitGroupCard";
import { ChitGroupDetails } from "./components/ChitGroupDetails";
import { CreateChitGroupDialog } from "./components/CreateChitGroupDialog";
import { LoginPage } from "./components/LoginPage";
import type { UserRole } from "./components/LoginPage";
import { Sidebar, type PageKey } from "./components/Sidebar";
import { MyChitsPage } from "./components/pages/MyChitsPage";
import { KycPage } from "./components/pages/KycPage";
import { PaymentsPage } from "./components/pages/PaymentsPage";
import { ProfilePage } from "./components/pages/ProfilePage";
import { PaymentDialog, type PaymentTarget } from "./components/PaymentDialog";
import { InstallPrompt } from "./components/InstallPrompt";
import { AdminMembersPage } from "./components/pages/AdminMembersPage";
import { JoinGroupPage } from "./components/pages/JoinGroupPage";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Plus, IndianRupee, Users, TrendingUp, Shield, Loader2, UserPlus, LogOut, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Toaster, toast } from "sonner";
import { projectId } from "../../utils/supabase/info";

interface ChitGroup {
  id: string;
  name: string;
  totalAmount: number;
  monthlyContribution: number;
  duration: number;
  currentMonth: number;
  totalMembers: number;
  status: "active" | "upcoming" | "completed";
  nextBidDate: string;
  organizerUpiId?: string;
  organizerName?: string;
  createdBy?: string;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}

function AppInner() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [userRole, setUserRole] = useState<UserRole>("member");
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [chitGroups, setChitGroups] = useState<ChitGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);

  // Chatbot auto-open — true on fresh login, false once dismissed

  // Live DB role verification spinner for create-group button
  const [verifyingRole, setVerifyingRole] = useState(false);

  // Password recovery overlay (triggered by email reset link)
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirm, setRecoveryConfirm] = useState("");
  const [showRecoveryPwd, setShowRecoveryPwd] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const recoveryListenerAttached = useRef(false);

  // Listen for PASSWORD_RECOVERY auth event (fired when user clicks the reset email link)
  useEffect(() => {
    if (recoveryListenerAttached.current) return;
    recoveryListenerAttached.current = true;

    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("[PasswordRecovery] PASSWORD_RECOVERY event received — showing reset overlay");
        setShowRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRecoverySubmit = async () => {
    setRecoveryError("");
    if (!recoveryPassword || recoveryPassword.length < 6) {
      setRecoveryError("New password must be at least 6 characters.");
      return;
    }
    if (recoveryPassword !== recoveryConfirm) {
      setRecoveryError("Passwords do not match.");
      return;
    }

    setRecoveryLoading(true);
    try {
      const { error } = await supabaseAuth.auth.updateUser({ password: recoveryPassword });
      if (error) {
        console.log("[PasswordRecovery] updateUser error:", error);
        setRecoveryError("Failed to update password. The reset link may have expired — please request a new one.");
        setRecoveryLoading(false);
        return;
      }
      setRecoverySuccess(true);
      console.log("[PasswordRecovery] Password updated successfully");
      // Sign out and force fresh login
      await supabaseAuth.auth.signOut();
      setTimeout(() => {
        setShowRecovery(false);
        setRecoverySuccess(false);
        setRecoveryPassword(""); setRecoveryConfirm("");
        handleLogout();
      }, 2500);
    } catch (err) {
      console.log("[PasswordRecovery] exception:", err);
      setRecoveryError("An unexpected error occurred. Please try again.");
      setRecoveryLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("chitfund_user");
    const storedToken = localStorage.getItem("chitfund_token");
    if (storedUser && storedToken) {
      // Always verify the token and fetch role from backend — never trust localStorage role alone
      (async () => {
        try {
          const res = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/auth/profile`,
            { headers: { Authorization: `Bearer ${storedToken}` } }
          );
          if (res.status === 401) { handleLogout(); return; }
          if (res.ok) {
            const data = await res.json();
            const role: UserRole = data.role === "admin" ? "admin" : "member";
            localStorage.setItem("chitfund_role", role);
            setUser(data.user);
            setAccessToken(storedToken);
            setUserRole(role);
            fetchGroups(storedToken);
          } else {
            handleLogout();
          }
        } catch {
          // Network error — fall back to cached role so offline still works
          const cachedRole = localStorage.getItem("chitfund_role") as UserRole | null;
          setUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
          setUserRole(cachedRole || "member");
          fetchGroups(storedToken);
        }
      })();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchGroups = async (token: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/groups`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 401) { handleLogout(); return; }
      if (response.ok) {
        const data = await response.json();
        setChitGroups(data.groups || []);
      } else {
        console.error("Failed to fetch groups:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = (authUser: any, token: string, role: UserRole) => {
    setUser(authUser);
    setAccessToken(token);
    setUserRole(role);
    fetchGroups(token);
  };

  const handleLogout = () => {
    localStorage.removeItem("chitfund_user");
    localStorage.removeItem("chitfund_token");
    localStorage.removeItem("chitfund_role");
    setUser(null);
    setAccessToken("");
    setUserRole("member");
    setChitGroups([]);
  };

  // Re-verify role from DB before opening create-group dialog
  const openCreateGroupDialog = async () => {
    setVerifyingRole(true);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/auth/profile`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      const dbRole: UserRole = data.role === "admin" ? "admin" : "member";
      if (dbRole !== userRole) {
        setUserRole(dbRole);
        localStorage.setItem("chitfund_role", dbRole);
      }
      if (dbRole !== "admin") {
        toast.error("Admin permission required", {
          description: "Only admin accounts can create chit groups. Your account is registered as a member.",
        });
        return;
      }
      setShowCreateDialog(true);
    } catch {
      if (userRole !== "admin") {
        toast.error("Admin permission required", {
          description: "Only admins can create chit groups.",
        });
        return;
      }
      setShowCreateDialog(true);
    } finally {
      setVerifyingRole(false);
    }
  };

  const handleCreateGroup = async (groupData: any): Promise<any> => {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/groups`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(groupData),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create group");
    }
    setChitGroups((prev) => [...prev, data.group]);
    return data.group;
  };

  // Open payment dialog for a group
  const handlePayNow = (group: ChitGroup) => {
    setPaymentTarget({
      groupId: group.id,
      groupName: group.name,
      defaultAmount: group.monthlyContribution,
      month: group.currentMonth,
      memberName: user?.user_metadata?.name || user?.email?.split("@")[0] || "Member",
      recipientUpiId: group.organizerUpiId || "",
      recipientName: group.organizerName || group.name,
    });
    setShowPaymentDialog(true);
  };

  const handleNavigate = (page: PageKey) => {
    setActivePage(page);
    setSelectedGroupId(null);
    if (page === "create-group") openCreateGroupDialog();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLoginSuccess={handleAuthSuccess} />;
  }

  const selectedGroup = chitGroups.find((g) => g.id === selectedGroupId);
  const totalActiveGroups = chitGroups.filter((g) => g.status === "active").length;
  const totalInvested = chitGroups
    .filter((g) => g.status === "active")
    .reduce((sum, g) => sum + g.monthlyContribution * g.currentMonth, 0);
  const totalMembers = chitGroups.reduce((sum, g) => sum + g.totalMembers, 0);

  const handleGroupDeleted = (groupId: string) => {
    setChitGroups((prev) => prev.filter((g) => g.id !== groupId));
    setSelectedGroupId(null);
  };

  const renderContent = () => {
    if (selectedGroup) {
      return (
        <ChitGroupDetails
          group={selectedGroup}
          accessToken={accessToken}
          userId={user?.id || ""}
          userRole={userRole}
          onBack={() => setSelectedGroupId(null)}
          onPayNow={handlePayNow}
          onGroupDeleted={handleGroupDeleted}
        />
      );
    }

    switch (activePage) {
      case "my-chits":
        return (
          <MyChitsPage
            accessToken={accessToken}
            onViewDetails={setSelectedGroupId}
            onCreateGroup={openCreateGroupDialog}
            onSessionExpired={handleLogout}
            onPayNow={handlePayNow}
          />
        );
      case "kyc":
        return <KycPage accessToken={accessToken} user={user} userRole={userRole} />;
      case "payments":
        return <PaymentsPage accessToken={accessToken} />;
      case "admin-members":
        return <AdminMembersPage accessToken={accessToken} />;
      case "join-group":
        return (
          <JoinGroupPage
            accessToken={accessToken}
            onJoined={() => fetchGroups(accessToken)}
          />
        );
      case "profile":
        return <ProfilePage user={user} accessToken={accessToken} />;
      case "chits":
      case "dashboard":
      default:
        return (
          <DashboardContent
            chitGroups={chitGroups}
            totalActiveGroups={totalActiveGroups}
            totalInvested={totalInvested}
            totalMembers={totalMembers}
            onViewDetails={setSelectedGroupId}
            onCreateGroup={openCreateGroupDialog}
            onJoinGroup={() => handleNavigate("join-group")}
            onPayNow={handlePayNow}
            pageTitle={activePage === "chits" ? t("nav.chits") : t("dash.title")}
            userRole={userRole}
            verifyingRole={verifyingRole}
            accessToken={accessToken}
          />
        );
    }
  };

  return (
    <div className="flex bg-background overflow-hidden app-shell" style={{ minWidth: 1291, minHeight: 852 }}>
      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user}
        userRole={userRole}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop header only */}
        <header className="hidden md:flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <h2 className="font-semibold text-base md:text-lg truncate">
              {selectedGroup ? selectedGroup.name : (
                {
                  "dashboard": t("nav.dashboard"),
                  "my-chits": t("nav.myChits"),
                  "chits": t("nav.chits"),
                  "kyc": t("nav.kyc"),
                  "create-group": t("nav.createGroup"),
                  "payments": t("nav.payments"),
                  "admin-members": t("nav.adminMembers"),
                  "join-group": t("nav.joinGroup"),
                  "profile": t("nav.profile"),
                }[activePage] ?? activePage
              )}
            </h2>
            <span className={`shrink-0 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              userRole === "admin"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground border border-border"
            }`}>
              {userRole === "admin" ? <Shield className="size-3" /> : <Users className="size-3" />}
              {userRole === "admin" ? "Admin" : "Member"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Create group — admin only on group pages */}
            {userRole === "admin" && (activePage === "dashboard" || activePage === "my-chits" || activePage === "chits") && !selectedGroup && (
              <Button onClick={openCreateGroupDialog} disabled={verifyingRole} size="sm" className="hidden sm:flex">
                {verifyingRole
                  ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Verifying…</>
                  : <><Plus className="size-4 mr-1.5" />{t("nav.createGroup")}</>}
              </Button>
            )}

            {/* User info + logout */}
            <div className="flex items-center gap-1.5 ml-1 pl-1.5 border-l border-border">
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-xs font-medium">{user?.user_metadata?.name || user?.email?.split("@")[0] || "User"}</span>
                <span className="text-[10px] text-muted-foreground">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {renderContent()}
        </main>
      </div>

      {userRole === "admin" && (
        <CreateChitGroupDialog
          open={showCreateDialog}
          onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open && activePage === "create-group") setActivePage("dashboard");
          }}
          onSubmit={handleCreateGroup}
        />
      )}

      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        target={paymentTarget}
        accessToken={accessToken}
        onPaymentSaved={(txn) => {
          console.log("Transaction saved:", txn.id);
        }}
      />

      <InstallPrompt />

      {/* Toast notifications */}
      <Toaster position="top-center" richColors closeButton />

      {/* ── Password Recovery Overlay ── */}
      {showRecovery && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-center size-14 bg-primary/10 rounded-full mx-auto mb-2">
                <Lock className="size-7 text-primary" />
              </div>
              <CardTitle className="text-center">Set New Password</CardTitle>
              <CardDescription className="text-center">
                {recoverySuccess
                  ? "Password updated! Redirecting to login…"
                  : "Enter your new password below. You'll be logged out afterwards."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recoverySuccess ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <CheckCircle2 className="size-10 text-green-500" />
                  <p className="text-sm text-green-700 text-center font-medium">
                    Your password has been updated successfully.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type={showRecoveryPwd ? "text" : "password"}
                        placeholder="Min 6 characters"
                        value={recoveryPassword}
                        onChange={(e) => { setRecoveryPassword(e.target.value); setRecoveryError(""); }}
                        className="pl-10 pr-10"
                      />
                      <button type="button" onClick={() => setShowRecoveryPwd(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showRecoveryPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Re-enter new password"
                        value={recoveryConfirm}
                        onChange={(e) => { setRecoveryConfirm(e.target.value); setRecoveryError(""); }}
                        onKeyDown={(e) => e.key === "Enter" && handleRecoverySubmit()}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      <AlertCircle className="size-4 shrink-0 mt-0.5" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <Button onClick={handleRecoverySubmit} disabled={recoveryLoading} className="w-full h-11">
                    {recoveryLoading
                      ? <><RefreshCw className="size-4 mr-2 animate-spin" />Updating Password…</>
                      : <><CheckCircle2 className="size-4 mr-2" />Update Password</>}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

    </div>
  );
}

// ── Dashboard Content ──────────────────────────────────
interface DashboardContentProps {
  chitGroups: ChitGroup[];
  totalActiveGroups: number;
  totalInvested: number;
  totalMembers: number;
  onViewDetails: (id: string) => void;
  onCreateGroup: () => void;
  onJoinGroup: () => void;
  onPayNow: (group: ChitGroup) => void;
  pageTitle: string;
  userRole: UserRole;
  verifyingRole?: boolean;
  accessToken?: string;
}

function DashboardContent({
  chitGroups, totalActiveGroups, totalInvested, totalMembers,
  onViewDetails, onCreateGroup, onJoinGroup, onPayNow, pageTitle, userRole,
  verifyingRole, accessToken,
}: DashboardContentProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <h1 className="text-xl font-bold">{pageTitle}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("dash.activeGroups")}</p>
                <p className="text-2xl font-bold">{totalActiveGroups}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <IndianRupee className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("dash.totalInvested")}</p>
                <p className="text-2xl font-bold">₹{totalInvested.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("dash.totalMembers")}</p>
                <p className="text-2xl font-bold">{totalMembers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Groups */}
      {chitGroups.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="text-base font-semibold">{t("dash.yourGroups")}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {userRole === "member" && (
                <button
                  onClick={onJoinGroup}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                >
                  <UserPlus className="size-3" />
                  Join Group
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {chitGroups.map((group) => (
              <ChitGroupCard
                key={group.id}
                group={group}
                accessToken={accessToken}
                onViewDetails={onViewDetails}
                onPayNow={onPayNow}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="pt-8 pb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center size-14 bg-muted rounded-full mb-4">
                {userRole === "admin"
                  ? <Plus className="size-7 text-muted-foreground" />
                  : <UserPlus className="size-7 text-muted-foreground" />}
              </div>
              <h3 className="font-semibold mb-1">{t("dash.noGroups")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {userRole === "admin"
                  ? "Create your first chit fund group and invite members"
                  : "You haven't joined any chit fund groups yet. Ask your admin for an invite code."}
              </p>
              <div className="flex gap-2 flex-wrap justify-center">
                {userRole === "admin" ? (
                  <>
                    <Button onClick={onCreateGroup} variant="outline" disabled={verifyingRole}>
                      {verifyingRole
                        ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Verifying…</>
                        : <><Shield className="size-4 mr-1.5" />{t("group.createNew")}</>}
                    </Button>
                  </>
                ) : (
                  <Button onClick={onJoinGroup} className="gap-2">
                    <UserPlus className="size-4" />
                    Join a Chit Group
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
