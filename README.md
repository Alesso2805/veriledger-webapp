# VeriLedger Dashboard (Frontend)

This is the frontend dashboard for the VeriLedger project, built with modern web technologies to interact with the VeriLedger API. It provides a visual interface for managing wallets, making transactions, exploring blocks, and managing the P2P network.

## Tech Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS v4 (Dark Mode Premium UI)
- Zustand (State Management)
- Axios (HTTP Client)
- Lucide React (Icons)
- `@noble/curves` (Ed25519 Cryptography for browser-side wallet signing)

## Application Flow & Architecture

VeriLedger is a fully functional, decentralized Blockchain application. Here is how the frontend interacts with the ledger:

1. **Identity & Wallets:** The browser generates an Ed25519 cryptographic keypair locally. The Private Key never leaves the browser, ensuring absolute security. The Public Key acts as the user's address.
2. **Transaction Signing:** When sending funds or notarizing a document, the frontend deterministically formats the payload and signs it using the user's Private Key via `@noble/curves`.
3. **Mempool:** The signed transaction is sent to the backend. The backend verifies the signature mathematically against the public key. If valid, it enters the pending Mempool.
4. **Mining (Proof of Work):** Any user can navigate to the Explorer and click "Start Mining". The backend bundles pending transactions, solves a cryptographic puzzle (finding a valid nonce), and creates a permanent block. The miner receives a block reward.
5. **Data Notarization (Proof of Existence):** Users can submit a cryptographic hash of a document instead of funds. Once mined, the Explorer displays a special "Notarization Certificate", proving the document existed at that exact timestamp because the blockchain is immutable.
6. **P2P Consensus:** Using the Network tab, users can connect multiple VeriLedger nodes. The "Resolve Conflicts" action polls all peers and replaces the local chain if a valid, longer chain is found, achieving decentralized consensus.

## Setup & Running Locally

### 1. Requirements
Install [Node.js](https://nodejs.org/) 22 LTS, 22.13 or later (the test environment, jsdom 29, needs it). The version is pinned in `.nvmrc`, so `nvm use` picks it.

### 2. Install Dependencies
Open your terminal in the `veriledger-webapp` directory and run:
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 4. Build for Production
To generate a production-ready optimized build:
```bash
npm run build
```
The build artifacts will be placed in the `dist/` directory.

## Useful Commands (Frontend)

Here are some helpful commands for daily development:

```bash
# Start the development server with hot-reload
npm run dev

# Run the linter to check for code quality issues
npm run lint

# Build the application for production
npm run build

# Preview the production build locally
npm run preview
```

## Backend Connection
In development the dashboard calls the API at `VITE_API_URL`, which `.env.development` sets to `http://127.0.0.1:8000`; put a different value in `.env.development.local` if your API runs elsewhere. A deployed container reads the API's address from `/config.json`, which `docker/write-config.sh` writes from `API_BASE_URL` (default `/api`) when the container starts.
