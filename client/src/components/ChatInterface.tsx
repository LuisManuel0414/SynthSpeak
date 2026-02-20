import { useEffect, useRef, useState } from "react";
import { useMessages, useChatStream, useConversation } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SendHorizontal, StopCircle, MoreVertical, Trash2, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInterfaceProps {
  conversationId: number;
}

export function ChatInterface({ conversationId }: ChatInterfaceProps) {
  const [, setLocation] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  
  const { data: conversation, isLoading: isLoadingConversation } = useConversation(conversationId);
  const { data: messages, isLoading: isLoadingMessages } = useMessages(conversationId);
  const { sendMessage, isStreaming, streamedContent, stopStream } = useChatStream(conversationId);

  // Scroll to bottom when messages change or streaming updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamedContent, conversationId]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const content = input;
    setInput("");
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
        <h2 className="text-2xl font-bold mb-2">Chat Not Found</h2>
        <p className="text-muted-foreground mb-6">This conversation may have been deleted or doesn't exist.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const character = conversation.character;
  const avatarFallback = character?.name?.charAt(0) || "AI";

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Header */}
      <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="md:hidden">
            <Button variant="ghost" size="icon" className="-ml-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-9 w-9 border border-border/50">
            <AvatarImage src={character?.avatarUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold text-sm md:text-base leading-none mb-1">
              {character?.name}
            </h2>
            <p className="text-[10px] md:text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
              Online
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
        {!isLoadingMessages && messages?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
            <Avatar className="h-20 w-20 mb-4 opacity-80 grayscale">
              <AvatarImage src={character?.avatarUrl || undefined} />
              <AvatarFallback className="text-2xl">{avatarFallback}</AvatarFallback>
            </Avatar>
            <p className="text-sm">This is the beginning of your conversation with {character?.name}.</p>
          </div>
        )}

        {messages?.map((msg, idx) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className={cn(
              "flex gap-3 max-w-[85%] md:max-w-[75%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {msg.role === "assistant" && (
              <Avatar className="h-8 w-8 mt-1 border border-border/30 flex-shrink-0">
                <AvatarImage src={character?.avatarUrl || undefined} />
                <AvatarFallback className="text-xs bg-primary/5 text-primary">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                "p-3.5 md:p-4 rounded-2xl text-sm md:text-[15px] leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-[hsl(var(--chat-bubble-user))] text-[hsl(var(--chat-bubble-user-foreground))] rounded-tr-sm"
                  : "bg-[hsl(var(--chat-bubble-assistant))] text-[hsl(var(--chat-bubble-assistant-foreground))] border border-border/50 rounded-tl-sm"
              )}
            >
              {msg.content}
            </div>
          </motion.div>
        ))}

        {/* Streaming Message */}
        {isStreaming && streamedContent && (
          <div className="flex gap-3 max-w-[85%] md:max-w-[75%] mr-auto">
            <Avatar className="h-8 w-8 mt-1 border border-border/30 flex-shrink-0">
              <AvatarImage src={character?.avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/5 text-primary">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="p-3.5 md:p-4 rounded-2xl rounded-tl-sm text-sm md:text-[15px] leading-relaxed shadow-sm bg-[hsl(var(--chat-bubble-assistant))] text-[hsl(var(--chat-bubble-assistant-foreground))] border border-border/50">
              {streamedContent}
              <span className="inline-block w-1.5 h-4 ml-1 align-middle bg-primary/50 animate-pulse" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="relative max-w-4xl mx-auto flex items-end gap-2 bg-secondary/30 p-1.5 rounded-3xl border border-border/50 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${character?.name}...`}
            className="min-h-[44px] max-h-32 w-full resize-none border-0 bg-transparent py-3 px-4 focus-visible:ring-0 placeholder:text-muted-foreground/50"
            rows={1}
          />
          <div className="flex pb-1 pr-1">
            {isStreaming ? (
              <Button
                size="icon"
                variant="destructive"
                className="h-9 w-9 rounded-full shrink-0 shadow-sm hover:scale-105 transition-transform"
                onClick={stopStream}
              >
                <StopCircle className="h-5 w-5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full shrink-0 shadow-sm transition-all duration-200",
                  input.trim() 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
                disabled={!input.trim()}
                onClick={handleSend}
              >
                <SendHorizontal className="h-5 w-5 ml-0.5" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-[10px] text-center mt-3 text-muted-foreground/60">
          AI generated content may be inaccurate.
        </p>
      </div>
    </div>
  );
}
