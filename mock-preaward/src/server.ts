import express from 'express';
import cors from 'cors';
import formsRouter from './routes/forms';

const app = express();
app.disable('x-powered-by');
const PORT = 8081;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost origins for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Allow large JSON payloads for form data
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/forms', formsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Mock Pre-Award API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Mock Pre-Award API server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Forms endpoints:`);
  console.log(`  POST http://localhost:${PORT}/forms`);
  console.log(`  GET  http://localhost:${PORT}/forms`);
  console.log(`  GET  http://localhost:${PORT}/forms/{url_path}/draft`);
});