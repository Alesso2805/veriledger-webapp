import { useEffect, useState } from 'react';

const ago = (seconds: number) => (seconds < 60 ? `${seconds} s ago` : `${Math.floor(seconds / 60)} min ago`);

// Counts in the browser since the last answer. Not a live region: a screen reader would read it every second.
export function Freshness({ updatedAt, retrying }: { updatedAt: number | null; retrying: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  let text: string;
  if (updatedAt === null) {
    text = retrying ? 'Not loaded yet · retrying every 10 s' : 'Loading blocks…';
  } else {
    const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
    text = retrying ? `Last update ${ago(seconds)} · retrying` : `Updated ${seconds} s ago · refreshes every 10 s`;
  }

  return <p className="mt-1 font-vl-mono text-xs text-vl-muted">{text}</p>;
}
