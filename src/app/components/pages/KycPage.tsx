import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  FileCheck, Upload, CheckCircle2, Clock, AlertCircle, User, CreditCard,
  Home, Loader2, ChevronDown, ChevronUp, Eye, EyeOff, XCircle, RefreshCw,
  Shield, Users, Send, Check, CircleDot,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";
import type { UserRole } from "../LoginPage";

const API = (path: string) => `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf${path}`;

async function compressImage(file: File, maxPx = 1024, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",        color: "text-gray-600",   bg: "bg-gray-100 border-gray-200",    icon: CircleDot },
  submitted: { label: "Under Review", color: "text-yellow-700", bg: "bg-yellow-100 border-yellow-200", icon: Clock },
  approved:  { label: "Approved",     color: "text-green-700",  bg: "bg-green-100 border-green-200",  icon: CheckCircle2 },
  rejected:  { label: "Rejected",     color: "text-red-700",    bg: "bg-red-100 border-red-200",      icon: XCircle },
};

const DOC_FIELDS = [
  { id: "aadhaarFront", label: "Aadhaar – Front",  icon: CreditCard, required: true },
  { id: "aadhaarBack",  label: "Aadhaar – Back",   icon: CreditCard, required: true },
  { id: "addressProof", label: "Address Proof",     icon: Home,       required: true },
  { id: "selfie",       label: "Selfie / Photo",    icon: User,       required: true },
];

interface PersonalDetails {
  fullName: string; dob: string; phone: string;
  aadhaarNumber: string; address: string; city: string; state: string; pincode: string;
}
interface DocEntry { name: string; data?: string; uploadedAt: string; hasData?: boolean }
interface KycRecord {
  userId: string; userEmail: string; userName: string; userRole: string;
  status: string; personalDetails: Partial<PersonalDetails>;
  documents: Record<string, DocEntry>;
  submittedAt?: string; reviewedAt?: string; reviewNote?: string; updatedAt?: string;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
      <Icon className="size-3" /> {cfg.label}
    </span>
  );
}

