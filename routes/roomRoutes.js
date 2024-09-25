const express = require('express');
const { createRoom, joinRoom } = require('../controllers/roomController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Route to create a room
router.post('/create-room',verifyToken, createRoom);

// Route to join a room
// router.post('/join-room/:roomId',verifyToken, joinRoom);

module.exports = router;
