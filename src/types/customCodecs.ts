/**
 * Custom codec types for Squads Smart Account Program.
 * These implement SmallVec<T> serialization patterns used by the program.
 */

import {
  combineCodec,
  createDecoder,
  createEncoder,
  getAddressDecoder,
  getAddressEncoder,
  type Address,
  type Codec,
  type Decoder,
  type Encoder,
  type ReadonlyUint8Array,
} from "@solana/kit";
import {
  getCompiledInstructionDecoder,
  getCompiledInstructionEncoder,
  getMessageAddressTableLookupDecoder,
  getMessageAddressTableLookupEncoder,
  type CompiledInstruction,
  type CompiledInstructionArgs,
  type MessageAddressTableLookup,
  type MessageAddressTableLookupArgs,
} from "../generated";

// SmallVec<u8, u8> - compact byte array with u8 length prefix
export type SmallVecU8U8 = Uint8Array;
export type SmallVecU8U8Args = Uint8Array;

export function getSmallVecU8U8Encoder(): Encoder<SmallVecU8U8Args> {
  return createEncoder({
    getSizeFromValue: (value: Uint8Array) => 1 + value.length,
    write: (value: Uint8Array, bytes: Uint8Array, offset: number) => {
      bytes[offset] = value.length;
      bytes.set(value, offset + 1);
      return offset + 1 + value.length;
    },
  });
}

export function getSmallVecU8U8Decoder(): Decoder<SmallVecU8U8> {
  return createDecoder({
    read: (bytes: ReadonlyUint8Array, offset: number) => {
      const length = bytes[offset];
      const data = new Uint8Array(bytes.slice(offset + 1, offset + 1 + length));
      return [data, offset + 1 + length];
    },
  });
}

export function getSmallVecU8U8Codec(): Codec<SmallVecU8U8Args, SmallVecU8U8> {
  return combineCodec(getSmallVecU8U8Encoder(), getSmallVecU8U8Decoder());
}

// SmallVec<u16, u8> - compact byte array with u16 length prefix
export type SmallVecU16U8 = Uint8Array;
export type SmallVecU16U8Args = Uint8Array;

export function getSmallVecU16U8Encoder(): Encoder<SmallVecU16U8Args> {
  return createEncoder({
    getSizeFromValue: (value: Uint8Array) => 2 + value.length,
    write: (value: Uint8Array, bytes: Uint8Array, offset: number) => {
      // Little-endian u16
      bytes[offset] = value.length & 0xff;
      bytes[offset + 1] = (value.length >> 8) & 0xff;
      bytes.set(value, offset + 2);
      return offset + 2 + value.length;
    },
  });
}

export function getSmallVecU16U8Decoder(): Decoder<SmallVecU16U8> {
  return createDecoder({
    read: (bytes: ReadonlyUint8Array, offset: number) => {
      const length = bytes[offset] | (bytes[offset + 1] << 8);
      const data = new Uint8Array(bytes.slice(offset + 2, offset + 2 + length));
      return [data, offset + 2 + length];
    },
  });
}

export function getSmallVecU16U8Codec(): Codec<
  SmallVecU16U8Args,
  SmallVecU16U8
> {
  return combineCodec(getSmallVecU16U8Encoder(), getSmallVecU16U8Decoder());
}

// SmallVec<u8, Pubkey> - compact pubkey array with u8 length prefix
export type SmallVecU8Pubkey = Address[];
export type SmallVecU8PubkeyArgs = Address[];

export function getSmallVecU8PubkeyEncoder(): Encoder<SmallVecU8PubkeyArgs> {
  const addressEncoder = getAddressEncoder();
  return createEncoder({
    getSizeFromValue: (value: Address[]) => 1 + value.length * 32,
    write: (value: Address[], bytes: Uint8Array, offset: number) => {
      bytes[offset] = value.length;
      let currentOffset = offset + 1;
      for (const addr of value) {
        currentOffset = addressEncoder.write(addr, bytes, currentOffset);
      }
      return currentOffset;
    },
  });
}

export function getSmallVecU8PubkeyDecoder(): Decoder<SmallVecU8Pubkey> {
  const addressDecoder = getAddressDecoder();
  return createDecoder({
    read: (bytes: ReadonlyUint8Array, offset: number) => {
      const length = bytes[offset];
      let currentOffset = offset + 1;
      const result: Address[] = [];
      for (let i = 0; i < length; i++) {
        const [addr, newOffset] = addressDecoder.read(bytes, currentOffset);
        result.push(addr);
        currentOffset = newOffset;
      }
      return [result, currentOffset];
    },
  });
}

