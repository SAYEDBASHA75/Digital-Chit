import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import {
  IndianRupee, Copy, CheckCircle2, XCircle, Loader2,
  AlertCircle, Smartphone, RefreshCw, ExternalLink,
  QrCode, Hash, ShieldCheck, ArrowLeft, Wifi, Clock, CreditCard,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";
import { useLanguage } from "../contexts/LanguageContext";

declare global {
  interface Window { Razorpay: any; }
}

// ── UPI Apps ──────────────────────────────────────────────────────────────────
const UPI_APPS = [
  {
    id: "gpay",
    name: "Google Pay",
    shortName: "GPay",
    bgFrom: "#1a73e8",
    bgTo: "#0d47a1",
    scheme: (upi: string, name: string, amt: number, note: string) =>
      `tez://upi/pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 48 48">
        <text x="2" y="34" fontSize="26" fontWeight="900" fill="#fff">G</text>
        <text x="21" y="34" fontSize="22" fontWeight="700" fill="#fff" opacity="0.85">P</text>
      </svg>
    ),
  },
  {
    id: "phonepe",
    name: "PhonePe",
    shortName: "PhonePe",
    bgFrom: "#5f259f",
    bgTo: "#3b0a6b",
    scheme: (upi: string, name: string, amt: number, note: string) =>
      `phonepe://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 48 48">
        <text x="5" y="34" fontSize="20" fontWeight="900" fill="white">Ph</text>
        <circle cx="37" cy="28" r="5" fill="white" fillOpacity="0.7" />
      </svg>
    ),
  },
  {
    id: "paytm",
    name: "Paytm",
    shortName: "Paytm",
    bgFrom: "#00b9f5",
    bgTo: "#0078b6",
    scheme: (upi: string, name: string, amt: number, note: string) =>
      `paytmmp://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&am=${amt}&cu=INR&tn=${encodeURIComponent(note)}`,
    icon: () => (
      <svg width="30" height="30" viewBox="0 0 48 48">
        <text x="1" y="32" fontSize="14" fontWeight="900" fill="white">Paytm</text>
      </svg>
    ),
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PaymentTarget {
  groupId: string;
  groupName: string;
  defaultAmount: number;
  month: number;
  memberName: string;
  recipientUpiId: string;
  recipientName: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PaymentTarget | null;
  accessToken: string;
  onPaymentSaved: (txn: any) => void;
}

// 3 steps: details (with direct app buttons + Razorpay) → utr (enter UTR for UPI) → done
type Step = "details" | "utr" | "done";
type PayMethod = "upi" | "razorpay";

const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const WINDOW_SECS = 600;

export function PaymentDialog({ open, onOpenChange, target, accessToken, onPaymentSaved }: PaymentDialogProps) {
  const { t } = useLanguage();

  // form
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");
  const [upiError, setUpiError] = useState("");

  // flow
  const [step, setStep] = useState<Step>("details");
  const [appUsed, setAppUsed] = useState<string | null>(null);
  const [launching, setLaunching] = useState<string | null>(null); // appId being launched

  // payment tracking
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [shortRef, setShortRef] = useState("");
  const [timeLeft, setTimeLeft] = useState(WINDOW_SECS);
  const [pollingActive, setPollingActive] = useState(false);

  // UTR + save
  const [utrNumber, setUtrNumber] = useState("");
  const [utrError, setUtrError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedTxn, setSavedTxn] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<"success" | "failed">("success");

  // Razorpay
  const [razorpayProcessing, setRazorpayProcessing] = useState(false);
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod>("upi");

  // QR fallback
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  // Reset on open
  useEffect(() => {
    if (open && target) {
      stopTimers();
      setStep("details");
      setAmount(target.defaultAmount.toString());
      setUpiId(target.recipientUpiId || "");
      setRecipientName(target.recipientName || "");
      setNote(`Month ${target.month} – ${target.groupName}`);
      setAmountError(""); setUpiError("");
      setAppUsed(null); setLaunching(null);
      setPaymentId(null); setShortRef("");
      setTimeLeft(WINDOW_SECS); setPollingActive(false);
      setUtrNumber(""); setUtrError("");
      setSaving(false); setSavedTxn(null);
      setError(""); setShowQr(false); setCopied(false);
      setRazorpayProcessing(false); setRazorpayPaymentId(null); setPaymentMethod("upi");
    }
  }, [open, target]);

  useEffect(() => () => stopTimers(), []);

  // Start countdown when on utr step
  useEffect(() => {
    if (step !== "utr" || !paymentId) return;
    setTimeLeft(WINDOW_SECS);
    setPollingActive(true);

    countdownRef.current = setInterval(() => {
      setTimeLeft((p) => { if (p <= 1) { stopTimers(); setPollingActive(false); return 0; } return p - 1; });
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/payments/${paymentId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const d = await res.json();
        if (d.payment?.status === "expired") { stopTimers(); setPollingActive(false); }
      } catch { /* ignore */ }
    }, 3000);

    return () => stopTimers();
  }, [step, paymentId]);

  if (!target) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const isValidAmount = parsedAmount > 0;
  const hasUpi = upiId.trim().length > 0;
  const isUtrValid = /^\d{12}$/.test(utrNumber.trim());

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const upiString = hasUpi
    ? `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(recipientName || target.groupName)}&am=${parsedAmount}&cu=INR&tn=${encodeURIComponent(note)}${shortRef ? `&tr=${shortRef}` : ""}`
    : "";

  const handleCopyUpi = async () => {
    try { await navigator.clipboard.writeText(upiId.trim()); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* ignore */ }
  };

  // Validate, create pending payment, fire deep link — all in ONE tap
  const handleLaunchApp = async (appId: string) => {
    let hasError = false;
    if (!isValidAmount) { setAmountError("Enter a valid amount"); hasError = true; }
    if (!hasUpi) { setUpiError("Enter the chit holder's UPI ID"); hasError = true; }
    if (hasError) return;

    setAmountError(""); setUpiError(""); setLaunching(appId);

    try {
      // Create pending payment record in backend
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/payments/initiate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            groupId: target.groupId,
            groupName: target.groupName,
            amount: parsedAmount,
            recipientUpiId: upiId.trim(),
            recipientName: recipientName || target.groupName,
            month: target.month,
            note,
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setPaymentId(data.payment.id);
        setShortRef(data.payment.shortRef);
      }
    } catch { /* non-blocking — continue to app even if backend fails */ }

    // Fire deep link IMMEDIATELY — don't wait for backend response
    const app = UPI_APPS.find((a) => a.id === appId)!;
    const link = app.scheme(upiId.trim(), recipientName || target.groupName, parsedAmount, note);
    window.location.href = link;

    setAppUsed(appId);
    setLaunching(null);
    // Move to UTR step after a short delay (OS needs time to switch apps)
    setTimeout(() => setStep("utr"), 600);
  };

  // Save payment
  const handleMarkPaid = async (status: "success" | "failed") => {
    if (status === "success" && !isUtrValid) {
      setUtrError("Enter the 12-digit UTR number from your UPI app");
      return;
    }
    setSaving(true); setError(""); setUtrError(""); setPaymentStatus(status); stopTimers();
    try {
      const endpoint = paymentId
        ? `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/payments/${paymentId}/confirm`
        : `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/transactions`;

      const body = paymentId
        ? { status, utrNumber: status === "success" ? utrNumber.trim() : null, appUsed: appUsed || "upi_qr" }
        : { groupId: target.groupId, groupName: target.groupName, amount: parsedAmount, recipientUpiId: upiId.trim(), recipientName, appUsed: appUsed || "upi_qr", status, month: target.month, note };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save payment"); setSaving(false); return; }
      setSavedTxn(data.transaction || data);
      onPaymentSaved(data.transaction || data);
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleRazorpayPay = async () => {
    if (!isValidAmount) { setAmountError("Enter a valid amount"); return; }
    setAmountError(""); setError(""); setRazorpayProcessing(true);

    try {
      // 1. Create server-side Razorpay order
      const orderRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/payments/razorpay/order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            amount: parsedAmount,
            groupId: target.groupId,
            groupName: target.groupName,
            month: target.month,
            memberName: target.memberName,
            note,
          }),
        }
      );
      const orderData = await orderRes.json();
      if (!orderRes.ok) { setError(orderData.error || "Could not create order"); setRazorpayProcessing(false); return; }

      const { orderId, keyId, amount: orderAmount } = orderData;

      // 2. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) { setError("Razorpay SDK failed to load. Check your internet connection."); setRazorpayProcessing(false); return; }

      setRazorpayProcessing(false);

      // 3. Open Razorpay checkout
      const rzpOptions = {
        key: keyId,
        amount: orderAmount,
        currency: "INR",
        name: "ChitFund",
        description: note || `Month ${target.month} – ${target.groupName}`,
        order_id: orderId,
        prefill: { name: target.memberName },
        theme: { color: "#7c3aed" },
        modal: { ondismiss: () => setRazorpayProcessing(false) },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          setSaving(true); setError("");
          try {
            const verifyRes = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/payments/razorpay/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({
                  ...response,
                  groupId: target.groupId,
                  groupName: target.groupName,
                  amount: parsedAmount,
                  month: target.month,
                  note,
                  memberName: target.memberName,
                }),
              }
            );
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) { setError(verifyData.error || "Verification failed"); setSaving(false); return; }
            setRazorpayPaymentId(response.razorpay_payment_id);
            setPaymentMethod("razorpay");
            setPaymentStatus("success");
            setSavedTxn(verifyData.transaction || verifyData);
            onPaymentSaved(verifyData.transaction || verifyData);
            setStep("done");
          } catch {
            setError(`Verification error. Keep this payment ID: ${response.razorpay_payment_id}`);
          } finally { setSaving(false); }
        },
      };

      const rzp = new window.Razorpay(rzpOptions);
      rzp.on("payment.failed", (resp: any) => {
        setError(`Payment declined: ${resp.error?.description || "Unknown error"}`);
      });
      rzp.open();
    } catch (e) {
      setError(`Failed to start Razorpay: ${e}`);
      setRazorpayProcessing(false);
    }
  };

  const appUsedConfig = UPI_APPS.find((a) => a.id === appUsed);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (saving || !!launching) return;
        if (!o) { stopTimers(); onOpenChange(false); }
      }}
    >
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl" aria-describedby={undefined}>

        {/* ════════════════════════════════════════
            STEP 1 — DETAILS + DIRECT APP BUTTONS
        ════════════════════════════════════════ */}
        {step === "details" && (
          <>
            <div className="px-6 pt-5 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="size-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                    <IndianRupee className="size-4 text-primary-foreground" />
                  </div>
                  Pay Contribution
                </DialogTitle>
              </DialogHeader>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{target.groupName}</span>
                <span className="text-muted-foreground/40">·</span>
                <Badge variant="secondary" className="text-xs">Month {target.month}</Badge>
              </div>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Amount */}
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Amount</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setAmountError(""); }}
                    className={`pl-9 text-xl font-bold h-12 ${amountError ? "border-destructive" : ""}`}
                    placeholder="0"
                    min="0"
                  />
                </div>
                {amountError && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="size-3" />{amountError}</p>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[target.defaultAmount, Math.round(target.defaultAmount * 0.5), Math.round(target.defaultAmount * 2)].filter(Boolean).map((v, i) => (
                    <button key={i} onClick={() => { setAmount(v.toString()); setAmountError(""); }}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${amount === v.toString() ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                      ₹{v.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI ID */}
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Chit Holder's UPI ID <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      value={upiId}
                      onChange={(e) => { setUpiId(e.target.value); setUpiError(""); }}
                      placeholder="name@okaxis / 9876543210@paytm"
                      className={`pl-9 font-mono text-sm ${upiError ? "border-destructive" : ""}`}
                    />
                  </div>
                  {upiId.trim() && (
                    <Button variant="outline" size="icon" onClick={handleCopyUpi}>
                      {copied ? <CheckCircle2 className="size-4 text-green-500" /> : <Copy className="size-4" />}
                    </Button>
                  )}
                </div>
                {upiError && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertCircle className="size-3" />{upiError}</p>}
              </div>

              {/* Recipient name */}
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Holder's Name</label>
                <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Chit holder's full name" />
              </div>

              {/* Note */}
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Note</label>
                <Input value={note} onChange={(e) => setNote(e.target.value)} />
              </div>

              {/* ── RAZORPAY BUTTON ── */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium px-2">Pay securely</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <button
                  onClick={handleRazorpayPay}
                  disabled={razorpayProcessing || !!launching || !isValidAmount}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.97] hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #3395FF 0%, #0052CC 100%)" }}
                >
                  <div className="size-11 rounded-xl flex items-center justify-center shrink-0 bg-white/20">
                    {razorpayProcessing
                      ? <Loader2 className="size-6 text-white animate-spin" />
                      : <CreditCard className="size-6 text-white" />}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-base">Pay with Razorpay</p>
                    <p className="text-white/75 text-xs">
                      {razorpayProcessing
                        ? "Opening secure checkout…"
                        : "Cards · Net Banking · UPI · Wallets"}
                    </p>
                  </div>
                  {!razorpayProcessing && (
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-white font-bold text-sm">₹{parsedAmount > 0 ? parsedAmount.toLocaleString() : "—"}</span>
                      <span className="text-white/60 text-[10px] flex items-center gap-0.5">
                        <ShieldCheck className="size-3" /> Secure
                      </span>
                    </div>
                  )}
                </button>

                {saving && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Verifying payment…
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <AlertCircle className="size-4 text-destructive shrink-0" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}
              </div>

              {/* ── DIRECT APP LAUNCH BUTTONS ── */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground font-medium px-2">Or open UPI app directly</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {UPI_APPS.map((app) => {
                  const isLaunching = launching === app.id;
                  return (
                    <button
                      key={app.id}
                      onClick={() => handleLaunchApp(app.id)}
                      disabled={!!launching}
                      className="w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all active:scale-[0.97] hover:shadow-lg disabled:opacity-70"
                      style={{ background: `linear-gradient(135deg, ${app.bgFrom}, ${app.bgTo})` }}
                    >
                      <div className="size-11 rounded-xl flex items-center justify-center shrink-0 bg-white/15">
                        {isLaunching
                          ? <Loader2 className="size-5 text-white animate-spin" />
                          : <app.icon />}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white font-bold text-base">{app.name}</p>
                        <p className="text-white/70 text-xs">
                          {isLaunching ? "Opening app…" : `Pay ₹${parsedAmount > 0 ? parsedAmount.toLocaleString() : "—"} instantly`}
                        </p>
                      </div>
                      {!isLaunching && <ExternalLink className="size-4 text-white/60 shrink-0" />}
                    </button>
                  );
                })}

                {/* QR fallback toggle */}
                <button
                  onClick={() => setShowQr((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  <QrCode className="size-4" />
                  {showQr ? "Hide QR Code" : "Or scan QR code instead"}
                </button>

                {/* QR code (collapsible) */}
                {showQr && hasUpi && isValidAmount && (
                  <div className="flex flex-col items-center gap-3 py-3">
                    <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-primary/20 relative">
                      <QRCodeSVG value={upiString} size={180} level="M" fgColor="#1a1a2e" bgColor="#ffffff" />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="size-9 bg-white rounded-full border border-primary/20 shadow flex items-center justify-center">
                          <IndianRupee className="size-4 text-primary" />
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      Scan with any UPI app · <span className="font-mono text-xs">{upiId.trim()}</span>
                    </p>
                    <Button variant="outline" size="sm" onClick={() => { setAppUsed("upi_qr"); setStep("utr"); }}>
                      I've Scanned & Paid →
                    </Button>
                  </div>
                )}
              </div>

              <p className="text-xs text-center text-muted-foreground pb-1">
                You'll return here to enter your UTR number after payment
              </p>
            </div>

            <div className="px-6 pb-4 pt-2 border-t">
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            STEP 2 — ENTER UTR + CONFIRM
        ════════════════════════════════════════ */}
        {step === "utr" && (
          <>
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b flex items-center gap-3">
              <button onClick={() => { stopTimers(); setStep("details"); }} className="p-1.5 rounded-lg hover:bg-muted transition-colors" disabled={saving}>
                <ArrowLeft className="size-4" />
              </button>
              <div className="flex-1">
                <DialogTitle className="font-semibold text-base">Confirm Payment</DialogTitle>
                <p className="text-xs text-muted-foreground">Enter your UTR to complete</p>
              </div>
              {pollingActive && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                  <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <Clock className="size-3 text-emerald-600" />
                  <span className="text-[10px] font-mono font-bold text-emerald-700">{formatTime(timeLeft)}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Which app was used */}
              {appUsedConfig && (
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${appUsedConfig.bgFrom}22, ${appUsedConfig.bgTo}11)`, border: `1px solid ${appUsedConfig.bgFrom}44` }}>
                  <div className="size-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${appUsedConfig.bgFrom}, ${appUsedConfig.bgTo})` }}>
                    <appUsedConfig.icon />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Opened {appUsedConfig.name}</p>
                    <p className="text-xs text-muted-foreground">₹{parsedAmount.toLocaleString()} to {upiId.trim()}</p>
                  </div>
                  <CheckCircle2 className="size-4 text-green-500 ml-auto" />
                </div>
              )}

              {/* Re-open app */}
              {appUsedConfig && (
                <button
                  onClick={() => {
                    const link = appUsedConfig.scheme(upiId.trim(), recipientName || target.groupName, parsedAmount, note);
                    window.location.href = link;
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="size-3" /> Re-open {appUsedConfig.name} to check payment
                </button>
              )}

              {/* UTR input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold flex items-center gap-1.5">
                    <Hash className="size-4 text-primary" />
                    UTR Number
                    <span className="text-destructive">*</span>
                  </label>
                  {isUtrValid && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                      <ShieldCheck className="size-3.5" /> Verified
                    </span>
                  )}
                </div>
                <Input
                  value={utrNumber}
                  onChange={(e) => { setUtrNumber(e.target.value.replace(/\D/g, "").slice(0, 12)); setUtrError(""); }}
                  placeholder="12-digit UTR from your UPI app"
                  className={`font-mono text-lg tracking-widest h-12 text-center ${
                    utrError ? "border-destructive" : isUtrValid ? "border-emerald-500 bg-emerald-50/40" : ""
                  }`}
                  inputMode="numeric"
                  maxLength={12}
                  disabled={saving}
                  autoFocus
                />
                {utrError && (
                  <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="size-3" />{utrError}</p>
                )}
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-100 rounded-lg">
                  <Smartphone className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Open your UPI app → <strong>Transaction History</strong> → tap the payment → find the <strong>12-digit UTR / Reference Number</strong>
                  </p>
                </div>
                {utrNumber.length > 0 && !isUtrValid && (
                  <p className="text-xs text-center text-muted-foreground">{utrNumber.length} / 12 digits</p>
                )}
              </div>

              {/* Monitoring bar */}
              {pollingActive && (
                <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <Wifi className="size-4 text-emerald-600" />
                  <div className="flex gap-0.5">
                    {[0,1,2].map((i) => (
                      <div key={i} className="w-1 bg-emerald-500 rounded-full animate-bounce"
                        style={{ height: 10, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-xs text-emerald-700 font-medium">Monitoring payment…</p>
                  <span className="ml-auto text-xs font-mono text-emerald-600">{formatTime(timeLeft)}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="size-4 text-destructive shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-6 pb-6 space-y-2 border-t pt-4">
              <Button
                className="w-full h-12 text-sm font-bold rounded-xl transition-all"
                style={{ background: isUtrValid ? "linear-gradient(135deg,#16a34a,#15803d)" : undefined }}
                variant={isUtrValid ? "default" : "outline"}
                onClick={() => handleMarkPaid("success")}
                disabled={!isUtrValid || saving}
              >
                {saving
                  ? <><Loader2 className="size-4 mr-2 animate-spin" />Saving…</>
                  : isUtrValid
                    ? <><CheckCircle2 className="size-4 mr-2" />Payment Done</>
                    : <span className="text-muted-foreground text-sm">Enter UTR to confirm payment</span>}
              </Button>
              <Button variant="ghost" className="w-full text-red-500 hover:bg-red-50 hover:text-red-600 h-9 text-sm"
                onClick={() => handleMarkPaid("failed")} disabled={saving}>
                <XCircle className="size-4 mr-1.5" /> Payment Failed / Cancel
              </Button>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════
            STEP 3 — DONE
        ════════════════════════════════════════ */}
        {step === "done" && savedTxn && (
          <>
            <div className="px-6 pt-5 pb-4 border-b">
              <DialogHeader>
                <DialogTitle className="font-semibold text-base">
                  {paymentStatus === "success" ? "Payment Done!" : "Payment Recorded"}
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="px-6 py-7 flex flex-col items-center gap-5 text-center">
              {paymentStatus === "success" ? (
                <>
                  <div className="relative">
                    <div className="size-24 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="size-12 text-green-600" />
                    </div>
                    <div className="absolute inset-0 size-24 rounded-full bg-green-400/20 animate-ping" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-green-700">₹{parsedAmount.toLocaleString()}</p>
                    <p className="text-base font-semibold mt-1">Payment Successful</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contribution for <strong>{target.groupName}</strong> recorded.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                      {paymentMethod === "razorpay" ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                          style={{ background: "#3395FF15", borderColor: "#3395FF44" }}>
                          <CreditCard className="size-3.5" style={{ color: "#3395FF" }} />
                          <span className="text-xs font-medium" style={{ color: "#0052CC" }}>via Razorpay</span>
                        </div>
                      ) : appUsedConfig ? (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                          <CheckCircle2 className="size-3.5 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">via {appUsedConfig.name}</span>
                        </div>
                      ) : null}
                      {utrNumber && paymentMethod === "upi" && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                          <ShieldCheck className="size-3.5 text-blue-500" />
                          <span className="text-xs text-blue-700 font-mono">UTR {utrNumber}</span>
                        </div>
                      )}
                      {razorpayPaymentId && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                          <ShieldCheck className="size-3.5 text-blue-500" />
                          <span className="text-xs text-blue-700 font-mono">{razorpayPaymentId.slice(0, 16)}…</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="size-24 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="size-12 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-600">Payment Failed</p>
                    <p className="text-sm text-muted-foreground mt-1">You can try again.</p>
                  </div>
                </>
              )}

              {/* Receipt */}
              <div className="w-full bg-muted rounded-xl p-4 text-left space-y-2.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Receipt</p>
                <DetailRow label="Group" value={target.groupName} />
                <DetailRow label="Amount" value={`₹${parsedAmount.toLocaleString()}`} highlight />
                <DetailRow label="To (UPI)" value={upiId.trim()} mono />
                <DetailRow label="Via" value={paymentMethod === "razorpay" ? "Razorpay" : appUsedConfig?.name || "UPI"} />
                <DetailRow label="Month" value={`Month ${target.month}`} />
                {utrNumber && paymentMethod === "upi" && <DetailRow label="UTR" value={utrNumber} mono />}
                {razorpayPaymentId && <DetailRow label="Payment ID" value={razorpayPaymentId} mono />}
                {shortRef && <DetailRow label="Ref" value={shortRef} mono />}
                <DetailRow label="Status" value={paymentStatus === "success" ? "✓ Paid" : "✗ Failed"} />
                <DetailRow label="Time"
                  value={new Date(savedTxn.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} />
              </div>

              {paymentStatus === "failed" && (
                <Button variant="outline" className="w-full" onClick={() => {
                  setStep("details"); setSavedTxn(null); setUtrNumber(""); setUtrError(""); setError("");
                }}>
                  <RefreshCw className="size-4 mr-1.5" /> Try Again
                </Button>
              )}
            </div>

            <div className="px-6 pb-6 border-t pt-4">
              <Button className="w-full h-11" onClick={() => onOpenChange(false)}>Done</Button>
            </div>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}

// ── Helper ────────────────────────────────────────────────────────────────────
function DetailRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-right truncate max-w-[200px] ${highlight ? "font-bold text-primary text-sm" : mono ? "font-mono" : "font-medium"}`}>{value}</span>
    </div>
  );
}
