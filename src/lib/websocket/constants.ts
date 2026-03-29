/**
 * WebSocket constants (paths and message type strings).
 */

export const DEFAULT_WS_PATH = "/api/v1/ws";

export const WS_MESSAGE_TYPES = {
  PING: "ping",
  PONG: "pong",
  CHAT: "chat",
  CHAT_REPLY: "chat_reply",
  NOTIFICATION: "notification",
  PRESENCE: "presence",
  ERROR: "error",
  ACK: "ack",
} as const;
