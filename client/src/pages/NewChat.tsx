import { Sidebar } from "@/components/Sidebar";
import { useCharacters, useCreateConversation } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Users, MessageSquarePlus, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function NewChat() {
  const [, setLocation] = useLocation();
  const { data: characters, isLoading } = useCharacters();
  const { mutate: createChat, isPending } = useCreateConversation();

  const handleCreate = (characterId: number) => {
    createChat(characterId, {
      onSuccess: (data) => {
        setLocation(`/chat/${data.id}`);
      }
    });
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar className="hidden md:flex w-80 lg:w-96 flex-shrink-0" />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">New Conversation</h1>
                <p className="text-muted-foreground text-lg">Choose a persona to start chatting with.</p>
              </div>
              <Link href="/new-character">
                <Button className="rounded-full shadow-md" size="lg">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Persona
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : characters?.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-border/50 rounded-3xl bg-secondary/5">
                <Users className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No characters found</h3>
                <p className="text-muted-foreground mb-8">Create your first AI persona to get started.</p>
                <Link href="/new-character">
                  <Button size="lg">Create Character</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {characters?.map((char) => (
                  <div 
                    key={char.id}
                    onClick={() => !isPending && handleCreate(char.id)}
                    className={cn(
                      "group relative flex flex-col p-6 rounded-3xl border border-border/50 bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer overflow-hidden",
                      isPending && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-300">
                      <div className="bg-primary/10 p-2 rounded-full text-primary">
                        <MessageSquarePlus className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mb-4">
                      <Avatar className="h-16 w-16 border-2 border-background shadow-md group-hover:scale-105 transition-transform duration-300">
                        <AvatarImage src={char.avatarUrl || undefined} />
                        <AvatarFallback className="text-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
                          {char.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{char.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                      {char.persona}
                    </p>

                    <div className="mt-auto pt-4 border-t border-border/30 flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Start Chatting <ChevronRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
