'use client';

import { useEffect, useState } from 'react';
import { Marquee } from './ui';

function fmtNow() {
  const d = new Date();
  return `MUMBAI · ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')} IST`;
}

export default function TopMarquee() {
  const [now, setNow] = useState(fmtNow());

  useEffect(() => {
    const i = setInterval(() => setNow(fmtNow()), 30_000);
    return () => clearInterval(i);
  }, []);

  return <Marquee now={now} />;
}
