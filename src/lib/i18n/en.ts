// The English texts, the source of the dictionary (ADR-0007). es.ts has this object's type, so a text missing
// there fails tsc. A text that needs a number or a name is a function of it.
export const en = {
  kinds: {
    'Mining reward': 'Mining reward',
    Notarization: 'Notarization',
    Transfer: 'Transfer',
  },
  document: 'document',

  shell: {
    skip: 'Skip to content',
    mainNav: 'Main',
    tabs: { tower: 'Tower', transact: 'Sign and send', wallet: 'Wallet', network: 'Network' },
    signIn: 'Sign in',
    signOut: 'Sign out',
    tryDemo: 'Try the demo',
    starting: 'Starting…',
    demoFailed: 'The demo could not start',
    api: 'api · ',
    health: { checking: 'checking', online: 'online', offline: 'offline', 'no database': 'no database' },
    demoChip: (left: string) => `demo · ${left}`,
    hoursLeft: (hours: number) => `${hours} h left`,
    minutesLeft: (minutes: number) => `${minutes} min left`,
    theme: {
      names: { system: 'System', light: 'Light', dark: 'Dark' },
      label: (current: string, next: string) => `Theme: ${current}. Switch to ${next}`,
    },
    language: { code: 'EN', label: 'EN, English. Switch to español' },
    search: {
      label: 'Search a block number or a hash',
      placeholder: 'Block number or hash',
      results: 'Results',
      lookingUp: 'Looking it up…',
      typeMore: 'Type a block number or a full 64-character hash.',
      noBlock: (number: number) => `No block #${number} yet.`,
      noHash: 'No block or transaction with this hash on this node.',
      noAnswer: 'The node did not answer',
      block: (number: number) => `Block #${number}`,
      inBlock: (number: number) => `in block #${number}`,
      waiting: 'waiting',
    },
    offline: {
      unreachable: (host: string) => `Can’t reach ${host}.`,
      noDatabase: (host: string) => `${host} answers, but its database does not.`,
      retrying: 'Retrying every 10 s.',
      retry: 'Retry now',
    },
    toasts: { region: 'Notifications', dismiss: 'Dismiss', backOnline: 'Back online.' },
  },

  failure: {
    error: 'Error',
    pageTitle: 'This page ran into a problem',
    pageText: 'Something failed while it was drawn. The other pages still work, and a key held in this tab is kept.',
    tryAgain: 'Try again',
    backToTower: 'Back to the tower',
    appTitle: 'VeriLedger ran into a problem',
    appText: 'Reloading usually fixes it. A reload forgets a key held in this tab, so open its key file again afterwards.',
    reload: 'Reload',
  },

  notFound: {
    title: 'This page is not in the tower',
    text: 'The address may be mistyped, or the link is from an older version of the app.',
    back: 'Back to the tower',
  },
};

export type Messages = typeof en;
