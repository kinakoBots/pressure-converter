# QuickChat - Real-time Chat Application

## Overview

QuickChat is a real-time chat application that allows users to join chat rooms without registration and start communicating instantly. The application features a modern UI, real-time messaging, typing indicators, and room-based conversations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

QuickChat follows a client-server architecture with:

1. **Frontend**: A React application built with TypeScript and using Shadcn UI components (based on Radix UI primitives).

2. **Backend**: An Express.js server that provides REST API endpoints and manages WebSocket connections.

3. **Database**: Uses Drizzle ORM for database operations, configured for PostgreSQL.

4. **Real-time Communication**: WebSockets (ws library) for real-time messaging and user presence.

5. **State Management**: React Query for server state and local React state for UI management.

The application is structured to maintain separation of concerns with a shared schema for type safety across frontend and backend.

## Key Components

### Frontend

1. **Main Chat Interface** (`Chat.tsx`):
   - Handles the overall chat layout and state management
   - Controls WebSocket connections and message flow

2. **Message Components**:
   - `MessageList.tsx`: Displays messages with auto-scrolling
   - `MessageInput.tsx`: Handles message composition with typing indicators

3. **User Interface**:
   - `JoinPrompt.tsx`: User onboarding component
   - `ActiveUsersList.tsx`: Shows who's currently in the room
   - `ChatHeader.tsx`: Room information and settings

4. **UI Library**:
   - Extensive set of UI components from Shadcn UI
   - Consistent styling through Tailwind CSS

### Backend

1. **Express Server** (`server/index.ts`):
   - Main application entry point
   - API route registration and middleware setup

2. **WebSocket Handler** (`server/routes.ts`):
   - WebSocket server initialization
   - Real-time message processing
   - User presence management

3. **Storage Layer** (`server/storage.ts`):
   - Interface for data operations
   - In-memory implementation for development
   - Database schema for persistent storage

4. **Schema** (`shared/schema.ts`):
   - Shared type definitions using Zod and Drizzle schema
   - Ensures type safety between frontend and backend

## Data Flow

1. **User Authentication**:
   - Guest-based authentication (no account needed)
   - Users provide a display name to join

2. **Room Management**:
   - Predefined chat rooms (general, tech, random)
   - Users can see who's active in each room

3. **Message Exchange**:
   - Messages sent from the client via WebSocket
   - Server validates and broadcasts to all users in the room
   - Messages are stored for history

4. **Real-time Updates**:
   - Typing indicators
   - User join/leave notifications
   - Active user list updates

## External Dependencies

### Frontend
- React and React DOM for UI
- Tailwind CSS for styling
- Radix UI components (via Shadcn UI)
- React Query for data fetching
- Wouter for routing
- Lucide for icons
- date-fns for date formatting

### Backend
- Express for the HTTP server
- ws for WebSocket functionality
- Drizzle ORM for database operations
- Zod for schema validation
- crypto (v4) for generating unique IDs

## Deployment Strategy

The application is configured to run in Replit with a deployment process that:

1. Builds the frontend to static assets using Vite
2. Compiles the server TypeScript code with esbuild
3. Serves the application from a single Node.js process
4. Uses PostgreSQL for data persistence (configured in the Replit environment)

The application handles both development and production environments with appropriate configurations for each.

## Database Structure

1. **Users Table**:
   - Basic user information (id, username, password)

2. **Chat Data**:
   - Messages are stored with user information, room ID, and timestamps
   - Rooms are predefined but can be expanded
   - User presence is tracked in real-time

## Development Notes

1. To run the application in development mode:
   ```
   npm run dev
   ```

2. To build for production:
   ```
   npm run build
   ```

3. To run the production build:
   ```
   npm run start
   ```

4. To update the database schema:
   ```
   npm run db:push
   ```

5. The application expects a PostgreSQL database connection string to be provided in the `DATABASE_URL` environment variable.