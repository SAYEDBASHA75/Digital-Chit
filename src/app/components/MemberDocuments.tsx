import { useState, useRef } from "react";
import { Button } from "./ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import {
  Camera, CreditCard, Upload, Trash2, Loader2, ShieldCheck,
  ZoomIn, X, FileImage, AlertCircle,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";

interface MemberDocumentsProps {
  memberId: string;
  memberName: string;
  memberRole: "admin" | "member";
  isOwnProfile: boolean;
  currentUserIsAdmin: boolean;
  groupId: string;
  accessToken: string;
}

interface DocInfo {
  url: string;
  uploadedAt: string;
}

interface Documents {
  profilePhoto?: DocInfo;
  aadhaarCard?: DocInfo;
}

type DocType = "profilePhoto" | "aadhaarCard";

const DOC_META: Record<DocType, { label: string; icon: React.ReactNode; hint: string; aspectClass: string }> = {
  profilePhoto: {
    label: "Profile Photo",
    icon: <Camera className="size-4" />,
    hint: "Clear face photo (JPG/PNG, max 5 MB)",
    aspectClass: "aspect-square",
  },
  aadhaarCard: {
    label: "Aadhaar Card",
    icon: <CreditCard className="size-4" />,
    hint: "Front side of Aadhaar card (JPG/PNG/PDF, max 5 MB)",
    aspectClass: "aspect-video",
  },
};

export function MemberDocuments({
  memberId, memberName, memberRole, isOwnProfile, currentUserIsAdmin, groupId, accessToken,
}: MemberDocumentsProps) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState<Documents>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<DocType | null>(null);
  const [deleting, setDeleting] = useState<DocType | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const photoRef = useRef<HTMLInputElement>(null);
  const aadhaarRef = useRef<HTMLInputElement>(null);

  const canView = currentUserIsAdmin || memberRole === "admin";

  const fetchDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/groups/${groupId}/members/${memberId}/documents`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load documents"); return; }
      setDocs(data.documents || {});
    } catch {
      setError("Network error loading documents");
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchDocs();
  };

  const handleUpload = async (docType: DocType, file: File) => {
    setUploadError("");
    if (file.size > 5 * 1024 * 1024) { setUploadError("File too large (max 5 MB)"); return; }
    setUploading(docType);
    try {
      const form = new FormData();
      form.append("docType", docType);
      form.append("file", file);
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/members/${memberId}/documents`,
        { method: "POST", headers: { Authorization: `Bearer ${accessToken}` }, body: form }
      );
      const data = await res.json();
      if (!res.ok) { setUploadError(data.error || "Upload failed"); return; }
      await fetchDocs();
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (docType: DocType) => {
    if (!confirm(`Delete this ${DOC_META[docType].label}?`)) return;
    setDeleting(docType);
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/members/${memberId}/documents/${docType}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setDocs((prev) => { const n = { ...prev }; delete n[docType]; return n; });
    } finally {
      setDeleting(null);
    }
  };

  if (!canView && !isOwnProfile) return null;

  return (
    <>
      <button
        onClick={handleOpen}
        title={isOwnProfile ? "My Documents" : `${memberName}'s Documents`}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors border border-blue-200"
      >
        <FileImage className="size-3" />
        {isOwnProfile ? "My Docs" : "Docs"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileImage className="size-5 text-primary" />
              {isOwnProfile ? "My Documents" : `${memberName}'s Documents`}
              {!isOwnProfile && currentUserIsAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-primary/10 text-primary rounded-full font-semibold ml-1">
                  <ShieldCheck className="size-3" /> Admin View
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-5">
              {uploadError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="size-3" /> {uploadError}
                </p>
              )}

              {/* Access notice for members viewing admin docs */}
              {!isOwnProfile && !currentUserIsAdmin && memberRole === "admin" && (
                <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <ShieldCheck className="size-3.5 shrink-0 text-amber-600" />
                  You can view admin documents for verification purposes.
                </div>
              )}

              {(["profilePhoto", "aadhaarCard"] as DocType[]).map((docType) => {
                const meta = DOC_META[docType];
                const doc = docs[docType];
                const isUploading = uploading === docType;
                const isDeleting = deleting === docType;
                const fileRef = docType === "profilePhoto" ? photoRef : aadhaarRef;

                return (
                  <div key={docType} className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-primary">{meta.icon}</span>
                      <p className="text-sm font-semibold">{meta.label}</p>
                      {doc && (
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {new Date(doc.uploadedAt).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </div>

                    {doc ? (
                      <div className="relative group rounded-xl overflow-hidden border border-border bg-muted">
                        <img
                          src={doc.url}
                          alt={meta.label}
                          className={`w-full object-cover ${meta.aspectClass}`}
                        />
                        {/* Overlay actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={() => setZoomSrc(doc.url)}
                            className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                            title="View full size"
                          >
                            <ZoomIn className="size-4 text-foreground" />
                          </button>
                          {(isOwnProfile || currentUserIsAdmin) && (
                            <>
                              <button
                                onClick={() => fileRef.current?.click()}
                                disabled={isUploading}
                                className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                                title="Replace"
                              >
                                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4 text-foreground" />}
                              </button>
                              <button
                                onClick={() => handleDelete(docType)}
                                disabled={isDeleting}
                                className="p-2 bg-white/90 rounded-full hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                {isDeleting ? <Loader2 className="size-4 animate-spin text-destructive" /> : <Trash2 className="size-4 text-destructive" />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`${meta.aspectClass} border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 bg-muted/30 ${isOwnProfile ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors" : ""}`}
                        onClick={() => isOwnProfile && fileRef.current?.click()}
                      >
                        <div className="p-3 bg-muted rounded-full">
                          {meta.icon}
                        </div>
                        {isOwnProfile ? (
                          <>
                            {isUploading
                              ? <Loader2 className="size-5 animate-spin text-primary" />
                              : <p className="text-xs font-medium text-muted-foreground">Tap to upload</p>
                            }
                            <p className="text-[10px] text-muted-foreground text-center px-4">{meta.hint}</p>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">Not uploaded yet</p>
                        )}
                      </div>
                    )}

                    {/* Hidden file input */}
                    {isOwnProfile && (
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(docType, f);
                          e.target.value = "";
                        }}
                      />
                    )}

                    {/* Explicit upload button if no doc and own profile */}
                    {isOwnProfile && !doc && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={isUploading}
                        onClick={() => fileRef.current?.click()}
                      >
                        {isUploading
                          ? <><Loader2 className="size-4 mr-1.5 animate-spin" /> Uploading…</>
                          : <><Upload className="size-4 mr-1.5" /> Upload {meta.label}</>}
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Info footer */}
              <p className="text-[10px] text-muted-foreground text-center border-t pt-3">
                {isOwnProfile
                  ? "Documents are stored securely and only visible to group admins."
                  : currentUserIsAdmin
                  ? "As admin, you can view all member documents for verification."
                  : "Admin documents are shared for group transparency."}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-size image zoom dialog */}
      {zoomSrc && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomSrc(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setZoomSrc(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={zoomSrc}
            alt="Document"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
