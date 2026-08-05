import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../ui/dialog";
import {
  UserPlus, Trash2, Shield, User, Search, Loader2,
  RefreshCw, AlertCircle, CheckCircle2, Users, Mail,
  Phone, Lock, Eye, EyeOff, ShieldCheck, Clock, XCircle, Bell,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";

interface Member {
  id: string; userId?: string; name: string; email: string;
  phone?: string; role: "admin" | "member"; joinedDate?: string;
  contributionsPaid?: number; groupId: string; groupName: string;
}
interface Group { id: string; name: string; totalMembers: number; monthlyContribution: number; }
interface JoinRequest {
  userId: string; userName: string; email: string; phone?: string;
  groupId: string; groupName: string;
  status: "pending" | "accepted" | "rejected"; requestedAt: string;
}
interface AdminMembersPageProps { accessToken: string; }

export function AdminMembersPage({ accessToken }: AdminMembersPageProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "requests">("requests");

  // Join requests
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestAction, setRequestAction] = useState<string | null>(null);

  // Add member dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", password: "", role: "member" as "admin" | "member" });
  const [showAddPwd, setShowAddPwd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf`;
  const authHeader = { Authorization: `Bearer ${accessToken}` };

  const fetchJoinRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch(`${BASE}/groups/join-requests`, { headers: authHeader });
      const data = await res.json();
      setJoinRequests(data.requests || []);
    } catch { /* ignore */ }
    finally { setLoadingRequests(false); }
  };

  const handleRequestAction = async (req: JoinRequest, action: "accept" | "reject") => {
    const key = `${req.groupId}:${req.userId}:${action}`;
    setRequestAction(key);
    try {
      await fetch(`${BASE}/groups/${req.groupId}/join-requests/${req.userId}/${action}`, {
        method: "POST", headers: authHeader,
      });
      await fetchJoinRequests();
      if (action === "accept") fetchMembers();
    } catch { /* ignore */ }
    finally { setRequestAction(null); }
  };

  useEffect(() => {
    (async () => {
      setLoadingGroups(true);
      try {
        const res = await fetch(`${BASE}/groups`, { headers: authHeader });
        const data = await res.json();
        const g = data.groups || [];
        setGroups(g);
        if (g.length > 0) setSelectedGroupId(g[0].id);
      } catch { setError("Failed to load groups"); }
      setLoadingGroups(false);
    })();
    fetchJoinRequests();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) return;
    fetchMembers();
  }, [selectedGroupId]);

  const fetchMembers = async () => {
    setLoadingMembers(true);
    setError("");
    try {
      const res = await fetch(`${BASE}/groups/${selectedGroupId}/members`, { headers: authHeader });
      const data = await res.json();
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      setMembers((data.members || []).map((m: any) => ({
        ...m, groupId: selectedGroupId, groupName: selectedGroup?.name || "",
      })));
    } catch { setError("Failed to load members"); }
    setLoadingMembers(false);
  };

  const handleAddMember = async () => {
    setAddError(""); setAddSuccess("");
    if (!addForm.name || !addForm.email || !addForm.phone || !addForm.password) {
      setAddError("All fields are required"); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email)) { setAddError("Enter a valid email"); return; }
    if (!/^[6-9]\d{9}$/.test(addForm.phone)) { setAddError("Enter a valid 10-digit phone number"); return; }
    if (addForm.password.length < 6) { setAddError("Password must be at least 6 characters"); return; }
    setAddLoading(true);
    try {
      const signupRes = await fetch(`${BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: addForm.name, email: addForm.email, phone: addForm.phone, password: addForm.password, role: addForm.role }),
      });
      const signupData = await signupRes.json();
      if (!signupRes.ok) { setAddError(signupData.error || "Failed to create account"); setAddLoading(false); return; }
      const addRes = await fetch(`${BASE}/groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: addForm.name, email: addForm.email, phone: addForm.phone, userId: signupData.user?.id, role: addForm.role }),
      });
      const addData = await addRes.json();
      if (!addRes.ok) { setAddError(addData.error || "Account created but failed to add to group"); setAddLoading(false); return; }
      setAddSuccess(`${addForm.name} added successfully as ${addForm.role}!`);
      setAddForm({ name: "", email: "", phone: "", password: "", role: "member" });
      setTimeout(() => { setShowAdd(false); setAddSuccess(""); fetchMembers(); }, 1500);
    } catch { setAddError("Network error. Please try again."); }
    setAddLoading(false);
  };

  const handleDeleteMember = async (member: Member) => {
    setDeleteLoading(true);
    try {
      const memberId = member.userId || member.id;
      const res = await fetch(`${BASE}/groups/${selectedGroupId}/members/${memberId}`, {
        method: "DELETE", headers: authHeader,
      });
      if (res.ok) {
        setMembers(prev => prev.filter(m => (m.userId || m.id) !== memberId));
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove member");
      }
    } catch { setError("Network error"); }
    setDeleteLoading(false);
    setDeletingId(null);
  };

  const handleRoleChange = async (member: Member, newRole: "admin" | "member") => {
    const memberId = member.userId || member.id;
    try {
      await fetch(`${BASE}/groups/${selectedGroupId}/members/${memberId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ role: newRole }),
      });
      fetchMembers();
    } catch { setError("Failed to update role"); }
  };

  const filtered = members.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );
  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const pendingCount = joinRequests.filter(r => r.status === "pending").length;

  if (loadingGroups) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="size-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">Member Management</h2>
          <p className="text-sm text-muted-foreground">Approve join requests and manage group members</p>
        </div>
        <Button onClick={() => { setShowAdd(true); setAddError(""); setAddSuccess(""); }}>
          <UserPlus className="size-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {([
          { key: "requests" as const, label: "Join Requests", icon: Bell },
          { key: "members"  as const, label: "Members",       icon: Users },
        ]).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="size-4" />
            {label}
            {key === "requests" && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Join Requests Tab ── */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {pendingCount > 0 ? `${pendingCount} pending request${pendingCount !== 1 ? "s" : ""}` : "No pending requests"}
            </p>
            <button onClick={fetchJoinRequests} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className={`size-4 text-muted-foreground ${loadingRequests ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loadingRequests ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          ) : joinRequests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                <Bell className="size-8 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No join requests yet</p>
                <p className="text-xs mt-1">Share your group's 8-character invite code so members can request to join.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {joinRequests.map((req) => {
                const actionKey = `${req.groupId}:${req.userId}`;
                const isActing = requestAction?.startsWith(actionKey);
                return (
                  <Card key={`${req.groupId}:${req.userId}`} className={`overflow-hidden ${
                    req.status === "pending" ? "border-yellow-200" : req.status === "accepted" ? "border-green-200" : ""
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                          {(req.userName || req.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{req.userName || "Unknown"}</p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              req.status === "pending"  ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                              req.status === "accepted" ? "bg-green-100 text-green-700 border-green-200" :
                                                         "bg-red-100 text-red-700 border-red-200"
                            }`}>
                              {req.status === "pending"  ? <Clock className="size-2.5" /> :
                               req.status === "accepted" ? <CheckCircle2 className="size-2.5" /> :
                                                           <XCircle className="size-2.5" />}
                              {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{req.email}</p>
                          {req.phone && <p className="text-xs text-muted-foreground">{req.phone}</p>}
                          <p className="text-xs text-muted-foreground mt-1">
                            Group: <span className="font-medium text-foreground">{req.groupName}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(req.requestedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={!!isActing}
                            onClick={() => handleRequestAction(req, "accept")}>
                            {isActing && requestAction?.endsWith("accept")
                              ? <Loader2 className="size-3.5 animate-spin mr-1" />
                              : <CheckCircle2 className="size-3.5 mr-1" />}
                            Accept
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1"
                            disabled={!!isActing}
                            onClick={() => handleRequestAction(req, "reject")}>
                            {isActing && requestAction?.endsWith("reject")
                              ? <Loader2 className="size-3.5 animate-spin mr-1" />
                              : <XCircle className="size-3.5 mr-1" />}
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Members Tab ── */}
      {activeTab === "members" && (
        <div className="space-y-4">
          {groups.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Users className="size-12 text-muted-foreground/30 mx-auto" />
              <p className="font-semibold">No groups yet</p>
              <p className="text-sm text-muted-foreground">Create a chit group first, then manage its members here.</p>
            </div>
          ) : (
            <>
              {groups.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {groups.map(g => (
                    <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selectedGroupId === g.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}>
                      {g.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedGroup && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Members",   value: members.length },
                    { label: "Admins",          value: members.filter(m => m.role === "admin").length },
                    { label: "Monthly Contrib.", value: `₹${selectedGroup.monthlyContribution?.toLocaleString()}` },
                  ].map(({ label, value }) => (
                    <Card key={label}>
                      <CardContent className="pt-4 pb-3">
                        <p className="text-2xl font-bold">{value}</p>
                        <p className="text-xs text-muted-foreground">{label}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input placeholder="Search by name, email or phone…" value={search}
                    onChange={e => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button variant="outline" size="icon" onClick={fetchMembers} disabled={loadingMembers}>
                  <RefreshCw className={`size-4 ${loadingMembers ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                  <AlertCircle className="size-4 shrink-0" />{error}
                </div>
              )}

              {loadingMembers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Users className="size-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">{search ? "No members match your search" : "No members in this group yet"}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((member) => {
                    const mId = member.userId || member.id;
                    const isDeleting = deletingId === mId;
                    return (
                      <Card key={mId} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`size-11 rounded-full flex items-center justify-center shrink-0 font-bold text-base ${
                              member.role === "admin" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              {(member.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm truncate">{member.name || "Unknown"}</p>
                                <Badge variant={member.role === "admin" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                                  {member.role === "admin"
                                    ? <><Shield className="size-2.5 mr-1" />Admin</>
                                    : <><User className="size-2.5 mr-1" />Member</>}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="size-3" />{member.email}
                              </p>
                              {member.phone && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Phone className="size-3" />{member.phone}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                {member.contributionsPaid !== undefined && (
                                  <p className="text-xs text-muted-foreground">
                                    Paid: <span className="font-medium text-foreground">{member.contributionsPaid}</span>
                                  </p>
                                )}
                                {member.joinedDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Joined: {new Date(member.joinedDate).toLocaleDateString("en-IN")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => handleRoleChange(member, member.role === "admin" ? "member" : "admin")}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-colors">
                                <ShieldCheck className="size-3.5" />
                                {member.role === "admin" ? "→ Member" : "→ Admin"}
                              </button>
                              {isDeleting ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleDeleteMember(member)} disabled={deleteLoading}
                                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold bg-destructive text-white hover:bg-destructive/90 transition-colors">
                                    {deleteLoading ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                                    Confirm
                                  </button>
                                  <button onClick={() => setDeletingId(null)}
                                    className="px-2 py-1.5 rounded-lg text-xs border border-border hover:bg-muted transition-colors">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setDeletingId(mId)}
                                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border">
                                  <Trash2 className="size-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" /> Add New Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-2">Member Role</p>
              <div className="grid grid-cols-2 gap-2">
                {(["admin", "member"] as const).map(r => (
                  <button key={r} type="button" onClick={() => setAddForm(f => ({ ...f, role: r }))}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
                      addForm.role === r ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                    }`}>
                    {r === "admin"
                      ? <Shield className={`size-4 ${addForm.role === r ? "text-primary" : "text-muted-foreground"}`} />
                      : <User className={`size-4 ${addForm.role === r ? "text-primary" : "text-muted-foreground"}`} />}
                    <span className={`text-sm font-medium capitalize ${addForm.role === r ? "text-primary" : "text-muted-foreground"}`}>{r}</span>
                    {addForm.role === r && <CheckCircle2 className="size-4 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: "Full Name",      icon: User,  key: "name",  type: "text",  placeholder: "Member's full name" },
              { label: "Email Address",  icon: Mail,  key: "email", type: "email", placeholder: "member@email.com" },
              { label: "Phone Number",   icon: Phone, key: "phone", type: "tel",   placeholder: "9876543210" },
            ].map(({ label, icon: Icon, key, type, placeholder }) => (
              <div key={key}>
                <label className="text-sm font-medium mb-1.5 block">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input type={type} placeholder={placeholder}
                    value={(addForm as any)[key]}
                    onChange={e => setAddForm(f => ({ ...f, [key]: e.target.value }))}
                    className="pl-9" />
                </div>
              </div>
            ))}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Set Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input type={showAddPwd ? "text" : "password"} placeholder="Min 6 characters"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  className="pl-9 pr-10" />
                <button type="button" onClick={() => setShowAddPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showAddPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Member will use this to login</p>
            </div>
            {addError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20">
                <AlertCircle className="size-4 shrink-0" />{addError}
              </div>
            )}
            {addSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                <CheckCircle2 className="size-4 shrink-0" />{addSuccess}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={addLoading}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={addLoading}>
              {addLoading
                ? <><Loader2 className="size-4 mr-2 animate-spin" />Adding…</>
                : <><UserPlus className="size-4 mr-2" />Add to {selectedGroup?.name}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
