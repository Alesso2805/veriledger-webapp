# VeriLedger Dashboard (Frontend)

This is the frontend dashboard for the VeriLedger project, built with modern web technologies to interact with the VeriLedger API. It provides a visual interface for managing wallets, making transactions, exploring blocks, and managing the P2P network.

## Tech Stack
- React 19
- Vite
- TypeScript
- Tailwind CSS v4
- Zustand (State Management)
- Axios (HTTP Client)
- Lucide React (Icons)
- `@noble/curves` (Ed25519 Cryptography for browser-side wallet signing)

## Features
- **Wallet Generation:** Creates secure Ed25519 keypairs entirely in the browser.
- **Transaction Signing:** Cryptographically signs transactions before sending them to the network.
- **Blockchain Explorer:** Visualizes mined blocks, nonces, and transactions.
- **P2P Network Management:** Allows connecting to other nodes and manually triggering consensus resolution.

## Setup & Running Locally

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

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

## Backend Connection
By default, the dashboard expects the VeriLedger API (backend) to be running at `http://127.0.0.1:8000`. You can configure this globally in `src/services/api.ts` if your backend is hosted elsewhere.
