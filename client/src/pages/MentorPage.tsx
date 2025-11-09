import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = localStorage.getItem('userId') || 'demo-user-123';
  const userName = localStorage.getItem('userName') || 'User';

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Send conversation history but exclude the initial welcome message
      const conversationHistory = messages
        .slice(1) // Skip the first welcome message
        .map(m => ({ role: m.role, content: m.content }));
      
      const res = await apiRequest('POST', '/api/chat', {
        userId,
        message: userMessage,
        conversationHistory
      });
      
      if (!res.ok) {
        throw new Error('Failed to get response from AI Mentor');
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.response) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    },
    onError: (error) => {
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now, but I'm still here to help! Try asking your question again, or explore the platform features like taking a quiz or browsing courses while I reconnect.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      console.error('Chat error:', error);
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
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <DashboardLayout userName={userName}>
      <div className="h-[calc(100vh-8rem)] max-w-5xl mx-auto">
        <Card className="flex flex-col h-full">
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

          <div className="flex-1 overflow-y-auto p-6">
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
              
              {/* Invisible div to scroll to */}
              <div ref={messagesEndRef} />
            </div>
          </div>

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
