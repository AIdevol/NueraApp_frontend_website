/**
 * WebSocket message types and payloads (aligned with backend schemas).
 */

import { WS_MESSAGE_TYPES } from "./constants";

export type WsMessageType = (typeof WS_MESSAGE_TYPES)[keyof typeof WS_MESSAGE_TYPES];

export interface WsMessage<T = Record<string, unknown>> {
  type: string;
  payload?: T | null;
}

export interface WsChatPayload {
  message: string;
  room_id?: string | null;
}

export interface WsChatReplyPayload {
  message: string;
  room_id?: string | null;
  sender_id?: string | null;
}

export interface WsNotificationPayload {
  title?: string;
  body?: string;
  link?: string | null;
  created_at?: string | null;
}

export interface WsPresencePayload {
  user_id?: string | number | null;
  online?: boolean;
  channel?: string | null;
}

export interface WsErrorPayload {
  code?: string;
  message?: string;
}

export type WsConnectionState = "connecting" | "open" | "closing" | "closed" | "error";

export interface UseWebSocketOptions {
  /** JWT for authenticated connection (user channel). */
  token?: string | null;
  /** Auto-reconnect on close. */
  reconnect?: boolean;
  /** Max reconnect attempts. */
  reconnectAttempts?: number;
  /** Reconnect delay in ms. */
  reconnectInterval?: number;
  /** Send ping interval in ms (0 = disabled). */
  pingInterval?: number;
  /** Callback when a message is received. */
  onMessage?: (message: WsMessage) => void;
  /** Callback when connection opens. */
  onOpen?: () => void;
  /** Callback when connection closes. */
  onClose?: (event: CloseEvent) => void;
  /** Callback on error. */
  onError?: (event: Event) => void;
}
