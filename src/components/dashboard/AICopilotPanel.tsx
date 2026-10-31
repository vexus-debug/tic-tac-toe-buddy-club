import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Trash2, Loader2, Stethoscope, ClipboardPlus, Plus, MessageSquare, Mic, MicOff, Check, RotateCcw, ImagePlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/hooks/useOrg";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type MsgContent = string | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;
type Msg = { role: "user" | "assistant"; content: MsgContent };

function getMsgText(content: MsgContent): string {
  if (typeof content === "string") return content;
  return content.filter((p) => p.type === "text").map((p) => (p as any).text).join("");
}
function getMsgImages(content: MsgContent): string[] {
  if (typeof content === "string") return [];
  return content.filter((p) => p.type === "image_url").map((p) => (p as any).image_url.url);
}
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const QUICK_PROMPTS = [
  "Give me a clinic summary",
  "Who's coming in today?",
  "Any low inventory alerts?",
  "Show overdue patients",
  "What's our revenue this month?",
  "Show pending lab cases",
  "Find unpaid invoices",
  "Show the waiting list",
];

interface AICopilotPanelProps {
  open: boolean;
  onClose: () => void;
  inline?: boolean;
}

function useConversations(orgId?: string, userId?: string) {
  return useQuery({
    queryKey: ["ai-conversations", orgId],
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, title, updated_at")
        .eq("org_id", orgId!)
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });
}

function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["ai-messages", conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content, created_at")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    },
  });
}

