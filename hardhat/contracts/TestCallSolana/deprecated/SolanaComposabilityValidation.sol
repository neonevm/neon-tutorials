// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


/// @title SolanaComposabilityValidation
/// @author https://twitter.com/mnedelchev_
/// @notice This contract serves as a validation library for Neon EVM's composability feature. The composability feature aims to provide an EVM interface for accessing Solana.
/// @dev To use the Neon EVM's composability feature you need a basic knowledge of how Solana programs and instructions work.
contract SolanaComposabilityValidation is Ownable {
    struct ProgramData {
        mapping(bytes => bool) prefixesData;
        bytes[] prefixes;
    }
    // prefix -> instruction_id

    mapping(bytes32 programId => ProgramData) private whitelist;

    constructor(
        address initialOwner,
        bytes32[] memory _programIds,
        bytes[][] memory _instructions
    ) Ownable(initialOwner) {
        _setProgramData(_programIds, _instructions);
    }

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
    modifier validateComposabilityRequest(
        bytes32 programId, 
        bytes calldata instruction,
        bytes calldata accountsData,
        bytes32[] memory accounts,
        uint[] memory accountIndex
    ) {
        // validate instruction of a programId
        bool validatedInstruction = false;
        uint len = whitelist[programId].prefixes.length;
        for (uint i = 0; i < len; ++i) {
            if (keccak256(abi.encodePacked(instruction[8:8+whitelist[programId].prefixes[i].length])) == keccak256(abi.encodePacked(whitelist[programId].prefixes[i]))) {
                validatedInstruction = true;
                break;
            }
        }
        require(
            validatedInstruction,
            InvalidInstruction()
        );

        // validate accounts of given instruction of a programId
        len = accounts.length;
        if (len > 0) {
            require(
                len == accountIndex.length,
                InvalidSolanaAccountParameters()
            );
            for (uint i = 0; i < len; ++i) {
                uint offset = 8 + (accountIndex[i] * 34); // 34 bytes = 32 bytes for the Solana address + 1 byte for is_signer + 1 byte for is_writable
                require(
                    accounts[i] == bytes32(accountsData[offset:offset + 32]), // 32 bytes is the size of a Solana address
                    InvalidSolanaAccount()
                );
            }
        }

        _;
    }

    /**
     * @notice Method to be managed only by the smart contract's owner. Used to update the whitelist of programIds and the corresponding instructions.
     */
    function updateProgramData(
        bytes32[] memory _programIds,
        bytes[][] memory _instructions
    ) external onlyOwner {
        _setProgramData(_programIds, _instructions);
    }

    /**
     * @dev This is an internal toggle method, used to whitelist programIds and the corresponding instructions. 
     * @dev If an instruction prefix has been added for 2nd time then the method sets prefixesData => false for this instruction thus modifier validateComposabilityRequest will reject it on next request.
     */
    function _setProgramData(
        bytes32[] memory _programIds,
        bytes[][] memory _instructions
    ) internal {
        uint len = _programIds.length;
        for (uint i = 0; i < len; ++i) {
            uint leny = _instructions[i].length;
            uint lenz = whitelist[_programIds[i]].prefixes.length;
            for (uint y = 0; y < leny; ++y) {
                if (whitelist[_programIds[i]].prefixesData[_instructions[i][y]]) {
                    whitelist[_programIds[i]].prefixesData[_instructions[i][y]] = false;
                } else {
                    whitelist[_programIds[i]].prefixesData[_instructions[i][y]] = true;
                    bool exists;

                    for (uint z = 0; z < lenz; ++z) {
                        if (keccak256(abi.encodePacked(whitelist[_programIds[i]].prefixes[z])) == keccak256(abi.encodePacked(_instructions[i][y]))) {
                            exists = true;
                            break;
                        }
                    }

                    if (!exists) {
                        whitelist[_programIds[i]].prefixes.push(_instructions[i][y]);
                    }
                }
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
    function prepareArbitraryTokenAccountSeeds(address token, address owner) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"03",
            hex"436f6e747261637444617461", // ContractData
            token,
            _salt(owner)
        );
    }
}