'use strict'

// Load environment variables
require('dotenv').config()

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')

const crashesRouter = require('./routes/crashes')
const chatRouter = require('./routes/chat')
const authRouter = require('./routes/auth')
const packagesRouter = require('./routes/packages')
const codeRouter = require('./routes/code')

const app = express()
const server = http.createServer(app)

// Fetch environment settings
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('[server] Error: MONGODB_URI is not defined in the environment variables.')
  process.exit(1)
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('[server] Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('[server] MongoDB connection error:', err.message)
    console.log('[server] Server will continue running; Mongoose will retry connection in the background.')
  })

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Configure Express CORS
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST'],
  credentials: true,
}))

// Body parser middleware
app.use(express.json())

// Inject socket.io instance into req
app.use((req, res, next) => {
  req.io = io
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: NODE_ENV,
  })
})

// Bind routes
app.use('/api/auth', authRouter)
app.use('/api/crashes', crashesRouter)
app.use('/api/chat', chatRouter)
app.use('/api/packages', packagesRouter)
app.use('/api/code', codeRouter)

// Monitor Socket.io connections with Auth
const jwt = require('jsonwebtoken')
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_crashsense_2026'

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id; // Store user ID on socket
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[socket] Client connected: ${socket.id} (User: ${socket.userId})`)
  
  // Join a room specific to this user so we can isolate events
  socket.join(socket.userId)

  socket.on('disconnect', () => {
    console.log(`[socket] Client disconnected: ${socket.id}`)
  })
})

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[server] Unhandled route error:', err.stack)
  res.status(500).json({ error: 'Internal server error' })
})

// Start server listening
server.listen(PORT, () => {
  console.log(`[server] Server listening on port ${PORT} in ${NODE_ENV} mode`)
})
