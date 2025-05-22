import { useEffect, useState, useRef, useCallback } from "react";
import { SocketMessageEvent, SocketMessageType } from "@/lib/types";

type MessageHandler = (event: SocketMessageEvent) => void;

interface UseWebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

// Enhanced WebSocket hook with reconnection support
export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<SocketMessageType, MessageHandler[]>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Keep track of connection status for longer periods
  const hasDisconnectedRef = useRef(false);
  
  // Connect to the WebSocket server with improved handling
  const connect = useCallback(() => {
    // Clear any pending reconnection timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // If already connected and socket is open, don't create a new connection
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      setIsConnected(true);
      return;
    }
    
    // If in connecting state, wait
    if (isConnecting) {
      return;
    }
    
    try {
      setIsConnecting(true);
      
      // Close any existing connection
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      
      // Use the simplest, most reliable approach to WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Use relative URL - this approach works in all environments including Replit
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log("Connecting to WebSocket at:", wsUrl);
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log("WebSocket successfully connected");
        setIsConnected(true);
        setIsConnecting(false);
        hasDisconnectedRef.current = false;
        options.onOpen?.();
      };
      
      socket.onclose = () => {
        console.log("WebSocket closed");
        setIsConnected(false);
        setIsConnecting(false);
        socketRef.current = null;
        
        // Only trigger onClose if we had a real disconnection, not just a page refresh
        if (hasDisconnectedRef.current) {
          options.onClose?.();
        }
        
        // Mark as disconnected for future reference
        hasDisconnectedRef.current = true;
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
  }, [isConnecting, options]);
  
  // Disconnect from WebSocket server
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);
  
  // Simplified message sending - focusing on text reliability first
  const send = useCallback((type: SocketMessageType, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      try {
        // Log what we're sending for debugging
        console.log(`Sending ${type} message`);
        
        // Send the message - simple and direct approach
        socketRef.current.send(JSON.stringify({ type, payload }));
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    } else {
      console.warn("WebSocket not connected - cannot send message");
      return false;
    }
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
