import { useState, useEffect } from "react";
import { ChitGroupCard } from "../ChitGroupCard";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, RefreshCw, AlertCircle, Wallet, TrendingUp, IndianRupee, Users, LogIn } from "lucide-react";
import { projectId } from "/utils/supabase/info";
import { useLanguage } from "../../contexts/LanguageContext";

interface ChitGroup {
  id: string; name: string; totalAmount: number; monthlyContribution: number;
  duration: number; currentMonth: number; totalMembers: number;
  status: "active" | "upcoming" | "completed"; nextBidDate: string;
  organizerUpiId?: string; organizerName?: string;
}

interface MyChitsPageProps {
  accessToken: string;
  onViewDetails: (id: string) => void;
  onCreateGroup: () => void;
  onSessionExpired: () => void;
  onPayNow?: (group: ChitGroup) => void;
}


export function MyChitsPage({ accessToken, onViewDetails, onCreateGroup, onSessionExpired, onPayNow }: MyChitsPageProps) {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<ChitGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");

  const fetchGroups = async () => {
    setLoading(true); setError("");
    if (!accessToken) { setError("Not logged in."); setLoading(false); return; }
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/groups`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (res.status === 401) { setLoading(false); onSessionExpired(); return; }
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Server error."); setLoading(false); return; }
      const data = await res.json();
      setGroups(data.groups || []);
    } catch { setError("Network error. Check your connection."); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchGroups(); }, [accessToken]);

  const filtered = filter === "all" ? groups : groups.filter((g) => g.status === filter);
  const activeCount = groups.filter((g) => g.status === "active").length;
  const totalInvested = groups.filter((g) => g.status === "active").reduce((s, g) => s + g.monthlyContribution * g.currentMonth, 0);
  const totalMembers = groups.reduce((s, g) => s + g.totalMembers, 0);

  const filterLabel = (f: string) => {
    if (f === "all") return t("common.all");
    if (f === "active") return t("group.status.active");
    if (f === "upcoming") return t("group.status.upcoming");
    if (f === "completed") return t("group.status.completed");
    return f;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("nav.myChits")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("dash.yourGroups")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchGroups} disabled={loading}>
            <RefreshCw className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </Button>
          <Button size="sm" onClick={onCreateGroup}>
            <Plus className="size-4 mr-1.5" />
            {t("nav.createGroup")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {!loading && !error && groups.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: TrendingUp, label: t("group.status.active"), value: activeCount },
            { icon: IndianRupee, label: t("common.invested"), value: `₹${totalInvested.toLocaleString()}` },
            { icon: Users, label: t("group.members"), value: totalMembers },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="size-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center gap-3">
              <AlertCircle className="size-6 text-destructive" />
              <p className="font-semibold text-destructive">{error}</p>
              {error.includes("logged in") || error.includes("session") ? (
                <Button onClick={onSessionExpired} size="sm"><LogIn className="size-4 mr-1.5" /> Login</Button>
              ) : (
                <Button onClick={fetchGroups} size="sm" variant="outline">
                  <RefreshCw className="size-4 mr-1.5" /> {t("common.retry")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!loading && !error && groups.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-10 pb-10">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="size-16 bg-muted rounded-full flex items-center justify-center">
                <Wallet className="size-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{t("dash.noGroups")}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  {t("group.createNew")} — {t("member.addMember").toLowerCase()}
                </p>
              </div>
              <Button onClick={onCreateGroup} className="mt-1">
                <Plus className="size-4 mr-1.5" /> {t("group.createNew")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Groups with filter */}
      {!loading && !error && groups.length > 0 && (
        <>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "active", "upcoming", "completed"] as const).map((f) => {
              const count = f === "all" ? groups.length : groups.filter((g) => g.status === f).length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {filterLabel(f)}
                  <span className={`inline-flex items-center justify-center size-4 rounded-full text-[10px] font-bold ${filter === f ? "bg-primary-foreground/20" : "bg-muted"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">
              {t("common.noData")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((group) => (
                <ChitGroupCard key={group.id} group={group} accessToken={accessToken} onViewDetails={onViewDetails} onPayNow={onPayNow} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
