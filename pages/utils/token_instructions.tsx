// token_instructions.ts
import { Connection, PublicKey, TransactionInstruction , SYSVAR_RENT_PUBKEY} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Constants
export const MINT_SIZE = 82; // Mint account size
export const ACCOUNT_SIZE = 165; // Token account size

// Function to get minimum balance for rent exempt mint
export async function getMinimumBalanceForRentExemptMint(connection: Connection): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(MINT_SIZE);
}

// Function to get minimum balance for rent exempt account
export async function getMinimumBalanceForRentExemptAccount(connection: Connection): Promise<number> {
    return await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
}

// Create Initialize Mint Instruction
export function createInitializeMintInstruction(
    mint: PublicKey,
    decimals: number,
    mintAuthority: PublicKey,
    freezeAuthority: PublicKey | null,
    programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
    const keys = [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(82);
    data.writeUInt8(0, 0); // Initialize Mint instruction
    data.writeUInt8(decimals, 1);

    mintAuthority.toBuffer().copy(data, 2);
    if (freezeAuthority) {
        data.writeUInt8(1, 34);
        freezeAuthority.toBuffer().copy(data, 35);
    } else {
        data.writeUInt8(0, 34);
    }
    return new TransactionInstruction({ keys, programId, data });
}

// Create Initialize Account Instruction
export function createInitializeAccountInstruction(
    account: PublicKey,
    mint: PublicKey,
    owner: PublicKey,
    programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(165);
    data.writeUInt8(1, 0); // Initialize Account instruction
    return new TransactionInstruction({ keys, programId, data });
}

// Create Mint To Instruction
export function createMintToInstruction(
    mint: PublicKey,
    destination: PublicKey,
    authority: PublicKey,
    amount: number,
    programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
    const keys = [
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: authority, isSigner: true, isWritable: false },
    ];
    const data = Buffer.alloc(10);
    data.writeUInt8(7, 0); // Mint To instruction
    data.writeBigUInt64LE(BigInt(amount), 1);
    return new TransactionInstruction({ keys, programId, data });
}

// Create Transfer Instruction
export function createTransferInstruction(
    source: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: number,
    programId = TOKEN_PROGRAM_ID
): TransactionInstruction {
    const keys = [
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
    ];
    const data = Buffer.alloc(10);
    data.writeUInt8(3, 0); // Transfer instruction
    data.writeBigUInt64LE(BigInt(amount), 1);
    return new TransactionInstruction({ keys, programId, data });
}

// Function to get token account balance
export async function getTokenAccountBalance(connection: Connection, tokenAccount: PublicKey): Promise<number> {
    const accountInfo = await connection.getParsedAccountInfo(tokenAccount);
    const data = accountInfo.value?.data as any;
    return data.parsed?.info?.tokenAmount?.uiAmount ?? 0;
}