import { Composer } from '../components/transact/Composer';
import { NoKey } from '../components/transact/NoKey';
import { useT } from '../components/useT';
import { useKeyStore } from '../store/useKeyStore';

// Artboard "C · Firmar y enviar" (VLW-45; before it VLW-30).
export function SignAndSend() {
  const t = useT();
  const pair = useKeyStore((state) => state.pair);

  return (
    <>
      <h1 className="text-[56px] leading-none font-extrabold tracking-[-0.035em] max-sm:text-[30px]">{t.transact.title}</h1>
      <p className="mt-2.5 max-w-[640px] text-[17px] text-vl-muted">{t.transact.lead}</p>
      {pair ? <Composer key={pair.public_key} pair={pair} /> : <NoKey />}
    </>
  );
}
