/**
 * Script 2: Create Smart Account
 *
 * Creates a new Squads smart account (multisig wallet).
 * Cost: ~0.01 SOL for rent
 *
 * Usage:
 *   export SOLANA_PRIVATE_KEY="your-base58-private-key"
 *   npx tsx scripts/2-create-smart-account.ts
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
import { getSetComputeUnitLimitInstruction } from '@solana-program/compute-budget';
import { getRpc, getRpcSubscriptions, getWallet, SQUADS_PROGRAM_ID, logTx, logAccount } from './config.js';
import { getCreateSmartAccountInstruction } from '../src/generated/index.js';

async function main() {
  console.log('=== Create Smart Account ===\n');

  // 1. Setup
  const rpc = getRpc();
  const rpcSubscriptions = getRpcSubscriptions();
  const wallet = await getWallet();

  console.log(`Wallet: ${wallet.address}`);

  // Check balance
  const balance = await rpc.getBalance(wallet.address).send();
  console.log(`Balance: ${Number(balance.value) / 1e9} SOL`);

  if (balance.value < 10_000_000n) {
    console.log('ERROR: Need at least 0.01 SOL');
    return;
  }

  // 2. Get ProgramConfig to find treasury
  const programConfigAddress = address('Fy3YMJCvwbAXUgUM5b91ucUVDYNiYpSvhMp6W8LRJXDE');

  // 3. Build instruction
  console.log('\nBuilding createSmartAccount instruction...');

  const ix = getCreateSmartAccountInstruction({
    programConfig: programConfigAddress,
    treasury: address('9G5xVKxGT3Vg1ks5iF5NjPUVeqVmyobbTiPqwSRpHm7S'), // Squads treasury (from config)
    creator: wallet,
    program: SQUADS_PROGRAM_ID,
    // Args
    settingsAuthority: null, // Autonomous - changes require voting
    threshold: 1, // Single signer for testing
    signers: [
      {
        key: wallet.address,
        permissions: { mask: 7 }, // All permissions (Initiate + Vote + Execute)
      },
    ],
    timeLock: 0, // No time lock - allows sync execution
    rentCollector: null,
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

  // Send transaction
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
      console.log('\nNote: The Settings PDA address is derived from the seed.');
      console.log('Check the transaction logs to find your new smart account address.');
    }
  } catch (e) {
    console.log('Transaction failed:', e);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
