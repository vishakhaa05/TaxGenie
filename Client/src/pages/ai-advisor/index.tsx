import { useState, useEffect, useRef } from "react";
import PageLayout from "@/components/page-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  PiggyBank, 
  BookOpen, 
  ShieldCheck, 
  TrendingUp, 
  Coins, 
  ArrowRight, 
  Lightbulb, 
  Info, 
  FileText, 
  ExternalLink,
  ShieldAlert,
  X,
  Flame,
  CheckCircle2,
  Calendar,
  Layers
} from "lucide-react";
import {
  useAskAiChatMutation,
  useGetSavingsAdviceMutation,
  useGetSpendingAnomaliesQuery,
} from "@/features/ai-advisor/aiAdvisorAPI";
import { SavingsAdviceResult } from "@/features/ai-advisor/aiAdvisorType";
import { useAppSelector } from "@/app/hook";

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

// Markdown and Structured Text Formatter for Tax Responses
function FormattedAiResponse({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-foreground/90">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header ###
        if (trimmed.startsWith("### ")) {
          return (
            <div key={idx} className="pt-2 pb-1 border-b border-border/40">
              <h4 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>{trimmed.replace("### ", "")}</span>
              </h4>
            </div>
          );
        }

        // Pro-tip callout
        if (trimmed.startsWith("💡")) {
          return (
            <div
              key={idx}
              className="my-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs"
            >
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>{renderInlineFormatting(trimmed.replace("💡", "").trim())}</div>
            </div>
          );
        }

        // Bullet points • or -
        if (trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const bulletText = trimmed.replace(/^[•\-\*]\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 my-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
              <div className="flex-1">{renderInlineFormatting(bulletText)}</div>
            </div>
          );
        }

        // Numbered lists 1. 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch && numMatch[1] && numMatch[2]) {
          return (
            <div key={idx} className="flex items-start gap-3 pl-1 my-1.5">
              <span className="w-5 h-5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                {numMatch[1]}
              </span>
              <div className="flex-1">{renderInlineFormatting(numMatch[2])}</div>
            </div>
          );
        }

        return <p key={idx}>{renderInlineFormatting(trimmed)}</p>;
      })}
    </div>
  );
}

