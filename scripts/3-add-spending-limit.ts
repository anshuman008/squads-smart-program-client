/**
 * Script 3: Add Spending Limit
 *
 * Adds a spending limit to a smart account.
 * Requires you to be the settings authority.
 *
 * Usage:
 *   export SOLANA_PRIVATE_KEY="your-base58-private-key"
 *   npx tsx scripts/3-add-spending-limit.ts <settings_address>
 */

import {
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  generateKeyPairSigner,
} from '@solana/kit';
import { getRpc, getWallet, SQUADS_PROGRAM_ID, logTx } from './config.js';
import { getAddSpendingLimitAsAuthorityInstruction, fetchSettings } from '../src/generated/index.js';

// Native SOL mint (wrapped SOL)
const NATIVE_MINT = address('So11111111111111111111111111111111111111112');
const TOKEN_PROGRAM = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function main() {
  const settingsAddress = process.argv[2];
  if (!settingsAddress) {
    console.log('Usage: npx tsx scripts/3-add-spending-limit.ts <settings_address>');
    return;
  }

  console.log('=== Add Spending Limit ===\n');

  // 1. Setup
  const rpc = getRpc();
  const wallet = await getWallet();

  console.log(`Wallet: ${wallet.address}`);
  console.log(`Settings: ${settingsAddress}`);

  // 2. Fetch settings to verify authority
  const settings = await fetchSettings(rpc, address(settingsAddress));
  console.log(`Settings Authority: ${settings.data.settingsAuthority}`);

  // For controlled accounts, check if wallet is authority
  // For autonomous accounts (settingsAuthority = 11111...), this won't work

  // 3. Generate a seed for the spending limit PDA
  const spendingLimitSeed = await generateKeyPairSigner();
  console.log(`\nSpending Limit Seed: ${spendingLimitSeed.address}`);

  // 4. Build instruction
  console.log('\nBuilding addSpendingLimitAsAuthority instruction...');

  const ix = getAddSpendingLimitAsAuthorityInstruction({
    settings: address(settingsAddress),
    settingsAuthority: wallet, // Must be the settings authority
    spendingLimit: spendingLimitSeed.address, // This will be used to derive PDA
    rentPayer: wallet,
    systemProgram: address('11111111111111111111111111111111'),
    program: SQUADS_PROGRAM_ID,
    // Args
    seed: spendingLimitSeed.address,
    accountIndex: 0, // Primary vault
    mint: NATIVE_MINT, // SOL
    amount: 1_000_000_000n, // 1 SOL (in lamports)
    period: { day: {} }, // Daily limit
    signers: [wallet.address], // Who can use this limit
    destinations: [], // Empty = any destination
    expiration: 0n, // No expiration
    memo: null,
  });

  // 5. Build and send transaction
  console.log('Sending transaction...');

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const txMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayer(wallet.address, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstruction(ix, tx),
  );

  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const signature = getSignatureFromTransaction(signedTx);

  try {
    await rpc.sendTransaction(signedTx, { skipPreflight: false }).send();
    console.log('\nTransaction sent!');
    logTx(signature);

    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const confirmation = await rpc.confirmTransaction(signature, { commitment: 'confirmed' }).send();

    if (confirmation.value.err) {
      console.log('Transaction failed:', confirmation.value.err);
    } else {
      console.log('Transaction confirmed!');
      console.log('\nSpending limit created successfully.');
      console.log(`Seed (save this): ${spendingLimitSeed.address}`);
    }
  } catch (e) {
    console.log('Transaction failed:', e);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
