// Mock data for the prototype — adapted from the repo's seed data.

window.MOVIES = [
  {
    id: 'mv-1',
    title: 'Quantum Drift',
    genres: ['Sci-Fi', 'Action'],
    durationMin: 142,
    rating: 8.4,
    year: 2025,
    cert: 'UA',
    languages: ['English', 'Hindi'],
    formats: ['IMAX', '4DX', '2D'],
    director: 'Mira Okafor',
    cast: ['Kira Vance', 'Idris Han', 'Lou Bertillon', 'Sam Reyes'],
    synopsis: 'When a deep-space navigator discovers a tear in the fabric of time, she must race across colliding timelines to save her crew — and herself.',
    tagline: 'Time has a weight. She can feel it.',
    accent: 'oklch(0.78 0.14 75)',
    poster: 'quantum',
  },
  {
    id: 'mv-2',
    title: 'The Last Harbor',
    genres: ['Drama', 'Thriller'],
    durationMin: 118,
    rating: 7.9,
    year: 2025,
    cert: 'A',
    languages: ['English'],
    formats: ['Dolby', '2D'],
    director: 'Asha Pillai',
    cast: ['Reuben Cole', 'Marta Vega', 'Chiwe Adebayo'],
    synopsis: 'A retired sailor returns to a coastal town where every face hides a secret darker than the sea.',
    tagline: 'The tide always comes back.',
    accent: 'oklch(0.78 0.13 230)',
    poster: 'harbor',
  },
  {
    id: 'mv-3',
    title: 'Echoes of Tomorrow',
    genres: ['Sci-Fi', 'Mystery'],
    durationMin: 135,
    rating: 8.1,
    year: 2025,
    cert: 'UA',
    languages: ['English', 'Hindi', 'Tamil'],
    formats: ['IMAX', '2D'],
    director: 'Tomás Aldana',
    cast: ['Eun-ji Park', 'Nikolai Brandt'],
    synopsis: 'A physicist receives messages from her future self — but each one rewrites the past.',
    tagline: 'She wrote the warnings. She forgot how to read them.',
    accent: 'oklch(0.78 0.14 320)',
    poster: 'echoes',
  },
  {
    id: 'mv-4',
    title: 'Midnight Paris',
    genres: ['Romance', 'Comedy'],
    durationMin: 108,
    rating: 7.2,
    year: 2025,
    cert: 'U',
    languages: ['English', 'French'],
    formats: ['2D'],
    director: 'Camille Roux',
    cast: ['Théo Marchand', 'Aanya Sinha'],
    synopsis: 'Two strangers meet at the last open café in the city and discover the night has other plans.',
    tagline: 'Some cities only fall in love after midnight.',
    accent: 'oklch(0.78 0.14 25)',
    poster: 'paris',
  },
  {
    id: 'mv-5',
    title: 'Iron Verdict',
    genres: ['Action', 'Crime'],
    durationMin: 126,
    rating: 7.6,
    year: 2025,
    cert: 'A',
    languages: ['English', 'Hindi'],
    formats: ['Dolby', '2D'],
    director: 'Vikram Joshi',
    cast: ['Rhea Kapur', 'Marcus Vale'],
    synopsis: 'A federal prosecutor must outwit a syndicate that owns half of City Hall — including her own boss.',
    tagline: 'Justice needs a witness. She brought a hammer.',
    accent: 'oklch(0.78 0.14 45)',
    poster: 'verdict',
  },
  {
    id: 'mv-6',
    title: 'Nebula Run',
    genres: ['Animation', 'Family'],
    durationMin: 95,
    rating: 8.0,
    year: 2025,
    cert: 'U',
    languages: ['English', 'Hindi'],
    formats: ['2D', '3D'],
    director: 'Lin Wei',
    cast: ['voice cast'],
    synopsis: 'A reckless teenage pilot enters the most dangerous race in the galaxy to save her home moon.',
    tagline: 'First moon to lose. Last pilot standing.',
    accent: 'oklch(0.78 0.14 180)',
    poster: 'nebula',
  },
  {
    id: 'mv-7',
    title: 'Silent Protocol',
    genres: ['Thriller', 'Spy'],
    durationMin: 132,
    rating: 7.8,
    year: 2025,
    cert: 'UA',
    languages: ['English'],
    formats: ['IMAX', 'Dolby'],
    director: 'Hadi Mansour',
    cast: ['Naomi Sterling', 'Jasper Kell'],
    synopsis: 'When an intelligence operative goes dark, the only person who can find her is the analyst who loved her.',
    tagline: 'No one is missing. They\u2019re hiding.',
    accent: 'oklch(0.78 0.14 145)',
    poster: 'protocol',
  },
  {
    id: 'mv-8',
    title: 'Golden Hour',
    genres: ['Drama'],
    durationMin: 112,
    rating: 7.4,
    year: 2025,
    cert: 'U',
    languages: ['English', 'Hindi'],
    formats: ['2D'],
    director: 'Sneha Iyer',
    cast: ['Maya Bhatt', 'Roshan Pillai'],
    synopsis: 'A celebrated chef returns to her childhood village to face the recipe — and family — she abandoned.',
    tagline: 'Every meal is a memory.',
    accent: 'oklch(0.78 0.14 80)',
    poster: 'golden',
  },
];

