# Squads Smart Account Client

Kit-native TypeScript client for the **Squads Smart Account Program** on Solana.

## What is Squads Smart Account?

A multisig/smart wallet system on Solana that enables:
- Multi-signature wallets with customizable thresholds
- Permission-based signer management
- Spending limits with periodic resets
- Time-locked transactions
- Both sync and async transaction flows

**Program ID:** `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`

---

## Installation

```bash
npm install @pocket-wallet/squads-client
```

### Build from Source

```bash
npm install
npm run build
```

### Regenerate from IDL

```bash
npm run rebuild  # generate + patch + build
```

---

## Core Concepts

### Accounts

| Account | Purpose |
|---------|---------|
| **Settings** | Main smart account config (threshold, signers, time lock) |
| **Vault** | PDA that holds funds (each account can have 256 vaults) |
| **Proposal** | Tracks voting status for pending transactions |
| **Transaction** | Stores instructions to be executed |
| **SpendingLimit** | Allows token transfers without full multisig |

### Permissions

Each signer has a permission bitmask:

| Permission | Value | Capability |
|------------|-------|------------|
| Initiate | 1 | Create proposals/transactions |
| Vote | 2 | Approve or reject proposals |
| Execute | 4 | Execute approved transactions |
| All | 7 | Full access |

### Proposals

A proposal is a **pending transaction waiting for signatures**.

```
Signer A creates transaction + proposal
         │
         ▼
Signer B approves (1/2)
         │
         ▼
Signer C approves (2/2) ✓ Threshold met
         │
         ▼
Anyone executes the transaction
```

Use proposals when signers are available at different times.

---

## Delegation Methods

### 1. Signer Permissions

Add someone as a signer with limited permissions.

```typescript
// Agent can create and execute, but cannot vote
addSignerAsAuthority({
  newSigner: { key: agentPubkey, permissions: 5 }  // Initiate + Execute
});
```

### 2. SpendingLimit

Allow token transfers without voting (transfers only, not swaps).

```typescript
addSpendingLimitAsAuthority({
  mint: USDC_MINT,
  amount: 1000_000000n,      // 1000 USDC
  period: { day: {} },       // Daily limit
  signers: [agentPubkey],
  destinations: [],          // Empty = any destination
});
```

### 3. Settings Authority

Single address that controls all settings without voting.

```typescript
createSmartAccount({
  settingsAuthority: adminPubkey,  // Full control
  threshold: 2,
  signers: [...],
});
```

### 4. Archival Authority

Can close stale proposals and reclaim rent.

```typescript
setArchivalAuthorityAsAuthority({
  archivalAuthority: cleanupBotPubkey,
});
```

---

## Transaction Flows

### Sync Flow (Single Transaction)

All signers available → sign together → execute immediately.

```typescript
executeTransactionSync({
  settings,
  accountIndex: 0,
  numSigners: 2,
  instructions: transactionMessage,
});
```

**Requirements:** `timeLock` must be 0.

### Async Flow (Proposal-Based)

Signers available at different times → create proposal → collect votes → execute.

```typescript
// Step 1: Create transaction
createTransaction({ accountIndex: 0, transactionMessage });

// Step 2: Create proposal
createProposal({ transactionIndex, draft: false });

// Step 3: Signers approve
approveProposal({ memo: null });  // Repeat until threshold

// Step 4: Execute
executeTransaction();
```

---

## Instructions Reference

### Smart Account Lifecycle

| Instruction | Use Case |
|-------------|----------|
| `createSmartAccount` | Create new multisig wallet |

### Transaction Execution

| Instruction | Use Case |
|-------------|----------|
| `executeTransactionSync` | All signers present, execute immediately |
| `executeSettingsTransactionSync` | Change settings with all signers present |

### Proposal Flow

| Instruction | Use Case |
|-------------|----------|
| `createTransaction` | Store instructions on-chain |
| `createProposal` | Create voting record |
| `activateProposal` | Draft → Active |
| `approveProposal` | Vote yes |
| `rejectProposal` | Vote no |
| `cancelProposal` | Cancel approved proposal |
| `executeTransaction` | Run after approval + time lock |
| `executeSettingsTransaction` | Run settings change after approval |

### Spending Limits

| Instruction | Use Case |
|-------------|----------|
| `useSpendingLimit` | Transfer tokens within limit (no voting) |

### Batch Operations

| Instruction | Use Case |
|-------------|----------|
| `createBatch` | Initialize batch container |
| `addTransactionToBatch` | Add transaction to batch |
| `executeBatchTransaction` | Execute next in sequence |

### Large Transactions (Buffer)

