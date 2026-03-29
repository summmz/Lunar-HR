import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AIChatBox, Message } from "@/components/AIChatBox";
import { Card } from "@/components/ui/card";
import { Sparkles, MessageSquare, Clock, Shield } from "lucide-react";

const SUGGESTED_PROMPTS = [
  "What is my current leave balance?",
  "How do I apply for a salary revision?",
  "What are the company's work from home policies?",
  "When is the next performance review?",
  "How do I update my personal information?",
];

export default function UserChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    },
    onError: () => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process your request. Please try again." },
      ]);
    },
  });

  const handleSendMessage = (content: string) => {
    const userMessage: Message = { role: "user", content };
    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: content });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-foreground">HR Assistant</h1>
        <p className="subtitle mt-1">Ask me anything about HR policies, benefits, and more</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-scandinavian">
          <div className="flex items-center gap-3">
            <div className="shape-circle-sm bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">AI Powered</p>
              <p className="text-xs text-muted-foreground">Smart HR responses</p>
            </div>
          </div>
        </Card>
        <Card className="card-scandinavian">
          <div className="flex items-center gap-3">
            <div className="shape-circle-sm bg-green-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">24/7 Available</p>
              <p className="text-xs text-muted-foreground">Always here to help</p>
            </div>
          </div>
        </Card>
        <Card className="card-scandinavian">
          <div className="flex items-center gap-3">
            <div className="shape-circle-sm bg-secondary/20 flex items-center justify-center">
              <Shield className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Confidential</p>
              <p className="text-xs text-muted-foreground">Your data is private</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Box */}
      <Card className="card-scandinavian p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="shape-circle-sm bg-primary/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">HR Assistant</p>
            <p className="text-xs text-green-500">● Online</p>
          </div>
        </div>
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={chatMutation.isPending}
          placeholder="Ask about policies, benefits, leave, payroll..."
          height={480}
          emptyStateMessage="Hello! I'm your HR Assistant. How can I help you today?"
          suggestedPrompts={SUGGESTED_PROMPTS}
          className="border-0 rounded-none shadow-none"
        />
      </Card>
    </div>
  );
}
