# Squads Smart Account - Instructions Reference

## Quick Reference

| Category | Instructions |
|----------|-------------|
| Setup | `createSmartAccount` |
| Sync Execution | `executeTransactionSync`, `executeSettingsTransactionSync` |
| Async Flow | `createTransaction`, `createProposal`, `approveProposal`, `rejectProposal`, `cancelProposal`, `activateProposal`, `executeTransaction`, `executeSettingsTransaction` |
| Spending Limits | `useSpendingLimit` |
| Batch | `createBatch`, `addTransactionToBatch`, `executeBatchTransaction` |
| Buffer | `createTransactionBuffer`, `extendTransactionBuffer`, `createTransactionFromBuffer`, `closeTransactionBuffer` |
| Settings (Authority) | `addSignerAsAuthority`, `removeSignerAsAuthority`, `changeThresholdAsAuthority`, `setTimeLockAsAuthority`, `setNewSettingsAuthorityAsAuthority`, `setArchivalAuthorityAsAuthority`, `addSpendingLimitAsAuthority`, `removeSpendingLimitAsAuthority` |
| Cleanup | `closeTransaction`, `closeSettingsTransaction`, `closeBatch`, `closeBatchTransaction` |
| Config | `initializeProgramConfig`, `setProgramConfigAuthority`, `setProgramConfigTreasury`, `setProgramConfigSmartAccountCreationFee` |

---

## Smart Account Lifecycle

### createSmartAccount

Creates a new smart account (multisig wallet).

**Use when:** Setting up a new multisig for team treasury, DAO, or delegated wallet.

**Parameters:**
- `threshold` - Required signatures (1-65535)
- `signers` - Array of `{key, permissions}`
- `timeLock` - Seconds between approval and execution (0 for instant)
- `settingsAuthority` - Who controls settings (null = autonomous/voting required)

**Permissions bitmask:**
| Value | Permission | Capability |
|-------|------------|------------|
| 1 | Initiate | Create proposals |
| 2 | Vote | Approve/reject |
| 4 | Execute | Run approved transactions |
| 7 | All | Full access |

---

## Transaction Flows

### Sync Flow (Single Transaction)

Use when all required signers are available to sign together.

```
executeTransactionSync
├── All signers sign the same transaction
├── Threshold validated on-chain
└── Instructions execute immediately via CPI
```

**Requirements:**
- `timeLock` must be 0
- All signers must sign the outer transaction

### Async Flow (Proposal-Based)

Use when signers approve at different times.

```
createTransaction → createProposal → approveProposal (×N) → executeTransaction
```

**Steps:**

1. **createTransaction** - Store the instructions on-chain
2. **createProposal** - Create voting record (draft or active)
3. **activateProposal** - Optional: activate if created as draft
4. **approveProposal** - Each signer votes (repeat until threshold)
5. **executeTransaction** - Run after threshold + time lock

### executeSettingsTransactionSync / executeSettingsTransaction

Same flows but for settings changes (add/remove signers, change threshold).

---

## Spending Limits

### useSpendingLimit

Transfer tokens without full multisig approval.

**Use when:**
- Paying recurring expenses
- Agent needs limited spending access
- Daily operational transfers

**Constraints:**
- Token transfers only (SPL Token / Token-2022)
- Amount capped per period (Day/Week/Month/OneTime)
- Optional destination whitelist
- Optional expiration

**Parameters:**
- `amount` - Tokens to transfer
- `decimals` - Token decimals
- `memo` - Optional memo

**Note:** Does NOT support arbitrary program calls (no Jupiter swaps, no DeFi).

---

## Batch Operations

Execute multiple transactions in sequence with single proposal.

### createBatch

Initialize a batch container.

### addTransactionToBatch

Add transaction message to batch.

### executeBatchTransaction

Execute next transaction in batch (call repeatedly).

**Use when:**
- Atomic multi-step operations
- Sequential DeFi operations
- Bulk transfers

---

## Transaction Buffer

Handle large transaction messages exceeding single transaction limits.

### createTransactionBuffer

Start buffer with initial chunk + final hash.

### extendTransactionBuffer

Append more data to buffer.

### createTransactionFromBuffer

Finalize buffer into executable transaction.

### closeTransactionBuffer

Reclaim rent from unused buffer.

**Use when:** Complex DeFi transactions with many accounts (>35).

---

## Settings Management (Authority-Controlled)

For "controlled" smart accounts where `settingsAuthority` is set.
Changes happen instantly without voting.

| Instruction | Action |
|-------------|--------|
| `addSignerAsAuthority` | Add new signer with permissions |
| `removeSignerAsAuthority` | Remove signer |
| `changeThresholdAsAuthority` | Change required signatures |
| `setTimeLockAsAuthority` | Change time lock duration |
| `setNewSettingsAuthorityAsAuthority` | Transfer control |
| `setArchivalAuthorityAsAuthority` | Set archival authority |
| `addSpendingLimitAsAuthority` | Create spending limit |
| `removeSpendingLimitAsAuthority` | Delete spending limit |

---

## Cleanup Operations

Reclaim rent from completed/cancelled operations.

| Instruction | Closes |
|-------------|--------|
| `closeTransaction` | Transaction PDA |
| `closeSettingsTransaction` | SettingsTransaction PDA |
| `closeBatch` | Batch PDA |
| `closeBatchTransaction` | BatchTransaction PDA |

**Rent goes to:** `rentCollector` specified during creation.

---

## Program Config (Admin Only)

Global program configuration (Squads team controlled).

| Instruction | Action |
|-------------|--------|
| `initializeProgramConfig` | Initial setup |
| `setProgramConfigAuthority` | Transfer admin |
| `setProgramConfigTreasury` | Change fee destination |
| `setProgramConfigSmartAccountCreationFee` | Change creation fee |
