# Agent Delegation with Squads Smart Accounts

## Overview

Use Squads to give agents controlled access to user funds. This document covers delegation patterns, what constraints are possible, and how to work around limitations.

---

## What Squads Provides

### Permission System

| Permission | Value | Agent Use |
|------------|-------|-----------|
| Initiate | 1 | Agent can create transactions |
| Vote | 2 | Agent can approve |
| Execute | 4 | Agent can execute approved transactions |
| All | 7 | Full access |

### SpendingLimit

Token transfers with constraints:
- **Amount cap** - Max tokens per period
- **Period** - Day / Week / Month / OneTime
- **Destinations** - Whitelist of recipient addresses
- **Expiration** - Auto-disable after timestamp

### Threshold Control

- Set `threshold = 1` with agent as only signer = agent has full control
- Set `threshold = 2` with agent + user = requires user co-sign

---

## What Squads Does NOT Provide

| Constraint | Status | Impact |
|------------|--------|--------|
| Program ID filtering | Not available | Agent can call ANY program |
| Instruction type filtering | Not available | Cannot restrict to "swap only" |
| Slippage limits | Not available | No on-chain slippage validation |
| Token whitelist for swaps | Not available | SpendingLimit is for transfers only |

**Key limitation:** SpendingLimit only works for SPL Token transfers. It cannot constrain Jupiter swaps or other DeFi operations.

---

## Delegation Patterns

### Pattern A: Agent as Signer (Full Trust)

```
User's Smart Account
├── threshold: 1
├── signers: [Agent (permissions: 7)]
└── Vault holds funds

Agent can execute ANY transaction
```

**When to use:** Fully trusted agent, simple setup.

**Risk:** Agent has unlimited access to vault funds.

### Pattern B: Separate Agent Vault (Recommended)

```
Main Vault (User controlled)
├── threshold: 2 (user + backup)
├── SpendingLimit → Agent Vault (e.g., 10 SOL/day)
│
Agent Vault (Agent controlled)
├── threshold: 1 (agent only)
├── Agent can do swaps, DeFi, etc.
└── Risk capped to SpendingLimit amount
```

**When to use:** Agent needs DeFi access (Jupiter swaps), but risk should be capped.

**Setup:**
1. Create main smart account (user controlled, threshold: 2)
2. Create agent smart account (threshold: 1, agent as signer)
3. Add SpendingLimit on main vault → agent vault

**Example spending limit:**
```typescript
addSpendingLimitAsAuthority({
  mint: SOL_MINT,           // or USDC, etc.
  amount: 10_000_000_000n,  // 10 SOL (in lamports)
  period: Period.Day,
  signers: [agentPubkey],
  destinations: [agentVault],  // Only to agent's vault
  expiration: 0,            // No expiration
});
```

### Pattern C: Custom Wrapper Program (Maximum Control)

```
User's Smart Account
├── Controlled by: Wrapper Program
│
Wrapper Program (Custom)
├── Validates target program (Jupiter only)
├── Validates swap parameters
├── Validates amount limits
└── Forwards to Squads for execution
```

**When to use:** Need program ID filtering, slippage validation, or custom constraints.

**Requires:** Custom Anchor/Pinocchio program development.

---

## Implementation: Pattern B (Agent Vault)

### 1. Create Agent Vault

```typescript
import { getCreateSmartAccountInstruction } from '@pocket-wallet/squads-client';

const agentVault = await createSmartAccount(client, creator, {
  threshold: 1,
  signers: [{ key: agentPubkey, permissions: 7 }],
  timeLock: 0,
  settingsAuthority: null,  // Autonomous
});
```

### 2. Add SpendingLimit (on User's Main Vault)

```typescript
import { getAddSpendingLimitAsAuthorityInstruction } from '@pocket-wallet/squads-client';

await addSpendingLimitAsAuthority(client, authority, {
  settings: userVaultSettings,
  mint: SOL_MINT,
  amount: 10_000_000_000n,  // 10 SOL
  period: { day: {} },
  signers: [agentPubkey],
  destinations: [agentVaultAddress],
});
```

### 3. Agent Tops Up Its Vault

```typescript
import { getUseSpendingLimitInstruction } from '@pocket-wallet/squads-client';

// Agent transfers from user vault to agent vault
await useSpendingLimit(client, agent, {
  settings: userVaultSettings,
  spendingLimit: spendingLimitPda,
  amount: 5_000_000_000n,  // 5 SOL
  destination: agentVaultTokenAccount,
});
```

### 4. Agent Does Jupiter Swap

```typescript
// Agent has full control of agent vault
// Build Jupiter swap instruction
const jupiterIx = await getJupiterSwapInstruction(...);

// Execute via agent's smart account
await executeTransactionSync(client, [agent], {
  settings: agentVaultSettings,
  accountIndex: 0,
  instructions: buildSmartAccountMessage([jupiterIx]),
});
```

---

## Limitations & Solutions

| Limitation | Impact | Solution |
|------------|--------|----------|
| No program ID filter | Agent can call any program | Pattern B (separate vault) or Pattern C (wrapper) |
| SpendingLimit = transfers only | Can't limit swap amounts | Pattern B caps total funds available |
| No slippage validation | Agent could execute bad swaps | Off-chain validation in agent service |
| No per-transaction limits | Agent could drain in one swap | Pattern B caps total available funds |
| No time-of-day restrictions | Agent can execute anytime | Off-chain validation in agent service |

---

## Security Recommendations

1. **Use Pattern B** for any agent doing DeFi operations
2. **Set conservative SpendingLimits** - start small, increase as trust builds
3. **Use short periods** - Day is better than Month for limiting exposure
4. **Monitor agent activity** - subscribe to transaction logs
5. **Set expirations** - auto-disable delegation after trial period
6. **Multiple agent vaults** - separate by risk level (low-risk vs high-risk operations)

---

## Off-Chain Validation (Agent Service)

Even with Pattern B, implement agent-side validation:

```typescript
async function validateSwapRequest(request: SwapRequest): Promise<boolean> {
  // 1. Check program whitelist
  if (!ALLOWED_PROGRAMS.includes(request.programId)) {
    return false;
  }

  // 2. Check token whitelist
  if (!ALLOWED_TOKENS.includes(request.inputMint)) {
    return false;
  }

  // 3. Check slippage
  if (request.slippageBps > MAX_SLIPPAGE_BPS) {
    return false;
  }

  // 4. Check daily limits from database
  const usage = await getAgentUsage(request.agentId);
  if (usage.today + request.amount > DAILY_LIMIT) {
    return false;
  }

  return true;
}
```

---

## Summary

| Pattern | Trust Level | DeFi Support | Risk Control |
|---------|-------------|--------------|--------------|
| A: Agent as Signer | Full trust | Yes | None |
| B: Separate Vault | Limited trust | Yes | Capped by SpendingLimit |
| C: Wrapper Program | Minimal trust | Yes | Full control |

**For most agent use cases, Pattern B is recommended.** It provides DeFi access while capping risk to the SpendingLimit amount.
