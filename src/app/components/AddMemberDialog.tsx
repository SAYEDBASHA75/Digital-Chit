import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  Search, UserPlus, CheckCircle2, AlertCircle, Loader2,
  Shield, User, Mail, Phone,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";
import { useLanguage } from "../contexts/LanguageContext";

type Role = "admin" | "member";

interface FoundUser {
  userId: string;
  name: string;
  email: string;
  phone?: string;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
  accessToken: string;
  onMemberAdded: (member: any) => void;
}

export function AddMemberDialog({
  open, onOpenChange, groupId, groupName, accessToken, onMemberAdded,
}: AddMemberDialogProps) {
  const { t } = useLanguage();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchError, setSearchError] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setQuery("");
    setFoundUser(null);
    setSearchError("");
    setRole("member");
    setAdding(false);
    setAddError("");
    setSuccess(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setFoundUser(null);
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/users/search?q=${encodeURIComponent(query.trim())}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) { setSearchError(data.error || "Search failed"); return; }
      if (!data.users || data.users.length === 0) {
        setSearchError("No registered user found with that email or phone. They need to sign up first.");
        return;
      }
      setFoundUser(data.users[0]);
    } catch {
      setSearchError("Network error. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!foundUser) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/groups/${groupId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            targetUserId: foundUser.userId,
            name: foundUser.name,
            email: foundUser.email,
            phone: foundUser.phone,
            role,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || "Failed to add member"); return; }
      setSuccess(true);
      onMemberAdded(data.member);
      setTimeout(() => { onOpenChange(false); reset(); }, 1800);
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    if (adding) return;
    onOpenChange(false);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            {t("member.addMember")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{groupName}</p>
        </DialogHeader>

        {success ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center">
            <div className="size-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="size-9 text-green-600" />
            </div>
            <p className="font-bold text-green-700 text-lg">{t("member.added")}</p>
            <p className="text-sm text-muted-foreground">
              <strong>{foundUser?.name}</strong> has been added as <strong>{role}</strong>.
            </p>
          </div>
        ) : (
          <div className="py-2 space-y-5">
            {/* Search */}
            <div>
              <label className="text-sm font-semibold mb-2 block">{t("member.searchUser")}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setFoundUser(null); setSearchError(""); }}
                    placeholder={t("member.searchPlaceholder")}
                    className="pl-9"
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    disabled={searching || adding}
                  />
                </div>
                <Button onClick={handleSearch} disabled={!query.trim() || searching || adding} variant="outline">
                  {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Enter the email address or phone number of a registered user.
              </p>
            </div>

            {/* Search error */}
            {searchError && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-700">{searchError}</p>
              </div>
            )}

            {/* Found user card */}
            {foundUser && (
              <>
                <div className="p-4 border-2 border-primary/30 bg-primary/5 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                      <span className="font-bold text-primary text-base">
                        {foundUser.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{foundUser.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="size-3" />
                        <span className="truncate">{foundUser.email}</span>
                      </div>
                      {foundUser.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="size-3" />
                          <span>{foundUser.phone}</span>
                        </div>
                      )}
                    </div>
                    <CheckCircle2 className="size-5 text-green-500 shrink-0 ml-auto" />
                  </div>
                </div>

                {/* Role selector */}
                <div>
                  <label className="text-sm font-semibold mb-2.5 block">{t("member.role")}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["member", "admin"] as Role[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                          ${role === r
                            ? "border-primary bg-primary/8 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                          }`}
                      >
                        <div className={`size-10 rounded-full flex items-center justify-center
                          ${role === r ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {r === "admin"
                            ? <Shield className="size-5" />
                            : <User className="size-5" />
                          }
                        </div>
                        <div className="text-center">
                          <p className={`text-sm font-semibold ${role === r ? "text-primary" : ""}`}>
                            {r === "admin" ? t("member.admin") : t("member.member")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {r === "admin"
                              ? "Can add/remove members"
                              : "Standard participant"
                            }
                          </p>
                        </div>
                        {role === r && (
                          <CheckCircle2 className="size-4 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role badge preview */}
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg text-sm">
                  <span className="text-muted-foreground">Adding</span>
                  <strong>{foundUser.name}</strong>
                  <span className="text-muted-foreground">as</span>
                  <Badge variant={role === "admin" ? "default" : "secondary"}>
                    {role === "admin" ? t("member.admin") : t("member.member")}
                  </Badge>
                </div>
              </>
            )}

            {/* Add error */}
            {addError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <AlertCircle className="size-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">{addError}</p>
              </div>
            )}
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={adding}>{t("common.cancel")}</Button>
            <Button onClick={handleAdd} disabled={!foundUser || adding}>
              {adding
                ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Adding...</>
                : <><UserPlus className="size-4 mr-1.5" /> {t("member.addMember")}</>}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
