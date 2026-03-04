require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const gamesRouter = require('./routes/games');
const tournamentsRouter = require('./routes/tournaments');
const lobbiesRouter = require('./routes/lobbies');
const matchesRouter = require('./routes/matches');
const rankingsRouter = require('./routes/rankings');
const storeRouter = require('./routes/store');
const chatRouter = require('./routes/chat');
const adminRouter = require('./routes/admin');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS - aceita múltiplas origins (separadas por vírgula no env)
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: function (origin, callback) {
    // Permite requests sem origin (curl, mobile, etc)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Body parsing with size limit
app.use(express.json({ limit: '10kb' }));

// Rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

const storeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many purchase attempts. Please try again later.' },
});

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api/store', storeLimiter);
app.use('/api', apiLimiter);

// Routes
app.use('/api/games', gamesRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/lobbies', lobbiesRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/rankings', rankingsRouter);
app.use('/api/store', storeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/admin', adminRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// Global error handling middleware
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'development'
    ? err.message || 'Internal server error.'
    : 'Internal server error.';
  res.status(statusCode).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Rise Up backend running on port ${PORT}`);
});