export function AICopilotPanel({ open, onClose, inline = false }: AICopilotPanelProps) {
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [showTranscriptConfirm, setShowTranscriptConfirm] = useState(false);
  const [attachedImages, setAttachedImages] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const location = useLocation();
  const qc = useQueryClient();

  const orgId = currentOrg?.org_id;
  const userId = user?.id;

  const { data: conversations = [] } = useConversations(orgId, userId);
  const { data: dbMessages } = useConversationMessages(activeConvoId || undefined);

  // Sync db messages to local state when conversation changes
  useEffect(() => {
    if (dbMessages) {
      setLocalMessages(dbMessages);
    }
  }, [dbMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [localMessages]);

  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  const createConversation = useCallback(async (firstMessage: string): Promise<string> => {
    const title = firstMessage.slice(0, 60) || "New Chat";
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ org_id: orgId!, user_id: userId!, title })
      .select("id")
      .single();
    if (error) throw error;
    return data.id;
  }, [orgId, userId]);

  const saveMessage = useCallback(async (conversationId: string, role: string, content: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
    // Update conversation title/timestamp
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
  }, []);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages: { file: File; preview: string; base64: string }[] = [];
    for (const file of files.slice(0, 5)) {
      if (!file.type.startsWith("image/")) continue;
      const base64 = await fileToBase64(file);
      newImages.push({ file, preview: URL.createObjectURL(file), base64 });
    }
    setAttachedImages((prev) => [...prev, ...newImages].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const removeImage = useCallback((index: number) => {
    setAttachedImages((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if ((!text.trim() && attachedImages.length === 0) || isLoading) return;

    // Build multimodal content if images attached
    let userContent: MsgContent;
    if (attachedImages.length > 0) {
      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      if (text.trim()) parts.push({ type: "text", text: text.trim() });
      for (const img of attachedImages) {
        parts.push({ type: "image_url", image_url: { url: img.base64 } });
      }
      if (!text.trim()) parts.unshift({ type: "text", text: "Analyze this image" });
      userContent = parts;
    } else {
      userContent = text;
    }

    const userMsg: Msg = { role: "user", content: userContent };
    const updatedMessages = [...localMessages, userMsg];
    setLocalMessages(updatedMessages);
    setInput("");
    setAttachedImages([]);
    setIsLoading(true);

    try {
      // Create conversation if needed
      let convoId = activeConvoId;
      if (!convoId && orgId && userId) {
        convoId = await createConversation(getMsgText(userContent) || "Image analysis");
        setActiveConvoId(convoId);
      }

      // Persist user message (text only for DB)
      if (convoId) {
        await saveMessage(convoId, "user", getMsgText(userContent) || "[Image uploaded]");
      }

      const { data, error } = await supabase.functions.invoke("ai-copilot", {
        body: {
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          orgId: currentOrg?.org_id,
          context: { page: location.pathname },
        },
      });

      if (error) throw error;

      const reply = data?.reply || "Sorry, I couldn't process that request.";
      setLocalMessages(prev => [...prev, { role: "assistant", content: reply }]);

      // Persist assistant reply
      if (convoId) {
        await saveMessage(convoId, "assistant", reply);
        qc.invalidateQueries({ queryKey: ["ai-conversations"] });
      }
    } catch (err: any) {
      console.error("AI Copilot error:", err);
      let errorMsg = "Failed to reach AI. Please try again.";
      if (err?.message?.includes("429") || err?.context?.status === 429) {
        errorMsg = "Rate limited — please wait a moment and try again.";
      } else if (err?.message?.includes("402") || err?.context?.status === 402) {
        errorMsg = "AI credits are currently unavailable. Please contact your Clinexus administrator.";
      } else if (err?.message) {
        errorMsg = err.message;
      }
      setLocalMessages(prev => [
        ...prev,
        { role: "assistant", content: `⚠️ ${errorMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, localMessages, activeConvoId, currentOrg?.org_id, location.pathname, orgId, userId, createConversation, saveMessage, qc, attachedImages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewChat = () => {
    setActiveConvoId(null);
    setLocalMessages([]);
    setShowHistory(false);
  };

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLocalMessages(prev => [...prev, { role: "assistant", content: "⚠️ Voice recording is not supported in this browser. Please use Chrome, Edge, or Safari." }]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      // Only use the final result from the last result set
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;
      setTranscribedText(transcript.trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed") {
        setLocalMessages(prev => [...prev, { role: "assistant", content: "⚠️ Microphone access denied. Please allow microphone access in your browser settings." }]);
      } else if (event.error === "network") {
        setLocalMessages(prev => [...prev, { role: "assistant", content: "⚠️ Network error during voice recognition. Please check your connection and try again." }]);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    // Use a ref to track final text for the confirmation check
    const checkShowConfirm = () => {
      // Small delay to let the last onresult fire before checking
      setTimeout(() => {
        setTranscribedText(prev => {
          if (prev.trim()) {
            setShowTranscriptConfirm(true);
          }
          return prev;
        });
      }, 200);
    };
    recognition.addEventListener("end", checkShowConfirm);

    recognitionRef.current = recognition;
    setTranscribedText("");
    setIsRecording(true);
    recognition.start();
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const confirmTranscript = useCallback(() => {
    setShowTranscriptConfirm(false);
    sendMessage(transcribedText);
    setTranscribedText("");
  }, [transcribedText, sendMessage]);

  const editTranscript = useCallback(() => {
    setShowTranscriptConfirm(false);
    setInput(transcribedText);
    setTranscribedText("");
    textareaRef.current?.focus();
  }, [transcribedText]);

  const discardTranscript = useCallback(() => {
    setShowTranscriptConfirm(false);
    setTranscribedText("");
  }, []);

  const loadConversation = (convoId: string) => {
    setActiveConvoId(convoId);
    setShowHistory(false);
    qc.invalidateQueries({ queryKey: ["ai-messages", convoId] });
  };

  const deleteConversation = async (convoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Delete messages first, then conversation
    await supabase.from("chat_messages").delete().eq("conversation_id", convoId);
    await supabase.from("chat_conversations").delete().eq("id", convoId);
    if (activeConvoId === convoId) {
      startNewChat();
    }
    qc.invalidateQueries({ queryKey: ["ai-conversations"] });
  };

  const header = (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-transparent shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <Stethoscope className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-emerald-500" />
        </div>
        <div>
          <h3 className="font-semibold text-sm tracking-tight">ClineXus AI</h3>
          <p className="text-[11px] text-muted-foreground font-medium">
            Clinic Assistant · <span className="text-emerald-500">Online</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-muted"
          onClick={() => setShowHistory(!showHistory)}
          title="Chat history"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-muted"
          onClick={startNewChat}
          title="New chat"
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
        {!inline && (
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const historyPanel = (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      <p className="text-xs font-medium text-muted-foreground px-2 mb-2 uppercase tracking-wider">Recent Chats</p>
      {conversations.length === 0 && (
        <p className="text-xs text-muted-foreground px-2 py-4 text-center">No previous conversations</p>
      )}
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => loadConversation(c.id)}
          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between group transition-colors ${
            activeConvoId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted/70 text-foreground"
          }`}
        >
          <span className="truncate flex-1 mr-2">{c.title}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => deleteConversation(c.id, e)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </button>
      ))}
    </div>
  );

  const messagesArea = (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
      {localMessages.length === 0 && (
        <div className="flex flex-col items-center py-10 space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center border border-primary/10"
          >
            <ClipboardPlus className="w-9 h-9 text-primary" />
          </motion.div>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }} className="text-center space-y-2">
            <p className="font-semibold text-lg">How can I help?</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
              I can query live clinic data, manage appointments, and provide clinical insights.
            </p>
          </motion.div>
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="w-full grid grid-cols-2 gap-2 pt-2">
            {QUICK_PROMPTS.map((p, i) => (
              <motion.button
                key={p}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 + i * 0.04 }}
                onClick={() => sendMessage(p)}
                className="text-xs text-left px-3 py-2.5 rounded-xl border border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 text-muted-foreground hover:text-foreground"
              >
                {p}
              </motion.button>
            ))}
          </motion.div>
        </div>
      )}

      {localMessages.map((msg, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-2`}
        >
          {msg.role === "assistant" && (
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Stethoscope className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md shadow-sm" : "bg-muted/70 rounded-bl-md border border-border/30"}`}>
            {/* Show attached images */}
            {getMsgImages(msg.content).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {getMsgImages(msg.content).map((url, idx) => (
                  <img key={idx} src={url} alt="Attached" className="w-16 h-16 rounded-lg object-cover border border-border/20" />
                ))}
              </div>
            )}
            {msg.role === "assistant" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{getMsgText(msg.content)}</ReactMarkdown>
              </div>
            ) : getMsgText(msg.content)}
          </div>
        </motion.div>
      ))}

      {isLoading && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Stethoscope className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="bg-muted/70 rounded-2xl rounded-bl-md border border-border/30 px-4 py-3 flex items-center gap-2.5">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        </motion.div>
      )}
    </div>
  );

  const inputArea = (
    <div className="border-t border-border p-4 bg-background shrink-0">
      {/* Transcript confirmation banner */}
      <AnimatePresence>
        {showTranscriptConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2"
          >
            <p className="text-[11px] font-medium text-primary uppercase tracking-wider">Voice Transcription</p>
            <p className="text-sm text-foreground leading-relaxed">{transcribedText}</p>
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs gap-1.5 rounded-lg" onClick={confirmTranscript}>
                <Check className="w-3 h-3" /> Send
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 rounded-lg" onClick={editTranscript}>
                <RotateCcw className="w-3 h-3" /> Edit
              </Button>
              <Button size="sm" variant="ghost" className="h-8 text-xs rounded-lg text-muted-foreground" onClick={discardTranscript}>
                Discard
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
            </span>
            <span className="text-xs font-medium text-destructive">Listening...</span>
            {transcribedText && (
              <span className="text-xs text-muted-foreground truncate flex-1 ml-1 italic">"{transcribedText}"</span>
            )}
            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={stopRecording}>
              Stop
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview strip */}
      {attachedImages.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {attachedImages.map((img, idx) => (
            <div key={idx} className="relative group">
              <img src={img.preview} alt="Attach" className="w-14 h-14 rounded-lg object-cover border border-border" />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 bg-background rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XCircle className="w-4 h-4 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageSelect}
      />

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachedImages.length > 0 ? "Describe what to do with the image(s)..." : "Ask me anything or tap the mic..."}
            className="min-h-[44px] max-h-[120px] resize-none text-sm rounded-xl border-border/60 bg-muted/30 focus:bg-background transition-colors py-3"
            rows={1}
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 h-11 w-11 rounded-xl transition-all duration-200"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || attachedImages.length >= 5}
          title="Attach images"
        >
          <ImagePlus className="w-4 h-4" />
        </Button>
        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="icon"
          className="shrink-0 h-11 w-11 rounded-xl transition-all duration-200"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || showTranscriptConfirm}
          title={isRecording ? "Stop recording" : "Voice input"}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </Button>
        <Button
          onClick={() => sendMessage(input)}
          disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
          size="icon"
          className="shrink-0 h-11 w-11 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-2 text-center tracking-wide">
        Powered by AI · Always verify clinical suggestions
      </p>
    </div>
  );

  // Inline mode for mobile toggle
  if (inline) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-background">
        {header}
        {showHistory ? historyPanel : messagesArea}
        {!showHistory && inputArea}
      </div>
    );
  }

  // Desktop: fixed slide-in panel
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35, mass: 0.8 }}
            className="fixed inset-y-0 right-0 z-50 w-full md:w-[420px] lg:w-[460px] flex flex-col bg-background border-l border-border shadow-2xl"
          >
            {header}
            {showHistory ? historyPanel : messagesArea}
            {!showHistory && inputArea}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
