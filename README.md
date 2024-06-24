# Solana Wallet Adapter Test

This is a sample application to demonstrate how to integrate Custonomy Web3asy to a Solana dApp via `web3asy-wallet-adapter`.

## Features

In this example, it demonstrates how developers can use `web3asy-wallet-adapter` in both widget and backend mode, including:

- Connect to Solana devnet using Phantom Wallet or Web3asy Wallet Adapter.
- Switch between Widget mode and Backend mode for Web3asy Wallet Adapter.
- Request SOL airdrop.
- Create, initialize, and manage SPL tokens.
- Sign and send transactions using both legacy and versioned transactions.
- Sign and verify messages.
- Login using Google OAuth.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Solana CLI
- Google OAuth Client ID

## Getting Started

### Clone the Repository

```bash
git clone https://github.com/your-username/solana-wallet-adapter-test.git
cd solana-wallet-adapter-test
```

### Install Dependencies
Using npm:

```bash
npm install
```

Using yarn:

```bash
npm install
```

### Environment Variables
Create a `.env.local` file in the root directory of the project and add the following environment variables:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_SOL_CLUSTER=testnet
NEXT_PUBLIC_CUSTONOMY_APIKEY=your-custonomy-api-key
NEXT_PUBLIC_CUSTONOMY_ENDPOINT=your-custonomy-endpoint
NEXT_PUBLIC_CUSTONOMY_PROJECT_ID=your-custonomy-project-id
NEXT_PUBLIC_CUSTONOMY_APISECRET=your-custonomy-api-secret
```

### Run the Application
Using npm:

```bash
npm run dev
```

Using yarn:

```bash
yarn dev
```

Open http://localhost:3000 with your browser to see the result.

## Additional Information

For more information on how to use the Custonomy Web3asy Wallet Adapter, please refer to the official documentation.

## License

This project is licensed under the MIT License.

