import { useState, useEffect } from "react";
import {
  LayoutDashboard, Wallet, Users2, FileCheck,
  PlusCircle, CreditCard, UserCircle,
  LogOut, IndianRupee, X, Shield, Users, ChevronRight,
  MoreHorizontal, UserPlus,
} from "lucide-react";
import { LanguageSelector } from "./LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";
import type { UserRole } from "./LoginPage";

export type PageKey =
  | "dashboard"
  | "my-chits"
  | "chits"
  | "kyc"
  | "create-group"
  | "join-group"
  | "payments"
  | "admin-members"
  | "profile";

const ALL_NAV: { key: PageKey; labelKey: string; icon: React.ElementType; adminOnly?: boolean; memberOnly?: boolean }[] = [
  { key: "dashboard",     labelKey: "nav.dashboard",     icon: LayoutDashboard },
  { key: "my-chits",      labelKey: "nav.myChits",        icon: Wallet },
  { key: "chits",         labelKey: "nav.chits",          icon: Users2 },
  { key: "kyc",           labelKey: "nav.kyc",            icon: FileCheck },
  { key: "join-group",    labelKey: "nav.joinGroup",      icon: UserPlus, memberOnly: true },
  { key: "create-group",  labelKey: "nav.createGroup",    icon: PlusCircle, adminOnly: true },
  { key: "payments",      labelKey: "nav.payments",       icon: CreditCard },
  { key: "admin-members", labelKey: "nav.adminMembers",   icon: Shield, adminOnly: true },
  { key: "profile",       labelKey: "nav.profile",        icon: UserCircle },
];

// Bottom tab bar: 4 primary tabs + "More" sheet
const BOTTOM_TABS_MEMBER: PageKey[] = ["dashboard", "join-group", "payments", "profile"];
const BOTTOM_TABS_ADMIN:  PageKey[] = ["dashboard", "chits", "admin-members", "payments", "profile"];

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  user: any;
  userRole: UserRole;
}

