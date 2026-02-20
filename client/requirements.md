## Packages
framer-motion | For smooth transitions and message animations
date-fns | For timestamp formatting
lucide-react | For beautiful icons (already in base but explicit is good)
clsx | For conditional class names (usually in base but useful)
tailwind-merge | For merging tailwind classes

## Notes
The backend uses Server-Sent Events (SSE) for chat responses.
Endpoint: POST /api/conversations/:id/messages
Response format: `data: {"content": "..."}` stream, ending with `data: {"done": true}`.
Need to handle this manually in the frontend as standard fetch/axios awaits the full response.
