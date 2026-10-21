import { Composer } from '../components/transact/Composer';
import { NoKey } from '../components/transact/NoKey';
import { useKeyStore } from '../store/useKeyStore';

// Artboard "E · Firmar y enviar" (VLW-30). It replaces the transact page at /transact once it can send (30c).
export function SignAndSend() {
  const pair = useKeyStore((state) => state.pair);

  return (
    <>
      <h1 className="text-[30px] font-bold tracking-[-0.02em]">Sign and send</h1>
      <p className="mt-1 text-vl-muted">
        Your private key stays in this tab. Only the message and its signature reach the node.
      </p>
      {pair ? <Composer key={pair.public_key} pair={pair} /> : <NoKey />}
    </>
  );
}
