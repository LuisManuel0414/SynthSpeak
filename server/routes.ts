import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { openai } from "./replit_integrations/audio"; // Use the configured openai client

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // --- Characters ---
  
  app.get(api.characters.list.path, async (req, res) => {
    const chars = await storage.getCharacters();
    res.json(chars);
  });

  app.get(api.characters.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const char = await storage.getCharacter(id);
    if (!char) return res.status(404).json({ message: "Character not found" });
    
    res.json(char);
  });

  app.post(api.characters.create.path, async (req, res) => {
    try {
      const data = api.characters.create.input.parse(req.body);
      const char = await storage.createCharacter(data);
      res.status(201).json(char);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Conversations ---

  app.get(api.conversations.list.path, async (req, res) => {
    const convos = await storage.getConversations();
    res.json(convos);
  });

  app.get(api.conversations.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    
    const convo = await storage.getConversation(id);
    if (!convo) return res.status(404).json({ message: "Conversation not found" });
    
    res.json(convo);
  });

  app.post(api.conversations.create.path, async (req, res) => {
    try {
      const data = api.conversations.create.input.parse(req.body);
      
      // Verify character exists
      const char = await storage.getCharacter(data.characterId);
      if (!char) return res.status(400).json({ message: "Character not found" });
      
      const convo = await storage.createConversation(data);
      
      // Auto-insert greeting message from character
      if (char.greeting) {
        await storage.createMessage(convo.id, "assistant", char.greeting);
      }
      
      res.status(201).json(convo);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // --- Messages ---

  app.get(api.messages.list.path, async (req, res) => {
    const convId = parseInt(req.params.id);
    if (isNaN(convId)) return res.status(400).json({ message: "Invalid ID" });
    
    const msgs = await storage.getMessagesByConversation(convId);
    res.json(msgs);
  });

  app.post(api.messages.send.path, async (req, res) => {
    try {
      const convId = parseInt(req.params.id);
      if (isNaN(convId)) return res.status(400).json({ message: "Invalid ID" });
      
      const { content } = api.messages.send.input.parse(req.body);
      
      const convo = await storage.getConversation(convId);
      if (!convo || !convo.character) {
        return res.status(404).json({ message: "Conversation or character not found" });
      }
      
      // Save user message
      await storage.createMessage(convId, "user", content);
      
      // Prepare chat history
      const previousMsgs = await storage.getMessagesByConversation(convId);
      
      const chatMessages = [
        { 
          role: "system" as const, 
          content: `You are playing the persona of ${convo.character.name}. ${convo.character.persona} Stay in character.` 
        },
        ...previousMsgs.map(m => ({ 
          role: m.role as "user" | "assistant", 
          content: m.content 
        }))
      ];

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 4096,
      });

      let fullResponse = "";
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || "";
        if (text) {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
        }
      }

      // Save assistant message
      await storage.createMessage(convId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      
    } catch (err) {
      console.error("Chat error:", err);
      if (err instanceof z.ZodError) {
        if (!res.headersSent) {
          return res.status(400).json({ message: err.errors[0].message });
        }
      }
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  return httpServer;
}

export async function seedDatabase() {
  const characters = await storage.getCharacters();
  if (characters.length === 0) {
    const c1 = await storage.createCharacter({
      name: "Albert Einstein",
      persona: "You are the famous physicist Albert Einstein. You explain complex scientific concepts using simple, intuitive analogies, often referencing trains, elevators, or clocks. You have a playful, slightly absent-minded demeanor but are profoundly insightful.",
      greeting: "Greetings! Time is relative, but I always have time for a curious mind. What shall we explore today?",
      avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/d/d3/Albert_Einstein_Head.jpg"
    });

    const c2 = await storage.createCharacter({
      name: "Gimli",
      persona: "You are Gimli, son of Gloin, a proud Dwarf from Middle-earth. You are gruff, loyal, deeply mistrustful of Elves (initially), and love talking about axes, caves, and hearty meals.",
      greeting: "Well met! Keep your axe sharp and your wits sharper. What brings you to seek my counsel?",
      avatarUrl: "https://upload.wikimedia.org/wikipedia/en/4/41/Gimli_LOTR.jpg" // placeholder
    });
    
    // Create an initial conversation with Einstein
    await storage.createConversation({ characterId: c1.id });
  }
}
