// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { TestCallSolana } from '../TestCallSolana/TestCallSolana.sol';

import { LibSystemProgram } from './libraries/LibSystemProgram.sol';
import { LibSPLTokenProgram } from './libraries/LibSPLTokenProgram.sol';
import { CallSolanaHelperLib } from './libraries/CallSolanaHelperLib.sol';

contract TestComposability is TestCallSolana {
    bytes32 public tokenMint;
    bytes32 public ata;

    function getCreateWithSeedAccount(
        bytes32 basePubKey,
        bytes32 programId,
        bytes memory seed
    ) public pure returns(bytes32) {
        return LibSystemProgram.getCreateWithSeedAccount(basePubKey, programId, seed);
    }

    function getAssociatedTokenAccount(
        bytes32 _tokenMint,
        bytes32 userPubKey,
        uint8 nonce
    ) public view returns(bytes32) {
        return CALL_SOLANA.getResourceAddress(sha256(abi.encodePacked(
            userPubKey,
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            _tokenMint,
            nonce,
            LibSPLTokenProgram.ASSOCIATED_TOKEN_PROGRAM_ID
        )));
    }

    function testCreateAccountWithSeed(
        bytes32 programId,
        bytes memory seed,
        uint64 accountSize,
        uint64 rentExemptBalance
    ) external {
        bytes32 payer = CALL_SOLANA.getPayer();
        bytes32 basePubKey = CALL_SOLANA.getNeonAddress(address(this));

        // Format createAccountWithSeed instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSystemProgram.formatCreateAccountWithSeedInstruction(
            payer,
            basePubKey,
            programId,
            seed,
            accountSize,
            rentExemptBalance
        );
        // Prepare createAccountWithSeed instruction
        bytes memory createAccountWithSeedIx = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSystemProgram.SYSTEM_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );
        // Execute createAccountWithSeed instruction, sending rentExemptBalance lamports
        CALL_SOLANA.execute(rentExemptBalance, createAccountWithSeedIx);
    }

    function testCreateInitializeTokenMint(bytes memory seed, uint8 decimals) external {
        // Create SPL token mint account
        tokenMint = CALL_SOLANA.createResource(
            sha256(abi.encodePacked(
                msg.sender, // msg.sender is included here for future authentication
                seed
            )), // salt
            LibSPLTokenProgram.MINT_SIZE, // space
            LibSPLTokenProgram.MINT_RENT_EXEMPT_BALANCE, // lamports
            LibSPLTokenProgram.TOKEN_PROGRAM_ID // Owner must be SPL Token program
        );

        // This contract is mint/freeze authority
        bytes32 authority = CALL_SOLANA.getNeonAddress(address(this));
        // Format initializeMint2 instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSPLTokenProgram.formatInitializeMint2Instruction(
            decimals,
            tokenMint,
            authority,
            authority
        );

        // Prepare initializeMint2 instruction
        bytes memory initializeMint2Ix = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );

        // Execute initializeMint2 instruction
        CALL_SOLANA.execute(0, initializeMint2Ix);
    }

    function testCreateInitializeATA(bytes32 _tokenMint, bytes32 owner, bytes32 tokenOwner, uint8 nonce) external {
        /// @dev If the ATA is to be used by `msg.sender` to send tokens through this contract the `owner` field should
        /// be left empty.
        /// @dev If the ATA is to be used by a third party `user` NeonEVM account to send tokens through this contract
        /// the `owner` field should be `CALL_SOLANA.getNeonAddress(user)` and the `tokenOwner` field should be left
        /// empty.
        /// @dev If the ATA is to be used by a third party `solanaUser` Solana account to send tokens directly on Solana
        /// without interacting with this contract, both the `owner` field and the `tokenOwner` field should be the
        /// `solanaUser` account.
        if (owner == bytes32(0)) {
            // If owner is empty, account owner is derived from msg.sender
            owner =  CALL_SOLANA.getNeonAddress(msg.sender);
            // If owner is empty, token owner is this contract
            tokenOwner = CALL_SOLANA.getNeonAddress(address(this));
        } else if (tokenOwner == bytes32(0)) {
            // If tokenOwner is empty, token owner is this contract
            tokenOwner = CALL_SOLANA.getNeonAddress(address(this));
        }
        // Create SPL associated token account
        ata = CALL_SOLANA.createResource(
            sha256(abi.encodePacked(
                owner,
                LibSPLTokenProgram.TOKEN_PROGRAM_ID,
                _tokenMint,
                nonce, // nonce can be incremented te create different ATAs
                LibSPLTokenProgram.ASSOCIATED_TOKEN_PROGRAM_ID
            )), // salt
            LibSPLTokenProgram.ATA_SIZE, // space
            LibSPLTokenProgram.ATA_RENT_EXEMPT_BALANCE, // lamports
            LibSPLTokenProgram.TOKEN_PROGRAM_ID // Owner must be SPL Token program
        );
        // Format initializeAccount2 instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSPLTokenProgram.formatInitializeAccount2Instruction(
            ata,
            tokenMint,
            tokenOwner  // account which owns the ATA and can spend from it
        );
        // Prepare initializeAccount2 instruction
        bytes memory initializeAccount2Ix = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );
        // Execute initializeAccount2 instruction
        CALL_SOLANA.execute(0, initializeAccount2Ix);
    }

    function testMintTokens(
        bytes memory seed,
        bytes32 recipientATA,
        uint64 amount
    ) external {
        // This contract is mint/freeze authority
        bytes32 mintAuthority = CALL_SOLANA.getNeonAddress(address(this));
        // Authentication: we derive token mint account from msg.sender and seed
        bytes32 _tokenMint = CALL_SOLANA.getResourceAddress(sha256(abi.encodePacked(
            msg.sender, // msg.sender is included here for authentication
            seed // Seed that has been used to create token mint
        )));
        // Format mintTo instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSPLTokenProgram.formatMintToInstruction(
            _tokenMint,
            mintAuthority,
            recipientATA,
            amount
        );
        // Prepare mintTo instruction
        bytes memory mintToIx = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );
        // Execute mintTo instruction
        CALL_SOLANA.execute(0, mintToIx);
    }

    function testTransferTokens(
        bytes32 _tokenMint,
        uint8 senderATANonce,
        bytes32 recipientATA,
        uint64 amount
    ) external {
        // Sender's Solana account is derived from msg.sender
        bytes32 sender = CALL_SOLANA.getNeonAddress(msg.sender);
        // Authentication: we derive the sender's associated token account from the sender account, the token mint
        // account and the nonce that was used to create the sender's associated token account through this contract
        bytes32 senderATA = CALL_SOLANA.getResourceAddress(sha256(abi.encodePacked(
            sender,
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            _tokenMint,
            senderATANonce,
            LibSPLTokenProgram.ASSOCIATED_TOKEN_PROGRAM_ID
        )));
        // This contract owns the sender's associated token account
        bytes32 thisContract = CALL_SOLANA.getNeonAddress(address(this));
        // Format transfer instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSPLTokenProgram.formatTransferInstruction(
            senderATA,
            recipientATA,
            thisContract, // ATA owner
            amount
        );
        // Prepare transfer instruction
        bytes memory transferIx = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );
        // Execute transfer instruction
        CALL_SOLANA.execute(0, transferIx);
    }

    function testUpdateMintAuthority(
        bytes memory seed,
        bytes32 newAuthority
    ) external {
        // This contract is the current mint authority
        bytes32 currentAuthority = CALL_SOLANA.getNeonAddress(address(this));
        // Authentication: we derive token mint account from msg.sender and seed
        bytes32 _tokenMint = CALL_SOLANA.getResourceAddress(sha256(abi.encodePacked(
            msg.sender, // msg.sender is included here for authentication
            seed // Seed that has been used to create token mint
        )));
        // Format createSetAuthority instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSPLTokenProgram.formatUpdateMintAuthorityInstruction(
            _tokenMint,
            currentAuthority,
            newAuthority
        );
        // Prepare createSetAuthority instruction
        bytes memory createSetAuthorityIx = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );
        // Execute createSetAuthority instruction
        CALL_SOLANA.execute(0, createSetAuthorityIx);
    }

    function testRevokeApproval(
        bytes32 _tokenMint,
        uint8 ataNonce
    ) external {
        // User's Solana account is derived from msg.sender
        bytes32 user = CALL_SOLANA.getNeonAddress(msg.sender);
        // Authentication: we derive the user's associated token account from the user account, the token mint account
        // and the nonce that was used to create the user's ATA through this contract
        bytes32 userATA = CALL_SOLANA.getResourceAddress(sha256(abi.encodePacked(
            user,
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            _tokenMint,
            ataNonce,
            LibSPLTokenProgram.ASSOCIATED_TOKEN_PROGRAM_ID
        )));
        // This contract owns the user's associated token account
        bytes32 thisContract = CALL_SOLANA.getNeonAddress(address(this));
        // Format revoke instruction
        (   bytes32[] memory accounts,
            bool[] memory isSigner,
            bool[] memory isWritable,
            bytes memory data
        ) = LibSPLTokenProgram.formatRevokeInstruction(
            userATA,
            thisContract // ATA owner
        );
        // Prepare revoke instruction
        bytes memory revokeIx = CallSolanaHelperLib.prepareSolanaInstruction(
            LibSPLTokenProgram.TOKEN_PROGRAM_ID,
            accounts,
            isSigner,
            isWritable,
            data
        );
        // Execute createSetAuthority instruction
        CALL_SOLANA.execute(0, revokeIx);
    }
}
