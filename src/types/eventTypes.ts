/**
 * Event types for Squads Smart Account Program.
 * These are used for parsing program logs.
 */

import {
  combineCodec,
  getStructDecoder,
  getStructEncoder,
  getU8Decoder,
  getU8Encoder,
  getU64Decoder,
  getU64Encoder,
  getAddressDecoder,
  getAddressEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
} from "@solana/kit";

// CreateSmartAccountEvent
export type CreateSmartAccountEvent = {
  smartAccount: Address;
  seed: bigint;
};

export type CreateSmartAccountEventArgs = CreateSmartAccountEvent;

export function getCreateSmartAccountEventEncoder(): Encoder<CreateSmartAccountEventArgs> {
  return getStructEncoder([
    ["smartAccount", getAddressEncoder()],
    ["seed", getU64Encoder()],
  ]);
}

export function getCreateSmartAccountEventDecoder(): Decoder<CreateSmartAccountEvent> {
  return getStructDecoder([
    ["smartAccount", getAddressDecoder()],
    ["seed", getU64Decoder()],
  ]);
}

export function getCreateSmartAccountEventCodec(): Codec<
  CreateSmartAccountEventArgs,
  CreateSmartAccountEvent
> {
  return combineCodec(
    getCreateSmartAccountEventEncoder(),
    getCreateSmartAccountEventDecoder(),
  );
}

// SynchronousTransactionEvent
export type SynchronousTransactionEvent = {
  smartAccount: Address;
  accountIndex: number;
};

export type SynchronousTransactionEventArgs = SynchronousTransactionEvent;

export function getSynchronousTransactionEventEncoder(): Encoder<SynchronousTransactionEventArgs> {
  return getStructEncoder([
    ["smartAccount", getAddressEncoder()],
    ["accountIndex", getU8Encoder()],
  ]);
}

export function getSynchronousTransactionEventDecoder(): Decoder<SynchronousTransactionEvent> {
  return getStructDecoder([
    ["smartAccount", getAddressDecoder()],
    ["accountIndex", getU8Decoder()],
  ]);
}

export function getSynchronousTransactionEventCodec(): Codec<
  SynchronousTransactionEventArgs,
  SynchronousTransactionEvent
> {
  return combineCodec(
    getSynchronousTransactionEventEncoder(),
    getSynchronousTransactionEventDecoder(),
  );
}

// SynchronousSettingsTransactionEvent
export type SynchronousSettingsTransactionEvent = {
  smartAccount: Address;
};

export type SynchronousSettingsTransactionEventArgs =
  SynchronousSettingsTransactionEvent;

export function getSynchronousSettingsTransactionEventEncoder(): Encoder<SynchronousSettingsTransactionEventArgs> {
  return getStructEncoder([["smartAccount", getAddressEncoder()]]);
}

export function getSynchronousSettingsTransactionEventDecoder(): Decoder<SynchronousSettingsTransactionEvent> {
  return getStructDecoder([["smartAccount", getAddressDecoder()]]);
}

export function getSynchronousSettingsTransactionEventCodec(): Codec<
  SynchronousSettingsTransactionEventArgs,
  SynchronousSettingsTransactionEvent
> {
  return combineCodec(
    getSynchronousSettingsTransactionEventEncoder(),
    getSynchronousSettingsTransactionEventDecoder(),
  );
}

// AddSpendingLimitEvent
export type AddSpendingLimitEvent = {
  smartAccount: Address;
  spendingLimit: Address;
};

export type AddSpendingLimitEventArgs = AddSpendingLimitEvent;

export function getAddSpendingLimitEventEncoder(): Encoder<AddSpendingLimitEventArgs> {
  return getStructEncoder([
    ["smartAccount", getAddressEncoder()],
    ["spendingLimit", getAddressEncoder()],
  ]);
}

export function getAddSpendingLimitEventDecoder(): Decoder<AddSpendingLimitEvent> {
  return getStructDecoder([
    ["smartAccount", getAddressDecoder()],
    ["spendingLimit", getAddressDecoder()],
  ]);
}

export function getAddSpendingLimitEventCodec(): Codec<
  AddSpendingLimitEventArgs,
  AddSpendingLimitEvent
