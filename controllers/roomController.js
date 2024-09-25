const Room = require('../models/room');
const { v4: uuidv4 } = require('uuid');

// Function to validate YouTube URL
const validateYouTubeUrl = (url) => {
  const regex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
  return regex.test(url);
};

// Create a new room
const createRoom = async (req, res) => {
  const { videoLink } = req.body;

  // Validate YouTube URL
  const isValid = validateYouTubeUrl(videoLink);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid YouTube URL' });
  }

  // Create new room with unique room ID
  const roomId = uuidv4();
  const newRoom = new Room({ roomId, videoLink });

  try {
    await newRoom.save();
    return res.status(201).json({ roomId, videoLink });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating room', error });
  }
};

// Join a room by roomId
// const joinRoom = async (req, res) => {
//   const { roomId } = req.params;
//   const {email}  = req.body;
//   console.log(email);

//   try {
//     const room = await Room.findOne({ roomId });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     // Add user to the room if not already present
//     if (!room.users.some(user => user.email === email)) {
//       room.users.push(email);
//       await room.save();
//     }

//     return res.status(200).json({ message: 'Joined room', room });
//   } catch (error) {
//     return res.status(500).json({ message: 'Error joining room', error });
//   }
// };

module.exports = { createRoom };
