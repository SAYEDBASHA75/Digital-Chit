import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Search, ArrowUpRight, RefreshCw, Loader2, AlertCircle,
  CheckCircle2, XCircle, Wallet, ShieldCheck, Clock, Trash2,
} from "lucide-react";
import { projectId } from "/utils/supabase/info";
import { useLanguage } from "../../contexts/LanguageContext";

interface Transaction {
  id: string;
  paymentId?: string;
  shortRef?: string;
  groupId?: string;
  groupName: string;
  amount: number;
  recipientUpiId: string;
  recipientName?: string;
  appUsed?: string;
  utrNumber?: string;
  razorpayPaymentId?: string;
  status: "success" | "failed" | "pending" | "expired";
  month?: number;
  note?: string;
  createdAt: string;
  _source?: "transaction" | "payment";
}

interface Payment {
  id: string;
  shortRef: string;
  groupId?: string;
  groupName: string;
  amount: number;
  recipientUpiId: string;
  recipientName?: string;
  appUsed?: string;
  status: "pending" | "success" | "failed" | "expired";
  month?: number;
  note?: string;
  initiatedAt: string;
  expiresAt: string;
  confirmedAt?: string;
}

const APP_LABELS: Record<string, string> = {
  gpay: "Google Pay",
  phonepe: "PhonePe",
  paytm: "Paytm",
  upi_qr: "UPI QR",
  razorpay: "Razorpay",
  cash: "Cash",
  bank_transfer: "Bank Transfer",
  cheque: "Cheque",
  online_transfer: "Online Transfer",
};

type FilterStatus = "all" | "success" | "failed" | "pending";

interface PaymentsPageProps {
  accessToken: string;
}

