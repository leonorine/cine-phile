import type { Movie, User, Comment, Notification } from '@/types'

// Mock Users
export const mockUsers: User[] = [
    {
        id: 'user-1',
        pseudo: 'CinéphilePassionné',
        email: 'cinephile@example.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        bio: 'Amoureux du 7ème art depuis toujours. Fan de cinéma français et de films noirs.',
        memberSince: '2023-01-15',
        stats: {
            totalMovies: 42,
            totalComments: 18,
            totalFriends: 7,
        },
    },
    {
        id: 'user-2',
        pseudo: 'FilmLover89',
        email: 'filmlover@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        bio: 'Passionné de science-fiction et de thrillers',
        memberSince: '2023-03-20',
        stats: {
            totalMovies: 28,
            totalComments: 12,
            totalFriends: 5,
        },
    },
    {
        id: 'user-3',
        pseudo: 'MovieBuff',
        email: 'moviebuff@example.com',
        avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400',
        bio: "Collectionneur de classiques et de films d'auteur",
        memberSince: '2022-11-10',
        stats: {
            totalMovies: 156,
            totalComments: 45,
            totalFriends: 12,
        },
    },
]

// Mock Movies
export const mockMovies: Movie[] = [
    {
        id: 'movie-1',
        title: 'Inception',
        year: 2010,
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&h=600&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1642287040066-2bd340523289?w=1200',
        genre: ['Science-Fiction', 'Action', 'Thriller'],
        director: 'Christopher Nolan',
        actors: ['Leonardo DiCaprio', 'Marion Cotillard', 'Tom Hardy', 'Ellen Page', 'Joseph Gordon-Levitt'],
        duration: 148,
        synopsis: "Dom Cobb est un voleur expérimenté dans l'art dangereux de l'extraction : sa spécialité consiste à s'approprier les secrets les plus précieux d'un individu, enfouis au plus profond de son subconscient.",
        rating: 8.8,
        releaseDate: '2010-07-16',
        budget: 160000000,
        revenue: 836800000,
        streamingPlatforms: ['Netflix', 'Amazon Prime'],
    },
    {
        id: 'movie-2',
        title: "Le Fabuleux Destin d'Amélie Poulain",
        year: 2001,
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&h=600&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
        genre: ['Romance', 'Comédie', 'Drame'],
        director: 'Jean-Pierre Jeunet',
        actors: ['Audrey Tautou', 'Mathieu Kassovitz', 'Rufus', 'Yolande Moreau'],
        duration: 122,
        synopsis: "Amélie, une jeune serveuse dans un bar de Montmartre, passe son temps à observer les gens et à laisser son imagination divaguer. Elle s'est fixé un but : faire le bien de ceux qui l'entourent.",
        rating: 8.3,
        releaseDate: '2001-04-25',
        streamingPlatforms: ['Canal+'],
    },
    {
        id: 'movie-3',
        title: 'Interstellar',
        year: 2014,
        posterUrl: 'https://images.unsplash.com/photo-1656489042181-7fcbafcc3c86?w=400&h=600&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1200',
        genre: ['Science-Fiction', 'Drame', 'Aventure'],
        director: 'Christopher Nolan',
        actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
        duration: 169,
        synopsis: "Dans un futur proche, la Terre est devenue hostile. Un groupe d'explorateurs utilise un vaisseau interstellaire pour parcourir un trou de ver récemment découvert, dans l'espoir de trouver une nouvelle planète habitable.",
        rating: 8.6,
        releaseDate: '2014-11-05',
        budget: 165000000,
        revenue: 677000000,
        streamingPlatforms: ['Amazon Prime', 'Apple TV'],
    },
    {
        id: 'movie-4',
        title: 'Parasite',
        year: 2019,
        posterUrl: 'https://images.unsplash.com/photo-1574267432644-f304a85c0994?w=400&h=600&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
        genre: ['Thriller', 'Drame', 'Comédie'],
        director: 'Bong Joon-ho',
        actors: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong', 'Choi Woo-shik'],
        duration: 132,
        synopsis: "Toute la famille de Ki-taek est au chômage. Un jour, leur fils réussit à se faire recommander pour donner des cours particuliers d'anglais dans la famille Park, très riche.",
        rating: 8.5,
        releaseDate: '2019-05-30',
        streamingPlatforms: ['Netflix'],
    },
    {
        id: 'movie-5',
        title: 'The Dark Knight',
        year: 2008,
        posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=400&h=600&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?w=1200',
        genre: ['Action', 'Crime', 'Drame'],
        director: 'Christopher Nolan',
        actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart', 'Michael Caine'],
        duration: 152,
        synopsis: "Batman aborde une phase décisive de sa guerre contre le crime à Gotham City. Avec l'aide du lieutenant de police Jim Gordon et du nouveau procureur Harvey Dent, il s'attaque au crime organisé.",
        rating: 9.0,
        releaseDate: '2008-07-18',
        budget: 185000000,
        revenue: 1004000000,
        streamingPlatforms: ['HBO Max', 'Amazon Prime'],
    },
    {
        id: 'movie-6',
        title: 'La La Land',
        year: 2016,
        posterUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200',
        genre: ['Romance', 'Comédie musicale', 'Drame'],
        director: 'Damien Chazelle',
        actors: ['Ryan Gosling', 'Emma Stone', 'John Legend', 'Rosemarie DeWitt'],
        duration: 128,
        synopsis: 'Mia, une actrice en devenir, sert des cafés entre deux auditions. Sebastian, passionné de jazz, joue du piano dans des clubs miteux. Le destin va réunir ces deux cœurs.',
        rating: 8.0,
        releaseDate: '2016-12-09',
        streamingPlatforms: ['Netflix', 'Canal+'],
    },
]

