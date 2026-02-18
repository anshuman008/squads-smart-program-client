/**
 * Script 5: Complete Proposal Flow
 *
 * Demonstrates the full async transaction flow:
 * createTransaction → createProposal → approveProposal → executeTransaction
 *
 * Usage:
 *   export SOLANA_PRIVATE_KEY="your-base58-private-key"
 *   npx tsx scripts/5-proposal-flow.ts <settings_address>
 */

import {
  address,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  signTransactionMessageWithSigners,
  getSignatureFromTransaction,
  lamports,
} from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { getRpc, getWallet, SQUADS_PROGRAM_ID, logTx } from './config.js';
import {
  getCreateTransactionInstruction,
  getCreateProposalInstruction,
  getApproveProposalInstruction,
  getExecuteTransactionInstruction,
  fetchSettings,
} from '../src/generated/index.js';

async function main() {
  const settingsAddress = process.argv[2];
  if (!settingsAddress) {
    console.log('Usage: npx tsx scripts/5-proposal-flow.ts <settings_address>');
    return;
  }

  console.log('=== Complete Proposal Flow ===\n');

  // 1. Setup
  const rpc = getRpc();
  const wallet = await getWallet();

  console.log(`Wallet: ${wallet.address}`);
  console.log(`Settings: ${settingsAddress}`);

  // 2. Fetch settings
  const settings = await fetchSettings(rpc, address(settingsAddress));
  const transactionIndex = settings.data.transactionIndex + 1n;
  console.log(`\nCurrent transaction index: ${settings.data.transactionIndex}`);
  console.log(`New transaction index: ${transactionIndex}`);
  console.log(`Threshold: ${settings.data.threshold}`);

  // 3. Build a simple SOL transfer instruction (the "inner" instruction)
  // This is what the smart account will execute
  console.log('\n--- Step 1: Create Transaction ---');

  // Note: Building the transaction message requires serializing the inner instructions
  // For a proper implementation, you need to:
  // 1. Build the inner instruction (e.g., SOL transfer from vault)
  // 2. Serialize it into SmartAccountTransactionMessage format
  // 3. Pass that as the transactionMessage bytes

  // Placeholder - this needs proper message building
  const innerInstruction = getTransferSolInstruction({
    source: wallet, // In real usage, this would be the vault PDA
    destination: wallet.address, // Transfer to self for testing
    amount: lamports(1000n), // 0.000001 SOL
  });

  console.log('Inner instruction built (placeholder)');
  console.log('Note: Full implementation requires SmartAccountTransactionMessage serialization');

  // 4. For demonstration, show what each step would look like

  console.log('\n--- Step 2: Create Proposal ---');
  console.log('After createTransaction, call createProposal:');
  console.log(`
  const proposalIx = getCreateProposalInstruction({
    settings: address(settingsAddress),
    proposal: proposalPda,      // Derived from settings + transactionIndex
    creator: wallet,
    rentPayer: wallet,
    systemProgram: address('11111111111111111111111111111111'),
    transactionIndex: ${transactionIndex}n,
    draft: false,               // Start as Active
  });
  `);

  console.log('\n--- Step 3: Approve Proposal ---');
  console.log('Each signer approves:');
  console.log(`
  const approveIx = getApproveProposalInstruction({
    settings: address(settingsAddress),
    signer: wallet,
    proposal: proposalPda,
    memo: null,
  });
  `);

  console.log('\n--- Step 4: Execute Transaction ---');
  console.log('After threshold reached + time lock:');
  console.log(`
  const executeIx = getExecuteTransactionInstruction({
    settings: address(settingsAddress),
    proposal: proposalPda,
    transaction: transactionPda,
    signer: wallet,
    // ... remaining accounts from transaction message
  });
  `);

  // 5. Show sync execution alternative
  console.log('\n--- Alternative: Sync Execution ---');
  console.log('If all signers are present and timeLock=0:');
  console.log(`
  const syncIx = getExecuteTransactionSyncInstruction({
    settings: address(settingsAddress),
    account: vaultPda,
    program: SQUADS_PROGRAM_ID,
    // ... remaining accounts
    accountIndex: 0,
    numSigners: ${settings.data.threshold},
    instructions: serializedMessage,
  });
  `);

  console.log('\n=== Flow Summary ===');
  console.log('1. createTransaction   - Store instructions on-chain');
  console.log('2. createProposal      - Create voting record');
  console.log('3. approveProposal     - Each signer votes (repeat until threshold)');
  console.log('4. executeTransaction  - Run the transaction');
  console.log('\nOr use executeTransactionSync for single-tx execution.');

  console.log('\n=== Done ===');
}

main().catch(console.error);
