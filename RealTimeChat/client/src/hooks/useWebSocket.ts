import { useEffect, useState, useRef, useCallback } from "react";
import { SocketMessageEvent, SocketMessageType } from "@/lib/types";

type MessageHandler = (event: SocketMessageEvent) => void;

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

// Very simple WebSocket hook
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<SocketMessageType, MessageHandler[]>>(new Map());
  
  // Connect to the WebSocket server - simplified for reliability
  const connect = useCallback(() => {
    // Only create a new connection if we don't have one already
    if (socketRef.current) {
      return;
    }
    
    try {
      setIsConnecting(true);
      
      // Create WebSocket connection
      const socket = new WebSocket(`ws://${window.location.host}/ws`);
      
      socket.onopen = () => {
        console.log("WebSocket successfully connected");
        setIsConnected(true);
        setIsConnecting(false);
        options.onOpen?.();
      };
      
      socket.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        options.onClose?.();
      };
      
      socket.onerror = (error) => {
        console.error("WebSocket error occurred");
        options.onError?.(error);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SocketMessageEvent;
          console.log("Received message:", data.type);
          
          const handlers = messageHandlersRef.current.get(data.type);
          if (handlers) {
            handlers.forEach(handler => handler(data));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
    }
  }, [options]);
  
  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  // Send a message to the WebSocket server
  const send = useCallback((type: SocketMessageType, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    return false;
  }, []);
  
  // Register a message handler
  const on = useCallback((type: SocketMessageType, handler: MessageHandler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, []);
    }
    
    messageHandlersRef.current.get(type)!.push(handler);
    
    return () => {
      const handlers = messageHandlersRef.current.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }, []);
  
  // Clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);
  
  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    send,
    on,
  };
}
