const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Connect to MongoDB
connectDB();

// Import routes
const authRoutes = require('./routes/authRoutes');
const countryRoutes = require('./routes/countryRoutes');
const errorHandler = require('./middlewares/errorHandler');

/* ---------------- Security ---------------- */
app.use(helmet());

/* ---------------- CORS (PUBLIC ACCESS) ---------------- */
app.use(
  cors({
    origin: '*', // ✅ Allow ALL origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Handle preflight requests
app.options('*', cors());

/* ---------------- Body Parsing ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- Logging ---------------- */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ---------------- Rate Limiting ---------------- */
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter ONLY to API routes
app.use('/api', limiter);

/* ---------------- Routes ---------------- */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/countries', countryRoutes);

/* ---------------- Health Check ---------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
  });
});

/* ---------------- 404 Handler ---------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/* ---------------- Error Handler ---------------- */
app.use(errorHandler);

/* ---------------- Server ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api/v1`);
});

/* ---------------- Process Safety ---------------- */
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app;
