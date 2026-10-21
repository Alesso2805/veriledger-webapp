import { NoKey } from '../components/transact/NoKey';
import { SigningAs } from '../components/transact/SigningAs';
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
      {pair ? (
        <div className="mt-6 flex flex-wrap items-start gap-5">
          <form
            onSubmit={(event) => event.preventDefault()}
            className="flex min-w-0 flex-[1_1_420px] flex-col gap-4 rounded-2xl border border-vl-line bg-vl-surface p-5"
          >
            <SigningAs address={pair.public_key} />
          </form>
        </div>
      ) : (
        <NoKey />
      )}
    </>
  );
}
