import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import mediaRoutes from './routes/media';
import collectionRoutes from './routes/collection';
import followsRoutes from './routes/follows';
import notificationsRoutes from './routes/notifications';
import commentsRoutes from './routes/comments';
import usersRoutes from './routes/users';
import recommendationsRoutes from './routes/recommendations';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middlewares
// ============================================

// CORS - Configure for production
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Check if origin is allowed or if we allow all (*)
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // In production, be strict; in dev, be permissive
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with increased limit for avatar uploads (base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// Root
app.get('/', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'MediaTrack API is running',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            media: '/api/search, /api/media/:type/:id, /api/search/trending',
            collection: '/api/collection',
            friends: '/api/friends',
            notifications: '/api/notifications',
            comments: '/api/comments',
            users: '/api/users',
            recommendations: '/api/recommendations',
        },
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', mediaRoutes); // /api/search, /api/media/:type/:id, /api/search/trending
app.use('/api/collection', collectionRoutes);
app.use('/api/follows', followsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Handler - Must be after all routes
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            path: req.path,
            method: req.method,
        },
    });
});

// Global Error Handler - Must be last
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Global error handler:', err);

    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            error: {
                message: 'Validation error',
                details: err.message,
            },
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: {
                message: 'Unauthorized',
                details: err.message,
            },
        });
    }

    // Default error response
    res.status(err.status || 500).json({
        success: false,
        error: {
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log('🚀 ========================================');
    console.log(`✅ MediaTrack Backend running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log('🚀 ========================================');
});

// ============================================
// Process-level Error Handlers
// ============================================

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    // In production, you might want to exit the process
    // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
    console.error('❌ Uncaught Exception:', error);
    // In production, you should exit the process after cleanup
    // process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 SIGINT signal received: closing HTTP server');
    process.exit(0);
});
