import { 
  type User, type InsertUser, 
  type ChatMessage, type ChatUser, type ChatRoom 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Chat methods
  getMessages(roomId: string): Promise<ChatMessage[]>;
  addMessage(message: ChatMessage): Promise<ChatMessage>;
  getRooms(): Promise<ChatRoom[]>;
  getRoom(roomId: string): Promise<ChatRoom | undefined>;
  getRoomUsers(roomId: string): Promise<ChatUser[]>;
  addUserToRoom(user: ChatUser): Promise<ChatUser>;
  removeUserFromRoom(userId: string, roomId: string): Promise<boolean>;
  updateUserStatus(userId: string, isTyping: boolean): Promise<ChatUser | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private chatMessages: Map<string, ChatMessage[]>;
  private chatUsers: Map<string, ChatUser[]>;
  private chatRooms: Map<string, ChatRoom>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.chatUsers = new Map();
    this.chatRooms = new Map();
    this.currentId = 1;
    
    // Initialize with default chat rooms
    const defaultRooms = [
      { id: "general", name: "General Chat" },
      { id: "tech", name: "Tech Discussion" },
      { id: "random", name: "Random Thoughts" }
    ];
    
    defaultRooms.forEach(room => {
      this.chatRooms.set(room.id, room);
      this.chatMessages.set(room.id, []);
      this.chatUsers.set(room.id, []);
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Chat methods
  async getMessages(roomId: string): Promise<ChatMessage[]> {
    return this.chatMessages.get(roomId) || [];
  }
  
  async addMessage(message: ChatMessage): Promise<ChatMessage> {
    const roomMessages = this.chatMessages.get(message.roomId) || [];
    roomMessages.push(message);
    this.chatMessages.set(message.roomId, roomMessages);
    return message;
  }
  
  async getRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values());
  }
  
  async getRoom(roomId: string): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(roomId);
  }
  
  async getRoomUsers(roomId: string): Promise<ChatUser[]> {
    return this.chatUsers.get(roomId) || [];
  }
  
  async addUserToRoom(user: ChatUser): Promise<ChatUser> {
    const roomUsers = this.chatUsers.get(user.roomId) || [];
    // Check if user already exists in the room (by ID)
    const existingUserIndex = roomUsers.findIndex(u => u.id === user.id);
    
    if (existingUserIndex !== -1) {
      // Update existing user
      roomUsers[existingUserIndex] = user;
    } else {
      // Add new user
      roomUsers.push(user);
    }
    
    this.chatUsers.set(user.roomId, roomUsers);
    return user;
  }
  
  async removeUserFromRoom(userId: string, roomId: string): Promise<boolean> {
    const roomUsers = this.chatUsers.get(roomId) || [];
    const updatedUsers = roomUsers.filter(user => user.id !== userId);
    this.chatUsers.set(roomId, updatedUsers);
    return roomUsers.length !== updatedUsers.length;
  }
  
  async updateUserStatus(userId: string, isTyping: boolean): Promise<ChatUser | undefined> {
    let updatedUser: ChatUser | undefined;
    
    // Update user typing status in all rooms
    for (const [roomId, users] of this.chatUsers.entries()) {
      const updatedUsers = users.map(user => {
        if (user.id === userId) {
          updatedUser = { ...user, isTyping };
          return updatedUser;
        }
        return user;
      });
      this.chatUsers.set(roomId, updatedUsers);
    }
    
    return updatedUser;
  }
}

export const storage = new MemStorage();
