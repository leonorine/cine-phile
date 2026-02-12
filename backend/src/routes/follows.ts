import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';
import { createNotification, userExists } from '../utils/notifications';

const router = Router();

// All routes are protected
router.use(authMiddleware);

// ============================================
// Validation Schemas
// ============================================

const userIdSchema = z.object({
    userId: z.string().uuid('ID utilisateur invalide'),
});

// ============================================
// POST /api/follows/:userId
// Follow a user
// ============================================
router.post('/:userId', async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user!.id;

        // Validate params
        const validationResult = userIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { userId } = validationResult.data;

        // Check if trying to follow self
        if (userId === currentUserId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Vous ne pouvez pas vous suivre vous-même',
                },
            });
        }

        // Check if user exists
        const targetUserExists = await userExists(userId);
        if (!targetUserExists) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utilisateur non trouvé',
                },
            });
        }

        // Check if already following
        const { data: existingFollow } = await db
            .from('follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', userId)
            .maybeSingle();

        if (existingFollow) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Vous suivez déjà cet utilisateur',
                },
            });
        }

        // Create follow
        const { data: follow, error: followError } = await db
            .from('follows')
            .insert({
                follower_id: currentUserId,
                following_id: userId,
            })
            .select()
            .single();

        if (followError) {
            console.error('Error creating follow:', followError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de l\'abonnement',
                },
            });
        }

        // Create notification for the followed user
        await createNotification(userId, 'friend_request', currentUserId);

        res.status(201).json({
            success: true,
            data: follow,
        });
    } catch (error) {
        console.error('Unexpected error in follow user:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// DELETE /api/follows/:userId
// Unfollow a user
// ============================================
router.delete('/:userId', async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user!.id;

        // Validate params
        const validationResult = userIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { userId } = validationResult.data;

        // Delete follow
        const { error } = await db
            .from('follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', userId);

        if (error) {
            console.error('Error deleting follow:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors du désabonnement',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Désabonnement réussi',
            },
        });
    } catch (error) {
        console.error('Unexpected error in unfollow user:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/follows/followers
// Get users who follow me
// ============================================
router.get('/followers', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get followers (users who follow me)
        const { data: follows, error: followsError } = await db
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);

        if (followsError) {
            console.error('Error fetching followers:', followsError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des abonnés',
                },
            });
        }

        const followerIds = follows.map((f: any) => f.follower_id);

        if (followerIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        // Fetch follower details
        const { data: followers, error: followersError } = await db
            .from('users')
            .select('id, username, avatar_url')
            .in('id', followerIds);

        if (followersError) {
            console.error('Error fetching follower details:', followersError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des détails des abonnés',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: followers.map((f: any) => ({
                id: f.id,
                pseudo: f.username,
                avatar_url: f.avatar_url,
            })),
        });
    } catch (error) {
        console.error('Unexpected error in get followers:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/follows/following
// Get users I follow
// ============================================
router.get('/following', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get following (users I follow)
        const { data: follows, error: followsError } = await db
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

        if (followsError) {
            console.error('Error fetching following:', followsError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des abonnements',
                },
            });
        }

        const followingIds = follows.map((f: any) => f.following_id);

        if (followingIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        // Fetch following details
        const { data: following, error: followingError } = await db
            .from('users')
            .select('id, username, avatar_url')
            .in('id', followingIds);

        if (followingError) {
            console.error('Error fetching following details:', followingError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des détails des abonnements',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: following.map((f: any) => ({
                id: f.id,
                pseudo: f.username,
                avatar_url: f.avatar_url,
            })),
        });
    } catch (error) {
        console.error('Unexpected error in get following:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/follows/check/:userId
// Check if I follow a specific user
// ============================================
router.get('/check/:userId', async (req: Request, res: Response) => {
    try {
        const currentUserId = req.user!.id;

        // Validate params
        const validationResult = userIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { userId } = validationResult.data;

        const { data: follow } = await db
            .from('follows')
            .select('id')
            .eq('follower_id', currentUserId)
            .eq('following_id', userId)
            .maybeSingle();

        res.status(200).json({
            success: true,
            data: {
                isFollowing: !!follow,
            },
        });
    } catch (error) {
        console.error('Unexpected error in check follow:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

export default router;
