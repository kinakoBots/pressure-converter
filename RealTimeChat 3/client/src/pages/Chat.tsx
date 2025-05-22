import { useState, useEffect, useCallback } from 'react';
import ChatHeader from '@/components/ChatHeader';
import ActiveUsersList from '@/components/ActiveUsersList';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import JoinPrompt from '@/components/JoinPrompt';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useNotificationSound } from '@/hooks/useNotificationSound';
import { SocketMessageType, ChatState } from '@/lib/types';
import { ChatUser, ChatMessage, ChatRoom } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const initialState: ChatState = {
  currentUser: null,
  messages: [],
  users: [],
  typingUsers: {},
  isLoggedIn: false,
  room: null,
};

export default function Chat() {
  const [chatState, setChatState] = useState<ChatState>(initialState);
  const { toast } = useToast();
  const { playNotification } = useNotificationSound();
  
  // Initialize WebSocket connection
  const { isConnected, connect, disconnect, send, on } = useWebSocket({
    onOpen: () => {
      console.log('Connected to chat server');
    },
    onClose: () => {
      console.log('Disconnected from chat server');
    },
    onError: () => {
      toast({
        title: 'Connection error',
        description: 'Failed to connect to the chat server. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Simple direct approach to joining chat
  const handleJoinChat = useCallback((username: string, roomId: string) => {
    // Connect first
    connect();
    
    // Wait a moment then send join message
    setTimeout(() => {
      send(SocketMessageType.JOIN, { username, roomId });
    }, 500);
  }, [connect, send]);
  
  // Send message handler
  const handleSendMessage = useCallback((text: string) => {
    if (text.trim() === '') return;
    
    send(SocketMessageType.MESSAGE, { text });
  }, [send]);
  
  // Basic text-only chat for now (will add image support later)
  const handleSendImage = useCallback((imageData: string) => {
    toast({
      title: 'Photo sharing',
      description: 'We\'re currently improving photo sharing. Please check back soon!',
    });
    
    // For now, we'll send a message indicating an image would have been shared
    send(SocketMessageType.MESSAGE, { 
      text: "📷 [Wanted to share a photo]"
    });
  }, [send, toast]);
  
  // Handle typing status
  const handleTyping = useCallback((isTyping: boolean) => {
    send(SocketMessageType.TYPING, { isTyping });
  }, [send]);
  
  // Try to reconnect if disconnected
  useEffect(() => {
    if (!isConnected && chatState.isLoggedIn && chatState.currentUser) {
      // If we were logged in but got disconnected, try to reconnect
      const reconnectTimer = setTimeout(() => {
        console.log("Attempting to reconnect...");
        connect();
        
        // Re-join the room
        if (chatState.currentUser && chatState.room) {
          setTimeout(() => {
            send(SocketMessageType.JOIN, { 
              username: chatState.currentUser?.username || 'Guest', 
              roomId: chatState.room?.id || 'general' 
            });
          }, 500);
        }
      }, 3000);
      
      return () => clearTimeout(reconnectTimer);
    }
  }, [isConnected, chatState.isLoggedIn, chatState.currentUser, chatState.room, connect, send]);

  // Register message handlers - simplified to avoid excessive reconnections
  useEffect(() => {
    // Only set up event handlers and connect once
    const removeJoinHandler = on(SocketMessageType.JOIN, (event) => {
      const { user, messages, room } = event.payload;
      
      setChatState(prevState => ({
        ...prevState,
        currentUser: user as ChatUser,
        messages: messages as ChatMessage[],
        room: room as ChatRoom,
        isLoggedIn: true,
      }));
    });
    
    const removeMessageHandler = on(SocketMessageType.MESSAGE, (event) => {
      const { message } = event.payload;
      
      // Play notification sound for new messages
      // Only play for messages from others, not our own
      if (message.userId !== chatState.currentUser?.id) {
        playNotification();
        
        // Also show a toast notification
        toast({
          title: `${message.username} says:`,
          description: message.text.length > 40 ? message.text.substring(0, 37) + '...' : message.text,
          duration: 3000,
        });
      }
      
      setChatState(prevState => ({
        ...prevState,
        messages: [...prevState.messages, message as ChatMessage],
      }));
    });
    
    const removeImageHandler = on(SocketMessageType.IMAGE, (event) => {
      const { message } = event.payload;
      
      // Play notification sound for new image messages 
      // Only play for images from others, not our own
      if (message.userId !== chatState.currentUser?.id) {
        playNotification();
        
        // Also show a toast notification for images
        toast({
          title: `${message.username} shared:`,
          description: "📷 Photo",
          duration: 3000,
        });
      }
      
      setChatState(prevState => ({
        ...prevState,
        messages: [...prevState.messages, message as ChatMessage],
      }));
    });
    
    const removeUsersHandler = on(SocketMessageType.USERS, (event) => {
      const { users } = event.payload;
      
      setChatState(prevState => {
        // Mark the current user
        const updatedUsers = (users as ChatUser[]).map(user => ({
          ...user,
          isCurrentUser: user.id === prevState.currentUser?.id,
        }));
        
        // Play a subtle notification if a new user joined (user count increased)
        if (updatedUsers.length > prevState.users.length) {
          // Only play if we're already logged in (to avoid sounds during initial load)
          if (prevState.isLoggedIn) {
            playNotification();
            
            // Find the new user(s) by comparing arrays
            const prevUserIds = new Set(prevState.users.map(u => u.id));
            const newUsers = updatedUsers.filter(u => !prevUserIds.has(u.id));
            
            if (newUsers.length > 0) {
              // Show notification for the first new user
              toast({
                title: "User joined",
                description: `${newUsers[0].username} has entered the chat`,
                duration: 3000
              });
            }
          }
        }
        
        return {
          ...prevState,
          users: updatedUsers,
        };
      });
    });
    
    const removeTypingHandler = on(SocketMessageType.TYPING, (event) => {
      const { user } = event.payload;
      const typingUser = user as ChatUser;
      
      setChatState(prevState => ({
        ...prevState,
        typingUsers: {
          ...prevState.typingUsers,
          [typingUser.id]: typingUser.isTyping,
        },
        users: prevState.users.map(u => 
          u.id === typingUser.id ? { ...u, isTyping: typingUser.isTyping } : u
        ),
      }));
    });
    
    const removeErrorHandler = on(SocketMessageType.ERROR, (event) => {
      const { message } = event.payload;
      
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    });
    
    // Don't connect here - we'll connect when user joins
    
    return () => {
      // Clean up event handlers and connection
      removeJoinHandler();
      removeMessageHandler();
      removeUsersHandler();
      removeTypingHandler();
      removeErrorHandler();
      disconnect();
    };
  }, [on, disconnect, toast]);
  
  // Get typing users, excluding current user
  const getTypingUsers = useCallback(() => {
    return chatState.users.filter(user => 
      user.isTyping && !user.isCurrentUser
    );
  }, [chatState.users]);
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {chatState.isLoggedIn ? (
        <>
          <ChatHeader 
            roomName={chatState.room?.name || 'Chat Room'} 
            activeUsers={chatState.users.length} 
          />
          
          <ActiveUsersList 
            users={chatState.users} 
            currentUser={chatState.currentUser} 
          />
          
          <MessageList 
            messages={chatState.messages} 
            currentUser={chatState.currentUser}
            typingUsers={getTypingUsers()}
          />
          
          <MessageInput 
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            onSendImage={handleSendImage}
          />
        </>
      ) : (
        <JoinPrompt onJoin={handleJoinChat} />
      )}
    </div>
  );
}