window.GENRES = ['All', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Romance', 'Comedy', 'Animation'];
window.LANGUAGES = ['All', 'English', 'Hindi', 'Tamil', 'French'];

window.THEATERS = [
  { id: 'th-1', name: 'Grand Central IMAX',    city: 'Mumbai',    locality: 'Bandra West',     screens: 8, amenities: ['IMAX', 'Dolby', 'Recliner'], distanceKm: 2.4 },
  { id: 'th-2', name: 'Skyline Multiplex',     city: 'Mumbai',    locality: 'Lower Parel',     screens: 6, amenities: ['4DX', 'Recliner', 'Caf\u00e9'], distanceKm: 4.1 },
  { id: 'th-3', name: 'Riverbend Cinemas',     city: 'Mumbai',    locality: 'Powai',           screens: 5, amenities: ['Dolby', 'Lounge'], distanceKm: 7.8 },
  { id: 'th-4', name: 'Heritage Picture Hall', city: 'Mumbai',    locality: 'Colaba',          screens: 3, amenities: ['Heritage', 'Caf\u00e9'], distanceKm: 9.2 },
];

// Showtimes are deterministic per movie+theater for the prototype
window.makeShowtimes = (movieId) => {
  const times = ['10:30', '13:15', '16:00', '18:45', '21:30'];
  const formats = ['2D', 'IMAX', 'Dolby', '4DX'];
  const out = [];
  window.THEATERS.forEach((t, ti) => {
    times.forEach((time, i) => {
      // skip some to feel realistic
      if ((ti + i) % 3 === 0 && i !== 0) return;
      const fmt = formats[(ti + i) % formats.length];
      const basePrice = fmt === 'IMAX' ? 480 : fmt === '4DX' ? 550 : fmt === 'Dolby' ? 380 : 280;
      const remaining = ((ti * 7 + i * 11 + movieId.length * 3) % 60) + 8;
      out.push({
        id: `${movieId}-${t.id}-${i}`,
        theaterId: t.id,
        time,
        format: fmt,
        language: i % 2 === 0 ? 'English' : 'Hindi',
        basePrice,
        remaining,
        lowAvailability: remaining < 20,
      });
    });
  });
  return out;
};

// Seat layout — 10 rows × 14 cols with aisle, premium back rows, gold rear-most.
window.makeSeatMap = () => {
  const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
  const layout = [];
  ROWS.forEach((row, idx) => {
    const tier = idx <= 1 ? 'Standard' : idx <= 6 ? 'Prime' : idx <= 8 ? 'Premium' : 'Recliner';
    const price = tier === 'Standard' ? 280 : tier === 'Prime' ? 380 : tier === 'Premium' ? 480 : 650;
    const seats = [];
    const cols = 14;
    for (let c = 1; c <= cols; c++) {
      seats.push({ id: `${row}${c}`, row, col: c, tier, price });
    }
    layout.push({ row, tier, price, seats });
  });
  return layout;
};

// Pre-set "sold" and "locked" seats so the map looks lived-in.
window.makeOccupied = (seedStr) => {
  const sold = new Set();
  const locked = new Set();
  const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'];
  // deterministic pseudo-random based on seed
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  const rnd = () => {
    h = (h * 1664525 + 1013904223) >>> 0;
    return h / 0xffffffff;
  };
  ROWS.forEach((row) => {
    for (let c = 1; c <= 14; c++) {
      const r = rnd();
      if (r < 0.22) sold.add(`${row}${c}`);
      else if (r < 0.27) locked.add(`${row}${c}`);
    }
  });
  return { sold: [...sold], locked: [...locked] };
};
