// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SolanaDataConverterLib } from "./SolanaDataConverterLib.sol";

/// @title LibSystemProgram
/// @notice Helper library for interactions with Solana's System program
/// @author maxpolizzo@gmail.com
library LibSystemProgram {
    bytes32 public constant SYSTEM_PROGRAM_ID = bytes32(0);

    /// @notice Helper function to format a `createAccountWithSeed` instruction
    /// @param payer The payer account which will fund the newly created account
    /// @param basePubKey The base public key used to derive the newly created account
    /// @param programId The `id` of the Solana program which will be granted permission to write data to the newly
    /// created account
    /// @param seed The bytes seed used to derive the newly created account
    /// @param accountSize The on-chain storage space for the newly created account
    /// @param rentExemptBalance The provided rent exemption balance for the newly created account
    function formatCreateAccountWithSeedInstruction(
        bytes32 payer,
        bytes32 basePubKey,
        bytes32 programId,
        bytes memory seed,
        uint64 accountSize,
        uint64 rentExemptBalance
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](3);
        accounts[0] = payer;
        accounts[1] = getCreateWithSeedAccount(basePubKey, programId, seed); // Account to be created
        accounts[2] = basePubKey;

        isSigner = new bool[](3);
        isSigner[0] = true;
        isSigner[1] = false;
        isSigner[2] = true;

        isWritable = new bool[](3);
        isWritable[0] = true;
        isWritable[1] = true;
        isWritable[2] = false;

        // Get values in right-padded little-endian bytes format
        bytes32 seedLenLE = bytes32(SolanaDataConverterLib.readLittleEndianUnsigned256(seed.length));
        bytes32 rentExemptBalanceLE = bytes32(SolanaDataConverterLib.readLittleEndianUnsigned256(uint256(rentExemptBalance)));
        bytes32 accountSizeLE = bytes32(SolanaDataConverterLib.readLittleEndianUnsigned256(uint256(accountSize)));
        data = abi.encodePacked(
            bytes4(0x03000000), // Instruction variant
            basePubKey, // Base public key used for account  creation
            bytes8(seedLenLE), // Seed bytes length (right-padded little-endian)
            seed, // Seed bytes
            bytes8(rentExemptBalanceLE), // Rent exemption balance for created account (right-padded little endian)
            bytes8(accountSizeLE), // Storage space for created account (right-padded little endian)
            programId // program id
        );
    }

    /// @notice Helper function to derive the address of the Solana account which would be created by executing a
    /// `createAccountWithSeed` instruction formatted with the same parameters
    /// @param basePubKey The base public key used to derive the newly created account
    /// @param programId The id of the Solana program which would be granted permission to write data to the newly
    /// created account
    /// @param seed The bytes seed used to derive the newly created account
    function getCreateWithSeedAccount(
        bytes32 basePubKey,
        bytes32 programId,
        bytes memory seed
    ) internal pure returns(bytes32) {
        return sha256(abi.encodePacked(basePubKey, seed, programId));
    }
}
