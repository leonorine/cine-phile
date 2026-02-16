import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { db, auth as supabaseAuth } from '../config/supabase';
import { authMiddleware } from '../middleware/auth';
import { User } from '../types';

const router = Router();

// ============================================
// Validation Schemas with Zod
// ============================================

const registerSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    pseudo: z.string().min(2, 'Le pseudo doit contenir au moins 2 caractères').max(50, 'Le pseudo ne peut pas dépasser 50 caractères'),
});

const loginSchema = z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
});

const resetPasswordSchema = z.object({
    email: z.string().email('Email invalide'),
});

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', async (req: Request, res: Response) => {
    try {
        // Validate input
        const validationResult = registerSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { email, password, pseudo } = validationResult.data;

        // Check if pseudo is already taken
        const { data: existingUser, error: checkError } = await db
            .from('users')
            .select('username')
            .eq('username', pseudo)
            .maybeSingle();

        if (checkError) {
            console.error('Error checking existing pseudo:', checkError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la vérification du pseudo',
                },
            });
        }

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Ce pseudo est déjà utilisé',
                },
            });
        }

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAuth.signUp({
            email,
            password,
        });

        if (authError) {
            console.error('Supabase Auth error:', authError);
            console.error('Error code:', (authError as any).code);
            console.error('Error status:', (authError as any).status);

            // Handle specific error cases
            if (authError.message.includes('already registered')) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Cet email est déjà utilisé',
                    },
                });
            }

            if (authError.message.includes('Password')) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Le mot de passe est trop faible',
                    },
                });
            }

            // Handle email validation errors
            if ((authError as any).code === 'email_address_invalid' || authError.message.includes('invalid')) {
                return res.status(400).json({
                    success: false,
                    error: {
                        message: 'Cette adresse email n\'est pas acceptée. Veuillez utiliser une adresse email valide.',
                    },
                });
            }

            // In development, show actual error
            const errorMessage = process.env.NODE_ENV === 'development'
                ? `Erreur Supabase: ${authError.message}`
                : 'Erreur lors de la création du compte';

            return res.status(500).json({
                success: false,
                error: {
                    message: errorMessage,
                },
            });
        }

        if (!authData.user) {
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la création du compte',
                },
            });
        }

        // Create user profile in users table
        const { error: dbError } = await db
            .from('users')
            .insert({
                id: authData.user.id,
                pseudo: pseudo,
                avatar_url: null,
                bio: null,
            });

        if (dbError) {
            console.error('Database error creating user profile:', dbError);

            // Rollback: delete auth user if profile creation fails
            await supabaseAuth.admin.deleteUser(authData.user.id);

            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la création du profil utilisateur',
                },
            });
        }

        // Return user data and token
        res.status(201).json({
            success: true,
            data: {
                user_id: authData.user.id,
                email: authData.user.email,
                pseudo,
                token: authData.session?.access_token || '',
            },
        });

    } catch (error) {
        console.error('Unexpected error in register:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req: Request, res: Response) => {
    try {
        // Validate input
        const validationResult = loginSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { email, password } = validationResult.data;

        // Authenticate with Supabase
        const { data: authData, error: authError } = await supabaseAuth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            console.error('Login error:', authError);
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Email ou mot de passe incorrect',
                },
            });
        }

        if (!authData.user || !authData.session) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Email ou mot de passe incorrect',
                },
            });
        }

        // Fetch user profile from database
        const { data: userProfile, error: profileError } = await db
            .from('users')
            .select('username')
            .eq('id', authData.user.id)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération du profil',
                },
            });
        }

        // Return user data and token
        res.status(200).json({
            success: true,
            data: {
                user_id: authData.user.id,
                email: authData.user.email,
                pseudo: userProfile.username,
                token: authData.session.access_token,
            },
        });

    } catch (error) {
        console.error('Unexpected error in login:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// GET /api/auth/user (Protected)
// ============================================
router.get('/user', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Fetch user profile from database
        const { data: userProfile, error: profileError } = await db
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching user profile:', profileError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la récupération du profil',
                },
            });
        }

        if (!userProfile) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'Utilisateur non trouvé',
                },
            });
        }

        // Return user data
        res.status(200).json({
            success: true,
            data: {
                id: userProfile.id,
                email: req.user!.email,
                username: userProfile.username,
                avatar_url: userProfile.avatar_url,
                bio: userProfile.bio,
                created_at: userProfile.created_at,
                updated_at: userProfile.updated_at,
            } as User,
        });

    } catch (error) {
        console.error('Unexpected error in get user:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/auth/logout
// ============================================
router.post('/logout', async (req: Request, res: Response) => {
    try {
        // Extract token from Authorization header (optional)
        const authHeader = req.headers.authorization;

        if (authHeader) {
            const parts = authHeader.split(' ');
            if (parts.length === 2 && parts[0] === 'Bearer') {
                const token = parts[1];

                // Sign out from Supabase (invalidates the session)
                const { error } = await supabaseAuth.signOut();

                if (error) {
                    console.error('Logout error:', error);
                    // Don't fail the request, just log the error
                }
            }
        }

        // Return success regardless (client should clear token)
        res.status(200).json({
            success: true,
            data: {
                message: 'Déconnexion réussie',
            },
        });

    } catch (error) {
        console.error('Unexpected error in logout:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/auth/reset-password
// ============================================
router.post('/reset-password', async (req: Request, res: Response) => {
    try {
        // Validate input
        const validationResult = resetPasswordSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { email } = validationResult.data;

        // Send password reset email
        const { error } = await supabaseAuth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password`,
        });

        if (error) {
            console.error('Password reset error:', error);
            // Don't reveal if email exists or not for security reasons
        }

        // Always return success to prevent email enumeration
        res.status(200).json({
            success: true,
            data: {
                message: 'Si cet email existe, un lien de réinitialisation a été envoyé',
            },
        });

    } catch (error) {
        console.error('Unexpected error in reset password:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// PUT /api/auth/profile
// ============================================
const updateProfileSchema = z.object({
    pseudo: z.string().min(2, 'Le pseudo doit contenir au moins 2 caractères').max(50).optional(),
    bio: z.string().max(500, 'La bio ne peut pas dépasser 500 caractères').optional().nullable(),
    avatar_url: z.string().url('URL avatar invalide').optional().nullable(),
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Validate input
        const validationResult = updateProfileSchema.safeParse(req.body);

        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    message: validationResult.error.issues[0].message,
                },
            });
        }

        const { pseudo, bio, avatar_url } = validationResult.data;

        // If updating pseudo, check if it's already taken
        if (pseudo) {
            const { data: existingUser, error: checkError } = await db
                .from('users')
                .select('id')
                .eq('username', pseudo)
                .neq('id', userId)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking pseudo:', checkError);
                return res.status(500).json({
                    success: false,
                    error: {
                        message: 'Erreur lors de la vérification du pseudo',
                    },
                });
            }

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: {
                        message: 'Ce pseudo est déjà utilisé',
                    },
                });
            }
        }

        // Build update object
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (pseudo !== undefined) updateData.username = pseudo;
        if (bio !== undefined) updateData.bio = bio;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        // Update user profile
        const { data: updatedUser, error: updateError } = await db
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select('id, username, avatar_url, bio, created_at, updated_at')
            .single();

        if (updateError) {
            console.error('Error updating profile:', updateError);
            return res.status(500).json({
                success: false,
                error: {
                    message: 'Erreur lors de la mise à jour du profil',
                },
            });
        }

        // Get email from auth
        const { data: authUser } = await supabaseAuth.admin.getUserById(userId);

        res.status(200).json({
            success: true,
            data: {
                id: updatedUser.id,
                email: authUser?.user?.email || '',
                username: updatedUser.username,
                avatar_url: updatedUser.avatar_url,
                bio: updatedUser.bio,
                created_at: updatedUser.created_at,
                updated_at: updatedUser.updated_at,
            },
        });

    } catch (error) {
        console.error('Unexpected error in update profile:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur inattendue',
            },
        });
    }
});

// ============================================
// POST /api/auth/upload-avatar
// ============================================
router.post('/upload-avatar', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;

        // Check if file data is provided (base64)
        if (!req.body.file || !req.body.fileName) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Fichier requis',
                },
            });
        }

        const { file } = req.body;

        // Validate that it's a base64 image
        if (!file.startsWith('data:image/')) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Format d\'image invalide',
                },
            });
        }

        // Store base64 directly in database (simpler than Supabase Storage)
        const avatarUrl = file;

        // Update user profile with new avatar URL
        const { error: updateError } = await db
            .from('users')
            .update({
                avatar_url: avatarUrl,
                updated_at: new Date().toISOString(),
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating user avatar:', updateError);
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
                avatar_url: avatarUrl,
            },
        });

    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Erreur serveur',
            },
        });
    }
});

// ============================================
// POST /api/auth/oauth/callback
// Exchange Supabase OAuth token for backend JWT
// ============================================
router.post('/oauth/callback', async (req: Request, res: Response) => {
    try {
        console.log('OAuth callback received:', { body: req.body });
        const { access_token, user } = req.body;

        if (!access_token || !user || !user.email) {
            console.error('Invalid OAuth data:', { access_token: !!access_token, user: !!user, email: user?.email });
            return res.status(400).json({
                success: false,
                error: { message: 'Données OAuth invalides' }
            });
        }

        console.log('Verifying Supabase token for user:', user.email);

        // Verify Supabase token
        const { data: { user: supabaseUser }, error: verifyError } = await supabaseAuth.getUser(access_token);

        if (verifyError || !supabaseUser) {
            console.error('Supabase token verification error:', verifyError);
            return res.status(401).json({
                success: false,
                error: { message: 'Token OAuth invalide' }
            });
        }

        console.log('Token verified, checking if user exists in Supabase Auth');

        // Check if user exists in our database by Supabase Auth ID
        const { data: existingUser, error: fetchError } = await db
            .from('users')
            .select('*')
            .eq('id', supabaseUser.id)
            .maybeSingle();

        let userId: string;
        let pseudo: string;
        let username: string;

        if (existingUser) {
            console.log('User exists:', existingUser.id);
            userId = existingUser.id;
            pseudo = existingUser.pseudo;
            username = existingUser.pseudo;
        } else {
            console.log('Creating new user from OAuth data');
            // Create new user from OAuth data
            const newPseudo = user.user_metadata?.full_name?.replace(/\s+/g, '') || user.email.split('@')[0];

            console.log('New pseudo:', newPseudo);

            const { data: newUser, error: createError } = await db
                .from('users')
                .insert({
                    id: supabaseUser.id, // Use Supabase Auth ID
                    pseudo: newPseudo,
                    avatar_url: null, // Don't import Google avatar
                    bio: null
                })
                .select()
                .single();

            if (createError || !newUser) {
                console.error('Error creating OAuth user:', createError);
                return res.status(500).json({
                    success: false,
                    error: { message: 'Erreur lors de la création du compte: ' + (createError?.message || 'Unknown error') }
                });
            }

            console.log('User created:', newUser.id);
            userId = newUser.id;
            pseudo = newUser.pseudo;
            username = newUser.pseudo;
        }

        // Generate backend JWT
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: userId, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Get full user profile
        const { data: userProfile, error: profileError } = await db
            .from('users')
            .select('id, pseudo, avatar_url, bio, created_at, updated_at, username')
            .eq('id', userId)
            .single();

        if (profileError || !userProfile) {
            console.error('Error fetching user profile:', profileError);
            return res.status(500).json({
                success: false,
                error: { message: 'Erreur lors de la récupération du profil' }
            });
        }

        console.log('OAuth callback successful for user:', userProfile.pseudo);

        res.status(200).json({
            success: true,
            data: {
                token: access_token,
                user: {
                    ...userProfile,
                    email: user.email // Add email from Supabase Auth
                }
            }
        });
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Erreur serveur' }
        });
    }
});

export default router;
