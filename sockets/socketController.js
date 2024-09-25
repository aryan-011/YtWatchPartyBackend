const Room = require("../models/room");
const User = require("../models/User");
const ChatRoom = require("../models/chat");

module.exports = (io) => {
  const roomStates = new Map();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    socket.on("joinRoom", async (data) => {
      const { roomId, userId } = data;
      console.log("Joining room:", data);

      try {
        let room = await Room.findOne({ roomId }).populate('users').populate({
          path: 'chatRoom',  
          populate: {  
            path: 'messages.user', 
            select: 'name'  
          }
        });
        if (!room) {
          console.log("Room not found:", roomId);
          return socket.emit("error", "Room not found");
        }

        const user = await User.findById(userId);
        if (!user) {
          console.log("User not found:", userId);
          return socket.emit("error", "User not found");
        }

        socket.join(roomId);

        // Add user to the room's users array if not already present
        if (!room.users.some(u => u._id.toString() === userId)) {
          room.users.push(userId);
          await room.save();
        }

        if (!roomStates.has(roomId)) {
          roomStates.set(roomId, {
            state: room.state || null,
            currentTime: room.currentTime || 0,
            leader: socket.id
          });
        }

        const roomState = roomStates.get(roomId);

        // Ensure ChatRoom exists for this room
        if (!room.chatRoom) {
          const newChatRoom = await ChatRoom.create({ room: room._id });
          room.chatRoom = newChatRoom._id;
          await room.save();
        }

        room = await Room.findOne({ roomId }).populate('users').populate({
          path: 'chatRoom',  
          populate: {  
            path: 'messages.user', 
            select: 'name'  
          }
        });

        // Fetch recent chat messages for the room
        const recentMessages = room.chatRoom.messages.slice(-50).map(msg => ({
          _id: msg._id,
          user: msg.user,  // Send the full populated user object
          content: msg.content,
          timestamp: msg.timestamp
        }));
        

        // Fetch the current users in the room
        const usersInRoom = room.users.map(u => ({
          _id: u._id,
          name: u.name,
        }));

        socket.emit("roomData", {
          room,
          state: roomState.state,
          currentTime: roomState.currentTime,
          recentMessages,
          users: usersInRoom // Add the users list to the emitted room data
        });

        // Notify other users in the room about the new user
        socket.to(roomId).emit('userJoined', { userId: user._id, name: user.name });

        // Associate the socket with the user and room
        socket.userId = userId;
        socket.currentRoom = roomId;

      } catch (error) {
        console.error("Error handling room:", error);
        socket.emit("error", "An error occurred while joining the room");
      }
    });

    socket.on("videoStateChange", async (data) => {
      const { roomId, state, currentTime } = data;

      const roomState = roomStates.get(roomId);
      if (roomId && roomState) {
        roomState.state = state;
        roomState.currentTime = currentTime;
        console.log("Video state change received:", data);
        io.to(roomId).emit('videoStateUpdate', { state, currentTime });

        // Update room state in the database
        await Room.findOneAndUpdate({ roomId }, { state, currentTime });
      }
    });

    socket.on("sendMessage", async (data) => {
      const { roomId, message } = data;
      const userId = socket.userId;  // Use the associated userId
      
      try {
        const room = await Room.findOne({ roomId }).populate('chatRoom');
        if (!room) {
          return socket.emit("error", "Room not found");
        }
    
        const user = await User.findById(userId);
        if (!user) {
          return socket.emit("error", "User not found");
        }
    
        // Add message to the ChatRoom with timestamp
        const newMessage = {
          user: user._id,
          content: message,
          timestamp: new Date() // Assigning current timestamp manually
        };
    
        room.chatRoom.messages.push(newMessage);
        await room.chatRoom.save();
    
        // Emit the message to all users in the room
        io.to(roomId).emit('chatMessage', {
          _id: newMessage._id || "temp-id",  // Fallback to avoid undefined _id
          user: { _id: user._id, name: user.name },  // Send full user object
          content: newMessage.content,
          timestamp: newMessage.timestamp || new Date()  // Fallback to avoid undefined timestamp
        });
        
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", "An error occurred while sending the message");
      }
    });
    

    socket.on("disconnecting", async () => {
      const roomId = socket.currentRoom;
      const userId = socket.userId;

      if (roomId && userId) {
        try {
          const room = await Room.findOne({ roomId }).populate('users');
          if (room) {
            // Remove user from the room's users array
            room.users = room.users.filter(u => u._id.toString() !== userId);
            await room.save();

            const user = await User.findById(userId);
            if (user) {
              // Notify other users about the user leaving
              socket.to(roomId).emit('userLeft', { userId: user._id, name: user.name });
            }

            // Update room state
            const roomState = roomStates.get(roomId);
            if (roomState) {
              if (room.users.length === 0) {
                // Store final room state in the database
                await Room.findOneAndUpdate(
                  { roomId },
                  { 
                    state: roomState.state,
                    currentTime: roomState.currentTime
                  }
                );
                
                // Remove room state from memory
                roomStates.delete(roomId);
              } else if (roomState.leader === socket.id) {
                // If the disconnecting socket was the leader, assign leadership to another socket in the room
                const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
                if (socketsInRoom) {
                  const newLeader = Array.from(socketsInRoom).find(id => id !== socket.id);
                  if (newLeader) {
                    roomState.leader = newLeader;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error("Error handling disconnection:", error);
        }
      }
    });
  });
};
