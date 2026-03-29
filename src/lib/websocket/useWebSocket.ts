"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_WS_PATH } from "./constants";
import { getWsUrl } from "./url";
import type { WsConnectionState, WsMessage, UseWebSocketOptions } from "./types";

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    token = null,
    reconnect = true,
    reconnectAttempts = 10,
    reconnectInterval = 3000,
    pingInterval = 30000,
    onMessage,
    onOpen,
    onClose,
    onError,
  } = options;

  const [connectionState, setConnectionState] = useState<WsConnectionState>("closed");
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const send = useCallback(
    (message: WsMessage) => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    },
    []
  );

  const sendChat = useCallback(
    (message: string, roomId?: string | null) => {
      send({
        type: "chat",
        payload: { message, room_id: roomId ?? undefined },
      });
    },
    [send]
  );

  const sendPing = useCallback(() => {
    send({ type: "ping", payload: {} });
  }, [send]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    const url = getWsUrl(DEFAULT_WS_PATH, token ?? optionsRef.current.token);
    setConnectionState("connecting");
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectCountRef.current = 0;
      setConnectionState("open");
      onOpen?.();
      optionsRef.current.onOpen?.();
      if (pingInterval > 0) {
        pingTimerRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            sendPing();
          }
        }, pingInterval);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsMessage;
        setLastMessage(data);
        onMessage?.(data);
        optionsRef.current.onMessage?.(data);
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = (event) => {
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      wsRef.current = null;
      setConnectionState("closed");
      onClose?.(event);
      optionsRef.current.onClose?.(event);

      if (reconnect && optionsRef.current.reconnect !== false && reconnectCountRef.current < reconnectAttempts) {
        reconnectCountRef.current += 1;
        setTimeout(() => connect(), reconnectInterval);
      }
    };

    ws.onerror = (event) => {
      setConnectionState("error");
      onError?.(event);
      optionsRef.current.onError?.(event);
    };
  }, [token, reconnect, reconnectAttempts, reconnectInterval, pingInterval, onMessage, onOpen, onClose, onError, sendPing]);

  const disconnect = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    reconnectCountRef.current = reconnectAttempts + 1;
    setConnectionState("closed");
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    connectionState,
    lastMessage,
    send,
    sendChat,
    sendPing,
    connect,
    disconnect,
    isConnected: connectionState === "open",
  };
}