// Render bold **text**, code `text`, and currency ₹ highlights
function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded-md bg-muted text-indigo-600 dark:text-indigo-300 font-mono text-xs border border-border/50"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AiAdvisor() {
  const user = useAppSelector((state) => state.auth.user);
  const userName = user?.name ? user.name.split(" ")[0] : "Taxpayer";

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ai",
      text: `Namaste ${userName}! 🙏 I am TaxGenie AI, your specialized Indian Income Tax & GST Assistant.\n\nI can calculate your tax liabilities under the **New Regime (FY 2026-27)**, optimize your Section 80C/80D deductions, guide your HRA calculations, or assist with GST compliance.\n\nHow can I help you save tax today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [question, setQuestion] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [askChat, { isLoading: isAsking }] = useAskAiChatMutation();

  // Savings Advisor Inputs
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [fixedExpenses, setFixedExpenses] = useState<number>(45000);
  const [existingSavings, setExistingSavings] = useState<number>(150000);
  const [riskAppetite, setRiskAppetite] = useState<"CONSERVATIVE" | "MODERATE" | "AGGRESSIVE">("MODERATE");
  const [adviceResult, setAdviceResult] = useState<SavingsAdviceResult | null>(null);

  const [getSavingsAdvice, { isLoading: isAdviceLoading }] = useGetSavingsAdviceMutation();
  const { data: anomalyData } = useGetSpendingAnomaliesQuery();
  const [dismissedAnomalies, setDismissedAnomalies] = useState<string[]>([]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAsking]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || question).trim();
    if (!textToSend) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setQuestion("");

    try {
      const res = await askChat({ question: textToSend }).unwrap();
      if (res.success) {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to reach TaxGenie AI. Please try again.");
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        sender: "ai",
        text: `Session refreshed. Ask me any question on Indian Income Tax, Section 80C/80D, HRA exemption, or GST rules!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    toast.info("Conversation reset");
  };

  const handleCalculateSavings = async () => {
    try {
      const res = await getSavingsAdvice({
        monthlyIncome,
        fixedExpenses,
        existingSavings,
        riskAppetite,
      }).unwrap();
      if (res.success) {
        setAdviceResult(res.advice);
      }
    } catch {
      // silently handled
    }
  };

  useEffect(() => {
    handleCalculateSavings();
  }, [monthlyIncome, fixedExpenses, existingSavings, riskAppetite]);

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const curatedPromptGroups = [
    {
      category: "Popular FY 2026-27",
      prompts: [
        { label: "Old vs New: Compare FY 2026-27", query: "Which regime is better: Old or New for FY 2026-27?" },
        { label: "Zero Tax up to ₹12 Lakhs (87A)", query: "What is Section 87A rebate and marginal relief?" },
      ],
    },
    {
      category: "Deductions & Relief",
      prompts: [
        { label: "Section 80C Best Options", query: "How can I reduce tax under Section 80C?" },
        { label: "HRA Exemption Formula (10(13A))", query: "How does HRA exemption work under Section 10(13A)?" },
        { label: "Parents Health Insurance (80D)", query: "Can I claim Section 80D for parents health insurance?" },
      ],
    },
    {
      category: "Business & Wealth",
      prompts: [
        { label: "GST Registration Thresholds", query: "What is GST and who needs mandatory registration?" },
        { label: "Extra ₹50,000 in NPS (80CCD)", query: "What is the extra ₹50,000 tax deduction under NPS 80CCD(1B)?" },
      ],
    },
  ];

  return (
    <PageLayout
      title="TaxGenie AI Assistant"
      subtitle="Your interactive AI advisor for Indian Income Tax, Section deductions, GST, and smart wealth planning."
      addMarginTop
    >
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Spending Anomalies Alert Banner */}
        {anomalyData && anomalyData.anomalyCount > 0 && (
          <div className="space-y-3">
            {anomalyData.anomalies
              .filter((a) => !dismissedAnomalies.includes(a.title + a.amount))
              .map((anomaly, idx) => (
                <div 
                  key={idx}
                  className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start justify-between gap-4 text-amber-950 dark:text-amber-200 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        Unusual Spending Detected: {anomaly.title} ({formatCurrency(anomaly.amount)})
                        <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                          {anomaly.category}
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {anomaly.reason}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => setDismissedAnomalies((prev) => [...prev, anomaly.title + anomaly.amount])}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
          </div>
        )}

        {/* Top Level Mode Tabs with Modern Glassmorphism Styling */}
        <Tabs defaultValue="chat" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <TabsList className="bg-slate-200/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-300/50 dark:border-slate-800 backdrop-blur-md shadow-xs">
              <TabsTrigger 
                value="chat" 
                className="gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <Bot className="w-4 h-4" />
                <span>AI Tax Copilot</span>
              </TabsTrigger>
              <TabsTrigger 
                value="savings" 
                className="gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <PiggyBank className="w-4 h-4" />
                <span>Emergency & Wealth</span>
              </TabsTrigger>
              <TabsTrigger 
                value="education" 
                className="gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold data-[state=active]:bg-white dark:data-[state=active]:bg-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Tax Mastery 101</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-xs px-3 py-1 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Income Tax Act 2025 Ready</span>
              </Badge>
            </div>
          </div>

          {/* TAB 1: MODERN AI COPILOT INTERFACE */}
          <TabsContent value="chat" className="pt-2 space-y-4">
            <Card className="border border-slate-200 dark:border-slate-800 bg-card rounded-2xl shadow-sm overflow-hidden">
              {/* Header Bar */}
              <div className="p-4 sm:p-5 border-b border-border/60 bg-gradient-to-r from-slate-50 via-indigo-50/20 to-sky-50/20 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                      <Sparkles className="w-5 h-5 text-amber-300" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">TaxGenie Financial AI</h3>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] px-2 py-0.5">
                        Online
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Statutory Tax Engine • Section 80C/80D/87A & GST Rules
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearChat}
                    className="h-8 text-xs gap-1.5 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Reset conversation"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="hidden sm:inline">Reset</span>
                  </Button>
                  <Link to="/tax-calculator">
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Open Calculator</span>
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Chat Canvas */}
              <CardContent className="p-4 sm:p-6 space-y-4">
                <div className="h-[460px] overflow-y-auto space-y-4 p-4 sm:p-5 rounded-2xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3.5 ${
                        msg.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {msg.sender === "ai" && (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`group relative max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-indigo-600/10"
                            : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-foreground rounded-tl-none"
                        }`}
                      >
                        {msg.sender === "ai" ? (
                          <FormattedAiResponse content={msg.text} />
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}

                        <div className="flex items-center justify-between gap-4 mt-2.5 pt-2 border-t border-border/20 text-[10px] text-muted-foreground/80">
                          <span>{msg.timestamp}</span>
                          {msg.sender === "ai" && (
                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="inline-flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {msg.sender === "user" && (
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs mt-1">
                          {userName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}

                  {isAsking && (
                    <div className="flex gap-3.5 justify-start items-center text-xs text-muted-foreground animate-pulse">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="p-3.5 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                        <span>TaxGenie AI is analyzing Indian Income Tax & GST rules...</span>
                      </div>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Curated Prompt Chips Carousel */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Suggested Tax & Wealth Questions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {curatedPromptGroups.flatMap((group) => group.prompts).map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(item.query)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating Modern Message Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="relative flex items-center gap-2 pt-2"
                >
                  <div className="relative flex-1">
                    <Input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask TaxGenie AI anything (e.g., 'How to claim HRA with ₹30,000 rent?')..."
                      className="pr-12 py-5 text-sm rounded-2xl bg-slate-50/80 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500"
                      disabled={isAsking}
                    />
                    <span className="hidden sm:inline absolute right-3.5 top-3.5 text-[10px] font-medium text-muted-foreground/60">
                      Enter ↵
                    </span>
                  </div>
                  <Button
                    type="submit"
                    disabled={isAsking || !question.trim()}
                    className="h-11 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-semibold">Send</span>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: SAVINGS & EMERGENCY FUND STRATEGY */}
          <TabsContent value="savings" className="pt-2 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Inputs */}
              <Card className="lg:col-span-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">Emergency & Wealth Inputs</CardTitle>
                      <CardDescription>Enter your cash flows to compute your ideal safety net</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome" className="text-xs font-semibold">
                      Monthly Take-Home Income (₹)
                    </Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      value={monthlyIncome || 0}
                      onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                      className="rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fixedExpenses" className="text-xs font-semibold">
                      Fixed Expenses (Rent, EMIs, Utilities, Food)
                    </Label>
                    <Input
                      id="fixedExpenses"
                      type="number"
                      value={fixedExpenses || 0}
                      onChange={(e) => setFixedExpenses(Number(e.target.value))}
                      className="rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="existingSavings" className="text-xs font-semibold">
                      Existing Liquid Savings & FDs
                    </Label>
                    <Input
                      id="existingSavings"
                      type="number"
                      value={existingSavings || 0}
                      onChange={(e) => setExistingSavings(Number(e.target.value))}
                      className="rounded-xl font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskAppetite" className="text-xs font-semibold">
                      Risk Appetite Profile
                    </Label>
                    <Select
                      value={riskAppetite}
                      onValueChange={(val: any) => setRiskAppetite(val)}
                    >
                      <SelectTrigger id="riskAppetite" className="rounded-xl">
                        <SelectValue placeholder="Select Risk Profile" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONSERVATIVE">Conservative (Capital Safety • FDs & Debt)</SelectItem>
                        <SelectItem value="MODERATE">Moderate (Balanced • Index Funds & PPF)</SelectItem>
                        <SelectItem value="AGGRESSIVE">Aggressive (High Growth • Equity & ELSS)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Visual Strategy Display */}
              <div className="lg:col-span-7 space-y-6">
                {adviceResult && (
                  <>
                    {/* Emergency Buffer Card */}
                    <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20 dark:from-slate-900 dark:via-emerald-950/10 dark:to-slate-900">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base font-bold flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            Emergency Fund Analysis (6-Month Target)
                          </CardTitle>
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs px-3 py-1 font-semibold">
                            {adviceResult.emergencyFund.monthsCovered} Months Covered
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-3 gap-3 p-4 bg-background/80 border border-slate-200/80 dark:border-slate-800 rounded-xl text-center shadow-xs">
                          <div>
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">Target (6 Mo)</span>
                            <p className="text-lg font-extrabold text-foreground mt-0.5">
                              {formatCurrency(adviceResult.emergencyFund.target6Months)}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">Current Fund</span>
                            <p className="text-lg font-extrabold text-emerald-600 mt-0.5">
                              {formatCurrency(adviceResult.emergencyFund.currentSavings)}
                            </p>
                          </div>
                          <div>
                            <span className="text-[11px] font-medium text-muted-foreground uppercase">Shortfall / Deficit</span>
                            <p className={`text-lg font-extrabold mt-0.5 ${adviceResult.emergencyFund.deficit > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                              {formatCurrency(adviceResult.emergencyFund.deficit)}
                            </p>
                          </div>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Emergency Fund Health</span>
                            <span className="font-semibold text-foreground">
                              {Math.min(100, Math.round((adviceResult.emergencyFund.currentSavings / (adviceResult.emergencyFund.target6Months || 1)) * 100))}%
                            </span>
                          </div>
                          <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, (adviceResult.emergencyFund.currentSavings / (adviceResult.emergencyFund.target6Months || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommended Monthly Asset Allocation */}
                    <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                              <Coins className="w-5 h-5 text-indigo-600" />
                              Monthly Asset Allocation ({adviceResult.suggestedAssetAllocation.riskProfile})
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Recommended Monthly Investment: <strong className="text-foreground">{formatCurrency(adviceResult.recommendedMonthlySavings)}</strong>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3.5">
                        <div className="space-y-3">
                          <div className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-sky-500" />
                              <div>
                                <h5 className="text-xs font-bold text-foreground">Liquid FD / Savings Buffer (30%)</h5>
                                <p className="text-[11px] text-muted-foreground">Capital preservation with instant withdrawal</p>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-foreground">
                              {formatCurrency(adviceResult.suggestedAssetAllocation.monthlyAllocationAmount.emergencyOrFd)}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-indigo-500" />
                              <div>
                                <h5 className="text-xs font-bold text-foreground">PPF / EPF / Govt Bonds (30%)</h5>
                                <p className="text-[11px] text-muted-foreground">Fixed return with sovereign safety (Section 80C)</p>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-foreground">
                              {formatCurrency(adviceResult.suggestedAssetAllocation.monthlyAllocationAmount.debtOrGovt)}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-emerald-500" />
                              <div>
                                <h5 className="text-xs font-bold text-foreground">Nifty 50 Index & ELSS Mutual Funds (30%)</h5>
                                <p className="text-[11px] text-muted-foreground">Long-term wealth compounding beating inflation</p>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-foreground">
                              {formatCurrency(adviceResult.suggestedAssetAllocation.monthlyAllocationAmount.equity)}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl border border-border/60 bg-muted/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-3 h-3 rounded-full bg-amber-500" />
                              <div>
                                <h5 className="text-xs font-bold text-foreground">Sovereign Gold / Liquid Funds (10%)</h5>
                                <p className="text-[11px] text-muted-foreground">Portfolio hedge against geopolitical uncertainty</p>
                              </div>
                            </div>
                            <span className="font-bold text-sm text-foreground">
                              {formatCurrency(adviceResult.suggestedAssetAllocation.monthlyAllocationAmount.goldOrLiquid)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 3: TAX MASTERY 101 CHEAT-SHEET */}
          <TabsContent value="education" className="pt-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-xs">
                      EEE Tax-Free
                    </Badge>
                    <span className="text-xs text-muted-foreground">15-Year Tenure</span>
                  </div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 mt-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    Public Provident Fund (PPF)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Section 80C Benefit:</strong> Up to ₹1.5 Lakhs annual deduction under Old Regime.
                  </p>
                  <p>
                    <strong>EEE Exemption:</strong> Investment amount, interest earned, and final maturity proceeds are 100% tax-exempt.
                  </p>
                  <p>
                    <strong>Safety:</strong> Backed by the Government of India with guaranteed interest announced quarterly.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 text-xs">
                      Shortest Lock-In (3 Yrs)
                    </Badge>
                    <span className="text-xs text-muted-foreground">High Growth</span>
                  </div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 mt-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    ELSS (Tax Saving Mutual Funds)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Section 80C Benefit:</strong> Up to ₹1.5 Lakhs deduction per year.
                  </p>
                  <p>
                    <strong>Lock-in:</strong> Only 3 years (vs 5 years for Tax-Saver FDs, 15 years for PPF).
                  </p>
                  <p>
                    <strong>Tax on Gains:</strong> Long-term capital gains (LTCG) above ₹1.25 Lakhs taxed at 12.5%.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs">
                      Extra ₹50,000 Deduction
                    </Badge>
                    <span className="text-xs text-muted-foreground">Section 80CCD(1B)</span>
                  </div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 mt-2">
                    <Coins className="w-5 h-5 text-amber-600" />
                    National Pension System (NPS)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Exclusive Benefit:</strong> Additional ₹50,000 deduction over and above the ₹1.5L 80C limit!
                  </p>
                  <p>
                    <strong>Low Fund Management Fee:</strong> Ultra-low expense ratio (0.01%–0.09%) compared to standard funds.
                  </p>
                  <p>
                    <strong>Maturity:</strong> 60% lump sum tax-free at age 60; 40% converted into monthly pension annuity.
                  </p>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 text-xs">
                      ₹5 Lakhs DICGC Cover
                    </Badge>
                    <span className="text-xs text-muted-foreground">Zero Volatility</span>
                  </div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 mt-2">
                    <ShieldCheck className="w-5 h-5 text-sky-600" />
                    Fixed Deposits & Emergency Reserves
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    <strong>Liquidity:</strong> Premature withdrawal allowed with nominal penalty; ideal for emergency buffers.
                  </p>
                  <p>
                    <strong>Tax-Saver FDs:</strong> 5-year lock-in qualifies for Section 80C (interest is taxable at slab rate).
                  </p>
                  <p>
                    <strong>Senior Citizen Benefit:</strong> Section 80TTB allows up to ₹50,000 interest deduction for seniors.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Universal CA Disclaimer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-muted-foreground">
          <Info className="w-4 h-4 shrink-0 text-indigo-500 mt-0.5" />
          <p>
            <strong>Estimates only. Please consult a CA before filing.</strong> TaxGenie AI estimates are formulated using statutory Indian Income Tax rules (Income Tax Act 2025 / Budget updates). Tax rules are subject to official Central Board of Direct Taxes (CBDT) notifications.
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
