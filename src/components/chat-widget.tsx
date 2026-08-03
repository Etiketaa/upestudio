"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { askAssistant } from "@/app/actions";
import { cn } from "@/lib/utils";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hola! Soy el asistente de UP! Estudio. ¿En qué puedo ayudarte?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    const { success, answer, error } = await askAssistant(userMessage);
    
    setMessages(prev => [...prev, { 
      role: "assistant", 
      content: success ? answer : error || "No pude procesar tu pregunta." 
    }]);
    setLoading(false);
  }

  const suggestedQuestions = [
    "¿Cómo creo un turno manual?",
    "¿Dónde configuro los horarios?",
    "¿Cómo agrego un servicio?",
  ];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg shadow-gold-500/20 flex items-center justify-center transition-all",
          isOpen ? "bg-zinc-800 rotate-0" : "bg-gold-600 hover:bg-gold-500 hover:scale-105"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 text-black" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] h-[500px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-600/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Asistente UP!</h3>
                <p className="text-[10px] text-gray-500">IA para ayudarte con el sistema</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 bg-gold-600/20 rounded-full flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-gold-500" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                  msg.role === "user" 
                    ? "bg-gold-600 text-black rounded-br-md" 
                    : "bg-white/5 text-gray-300 rounded-bl-md"
                )}>
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 bg-gold-600/20 rounded-full flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-gold-500" />
                </div>
                <div className="bg-white/5 px-3 py-2 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-4 h-4 text-gold-500 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-[10px] text-gray-500 mb-2">Preguntas frecuentes:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-full text-[11px] text-gray-400 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu pregunta..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gold-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="w-9 h-9 bg-gold-600 rounded-xl flex items-center justify-center text-black disabled:opacity-50 hover:bg-gold-500 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
