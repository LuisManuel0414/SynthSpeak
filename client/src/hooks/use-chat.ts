import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertCharacter, type InsertConversation } from "@shared/routes";
import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// ============================================
// Characters
// ============================================

export function useCharacters() {
  return useQuery({
    queryKey: [api.characters.list.path],
    queryFn: async () => {
      const res = await fetch(api.characters.list.path);
      if (!res.ok) throw new Error("Failed to fetch characters");
      return api.characters.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const res = await fetch(api.characters.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create character");
      return api.characters.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.characters.list.path] });
      toast({ title: "Character created", description: "Your new persona is ready to chat." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create character", variant: "destructive" });
    }
  });
}

// ============================================
// Conversations
// ============================================

export function useConversations() {
  return useQuery({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
  });
}

export function useConversation(id: number) {
  return useQuery({
    queryKey: [api.conversations.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return api.conversations.get.responses[200].parse(await res.json());
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (characterId: number) => {
      const res = await fetch(api.conversations.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return api.conversations.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to start chat", variant: "destructive" });
    }
  });
}

// ============================================
// Messages & Streaming
// ============================================

export function useMessages(conversationId: number) {
  return useQuery({
    queryKey: [api.messages.list.path, conversationId],
    enabled: !!conversationId,
    queryFn: async () => {
      const url = buildUrl(api.messages.list.path, { id: conversationId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return api.messages.list.responses[200].parse(await res.json());
    },
  });
}

// Custom hook for streaming chat
export function useChatStream(conversationId: number) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    setStreamedContent("");
    
    // Optimistically update UI could go here, but for now we'll rely on the stream
    // Or we can manually insert the user message into the cache immediately
    queryClient.setQueryData(
      [api.messages.list.path, conversationId], 
      (old: any[]) => [...(old || []), { 
        id: Date.now(), // temp id
        role: "user", 
        content, 
        createdAt: new Date().toISOString() 
      }]
    );

    try {
      abortControllerRef.current = new AbortController();
      const url = buildUrl(api.messages.send.path, { id: conversationId });
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to send message");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                // Done streaming
                setIsStreaming(false);
                setStreamedContent("");
                queryClient.invalidateQueries({ queryKey: [api.messages.list.path, conversationId] });
              } else if (data.content) {
                setStreamedContent(prev => prev + data.content);
              }
            } catch (e) {
              console.error("Error parsing SSE data", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsStreaming(false);
      // Invalidate to ensure consistent state even on error
      queryClient.invalidateQueries({ queryKey: [api.messages.list.path, conversationId] });
    }
  }, [conversationId, queryClient]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  return { sendMessage, isStreaming, streamedContent, stopStream };
}
