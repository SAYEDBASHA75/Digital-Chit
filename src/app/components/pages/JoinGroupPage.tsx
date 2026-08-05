import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  UserPlus, Search, Loader2, CheckCircle2, AlertCircle,
  Users, IndianRupee, Calendar, ArrowRight, Clock, XCircle,
  Copy, Check, RefreshCw, Unlock, Lock, TrendingUp,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";
import { toast } from "sonner";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf`;

interface BrowseGroup {
  id: string;
  name: string;
  inviteCode: string;
  totalSlots: number;
  currentMembers: number;
  monthlyContribution: number;
  duration: number;
  currentMonth: number;
  status: string;
  organizerName: string;
  hasVacancy: boolean;
  alreadyMember: boolean;
  requestStatus: "pending" | "accepted" | "rejected" | null;
}

interface GroupPreview {
  id: string; name: string; totalMembers: number; monthlyContribution: number;
  duration: number; currentMonth: number; status: string; organizerName: string;
  inviteCode?: string;
}

interface JoinRequest {
  groupId: string; groupName: string;
  status: "pending" | "accepted" | "rejected"; requestedAt: string;
}

interface JoinGroupPageProps { accessToken: string; onJoined: () => void; }

export function JoinGroupPage({ accessToken, onJoined }: JoinGroupPageProps) {
  const [allGroups, setAllGroups] = useState<BrowseGroup[]>([]);
  const [loadingAll, setLoadingAll] = useState(true);
  const [allError, setAllError] = useState("");

  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [searching, setSearching] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null); // groupId being requested
  const [searchError, setSearchError] = useState("");
  const [requestError, setRequestError] = useState("");
  const [joinRequest, setJoinRequest] = useState<JoinRequest | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "full">("open");

  const auth = { Authorization: `Bearer ${accessToken}` };

  const fetchAllGroups = async () => {
    setLoadingAll(true);
    setAllError("");
    try {
      const res = await fetch(`${BASE}/groups/browse`, { headers: auth });
      const data = await res.json();
      if (!res.ok) { setAllError(data.error || "Failed to load groups"); return; }
      setAllGroups(data.groups || []);
    } catch {
      setAllError("Network error. Please try again.");
    } finally {
      setLoadingAll(false);
    }
  };

  useEffect(() => { fetchAllGroups(); }, [accessToken]);

  const handleSearch = async () => {
    const trimmed = code.trim();
    if (!trimmed) { setSearchError("Enter an invite code"); return; }
    setSearching(true); setSearchError(""); setPreview(null); setJoinRequest(null); setRequestError("");
    try {
      const res = await fetch(`${BASE}/groups/preview/${encodeURIComponent(trimmed)}`, { headers: auth });
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error || "Group not found"); return; }
      setPreview(data.group);
      if (data.group?.id) {
        const rRes = await fetch(`${BASE}/user/join-request-status/${data.group.id}`, { headers: auth });
        const rData = await rRes.json();
        if (rData.request) setJoinRequest(rData.request);
      }
    } catch { setSearchError("Network error. Please try again."); }
    finally { setSearching(false); }
  };

  const handleRequest = async (groupId: string, inviteCode: string, groupName: string) => {
    setRequesting(groupId);
    setRequestError("");
    try {
      const res = await fetch(`${BASE}/groups/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) { setRequestError(data.error || "Failed to send request"); return; }
      toast.success(`Join request sent to "${groupName}"!`);
      if (data.request?.status === "accepted") {
        onJoined();
      } else {
        fetchAllGroups();
        if (preview?.id === groupId) {
          setJoinRequest(data.request);
        }
      }
    } catch { setRequestError("Network error. Please try again."); }
    finally { setRequesting(null); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const statusCfg = {
    pending:  { label: "Request Pending",   color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock,        note: "Awaiting admin approval." },
    accepted: { label: "Request Accepted!", color: "text-green-700",  bg: "bg-green-50 border-green-200",  icon: CheckCircle2, note: "You're now a member! Check Dashboard." },
    rejected: { label: "Request Rejected",  color: "text-red-700",    bg: "bg-red-50 border-red-200",      icon: XCircle,      note: "Contact the admin for details." },
  } as const;

  const reqCfg = joinRequest ? statusCfg[joinRequest.status] : null;

  const filtered = allGroups.filter((g) => {
    if (filter === "open") return g.hasVacancy && !g.alreadyMember && g.requestStatus !== "accepted";
    if (filter === "full") return !g.hasVacancy;
    return true;
  });

  const openCount = allGroups.filter((g) => g.hasVacancy && !g.alreadyMember).length;
  const fullCount = allGroups.filter((g) => !g.hasVacancy).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserPlus className="size-6 text-primary" /> Join a Chit Group
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Browse all available groups below or search directly by invite code.
        </p>
      </div>

      {/* Search by code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="size-4 text-primary" /> Search by Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setSearchError(""); setPreview(null); setJoinRequest(null); }}
              placeholder="e.g. A1B2C3D4"
              className={`font-mono text-lg tracking-widest uppercase ${searchError ? "border-destructive" : ""}`}
              maxLength={36}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching || !code.trim()}>
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          </div>
          {searchError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" /> {searchError}
            </p>
          )}

          {/* Request status banner */}
          {joinRequest && reqCfg && (
            <div className={`flex items-start gap-3 p-3 rounded-xl border ${reqCfg.bg}`}>
              <reqCfg.icon className={`size-5 shrink-0 mt-0.5 ${reqCfg.color}`} />
              <div>
                <p className={`font-semibold text-sm ${reqCfg.color}`}>{reqCfg.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Group: <strong>{joinRequest.groupName}</strong></p>
                <p className={`text-xs mt-1 ${reqCfg.color}`}>{reqCfg.note}</p>
              </div>
            </div>
          )}

          {/* Preview card from search */}
          {preview && !joinRequest && (
            <div className="border border-primary/30 rounded-xl p-4 bg-primary/5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Group Found</p>
                  <h3 className="font-bold text-lg">{preview.name}</h3>
                  {preview.organizerName && <p className="text-xs text-muted-foreground">by {preview.organizerName}</p>}
                </div>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                  preview.status === "active" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                }`}>{preview.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="font-bold">₹{preview.monthlyContribution.toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">Slots</p>
                  <p className="font-bold">{preview.totalMembers}</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-bold">{preview.duration}mo</p>
                </div>
              </div>
              {requestError && (
                <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" /> {requestError}</p>
              )}
              <Button
                className="w-full"
                onClick={() => handleRequest(preview.id, code.trim(), preview.name)}
                disabled={requesting === preview.id}
              >
                {requesting === preview.id
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Sending…</>
                  : <><UserPlus className="size-4 mr-2" />Request to Join<ArrowRight className="size-4 ml-auto" /></>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All groups browser */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="size-5 text-primary" /> All Chit Groups
            {!loadingAll && <span className="text-sm font-normal text-muted-foreground">({allGroups.length} total)</span>}
          </h2>
          <Button variant="outline" size="sm" onClick={fetchAllGroups} disabled={loadingAll}>
            <RefreshCw className={`size-3.5 mr-1.5 ${loadingAll ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filter tabs */}
        {!loadingAll && !allError && allGroups.length > 0 && (
          <div className="flex items-center gap-1.5">
            {([
              { key: "open", label: "Open", count: openCount, icon: Unlock },
              { key: "all", label: "All", count: allGroups.length, icon: Users },
              { key: "full", label: "Full", count: fullCount, icon: Lock },
            ] as const).map(({ key, label, count, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                  filter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-3" />
                {label}
                <span className={`inline-flex items-center justify-center size-4 rounded-full text-[10px] font-bold ${filter === key ? "bg-primary-foreground/20" : "bg-muted"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loadingAll && (
          <div className="flex flex-col items-center py-16 gap-3">
            <RefreshCw className="size-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading available groups…</p>
          </div>
        )}

        {/* Error */}
        {!loadingAll && allError && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-8 text-center space-y-3">
              <AlertCircle className="size-6 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{allError}</p>
              <Button variant="outline" size="sm" onClick={fetchAllGroups}>
                <RefreshCw className="size-3.5 mr-1.5" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty */}
        {!loadingAll && !allError && filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="size-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-muted-foreground">
                {filter === "open" ? "No groups with vacancies right now" : "No groups found"}
              </p>
              {filter !== "all" && (
                <Button variant="link" size="sm" className="mt-1" onClick={() => setFilter("all")}>View all groups</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Group cards */}
        {!loadingAll && !allError && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((group) => {
              const vacancyLeft = group.totalSlots - group.currentMembers;
              const fillPct = Math.round((group.currentMembers / group.totalSlots) * 100);
              const isRequesting = requesting === group.id;
              const reqSt = group.requestStatus;

              return (
                <Card
                  key={group.id}
                  className={`flex flex-col transition-shadow hover:shadow-md ${
                    group.alreadyMember || reqSt === "accepted"
                      ? "border-emerald-300 bg-emerald-50/30"
                      : !group.hasVacancy
                      ? "opacity-70"
                      : "border-primary/20"
                  }`}
                >
                  <CardContent className="pt-4 pb-4 flex flex-col gap-3">
                    {/* Name + status row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base truncate">{group.name}</h3>
                        {group.organizerName && (
                          <p className="text-xs text-muted-foreground mt-0.5">by {group.organizerName}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {group.alreadyMember || reqSt === "accepted" ? (
                          <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 text-[10px]">
                            <CheckCircle2 className="size-2.5 mr-0.5" />Member
                          </Badge>
                        ) : reqSt === "pending" ? (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50 text-[10px]">
                            <Clock className="size-2.5 mr-0.5" />Pending
                          </Badge>
                        ) : reqSt === "rejected" ? (
                          <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50 text-[10px]">
                            <XCircle className="size-2.5 mr-0.5" />Rejected
                          </Badge>
                        ) : group.hasVacancy ? (
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 text-[10px]">
                            <Unlock className="size-2.5 mr-0.5" />Open
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">
                            <Lock className="size-2.5 mr-0.5" />Full
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Invite code */}
                    <div className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
                      <span className="text-xs text-muted-foreground font-medium">Code:</span>
                      <span className="font-mono font-bold text-sm tracking-widest flex-1">{group.inviteCode}</span>
                      <button
                        onClick={() => copyCode(group.inviteCode)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        title="Copy invite code"
                      >
                        {copiedCode === group.inviteCode
                          ? <Check className="size-3.5 text-green-600" />
                          : <Copy className="size-3.5" />}
                      </button>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg py-2 px-1">
                        <div className="flex items-center justify-center gap-0.5 text-muted-foreground mb-0.5">
                          <IndianRupee className="size-3" />
                          <span className="text-[10px]">Monthly</span>
                        </div>
                        <p className="font-bold text-sm">₹{group.monthlyContribution.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-2 px-1">
                        <div className="flex items-center justify-center gap-0.5 text-muted-foreground mb-0.5">
                          <Calendar className="size-3" />
                          <span className="text-[10px]">Duration</span>
                        </div>
                        <p className="font-bold text-sm">{group.duration}mo</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg py-2 px-1">
                        <div className="flex items-center justify-center gap-0.5 text-muted-foreground mb-0.5">
                          <TrendingUp className="size-3" />
                          <span className="text-[10px]">Pool</span>
                        </div>
                        <p className="font-bold text-sm">₹{(group.totalSlots * group.monthlyContribution).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Members fill bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="size-3" />
                          Members
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold">{group.currentMembers}</span>
                          <span className="text-muted-foreground">/ {group.totalSlots}</span>
                          {group.hasVacancy ? (
                            <span className="text-green-600 font-medium">· {vacancyLeft} seat{vacancyLeft !== 1 ? "s" : ""} open</span>
                          ) : (
                            <span className="text-red-500 font-medium">· No vacancy</span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            fillPct >= 100 ? "bg-red-400" : fillPct >= 80 ? "bg-amber-400" : "bg-green-500"
                          }`}
                          style={{ width: `${Math.min(100, fillPct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action button */}
                    {group.alreadyMember || reqSt === "accepted" ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        <CheckCircle2 className="size-3.5" />
                        You're already a member of this group
                      </div>
                    ) : reqSt === "pending" ? (
                      <div className="flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                        <Clock className="size-3.5" />
                        Join request sent — awaiting admin approval
                      </div>
                    ) : reqSt === "rejected" ? (
                      <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <XCircle className="size-3.5" />
                        Request was rejected — contact the admin
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        size="sm"
                        disabled={!group.hasVacancy || isRequesting}
                        onClick={() => handleRequest(group.id, group.inviteCode, group.name)}
                        variant={group.hasVacancy ? "default" : "outline"}
                      >
                        {isRequesting
                          ? <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Sending…</>
                          : group.hasVacancy
                          ? <><UserPlus className="size-3.5 mr-1.5" />Request to Join</>
                          : <><Lock className="size-3.5 mr-1.5" />Group is Full</>}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
