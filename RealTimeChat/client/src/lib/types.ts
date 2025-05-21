import { ChatRoom, ChatUser, ChatMessage } from "@shared/schema";

export interface ChatState {
  currentUser: ChatUser | null;
  messages: ChatMessage[];
  users: ChatUser[];
  typingUsers: Record<string, boolean>;
  isLoggedIn: boolean;
  room: ChatRoom | null;
}

export enum SocketMessageType {
  JOIN = 'join',
  LEAVE = 'leave',
  MESSAGE = 'message',
  TYPING = 'typing',
  USERS = 'users',
  ERROR = 'error',
}

export interface SocketMessageEvent {
  type: SocketMessageType;
  payload: any;
}

export interface JoinPayload {
  username: string;
  roomId: string;
}

export interface MessagePayload {
  text: string;
}

export interface TypingPayload {
  isTyping: boolean;
}
