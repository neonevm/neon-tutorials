// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SolanaComposabilityValidation
/// @author https://twitter.com/mnedelchev_
/// @notice This contract serves as a validation library for Neon EVM's composability feature. The composability feature aims to provide an EVM interface for accessing Solana.
/// @dev To use the Neon EVM's composability feature you need a basic knowledge of how Solana programs and instructions work.
library SolanaComposabilityValidation {
    error InvalidSolanaProgram();

    /**
     * @notice The instruction for this programId has not been whitelisted.
     */
    error InvalidInstruction();

    /**
     * @notice The Solana account is invalid.
     */
    error InvalidSolanaAccount();

    /**
     * @notice The provided Solana account parameters are invalid.
     */
    error InvalidSolanaAccountParameters();

    /**
     * @notice Modifier to validate if requested instruction has been whitelisted. 
     * @dev If the variable accounts has been provided with some data inside of it then the modifier will also validate the accounts list for the instruction. This validation means checking the accounts positions.
     */
    function validateComposabilityRequest(
        bytes32 programIdParam,
        bytes32 programId,
        bytes memory instructionIdParam,
        bytes calldata instruction,
        bytes calldata accountsData,
        bytes32[] memory accounts,
        uint[] memory accountsIndex
    ) internal pure {
        // validate programId
        require(
            programId == programIdParam,
            InvalidSolanaProgram()
        );

        // validate instructionId
        require(
            keccak256(abi.encodePacked(instruction[8:8+instructionIdParam.length])) == keccak256(abi.encodePacked(instructionIdParam)),
            InvalidInstruction()
        );

        // validate the accounts of a given instruction
        uint len = accounts.length;
        if (len > 0) {
            require(
                len == accountsIndex.length,
                InvalidSolanaAccountParameters()
            );
            for (uint i = 0; i < len; ++i) {
                uint offset = 8 + (accountsIndex[i] * 34); // 34 bytes = 32 bytes for the Solana address + 1 byte for is_signer + 1 byte for is_writable
                require(
                    accounts[i] == bytes32(accountsData[offset:offset + 32]), // 32 bytes is the size of a Solana address
                    InvalidSolanaAccount()
                );
            }
        }
    }

    /**
     * @notice Converts address type into bytes32.
     */
    function _salt(address account) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }

    /**
     * @notice Calculates the Solana arbitrary token account for given EVM wallet.
     */
    function getArbitraryTokenAccountSeeds(address token, address owner) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"03",
            hex"436f6e747261637444617461", // ContractData
            token,
            _salt(owner)
        );
    }

    /**
     * @notice Calculates a Solana ATA account.
     */
    function getAssociateTokenAccountSeeds(bytes32 owner, bytes32 programId, bytes32 mint) internal pure returns (bytes memory) {
        return abi.encodePacked(
            owner,
            programId,
            mint
        );
    }
}