// Mock Comments
export const mockComments: Comment[] = [
    {
        id: 'comment-1',
        userId: 'user-2',
        movieId: 'movie-1',
        text: "Chef-d'œuvre absolu ! Nolan a réussi à créer un film qui défie notre perception de la réalité. Les effets spéciaux sont époustouflants et la bande originale de Hans Zimmer est mémorable.",
        createdAt: '2024-01-15T10:30:00Z',
        likes: 12,
        likedBy: ['user-1', 'user-3'],
    },
    {
        id: 'comment-2',
        userId: 'user-3',
        movieId: 'movie-2',
        text: "Un film qui fait du bien au cœur. L'univers visuel de Jean-Pierre Jeunet est unique et Audrey Tautou est parfaite dans son rôle. Une véritable pépite du cinéma français.",
        createdAt: '2024-01-14T15:20:00Z',
        likes: 8,
        likedBy: ['user-1'],
    },
    {
        id: 'comment-3',
        userId: 'user-1',
        movieId: 'movie-4',
        text: "Quelle claque ! Bong Joon-ho nous livre un thriller social brillant. La tension monte progressivement jusqu'à une fin explosive. Un film qui fait réfléchir sur les inégalités.",
        createdAt: '2024-01-13T20:15:00Z',
        likes: 15,
        likedBy: ['user-2', 'user-3'],
    },
]

// Mock Notifications
export const mockNotifications: Notification[] = [
    {
        id: 'notif-1',
        type: 'like',
        message: 'FilmLover89 a aimé votre commentaire sur Inception',
        timestamp: '2024-01-20T14:30:00Z',
        read: false,
        fromUserId: 'user-2',
        relatedMovieId: 'movie-1',
    },
    {
        id: 'notif-2',
        type: 'friend',
        message: "MovieBuff a accepté votre demande d'ami",
        timestamp: '2024-01-19T10:15:00Z',
        read: false,
        fromUserId: 'user-3',
    },
    {
        id: 'notif-3',
        type: 'comment',
        message: 'FilmLover89 a commenté un film que vous avez aimé',
        timestamp: '2024-01-18T16:45:00Z',
        read: true,
        fromUserId: 'user-2',
        relatedMovieId: 'movie-3',
    },
]

// Helper function to get movie by ID
export const getMovieById = (id: string): Movie | undefined => {
    return mockMovies.find(movie => movie.id === id)
}

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
    return mockUsers.find(user => user.id === id)
}

// Helper function to get comments for a movie
export const getCommentsByMovie = (movieId: string): Comment[] => {
    return mockComments.filter(comment => comment.movieId === movieId)
}
