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

const friendIdSchema = z.object({
    friend_id: z.string().uuid('ID ami invalide'),
});

// ============================================
// POST /api/friends/add/:friend_id
// ============================================
router.post('/add/:friend_id', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const validationResult = friendIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { friend_id } = validationResult.data;

        // Check if trying to add self
        if (friend_id === userId) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Vous ne pouvez pas vous ajouter vous-même comme ami',
                },
            });
        }

        // Check if friend exists
        const friendExistsResult = await userExists(friend_id);
        if (!friendExistsResult) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utilisateur non trouvé',
                },
            });
        }

        // Check if friendship already exists (in either direction)
        const { data: existingFriendship } = await db
            .from('friends')
            .select('id')
            .or(`and(user_id.eq.${userId},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${userId})`)
            .maybeSingle();

        if (existingFriendship) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Vous êtes déjà amis',
                },
            });
        }

        // Create friendship (MVP: direct acceptance)
        const { data: friendship, error: friendshipError } = await db
            .from('friends')
            .insert({
                user_id: userId,
                friend_id,
                status: 'accepted',
            })
            .select()
            .single();

        if (friendshipError) {
            console.error('Error creating friendship:', friendshipError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de l\'ajout de l\'ami',
                },
            });
        }

        // Create notification for the friend
        await createNotification(friend_id, 'friend_request', userId);

        res.status(201).json({
            success: true,
            data: friendship,
        });
    } catch (error) {
        console.error('Unexpected error in add friend:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/friends
// ============================================
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Get friendships where user is either user_id or friend_id
        const { data: friendships, error: friendshipsError } = await db
            .from('friends')
            .select('user_id, friend_id')
            .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
            .eq('status', 'accepted');

        if (friendshipsError) {
            console.error('Error fetching friendships:', friendshipsError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des amis',
                },
            });
        }

        // Extract friend IDs (the ID that is not the current user)
        const friendIds = friendships.map((f: any) =>
            f.user_id === userId ? f.friend_id : f.user_id
        );

        if (friendIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
            });
        }

        // Fetch friend details
        const { data: friends, error: friendsError } = await db
            .from('users')
            .select('id, username, avatar_url')
            .in('id', friendIds);

        if (friendsError) {
            console.error('Error fetching friend details:', friendsError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des détails des amis',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: friends.map((f: any) => ({
                id: f.id,
                pseudo: f.username,
                avatar_url: f.avatar_url,
            })),
        });
    } catch (error) {
        console.error('Unexpected error in get friends:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// DELETE /api/friends/:friend_id
// ============================================
router.delete('/:friend_id', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const validationResult = friendIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { friend_id } = validationResult.data;

        // Delete friendship (in either direction)
        const { error } = await db
            .from('friends')
            .delete()
            .or(`and(user_id.eq.${userId},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${userId})`);

        if (error) {
            console.error('Error deleting friendship:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la suppression de l\'ami',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Ami supprimé avec succès',
            },
        });
    } catch (error) {
        console.error('Unexpected error in delete friend:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

export default router;
