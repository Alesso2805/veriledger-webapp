import { useEffect, useState } from 'react';
import { Activity } from '../components/wallet/Activity';
import { AddressLookup } from '../components/wallet/AddressLookup';
import { CreateOrOpen } from '../components/wallet/CreateOrOpen';
import { IdentityCard } from '../components/wallet/IdentityCard';
import { KeyCard } from '../components/wallet/KeyCard';
import { useT } from '../components/useT';
import { activitySummary } from '../lib/activity';
import { getBalance, getWalletTransactions } from '../services/wallets';
import { useKeyStore } from '../store/useKeyStore';
import type { Transaction } from '../types/ledger';

const ACTIVITY_SHOWN = 20;

// Artboard "C · Wallet". The key it creates or opens is the one Sign and send signs with.
export function Wallet() {
  const t = useT();
  const pair = useKeyStore((state) => state.pair);
  const [fresh, setFresh] = useState(false);
  const [balance, setBalance] = useState<number | 'unknown' | null>(null);
  const [activity, setActivity] = useState<{ items: Transaction[] | 'unknown' | null; total: number }>({ items: null, total: 0 });
  const address = pair?.public_key;

  useEffect(() => {
    if (!address) return;
    let active = true;
    setBalance(null);
    setActivity({ items: null, total: 0 });
    getBalance(address).then(
      (amount) => active && setBalance(amount),
      () => active && setBalance('unknown'),
    );
    getWalletTransactions(address, 0, ACTIVITY_SHOWN).then(
      (page) => active && setActivity({ items: page.items, total: page.total }),
      () => active && setActivity({ items: 'unknown', total: 0 }),
    );
    return () => {
      active = false;
    };
  }, [address]);

  // The sums are only true of the whole activity, so they wait until all of it is loaded.
  const items = activity.items;
  const note =
    address && Array.isArray(items) && activity.total <= items.length ? activitySummary(address, items, t.wallet.activity) : null;

  return (
    <>
      <h1 className="text-[56px] leading-none font-extrabold tracking-[-0.035em] max-sm:text-[40px]">{t.wallet.title}</h1>
      <p className="mt-2.5 max-w-[640px] text-[17px] text-vl-muted">{t.wallet.lead}</p>
      {pair ? (
        <>
          <div className="mt-6 flex flex-wrap items-stretch gap-[22px]">
            <IdentityCard address={pair.public_key} fresh={fresh} balance={balance} note={note} />
            <KeyCard key={pair.public_key} pair={pair} />
          </div>
          <div className="mt-[22px] flex flex-wrap items-start gap-[22px]">
            <Activity address={pair.public_key} transactions={items} total={activity.total} />
            <AddressLookup />
          </div>
        </>
      ) : (
        <CreateOrOpen onReady={() => setFresh(true)} />
      )}
    </>
  );
}
