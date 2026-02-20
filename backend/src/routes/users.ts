import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const userIdSchema = z.object({
    user_id: z.string().uuid('ID utilisateur invalide'),
});

const updateProfileSchema = z.object({
    username: z.string()
        .min(3, 'Le pseudo doit contenir au moins 3 caractères')
        .max(20, 'Le pseudo ne peut pas dépasser 20 caractères')
        .regex(/^[a-zA-Z0-9_]+$/, 'Le pseudo ne peut contenir que des lettres, chiffres et underscores')
        .optional(),
    bio: z.string()
        .max(200, 'La bio ne peut pas dépasser 200 caractères')
        .optional()
        .nullable(),
    avatar_url: z.string()
        .url('URL avatar invalide')
        .optional()
        .nullable(),
});

const paginationSchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 20),
    offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
});

// ============================================
// GET /api/users/search?q=query
// ============================================
router.get('/search', authMiddleware, async (req: Request, res: Response) => {
    try {
        const query = req.query.q as string;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'La recherche doit contenir au moins 2 caractères',
                },
            });
        }

        const searchTerm = query.trim().toLowerCase();

        // Search users by username (case-insensitive)
        const { data: users, error: searchError } = await db
            .from('users')
            .select('id, username, avatar_url')
            .ilike('username', `%${searchTerm}%`)
            .limit(10);

        if (searchError) {
            console.error('Error searching users:', searchError);
            console.error('Search term was:', searchTerm);
            console.error('Full error details:', JSON.stringify(searchError, null, 2));
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la recherche',
                    details: searchError.message,
                },
            });
        }

        // Format response
        const formattedUsers = (users || []).map(user => ({
            id: user.id,
            pseudo: user.username,
            avatar_url: user.avatar_url,
        }));

        res.status(200).json({
            success: true,
            data: formattedUsers,
        });
    } catch (error) {
        console.error('Unexpected error in search users:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/users/:user_id
// ============================================
router.get('/:user_id', async (req: Request, res: Response) => {
    try {
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

        const { user_id } = validationResult.data;

        // Fetch user profile
        const { data: user, error: userError } = await db
            .from('users')
            .select('id, username, avatar_url, bio, created_at')
            .eq('id', user_id)
            .maybeSingle();

        if (userError) {
            console.error('Error fetching user:', userError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération du profil',
                },
            });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utilisateur non trouvé',
                },
            });
        }

        // Get collection count
        const { count: collectionCount } = await db
            .from('collection_items')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);

        // Get comment count
        const { count: commentCount } = await db
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);

        // Get friend count
        const { data: friendships } = await db
            .from('friends')
            .select('id')
            .or(`user_id.eq.${user_id},friend_id.eq.${user_id}`)
            .eq('status', 'accepted');

        res.status(200).json({
            success: true,
            data: {
                id: user.id,
                pseudo: user.username,
                avatar_url: user.avatar_url,
                bio: user.bio,
                collection_count: collectionCount || 0,
                comment_count: commentCount || 0,
                friend_count: friendships?.length || 0,
                created_at: user.created_at,
            },
        });
    } catch (error) {
        console.error('Unexpected error in get user profile:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/users/:id/collection
// ============================================
router.get('/:id/collection', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { id: user_id } = req.params;

        const { data: items, error } = await db
            .from('collection_items')
            .select('id, media_id, media_type, title, poster_url, rating, status')
            .eq('user_id', user_id)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Error fetching user collection:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Erreur lors de la récupération de la collection' },
            });
        }

        res.status(200).json({
            success: true,
            data: items || [],
        });
    } catch (error) {
        console.error('Unexpected error in get user collection:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Erreur serveur inattendue' },
        });
    }
});

// ============================================
// PUT /api/users/me
// ============================================
router.put('/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate body
        const validationResult = updateProfileSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const updateData = validationResult.data;

        // If username is being changed, check if it's already taken
        if (updateData.username) {
            const { data: existingUser } = await db
                .from('users')
                .select('id')
                .eq('username', updateData.username)
                .neq('id', userId)
                .maybeSingle();

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        message: 'Ce pseudo est déjà utilisé',
                    },
                });
            }
        }

        // Update user profile
        const { data: updatedUser, error: updateError } = await db
            .from('users')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId)
            .select('id, username, avatar_url, bio, created_at, updated_at')
            .single();

        if (updateError) {
            console.error('Error updating user profile:', updateError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la mise à jour du profil',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: updatedUser.id,
                pseudo: updatedUser.username,
                avatar_url: updatedUser.avatar_url,
                bio: updatedUser.bio,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at,
            },
        });
    } catch (error) {
        console.error('Unexpected error in update user profile:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/users/:user_id/collection
// ============================================
router.get('/:user_id/collection', async (req: Request, res: Response) => {
    try {
        // Validate params
        const paramsValidation = userIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { user_id } = paramsValidation.data;

        // Validate query params
        const queryValidation = paginationSchema.safeParse(req.query);

        if (!queryValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: queryValidation.error.issues[0].message,
                },
            });
        }

        const { limit, offset } = queryValidation.data;

        // Check if user exists
        const { data: user } = await db
            .from('users')
            .select('id')
            .eq('id', user_id)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utilisateur non trouvé',
                },
            });
        }

        // Fetch user's collection
        const { data: collection, error: collectionError } = await db
            .from('collection_items')
            .select('media_id, media_type, title, poster_url, rating, status')
            .eq('user_id', user_id)
            .order('added_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (collectionError) {
            console.error('Error fetching user collection:', collectionError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération de la collection',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: collection || [],
            meta: {
                limit,
                offset,
            },
        });
    } catch (error) {
        console.error('Unexpected error in get user collection:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/users/:user_id/comments
// ============================================
router.get('/:user_id/comments', async (req: Request, res: Response) => {
    try {
        // Validate params
        const paramsValidation = userIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { user_id } = paramsValidation.data;

        // Validate query params
        const queryValidation = paginationSchema.safeParse(req.query);

        if (!queryValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: queryValidation.error.issues[0].message,
                },
            });
        }

        const { limit, offset } = queryValidation.data;

        // Check if user exists
        const { data: user } = await db
            .from('users')
            .select('id')
            .eq('id', user_id)
            .maybeSingle();

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utilisateur non trouvé',
                },
            });
        }

        // Fetch user's comments
        const { data: comments, error: commentsError } = await db
            .from('comments')
            .select('id, media_id, media_type, text, image_urls, created_at')
            .eq('user_id', user_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (commentsError) {
            console.error('Error fetching user comments:', commentsError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des commentaires',
                },
            });
        }

        // Get likes count for each comment
        const commentIds = comments.map((c: any) => c.id);

        let likesCountMap: Record<string, number> = {};
        if (commentIds.length > 0) {
            const { data: likes } = await db
                .from('comment_likes')
                .select('comment_id')
                .in('comment_id', commentIds);

            if (likes) {
                likesCountMap = likes.reduce((acc: Record<string, number>, like: any) => {
                    acc[like.comment_id] = (acc[like.comment_id] || 0) + 1;
                    return acc;
                }, {});
            }
        }

        // Format response
        const formattedComments = comments.map((c: any) => ({
            id: c.id,
            media_id: c.media_id,
            media_type: c.media_type,
            text: c.text,
            image_urls: c.image_urls,
            likes_count: likesCountMap[c.id] || 0,
            created_at: c.created_at,
        }));

        res.status(200).json({
            success: true,
            data: formattedComments,
            meta: {
                limit,
                offset,
            },
        });
    } catch (error) {
        console.error('Unexpected error in get user comments:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

export default router;
