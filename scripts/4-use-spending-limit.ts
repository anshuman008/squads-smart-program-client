/**
 * Script 4: Use Spending Limit
 *
 * Transfers tokens using a spending limit (no voting required).
 *
 * Usage:
 *   export SOLANA_PRIVATE_KEY="your-base58-private-key"
 *   npx tsx scripts/4-use-spending-limit.ts <settings_address> <spending_limit_seed> <destination> <amount_lamports>
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
} from '@solana/kit';
import { getRpc, getWallet, SQUADS_PROGRAM_ID, logTx } from './config.js';
import { getUseSpendingLimitInstruction, fetchSettings, fetchSpendingLimit } from '../src/generated/index.js';

// Native SOL mint (wrapped SOL)
const NATIVE_MINT = address('So11111111111111111111111111111111111111112');
const TOKEN_PROGRAM = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function main() {
  const settingsAddress = process.argv[2];
  const spendingLimitSeed = process.argv[3];
  const destination = process.argv[4];
  const amount = process.argv[5];

  if (!settingsAddress || !spendingLimitSeed || !destination || !amount) {
    console.log('Usage: npx tsx scripts/4-use-spending-limit.ts <settings> <spending_limit_seed> <destination> <amount_lamports>');
    console.log('Example: npx tsx scripts/4-use-spending-limit.ts 7nE9...abc Abc...xyz 9G5x...hmr 100000000');
    return;
  }

  console.log('=== Use Spending Limit ===\n');

  // 1. Setup
  const rpc = getRpc();
  const wallet = await getWallet();

  console.log(`Wallet: ${wallet.address}`);
  console.log(`Settings: ${settingsAddress}`);
  console.log(`Spending Limit Seed: ${spendingLimitSeed}`);
  console.log(`Destination: ${destination}`);
  console.log(`Amount: ${amount} lamports (${Number(amount) / 1e9} SOL)`);

  // 2. Fetch settings to get vault
  const settings = await fetchSettings(rpc, address(settingsAddress));
  console.log(`\nSettings threshold: ${settings.data.threshold}`);

  // Note: Vault PDA needs to be derived
  // seeds = ["smart_account", settings, account_index.to_le_bytes()]
  // For simplicity, you may need to derive this off-chain or pass it

  // 3. Build instruction
  console.log('\nBuilding useSpendingLimit instruction...');

  // Note: This requires the correct PDA addresses
  // The spending limit PDA: seeds = ["spending_limit", settings, seed]
  // The vault PDA: seeds = ["smart_account", settings, account_index]
  // You need to derive these using @solana/addresses findProgramDerivedAddress

  const ix = getUseSpendingLimitInstruction({
    settings: address(settingsAddress),
    // account: vaultPda, // Need to derive
    spendingLimit: address(spendingLimitSeed), // This should be the PDA, not the seed
    destination: address(destination),
    mint: NATIVE_MINT,
    tokenProgram: TOKEN_PROGRAM,
    signer: wallet,
    // Args
    amount: BigInt(amount),
    decimals: 9, // SOL has 9 decimals
    memo: null,
  });

  // 4. Build and send transaction
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
      console.log(`Transferred ${Number(amount) / 1e9} SOL to ${destination}`);
    }
  } catch (e) {
    console.log('Transaction failed:', e);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
