/**
 * Script 1: Read Existing Squads Accounts (Free, No Risk)
 *
 * This script reads existing Squads accounts from mainnet.
 * No wallet needed - just reading public data.
 *
 * Usage: npx tsx scripts/1-read-accounts.ts [settings_address]
 */

import { address } from '@solana/kit';
import { getRpc, SQUADS_PROGRAM_ID, logAccount } from './config.js';
import {
  fetchSettings,
  fetchMaybeSettings,
  fetchProgramConfig,
  fetchMaybeProposal,
  fetchMaybeSpendingLimit,
} from '../src/generated/index.js';

async function main() {
  const rpc = getRpc();

  console.log('=== Squads Smart Account - Read Accounts ===\n');

  // 1. Verify program exists
  console.log('1. Checking Squads program...');
  const programInfo = await rpc.getAccountInfo(SQUADS_PROGRAM_ID).send();
  if (programInfo.value) {
    console.log(`   Program exists: ${SQUADS_PROGRAM_ID}`);
    console.log(`   Data size: ${programInfo.value.data.length} bytes`);
  } else {
    console.log('   ERROR: Program not found!');
    return;
  }

  // 2. Read ProgramConfig
  console.log('\n2. Reading ProgramConfig...');
  try {
    const programConfigAddress = address('Fy3YMJCvwbAXUgUM5b91ucUVDYNiYpSvhMp6W8LRJXDE');
    const programConfig = await fetchProgramConfig(rpc, programConfigAddress);
    console.log('   ProgramConfig found:');
    console.log(`   - Smart Account Index: ${programConfig.data.smartAccountIndex}`);
    console.log(`   - Authority: ${programConfig.data.authority}`);
    console.log(`   - Creation Fee: ${programConfig.data.smartAccountCreationFee} lamports`);
    console.log(`   - Treasury: ${programConfig.data.treasury}`);
  } catch (e) {
    console.log(`   Could not fetch ProgramConfig: ${e}`);
  }

  // 3. Read a specific Settings account (if provided)
  const settingsAddress = process.argv[2];
  if (settingsAddress) {
    console.log(`\n3. Reading Settings: ${settingsAddress}`);
    try {
      const settings = await fetchSettings(rpc, address(settingsAddress));
      console.log('   Settings found:');
      console.log(`   - Seed: ${settings.data.seed}`);
      console.log(`   - Threshold: ${settings.data.threshold}`);
      console.log(`   - Time Lock: ${settings.data.timeLock}s`);
      console.log(`   - Transaction Index: ${settings.data.transactionIndex}`);
      console.log(`   - Settings Authority: ${settings.data.settingsAuthority}`);
      console.log(`   - Signers (${settings.data.signers.length}):`);
      for (const signer of settings.data.signers) {
        console.log(`     - ${signer.key} (permissions: ${signer.permissions.mask})`);
      }
      logAccount(settingsAddress);
    } catch (e) {
      console.log(`   Could not fetch Settings: ${e}`);
    }
  } else {
    console.log('\n3. No settings address provided.');
    console.log('   Usage: npx tsx scripts/1-read-accounts.ts <settings_address>');
    console.log('   Example: npx tsx scripts/1-read-accounts.ts 7nE9...xyz');
  }

  // 4. Search for Squads accounts (limited)
  console.log('\n4. Searching for Squads accounts...');
  try {
    const accounts = await rpc.getProgramAccounts(SQUADS_PROGRAM_ID, {
      dataSlice: { offset: 0, length: 8 }, // Just discriminator
      filters: [],
    }).send();
    console.log(`   Found ${accounts.length} total accounts`);

    // Show first 5
    if (accounts.length > 0) {
      console.log('   First 5 accounts:');
      for (const acc of accounts.slice(0, 5)) {
        console.log(`   - ${acc.pubkey}`);
      }
    }
  } catch (e) {
    console.log(`   Search failed (may need paid RPC): ${e}`);
  }

  console.log('\n=== Done ===');
}

main().catch(console.error);
