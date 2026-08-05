import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Users, IndianRupee, Calendar, Wallet } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface ChitGroupCardProps {
  group: {
    id: string;
    name: string;
    totalAmount: number;
    monthlyContribution: number;
    duration: number;
    currentMonth: number;
    totalMembers: number;
    status: "active" | "upcoming" | "completed";
    nextBidDate: string;
    organizerUpiId?: string;
    organizerName?: string;
  };
  accessToken?: string;
  onViewDetails: (id: string) => void;
  onPayNow?: (group: ChitGroupCardProps["group"]) => void;
}

export function ChitGroupCard({ group, onViewDetails, onPayNow }: ChitGroupCardProps) {
  const { t } = useLanguage();

  const statusColors = {
    active: "default",
    upcoming: "secondary",
    completed: "outline",
  } as const;

  const statusLabels = {
    active: t("group.status.active"),
    upcoming: t("group.status.upcoming"),
    completed: t("group.status.completed"),
  };

  const progress = (group.currentMonth / group.duration) * 100;
  const canPay = group.status === "active";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <CardTitle className="truncate">{group.name}</CardTitle>
            <CardDescription>
              {group.currentMonth} {t("group.of")} {group.duration} {t("group.month")}s
            </CardDescription>
          </div>
          <Badge variant={statusColors[group.status]} className="shrink-0">
            {statusLabels[group.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="size-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("group.monthly")}</p>
              <p className="font-semibold truncate">₹{group.monthlyContribution.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">{t("group.members")}</p>
              <p className="font-semibold">{group.totalMembers}</p>
            </div>
          </div>
        </div>

        {/* Pool value */}
        <div className="flex items-center justify-between text-sm px-0.5">
          <span className="text-muted-foreground">{t("group.totalPool")}</span>
          <span className="font-bold text-primary">₹{group.totalAmount.toLocaleString()}</span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{t("group.progress")}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {group.status === "active" && group.nextBidDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">{t("group.nextBid")}:</span>
            <span className="font-medium">{group.nextBidDate}</span>
          </div>
        )}

        {group.organizerUpiId && (
          <div className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5">
            <Wallet className="size-3 text-blue-500 shrink-0" />
            <span className="text-blue-700 font-mono truncate">{group.organizerUpiId}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className={`mt-auto grid gap-2 ${canPay && onPayNow ? "grid-cols-2" : "grid-cols-1"}`}>
          <Button onClick={() => onViewDetails(group.id)} variant="outline" className="w-full">
            {t("group.viewDetails")}
          </Button>
          {canPay && onPayNow && (
            <Button
              onClick={() => onPayNow(group)}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Wallet className="size-3.5 mr-1.5" />
              {t("group.payNow")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
