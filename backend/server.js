const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const projectRoutes = require('./routes/projectRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const invoicePDFRoutes = require('./routes/invoicePDFRoutes');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const env = require('./config/env');

const app = express();
const PORT = env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Create test user if it doesn't exist (for development)
const User = require('./models/User');
const createTestUser = async () => {
  try {
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (!existingUser) {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'admin'
      });
      console.log('Test user created: test@example.com / password123');
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Create test user in development
if (env.NODE_ENV !== 'production') {
  createTestUser();
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoicePDFRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Payment Dashboard API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
