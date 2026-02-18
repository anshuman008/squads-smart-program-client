import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createKeyPairSignerFromBytes,
  type KeyPairSigner,
  type Rpc,
  type RpcSubscriptions,
  address,
  type Address,
} from '@solana/kit';
import bs58 from 'bs58';

// Squads Program ID (mainnet)
export const SQUADS_PROGRAM_ID = address('SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf');

// RPC endpoints
const RPC_URL = process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';
const WSS_URL = process.env.WSS_URL || 'wss://api.mainnet-beta.solana.com';

export function getRpc(): Rpc<any> {
  return createSolanaRpc(RPC_URL);
}

export function getRpcSubscriptions(): RpcSubscriptions<any> {
  return createSolanaRpcSubscriptions(WSS_URL);
}

export async function getWallet(): Promise<KeyPairSigner> {
  const privateKey = process.env.SOLANA_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SOLANA_PRIVATE_KEY environment variable not set');
  }

  const secretKey = bs58.decode(privateKey);
  return createKeyPairSignerFromBytes(secretKey);
}

// PDA derivation helpers
export function getProgramConfigPda(): Address {
  // ProgramConfig PDA: seeds = ["program_config"]
  // This is a known address on mainnet
  return address('Fy3YMJCvwbAXUgUM5b91ucUVDYNiYpSvhMp6W8LRJXDE');
}

export function getSettingsPda(seed: bigint): [Address, number] {
  // Settings PDA: seeds = ["smart_account", seed.to_le_bytes()]
  // For now, return placeholder - actual derivation needs @solana/addresses
  throw new Error('Use findProgramDerivedAddress from @solana/addresses');
}

export function getVaultPda(settings: Address, accountIndex: number): [Address, number] {
  // Vault PDA: seeds = ["smart_account", settings, account_index.to_le_bytes()]
  throw new Error('Use findProgramDerivedAddress from @solana/addresses');
}

// Helper to log transaction result
export function logTx(signature: string) {
  console.log(`Transaction: https://solscan.io/tx/${signature}`);
}

// Helper to log account
export function logAccount(address: string) {
  console.log(`Account: https://solscan.io/account/${address}`);
}
