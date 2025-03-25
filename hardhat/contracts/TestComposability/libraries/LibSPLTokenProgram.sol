// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { SolanaDataConverterLib } from "./SolanaDataConverterLib.sol";

import { ICallSolana } from '../interfaces/ICallSolana.sol';

/// @title LibSPLTokenProgram
/// @notice Helper library for interactions with Solana's SPL Token program
/// @author maxpolizzo@gmail.com
library LibSPLTokenProgram {
    bytes32 public constant TOKEN_PROGRAM_ID = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM_ID = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 public constant SYSVAR_RENT_PUBKEY = 0x06a7d517192c5c51218cc94c3d4af17f58daee089ba1fd44e3dbd98a00000000;
    uint64 public constant MINT_SIZE = 82;
    uint64 public constant MINT_RENT_EXEMPT_BALANCE = 1461600;
    uint64 public constant ATA_SIZE = 165;
    uint64 public constant ATA_RENT_EXEMPT_BALANCE = 2039280;
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    /// @notice Helper function to format a `initializeMint2` instruction
    /// @param decimals The decimals value for the new token mint to be initialized
    /// @param mintAuthority The account to be granted authority to mint tokens
    /// @param freezeAuthority The account to be granted authority to freeze the token mint
    function formatInitializeMint2Instruction(
        uint8 decimals,
        bytes32 tokenMint,
        bytes32 mintAuthority,
        bytes32 freezeAuthority
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](1);
        accounts[0] = tokenMint;

        isSigner = new bool[](1);
        isSigner[0] = false;

        isWritable = new bool[](1);
        isWritable[0] = true;

        data = abi.encodePacked(
            bytes1(0x14), // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L558)
            bytes1(decimals), // Token's decimals value
            mintAuthority, // Token's mint authority account
            bytes1(0x01), // Flag set to 1, indicating that freezeAuthority account is provided next and should be unpacked (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L561)
            freezeAuthority // Token's freeze authority account
        );
    }

    /// @notice Helper function to format a `initializeAccount2` instruction
    /// @param ata The associated token account to be initialized
    /// @param tokenMint The token mint account to which the new token account will be associated
    /// @param owner The account owning the new associated token account
    function formatInitializeAccount2Instruction(
        bytes32 ata,
        bytes32 tokenMint,
        bytes32 owner
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](3);
        accounts[0] = ata;
        accounts[1] = tokenMint;
        accounts[2] = SYSVAR_RENT_PUBKEY;

        isSigner = new bool[](3);
        isSigner[0] = false;
        isSigner[1] = false;
        isSigner[2] = false;

        isWritable = new bool[](3);
        isWritable[0] = true;
        isWritable[1] = false;
        isWritable[2] = false;

        data = abi.encodePacked(
            bytes1(0x10), // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L545)
            owner
        );
    }

    /// @notice Helper function to format a `mintTo` instruction
    /// @param tokenMint The mint account of the token to be minted
    /// @param mintAuthority The account which has been granted authority to mint considered token
    /// @param recipientATA The associated token account to which token will be minted
    /// @param amount The amount of token to be minted
    function formatMintToInstruction(
        bytes32 tokenMint,
        bytes32 mintAuthority,
        bytes32 recipientATA,
        uint64 amount
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](3);
        accounts[0] = tokenMint;
        accounts[1] = recipientATA;
        accounts[2] = mintAuthority;

        isSigner = new bool[](3);
        isSigner[0] = false;
        isSigner[1] = false;
        isSigner[2] = true;

        isWritable = new bool[](3);
        isWritable[0] = true;
        isWritable[1] = true;
        isWritable[2] = false;

        // Get amount in right-padded little-endian format
        bytes32 amountLE = bytes32(SolanaDataConverterLib.readLittleEndianUnsigned256(uint256(amount)));
        data = abi.encodePacked(
            bytes1(0x07), // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L508)
            bytes8(amountLE) // Amount (right-padded little-endian)
        );
    }

    /// @notice Helper function to format a `transfer` instruction
    /// @param senderATA The sender's associated token account to be debited
    /// @param recipientATA The recipient's associated token account to be credited
    /// @param sender The sender's account which owns the sender's associated token account to be debited
    /// @param amount The amount of token to be transferred
    function formatTransferInstruction(
        bytes32 senderATA,
        bytes32 recipientATA,
        bytes32 sender,
        uint64 amount
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](3);
        accounts[0] = senderATA;
        accounts[1] = recipientATA;
        accounts[2] = sender;

        isSigner = new bool[](3);
        isSigner[0] = false;
        isSigner[1] = false;
        isSigner[2] = true;

        isWritable = new bool[](3);
        isWritable[0] = true;
        isWritable[1] = true;
        isWritable[2] = false;

        // Get amount in right-padded little-endian format
        bytes32 amountLE = bytes32(SolanaDataConverterLib.readLittleEndianUnsigned256(uint256(amount)));
        data = abi.encodePacked(
            bytes1(0x03), // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L506)
            bytes8(amountLE) // Amount (right-padded little-endian)
        );
    }

    /// @notice Helper function to format a `createSetAuthority` instruction in order to update a SPL token's mint
    /// authority
    /// @param tokenMint The token mint account to be updated
    /// @param currentAuthority The current token mint authority to be revoked
    /// @param newAuthority The new mint authority to be set
    function formatUpdateMintAuthorityInstruction(
        bytes32 tokenMint,
        bytes32 currentAuthority,
        bytes32 newAuthority
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](2);
        accounts[0] = tokenMint;
        accounts[1] = currentAuthority;

        isSigner = new bool[](2);
        isSigner[0] = false;
        isSigner[1] = true;

        isWritable = new bool[](2);
        isWritable[0] = true;
        isWritable[1] = false;

        data = abi.encodePacked(
            bytes1(0x06), // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L514)
            bytes1(0x00), // MintTokens authority type (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L744)
            bytes1(0x01), // Flag (how is it used?)
            newAuthority
        );
    }

    /// @notice Helper function to format a `revoke` instruction in order to revoke all delegation granted by an
    // associated token account
    /// @param ata The associated token account for which we want to revoke all delegation
    /// @param owner The account owning the associated token account for which we want to revoke all delegation
    function formatRevokeInstruction(
        bytes32 ata,
        bytes32 owner
    ) internal pure returns (
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory data
    ) {
        accounts = new bytes32[](2);
        accounts[0] = ata;
        accounts[1] = owner;

        isSigner = new bool[](2);
        isSigner[0] = false;
        isSigner[1] = true;

        isWritable = new bool[](2);
        isWritable[0] = true;
        isWritable[1] = false;

        data = abi.encodePacked(
            bytes1(0x05) // Instruction variant (see: https://github.com/solana-program/token/blob/08aa3ccecb30692bca18d6f927804337de82d5ff/program/src/instruction.rs#L513)
        );
    }

    function getAssociatedTokenAccount(
        bytes32 _tokenMint,
        bytes32 userPubKey
    ) internal view returns(bytes32) {
        // Returns ATA derived with  nonce == 0 by default
        return _getAssociatedTokenAccount(_tokenMint, userPubKey, 0);
    }

    function getAssociatedTokenAccount(
        bytes32 _tokenMint,
        bytes32 userPubKey,
        uint8 nonce
    ) internal view returns(bytes32) {
        return _getAssociatedTokenAccount(_tokenMint, userPubKey, nonce);
    }

    function _getAssociatedTokenAccount(
        bytes32 _tokenMint,
        bytes32 userPubKey,
        uint8 nonce
    ) private view returns(bytes32) {
        return CALL_SOLANA.getResourceAddress(sha256(abi.encodePacked(
            userPubKey,
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            _tokenMint,
            nonce,
            LibSPLTokenProgram.ASSOCIATED_TOKEN_PROGRAM_ID
        )));
    }
}
