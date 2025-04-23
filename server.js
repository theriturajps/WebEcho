const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB with increased timeout and connection options
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Socket timeout
  connectTimeoutMS: 30000, // Connection timeout
  waitQueueTimeoutMS: 30000, // Wait queue timeout
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,  // Changed from true to false to prevent unnecessary saves
  saveUninitialized: false, // Don't save uninitialized sessions
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60, // 1 day in seconds (reduced from 14 days)
    autoRemove: 'interval',
    autoRemoveInterval: 60, // Remove expired sessions every 60 minutes
    touchAfter: 12 * 3600 // 12 hours - only update session if it's older than this
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day (reduced from 14 days)
    httpOnly: true,
    secure: true, // Always true for HTTPS,
    sameSite: 'none' // Required for cross-site cookies
  }
});

app.use((req, res, next) => {
  if (!req.session || !req.session.save) return next();
  if (req.path.startsWith('/api/') || !req.session.isModified) {
    return next();
  }
  req.session.save(err => {
    if (err) console.error('Session save error:', err);
    next();
  });
});

app.use(sessionMiddleware);

// Socket.io middleware for accessing session
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

// Routes
app.use('/auth', authRoutes);
app.use('/', profileRoutes);
app.use('/', roomRoutes);

// Socket.io connection handler
require('./socket')(io);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});