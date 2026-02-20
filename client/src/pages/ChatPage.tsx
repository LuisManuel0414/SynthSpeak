import { Sidebar } from "@/components/Sidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { useRoute } from "wouter";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const [match, params] = useRoute("/chat/:id");
  const conversationId = params ? parseInt(params.id) : 0;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!match) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* 
        Responsive layout logic:
        - Desktop: Sidebar visible + Chat visible
        - Mobile: Only Chat visible (Sidebar handles its own visibility in root route) 
      */}
      <Sidebar className="hidden md:flex w-80 lg:w-96 flex-shrink-0 z-10" />
      
      <main className="flex-1 h-full w-full relative">
        <ChatInterface conversationId={conversationId} />
      </main>
    </div>
  );
}
