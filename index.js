const express = require("express");
const http = require('http'); // Import http module
const socketIo = require('socket.io'); // Import socket.io
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth");
const verifyToken = require("./middleware/verifyToken");
const { connectDB } = require("./config/database");
const expressSession = require("express-session");
const cors = require("cors");
const roomRoutes = require('./routes/roomRoutes');
const socketHandler = require('./sockets/socketController');

// Initialize Express application
const app = express();

// CORS options
const corsOptions = {
  origin: ["http://localhost:3000", "https://isdl-lh-management.vercel.app","http://192.168.43.59:3000"],
  allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin", "Access-Control-Request-Headers"],
  credentials: true,
};

// Enable CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expressSession({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Adjust for HTTPS in production
    sameSite: "none",
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Connect to MongoDB
connectDB();

// API Routes
app.use("/auth", authRoutes);
app.use('/api/rooms', roomRoutes);

// Protected route
app.get("/api/user", verifyToken, (req, res) => {
  const userData = req.user;
  res.status(200).json({ user: userData });
});

// Create HTTP server and attach it to the Express app
const server = http.createServer(app); // Ensure this line is defined

// Initialize Socket.io with the HTTP server
const io = socketIo(server, {
  cors: {
    origin: corsOptions.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Handle WebSocket connections
socketHandler(io);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
