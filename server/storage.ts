import { db } from "./db";
import { 
  characters, 
  conversations, 
  messages,
  type Character,
  type InsertCharacter,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type CreateCharacterRequest,
  type CreateConversationRequest,
  type SendMessageRequest
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Characters
  getCharacters(): Promise<Character[]>;
  getCharacter(id: number): Promise<Character | undefined>;
  createCharacter(character: CreateCharacterRequest): Promise<Character>;
  
  // Conversations
  getConversations(): Promise<(Conversation & { character?: Character })[]>;
  getConversation(id: number): Promise<(Conversation & { character?: Character }) | undefined>;
  createConversation(conversation: CreateConversationRequest): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  
  // Messages
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  async getCharacters(): Promise<Character[]> {
    return await db.select().from(characters).orderBy(desc(characters.createdAt));
  }

  async getCharacter(id: number): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async createCharacter(character: CreateCharacterRequest): Promise<Character> {
    const [newChar] = await db.insert(characters).values(character).returning();
    return newChar;
  }

  async getConversations(): Promise<(Conversation & { character?: Character })[]> {
    const rows = await db
      .select({
        conversation: conversations,
        character: characters
      })
      .from(conversations)
      .leftJoin(characters, eq(conversations.characterId, characters.id))
      .orderBy(desc(conversations.createdAt));
      
    return rows.map(r => ({
      ...r.conversation,
      character: r.character || undefined
    }));
  }

  async getConversation(id: number): Promise<(Conversation & { character?: Character }) | undefined> {
    const rows = await db
      .select({
        conversation: conversations,
        character: characters
      })
      .from(conversations)
      .leftJoin(characters, eq(conversations.characterId, characters.id))
      .where(eq(conversations.id, id));
      
    if (rows.length === 0) return undefined;
    
    return {
      ...rows[0].conversation,
      character: rows[0].character || undefined
    };
  }

  async createConversation(conversation: CreateConversationRequest): Promise<Conversation> {
    const [newConv] = await db.insert(conversations).values(conversation).returning();
    return newConv;
  }

  async deleteConversation(id: number): Promise<void> {
    // cascade delete handles messages
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(conversationId: number, role: string, content: string): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({ conversationId, role, content })
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
