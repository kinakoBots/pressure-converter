import { useEffect, useRef } from "react";
import { ChatMessage, ChatUser } from "@shared/schema";
import { format } from "date-fns";

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: ChatUser | null;
  typingUsers: ChatUser[];
}

export default function MessageList({ messages, currentUser, typingUsers }: MessageListProps) {
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);
  
  const formatTime = (timestamp: Date): string => {
    return format(new Date(timestamp), 'h:mm a');
  };
  
  const isSystemMessage = (message: ChatMessage): boolean => {
    return message.userId === 'system';
  };
  
  return (
    <div 
      ref={messageContainerRef}
      className="flex-grow overflow-y-auto px-4 py-6 space-y-4 message-list"
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#E5E7EB transparent'
      }}
    >
      {messages.map((message) => (
        isSystemMessage(message) ? (
          // System message (user joined/left)
          <div key={message.id} className="flex justify-center my-4">
            <div className="bg-gray-100 text-gray-600 rounded-full px-4 py-1 text-xs font-medium">
              {message.text}
            </div>
          </div>
        ) : (
          // Regular chat message
          <div 
            key={message.id}
            className={`flex flex-col max-w-[80%] md:max-w-[70%] ${
              message.userId === currentUser?.id ? 'ml-auto items-end' : ''
            }`}
          >
            <div className="flex items-center mb-1">
              {message.userId === currentUser?.id ? (
                <>
                  <span className="text-xs text-gray-400 mr-2">{formatTime(message.timestamp)}</span>
                  <span className="text-xs font-medium text-indigo-600">You</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-gray-700">{message.username}</span>
                  <span className="text-xs text-gray-400 ml-2">{formatTime(message.timestamp)}</span>
                </>
              )}
            </div>
            
            <div className={`${
              message.userId === currentUser?.id 
                ? 'bg-indigo-500 text-white rounded-lg rounded-tr-none' 
                : 'bg-white rounded-lg rounded-tl-none border border-gray-200'
              } px-4 py-2 shadow-sm`}
            >
              <p className={`text-sm ${message.userId === currentUser?.id ? '' : 'text-gray-800'}`}>
                {message.text}
              </p>
            </div>
          </div>
        )
      ))}
      
      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div className="flex flex-col max-w-[80%] md:max-w-[70%]">
          <div className="flex items-center mb-1">
            <span className="text-xs font-medium text-gray-700">
              {typingUsers[0].username}
            </span>
          </div>
          <div className="bg-gray-100 rounded-lg rounded-tl-none px-4 py-2 inline-block">
            <div className="flex typing-indicator">
              <span className="h-2 w-2 bg-gray-400 rounded-full mr-1"></span>
              <span className="h-2 w-2 bg-gray-400 rounded-full mr-1"></span>
              <span className="h-2 w-2 bg-gray-400 rounded-full"></span>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <p className="text-gray-500">No messages yet. Start the conversation!</p>
        </div>
      )}
    </div>
  );
}
