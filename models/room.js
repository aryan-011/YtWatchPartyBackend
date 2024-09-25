const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  videoLink: { type: String, required: true },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  chatRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' },
  state: { type: String, default: null },
  currentTime: { type: Number, default: 0 }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;