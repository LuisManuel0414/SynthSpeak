import { z } from 'zod';
import { 
  insertCharacterSchema, 
  insertConversationSchema, 
  insertMessageSchema,
  characters,
  conversations,
  messages
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  characters: {
    list: {
      method: 'GET' as const,
      path: '/api/characters' as const,
      responses: {
        200: z.array(z.custom<typeof characters.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/characters/:id' as const,
      responses: {
        200: z.custom<typeof characters.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/characters' as const,
      input: insertCharacterSchema,
      responses: {
        201: z.custom<typeof characters.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  conversations: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations' as const,
      responses: {
        200: z.array(z.custom<typeof conversations.$inferSelect & { character?: typeof characters.$inferSelect }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/conversations/:id' as const,
      responses: {
        200: z.custom<typeof conversations.$inferSelect & { character?: typeof characters.$inferSelect }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/conversations' as const,
      input: z.object({ characterId: z.number() }),
      responses: {
        201: z.custom<typeof conversations.$inferSelect>(),
        400: errorSchemas.validation,
      },
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/conversations/:id/messages' as const,
      responses: {
        200: z.array(z.custom<typeof messages.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
    send: {
      method: 'POST' as const,
      path: '/api/conversations/:id/messages' as const,
      input: z.object({ content: z.string() }),
      responses: {
        // SSE responses don't fit perfectly in this model, but we define the final shape
        200: z.void(), 
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Type Helpers
export type CharacterListResponse = z.infer<typeof api.characters.list.responses[200]>;
export type ConversationListResponse = z.infer<typeof api.conversations.list.responses[200]>;
export type MessageListResponse = z.infer<typeof api.messages.list.responses[200]>;

// Export schemas so frontend can use them
export {
  insertCharacterSchema,
  insertConversationSchema,
  insertMessageSchema
} from './schema';
