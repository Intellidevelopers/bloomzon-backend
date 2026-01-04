const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Initialize app
const app = express();

// Connect DB
connectDB();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const countryRoutes = require('./routes/countryRoutes');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middlewares/errorHandler');

/* ---------------- Security ---------------- */
app.use(helmet());

/* ---------------- CORS (PUBLIC API) ---------------- */
app.use(
  cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* ---------------- Body Parsing ---------------- */
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ---------------- Logging ---------------- */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ---------------- Create Uploads Directory ---------------- */
const uploadsDir = path.join(__dirname, 'uploads', 'products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

/* ---------------- Serve Static Files ---------------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* ---------------- Rate Limiting ---------------- */
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api', limiter);

/* ---------------- Routes ---------------- */
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/countries', countryRoutes);
app.use('/api/v1/products', productRoutes);

/* ---------------- Health Check ---------------- */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    database: 'MongoDB',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/* ---------------- Root Endpoint ---------------- */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Bloomzon API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth',
      countries: '/api/v1/countries',
      products: '/api/v1/products',
    }
  });
});

/* ---------------- 404 ---------------- */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

/* ---------------- Error Handler ---------------- */
app.use(errorHandler);

/* ---------------- Server ---------------- */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🚀 Bloomzon API Server                 ║
║   📡 Server running on port ${PORT}         ║
║   🌐 Environment: ${process.env.NODE_ENV || 'development'}           ║
║   📂 API: http://localhost:${PORT}/api/v1    ║
╚═══════════════════════════════════════════╝
  `);
});

/* ---------------- Process Safety ---------------- */
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;