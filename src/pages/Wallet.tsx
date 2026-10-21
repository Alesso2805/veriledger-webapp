import { useEffect, useState } from 'react';
import { CreateOrOpen } from '../components/wallet/CreateOrOpen';
import { IdentityCard } from '../components/wallet/IdentityCard';
import { KeyCard } from '../components/wallet/KeyCard';
import { getBalance } from '../services/wallets';
import { useKeyStore } from '../store/useKeyStore';

// Artboard "E · Wallet" (VLW-31). The key it creates or opens is the one Sign and send signs with.
export function Wallet() {
  const pair = useKeyStore((state) => state.pair);
  const [fresh, setFresh] = useState(false);
  const [balance, setBalance] = useState<number | 'unknown' | null>(null);
  const address = pair?.public_key;

  useEffect(() => {
    if (!address) return;
    let active = true;
    setBalance(null);
    getBalance(address).then(
      (amount) => active && setBalance(amount),
      () => active && setBalance('unknown'),
    );
    return () => {
      active = false;
    };
  }, [address]);

  return (
    <>
      <h1 className="text-[30px] font-bold tracking-[-0.02em]">Wallet</h1>
      <p className="mt-1 text-vl-muted">
        Keys are created in this browser and kept only in this tab. VeriLedger never sees them.
      </p>
      {pair ? (
        <div className="mt-6 flex flex-wrap items-stretch gap-5">
          <IdentityCard address={pair.public_key} fresh={fresh} balance={balance} />
          <KeyCard key={pair.public_key} pair={pair} />
        </div>
      ) : (
        <CreateOrOpen onReady={() => setFresh(true)} />
      )}
    </>
  );
}
