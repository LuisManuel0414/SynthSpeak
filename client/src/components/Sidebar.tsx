import { Link, useLocation } from "wouter";
import { useConversations } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, MessageSquare, ChevronLeft, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  className?: string;
  onClose?: () => void; // For mobile
}

export function Sidebar({ className, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();

  // Sort conversations by most recent (createdAt)
  const sortedConversations = conversations?.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  return (
    <div className={cn("flex flex-col h-full bg-secondary/30 border-r border-border/50", className)}>
      <div className="p-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <h1 className="font-bold text-xl tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          AI Chat
        </h1>
        <div className="flex gap-2">
          <Link href="/new-character">
            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full" title="Create Character">
              <UserPlus className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/new-chat">
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-sm" title="New Chat">
              <Plus className="h-5 w-5 text-primary" />
            </Button>
          </Link>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {isLoading ? (
            <div className="space-y-3 px-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-1 flex-1">
                    <div className="h-3 w-24 bg-muted rounded" />
                    <div className="h-2 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedConversations?.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="bg-primary/5 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <MessageSquare className="h-8 w-8 text-primary/40" />
              </div>
              <h3 className="font-medium text-sm text-foreground/80 mb-1">No chats yet</h3>
              <p className="text-xs text-muted-foreground mb-4">Start a conversation with an AI persona</p>
              <Link href="/new-chat">
                <Button variant="outline" size="sm" className="w-full">Start Chat</Button>
              </Link>
            </div>
          ) : (
            sortedConversations?.map((chat) => {
              const isActive = location === `/chat/${chat.id}`;
              const charName = chat.character?.name || "Unknown";
              const charInitial = charName.charAt(0);
              
              return (
                <Link key={chat.id} href={`/chat/${chat.id}`}>
                  <div 
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer hover:bg-accent/50",
                      isActive && "bg-accent shadow-sm ring-1 ring-border"
                    )}
                  >
                    <Avatar className="h-10 w-10 border border-border/50 shadow-sm">
                      <AvatarImage src={chat.character?.avatarUrl || undefined} />
                      <AvatarFallback className={cn(
                        "font-medium",
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {charInitial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className={cn(
                          "font-semibold text-sm truncate",
                          isActive ? "text-foreground" : "text-foreground/80"
                        )}>
                          {charName}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                          {chat.createdAt && formatDistanceToNow(new Date(chat.createdAt), { addSuffix: false })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate opacity-80 group-hover:opacity-100 transition-opacity">
                        {chat.character?.persona || "No description"}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/40 text-xs text-center text-muted-foreground">
        AI Chat v1.0
      </div>
    </div>
  );
}
