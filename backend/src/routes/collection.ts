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

const createCollectionItemSchema = z.object({
    media_id: z.string().min(1, 'media_id est requis'),
    media_type: z.enum(['film', 'serie']),
    title: z.string().min(1, 'Le titre est requis'),
    poster_url: z.string().url('URL du poster invalide').optional().nullable(),
    status: z.enum(['to_watch', 'watched']).default('to_watch'),
    rating: z.number().min(1, 'La note doit être entre 1 et 10').max(10, 'La note doit être entre 1 et 10').optional().nullable(),
});

const updateCollectionItemSchema = z.object({
    rating: z.number().min(1, 'La note doit être entre 1 et 10').max(10, 'La note doit être entre 1 et 10').optional().nullable(),
    status: z.enum(['to_watch', 'watched']).optional(),
});

const collectionQuerySchema = z.object({
    status: z.enum(['to_watch', 'watched']).optional(),
    media_type: z.enum(['film', 'serie']).optional(),
    sort_by: z.enum(['added_at', 'rating', 'title']).default('added_at'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const collectionIdSchema = z.object({
    id: z.string().uuid('ID invalide'),
});

// ============================================
// GET /api/collection
// ============================================
router.get('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate query parameters
        const validationResult = collectionQuerySchema.safeParse(req.query);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { status, media_type, sort_by, sort_order } = validationResult.data;

        // Build query
        let query = db
            .from('collection')
            .select('*')
            .eq('user_id', userId);

        // Apply filters
        if (status) {
            query = query.eq('status', status);
        }

        if (media_type) {
            query = query.eq('media_type', media_type);
        }

        // Apply sorting
        query = query.order(sort_by, { ascending: sort_order === 'asc' });

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching collection:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération de la collection',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: data || [],
        });
    } catch (error) {
        console.error('Unexpected error in get collection:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/collection
// ============================================
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate body
        const validationResult = createCollectionItemSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { media_id, media_type, title, poster_url, status, rating } = validationResult.data;

        // Check if item already exists in collection
        const { data: existingItem } = await db
            .from('collection')
            .select('id')
            .eq('user_id', userId)
            .eq('media_id', media_id)
            .maybeSingle();

        if (existingItem) {
            return res.status(409).json({
                success: false,
                error: {
                    message: 'Ce film/série est déjà dans votre collection',
                },
            });
        }

        // Create collection item
        const { data, error } = await db
            .from('collection')
            .insert({
                user_id: userId,
                media_id,
                media_type,
                title,
                poster_url: poster_url || null,
                status,
                rating: rating || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating collection item:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de l\'ajout à la collection',
                },
            });
        }

        res.status(201).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Unexpected error in create collection item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// PUT /api/collection/:id
// ============================================
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const paramsValidation = collectionIdSchema.safeParse(req.params);

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
        const bodyValidation = updateCollectionItemSchema.safeParse(req.body);

        if (!bodyValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: bodyValidation.error.issues[0].message,
                },
            });
        }

        // Check if item exists and belongs to user
        const { data: existingItem, error: fetchError } = await db
            .from('collection')
            .select('user_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching collection item:', fetchError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération de l\'élément',
                },
            });
        }

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Élément non trouvé',
                },
            });
        }

        // Check ownership
        if (existingItem.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Vous n\'avez pas la permission de modifier cet élément',
                },
            });
        }

        // Update item
        const updateData = bodyValidation.data;
        const { data, error } = await db
            .from('collection')
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating collection item:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la mise à jour',
                },
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        console.error('Unexpected error in update collection item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// DELETE /api/collection/:id
// ============================================
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate params
        const paramsValidation = collectionIdSchema.safeParse(req.params);

        if (!paramsValidation.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: paramsValidation.error.issues[0].message,
                },
            });
        }

        const { id } = paramsValidation.data;

        // Check if item exists and belongs to user
        const { data: existingItem, error: fetchError } = await db
            .from('collection')
            .select('user_id')
            .eq('id', id)
            .maybeSingle();

        if (fetchError) {
            console.error('Error fetching collection item:', fetchError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération de l\'élément',
                },
            });
        }

        if (!existingItem) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Élément non trouvé',
                },
            });
        }

        // Check ownership
        if (existingItem.user_id !== userId) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Vous n\'avez pas la permission de supprimer cet élément',
                },
            });
        }

        // Delete item
        const { error } = await db
            .from('collection')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting collection item:', error);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la suppression',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: {
                message: 'Élément supprimé avec succès',
            },
        });
    } catch (error) {
        console.error('Unexpected error in delete collection item:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

export default router;
