import { useEffect } from "react";
import { toast } from "sonner";
import { Sparkles, Users, Wallet, Calendar, AlertCircle } from "lucide-react";

interface AIWelcomeAssistantProps {
  userName: string;
  role: string;
  groupCount?: number;
  pendingPayments?: number;
  lastLogin?: string;
}

export function AIWelcomeAssistant({
  userName,
  role,
  groupCount = 0,
  pendingPayments = 0,
  lastLogin,
}: AIWelcomeAssistantProps) {
  useEffect(() => {
    // Delay slightly to let the UI settle after login
    const timer = setTimeout(() => {
      showWelcomeMessage();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
  };

  const getContextualMessage = () => {
    const messages = [];

    if (role === "admin") {
      messages.push(`You're managing ${groupCount} chit ${groupCount === 1 ? "group" : "groups"}.`);
      if (pendingPayments > 0) {
        messages.push(`⚠️ ${pendingPayments} payment${pendingPayments === 1 ? "" : "s"} awaiting confirmation.`);
      }
    } else {
      messages.push(`You're a member of ${groupCount} chit ${groupCount === 1 ? "group" : "groups"}.`);
      if (pendingPayments > 0) {
        messages.push(`💰 You have ${pendingPayments} pending contribution${pendingPayments === 1 ? "" : "s"}.`);
      }
    }

    return messages;
  };

  const getQuickActions = () => {
    if (role === "admin") {
      return [
        "• Create a new chit group",
        "• Review member contributions",
        "• Send broadcast alerts",
      ];
    } else {
      return [
        "• Make a contribution",
        "• Check group details",
        "• View payment history",
      ];
    }
  };

  const showWelcomeMessage = () => {
    const greeting = getGreeting();
    const contextMessages = getContextualMessage();
    const quickActions = getQuickActions();

    toast(
      <div className="flex flex-col gap-2 w-full">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="size-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {greeting}, {userName}! 👋
            </p>
            <p className="text-xs text-muted-foreground">AI Assistant here to help</p>
          </div>
        </div>

        <div className="space-y-1 pl-10">
          {contextMessages.map((msg, i) => (
            <p key={i} className="text-xs text-foreground/80">
              {msg}
            </p>
          ))}

          {lastLogin && (
            <p className="text-[11px] text-muted-foreground italic mt-1">
              Last login: {new Date(lastLogin).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}

          <div className="pt-2 border-t mt-2">
            <p className="text-xs font-medium text-foreground/70 mb-1">
              Quick actions you can try:
            </p>
            {quickActions.map((action, i) => (
              <p key={i} className="text-[11px] text-muted-foreground">
                {action}
              </p>
            ))}
          </div>
        </div>
      </div>,
      {
        duration: 8000,
        icon: null,
        className: "border-blue-200 bg-blue-50/80 backdrop-blur-sm",
      }
    );
  };

  return null;
}
