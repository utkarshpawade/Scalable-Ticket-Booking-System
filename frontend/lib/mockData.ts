import type { Movie } from './api';

export const MOCK_MOVIES: Movie[] = [
  { _id: 'mock-1',  title: 'Quantum Drift',     genres: ['Sci-Fi', 'Action'],   durationMin: 142, rating: 8.4, posterUrl: 'https://picsum.photos/seed/quantum/400/600',     description: 'When a deep-space navigator discovers a tear in the fabric of time, she must race across colliding timelines to save her crew — and herself.' },
  { _id: 'mock-2',  title: 'The Last Harbor',   genres: ['Drama', 'Thriller'],  durationMin: 118, rating: 7.9, posterUrl: 'https://picsum.photos/seed/harbor/400/600',      description: 'A retired sailor returns to a coastal town where every face hides a secret darker than the sea.' },
  { _id: 'mock-3',  title: 'Echoes of Tomorrow',genres: ['Sci-Fi', 'Mystery'],  durationMin: 135, rating: 8.1, posterUrl: 'https://picsum.photos/seed/echoes/400/600',      description: 'A physicist receives messages from her future self — but each one rewrites the past.' },
  { _id: 'mock-4',  title: 'Midnight Paris',    genres: ['Romance', 'Comedy'],  durationMin: 108, rating: 7.2, posterUrl: 'https://picsum.photos/seed/paris/400/600',       description: 'Two strangers meet at the last open café in the city and discover the night has other plans.' },
  { _id: 'mock-5',  title: 'Iron Verdict',      genres: ['Action', 'Crime'],    durationMin: 126, rating: 7.6, posterUrl: 'https://picsum.photos/seed/verdict/400/600',     description: 'A federal prosecutor must outwit a syndicate that owns half of City Hall — including her own boss.' },
  { _id: 'mock-6',  title: 'Nebula Run',        genres: ['Animation','Family'], durationMin:  95, rating: 8.0, posterUrl: 'https://picsum.photos/seed/nebula/400/600',      description: 'A reckless teenage pilot enters the most dangerous race in the galaxy to save her home moon.' },
  { _id: 'mock-7',  title: 'Silent Protocol',   genres: ['Thriller', 'Spy'],    durationMin: 132, rating: 7.8, posterUrl: 'https://picsum.photos/seed/protocol/400/600',    description: 'When an intelligence operative goes dark, the only person who can find her is the analyst who loved her.' },
  { _id: 'mock-8',  title: 'Golden Hour',       genres: ['Drama'],              durationMin: 112, rating: 7.4, posterUrl: 'https://picsum.photos/seed/golden/400/600',      description: 'A celebrated chef returns to her childhood village to face the recipe — and family — she abandoned.' },
  { _id: 'mock-9',  title: 'Velvet Skies',      genres: ['Romance','Drama'],    durationMin: 121, rating: 7.5, posterUrl: 'https://picsum.photos/seed/velvet/400/600',      description: 'A jazz singer and a war photographer meet in 1947 Lisbon and fall in love between deadlines.' },
  { _id: 'mock-10', title: 'Chrome Dynasty',    genres: ['Action','Sci-Fi'],    durationMin: 148, rating: 8.2, posterUrl: 'https://picsum.photos/seed/chrome/400/600',      description: 'In a city ruled by AI corporations, a hacker uncovers a conspiracy that could end human autonomy.' },
  { _id: 'mock-11', title: 'Hollow Stars',      genres: ['Horror','Thriller'],  durationMin: 101, rating: 7.0, posterUrl: 'https://picsum.photos/seed/hollow/400/600',      description: 'Six astronauts wake from cryosleep on a ship that should have arrived years ago.' },
  { _id: 'mock-12', title: 'The Lighthouse',    genres: ['Mystery','Drama'],    durationMin: 129, rating: 8.3, posterUrl: 'https://picsum.photos/seed/lighthouse/400/600',  description: 'Two keepers on a remote island begin to lose track of which storms are real and which are warnings.' },
];

export const GENRES = ['All', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Romance', 'Comedy', 'Horror', 'Animation'];

export interface Theater {
  id: string;
  name: string;
  city: string;
  address: string;
  screens: number;
  amenities: string[];
  imageUrl: string;
}

export const MOCK_THEATERS: Theater[] = [
  { id: 'th-1', name: 'Grand Central IMAX',   city: 'Mumbai',    address: 'Hill Road, Bandra West',         screens: 8,  amenities: ['IMAX', 'Dolby Atmos', 'Recliner', 'Parking'], imageUrl: 'https://picsum.photos/seed/grand-central/800/500' },
  { id: 'th-2', name: 'Skyline Multiplex',    city: 'Delhi',     address: 'Connaught Place, Block G',       screens: 6,  amenities: ['4DX', 'Recliner', 'Cafe'],                    imageUrl: 'https://picsum.photos/seed/skyline/800/500' },
  { id: 'th-3', name: 'Riverbend Cinemas',    city: 'Bengaluru', address: 'MG Road, near Trinity Circle',   screens: 5,  amenities: ['Dolby Atmos', 'Lounge'],                       imageUrl: 'https://picsum.photos/seed/riverbend/800/500' },
  { id: 'th-4', name: 'Heritage Picture Hall',city: 'Kolkata',   address: 'Park Street, Ground Floor',      screens: 3,  amenities: ['Heritage', 'Cafe'],                            imageUrl: 'https://picsum.photos/seed/heritage/800/500' },
  { id: 'th-5', name: 'Metro IMAX & 4DX',     city: 'Chennai',   address: 'Anna Salai, opposite Spencer',   screens: 7,  amenities: ['IMAX', '4DX', 'Recliner'],                     imageUrl: 'https://picsum.photos/seed/metro/800/500' },
  { id: 'th-6', name: 'Lakeside Boulevard',   city: 'Hyderabad', address: 'Banjara Hills, Road 12',         screens: 6,  amenities: ['Dolby Atmos', 'Lounge', 'Parking'],            imageUrl: 'https://picsum.photos/seed/lakeside/800/500' },
];

export function findMockMovie(id: string): Movie | undefined {
  return MOCK_MOVIES.find((m) => m._id === id);
}
