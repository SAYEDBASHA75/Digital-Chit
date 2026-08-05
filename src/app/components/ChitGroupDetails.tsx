import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  ArrowLeft, IndianRupee, TrendingDown, CheckCircle2, XCircle,
  Gavel, RefreshCw, Trophy, AlertCircle, Clock, Users,
  TrendingUp, Loader2, PartyPopper, UserPlus, Shield, User,
  Trash2, AlertTriangle, X, CreditCard, Copy, Check,
  FileText, Hash, CheckSquare, XSquare, Wifi, PiggyBank, Star as Sparkles,
  Banknote, ChevronUp, ChevronDown,
  Send,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "./ui/dialog";
import { projectId } from "/utils/supabase/info";
import { AddMemberDialog } from "./AddMemberDialog";
import { GroupAlerts } from "./GroupAlerts";
import { MemberDocuments } from "./MemberDocuments";
import { AdminPaymentCollection } from "./AdminPaymentCollection";
import { useLanguage } from "../contexts/LanguageContext";
import type { UserRole } from "./LoginPage";
import { Bell } from "lucide-react";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf`;

interface Bid {
  id: string; groupId: string; userId: string;
  bidAmount: number; month: number; bidDate: string;
  status: "pending" | "won" | "lost"; winnerName?: string; dividendPerMember?: number;
}
interface Member {
  id: string; name: string; email: string; joinedDate: string;
  contributionsPaid: number; totalContributions: number;
  hasWonBid: boolean; wonMonth?: number; role: "admin" | "member"; userId?: string;
}
interface Contribution {
  id: string; month: number; memberId: string; memberName: string;
  amount: number; dueDate: string; paidDate?: string; status: "paid" | "pending" | "overdue";
}
interface WinnerAnnouncement {
  month: number; groupId: string; groupName: string;
  winnerUserId: string; winnerName: string;
  bidAmount: number; dividend: number;
  announcedAt: string; announcedBy: string;
  amountSent?: number; sentTo?: string; paymentNote?: string;
  rebatePool?: number; rebatePerMember?: number;
  paymentRecordedAt?: string; paymentRecordedBy?: string;
}
interface UtrRecord {
  userId: string; groupId: string; memberName: string; memberEmail: string;
  utrNumber: string; month: number; amount: number;
  status: "pending" | "verified" | "rejected";
  submittedAt: string; verifiedAt?: string; note?: string;
}

interface ChitGroupDetailsProps {
  group: {
    id: string; name: string; totalAmount: number; monthlyContribution: number;
    duration: number; currentMonth: number; totalMembers: number; status: string;
    nextBidDate: string; createdBy?: string; organizerUpiId?: string; organizerName?: string;
  };
  accessToken: string; userId: string; userRole: UserRole;
  onBack: () => void;
  onPayNow?: (group: ChitGroupDetailsProps["group"]) => void;
  onGroupDeleted?: (groupId: string) => void;
}

export function ChitGroupDetails({
  group, accessToken, userId, userRole, onBack, onPayNow, onGroupDeleted,
}: ChitGroupDetailsProps) {
  const { t } = useLanguage();
  const auth = { Authorization: `Bearer ${accessToken}` };

  // ── Bid state ──
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidsError, setBidsError] = useState("");
  const [livePulse, setLivePulse] = useState(false);

  // ── Resolve / winner announcement ──
  const [resolving, setResolving] = useState(false);
  const [resolveResult, setResolveResult] = useState<{ winner: Bid; dividend: number; winnerName: string } | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [winnerAnnouncement, setWinnerAnnouncement] = useState<WinnerAnnouncement | null>(null);

  // ── Payment recording (admin records money sent to winner) ──
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmountSent, setPayAmountSent] = useState("");
  const [paySentTo, setPaySentTo] = useState("");
  const [payNote, setPayNote] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showMemberBreakdown, setShowMemberBreakdown] = useState(true);

  // ── Members state ──
  const [showAddMember, setShowAddMember] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membersError, setMembersError] = useState("");

  // ── Winners history ──
  const [winnersHistory, setWinnersHistory] = useState<WinnerAnnouncement[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);

  // ── Contributions ──
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loadingContributions, setLoadingContributions] = useState(false);
  const [contributionsError, setContributionsError] = useState("");

  // ── Delete request ──
  const [deleteRequest, setDeleteRequest] = useState<any>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [approvingDelete, setApprovingDelete] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [groupDeleted, setGroupDeleted] = useState(false);

  // ── Payment collection ──
  const [showPaymentCollection, setShowPaymentCollection] = useState(false);

  // ── UTR state ──
  const [utrs, setUtrs] = useState<UtrRecord[]>([]);
  const [loadingUtrs, setLoadingUtrs] = useState(false);
  const [utrInput, setUtrInput] = useState("");
  const [utrSubmitting, setUtrSubmitting] = useState(false);
  const [utrError, setUtrError] = useState("");
  const [utrSuccess, setUtrSuccess] = useState(false);
  const [verifyingUtr, setVerifyingUtr] = useState<string | null>(null);
  const [utrNotes, setUtrNotes] = useState<Record<string, string>>({});

  // ── Derived ──
  const myMemberRecord = members.find((m: any) => (m.userId || m.id) === userId);
  const isAdminOfGroup = myMemberRecord ? myMemberRecord.role === "admin" : group.createdBy === userId;
  const canAdminGroup = userRole === "admin" && isAdminOfGroup;
  const currentMonthBids = bids.filter((b) => b.month === group.currentMonth);
  const myBidThisMonth = currentMonthBids.find((b) => b.userId === userId);
  const wonBids = bids.filter((b) => b.status === "won");
  const pendingBids = currentMonthBids.filter((b) => b.status === "pending");
  const minBid = Math.floor(group.totalAmount * 0.5);
  const myApprovedDelete = deleteRequest?.approvals?.includes(userId);
  const myUtrThisMonth = utrs.find((u) => u.userId === userId && u.month === group.currentMonth);

  // ── Fetchers ──
  const fetchBids = async (silent = false) => {
    if (!silent) setLoadingBids(true);
    setBidsError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/bids`, { headers: auth });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setBidsError(d.error || "Failed to load bids"); return; }
      const data = await res.json();
      setBids(data.bids || []);
      if (!silent) { setLivePulse(true); setTimeout(() => setLivePulse(false), 600); }
    } catch { setBidsError("Network error loading bids"); }
    finally { if (!silent) setLoadingBids(false); }
  };

  const fetchWinner = async () => {
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/winner?month=${group.currentMonth}`, { headers: auth });
      if (res.ok) { const d = await res.json(); setWinnerAnnouncement(d.announcement || null); }
    } catch { /* ignore */ }
  };

  const fetchMembers = async () => {
    setLoadingMembers(true); setMembersError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/members`, { headers: auth });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setMembersError(d.error || "Failed"); return; }
      setMembers((await res.json()).members || []);
    } catch { setMembersError("Network error"); }
    finally { setLoadingMembers(false); }
  };

  const fetchWinnersHistory = async () => {
    setLoadingWinners(true);
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/winners`, { headers: auth });
      if (res.ok) { const d = await res.json(); setWinnersHistory(d.winners || []); }
    } catch { /* ignore */ }
    finally { setLoadingWinners(false); }
  };

  const fetchContributions = async () => {
    setLoadingContributions(true); setContributionsError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/contributions`, { headers: auth });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setContributionsError(d.error || "Failed"); return; }
      setContributions((await res.json()).contributions || []);
    } catch { setContributionsError("Network error"); }
    finally { setLoadingContributions(false); }
  };

  const fetchDeleteRequest = async () => {
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/delete-request`, { headers: auth });
      if (res.ok) { const d = await res.json(); setDeleteRequest(d.deleteRequest); }
    } catch { /* ignore */ }
  };

  const fetchUtrs = async () => {
    setLoadingUtrs(true);
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/utr`, { headers: auth });
      if (res.ok) { const d = await res.json(); setUtrs(d.utrs || []); }
    } catch { /* ignore */ }
    finally { setLoadingUtrs(false); }
  };

  // Initial load + live-poll bids every 12s
  useEffect(() => { fetchBids(); fetchWinner(); fetchWinnersHistory(); fetchMembers(); fetchContributions(); fetchDeleteRequest(); fetchUtrs(); }, [group.id]);
  const pollRef = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    if (group.status !== "active") return;
    pollRef.current = setInterval(() => fetchBids(true), 12000);
    return () => clearInterval(pollRef.current);
  }, [group.id, group.status]);

  // ── Actions ──
  const handlePlaceBid = async () => {
    const amount = parseInt(bidAmount);
    if (!amount || amount <= 0) { setBidError("Enter a valid bid amount"); return; }
    if (amount < minBid) { setBidError(`Minimum bid is ₹${minBid.toLocaleString()} (50% of pool)`); return; }
    if (amount > group.totalAmount) { setBidError(`Maximum bid is ₹${group.totalAmount.toLocaleString()}`); return; }
    setSubmitting(true); setBidError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/bids`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ bidAmount: amount, month: group.currentMonth }),
      });
      const data = await res.json();
      if (!res.ok) { setBidError(data.error || "Failed to place bid"); return; }
      setBids((prev) => [...prev, data.bid]);
      setBidSuccess(true); setBidAmount("");
      setTimeout(() => { setShowBidDialog(false); setBidSuccess(false); }, 2000);
    } catch { setBidError("Network error. Check your connection."); }
    finally { setSubmitting(false); }
  };

  const handleResolveAuction = async () => {
    setResolving(true);
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/bids/resolve`, { method: "POST", headers: auth });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to resolve auction"); return; }
      setResolveResult({ winner: data.winner, dividend: data.dividend, winnerName: data.winnerName || data.winner?.winnerName || "Winner" });
      setWinnerAnnouncement(data.announcement || null);
      await fetchBids();
      setShowResolveDialog(false);
    } catch { alert("Network error resolving auction"); }
    finally { setResolving(false); }
  };

  const handleSubmitUtr = async () => {
    if (!utrInput.trim()) { setUtrError("Enter a valid UTR number"); return; }
    setUtrSubmitting(true); setUtrError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/utr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ utrNumber: utrInput.trim(), month: group.currentMonth, amount: group.monthlyContribution }),
      });
      const data = await res.json();
      if (!res.ok) { setUtrError(data.error || "Failed to submit UTR"); return; }
      setUtrSuccess(true); setUtrInput(""); await fetchUtrs();
      setTimeout(() => setUtrSuccess(false), 3000);
    } catch { setUtrError("Network error"); }
    finally { setUtrSubmitting(false); }
  };

  const handleVerifyUtr = async (utr: UtrRecord, status: "verified" | "rejected") => {
    setVerifyingUtr(`${utr.userId}-${status}`);
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/utr/${utr.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ status, note: utrNotes[utr.userId] || "", month: utr.month }),
      });
      if (res.ok) { await fetchUtrs(); await fetchMembers(); }
    } catch { /* ignore */ }
    finally { setVerifyingUtr(null); }
  };

  const handleRecordPayment = async () => {
    const amt = parseInt(payAmountSent);
    if (!amt || amt <= 0) { setPaymentError("Enter a valid amount"); return; }
    if (!paySentTo.trim()) { setPaymentError("Enter the phone / UPI / account number"); return; }
    setRecordingPayment(true); setPaymentError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/winner/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ amountSent: amt, sentTo: paySentTo.trim(), paymentNote: payNote.trim(), month: group.currentMonth }),
      });
      const data = await res.json();
      if (!res.ok) { setPaymentError(data.error || "Failed to record payment"); return; }
      setWinnerAnnouncement(data.announcement);
      setShowPaymentForm(false);
      setPayAmountSent(""); setPaySentTo(""); setPayNote("");
      setShowMemberBreakdown(true);
    } catch { setPaymentError("Network error"); }
    finally { setRecordingPayment(false); }
  };

  const handleRequestDelete = async () => {
    setDeletingGroup(true); setDeleteError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/delete-request`, { method: "POST", headers: auth });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || "Failed"); return; }
      if (data.deleted) { setGroupDeleted(true); setTimeout(() => onGroupDeleted?.(group.id), 2000); }
      else setDeleteRequest(data.deleteRequest);
      setShowDeleteConfirm(false);
    } catch { setDeleteError("Network error"); }
    finally { setDeletingGroup(false); }
  };

  const handleApproveDelete = async () => {
    setApprovingDelete(true); setDeleteError("");
    try {
      const res = await fetch(`${BASE}/groups/${group.id}/delete-request/approve`, { method: "POST", headers: auth });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error || "Failed"); return; }
      if (data.deleted) { setGroupDeleted(true); setTimeout(() => onGroupDeleted?.(group.id), 2000); }
      else setDeleteRequest(data.deleteRequest);
    } catch { setDeleteError("Network error"); }
    finally { setApprovingDelete(false); }
  };

  const handleCancelDeleteRequest = async () => {
    try {
      await fetch(`${BASE}/groups/${group.id}/delete-request`, { method: "DELETE", headers: auth });
      setDeleteRequest(null); setDeleteError("");
    } catch { setDeleteError("Network error"); }
  };

  // ── Members tab ──
  const renderMembersTab = () => (
    <div className="space-y-4">
      {canAdminGroup && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
          <Button size="sm" onClick={() => setShowAddMember(true)}><UserPlus className="size-4 mr-1.5" />Add Member</Button>
        </div>
      )}
      {loadingMembers ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : membersError ? (
        <p className="text-sm text-destructive text-center py-6">{membersError}</p>
      ) : members.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="size-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No members yet</p>
        </div>
      ) : members.map((member: any) => {
        const mId = member.userId || member.id;
        const isMe = mId === userId;
        return (
          <div key={member.id} className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/40 transition-colors">
            <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="font-semibold text-primary text-sm">{(member.name || "?").charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{member.name || "Unknown"}</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${member.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                  }`}>
                  {member.role === "admin" ? <Shield className="size-3" /> : <User className="size-3" />}
                  {member.role === "admin" ? t("member.admin") : t("member.member")}
                </span>
                {isMe && <span className="text-xs text-muted-foreground">(You)</span>}
                {member.hasWonBid && (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded-full">
                    <Trophy className="size-3" /> Won M{member.wonMonth}
                  </span>
                )}
              </div>
              <div className="mt-0.5 space-y-0.5">
                {member.email && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">Email:</span>
                    {member.email}
                  </p>
                )}
                {member.phone && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60">Phone:</span>
                    <span className="font-mono">{member.phone}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Contributions paid: {member.contributionsPaid || 0}</p>
              </div>
              {(canAdminGroup || member.role === "admin" || isMe) && (
                <div className="mt-1">
                  <MemberDocuments memberId={mId} memberName={member.name || "Member"} memberRole={member.role || "member"}
                    isOwnProfile={isMe} currentUserIsAdmin={canAdminGroup} groupId={group.id} accessToken={accessToken} />
                </div>
              )}
            </div>
            {canAdminGroup && !isMe && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={async () => {
                  const newRole = member.role === "admin" ? "member" : "admin";
                  await fetch(`${BASE}/groups/${group.id}/members/${mId}/role`, {
                    method: "PUT", headers: { "Content-Type": "application/json", ...auth },
                    body: JSON.stringify({ role: newRole }),
                  });
                  fetchMembers();
                }}>
                  {member.role === "admin" ? "→ Member" : "→ Admin"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    if (!confirm(`Remove ${member.name}?`)) return;
                    await fetch(`${BASE}/groups/${group.id}/members/${mId}`, { method: "DELETE", headers: auth });
                    fetchMembers();
                  }}>
                  Remove
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // ── UTR tab ──
  const renderUtrTab = () => {
    const pendingUtrs = utrs.filter(u => u.status === "pending");
    return (
      <div className="space-y-4">
        {/* Member: submit UTR */}
        {!canAdminGroup && (
          <Card className={`border-2 ${myUtrThisMonth ? "border-green-200" : "border-primary/30"}`}>
            <CardContent className="pt-5 pb-5 space-y-4">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-primary" />
                <p className="font-semibold text-sm">Submit Payment UTR — Month {group.currentMonth}</p>
              </div>

              {myUtrThisMonth ? (
                <div className={`p-4 rounded-xl border ${myUtrThisMonth.status === "verified" ? "bg-green-50 border-green-200"
                  : myUtrThisMonth.status === "rejected" ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                  }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {myUtrThisMonth.status === "verified" && <CheckCircle2 className="size-4 text-green-600" />}
                    {myUtrThisMonth.status === "rejected" && <XCircle className="size-4 text-red-600" />}
                    {myUtrThisMonth.status === "pending" && <Clock className="size-4 text-yellow-600" />}
                    <p className="font-semibold text-sm capitalize">{myUtrThisMonth.status === "verified" ? "Payment Verified ✓" : myUtrThisMonth.status === "rejected" ? "Payment Rejected" : "Awaiting Verification"}</p>
                  </div>
                  <p className="text-sm font-mono font-bold">{myUtrThisMonth.utrNumber}</p>
                  <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(myUtrThisMonth.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                  {myUtrThisMonth.note && <p className="text-xs mt-1 text-muted-foreground">Admin note: {myUtrThisMonth.note}</p>}
                </div>
              ) : utrSuccess ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle2 className="size-10 text-green-500" />
                  <p className="font-semibold text-green-700">UTR Submitted!</p>
                  <p className="text-xs text-muted-foreground">Admin will verify your payment shortly.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground block">
                      UTR / Reference Number
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={utrInput}
                        onChange={e => { setUtrInput(e.target.value); setUtrError(""); }}
                        placeholder="e.g. 426123456789"
                        className={`font-mono ${utrError ? "border-destructive" : ""}`}
                        onKeyDown={e => e.key === "Enter" && handleSubmitUtr()}
                      />
                      <Button onClick={handleSubmitUtr} disabled={utrSubmitting || !utrInput.trim()}>
                        {utrSubmitting ? <Loader2 className="size-4 animate-spin" /> : <CheckSquare className="size-4" />}
                      </Button>
                    </div>
                    {utrError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" />{utrError}</p>}
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>How to find UTR:</strong> After paying ₹{group.monthlyContribution.toLocaleString()} via UPI/NEFT/IMPS, check your bank app for the 12-22 digit reference number (UTR/Ref/TxnID).
                    </p>
                  </div>
                </>
              )}

              {myUtrThisMonth && myUtrThisMonth.status !== "verified" && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-medium">Update your UTR number</p>
                  <div className="flex gap-2">
                    <Input value={utrInput} onChange={e => { setUtrInput(e.target.value); setUtrError(""); }}
                      placeholder="New UTR number" className="font-mono text-sm" />
                    <Button size="sm" onClick={handleSubmitUtr} disabled={utrSubmitting || !utrInput.trim()} variant="outline">
                      {utrSubmitting ? <Loader2 className="size-3.5 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Admin: all UTR submissions */}
        {canAdminGroup && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{utrs.length} submission{utrs.length !== 1 ? "s" : ""} — Month {group.currentMonth}</p>
                {pendingUtrs.length > 0 && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
                    {pendingUtrs.length} pending
                  </span>
                )}
              </div>
              <button onClick={fetchUtrs} className="p-1.5 rounded-lg hover:bg-muted">
                <RefreshCw className="size-4 text-muted-foreground" />
              </button>
            </div>

            {loadingUtrs && <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" /></div>}

            {!loadingUtrs && utrs.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
                  <FileText className="size-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">No UTR submissions yet</p>
                  <p className="text-xs mt-1">Members will appear here once they submit their payment reference.</p>
                </CardContent>
              </Card>
            )}

            {utrs.filter(u => u.month === group.currentMonth).map((utr) => (
              <Card key={utr.userId} className={`overflow-hidden ${utr.status === "verified" ? "border-green-200" : utr.status === "rejected" ? "border-red-200" : "border-yellow-200"
                }`}>
                <CardContent className="pt-4 pb-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="size-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="font-bold text-primary text-sm">{(utr.memberName || "?").charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{utr.memberName}</p>
                        <p className="text-xs text-muted-foreground">{utr.memberEmail}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${utr.status === "verified" ? "bg-green-100 text-green-700 border-green-200"
                      : utr.status === "rejected" ? "bg-red-100 text-red-700 border-red-200"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200"
                      }`}>
                      {utr.status === "verified" ? <CheckCircle2 className="size-3" /> : utr.status === "rejected" ? <XCircle className="size-3" /> : <Clock className="size-3" />}
                      {utr.status === "verified" ? "Verified" : utr.status === "rejected" ? "Rejected" : "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">UTR Number</p>
                      <p className="font-mono font-bold text-sm">{utr.utrNumber}</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2.5">
                      <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                      <p className="font-bold">₹{utr.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Submitted: {new Date(utr.submittedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>

                  {utr.status === "pending" && (
                    <div className="space-y-2 pt-1 border-t">
                      <Input
                        value={utrNotes[utr.userId] || ""}
                        onChange={e => setUtrNotes(prev => ({ ...prev, [utr.userId]: e.target.value }))}
                        placeholder="Note (optional)"
                        className="h-8 text-xs"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={verifyingUtr === `${utr.userId}-verified`}
                          onClick={() => handleVerifyUtr(utr, "verified")}>
                          {verifyingUtr === `${utr.userId}-verified` ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckSquare className="size-3.5 mr-1" />}
                          Verify Payment
                        </Button>
                        <Button size="sm" variant="destructive" className="flex-1"
                          disabled={verifyingUtr === `${utr.userId}-rejected`}
                          onClick={() => handleVerifyUtr(utr, "rejected")}>
                          {verifyingUtr === `${utr.userId}-rejected` ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <XSquare className="size-3.5 mr-1" />}
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                  {utr.status !== "pending" && utr.note && (
                    <p className="text-xs text-muted-foreground border-t pt-2">Note: {utr.note}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Group deleted splash ──
  if (groupDeleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center p-6">
        <div className="size-20 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 className="size-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-red-700">Group Deleted</h2>
          <p className="text-muted-foreground mt-1"><strong>{group.name}</strong> has been permanently deleted.</p>
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Redirecting to dashboard...</p>
      </div>
    );
  }

  const utrPendingCount = utrs.filter(u => u.status === "pending" && u.month === group.currentMonth).length;

  return (
    <div className="space-y-4">

      {/* ── DELETE REQUEST BANNER ── */}
      {deleteRequest && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="size-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-red-900">Group Deletion Requested</p>
                  <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-medium">
                    {deleteRequest.approvals?.length || 0} / {deleteRequest.totalMembers} approved
                  </span>
                </div>
                <p className="text-sm text-red-800">
                  <strong>{deleteRequest.requestedByName}</strong> requested to permanently delete this group.{" "}
                  All {deleteRequest.totalMembers} member{deleteRequest.totalMembers !== 1 ? "s" : ""} must approve.
                </p>
                <div className="mt-2 h-1.5 bg-red-200 rounded-full overflow-hidden max-w-xs">
                  <div className="h-full bg-red-500 transition-all rounded-full"
                    style={{ width: `${((deleteRequest.approvals?.length || 0) / deleteRequest.totalMembers) * 100}%` }} />
                </div>
                {deleteError && <p className="text-xs text-red-700 mt-1">{deleteError}</p>}
              </div>
              <div className="flex items-center gap-2 flex-wrap shrink-0">
                {!myApprovedDelete && (
                  <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleApproveDelete} disabled={approvingDelete}>
                    {approvingDelete ? <Loader2 className="size-3 mr-1 animate-spin" /> : <CheckCircle2 className="size-3 mr-1" />}
                    Approve Deletion
                  </Button>
                )}
                {myApprovedDelete && (
                  <span className="text-xs text-red-700 font-medium flex items-center gap-1"><CheckCircle2 className="size-3.5" /> You approved</span>
                )}
                {canAdminGroup && deleteRequest.requestedBy === userId && (
                  <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-100" onClick={handleCancelDeleteRequest}>
                    <X className="size-3 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── BACK HEADER ── */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="size-4" /></Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold truncate">{group.name}</h2>
          <p className="text-muted-foreground text-sm">{t("group.month")} {group.currentMonth} {t("group.of")} {group.duration}</p>
        </div>
        {myMemberRecord && (
          <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${myMemberRecord.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
            }`}>
            {myMemberRecord.role === "admin" ? <Shield className="size-3" /> : <User className="size-3" />}
            {myMemberRecord.role === "admin" ? t("member.admin") : t("member.member")}
          </span>
        )}
        {myMemberRecord?.role === "admin" && <InviteCodeChip groupId={group.id} />}
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: IndianRupee, label: t("detail.totalPool"), value: `₹${group.totalAmount.toLocaleString()}` },
          { icon: TrendingDown, label: t("detail.monthlyContrib"), value: `₹${group.monthlyContribution.toLocaleString()}` },
          { icon: CheckCircle2, label: t("detail.nextBidDate"), value: group.nextBidDate },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg"><Icon className="size-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-semibold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── WINNER ANNOUNCEMENT ── */}
      {(winnerAnnouncement || resolveResult) && (() => {
        const ann = winnerAnnouncement;
        const bidAmt = ann?.bidAmount || resolveResult?.winner?.bidAmount || 0;
        const winnerName = ann?.winnerName || resolveResult?.winnerName || "Winner";
        const winnerUserId = ann?.winnerUserId || resolveResult?.winner?.userId;
        const month = ann?.month || group.currentMonth;

        // Dividend available immediately from resolve; refined after admin records payment
        const hasPayout = !!(ann?.amountSent);
        const amountSent = ann?.amountSent || 0;
        const sentTo = ann?.sentTo || "";
        // Use admin-recorded rebate if available, otherwise use auto-calculated dividend
        const rebatePerMember = hasPayout
          ? (ann?.rebatePerMember ?? 0)
          : (ann?.dividend ?? resolveResult?.dividend ?? Math.round((group.totalAmount - bidAmt) / group.totalMembers));
        const rebatePool = hasPayout
          ? (ann?.rebatePool ?? 0)
          : (group.totalAmount - bidAmt);
        const effectivePay = Math.max(0, group.monthlyContribution - rebatePerMember);

        return (
          <div className="space-y-3">
            <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="pt-5 pb-5 space-y-4">

                {/* ── Winner header ── */}
                <div className="flex items-start gap-4">
                  <div className="size-14 bg-yellow-100 rounded-full flex items-center justify-center shrink-0">
                    <Trophy className="size-8 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-yellow-700 uppercase tracking-widest mb-1">
                      {t("group.month")} {month} — {t("detail.monthWinner")}
                    </p>
                    <p className="text-2xl font-black text-yellow-900 flex items-center gap-2">
                      {winnerName} <PartyPopper className="size-5 text-yellow-500" />
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("detail.winningBid")}: <span className="font-bold text-orange-700">₹{bidAmt.toLocaleString()}</span>
                      {ann?.announcedAt && (
                        <span className="ml-2 text-xs">
                          · {new Date(ann.announcedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* ── Admin payment recorded banner ── */}
                {hasPayout && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <Send className="size-5 text-green-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">{t("detail.adminSent")}</p>
                        <p className="text-xl font-black text-green-800">₹{amountSent.toLocaleString()}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">To</p>
                        <p className="font-mono font-semibold text-sm flex items-center gap-1 justify-end">
                          <Phone className="size-3.5 text-green-600" />{sentTo}
                        </p>
                      </div>
                    </div>
                    {ann?.paymentNote && (
                      <p className="text-xs text-muted-foreground px-1 italic">Note: {ann.paymentNote}</p>
                    )}
                  </div>
                )}

                {/* ── Financial split (always visible) ── */}
                <div className="bg-white rounded-xl border divide-y text-sm">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Banknote className="size-3.5" />{t("detail.totalPool")}
                    </span>
                    <span className="font-semibold">₹{group.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Trophy className="size-3.5 text-yellow-600" />{t("detail.winnerShare")}
                    </span>
                    <span className="font-semibold text-orange-700">
                      − ₹{(hasPayout ? amountSent : bidAmt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 rounded-b-xl">
                    <span className="font-medium text-blue-800 flex items-center gap-1.5">
                      <PiggyBank className="size-3.5 text-blue-600" />
                      Remaining ÷ {group.totalMembers} members
                    </span>
                    <span className="font-bold text-blue-700">₹{rebatePool.toLocaleString()}</span>
                  </div>
                </div>

                {/* ── Per-member rebate highlight (always visible) ── */}
                <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <Sparkles className="size-5 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t("detail.eachRebate")}</p>
                    <p className="text-2xl font-black text-primary">
                      +₹{rebatePerMember.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Net you pay: ₹{group.monthlyContribution.toLocaleString()} − ₹{rebatePerMember.toLocaleString()} ={" "}
                      <span className="font-bold text-foreground">₹{effectivePay.toLocaleString()}</span>
                    </p>
                  </div>
                </div>

                {/* ── Member-by-member breakdown (always visible, auto-expanded) ── */}
                {members.length > 0 && (
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setShowMemberBreakdown((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-muted/60 hover:bg-muted rounded-lg transition-colors text-sm font-medium"
                    >
                      <span className="flex items-center gap-1.5">
                        <Users className="size-4" />
                        {t("detail.memberWise")} ({members.length})
                      </span>
                      {showMemberBreakdown ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>

                    {showMemberBreakdown && (
                      <div className="border rounded-xl overflow-hidden text-sm">
                        {/* Column headers */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] text-xs font-semibold text-muted-foreground bg-muted px-3 py-2 gap-2">
                          <span>{t("group.members")}</span>
                          <span className="text-right w-20">{t("detail.contributes")}</span>
                          <span className="text-right w-20 text-green-700">{t("detail.rebate")}</span>
                          <span className="text-right w-20">{t("detail.netPays")}</span>
                        </div>
                        <div className="divide-y">
                          {members.map((m, i) => {
                            const isWinner = (m.userId || m.id) === winnerUserId;
                            return (
                              <div
                                key={m.id}
                                className={`grid grid-cols-[1fr_auto_auto_auto] px-3 py-2.5 gap-2 items-center ${isWinner ? "bg-yellow-50" : i % 2 === 0 ? "bg-white" : "bg-muted/20"
                                  }`}
                              >
                                {/* Name */}
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className={`size-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${isWinner ? "bg-yellow-300 text-yellow-900" : "bg-primary/10 text-primary"
                                    }`}>
                                    {m.name?.charAt(0)?.toUpperCase() || "?"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate leading-tight">{m.name}</p>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {isWinner && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full">
                                          <Trophy className="size-2.5" />WINNER
                                        </span>
                                      )}
                                      {m.role === "admin" && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                          <Shield className="size-2.5" />Admin
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {/* Contribution */}
                                <span className="text-right w-20 text-muted-foreground tabular-nums">
                                  ₹{group.monthlyContribution.toLocaleString()}
                                </span>
                                {/* Rebate */}
                                <span className="text-right w-20 font-semibold text-green-600 tabular-nums">
                                  +₹{rebatePerMember.toLocaleString()}
                                </span>
                                {/* Net */}
                                <span className={`text-right w-20 font-bold tabular-nums ${isWinner ? "text-yellow-700" : "text-foreground"}`}>
                                  {isWinner ? "—" : `₹${effectivePay.toLocaleString()}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {/* Footer totals */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto] px-3 py-2 gap-2 text-xs font-bold bg-muted border-t">
                          <span>{members.length} members total</span>
                          <span className="text-right w-20">₹{(group.monthlyContribution * members.length).toLocaleString()}</span>
                          <span className="text-right w-20 text-green-600">+₹{(rebatePerMember * members.length).toLocaleString()}</span>
                          <span className="text-right w-20">₹{(effectivePay * (members.length - 1)).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Admin: record payment (only if not yet recorded) ── */}
                {canAdminGroup && !hasPayout && (
                  <div className="border-t pt-3 space-y-2">
                    {!showPaymentForm ? (
                      <Button variant="outline" className="w-full" onClick={() => setShowPaymentForm(true)}>
                        <Send className="size-4 mr-2" />{t("detail.recordPayment")}
                      </Button>
                    ) : (
                      <div className="bg-white border rounded-xl p-4 space-y-3">
                        <p className="font-semibold text-sm flex items-center gap-1.5">
                          <Send className="size-4 text-primary" />Record Payment to {winnerName}
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount Sent (₹)</label>
                            <Input
                              type="number"
                              placeholder={bidAmt.toString()}
                              value={payAmountSent}
                              onChange={(e) => setPayAmountSent(e.target.value)}
                              className="font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone / UPI / Account No.</label>
                            <Input
                              placeholder="e.g. 9876543210"
                              value={paySentTo}
                              onChange={(e) => setPaySentTo(e.target.value)}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optional)</label>
                          <Input
                            placeholder="e.g. Sent via GPay"
                            value={payNote}
                            onChange={(e) => setPayNote(e.target.value)}
                          />
                        </div>
                        {paymentError && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="size-3" />{paymentError}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => { setShowPaymentForm(false); setPaymentError(""); }}>
                            Cancel
                          </Button>
                          <Button size="sm" className="flex-1" onClick={handleRecordPayment} disabled={recordingPayment}>
                            {recordingPayment
                              ? <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Saving…</>
                              : <><CheckCircle2 className="size-3.5 mr-1.5" />Confirm Payment</>}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* ── LIVE BIDDING CARD ── */}
      {group.status === "active" && !winnerAnnouncement && (
        <Card className={`border-2 transition-colors ${myBidThisMonth ? "border-primary/40 bg-primary/5" : "border-primary"}`}>
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${myBidThisMonth ? "bg-primary/20" : "bg-primary/10"}`}>
                  <Gavel className="size-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{t("group.month")} {group.currentMonth} — {t("detail.auctionOpen")}</h3>
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded-full">
                      <Wifi className={`size-2.5 ${livePulse ? "opacity-100" : "opacity-60"}`} /> {t("detail.live")}
                    </span>
                  </div>
                  {myBidThisMonth ? (
                    <div className="mt-1 space-y-0.5">
                      <p className="text-sm text-muted-foreground">{t("detail.yourBid")}: <span className="font-semibold text-primary">₹{myBidThisMonth.bidAmount.toLocaleString()}</span></p>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${myBidThisMonth.status === "won" ? "text-green-700 bg-green-100 border-green-200"
                        : myBidThisMonth.status === "lost" ? "text-muted-foreground bg-muted border-border"
                          : "text-yellow-700 bg-yellow-100 border-yellow-200"
                        }`}>
                        {myBidThisMonth.status === "won" ? <><Trophy className="size-3" /> Won</> : myBidThisMonth.status === "lost" ? <><XCircle className="size-3" /> Outbid</> : <><Clock className="size-3" /> In Progress</>}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">{t("bid.placeBid")} — ₹{group.totalAmount.toLocaleString()}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {loadingBids ? t("common.loading") : `${pendingBids.length} ${t("detail.bidsSubmitted")}`}
                    </span>
                    <button onClick={() => fetchBids()} className="ml-1 text-muted-foreground hover:text-primary">
                      <RefreshCw className="size-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:flex-col sm:items-end flex-wrap">
                {!myBidThisMonth && (
                  <Button onClick={() => { setBidError(""); setBidSuccess(false); setBidAmount(""); setShowBidDialog(true); }} className="shrink-0">
                    <Gavel className="size-4 mr-1.5" /> {t("bid.placeBid")}
                  </Button>
                )}
                {onPayNow && (
                  <Button onClick={() => onPayNow(group)} className="shrink-0 bg-green-600 hover:bg-green-700 text-white">
                    <IndianRupee className="size-4 mr-1.5" /> {t("group.payNow")}
                  </Button>
                )}
                {canAdminGroup && pendingBids.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowResolveDialog(true)}
                    className="shrink-0 border-orange-400 text-orange-700 hover:bg-orange-50">
                    <Trophy className="size-3.5 mr-1.5" /> {t("detail.closeAuction")}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── TABS ── */}
      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="bids">
            {t("bid.liveBids")}
            {pendingBids.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center size-4 bg-primary text-primary-foreground rounded-full text-[10px] font-bold">
                {pendingBids.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="bid-history">{t("bid.bidHistory")}</TabsTrigger>
          <TabsTrigger value="winners" className="flex items-center gap-1">
            <Trophy className="size-3" />{t("detail.winners")}
            {winnersHistory.length > 0 && (
              <span className="ml-1 inline-flex items-center justify-center size-4 bg-yellow-400 text-yellow-900 rounded-full text-[10px] font-bold">
                {winnersHistory.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="utr" className="flex items-center gap-1">
            {t("detail.paymentsUtr")}
            {utrPendingCount > 0 && (
              <span className="ml-1 inline-flex items-center justify-center size-4 bg-yellow-500 text-white rounded-full text-[10px] font-bold">
                {utrPendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="members">{t("group.members")}</TabsTrigger>
          <TabsTrigger value="contributions">{t("detail.contributions")}</TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1">
            <Bell className="size-3" /> {t("detail.alerts")}
          </TabsTrigger>
        </TabsList>

        {/* Live Bids */}
        <TabsContent value="bids" className="space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{t("group.month")} {group.currentMonth} — {t("bid.liveBids")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("detail.autoRefresh")}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchBids()} disabled={loadingBids}>
              <RefreshCw className={`size-3.5 mr-1.5 ${loadingBids ? "animate-spin" : ""}`} /> {t("common.refresh")}
            </Button>
          </div>

          {loadingBids && <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin" /><span className="text-sm">Loading bids...</span></div>}
          {bidsError && !loadingBids && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4 pb-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{bidsError}</p>
              </CardContent>
            </Card>
          )}
          {!loadingBids && !bidsError && pendingBids.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="pt-8 pb-8 text-center">
                <Gavel className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-medium">{t("detail.noBidsMonth")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("detail.beFirst")}</p>
                {!myBidThisMonth && group.status === "active" && !winnerAnnouncement && (
                  <Button className="mt-3" size="sm" onClick={() => { setBidError(""); setShowBidDialog(true); }}>
                    <Gavel className="size-4 mr-1.5" /> {t("detail.placeFirst")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
          {!loadingBids && pendingBids.length > 0 && (
            <div className="space-y-2">
              {/* Admin sees amounts; members only see their own */}
              {pendingBids.map((bid, idx) => {
                const isMe = bid.userId === userId;
                const showAmount = canAdminGroup || isMe;
                return (
                  <div key={bid.id} className={`flex items-center justify-between p-3 border rounded-lg ${isMe ? "border-primary/40 bg-primary/5" : ""}`}>
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${isMe ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{isMe ? t("detail.yourBid") : canAdminGroup ? (members.find(m => (m.userId || m.id) === bid.userId)?.name || `Bid #${idx + 1}`) : `Bid #${idx + 1}`}</p>
                        <p className="text-xs text-muted-foreground">{new Date(bid.bidDate).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {showAmount
                        ? <span className={`font-semibold ${isMe ? "text-primary" : ""}`}>₹{bid.bidAmount.toLocaleString()}</span>
                        : <span className="text-muted-foreground text-sm font-mono">₹ •••••</span>}
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 border border-yellow-200 px-2 py-0.5 rounded-full">
                        <Clock className="size-3" /> Pending
                      </span>
                    </div>
                  </div>
                );
              })}
              {canAdminGroup && (
                <div className="pt-2">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setShowResolveDialog(true)}>
                    <Trophy className="size-4 mr-2" /> {t("detail.closeAuction")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Bid History */}
        <TabsContent value="bid-history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("detail.pastAuctions")}</CardTitle>
              <CardDescription>{wonBids.length} {t("detail.pastAuctions").toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {wonBids.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No completed auctions yet</p>
              ) : (
                <div className="space-y-3">
                  {wonBids.map((bid) => (
                    <div key={bid.id} className="p-4 border rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">Month {bid.month}</p>
                          {bid.winnerName && <p className="text-sm font-bold text-yellow-800 flex items-center gap-1"><Trophy className="size-3.5" /> {bid.winnerName}</p>}
                          <p className="text-xs text-muted-foreground">{new Date(bid.bidDate).toLocaleDateString("en-IN")}</p>
                        </div>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          {bid.userId === userId ? "You won!" : "Resolved"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Winning Bid</p>
                          <p className="font-semibold">₹{bid.bidAmount.toLocaleString()}</p>
                        </div>
                        {bid.dividendPerMember !== undefined && (
                          <div>
                            <p className="text-xs text-muted-foreground">Dividend / Member</p>
                            <p className="font-semibold text-green-600">+₹{bid.dividendPerMember.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Winners History */}
        <TabsContent value="winners" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-yellow-500" />
                <div>
                  <CardTitle>{t("detail.monthlyWinners")}</CardTitle>
                  <CardDescription>{group.name}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingWinners ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="size-5 animate-spin text-primary" />
                </div>
              ) : winnersHistory.length === 0 ? (
                <div className="text-center py-10 space-y-2">
                  <Trophy className="size-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{t("detail.noWinners")}</p>
                  <p className="text-xs text-muted-foreground">{t("detail.beFirst")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {winnersHistory.map((w: any) => (
                    <div key={w.month}
                      className="flex items-start gap-4 p-4 border-2 border-yellow-200 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50">
                      <div className="size-11 bg-yellow-200 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-yellow-900 font-black text-sm">M{w.month}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-bold text-yellow-900 flex items-center gap-1.5">
                            <Trophy className="size-4 text-yellow-600" />
                            {w.winnerName}
                          </p>
                          <span className="text-xs bg-yellow-100 border border-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
                            Month {w.month}
                          </span>
                          {w.month === group.currentMonth && (
                            <span className="text-xs bg-green-100 border border-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Winning Bid</p>
                            <p className="font-bold text-orange-700">₹{w.bidAmount?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Member Rebate</p>
                            <p className="font-bold text-green-700">+₹{(w.rebatePerMember ?? w.dividend ?? 0).toLocaleString()}</p>
                          </div>
                          {w.amountSent && (
                            <div>
                              <p className="text-xs text-muted-foreground">Amount Sent</p>
                              <p className="font-bold text-blue-700">₹{w.amountSent.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        {w.sentTo && (
                          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                            Sent to: <span className="font-mono font-semibold">{w.sentTo}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Announced: {new Date(w.announcedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments & UTR */}
        <TabsContent value="utr" className="mt-4">
          {renderUtrTab()}
        </TabsContent>

        {/* Members */}
        <TabsContent value="members" className="space-y-4 mt-4">
          {renderMembersTab()}
        </TabsContent>

        {/* Contributions */}
        <TabsContent value="contributions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Current Month Contributions</CardTitle>
                  <CardDescription>Month {group.currentMonth} payment status</CardDescription>
                </div>
                {canAdminGroup && (
                  <Button onClick={() => setShowPaymentCollection(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                    <CreditCard className="size-4 mr-1.5" /> Collect Payments
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loadingContributions ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="size-5 animate-spin text-primary" /></div>
              ) : contributions.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-6">No contributions recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {contributions.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{c.memberName}</p>
                        <p className="text-sm text-muted-foreground">Due: {c.dueDate}{c.paidDate && ` · Paid: ${c.paidDate}`}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">₹{c.amount.toLocaleString()}</p>
                        {c.status === "paid" ? <CheckCircle2 className="size-5 text-green-600" /> : <XCircle className="size-5 text-orange-600" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts */}
        <TabsContent value="alerts" className="mt-4">
          <GroupAlerts
            groupId={group.id}
            groupName={group.name}
            accessToken={accessToken}
            isAdmin={canAdminGroup}
            currentMonth={group.currentMonth}
            monthlyContribution={group.monthlyContribution}
          />
        </TabsContent>
      </Tabs>

      {/* ── DANGER ZONE ── */}
      {canAdminGroup && !deleteRequest && (
        <Card className="border-red-200">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="size-9 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="size-4 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">{t("detail.dangerZone")} — {t("detail.deleteGroup")}</p>
                  <p className="text-sm text-red-700 mt-0.5">{t("group.members")}: {group.totalMembers}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => { setShowDeleteConfirm(true); setDeleteError(""); }}>
                <Trash2 className="size-3.5 mr-1.5" /> {t("detail.deleteGroup")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── DIALOGS ── */}

      {/* Place Bid */}
      <Dialog open={showBidDialog} onOpenChange={(o) => { if (!submitting) { setShowBidDialog(o); setBidError(""); setBidSuccess(false); } }}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="size-5 text-primary" /> Place Bid — Month {group.currentMonth}
            </DialogTitle>
            <DialogDescription>Submit the lowest bid to win ₹{group.totalAmount.toLocaleString()}. Bids are hidden until the auction closes.</DialogDescription>
          </DialogHeader>
          {bidSuccess ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <div className="size-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <p className="font-bold text-lg text-green-700">Bid Submitted!</p>
              <p className="text-sm text-muted-foreground">Wait for the admin to close the auction and announce the winner.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Minimum Bid</p>
                    <p className="font-bold text-sm">₹{minBid.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Maximum Bid</p>
                    <p className="font-bold text-sm">₹{group.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Your Bid Amount (₹)</label>
                  <Input type="number"
                    placeholder={`Enter amount (₹${minBid.toLocaleString()} – ₹${group.totalAmount.toLocaleString()})`}
                    value={bidAmount} onChange={(e) => { setBidAmount(e.target.value); setBidError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handlePlaceBid()}
                    className={bidError ? "border-destructive" : ""} />
                  {bidError && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="size-3" /> {bidError}</p>}
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-start gap-2">
                  <TrendingUp className="size-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">The member with the <strong>lowest bid</strong> wins the pool. Others get (pool − winning bid) ÷ members as dividend.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowBidDialog(false)} disabled={submitting}>Cancel</Button>
                <Button onClick={handlePlaceBid} disabled={submitting}>
                  {submitting ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Submitting...</> : <><Gavel className="size-4 mr-1.5" />Submit Bid</>}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Auction */}
      <Dialog open={showResolveDialog} onOpenChange={(o) => { if (!resolving) setShowResolveDialog(o); }}>
        <DialogContent aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-yellow-500" /> Close Auction & Announce Winner
            </DialogTitle>
            <DialogDescription>
              Find the lowest bid for Month {group.currentMonth} and publicly announce the winner. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm font-semibold text-orange-900">{pendingBids.length} bid{pendingBids.length !== 1 ? "s" : ""} will be evaluated</p>
              <p className="text-xs text-orange-700 mt-1">The member with the lowest bid wins ₹{group.totalAmount.toLocaleString()}. The winner's name will be announced to all members.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)} disabled={resolving}>Cancel</Button>
            <Button onClick={handleResolveAuction} disabled={resolving} className="bg-orange-500 hover:bg-orange-600 text-white">
              {resolving ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Resolving...</> : <><Trophy className="size-4 mr-1.5" />Announce Winner</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={(o) => { if (!deletingGroup) setShowDeleteConfirm(o); }}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="size-5 text-red-600" /> Delete Group — Confirmation
            </DialogTitle>
            <DialogDescription>Requires approval from all {group.totalMembers} member{group.totalMembers !== 1 ? "s" : ""}.</DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-semibold text-red-900">{group.name}</p>
              <p className="text-xs text-red-700 mt-1">₹{group.totalAmount.toLocaleString()} pool · {group.totalMembers} members · Month {group.currentMonth}/{group.duration}</p>
            </div>
            {deleteError && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="size-4" /> {deleteError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={deletingGroup}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRequestDelete} disabled={deletingGroup}>
              {deletingGroup ? <><Loader2 className="size-4 mr-1.5 animate-spin" />Sending...</> : <><Trash2 className="size-4 mr-1.5" />Send Deletion Request</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} groupId={group.id} accessToken={accessToken}
        onMemberAdded={() => { fetchMembers(); setShowAddMember(false); }} />

      <AdminPaymentCollection open={showPaymentCollection}
        onClose={() => { setShowPaymentCollection(false); fetchContributions(); }}
        groupId={group.id} groupName={group.name} month={group.currentMonth}
        monthlyContribution={group.monthlyContribution} accessToken={accessToken} />
    </div>
  );
}

function InviteCodeChip({ groupId }: { groupId: string }) {
  const [copied, setCopied] = useState(false);
  const code = groupId.slice(0, 8).toUpperCase();
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  };
  return (
    <button onClick={copy} title="Copy invite code"
      className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors">
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      {code}
    </button>
  );
}
