import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';
import { optionalAuthMiddleware } from '../middleware/auth';
import { createNotification } from '../utils/notifications';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const createCommentSchema = z.object({
    media_id: z.string().min(1, 'media_id est requis'),
    media_type: z.enum(['film', 'serie']),
    text: z.string().min(5, 'Le commentaire doit contenir au moins 5 caractères').max(1000, 'Le commentaire ne peut pas dépasser 1000 caractères'),
    image_urls: z.array(z.string().url('URL invalide')).optional().nullable(),
});

const updateCommentSchema = z.object({
    text: z.string().min(5, 'Le commentaire doit contenir au moins 5 caractères').max(1000, 'Le commentaire ne peut pas dépasser 1000 caractères').optional(),
    image_urls: z.array(z.string().url('URL invalide')).optional().nullable(),
});

const commentIdSchema = z.object({
    id: z.string().uuid('ID commentaire invalide'),
});

const mediaIdSchema = z.object({
    media_id: z.string().min(1, 'media_id est requis'),
});

// ============================================
// POST /api/comments
// ============================================
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate body
        const validationResult = createCommentSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { media_id, media_type, text, image_urls } = validationResult.data;

        // Create comment
        const { data: comment, error: commentError } = await db
            .from('comments')
            .insert({
                user_id: userId,
                media_id,
                media_type,
                text,
                image_urls: image_urls || [],
            })
            .select(`
        id,
        user_id,
        media_id,
        media_type,
        text,
        image_urls,
        created_at,
        updated_at,
        user:users!comments_user_id_fkey(id, username, avatar_url)
      `)
            .single();

        if (commentError) {
            console.error('Error creating comment:', commentError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la création du commentaire',
                },
            });
        }

        // Get friends who have also commented on this media
        const { data: friendsWhoCommented } = await db
            .from('comments')
            .select('user_id')
            .eq('media_id', media_id)
            .neq('user_id', userId);

        if (friendsWhoCommented && friendsWhoCommented.length > 0) {
            // Get user's friends
            const { data: friends } = await db
                .from('friends')
                .select('user_id, friend_id')
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
                .eq('status', 'accepted');

            if (friends && friends.length > 0) {
                // Extract friend IDs
                const friendIds = friends.map((f: any) =>
                    f.user_id === userId ? f.friend_id : f.user_id
                );

                // Find friends who have commented
                const friendsToNotify = friendsWhoCommented
                    .map((c: any) => c.user_id)
                    .filter((id: string) => friendIds.includes(id));

                // Create notifications for these friends
                for (const friendId of friendsToNotify) {
                    await createNotification(friendId, 'friend_comment', userId, media_id);
                }
            }
        }

        // Format response
        const user = comment.user as any;
        const formattedComment = {
            id: comment.id,
            user_id: comment.user_id,
            pseudo: user?.username || null,
            avatar_url: user?.avatar_url || null,
            media_id: comment.media_id,
            media_type: comment.media_type,
            text: comment.text,
            image_urls: comment.image_urls,
            likes_count: 0,
            created_at: comment.created_at,
            updated_at: comment.updated_at,
        };

        res.status(201).json({
            success: true,
            data: formattedComment,
        });
    } catch (error) {
        console.error('Unexpected error in create comment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/comments/:media_id
// ============================================
router.get('/:media_id', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        // Validate params
        const validationResult = mediaIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { media_id } = validationResult.data;

        // Fetch comments with user details
        const { data: comments, error: commentsError } = await db
            .from('comments')
            .select(`
        id,
        user_id,
        media_id,
        media_type,
        text,
        image_urls,
        created_at,
        updated_at,
        user:users!comments_user_id_fkey(id, username, avatar_url)
      `)
            .eq('media_id', media_id)
            .order('created_at', { ascending: false });

        if (commentsError) {
            console.error('Error fetching comments:', commentsError);
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
            user_id: c.user_id,
            pseudo: c.user?.username || null,
            avatar_url: c.user?.avatar_url || null,
            text: c.text,
            image_urls: c.image_urls,
            likes_count: likesCountMap[c.id] || 0,
            created_at: c.created_at,
            updated_at: c.updated_at,
        }));

        res.status(200).json({
            success: true,
            data: formattedComments,
        });
    } catch (error) {
        console.error('Unexpected error in get comments:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// PUT /api/comments/:id
// ============================================
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const paramsValidation = commentIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { id } = paramsValidation.data;

        // Validate body
        const bodyValidation = updateCommentSchema.safeParse(req.body);

        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: bodyValidation.error.issues[0].message,
                },
            });
        }

        // Check if comment exists and belongs to user
        const { data: existingComment, error: fetchError } = await db
            .from('comments')
            .select('user_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching comment:', fetchError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération du commentaire',
                },
            });
        }

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Commentaire non trouvé',
                },
            });
        }

        // Check ownership
        if (existingComment.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Vous n\'avez pas la permission de modifier ce commentaire',
                },
            });
        }

        // Update comment
        const updateData = bodyValidation.data;
        const { data: updatedComment, error: updateError } = await db
            .from('comments')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select(`
        id,
        user_id,
        media_id,
        media_type,
        text,
        image_urls,
        created_at,
        updated_at,
        user:users!comments_user_id_fkey(id, username, avatar_url)
      `)
            .single();

        if (updateError) {
            console.error('Error updating comment:', updateError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la mise à jour du commentaire',
                },
            });
        }

        // Get likes count
        const { data: likes } = await db
            .from('comment_likes')
            .select('id')
            .eq('comment_id', id);

        // Format response
        const user = updatedComment.user as any;
        const formattedComment = {
            id: updatedComment.id,
            user_id: updatedComment.user_id,
            pseudo: user?.username || null,
            avatar_url: user?.avatar_url || null,
            text: updatedComment.text,
            image_urls: updatedComment.image_urls,
            likes_count: likes?.length || 0,
            created_at: updatedComment.created_at,
            updated_at: updatedComment.updated_at,
        };

        res.status(200).json({
            success: true,
            data: formattedComment,
        });
    } catch (error) {
        console.error('Unexpected error in update comment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// DELETE /api/comments/:id
// ============================================
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const paramsValidation = commentIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { id } = paramsValidation.data;

        // Check if comment exists and belongs to user
        const { data: existingComment, error: fetchError } = await db
            .from('comments')
            .select('user_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching comment:', fetchError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération du commentaire',
                },
            });
        }

        if (!existingComment) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Commentaire non trouvé',
                },
            });
        }

        // Check ownership
        if (existingComment.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Vous n\'avez pas la permission de supprimer ce commentaire',
                },
            });
        }

        // Delete comment (likes will be deleted by CASCADE)
        const { error: deleteError } = await db
            .from('comments')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting comment:', deleteError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la suppression du commentaire',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Commentaire supprimé avec succès',
            },
        });
    } catch (error) {
        console.error('Unexpected error in delete comment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/comments/:id/like
// ============================================
router.post('/:id/like', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const paramsValidation = commentIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { id: commentId } = paramsValidation.data;

        // Check if comment exists
        const { data: comment, error: commentError } = await db
            .from('comments')
            .select('user_id, media_id')
            .eq('id', commentId)
            .maybeSingle();

        if (commentError) {
            console.error('Error fetching comment:', commentError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération du commentaire',
                },
            });
        }

        if (!comment) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Commentaire non trouvé',
                },
            });
        }

        // Check if already liked
        const { data: existingLike } = await db
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId)
            .eq('user_id', userId)
            .maybeSingle();

        if (existingLike) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Vous avez déjà aimé ce commentaire',
                },
            });
        }

        // Create like
        const { error: likeError } = await db
            .from('comment_likes')
            .insert({
                comment_id: commentId,
                user_id: userId,
            });

        if (likeError) {
            console.error('Error creating like:', likeError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de l\'ajout du like',
                },
            });
        }

        // Create notification for comment author (if not self)
        if (comment.user_id !== userId) {
            await createNotification(comment.user_id, 'comment_like', userId, comment.media_id);
        }

        // Get updated likes count
        const { data: likes } = await db
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId);

        res.status(201).json({
            success: true,
            data: {
                likes_count: likes?.length || 0,
            },
        });
    } catch (error) {
        console.error('Unexpected error in like comment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// DELETE /api/comments/:id/like
// ============================================
router.delete('/:id/like', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const paramsValidation = commentIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { id: commentId } = paramsValidation.data;

        // Delete like
        const { error: deleteError } = await db
            .from('comment_likes')
            .delete()
            .eq('comment_id', commentId)
            .eq('user_id', userId);

        if (deleteError) {
            console.error('Error deleting like:', deleteError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la suppression du like',
                },
            });
        }

        // Get updated likes count
        const { data: likes } = await db
            .from('comment_likes')
            .select('id')
            .eq('comment_id', commentId);

        res.status(200).json({
            success: true,
            data: {
                likes_count: likes?.length || 0,
            },
        });
    } catch (error) {
        console.error('Unexpected error in unlike comment:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/comments/user/me - Get current user's comments
// ============================================
router.get('/user/me', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;

        // Fetch user's comments with media info
        const { data: comments, error } = await db
            .from('comments')
            .select(`
                id,
                media_id,
                media_type,
                text,
                image_urls,
                likes_count,
                created_at,
                updated_at
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching user comments:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des commentaires',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: comments || [],
        });
    } catch (error: any) {
        console.error('Get user comments error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur',
            },
        });
    }
});

export default router;
