import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authMiddleware);

// ============================================
// Validation Schemas
// ============================================

const notificationIdSchema = z.object({
    id: z.string().uuid('ID notification invalide'),
});

// ============================================
// GET /api/notifications
// ============================================
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Fetch notifications with actor details
        const { data: notifications, error } = await db
            .from('notifications')
            .select(`
        id,
        type,
        actor_id,
        media_id,
        read,
        created_at,
        actor:users!notifications_actor_id_fkey(id, username, avatar_url)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération des notifications',
                },
            });
        }

        // Format response
        const formattedNotifications = notifications.map((n: any) => ({
            id: n.id,
            type: n.type,
            actor_id: n.actor_id,
            actor_pseudo: n.actor?.username || null,
            actor_avatar: n.actor?.avatar_url || null,
            media_id: n.media_id,
            read: n.read,
            created_at: n.created_at,
        }));

        res.status(200).json({
            success: true,
            data: formattedNotifications,
        });
    } catch (error) {
        console.error('Unexpected error in get notifications:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/notifications/:id/read
// ============================================
router.post('/:id/read', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const validationResult = notificationIdSchema.safeParse(req.params);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { id } = validationResult.data;

        // Check if notification exists and belongs to user
        const { data: notification, error: fetchError } = await db
            .from('notifications')
            .select('user_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching notification:', fetchError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération de la notification',
                },
            });
        }

        if (!notification) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Notification non trouvée',
                },
            });
        }

        // Check ownership
        if (notification.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Vous n\'avez pas la permission de modifier cette notification',
                },
            });
        }

        // Mark as read
        const { error: updateError } = await db
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (updateError) {
            console.error('Error marking notification as read:', updateError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la mise à jour de la notification',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Notification marquée comme lue',
            },
        });
    } catch (error) {
        console.error('Unexpected error in mark notification as read:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/notifications/read-all
// ============================================
router.post('/read-all', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Mark all notifications as read for this user
        const { error } = await db
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la mise à jour des notifications',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Toutes les notifications ont été marquées comme lues',
            },
        });
    } catch (error) {
        console.error('Unexpected error in mark all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

export default router;