> {
  return combineCodec(
    getAddSpendingLimitEventEncoder(),
    getAddSpendingLimitEventDecoder(),
  );
}

// RemoveSpendingLimitEvent
export type RemoveSpendingLimitEvent = {
  smartAccount: Address;
  spendingLimit: Address;
};

export type RemoveSpendingLimitEventArgs = RemoveSpendingLimitEvent;

export function getRemoveSpendingLimitEventEncoder(): Encoder<RemoveSpendingLimitEventArgs> {
  return getStructEncoder([
    ["smartAccount", getAddressEncoder()],
    ["spendingLimit", getAddressEncoder()],
  ]);
}

export function getRemoveSpendingLimitEventDecoder(): Decoder<RemoveSpendingLimitEvent> {
  return getStructDecoder([
    ["smartAccount", getAddressDecoder()],
    ["spendingLimit", getAddressDecoder()],
  ]);
}

export function getRemoveSpendingLimitEventCodec(): Codec<
  RemoveSpendingLimitEventArgs,
  RemoveSpendingLimitEvent
> {
  return combineCodec(
    getRemoveSpendingLimitEventEncoder(),
    getRemoveSpendingLimitEventDecoder(),
  );
}

// UseSpendingLimitEvent
export type UseSpendingLimitEvent = {
  smartAccount: Address;
  spendingLimit: Address;
  amount: bigint;
};

export type UseSpendingLimitEventArgs = UseSpendingLimitEvent;

export function getUseSpendingLimitEventEncoder(): Encoder<UseSpendingLimitEventArgs> {
  return getStructEncoder([
    ["smartAccount", getAddressEncoder()],
    ["spendingLimit", getAddressEncoder()],
    ["amount", getU64Encoder()],
  ]);
}

export function getUseSpendingLimitEventDecoder(): Decoder<UseSpendingLimitEvent> {
  return getStructDecoder([
    ["smartAccount", getAddressDecoder()],
    ["spendingLimit", getAddressDecoder()],
    ["amount", getU64Decoder()],
  ]);
}

export function getUseSpendingLimitEventCodec(): Codec<
  UseSpendingLimitEventArgs,
  UseSpendingLimitEvent
> {
  return combineCodec(
    getUseSpendingLimitEventEncoder(),
    getUseSpendingLimitEventDecoder(),
  );
}

// AuthoritySettingsEvent
export type AuthoritySettingsEvent = {
  smartAccount: Address;
};

export type AuthoritySettingsEventArgs = AuthoritySettingsEvent;

export function getAuthoritySettingsEventEncoder(): Encoder<AuthoritySettingsEventArgs> {
  return getStructEncoder([["smartAccount", getAddressEncoder()]]);
}

export function getAuthoritySettingsEventDecoder(): Decoder<AuthoritySettingsEvent> {
  return getStructDecoder([["smartAccount", getAddressDecoder()]]);
}

export function getAuthoritySettingsEventCodec(): Codec<
  AuthoritySettingsEventArgs,
  AuthoritySettingsEvent
> {
  return combineCodec(
    getAuthoritySettingsEventEncoder(),
    getAuthoritySettingsEventDecoder(),
  );
}

// AuthorityChangeEvent
export type AuthorityChangeEvent = {
  smartAccount: Address;
  oldAuthority: Address;
  newAuthority: Address;
};

export type AuthorityChangeEventArgs = AuthorityChangeEvent;

export function getAuthorityChangeEventEncoder(): Encoder<AuthorityChangeEventArgs> {
  return getStructEncoder([
    ["smartAccount", getAddressEncoder()],
    ["oldAuthority", getAddressEncoder()],
    ["newAuthority", getAddressEncoder()],
  ]);
}

export function getAuthorityChangeEventDecoder(): Decoder<AuthorityChangeEvent> {
  return getStructDecoder([
    ["smartAccount", getAddressDecoder()],
    ["oldAuthority", getAddressDecoder()],
    ["newAuthority", getAddressDecoder()],
  ]);
}

export function getAuthorityChangeEventCodec(): Codec<
  AuthorityChangeEventArgs,
  AuthorityChangeEvent
> {
  return combineCodec(
    getAuthorityChangeEventEncoder(),
    getAuthorityChangeEventDecoder(),
  );
}