| Instruction | Use Case |
|-------------|----------|
| `createTransactionBuffer` | Start buffer with initial chunk |
| `extendTransactionBuffer` | Append more data |
| `createTransactionFromBuffer` | Finalize into transaction |
| `closeTransactionBuffer` | Reclaim rent |

### Settings (Authority-Controlled)

| Instruction | Use Case |
|-------------|----------|
| `addSignerAsAuthority` | Add new signer |
| `removeSignerAsAuthority` | Remove signer |
| `changeThresholdAsAuthority` | Change required signatures |
| `setTimeLockAsAuthority` | Change time lock |
| `addSpendingLimitAsAuthority` | Create spending limit |
| `removeSpendingLimitAsAuthority` | Delete spending limit |

### Cleanup

| Instruction | Use Case |
|-------------|----------|
| `closeTransaction` | Reclaim rent from transaction |
| `closeSettingsTransaction` | Reclaim rent from settings tx |
| `closeBatch` | Reclaim rent from batch |
| `closeBatchTransaction` | Reclaim rent from batch tx |

---

## Agent Use Cases

### Pattern A: Agent as Full Signer

Agent has full control (high trust).

```typescript
createSmartAccount({
  threshold: 1,
  signers: [{ key: agentPubkey, permissions: 7 }],
});
```

### Pattern B: Agent with User Approval

Agent proposes, user approves.

```typescript
createSmartAccount({
  threshold: 1,
  signers: [
    { key: userPubkey, permissions: 7 },   // User: full control
    { key: agentPubkey, permissions: 5 },  // Agent: initiate + execute only
  ],
});
```

Flow:
1. Agent creates proposal (Jupiter swap)
2. User reviews and approves
3. Agent executes

### Pattern C: Separate Agent Vault (Recommended for DeFi)

Cap risk via SpendingLimit.

```
User Vault (threshold: 2)
    │
    └── SpendingLimit (10 SOL/day) ──→ Agent Vault (threshold: 1)
                                            │
                                            └── Agent does swaps freely
```

```typescript
// 1. Create agent vault
createSmartAccount({
  threshold: 1,
  signers: [{ key: agentPubkey, permissions: 7 }],
});

// 2. Add spending limit on user vault
addSpendingLimitAsAuthority({
  mint: SOL_MINT,
  amount: 10_000_000_000n,  // 10 SOL
  period: { day: {} },
  signers: [agentPubkey],
  destinations: [agentVaultAddress],
});

// 3. Agent tops up its vault
useSpendingLimit({ amount: 5_000_000_000n });

// 4. Agent swaps from its vault (no limits here)
executeTransactionSync({ /* Jupiter swap */ });
```

---

## Code Examples

### Create Smart Account

```typescript
import { getCreateSmartAccountInstruction } from '@pocket-wallet/squads-client';

const ix = getCreateSmartAccountInstruction({
  programConfig,
  settings,
  treasury,
  creator: wallet.address,
  rentPayer: wallet.address,
  systemProgram,
  program: SQUADS_PROGRAM_ID,
  args: {
    settingsAuthority: null,  // Autonomous
    threshold: 2,
    signers: [
      { key: signer1, permissions: { mask: 7 } },
      { key: signer2, permissions: { mask: 7 } },
    ],
    timeLock: 0,
    rentCollector: null,
    memo: null,
  },
});
```

### Execute Sync Transaction

```typescript
import { getExecuteTransactionSyncInstruction } from '@pocket-wallet/squads-client';

const ix = getExecuteTransactionSyncInstruction({
  settings,
  account: vault,
  program: SQUADS_PROGRAM_ID,
  // ... remaining accounts from transaction message
  args: {
    accountIndex: 0,
    numSigners: 2,
    instructions: serializedTransactionMessage,
  },
});
```

### Use Spending Limit

```typescript
import { getUseSpendingLimitInstruction } from '@pocket-wallet/squads-client';

const ix = getUseSpendingLimitInstruction({
  settings,
  account: vault,
  spendingLimit: spendingLimitPda,
  destination: recipientTokenAccount,
  mint,
  tokenProgram,
  signer: agent.address,
  args: {
    amount: 100_000_000n,  // 100 tokens
    decimals: 6,
    memo: null,
  },
});
```

---

## Limitations

| Feature | Status |
|---------|--------|
| Program ID filtering | Not available |
| Per-swap amount limits | Not available (use Pattern C) |
| Slippage validation | Not available (validate off-chain) |

SpendingLimit only works for **token transfers**, not arbitrary program calls (no Jupiter swaps).

---

## Documentation

- [Instructions Reference](docs/instructions.md) - Detailed instruction docs
- [Agent Delegation Patterns](docs/agentic_usecase.md) - Agent use cases and solutions

---

## License

MIT