function DocUploadRow({
  field, doc, locked, onUpload,
}: {
  field: typeof DOC_FIELDS[0];
  doc?: DocEntry;
  locked: boolean;
  onUpload: (id: string, file: File) => void;
}) {
  const [compressing, setCompressing] = useState(false);
  const [preview, setPreview] = useState(false);
  const Icon = field.icon;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try { onUpload(field.id, file); }
    finally { setCompressing(false); }
  };

  const hasDoc = !!(doc?.data || (doc as any)?.hasData);
  const imgSrc = doc?.data || null;

  return (
    <div className={`border rounded-xl p-4 transition-colors ${hasDoc ? "border-green-300 bg-green-50/30" : "border-border"}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className={`size-9 rounded-lg flex items-center justify-center ${hasDoc ? "bg-green-100" : "bg-primary/10"}`}>
            <Icon className={`size-4 ${hasDoc ? "text-green-600" : "text-primary"}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{field.label}</p>
            {hasDoc ? (
              <p className="text-xs text-green-600 font-medium">✓ Uploaded</p>
            ) : (
              <p className="text-xs text-muted-foreground">Required</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasDoc && imgSrc && (
            <button
              onClick={() => setPreview(p => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title={preview ? "Hide preview" : "View document"}
            >
              {preview ? <><EyeOff className="size-3.5" /> Hide</> : <><Eye className="size-3.5" /> View</>}
            </button>
          )}
          {!locked && (
            <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
              hasDoc ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}>
              {compressing ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {hasDoc ? "Replace" : "Upload"}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      </div>
      {preview && imgSrc && (
        <div className="mt-3 rounded-lg overflow-hidden border border-green-200 max-h-64">
          <img src={imgSrc} alt={field.label} className="w-full object-contain max-h-64 bg-black/5" />
        </div>
      )}
    </div>
  );
}

// ── Reusable doc viewer (used in both admin dashboard & member admin-preview) ──
function DocViewer({ documents }: { documents: Record<string, DocEntry> }) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {DOC_FIELDS.map(f => {
        const d = documents?.[f.id] as any;
        // Show as uploaded if there's inline data OR a hasData flag
        const hasDoc = !!(d?.data || d?.hasData);
        const imgSrc = d?.data || null;
        return (
          <div key={f.id} className={`border rounded-xl p-3 ${hasDoc ? "border-green-200 bg-green-50/20" : "border-dashed border-muted"}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {hasDoc
                  ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  : <XCircle className="size-4 text-muted-foreground/40 shrink-0" />}
                <span className="text-sm font-medium">{f.label}</span>
              </div>
              {hasDoc && imgSrc && (
                <button
                  onClick={() => setPreviewId(previewId === f.id ? null : f.id)}
                  className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {previewId === f.id
                    ? <><EyeOff className="size-3" /> Hide</>
                    : <><Eye className="size-3" /> View</>}
                </button>
              )}
              {hasDoc && !imgSrc && (
                <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Uploaded
                </span>
              )}
              {!hasDoc && (
                <span className="text-xs text-muted-foreground">Not uploaded</span>
              )}
            </div>
            {previewId === f.id && imgSrc && (
              <div className="mt-3 rounded-lg overflow-hidden border border-green-200 max-h-60">
                <img src={imgSrc} alt={f.label} className="w-full object-contain max-h-60 bg-black/5" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Member/Admin KYC Form ─────────────────────────────────────────────────────
function MemberKycForm({ accessToken, user, userRole }: { accessToken: string; user: any; userRole: UserRole }) {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [details, setDetails] = useState<Partial<PersonalDetails>>({});
  const [docs, setDocs] = useState<Record<string, DocEntry>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedAt, setSavedAt] = useState("");
  const [error, setError] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  // Only lock editing once admin has approved — members can always update & resubmit while under review
  const locked = kyc?.status === "approved";

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(API("/kyc/my"), { headers: { Authorization: `Bearer ${accessToken}` } });
        const data = await res.json();
        if (data.kyc) {
          setKyc(data.kyc);
          setDetails(data.kyc.personalDetails || {});
          setDocs(data.kyc.documents || {});
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const doSave = async (d: Partial<PersonalDetails>, dc: Record<string, DocEntry>) => {
    setSaving(true); setError("");
    try {
      const res = await fetch(API("/kyc/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ userName, userEmail, userRole, personalDetails: d, documents: dc }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Save failed"); return; }
      setKyc(data.kyc);
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const scheduleAutoSave = (d: Partial<PersonalDetails>, dc: Record<string, DocEntry>) => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(d, dc), 1500);
  };

  const setDetail = (k: keyof PersonalDetails, v: string) => {
    const next = { ...details, [k]: v };
    setDetails(next);
    scheduleAutoSave(next, docs);
  };

  const handleDocUpload = async (id: string, file: File) => {
    let data = "";
    if (file.type.startsWith("image/")) {
      data = await compressImage(file);
    } else {
      data = await new Promise<string>((res) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target!.result as string);
        r.readAsDataURL(file);
      });
    }
    const entry: DocEntry = { name: file.name, data, uploadedAt: new Date().toISOString() };
    const next = { ...docs, [id]: entry };
    setDocs(next);
    doSave(details, next);
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError("");
    try {
      await doSave(details, docs);
      const res = await fetch(API("/kyc/submit"), {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Submit failed"); return; }
      setKyc(data.kyc);
    } catch { setError("Network error"); }
    finally { setSubmitting(false); }
  };

  // checklist
  const checks = [
    { label: "Full Name",      done: !!details.fullName?.trim() },
    { label: "Aadhaar Number", done: !!details.aadhaarNumber?.trim() },
    { label: "Aadhaar Front",  done: !!docs.aadhaarFront?.data },
    { label: "Aadhaar Back",   done: !!docs.aadhaarBack?.data },
    { label: "Address Proof",  done: !!docs.addressProof?.data },
    { label: "Selfie / Photo", done: !!docs.selfie?.data },
  ];
  const allDone = checks.every(c => c.done);
  const doneCount = checks.filter(c => c.done).length;

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Status banner */}
      {kyc && (
        <Card className={`border ${STATUS_CFG[kyc.status]?.bg || "bg-muted"}`}>
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">KYC Status</p>
                <StatusBadge status={kyc.status} />
              </div>
              {kyc.reviewNote && (
                <p className="text-xs mt-1 text-muted-foreground">Admin note: {kyc.reviewNote}</p>
              )}
              {kyc.submittedAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Submitted: {new Date(kyc.submittedAt).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
            {savedAt && <p className="text-xs text-muted-foreground shrink-0">Auto-saved {savedAt}</p>}
          </CardContent>
        </Card>
      )}

      {kyc?.status === "submitted" && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4 pb-4 flex items-start gap-3">
            <Clock className="size-4 text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Your KYC is under review.</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                You can still update your documents and resubmit at any time.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {locked && kyc?.status === "approved" && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-800 font-medium">
              Your KYC is approved. Your documents are locked.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Personal details */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <p className="font-semibold text-sm">Personal Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {([
              { key: "fullName",      label: "Full Name *",        type: "text", placeholder: "As on Aadhaar" },
              { key: "dob",           label: "Date of Birth",      type: "date", placeholder: "" },
              { key: "phone",         label: "Mobile Number",      type: "tel",  placeholder: "10-digit number" },
              { key: "aadhaarNumber", label: "Aadhaar Number *",   type: "text", placeholder: "XXXX XXXX XXXX" },
              { key: "address",       label: "Address",            type: "text", placeholder: "House / Street" },
              { key: "city",          label: "City",               type: "text", placeholder: "" },
              { key: "state",         label: "State",              type: "text", placeholder: "" },
              { key: "pincode",       label: "Pincode",            type: "text", placeholder: "6 digits" },
            ] as { key: keyof PersonalDetails; label: string; type: string; placeholder: string }[]).map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium text-muted-foreground block mb-1">{f.label}</label>
                <Input
                  type={f.type}
                  value={(details[f.key] as string) || ""}
                  placeholder={f.placeholder}
                  disabled={locked}
                  onChange={(e) => setDetail(f.key, e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">Documents</p>
            <span className="text-xs text-muted-foreground">{Object.values(docs).filter(d => d?.data).length} / {DOC_FIELDS.length} uploaded</span>
          </div>
          <p className="text-xs text-muted-foreground">Upload clear photos. Images are compressed automatically.</p>
          <div className="space-y-3">
            {DOC_FIELDS.map(f => (
              <DocUploadRow
                key={f.id}
                field={f}
                doc={docs[f.id]}
                locked={locked}
                onUpload={handleDocUpload}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit section */}
      {!locked && (
        <Card className={`border-2 transition-colors ${allDone ? "border-primary/40 bg-primary/5" : "border-dashed"}`}>
          <CardContent className="pt-5 pb-5 space-y-4">
            <div className="flex items-center gap-2">
              <Send className={`size-4 ${allDone ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-semibold text-sm">Submit for Review</p>
              <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                allDone ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}>{doneCount}/{checks.length} ready</span>
            </div>

            {/* Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {checks.map(({ label, done }) => (
                <div key={label} className={`flex items-center gap-2 text-sm ${done ? "text-green-700" : "text-muted-foreground"}`}>
                  {done
                    ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                    : <AlertCircle className="size-4 text-amber-400 shrink-0" />}
                  {label}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="size-4" /> {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => doSave(details, docs)}
                disabled={saving}
                size="sm"
              >
                {saving ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <RefreshCw className="size-4 mr-1.5" />}
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!allDone || submitting || saving}
                className="flex-1"
              >
                {submitting
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Submitting…</>
                  : kyc?.status === "submitted"
                    ? <><RefreshCw className="size-4 mr-2" />Update & Resubmit</>
                    : <><Send className="size-4 mr-2" />Submit for Review</>}
              </Button>
            </div>

            {!allDone && (
              <p className="text-xs text-muted-foreground">
                Complete all items above to enable submission.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Member: Admin KYC Viewer ─────────────────────────────────────────────────
function AdminKycPreview({ accessToken }: { accessToken: string }) {
  const [kyc, setKyc] = useState<KycRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(API("/kyc/admin"), { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      setKyc(data.kyc);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex items-center justify-center h-32"><Loader2 className="size-5 animate-spin text-primary" /></div>;

  if (!kyc) return (
    <Card className="border-dashed">
      <CardContent className="pt-10 pb-10 text-center text-muted-foreground">
        <Shield className="size-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">Admin has not yet submitted KYC documents.</p>
        <p className="text-xs mt-1 opacity-70">Check back once the admin completes their verification.</p>
      </CardContent>
    </Card>
  );

  const pd = kyc.personalDetails || {};
  const docCount = DOC_FIELDS.filter(f => !!(kyc.documents?.[f.id] as any)?.data).length;

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-lg">{(kyc.userName || "A").charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{kyc.userName}</p>
              <p className="text-xs text-muted-foreground truncate">{kyc.userEmail}</p>
              <div className="mt-1.5"><StatusBadge status={kyc.status} /></div>
            </div>
          </div>

          {pd.fullName && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2 border-t">
              {[
                ["Full Name", pd.fullName],
                ["City",      pd.city],
                ["State",     pd.state],
                ["Phone",     pd.phone],
              ].filter(([, v]) => v).map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-muted-foreground">{l}</p>
                  <p className="font-medium">{v}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents card with prominent View button */}
      <Card>
        <CardContent className="pt-5 pb-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-sm flex items-center gap-2">
                <FileCheck className="size-4 text-primary" /> KYC Documents
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{docCount}/{DOC_FIELDS.length} documents uploaded</p>
            </div>
            <Button
              variant={showDocs ? "secondary" : "default"}
              size="sm"
              onClick={() => setShowDocs(v => !v)}
              className="shrink-0"
              disabled={docCount === 0}
            >
              {showDocs
                ? <><EyeOff className="size-4 mr-1.5" /> Hide Docs</>
                : <><Eye className="size-4 mr-1.5" /> View Docs</>}
            </Button>
          </div>

          {docCount === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
              No documents uploaded yet.
            </p>
          )}

          {showDocs && docCount > 0 && (
            <div className="pt-1">
              <DocViewer documents={kyc.documents || {}} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Admin: Member KYC Dashboard ───────────────────────────────────────────────
function AdminKycDashboard({ accessToken }: { accessToken: string }) {
  const [kycs, setKycs] = useState<KycRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [saving, setSaving] = useState(false);

  const loadKycs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API("/kyc/all"), { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      setKycs((data.kycs || []).filter((k: KycRecord) => k.userRole !== "admin"));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadKycs(); }, []);

  const updateStatus = async (targetUserId: string, status: string) => {
    setSaving(true);
    try {
      await fetch(API(`/kyc/${targetUserId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ status, reviewNote }),
      });
      setReviewing(null); setReviewNote("");
      await loadKycs();
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-40"><Loader2 className="size-6 animate-spin text-primary" /></div>;

  const pending = kycs.filter(k => k.status === "submitted").length;

  if (kycs.length === 0) return (
    <Card className="border-dashed">
      <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
        <Users className="size-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">No member KYC records yet.</p>
        <p className="text-xs mt-1">Members will appear here once they start their KYC.</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">{kycs.length} member{kycs.length !== 1 ? "s" : ""}</p>
          {pending > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full border border-yellow-200">
              {pending} pending review
            </span>
          )}
        </div>
        <button onClick={loadKycs} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title="Refresh">
          <RefreshCw className="size-4 text-muted-foreground" />
        </button>
      </div>

      {kycs.map((rec) => {
        const isExpanded = expandedId === rec.userId;
        const pd = rec.personalDetails || {};
        const docCount = DOC_FIELDS.filter(f => !!(rec.documents?.[f.id] as any)?.data).length;

        return (
          <Card key={rec.userId} className="overflow-hidden">
            <CardContent className="pt-4 pb-0">
              {/* Header row — always visible */}
              <div className="w-full flex items-center gap-3 pb-4">
                <button
                  className="flex items-center gap-3 text-left flex-1 min-w-0"
                  onClick={() => setExpandedId(isExpanded ? null : rec.userId)}
                >
                  <div className="size-9 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">{(rec.userName || "?").charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{rec.userName || rec.userEmail}</p>
                    <p className="text-xs text-muted-foreground">{docCount}/{DOC_FIELDS.length} docs · {rec.userEmail}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={rec.status} />
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rec.userId)}
                    className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {isExpanded
                      ? <><EyeOff className="size-3" /> Hide</>
                      : <><Eye className="size-3" /> View Docs</>}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t pt-4 pb-4 space-y-5">
                  {/* Personal details */}
                  {pd.fullName && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Personal Details</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        {[
                          ["Full Name",  pd.fullName],
                          ["DOB",        pd.dob],
                          ["Phone",      pd.phone],
                          ["Aadhaar",    pd.aadhaarNumber ? `•••• •••• ${pd.aadhaarNumber.slice(-4)}` : ""],
                          ["Address",    pd.address],
                          ["City",       pd.city],
                          ["State",      pd.state],
                          ["Pincode",    pd.pincode],
                        ].filter(([, v]) => v).map(([l, v]) => (
                          <div key={l}>
                            <p className="text-xs text-muted-foreground">{l}</p>
                            <p className="font-medium text-sm">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Documents */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Documents ({docCount}/{DOC_FIELDS.length} uploaded)
                    </p>
                    <DocViewer documents={rec.documents || {}} />
                  </div>

                  {/* Review actions — available for all statuses (admin has unlimited re-review) */}
                  {rec.status !== "draft" && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Review Decision</p>
                        {rec.status === "approved" && (
                          <span className="text-xs text-green-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Approved
                          </span>
                        )}
                        {rec.status === "rejected" && rec.reviewNote && (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="size-3" /> Rejected
                          </span>
                        )}
                      </div>

                      {rec.status === "rejected" && rec.reviewNote && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                          <XCircle className="size-3.5 shrink-0 mt-0.5" /> Reason: {rec.reviewNote}
                        </p>
                      )}

                      {reviewing === rec.userId ? (
                        <div className="space-y-2">
                          <Input
                            value={reviewNote}
                            onChange={e => setReviewNote(e.target.value)}
                            placeholder="Note for member (optional)"
                            className="h-9 text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => updateStatus(rec.userId, "approved")} disabled={saving}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5 mr-1" />}
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => updateStatus(rec.userId, "rejected")} disabled={saving} className="flex-1">
                              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5 mr-1" />}
                              Reject
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setReviewing(null)} className="px-3">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => setReviewing(rec.userId)} className="w-full" variant={rec.status === "approved" ? "outline" : "default"}>
                          <FileCheck className="size-3.5 mr-2" />
                          {rec.status === "approved" ? "Change Decision" : rec.status === "rejected" ? "Re-review" : "Review & Decide"}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────
export function KycPage({
  accessToken,
  user,
  userRole,
}: {
  accessToken: string;
  user: any;
  userRole: UserRole;
}) {
  const [tab, setTab] = useState<"my" | "members" | "admin">(userRole === "admin" ? "members" : "my");

  const tabs =
    userRole === "admin"
      ? [
          { key: "members" as const, label: "Member Documents", icon: Users },
          { key: "my"      as const, label: "My KYC",           icon: Shield },
        ]
      : [
          { key: "my"    as const, label: "My Documents", icon: FileCheck },
          { key: "admin" as const, label: "Admin KYC",    icon: Shield },
        ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="size-6 text-primary" />
          KYC Verification
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {userRole === "admin"
            ? "Review member submissions and manage your own KYC."
            : "Upload your documents for identity verification."}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "my"      && <MemberKycForm    accessToken={accessToken} user={user} userRole={userRole} />}
      {tab === "members" && <AdminKycDashboard accessToken={accessToken} />}
      {tab === "admin"   && <AdminKycPreview   accessToken={accessToken} />}
    </div>
  );
}
