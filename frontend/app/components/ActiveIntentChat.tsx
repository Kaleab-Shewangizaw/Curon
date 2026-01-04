"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";

interface ActiveIntentChatProps {
  intentId: string;
  intentTitle: string;
  onUpdate: () => void;
}

interface ChatMessage {
  role: "user" | "system";
  content: string;
}

export default function ActiveIntentChat({
  intentId,
  intentTitle,
  onUpdate,
}: ActiveIntentChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    if (intentId) {
      fetchChatHistory();
    }
  }, [intentId]);

  const fetchChatHistory = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/getIntentChat/${intentId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(
          data.map((m: any) => ({ role: m.role, content: m.content }))
        );
      }
    } catch (e) {
      console.error("Failed to fetch chat history", e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/getPrompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMsg,
          userId: "cmjynnuyj0000ftfariqgmngm",
          activeIntentId: intentId,
        }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: data.message },
        ]);
      } else if (data.action === "update") {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "Updated." },
        ]);
      } else if (data.action === "get") {
        setMessages((prev) => [
          ...prev,
          { role: "system", content: "Here is the current status." },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "system", content: "Done." }]);
      }

      onUpdate();
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Error connecting to Curon." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">
          {intentTitle}
        </span>
      </div>

      {/* Messages Container with proper scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div ref={scrollRef} className="h-full overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Discuss "{intentTitle}" here...
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Add tasks or ask questions about this project
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-lg text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-muted text-foreground rounded-bl-none"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted px-4 py-3 rounded-lg rounded-bl-none">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`Add task or ask about ${intentTitle}...`}
            className="w-full bg-background border border-input rounded-lg pl-3 pr-10 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="absolute right-2 bottom-2 p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
