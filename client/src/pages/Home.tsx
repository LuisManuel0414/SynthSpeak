import { Sidebar } from "@/components/Sidebar";
import { useLocation } from "wouter";
import { MessageSquareDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar - Hidden on mobile if viewing chat (handled by router in App, but here is base layout) */}
      <Sidebar className="w-full md:w-80 lg:w-96 flex-shrink-0 z-10" />

      {/* Empty State / Welcome Screen */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-secondary/10 p-8 text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px]" />
          <div className="absolute top-[40%] -left-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
        </div>

        <div className="max-w-md relative z-10 animate-fade-in">
          <div className="bg-background p-6 rounded-3xl shadow-xl shadow-black/5 border border-border/50 mb-8 inline-block transform rotate-[-2deg]">
            <MessageSquareDashed className="h-16 w-16 text-primary mx-auto" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-3xl font-bold mb-3 tracking-tight">
            Welcome to AI Chat
          </h1>
          <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
            Select a conversation from the sidebar or start a new chat to begin talking with your AI personas.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/new-chat">
              <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-1">
                Start New Chat
              </Button>
            </Link>
            <Link href="/new-character">
              <Button size="lg" variant="outline" className="rounded-full px-8 hover:bg-secondary/50">
                Create Persona
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
