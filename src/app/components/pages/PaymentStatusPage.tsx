import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, Clock, XCircle, IndianRupee, TrendingUp, AlertCircle } from "lucide-react";

const payments = [
  { id: "1", group: "Gold Chit Group", month: "May 2026", amount: 5000, dueDate: "2026-05-01", paidDate: "2026-04-28", status: "paid" as const },
  { id: "2", group: "Silver Savings", month: "May 2026", amount: 3000, dueDate: "2026-05-05", paidDate: "2026-05-04", status: "paid" as const },
  { id: "3", group: "Family Chit", month: "May 2026", amount: 2000, dueDate: "2026-05-10", paidDate: undefined, status: "pending" as const },
  { id: "4", group: "Office Fund", month: "Apr 2026", amount: 4000, dueDate: "2026-04-01", paidDate: "2026-04-01", status: "paid" as const },
  { id: "5", group: "Community Chit", month: "Apr 2026", amount: 1500, dueDate: "2026-04-05", paidDate: undefined, status: "overdue" as const },
  { id: "6", group: "Gold Chit Group", month: "Apr 2026", amount: 5000, dueDate: "2026-04-01", paidDate: "2026-03-30", status: "paid" as const },
];

const statusConfig = {
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    iconClass: "text-green-600",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    badgeClass: "bg-yellow-100 text-yellow-700 border-yellow-200",
    iconClass: "text-yellow-600",
  },
  overdue: {
    label: "Overdue",
    icon: XCircle,
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    iconClass: "text-red-600",
  },
};

export function PaymentStatusPage() {
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status !== "paid").reduce((s, p) => s + p.amount, 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;
  const overdueCount = payments.filter((p) => p.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Status</h1>
        <p className="text-muted-foreground mt-1">Track your contribution payments across all chit groups</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="size-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Paid</span>
            </div>
            <p className="text-xl font-bold">₹{totalPaid.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{paidCount} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="size-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Due</span>
            </div>
            <p className="text-xl font-bold">₹{totalPending.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{payments.length - paidCount} payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="size-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Overdue</span>
            </div>
            <p className="text-xl font-bold text-red-600">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-xs text-muted-foreground">On-time Rate</span>
            </div>
            <p className="text-xl font-bold">{Math.round((paidCount / payments.length) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Great track record</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map((payment) => {
              const cfg = statusConfig[payment.status];
              const StatusIcon = cfg.icon;
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-full flex items-center justify-center ${
                      payment.status === "paid" ? "bg-green-100" : payment.status === "overdue" ? "bg-red-100" : "bg-yellow-100"
                    }`}>
                      <StatusIcon className={`size-4 ${cfg.iconClass}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{payment.group}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.month} • Due: {payment.dueDate}
                        {payment.paidDate && ` • Paid: ${payment.paidDate}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm">₹{payment.amount.toLocaleString()}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
