import { useEffect, useState } from 'react';
import { useT } from '../useT';

// Counts in the browser since the last answer. Not a live region: a screen reader would read it every second.
export function Freshness({ updatedAt, retrying }: { updatedAt: number | null; retrying: boolean }) {
  const words = useT().chain.freshness;
  const ago = (seconds: number) => (seconds < 60 ? words.secondsAgo(seconds) : words.minutesAgo(Math.floor(seconds / 60)));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  let text: string;
  if (updatedAt === null) {
    text = retrying ? words.notLoaded : words.loading;
  } else {
    const seconds = Math.max(0, Math.floor((now - updatedAt) / 1000));
    text = retrying ? words.lastUpdate(ago(seconds)) : words.updated(seconds);
  }

  return <p className="mt-1 font-vl-mono text-xs text-vl-muted">{text}</p>;
}
