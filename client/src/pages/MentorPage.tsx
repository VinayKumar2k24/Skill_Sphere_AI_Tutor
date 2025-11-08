import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, Sparkles, ArrowRight, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Recommendation {
  type: string;
  title: string;
  description: string;
  action: string;
  link: string;
}

export default function MentorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI learning mentor. I'm here to help you achieve your learning goals. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const userId = localStorage.getItem('userId') || 'demo-user-123';
  const userName = localStorage.getItem('userName') || 'User';
  
  // Fetch personalized recommendations
  const { data: recommendationsData } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: [`/api/mentor/recommendations/${userId}`],
    enabled: !!userId,
  });

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await apiRequest('POST', '/api/chat', {
        userId,
        message: userMessage,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
      });
      return await res.json();
    },
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    chatMutation.mutate(input.trim());
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const recommendations = recommendationsData?.recommendations || [];

  return (
    <DashboardLayout userName={userName}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-3xl mb-2" data-testid="page-title">
            AI Learning Mentor
          </h1>
          <p className="text-muted-foreground">
            Get personalized guidance and answers to your learning questions
          </p>
        </div>

        {/* Proactive Recommendations - Larger and more readable */}
        {recommendations.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => (
              <Card key={index} className="glass-card p-6 neon-border hover:border-primary/60 transition-all" data-testid={`recommendation-${index}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{rec.title}</h3>
                      <Badge variant="outline" className="text-sm bg-primary/10 text-primary border-primary/30">{rec.type}</Badge>
                    </div>
                    <p className="text-base text-foreground/80 mb-4 leading-relaxed">{rec.description}</p>
                    <Link href={rec.link}>
                      <Button size="default" variant="default" className="w-full glow-primary" data-testid={`button-${rec.action.toLowerCase().replace(/\s+/g, '-')}`}>
                        {rec.action}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className={`flex flex-col ${recommendations.length > 0 ? 'h-[calc(100vh-26rem)]' : 'h-[calc(100vh-16rem)]'}`}>
          <div className="p-6 border-b bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">Your Personal AI Mentor</h3>
                <p className="text-base text-muted-foreground">Always here to help you learn and grow</p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  data-testid={`message-${message.role}-${message.id}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback className={message.role === 'assistant' ? 'bg-primary text-primary-foreground' : 'bg-accent'}>
                      {message.role === 'assistant' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block px-5 py-4 rounded-2xl ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground neon-glow'
                          : 'glass-card border border-border/50'
                      }`}
                    >
                      <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 px-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="inline-block px-5 py-4 rounded-2xl glass-card border border-border/50">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <form onSubmit={handleSubmit} className="p-6 border-t bg-card/50 backdrop-blur-sm">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your learning journey..."
                disabled={chatMutation.isPending}
                className="flex-1 h-12 text-base px-4"
                data-testid="input-chat-message"
              />
              <Button
                type="submit"
                disabled={!input.trim() || chatMutation.isPending}
                className="h-12 px-6 glow-primary"
                data-testid="button-send-message"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
