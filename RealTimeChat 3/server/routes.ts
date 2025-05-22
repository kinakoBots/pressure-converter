import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { v4 as uuidv4 } from "uuid";
import { socketMessageSchema, chatMessageSchema, chatUserSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server with better error handling
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    clientTracking: true,
    perMessageDeflate: false
  });
  
  // Store clients with their data
  const clients = new Map<WebSocket, { userId: string, roomId: string }>();
  
  // Helper function to broadcast message to all clients in a room
  function broadcastToRoom(roomId: string, message: any) {
    clients.forEach((data, client) => {
      if (data.roomId === roomId && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  // API routes
  app.get('/api/rooms', async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch rooms' });
    }
  });
  
  app.get('/api/rooms/:roomId/messages', async (req, res) => {
    try {
      const { roomId } = req.params;
      const messages = await storage.getMessages(roomId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });
  
  app.get('/api/rooms/:roomId/users', async (req, res) => {
    try {
      const { roomId } = req.params;
      const users = await storage.getRoomUsers(roomId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userId = '';
    let roomId = '';
    let pingInterval: NodeJS.Timeout;
    let pingTimeout: NodeJS.Timeout;
    
    // Setup ping-pong to keep connection alive
    function heartbeat() {
      clearTimeout(pingTimeout);
      
      // Set a timeout to consider the connection dead
      pingTimeout = setTimeout(() => {
        console.log('Connection timed out');
        ws.terminate();
      }, 120000); // 2 minutes
    }
    
    // Start the heartbeat
    heartbeat();
    
    // Set up pong response
    ws.on('pong', heartbeat);
    
    // Send regular pings
    pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // every 30 seconds
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join': {
            // User joins a room
            const { username, roomId: newRoomId } = message.payload;
            userId = uuidv4();
            roomId = newRoomId;
            
            // Store client information
            clients.set(ws, { userId, roomId });
            
            // Create and add user to room
            const user = chatUserSchema.parse({
              id: userId,
              username,
              roomId,
              isTyping: false,
              isCurrentUser: false
            });
            
            await storage.addUserToRoom(user);
            
            // Send confirmation to the client
            ws.send(JSON.stringify({
              type: 'join',
              payload: {
                user: { ...user, isCurrentUser: true },
                messages: await storage.getMessages(roomId),
                room: await storage.getRoom(roomId)
              }
            }));
            
            // Broadcast updated user list to all clients in the room
            broadcastToRoom(roomId, {
              type: 'users',
              payload: {
                users: await storage.getRoomUsers(roomId)
              }
            });
            
            // Broadcast join message
            const joinMessage = chatMessageSchema.parse({
              id: uuidv4(),
              text: `${username} has joined the chat`,
              roomId,
              userId: 'system',
              username: 'System',
              timestamp: new Date()
            });
            
            await storage.addMessage(joinMessage);
            
            broadcastToRoom(roomId, {
              type: 'message',
              payload: {
                message: joinMessage
              }
            });
            
            break;
          }
          
          case 'message': {
            // User sends a message
            const { text } = message.payload;
            
            if (!userId || !roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'You must join a room first' }
              }));
              break;
            }
            
            // Get user info
            const roomUsers = await storage.getRoomUsers(roomId);
            const user = roomUsers.find(u => u.id === userId);
            
            if (!user) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'User not found in room' }
              }));
              break;
            }
            
            // Create and store message
            const newMessage = chatMessageSchema.parse({
              id: uuidv4(),
              text,
              roomId,
              userId,
              username: user.username,
              timestamp: new Date()
            });
            
            await storage.addMessage(newMessage);
            
            // Broadcast message to all users in the room
            broadcastToRoom(roomId, {
              type: 'message',
              payload: {
                message: newMessage
              }
            });
            
            break;
          }
          
          case 'typing': {
            // Update user typing status
            const { isTyping } = message.payload;
            
            if (!userId || !roomId) break;
            
            // Update user typing status
            const updatedUser = await storage.updateUserStatus(userId, isTyping);
            
            if (updatedUser) {
              // Broadcast typing status to all users in the room
              broadcastToRoom(roomId, {
                type: 'typing',
                payload: {
                  user: updatedUser
                }
              });
            }
            
            break;
          }
          
          case 'image': {
            // User sends an image
            const { imageUrl, text } = message.payload;
            
            if (!userId || !roomId) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'You must join a room first' }
              }));
              break;
            }
            
            // Get user info
            const roomUsers = await storage.getRoomUsers(roomId);
            const user = roomUsers.find(u => u.id === userId);
            
            if (!user) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'User not found in room' }
              }));
              break;
            }
            
            // Create and store image message
            const newImageMessage = chatMessageSchema.parse({
              id: uuidv4(),
              text: text || '',
              roomId,
              userId,
              username: user.username,
              timestamp: new Date(),
              imageUrl,
              messageType: 'image'
            });
            
            await storage.addMessage(newImageMessage);
            
            // Broadcast image message to all users in the room
            broadcastToRoom(roomId, {
              type: 'message',
              payload: {
                message: newImageMessage
              }
            });
            
            break;
          }
          
          default:
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' }
        }));
      }
    });
    
    ws.on('close', async () => {
      console.log('WebSocket client disconnected');
      
      // Clear intervals and timeouts
      clearInterval(pingInterval);
      clearTimeout(pingTimeout);
      
      // Remove client from map right away
      clients.delete(ws);
      
      // Don't immediately remove the user - give them a chance to reconnect
      setTimeout(async () => {
        // Check if the user reconnected (is in any active connection)
        let userReconnected = false;
        clients.forEach((data) => {
          if (data.userId === userId) {
            userReconnected = true;
          }
        });
        
        // Only remove the user if they haven't reconnected and had actually joined
        if (!userReconnected && userId && roomId) {
          // Get user info before removing
          const roomUsers = await storage.getRoomUsers(roomId);
          const user = roomUsers.find(u => u.id === userId);
          
          // Remove user from room
          await storage.removeUserFromRoom(userId, roomId);
          
          if (user) {
            // Broadcast leave message
            const leaveMessage = chatMessageSchema.parse({
              id: uuidv4(),
              text: `${user.username} has left the chat`,
              roomId,
              userId: 'system',
              username: 'System',
              timestamp: new Date()
            });
            
            await storage.addMessage(leaveMessage);
            
            broadcastToRoom(roomId, {
              type: 'message',
              payload: {
                message: leaveMessage
              }
            });
            
            // Broadcast updated user list
            broadcastToRoom(roomId, {
              type: 'users',
              payload: {
                users: await storage.getRoomUsers(roomId)
              }
            });
          }
        }
      }, 30000); // 30 second delay before removing user
    });
  });
  
  return httpServer;
}