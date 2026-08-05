import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Users, RefreshCw, AlertCircle, Crown, UserCheck, IndianRupee, Trophy } from "lucide-react";
import { projectId } from "/utils/supabase/info";

interface Member {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  role: "admin" | "member";
  joinedDate: string;
  contributionsPaid: number;
  hasWonBid: boolean;
}

interface GroupMembersDialogProps {
  open: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  accessToken: string;
  monthlyContribution: number;
}

export function GroupMembersDialog({
  open, onClose, groupId, groupName, accessToken, monthlyContribution,
}: GroupMembersDialogProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMembers = async () => {
    if (!accessToken || !groupId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/groups/${groupId}/members`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || "Failed to load members");
        return;
      }
      const data = await res.json();
      const list: Member[] = (data.members || []).sort((a: Member, b: Member) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;
        return new Date(a.joinedDate).getTime() - new Date(b.joinedDate).getTime();
      });
      setMembers(list);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchMembers();
  }, [open, groupId]);

  const adminCount = members.filter((m) => m.role === "admin").length;
  const memberCount = members.filter((m) => m.role === "member").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Members — {groupName}
          </DialogTitle>
        </DialogHeader>

        {/* Summary */}
        {!loading && !error && members.length > 0 && (
          <div className="flex items-center gap-3 text-sm px-1">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="size-3.5" />
              <span className="font-medium text-foreground">{members.length}</span> total
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Crown className="size-3.5 text-amber-500" />
              <span className="font-medium text-foreground">{adminCount}</span> admin{adminCount !== 1 ? "s" : ""}
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <UserCheck className="size-3.5 text-blue-500" />
              <span className="font-medium text-foreground">{memberCount}</span> member{memberCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <RefreshCw className="size-6 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading members…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 py-10">
            <AlertCircle className="size-6 text-destructive" />
            <p className="text-sm text-destructive text-center">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchMembers}>
              <RefreshCw className="size-3.5 mr-1.5" /> Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && members.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Users className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No members yet</p>
          </div>
        )}

        {/* Member list */}
        {!loading && !error && members.length > 0 && (
          <div className="overflow-y-auto flex-1 -mx-6 px-6 space-y-2 pb-2">
            {members.map((member, idx) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/40 transition-colors"
              >
                {/* Avatar */}
                <div className={`size-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                  member.role === "admin"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {member.name ? member.name.charAt(0).toUpperCase() : "?"}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{member.name || "Unknown"}</span>
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                      className={`text-[10px] px-1.5 py-0 h-4 ${member.role === "admin" ? "bg-amber-500 hover:bg-amber-500" : ""}`}
                    >
                      {member.role === "admin" ? (
                        <><Crown className="size-2.5 mr-0.5" />Admin</>
                      ) : "Member"}
                    </Badge>
                    {member.hasWonBid && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-emerald-600 border-emerald-300">
                        <Trophy className="size-2.5 mr-0.5" />Won
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground flex-wrap">
                    <span>#{idx + 1}</span>
                    {member.joinedDate && (
                      <>
                        <span>·</span>
                        <span>Joined {new Date(member.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Contributions */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 text-xs font-semibold text-foreground justify-end">
                    <IndianRupee className="size-3" />
                    {(member.contributionsPaid * monthlyContribution).toLocaleString("en-IN")}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {member.contributionsPaid} paid
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-1 border-t">
          <Button variant="outline" size="sm" onClick={fetchMembers} disabled={loading}>
            <RefreshCw className={`size-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
