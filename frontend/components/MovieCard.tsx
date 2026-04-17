import Link from 'next/link';

export interface MovieCardProps {
  id: string;
  title: string;
  genres: string[];
  rating?: number;
  durationMin?: number;
  posterUrl?: string;
}

export default function MovieCard({
  id,
  title,
  genres,
  rating,
  durationMin,
  posterUrl,
}: MovieCardProps) {
  return (
    <Link
      href={`/movies/${id}`}
      className="shiny-border group relative block overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-b from-slate-900/80 to-slate-900/40 shadow-lg shadow-black/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/20"
    >
      {/* ---------- Poster ---------- */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-800">
        {posterUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={posterUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 via-slate-900 to-black">
            <span className="text-6xl opacity-50">🎞️</span>
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-70 transition group-hover:opacity-95" />

        {/* Rating badge */}
        {typeof rating === 'number' && rating > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md ring-1 ring-amber-400/30">
            <span>★</span>
            <span>{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Duration pill */}
        {durationMin && (
          <div className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-md ring-1 ring-white/10">
            {Math.floor(durationMin / 60)}h {durationMin % 60}m
          </div>
        )}

        {/* Hover "Book Now" pill */}
        <div className="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/50">
            Book Now →
          </div>
        </div>
      </div>

      {/* ---------- Info ---------- */}
      <div className="relative space-y-1.5 p-4">
        <h3 className="truncate font-display text-base font-semibold text-white group-hover:text-brand-200">
          {title}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {(genres ?? []).slice(0, 2).map((g) => (
            <span
              key={g}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
