import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Users, IndianRupee, Calendar, Smartphone, User,
  AlertCircle, CheckCircle2, Loader2, Info, TrendingUp,
  Copy, Check,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface CreateChitGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (groupData: any) => Promise<any>;
}

interface FormErrors {
  name?: string;
  totalMembers?: string;
  monthlyContribution?: string;
  duration?: string;
  startDate?: string;
  organizerUpiId?: string;
}

export function CreateChitGroupDialog({ open, onOpenChange, onSubmit }: CreateChitGroupDialogProps) {
  const { t } = useLanguage();

  const empty = {
    name: "",
    totalMembers: "",
    monthlyContribution: "",
    duration: "",
    startDate: "",
    organizerUpiId: "",
    organizerName: "",
  };

  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [createdGroup, setCreatedGroup] = useState<{ id: string; name: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const n = (v: string) => (v === "" ? 0 : parseInt(v) || 0);

  const members = n(form.totalMembers);
  const contrib = n(form.monthlyContribution);
  const dur = n(form.duration);

  // Monthly pool = all members pay each month → that's the bid amount
  const monthlyPool = members > 0 && contrib > 0 ? members * contrib : 0;
  // Total lifecycle value = monthly pool × duration
  const totalLifecycle = monthlyPool > 0 && dur > 0 ? monthlyPool * dur : 0;

  const set = (field: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError("");
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Group name is required";
    const m = parseInt(form.totalMembers);
    if (!form.totalMembers || isNaN(m) || m < 2) errs.totalMembers = "Minimum 2 members required";
    const c = parseInt(form.monthlyContribution);
    if (!form.monthlyContribution || isNaN(c) || c < 1) errs.monthlyContribution = "Enter a valid amount (min ₹1)";
    const d = parseInt(form.duration);
    if (!form.duration || isNaN(d) || d < 1) errs.duration = "Duration must be at least 1 month";
    if (!form.startDate) errs.startDate = "Start date is required";
    if (form.organizerUpiId && !form.organizerUpiId.includes("@")) {
      errs.organizerUpiId = "Invalid UPI ID format (e.g. name@upi)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");
    try {
      const groupData = {
        name: form.name.trim(),
        totalMembers: parseInt(form.totalMembers),
        monthlyContribution: parseInt(form.monthlyContribution),
        duration: parseInt(form.duration),
        totalAmount: parseInt(form.totalMembers) * parseInt(form.monthlyContribution),
        startDate: form.startDate,
        nextBidDate: form.startDate,
        organizerUpiId: form.organizerUpiId.trim(),
        organizerName: form.organizerName.trim(),
      };
      const group = await onSubmit?.(groupData);
      setForm(empty);
      setErrors({});
      if (group?.id) setCreatedGroup({ id: group.id, name: group.name });
    } catch (err: any) {
      setServerError(err?.message || "Failed to create group. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onOpenChange(false);
    setErrors({});
    setServerError("");
    setCreatedGroup(null);
    setCodeCopied(false);
  };

  const inviteCode = createdGroup ? createdGroup.id.slice(0, 8).toUpperCase() : "";

  const handleCopyCode = async () => {
    try { await navigator.clipboard.writeText(inviteCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2500); }
    catch { /* ignore */ }
  };

  const isReady = form.name.trim() && form.totalMembers && form.monthlyContribution &&
    form.duration && form.startDate && !submitting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">

        {/* ── Success screen: show invite code ── */}
        {createdGroup ? (
          <div className="flex flex-col items-center gap-6 py-6 text-center">
            <div className="relative">
              <div className="size-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="size-10 text-green-600" />
              </div>
              <div className="absolute inset-0 size-20 rounded-full bg-green-400/20 animate-ping" />
            </div>

            <div>
              <h2 className="text-xl font-bold">Group Created!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                <strong>{createdGroup.name}</strong> is ready. Share the invite code below so members can request to join.
              </p>
            </div>

            {/* Invite code display */}
            <div className="w-full bg-primary/5 border-2 border-primary/20 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Invite Code</p>
              <p className="text-4xl font-black tracking-[0.3em] text-primary">{inviteCode}</p>
              <p className="text-xs text-muted-foreground">Members enter this code in "Join a Chit Group"</p>
              <Button onClick={handleCopyCode} variant="outline" className="w-full gap-2">
                {codeCopied ? <><Check className="size-4 text-green-600" /> Copied!</> : <><Copy className="size-4" /> Copy Code</>}
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
        <>
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
            {t("group.createNew")}
            <span className="inline-flex items-center gap-1 text-xs font-normal px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
              <CheckCircle2 className="size-3" /> Admin verified
            </span>
          </DialogTitle>
          <DialogDescription>
            Set up a new chit fund group. Admin permission confirmed from database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* ── Group Name ── */}
          <Field label={`${t("group.name")} *`} error={errors.name}>
            <Input
              placeholder="e.g. Friends Circle Chit, Office Fund"
              value={form.name}
              onChange={set("name")}
              className={errors.name ? "border-destructive" : ""}
              disabled={submitting}
            />
          </Field>

          {/* ── Members + Duration row ── */}
          <div className="grid grid-cols-2 gap-4">
            <Field label={`${t("group.members")} *`} error={errors.totalMembers}>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="2"
                  placeholder="10"
                  value={form.totalMembers}
                  onChange={set("totalMembers")}
                  className={`pl-9 ${errors.totalMembers ? "border-destructive" : ""}`}
                  disabled={submitting}
                />
              </div>
            </Field>

            <Field label={`${t("group.duration")} *`} error={errors.duration}>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  placeholder="12"
                  value={form.duration}
                  onChange={set("duration")}
                  className={`pl-9 ${errors.duration ? "border-destructive" : ""}`}
                  disabled={submitting}
                />
              </div>
            </Field>
          </div>

          {/* ── Monthly Contribution ── */}
          <Field label={`Monthly Contribution per Member (₹) *`} error={errors.monthlyContribution}>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                placeholder="5000"
                value={form.monthlyContribution}
                onChange={set("monthlyContribution")}
                className={`pl-9 text-base font-medium ${errors.monthlyContribution ? "border-destructive" : ""}`}
                disabled={submitting}
              />
            </div>
          </Field>

          {/* ── Pool Breakdown (live calculation) ── */}
          {monthlyPool > 0 && (
            <div className="rounded-xl border-2 border-primary/25 bg-gradient-to-br from-primary/8 to-primary/3 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-1.5">
                <TrendingUp className="size-3.5" /> Pool Breakdown
              </p>

              {/* Monthly pool row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Monthly Bid Pool</p>
                  <p className="text-xs text-muted-foreground">
                    {members} members × ₹{contrib.toLocaleString()} = prize each month
                  </p>
                </div>
                <p className="text-xl font-bold text-primary">₹{monthlyPool.toLocaleString()}</p>
              </div>

              {/* Divider */}
              {dur > 0 && (
                <>
                  <div className="border-t border-primary/20" />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Total Lifecycle Value</p>
                      <p className="text-xs text-muted-foreground">
                        ₹{monthlyPool.toLocaleString()} × {dur} months
                      </p>
                    </div>
                    <p className="text-base font-bold text-muted-foreground">
                      ₹{totalLifecycle.toLocaleString()}
                    </p>
                  </div>
                </>
              )}

              {/* Info note */}
              <div className="flex items-start gap-2 pt-1">
                <Info className="size-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-primary/80">
                  Each month, all members bid for ₹{monthlyPool.toLocaleString()}. The lowest bidder wins.
                  The savings (pool − winning bid) are shared as dividend.
                </p>
              </div>
            </div>
          )}

          {/* ── Start Date ── */}
          <Field label={`${t("group.startDate")} *`} error={errors.startDate}>
            <Input
              type="date"
              value={form.startDate}
              onChange={set("startDate")}
              min={new Date().toISOString().split("T")[0]}
              className={errors.startDate ? "border-destructive" : ""}
              disabled={submitting}
            />
          </Field>

          {/* ── UPI ID (optional) ── */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-dashed">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Smartphone className="size-3.5" /> Payment Info (Optional — for Pay Now)
            </p>

            <Field label="Your UPI ID (members pay here)" error={errors.organizerUpiId}>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="yourname@upi or 9876543210@paytm"
                  value={form.organizerUpiId}
                  onChange={set("organizerUpiId")}
                  className={`pl-9 ${errors.organizerUpiId ? "border-destructive" : ""}`}
                  disabled={submitting}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Members will pay monthly contributions to this UPI ID via GPay / PhonePe / Paytm
              </p>
            </Field>

            <Field label="Your Name (shown in payment apps)" error={undefined}>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Rajesh Kumar"
                  value={form.organizerName}
                  onChange={set("organizerName")}
                  className="pl-9"
                  disabled={submitting}
                />
              </div>
            </Field>
          </div>

          {/* ── Server Error ── */}
          {serverError && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="size-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* ── Ready indicator ── */}
          {isReady && !serverError && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="size-4 text-green-600 shrink-0" />
              <p className="text-xs text-green-700 font-medium">All required fields filled — ready to create!</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isReady || submitting}
            className="min-w-[130px]"
          >
            {submitting ? (
              <><Loader2 className="size-4 mr-1.5 animate-spin" /> Creating...</>
            ) : (
              <><CheckCircle2 className="size-4 mr-1.5" /> {t("group.createNew")}</>
            )}
          </Button>
        </DialogFooter>
        </>
        )} {/* end form / success conditional */}
      </DialogContent>
    </Dialog>
  );
}

// ── Reusable field wrapper ──────────────────────────────────
function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium block">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="size-3 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}