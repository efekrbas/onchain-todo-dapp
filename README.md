# On-Chain Todo dApp

A simple decentralized Todo application built on Ethereum.

## Features

- Create, toggle, and delete todos
- Each wallet manages its own todo list
- Deployed on Sepolia Testnet

## Deployed Contract

- **Network:** Sepolia Testnet
- **Address:** `0x1a20C5af7342f0e79B142fd65f9eB10e32120829`

## Project Structure

- `contracts/` - Solidity smart contracts
- `scripts/` - Deployment scripts
- `test/` - Hardhat unit tests

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npx hardhat test
   ```

3. Deploy (requires .env configuration):
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```