export function Sidebar({ activePage, onNavigate, onLogout, user, userRole }: SidebarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { t } = useLanguage();

  const userName  = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";

  const visibleNav = ALL_NAV.filter(({ adminOnly, memberOnly }) => {
    if (adminOnly) return userRole === "admin";
    if (memberOnly) return userRole === "member";
    return true;
  });

  // Inject viewport meta for proper mobile scaling
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "viewport";
      document.head.appendChild(meta);
    }
    meta.content = "width=1291, initial-scale=1, viewport-fit=cover, user-scalable=yes";

    let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!themeColor) {
      themeColor = document.createElement("meta");
      themeColor.name = "theme-color";
      document.head.appendChild(themeColor);
    }
    themeColor.content = "#7c3aed";
  }, []);

  const navigate = (page: PageKey) => {
    onNavigate(page);
    setDrawerOpen(false);
    setMoreOpen(false);
  };

  const RoleBadge = () => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      userRole === "admin"
        ? "bg-primary/15 text-primary border border-primary/25"
        : "bg-muted text-muted-foreground border border-border"
    }`}>
      {userRole === "admin" ? <><Shield className="size-2.5" /> Admin</> : <><Users className="size-2.5" /> Member</>}
    </span>
  );

  // ── Bottom tab keys for current role ────────────────────────────────────
  const bottomKeys = userRole === "admin" ? BOTTOM_TABS_ADMIN : BOTTOM_TABS_MEMBER;
  const bottomTabs = bottomKeys.map(k => ALL_NAV.find(n => n.key === k)!).filter(Boolean);

  // Pages not in bottom tabs go into "More" sheet
  const moreTabs = visibleNav.filter(n => !bottomKeys.includes(n.key));

  return (
    <>
      {/* ══════════════════════════════════════════
          MOBILE — top bar with Language + Logout on left
      ══════════════════════════════════════════ */}
      <div className="md:hidden flex items-center justify-between px-3 border-b bg-card shrink-0"
        style={{ paddingTop: "env(safe-area-inset-top)", height: "calc(3.5rem + env(safe-area-inset-top))" }}>

        {/* LEFT: app logo + logout */}
        <div className="flex items-center gap-1.5">
          <div className="size-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <IndianRupee className="size-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm mr-1">Chit Fund</span>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Logout"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="size-3.5" />
            <span className="text-xs">Out</span>
          </button>
        </div>

        {/* RIGHT: role badge + hamburger for full drawer */}
        <div className="flex items-center gap-2">
          <RoleBadge />
          <button onClick={() => setDrawerOpen(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <div className="flex flex-col gap-1 w-5">
              <span className="h-0.5 bg-foreground rounded-full" />
              <span className="h-0.5 bg-foreground rounded-full w-3/4" />
              <span className="h-0.5 bg-foreground rounded-full" />
            </div>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE — full-screen drawer (profile, logout, secondary pages)
      ══════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
      )}
      <div className={`md:hidden fixed top-0 left-0 z-50 flex flex-col bg-card border-r transition-transform duration-300 ease-out
        ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ width: "min(18rem, 85vw)", height: "100dvh" }}>

        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-4 border-b shrink-0"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}>
          <div className="flex items-center gap-3">
            <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-base">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              <div className="mt-0.5"><RoleBadge /></div>
            </div>
          </div>
          <button onClick={() => setDrawerOpen(false)} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0">
            <X className="size-5" />
          </button>
        </div>

        {/* All nav items */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ key, labelKey, icon: Icon }) => {
            const isActive = activePage === key;
            return (
              <button key={key} onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <Icon className="size-5 shrink-0" />
                <span className="flex-1 text-left">{t(labelKey as any)}</span>
                {isActive && <ChevronRight className="size-3.5 opacity-70" />}
              </button>
            );
          })}
        </nav>

        {/* Drawer footer */}
        <div className="px-3 py-3 border-t shrink-0 space-y-1"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
          <div className="flex items-center px-3 py-2">
            <LanguageSelector />
          </div>
          <button onClick={() => { onLogout(); setDrawerOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
            <LogOut className="size-5 shrink-0" />
            {t("nav.logout")}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MOBILE — bottom tab bar
      ══════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t bottom-nav">
        <div className="flex items-center justify-around h-15" style={{ height: "3.75rem" }}>
          {bottomTabs.map(({ key, labelKey, icon: Icon }) => {
            const isActive = activePage === key;
            return (
              <button key={key} onClick={() => navigate(key)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all active:scale-90 select-none"
                style={{ WebkitTapHighlightColor: "transparent" }}>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/15" : ""}`}>
                  <Icon className={`size-5 transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-[10px] font-medium leading-tight transition-all ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {t(labelKey as any).split(" ")[0]}
                </span>
              </button>
            );
          })}

          {/* More button → opens sheet */}
          {moreTabs.length > 0 && (
            <button onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 active:scale-90 select-none"
              style={{ WebkitTapHighlightColor: "transparent" }}>
              <div className="p-1.5 rounded-xl">
                <MoreHorizontal className="size-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">More</span>
            </button>
          )}
        </div>
      </div>

      {/* More sheet */}
      {moreOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMoreOpen(false)} />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}>
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-5 py-2">More</p>
            <nav className="px-3 pb-2 space-y-0.5">
              {moreTabs.map(({ key, labelKey, icon: Icon }) => (
                <button key={key} onClick={() => navigate(key)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                    activePage === key ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                  }`}>
                  <Icon className="size-5 shrink-0" />
                  <span className="flex-1 text-left">{t(labelKey as any)}</span>
                </button>
              ))}
              <button onClick={() => { onLogout(); setMoreOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all">
                <LogOut className="size-5 shrink-0" />
                {t("nav.logout")}
              </button>
            </nav>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════
          DESKTOP sidebar (unchanged)
      ══════════════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r bg-card h-screen sticky top-0">
        <div className="px-4 py-5 border-b">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <IndianRupee className="size-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">Chit Fund</p>
              <p className="text-xs text-muted-foreground">Manager</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-b">
          <div className="flex items-center gap-3">
            <div className="size-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-primary font-semibold text-sm">{userName.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              <div className="mt-1"><RoleBadge /></div>
            </div>
          </div>
          <button onClick={onLogout}
            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all border border-destructive/15 hover:border-destructive/30">
            <LogOut className="size-3.5 shrink-0" />
            {t("nav.logout")}
          </button>
          <div className="mt-2">
            <LanguageSelector />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNav.map(({ key, labelKey, icon: Icon }) => {
            const isActive = activePage === key;
            return (
              <button key={key} onClick={() => navigate(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <Icon className="size-4 shrink-0" />
                <span className="flex-1 text-left">{t(labelKey as any)}</span>
                {isActive && <ChevronRight className="size-3 opacity-70" />}
              </button>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
