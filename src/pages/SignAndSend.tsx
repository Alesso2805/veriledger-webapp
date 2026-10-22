import { Composer } from '../components/transact/Composer';
import { NoKey } from '../components/transact/NoKey';
import { useT } from '../components/useT';
import { useKeyStore } from '../store/useKeyStore';

// Artboard "E · Firmar y enviar" (VLW-30). It replaces the transact page at /transact once it can send (30c).
export function SignAndSend() {
  const t = useT();
  const pair = useKeyStore((state) => state.pair);

  return (
    <>
      <h1 className="text-[30px] font-bold tracking-[-0.02em]">{t.transact.title}</h1>
      <p className="mt-1 text-vl-muted">{t.transact.lead}</p>
      {pair ? <Composer key={pair.public_key} pair={pair} /> : <NoKey />}
    </>
  );
}
