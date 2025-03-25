// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title CallSolanaValidationLib
/// @notice This contract serves as a helper library when interacting with precompile CallSolana ( 0xFF00000000000000000000000000000000000006 )
/// @author https://twitter.com/mnedelchev_
library CallSolanaHelperLib {
    /// @notice This method prepares Solana's instruction data into bincode serialized format
    /// @param programId The programId of the instruction
    /// @param accounts List of instruction accounts in bytes32 format
    /// @param isSigner List of bool format containing info if the particular account is signer
    /// @param isWritable List of bool format containing info if the particular account is writable
    /// @param instructionData The instruction data
    function prepareSolanaInstruction(
        bytes32 programId,
        bytes32[] memory accounts,
        bool[] memory isSigner,
        bool[] memory isWritable,
        bytes memory instructionData
    ) internal pure returns (bytes memory) {
        bytes memory programIdAndAccounts;
        assembly {
        // get the free memory pointer
            programIdAndAccounts := mload(0x40)

        // define the accounts length
            let accountsLen := mload(accounts)

        // define the instructionData length
            let instructionDataLen := mload(instructionData)

        // define the total output bytes length
        // first 32 bytes are the Solana programId
        // next 8 bytes are defining the length of the accounts list
        // next x bytes are the account list
        // next 8 bytes are defining the length of the Solana instruction data
        // next x bytes are the instruction data
            let dataLength := add(32, add(8, add(mul(accountsLen, 34), add(8, instructionDataLen))))

        // set the new free memory pointer to accommodate the new bytes variable
            mstore(0x40, add(programIdAndAccounts, add(dataLength, 0x20)))

        // store dataLength ( the total output bytes length )
            mstore(programIdAndAccounts, dataLength)

        // define the pointer for first data to be stored
            let dataPtr := add(programIdAndAccounts, 0x20)

        // store programId
            mstore(dataPtr, programId)
            dataPtr := add(dataPtr, 32)

        // store accountsLen
            mstore8(dataPtr, accountsLen)
            dataPtr := add(dataPtr, 8)

        // loop store accounts + isSigner + isWritable
            for { let i := 0 } lt(i, accountsLen) { i := add(i, 1) } {
                let index := add(32, mul(i, 32))
                mstore(dataPtr, mload(add(accounts, index)))
                mstore8(add(dataPtr, 32), mload(add(isSigner, index)))
                mstore8(add(dataPtr, 33), mload(add(isWritable, index)))
                dataPtr := add(dataPtr, 34)
            }

        // store instructionDataLen
            mstore8(dataPtr, instructionDataLen)
            dataPtr := add(dataPtr, 8)

        // loop store instructionData
            for { let i := 0 } lt(i, instructionDataLen) { i := add(i, 0x20) } {
                mstore(add(dataPtr, i), mload(add(instructionData, add(0x20, i))))
            }
        }
        return programIdAndAccounts;
    }

    /// @notice Converts address type into bytes32
    /// @param account EVM address of EOA or smart contract
    function addressToBytes32(address account) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }

    /// @notice Returns the Neon EVM's program arbitrary token account seeds for given EVM wallet
    /// @param token EVM address of ERC20ForSPL token
    /// @param owner EVM address of EOA or smart contract
    function getArbitraryTokenAccountSeeds(address token, address owner) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"03",
            hex"436f6e747261637444617461", // ContractData
            token,
            addressToBytes32(owner)
        );
    }

    /// @notice Returns a Solana ATA account seeds.
    /// @param owner SVM address of EOA or smart contract in bytes32 format
    /// @param programId SVM address of a program on Solana
    /// @param mint SVM address of SPLToken
    function getAssociateTokenAccountSeeds(bytes32 owner, bytes32 programId, bytes32 mint) internal pure returns (bytes memory) {
        return abi.encodePacked(
            owner,
            programId,
            mint
        );
    }
}
