// A peer this node knows. status is a word the API stores at registration; nothing checks it, so the page
// never shows it (DESIGN.md › What the design does not show).
export interface Peer {
  id: string;
  url: string;
  status: string;
}

export interface ResolveOutcome {
  message: string;
  replaced: boolean;
}
