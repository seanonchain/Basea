# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development**
- `npm run dev` - Start Next.js development server on localhost:3000
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint checks

**Dependencies**
- `npm install` - Install all dependencies

## Architecture Overview

This is a Next.js 14 application that enables AI-powered Zora creator coin purchases using Base Account spend permissions. The system allows users to grant limited spending authority to a server-managed smart account, which then executes gas-sponsored transactions on their behalf.

### Core Flow

1. **Authentication**: User signs in with Base Account via wallet signature verification
2. **Spend Permissions**: User grants daily spending limit ($1-$2) to server's CDP smart account
3. **AI Chat**: GPT-4 processes natural language requests and identifies purchase intent
4. **Transaction Execution**: 
   - Frontend prepares spend permission calls using Base Account SDK
   - Backend executes via CDP Smart Account with gas sponsorship
   - USDC is swapped for creator coins and transferred to user's wallet

### Key Technical Components

**Base Account Integration** (`src/lib/spend-permissions.ts`)
- Uses `@base-org/account` SDK for spend permission management
- USDC token address: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Operates on Base mainnet (chain ID: 8453)

**CDP Smart Accounts** (`src/lib/cdp.ts`)
- Server creates a unique CDP smart account per user session
- Stored in memory (persists across hot reloads via global variable)
- All transactions gas-sponsored via CDP paymaster

**Transaction Processing** (`src/app/api/zora/buy/route.ts`)
- Executes spend permission calls to receive USDC
- Approves Permit2 contract (`0x000000000022d473030f116ddee9f6b43ac78ba3`)
- Performs token swap with retry logic (max 3 attempts)
- Transfers purchased creator coins to user's wallet

### Environment Configuration

Required environment variables:
- `CDP_API_KEY_ID` - Coinbase Developer Platform credentials
- `CDP_API_KEY_SECRET`
- `CDP_WALLET_SECRET`
- `OPENAI_API_KEY` - For AI chat functionality
- `PAYMASTER_URL` - CDP paymaster for gas sponsorship
- `ZORA_API_KEY` - Optional, prevents rate limiting

### API Routes

- `POST /api/auth/verify` - Wallet signature verification
- `GET/POST /api/wallet/create` - Create/retrieve server wallet and smart account
- `POST /api/spend-permission/request` - Request spend permission from user
- `POST /api/zora/buy` - Execute creator coin purchase
- `POST /api/chat` - AI chat interface

### Important Notes

- Server wallets are stored in memory and will be lost on server restart
- All transactions are gas-sponsored (users don't need ETH)
- Spend permissions are limited to $1-$2 daily for safety
- Creator coins are automatically transferred to user's wallet after purchase