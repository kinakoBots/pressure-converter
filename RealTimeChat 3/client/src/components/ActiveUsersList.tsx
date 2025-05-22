import { ChatUser } from "@shared/schema";

interface ActiveUsersListProps {
  users: ChatUser[];
  currentUser: ChatUser | null;
}

export default function ActiveUsersList({ users, currentUser }: ActiveUsersListProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto">
      <div className="flex items-center space-x-2">
        <div className="flex-shrink-0">
          <span className="text-xs font-medium text-gray-500">Active now:</span>
        </div>
        
        {users.map((user) => (
          <div 
            key={user.id}
            className={`flex items-center px-2 py-1 rounded-full flex-shrink-0 ${
              user.isCurrentUser ? 'bg-indigo-100' : 'bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${user.isTyping ? 'bg-yellow-500' : 'bg-green-500'} mr-1.5`}></div>
            <span className={`text-xs font-medium ${
              user.isCurrentUser ? 'text-indigo-700' : 'text-gray-700'
            }`}>
              {user.isCurrentUser ? `You (${user.username})` : user.username}
            </span>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="flex items-center px-2 py-1 rounded-full bg-gray-100 flex-shrink-0">
            <span className="text-xs font-medium text-gray-700">No active users</span>
          </div>
        )}
      </div>
    </div>
  );
}
