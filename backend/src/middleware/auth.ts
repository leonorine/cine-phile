import { Request, Response, NextFunction } from 'express';
import { verifySupabaseToken } from '../config/supabase';

// Extend Express Request type to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
                [key: string]: any;
            };
        }
    }
}

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header and adds user to request context
 * Returns 401 if token is missing or invalid
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No authorization header provided',
            });
            return;
        }

        // Check if header follows "Bearer <token>" format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid authorization header format. Expected: Bearer <token>',
            });
            return;
        }

        const token = parts[1];

        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'No token provided',
            });
            return;
        }

        // Verify token using Supabase
        const user = await verifySupabaseToken(token);

        if (!user) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token',
            });
            return;
        }

        // Add user to request context
        req.user = {
            id: user.id,
            email: user.email,
            ...user,
        };

        // Continue to next middleware/route handler
        next();
    } catch (error) {
        console.error('Authentication middleware error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An error occurred during authentication',
        });
    }
}

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't return 401 if no token is provided
 * Useful for routes that work for both authenticated and unauthenticated users
 */
export async function optionalAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            // No token provided, continue without user context
            next();
            return;
        }

        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            const token = parts[1];
            const user = await verifySupabaseToken(token);

            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    ...user,
                };
            }
        }

        next();
    } catch (error) {
        console.error('Optional authentication middleware error:', error);
        // Don't fail the request, just continue without user context
        next();
    }
}
