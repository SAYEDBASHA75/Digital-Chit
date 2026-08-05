import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Bell, Send, Volume2, AlertTriangle, Info, IndianRupee,
  CheckCircle2, Zap, Loader2, RefreshCw, Megaphone,
  Gavel, Trophy, Calendar, Users, CreditCard, Clock,
  MessageSquare, ChevronDown, ChevronUp, Pencil,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";

interface Alert {
  id: string;
  groupId: string;
  sentBy: string;
  sentByName: string;
  message: string;
  alertType: "info" | "warning" | "payment" | "urgent" | "success";
  createdAt: string;
}

interface GroupAlertsProps {
  groupId: string;
  groupName: string;
  accessToken: string;
  isAdmin: boolean;
  currentMonth?: number;
  monthlyContribution?: number;
}

const TYPE_CONFIG: Record<string, {
  icon: React.ReactNode; bg: string; border: string; text: string; badge: string; label: string;
}> = {
  info:    { icon: <Info className="size-4" />,          bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-800",   badge: "bg-blue-100 text-blue-700",    label: "Info" },
  warning: { icon: <AlertTriangle className="size-4" />, bg: "bg-amber-50",   border: "border-amber-200",  text: "text-amber-800",  badge: "bg-amber-100 text-amber-700",  label: "Warning" },
  payment: { icon: <IndianRupee className="size-4" />,   bg: "bg-green-50",   border: "border-green-200",  text: "text-green-800",  badge: "bg-green-100 text-green-700",  label: "Payment Due" },
  urgent:  { icon: <Zap className="size-4" />,           bg: "bg-red-50",     border: "border-red-200",    text: "text-red-800",    badge: "bg-red-100 text-red-700",      label: "Urgent" },
  success: { icon: <CheckCircle2 className="size-4" />,  bg: "bg-emerald-50", border: "border-emerald-200",text: "text-emerald-800",badge: "bg-emerald-100 text-emerald-700",label: "Success" },
};

const ALERT_TYPES = ["info", "warning", "payment", "urgent", "success"] as const;

export function GroupAlerts({
  groupId, groupName, accessToken, isAdmin,
  currentMonth = 1, monthlyContribution = 0,
}: GroupAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [alertType, setAlertType] = useState<Alert["alertType"]>("info");
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf`;

  // Template definitions
  const templates = [
    {
      id: "payment_due",
      label: "Payment Reminder",
      icon: <IndianRupee className="size-4" />,
      color: "text-green-700 bg-green-50 border-green-200 hover:bg-green-100",
      alertType: "payment" as const,
      message: `Reminder: Monthly contribution of ₹${monthlyContribution.toLocaleString()} for Month ${currentMonth} is due. Please pay via GPay, PhonePe, or Paytm and submit your UTR number in the app.`,
    },
    {
      id: "bid_open",
      label: "Bid Now Open",
      icon: <Gavel className="size-4" />,
      color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100",
      alertType: "info" as const,
      message: `Auction for Month ${currentMonth} is now open! Place your bid in the app. The member with the lowest bid wins the pool. Bidding closes soon — don't miss your chance.`,
    },
    {
      id: "bid_closing",
      label: "Bid Closing Soon",
      icon: <Clock className="size-4" />,
      color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100",
      alertType: "warning" as const,
      message: `⏰ Hurry! Bidding for Month ${currentMonth} is closing soon. If you haven't placed your bid yet, do it now in the app before the auction closes.`,
    },
    {
      id: "late_payment",
      label: "Late Payment Warning",
      icon: <AlertTriangle className="size-4" />,
      color: "text-red-700 bg-red-50 border-red-200 hover:bg-red-100",
      alertType: "urgent" as const,
      message: `⚠️ Urgent: Some members have not yet paid their Month ${currentMonth} contribution of ₹${monthlyContribution.toLocaleString()}. Please pay immediately to keep the group running smoothly.`,
    },
    {
      id: "all_paid",
      label: "All Contributions Received",
      icon: <CheckCircle2 className="size-4" />,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
      alertType: "success" as const,
      message: `✅ Great news! All members have paid their contributions for Month ${currentMonth}. The total pool of ₹${(monthlyContribution * 0).toLocaleString()} is now complete. Thank you everyone!`,
    },
    {
      id: "meeting",
      label: "Group Meeting",
      icon: <Users className="size-4" />,
      color: "text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100",
      alertType: "info" as const,
      message: `📅 Group meeting notice for ${groupName}. Please check your availability and confirm attendance. More details will follow.`,
    },
    {
      id: "winner",
      label: "Winner Announcement",
      icon: <Trophy className="size-4" />,
      color: "text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100",
      alertType: "success" as const,
      message: `🏆 Congratulations to this month's auction winner! Month ${currentMonth} winner has been announced. Check the Auction tab in the app for full details and the rebate breakdown.`,
    },
    {
      id: "upi_details",
      label: "UPI / Payment Details",
      icon: <CreditCard className="size-4" />,
      color: "text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
      alertType: "payment" as const,
      message: `Payment details for ${groupName}: Please send ₹${monthlyContribution.toLocaleString()} to the admin's UPI ID. After payment, enter your UTR / transaction number in the app under "Submit UTR" to confirm.`,
    },
    {
      id: "next_month",
      label: "Month Completion",
      icon: <Calendar className="size-4" />,
      color: "text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100",
      alertType: "success" as const,
      message: `Month ${currentMonth} has been completed successfully! 🎉 We are now moving to Month ${currentMonth + 1}. Stay active and keep contributing — let's keep the chit fund going strong!`,
    },
    {
      id: "custom",
      label: "Custom Message",
      icon: <Pencil className="size-4" />,
      color: "text-muted-foreground bg-muted border-border hover:bg-muted/70",
      alertType: "info" as const,
      message: "",
    },
  ];

  const fetchAlerts = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${BASE}/groups/${groupId}/alerts`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to load alerts"); return; }
      setAlerts(data.alerts || []);
    } catch { setError("Network error loading alerts"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAlerts(); }, [groupId]);

  const applyTemplate = (t: typeof templates[0]) => {
    setActiveTemplateId(t.id);
    setAlertType(t.alertType);
    setMessage(t.message);
    setSendError("");
  };

  const handleSend = async () => {
    if (!message.trim()) { setSendError("Please enter a message"); return; }
    setSending(true); setSendError("");
    try {
      const res = await fetch(`${BASE}/groups/${groupId}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ message: message.trim(), alertType }),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.error || "Failed to send alert"); return; }
      setAlerts((prev) => [data.alert, ...prev]);
      setMessage(""); setActiveTemplateId(null);
    } catch { setSendError("Network error. Please try again."); }
    finally { setSending(false); }
  };

  const speakAlert = (alert: Alert) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = `${TYPE_CONFIG[alert.alertType]?.label || "Alert"} from ${alert.sentByName}: ${alert.message}`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-IN"; utt.rate = 0.88;
    utt.onstart = () => setSpeakingId(alert.id);
    utt.onend = () => setSpeakingId(null);
    utt.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="space-y-4">

      {/* ── Broadcast composer (admin only) ── */}
      {isAdmin && (
        <div className="border border-dashed border-primary/40 rounded-xl bg-primary/[0.02] space-y-4 p-4">
          <div className="flex items-center gap-2">
            <Megaphone className="size-4 text-primary" />
            <p className="text-sm font-semibold">Broadcast to All Members</p>
          </div>

          {/* Template picker */}
          <div>
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              <MessageSquare className="size-3.5" />
              Quick Templates
              {showTemplates ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {showTemplates && (
              <div className="grid grid-cols-2 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => applyTemplate(t)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-all ${
                      activeTemplateId === t.id
                        ? `${t.color} ring-2 ring-offset-1 ring-current`
                        : t.color
                    }`}
                  >
                    <span className="shrink-0">{t.icon}</span>
                    <span className="leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Alert type pills */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Alert Type</p>
            <div className="flex gap-1.5 flex-wrap">
              {ALERT_TYPES.map((t) => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <button
                    key={t}
                    onClick={() => setAlertType(t)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      alertType === t
                        ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message textarea */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Message</p>
            <textarea
              value={message}
              onChange={(e) => { setMessage(e.target.value); setSendError(""); }}
              placeholder={`Type your message to all ${groupName} members, or pick a template above…`}
              className="w-full min-h-[90px] rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={sending}
            />
            {sendError && <p className="text-xs text-destructive">{sendError}</p>}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              {message.length > 0 ? `${message.length} characters` : "All members will see this immediately."}
            </p>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              size="sm"
              className="shrink-0"
            >
              {sending
                ? <><Loader2 className="size-3.5 mr-1.5 animate-spin" />Sending…</>
                : <><Send className="size-3.5 mr-1.5" />Send Alert</>}
            </Button>
          </div>
        </div>
      )}

      {/* ── Alerts list ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Group Alerts</h3>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-xs">{alerts.length}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchAlerts} disabled={loading} className="h-7 px-2">
          <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-6 text-primary animate-spin" />
        </div>
      )}

      {!loading && error && (
        <p className="text-sm text-destructive text-center py-6">{error}</p>
      )}

      {!loading && !error && alerts.length === 0 && (
        <div className="text-center py-10 space-y-2">
          <Bell className="size-10 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">No alerts yet.</p>
          {isAdmin && (
            <p className="text-xs text-muted-foreground">Use the composer above to broadcast a message to all members.</p>
          )}
        </div>
      )}

      {!loading && !error && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const cfg = TYPE_CONFIG[alert.alertType] || TYPE_CONFIG.info;
            const isSpeaking = speakingId === alert.id;
            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border ${cfg.bg} ${cfg.border} space-y-1.5`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cfg.text}>{cfg.icon}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-muted-foreground">from {alert.sentByName}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (isSpeaking) { window.speechSynthesis?.cancel(); setSpeakingId(null); }
                      else speakAlert(alert);
                    }}
                    title="Read aloud"
                    className={`p-1.5 rounded-lg transition-colors ${
                      isSpeaking ? "bg-primary text-primary-foreground animate-pulse" : "hover:bg-white/60"
                    }`}
                  >
                    <Volume2 className="size-3.5" />
                  </button>
                </div>
                <p className={`text-sm leading-relaxed ${cfg.text}`}>{alert.message}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(alert.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