export function PaymentsPage({ accessToken }: PaymentsPageProps) {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [clearing, setClearing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [txnRes, payRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/transactions`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/payments`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const txnData = txnRes.ok ? await txnRes.json() : { transactions: [] };
      const payData = payRes.ok ? await payRes.json() : { payments: [] };

      // Show confirmed transactions + pending payments not yet confirmed
      const confirmedPaymentIds = new Set(
        (txnData.transactions || []).map((t: Transaction) => t.paymentId).filter(Boolean)
      );

      const pendingRows: Transaction[] = (payData.payments || [])
        .filter((p: Payment) => !confirmedPaymentIds.has(p.id))
        .map((p: Payment) => ({
          id: p.id,
          shortRef: p.shortRef,
          groupId: p.groupId,
          groupName: p.groupName || "Payment",
          amount: p.amount,
          recipientUpiId: p.recipientUpiId,
          recipientName: p.recipientName,
          appUsed: p.appUsed,
          status: p.status,
          month: p.month,
          note: p.note,
          createdAt: p.initiatedAt,
          _source: "payment" as const,
        }));

      const confirmedRows: Transaction[] = (txnData.transactions || []).map((t: Transaction) => ({
        ...t,
        _source: "transaction" as const,
      }));

      const merged = [...confirmedRows, ...pendingRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setTransactions(merged);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    if (!confirm("Delete all transaction history? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/transactions`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setTransactions([]);
    } catch { /* ignore */ }
    finally { setClearing(false); }
  };

  useEffect(() => { fetchAll(); }, [accessToken]);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.groupName?.toLowerCase().includes(search.toLowerCase()) ||
      t.note?.toLowerCase().includes(search.toLowerCase()) ||
      t.recipientUpiId?.toLowerCase().includes(search.toLowerCase()) ||
      t.utrNumber?.includes(search) ||
      t.razorpayPaymentId?.includes(search) ||
      t.shortRef?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "pending" ? t.status === "pending" || t.status === "expired" : t.status === filter);
    return matchSearch && matchFilter;
  });

  const totalPaid = transactions.filter((t) => t.status === "success").reduce((s, t) => s + t.amount, 0);
  const totalFailed = transactions.filter((t) => t.status === "failed").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const successRate = transactions.length
    ? Math.round((transactions.filter((t) => t.status === "success").length / transactions.length) * 100)
    : 0;

  const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    success: { label: t("pay.success"), bg: "bg-green-100", text: "text-green-700", icon: <CheckCircle2 className="size-4 text-green-600" /> },
    failed:  { label: t("pay.failed"),  bg: "bg-red-100",   text: "text-red-600",   icon: <XCircle className="size-4 text-red-500" /> },
    pending: { label: "Pending",        bg: "bg-amber-100", text: "text-amber-700", icon: <Clock className="size-4 text-amber-600" /> },
    expired: { label: "Expired",        bg: "bg-gray-100",  text: "text-gray-500",  icon: <XCircle className="size-4 text-gray-400" /> },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t("pay.history")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">All chit group payment transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`size-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </Button>
          {transactions.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAll} disabled={clearing}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
              {clearing ? <Loader2 className="size-4 mr-1.5 animate-spin" /> : <Trash2 className="size-4 mr-1.5" />}
              Clear History
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="size-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      )}

      {!loading && error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center text-center gap-3">
              <AlertCircle className="size-8 text-destructive" />
              <p className="font-semibold text-destructive">{error}</p>
              <Button onClick={fetchAll} size="sm" variant="outline">
                <RefreshCw className="size-4 mr-1.5" /> {t("common.retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          {/* Summary stats */}
          {transactions.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-1">
                    <ArrowUpRight className="size-4 text-green-600" />
                    <p className="text-xs text-muted-foreground">{t("pay.totalPaid")}</p>
                    <p className="text-lg font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-1">
                    <XCircle className="size-4 text-red-500" />
                    <p className="text-xs text-muted-foreground">Failed</p>
                    <p className="text-lg font-bold text-red-600">{totalFailed}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-1">
                    <Clock className="size-4 text-amber-500" />
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-lg font-bold text-amber-600">{pendingCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col gap-1">
                    <CheckCircle2 className="size-4 text-primary" />
                    <p className="text-xs text-muted-foreground">{t("pay.successRate")}</p>
                    <p className="text-lg font-bold">{successRate}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {transactions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-10 pb-10">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="size-16 bg-muted rounded-full flex items-center justify-center">
                    <Wallet className="size-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t("common.noData")}</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                      Your payment history will appear here once you make a contribution.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <CardTitle className="text-base">
                    Transaction History
                    <span className="ml-2 text-sm font-normal text-muted-foreground">({transactions.length})</span>
                  </CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      placeholder={`${t("common.search")} by group, UTR, reference…`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <div className="flex rounded-lg border overflow-hidden shrink-0">
                    {(["all", "success", "failed", "pending"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                          filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {f === "all" ? "All" : f === "success" ? t("pay.success") : f === "failed" ? t("pay.failed") : "Pending"}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">{t("common.noData")}</div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((tx) => {
                      const sc = statusConfig[tx.status] || statusConfig.failed;
                      return (
                        <div
                          key={tx.id}
                          className={`flex items-center justify-between p-3 border rounded-xl hover:bg-muted/40 transition-colors gap-3 ${
                            tx.status === "failed"  ? "border-red-100 bg-red-50/30" :
                            tx.status === "pending" ? "border-amber-100 bg-amber-50/20" :
                            tx.status === "expired" ? "border-gray-100 bg-gray-50/30" : ""
                          }`}
                        >
                          <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${sc.bg}`}>
                            {sc.icon}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{tx.groupName || "Payment"}</p>
                              {tx.month && <Badge variant="secondary" className="text-xs shrink-0">M{tx.month}</Badge>}
                              {tx.appUsed && (
                                <span className="text-xs text-muted-foreground shrink-0">
                                  via {APP_LABELS[tx.appUsed] || tx.appUsed}
                                </span>
                              )}
                              {tx._source === "payment" && tx.status === "pending" && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                  awaiting UTR
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              To: {tx.recipientUpiId || "—"}
                              {tx.recipientName ? ` · ${tx.recipientName}` : ""}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                              </p>
                              {tx.utrNumber && (
                                <span className="flex items-center gap-1 text-[10px] text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded">
                                  <ShieldCheck className="size-2.5" /> UTR {tx.utrNumber}
                                </span>
                              )}
                              {tx.razorpayPaymentId && (
                                <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: "#3395FF15", color: "#0052CC" }}>
                                  <ShieldCheck className="size-2.5" /> {tx.razorpayPaymentId.slice(0, 14)}…
                                </span>
                              )}
                              {tx.shortRef && !tx.utrNumber && !tx.razorpayPaymentId && (
                                <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                                  {tx.shortRef}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <p className={`font-bold text-sm ${
                              tx.status === "success" ? "text-foreground"
                              : tx.status === "pending" ? "text-amber-700"
                              : "text-red-500"
                            }`}>
                              {tx.status === "success" ? "-" : ""}₹{tx.amount.toLocaleString()}
                            </p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5 ${sc.bg} ${sc.text}`}>
                              {sc.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
