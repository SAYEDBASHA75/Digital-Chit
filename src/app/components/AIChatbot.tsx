import { useState, useEffect, useRef, useCallback } from "react";
import { projectId } from "/utils/supabase/info";
import {
  X, Send, Bot, Loader2, Sparkles, ChevronDown,
  RotateCcw, Mic,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

interface AIChatbotProps {
  accessToken: string;
  user: any;
  userRole: "admin" | "member";
  groupContext?: string; // brief summary of user's groups
  autoOpen?: boolean;   // open on first login
  onAutoOpenDone?: () => void;
}

const QUICK_QUESTIONS = [
  "How does a chit fund work?",
  "How do I pay my contribution?",
  "What is a UTR number?",
  "How does the bidding work?",
  "How do I add members to my group?",
];

const WELCOME = (name: string, role: string) =>
  `Namaste ${name}! 🙏 I'm ChitBot, your AI assistant for this Chit Fund app.\n\nI can help you with payments, contributions, group management${role === "admin" ? ", member management" : ""}, and any questions about chit funds. How can I help you today?`;

export function AIChatbot({
  accessToken,
  user,
  userRole,
  groupContext,
  autoOpen = false,
  onAutoOpenDone,
}: AIChatbotProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const autoOpenedRef = useRef(false);

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "there";

  // Auto-open on first login
  useEffect(() => {
    if (autoOpen && !autoOpenedRef.current && accessToken) {
      autoOpenedRef.current = true;
      setTimeout(() => {
        setOpen(true);
        setMessages([
          {
            role: "assistant",
            content: WELCOME(userName, userRole),
            ts: Date.now(),
          },
        ]);
        onAutoOpenDone?.();
      }, 1200);
    }
  }, [autoOpen, accessToken]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  // Unread badge when minimized
  useEffect(() => {
    if (minimized && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant") setUnread((u) => u + 1);
    }
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
    if (messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: WELCOME(userName, userRole),
          ts: Date.now(),
        },
      ]);
    }
    setTimeout(() => inputRef.current?.focus(), 200);
  };

  const handleClose = () => {
    setOpen(false);
    setMinimized(false);
  };

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      setInput("");
      setError("");
      setShowQuick(false);

      const userMsg: Message = { role: "user", content: msg, ts: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      // Build history without the current message (already sent above)
      const history = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-ca64c5bf/chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ message: msg, history, groupContext }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to get response");
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, ts: Date.now() },
          ]);
        }
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [input, loading, messages, accessToken, groupContext]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([
      { role: "assistant", content: WELCOME(userName, userRole), ts: Date.now() },
    ]);
    setShowQuick(true);
    setError("");
  };

  // ── Floating button (closed state) ────────────────────────────────────────────
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-40 size-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        title="ChitBot AI Assistant"
      >
        <Bot className="size-7 text-white" />
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-2xl bg-violet-500/30 animate-ping pointer-events-none" />
      </button>
    );
  }

  // ── Chat window ───────────────────────────────────────────────────────────────
  return (
    <div
      className={`fixed z-50 flex flex-col shadow-2xl border border-border rounded-2xl overflow-hidden transition-all duration-300 ${
        minimized
          ? "bottom-20 left-4 md:bottom-6 md:left-6 w-64 h-14"
          : "bottom-20 left-2 right-2 md:bottom-6 md:left-6 md:right-auto md:w-96 h-[560px] max-h-[80dvh]"
      }`}
      style={{ background: "var(--background)" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 shrink-0 cursor-pointer select-none"
        style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
        onClick={() => { if (minimized) { setMinimized(false); setUnread(0); } }}
      >
        <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Bot className="size-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">ChitBot</p>
          {!minimized && (
            <p className="text-white/70 text-[11px] flex items-center gap-1">
              <Sparkles className="size-2.5" /> AI Assistant · Always here to help
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="New conversation"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setMinimized((m) => !m); setUnread(0); }}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title={minimized ? "Expand" : "Minimise"}
          >
            <ChevronDown className={`size-4 transition-transform ${minimized ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleClose(); }}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="size-7 rounded-xl shrink-0 flex items-center justify-center mt-0.5"
                    style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                    <Bot className="size-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="size-7 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}>
                  <Bot className="size-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="size-1.5 bg-muted-foreground/60 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                  {error}
                </p>
              </div>
            )}

            {/* Quick questions (shown initially) */}
            {showQuick && messages.length <= 1 && !loading && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-muted-foreground font-medium px-1">Quick questions:</p>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition-colors text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input area ── */}
          <div className="shrink-0 border-t px-3 py-2.5 bg-card">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about chit funds…"
                rows={1}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-60 max-h-24 overflow-y-auto"
                style={{ lineHeight: "1.5" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 96) + "px";
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="size-9 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
                style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)" }}
              >
                {loading
                  ? <Loader2 className="size-4 text-white animate-spin" />
                  : <Send className="size-4 text-white" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              Powered by Claude AI · Ask in any language
            </p>
          </div>
        </>
      )}
    </div>
  );
}