export function getSmallVecU8PubkeyCodec(): Codec<
  SmallVecU8PubkeyArgs,
  SmallVecU8Pubkey
> {
  return combineCodec(
    getSmallVecU8PubkeyEncoder(),
    getSmallVecU8PubkeyDecoder(),
  );
}

// SmallVec<u8, CompiledInstruction>
export type SmallVecU8CompiledInstruction = CompiledInstruction[];
export type SmallVecU8CompiledInstructionArgs = CompiledInstructionArgs[];

export function getSmallVecU8CompiledInstructionEncoder(): Encoder<SmallVecU8CompiledInstructionArgs> {
  const itemEncoder = getCompiledInstructionEncoder();
  return createEncoder({
    getSizeFromValue: (value: CompiledInstructionArgs[]) => {
      let size = 1; // length prefix
      for (const item of value) {
        // Variable size items - need to calculate
        size += 1; // programIdIndex
        size += 1 + (item.accountIndexes as Uint8Array).length; // SmallVecU8U8
        size += 2 + (item.data as Uint8Array).length; // SmallVecU16U8
      }
      return size;
    },
    write: (
      value: CompiledInstructionArgs[],
      bytes: Uint8Array,
      offset: number,
    ) => {
      bytes[offset] = value.length;
      let currentOffset = offset + 1;
      for (const item of value) {
        currentOffset = itemEncoder.write(item, bytes, currentOffset);
      }
      return currentOffset;
    },
  });
}

export function getSmallVecU8CompiledInstructionDecoder(): Decoder<SmallVecU8CompiledInstruction> {
  const itemDecoder = getCompiledInstructionDecoder();
  return createDecoder({
    read: (bytes: ReadonlyUint8Array, offset: number) => {
      const length = bytes[offset];
      let currentOffset = offset + 1;
      const result: CompiledInstruction[] = [];
      for (let i = 0; i < length; i++) {
        const [item, newOffset] = itemDecoder.read(bytes, currentOffset);
        result.push(item);
        currentOffset = newOffset;
      }
      return [result, currentOffset];
    },
  });
}

export function getSmallVecU8CompiledInstructionCodec(): Codec<
  SmallVecU8CompiledInstructionArgs,
  SmallVecU8CompiledInstruction
> {
  return combineCodec(
    getSmallVecU8CompiledInstructionEncoder(),
    getSmallVecU8CompiledInstructionDecoder(),
  );
}

// SmallVec<u8, MessageAddressTableLookup>
export type SmallVecU8MessageAddressTableLookup = MessageAddressTableLookup[];
export type SmallVecU8MessageAddressTableLookupArgs =
  MessageAddressTableLookupArgs[];

export function getSmallVecU8MessageAddressTableLookupEncoder(): Encoder<SmallVecU8MessageAddressTableLookupArgs> {
  const itemEncoder = getMessageAddressTableLookupEncoder();
  return createEncoder({
    getSizeFromValue: (value: MessageAddressTableLookupArgs[]) => {
      let size = 1;
      for (const item of value) {
        size += 32; // accountKey
        size += 1 + (item.writableIndexes as Uint8Array).length;
        size += 1 + (item.readonlyIndexes as Uint8Array).length;
      }
      return size;
    },
    write: (
      value: MessageAddressTableLookupArgs[],
      bytes: Uint8Array,
      offset: number,
    ) => {
      bytes[offset] = value.length;
      let currentOffset = offset + 1;
      for (const item of value) {
        currentOffset = itemEncoder.write(item, bytes, currentOffset);
      }
      return currentOffset;
    },
  });
}

export function getSmallVecU8MessageAddressTableLookupDecoder(): Decoder<SmallVecU8MessageAddressTableLookup> {
  const itemDecoder = getMessageAddressTableLookupDecoder();
  return createDecoder({
    read: (bytes: ReadonlyUint8Array, offset: number) => {
      const length = bytes[offset];
      let currentOffset = offset + 1;
      const result: MessageAddressTableLookup[] = [];
      for (let i = 0; i < length; i++) {
        const [item, newOffset] = itemDecoder.read(bytes, currentOffset);
        result.push(item);
        currentOffset = newOffset;
      }
      return [result, currentOffset];
    },
  });
}

export function getSmallVecU8MessageAddressTableLookupCodec(): Codec<
  SmallVecU8MessageAddressTableLookupArgs,
  SmallVecU8MessageAddressTableLookup
> {
  return combineCodec(
    getSmallVecU8MessageAddressTableLookupEncoder(),
    getSmallVecU8MessageAddressTableLookupDecoder(),
  );
}
