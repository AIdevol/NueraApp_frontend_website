"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useWebSocket } from "./useWebSocket";
import type { WsMessage, UseWebSocketOptions } from "./types";

type Listener = (message: WsMessage) => void;

interface WebSocketContextValue {
  connectionState: ReturnType<typeof useWebSocket>["connectionState"];
  lastMessage: WsMessage | null;
  isConnected: boolean;
  send: (message: WsMessage) => void;
  sendChat: (message: string, roomId?: string | null) => void;
  subscribe: (listener: Listener) => () => void;
  connect: () => void;
  disconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  token?: string | null;
  options?: Omit<UseWebSocketOptions, "token" | "onMessage">;
}

export function WebSocketProvider({ children, token, options }: WebSocketProviderProps) {
  const listenersRef = React.useRef<Set<Listener>>(new Set());
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);

  const handleMessage = useCallback((message: WsMessage) => {
    setLastMessage(message);
    listenersRef.current.forEach((fn) => {
      try {
        fn(message);
      } catch (e) {
        console.warn("WebSocket listener error", e);
      }
    });
  }, []);

  const ws = useWebSocket({
    ...options,
    token,
    onMessage: handleMessage,
  });

  const subscribe = useCallback((listener: Listener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const value = useMemo<WebSocketContextValue>(
    () => ({
      connectionState: ws.connectionState,
      lastMessage: ws.lastMessage,
      isConnected: ws.isConnected,
      send: ws.send,
      sendChat: ws.sendChat,
      subscribe,
      connect: ws.connect,
      disconnect: ws.disconnect,
    }),
    [ws.connectionState, ws.lastMessage, ws.isConnected, ws.send, ws.sendChat, ws.connect, ws.disconnect, subscribe]
  );

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>;
}

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return ctx;
}

export function useWebSocketContextOptional(): WebSocketContextValue | null {
  return useContext(WebSocketContext);
}
