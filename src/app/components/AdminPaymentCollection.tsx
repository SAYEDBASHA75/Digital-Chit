import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  CheckCircle2, XCircle, Clock, Hash, IndianRupee, AlertCircle,
  Users, Calendar, Loader2, Search, Filter, CheckCheck,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";

interface MemberPayment {
  memberId: string;
  memberName: string;
  amount: number;
  status: "pending" | "paid" | "verified";
  utrNumber?: string;
  paidDate?: string;
  contributionId?: string;
}

interface AdminPaymentCollectionProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  month: number;
  monthlyContribution: number;
  accessToken: string;
}

export function AdminPaymentCollection({
  open, onClose, groupId, groupName, month, monthlyContribution, accessToken,
}: AdminPaymentCollectionProps) {
  const [members, setMembers] = useState<MemberPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "paid" | "verified">("all");
  const [editingUtr, setEditingUtr] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (open) {
      loadMemberPayments();
    }
  }, [open, groupId, month]);

  const loadMemberPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/admin/group-payments?groupId=${groupId}&month=${month}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load payments");
        setLoading(false);
        return;
      }
      setMembers(data.payments || []);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const handleUpdateUtr = (memberId: string, utr: string) => {
    // Only allow 12 digits
    const cleaned = utr.replace(/\D/g, "").slice(0, 12);
    setEditingUtr(prev => ({ ...prev, [memberId]: cleaned }));
  };

  const handleVerifyPayment = async (memberId: string) => {
    const utr = editingUtr[memberId] || "";
    if (!/^\d{12}$/.test(utr)) {
      setError("UTR must be exactly 12 digits");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/admin/verify-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            groupId,
            memberId,
            month,
            utrNumber: utr,
            amount: monthlyContribution,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to verify payment");
        setSaving(false);
        return;
      }
      // Update local state
      setMembers(prev => prev.map(m =>
        m.memberId === memberId
          ? { ...m, status: "verified", utrNumber: utr, paidDate: new Date().toISOString() }
          : m
      ));
      setSuccess(`Payment verified for ${members.find(m => m.memberId === memberId)?.memberName}`);
      setTimeout(() => setSuccess(""), 2000);
      setEditingUtr(prev => {
        const updated = { ...prev };
        delete updated[memberId];
        return updated;
      });
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  };

  const handleMarkAllPaid = async () => {
    const verifiedMembers = members.filter(m => m.status === "verified");
    if (verifiedMembers.length === 0) {
      setError("No payments verified yet");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/admin/mark-month-complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            groupId,
            month,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to mark payments complete");
        setSaving(false);
        return;
      }
      setSuccess(`Month ${month} payments marked as complete!`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setError("Network error. Please try again.");
    }
    setSaving(false);
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.memberName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || m.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: members.length,
    pending: members.filter(m => m.status === "pending").length,
    paid: members.filter(m => m.status === "paid").length,
    verified: members.filter(m => m.status === "verified").length,
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IndianRupee className="size-5 text-primary" />
            Payment Collection - Month {month}
          </DialogTitle>
          <DialogDescription>
            Collect UTR numbers from all members and mark payments as complete
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Users className="size-3.5" />
              Total
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-yellow-700 dark:text-yellow-400 mb-1">
              <Clock className="size-3.5" />
              Pending
            </div>
            <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pending}</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 mb-1">
              <Hash className="size-3.5" />
              With UTR
            </div>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.paid}</p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 mb-1">
              <CheckCircle2 className="size-3.5" />
              Verified
            </div>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.verified}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "pending", "paid", "verified"] as const).map(status => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="size-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No members found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredMembers.map((member) => {
                const isEditing = editingUtr[member.memberId] !== undefined;
                const currentUtr = isEditing ? editingUtr[member.memberId] : (member.utrNumber || "");
                const isValidUtr = /^\d{12}$/.test(currentUtr);

                return (
                  <div key={member.memberId} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{member.memberName}</p>
                          <Badge
                            variant={
                              member.status === "verified" ? "default" :
                              member.status === "paid" ? "secondary" :
                              "outline"
                            }
                            className={
                              member.status === "verified" ? "bg-green-500" :
                              member.status === "paid" ? "bg-blue-500" :
                              "bg-yellow-500"
                            }
                          >
                            {member.status === "verified" ? (
                              <><CheckCircle2 className="size-3 mr-1" />Verified</>
                            ) : member.status === "paid" ? (
                              <><Hash className="size-3 mr-1" />Has UTR</>
                            ) : (
                              <><Clock className="size-3 mr-1" />Pending</>
                            )}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <IndianRupee className="size-3.5" />
                          ₹{monthlyContribution.toLocaleString("en-IN")}
                          {member.paidDate && (
                            <>
                              <span className="text-muted-foreground/50">•</span>
                              <Calendar className="size-3.5" />
                              {new Date(member.paidDate).toLocaleDateString("en-IN")}
                            </>
                          )}
                        </p>
                      </div>

                      {/* UTR Input */}
                      <div className="flex items-center gap-2">
                        {member.status === "verified" ? (
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <Hash className="size-4 text-green-600 dark:text-green-400" />
                            <code className="text-sm font-mono font-semibold text-green-700 dark:text-green-400">
                              {member.utrNumber}
                            </code>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="12-digit UTR"
                                value={currentUtr}
                                onChange={(e) => handleUpdateUtr(member.memberId, e.target.value)}
                                maxLength={12}
                                className="w-44 pl-10 font-mono"
                              />
                            </div>
                            <Button
                              onClick={() => handleVerifyPayment(member.memberId)}
                              disabled={!isValidUtr || saving}
                              size="sm"
                            >
                              {saving ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertCircle className="size-4" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-lg text-sm">
            <CheckCircle2 className="size-4" />
            {success}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {stats.verified} of {stats.total} payments verified
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Close
            </Button>
            <Button
              onClick={handleMarkAllPaid}
              disabled={stats.verified === 0 || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="size-4 mr-2" />
              )}
              Mark Month Complete ({stats.verified})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
