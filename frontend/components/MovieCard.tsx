import Link from 'next/link';
import { Mono, Poster } from './ui';

export interface MovieCardProps {
  id: string;
  title: string;
  genres: string[];
  rating?: number;
  durationMin?: number;
  posterUrl?: string;
  cert?: string;
  year?: number;
}

/**
 * Editorial-cinema poster card — horizontal layout with metadata on the right.
 */
export default function MovieCard({
  id,
  title,
  genres,
  rating,
  durationMin,
  posterUrl,
  cert,
  year,
}: MovieCardProps) {
  return (
    <Link
      href={`/movies/${id}`}
      className="flex gap-4 rounded-sharp border p-3.5 transition-colors"
      style={{
        borderColor: 'var(--line)',
        background: 'var(--card)',
      }}
    >
      <div
        className="shrink-0 overflow-hidden rounded-sharp"
        style={{ width: 88, aspectRatio: '2/3' }}
      >
        <Poster
          movie={{ id, title, genres, posterUrl, cert, year }}
          className="h-full w-full"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div
            className="truncate font-display italic font-semibold leading-tight"
            style={{ fontSize: 18, color: 'var(--fg)' }}
          >
            {title}
          </div>
          <Mono
            className="mt-1 block text-[10px] uppercase tracking-[0.15em]"
            style={{ color: 'var(--fg-faint)' }}
          >
            {(genres ?? []).slice(0, 2).join(' · ') || 'Feature'}
          </Mono>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Mono className="text-xs" style={{ color: 'var(--fg-soft)' }}>
            {durationMin
              ? `${Math.floor(durationMin / 60)}h${durationMin % 60}m`
              : ''}
            {cert ? ` · ${cert}` : ''}
          </Mono>
          {typeof rating === 'number' && rating > 0 && (
            <Mono className="text-xs" style={{ color: 'var(--accent)' }}>
              ★ {rating.toFixed(1)}
            </Mono>
          )}
        </div>
      </div>
    </Link>
  );
}
