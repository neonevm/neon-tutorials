// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract SolanaComposabilityValidation is Ownable {
    struct ProgramData {
        mapping(bytes => uint8) prefix_sizes;
        bytes[] prefixes;
    }

    mapping(bytes32 programId => ProgramData) private whitelist;

    constructor(
        address initialOwner,
        bytes32[] memory _programIds,
        bytes[][] memory _instructions,
        uint8[][] memory _sizes
    ) Ownable(initialOwner) {
        _setProgramData(_programIds, _instructions, _sizes);
    }

    /**
     * @dev The programId has not been whitelisted.
     */
    // error InvalidProgramId();

    /**
     * @dev The instruction for this programId has not been whitelisted.
     */
    error InvalidInstruction();

    /**
     * @dev The Solana account is invalid.
     */
    error InvalidSolanaAccount();

    modifier validateComposabilityRequest(
        bytes32 programId, 
        bytes calldata instruction,
        bytes calldata accountsData,
        bytes32[] memory accounts,
        uint[] memory accountIndex
    ) {
        uint len = whitelist[programId].prefixes.length;
        /* 
        // validate programId
        require(
            len > 0,
            InvalidProgramId()
        ); */

        // validate instruction of a programId
        bool validatedInstruction = false;
        for (uint i = 0; i < len; ++i) {
            if (whitelist[programId].prefix_sizes[instruction[8:8+whitelist[programId].prefix_sizes[whitelist[programId].prefixes[i]]]] > 0) {
                validatedInstruction = true;
                continue;
            }
        }
        require(
            validatedInstruction,
            InvalidInstruction()
        );

        // validate accounts of given instruction of a programId
        len = accounts.length;
        if (len > 0) {
            for (uint i = 0; i < len; ++i) {
                uint offset = 8 + (accountIndex[i] * 34); // 34 bytes = 32 bytes for Solana address + 1 byte for is_signer + 1 byte for is_writable
                require(
                    accounts[i] == bytes32(accountsData[offset:offset + 32]), // 32 is the size of a Solana address
                    InvalidSolanaAccount()
                );
            }
        }

        _;
    }

    function updateProgramData(
        bytes32[] memory _programIds,
        bytes[][] memory _instructions,
        uint8[][] memory _sizes
    ) external onlyOwner {
        _setProgramData(_programIds, _instructions, _sizes);
    }

    function _setProgramData(
        bytes32[] memory _programIds,
        bytes[][] memory _instructions,
        uint8[][] memory _sizes
    ) internal {
        uint len = _programIds.length;
        for (uint i = 0; i < len; ++i) {
            uint leny = _instructions[i].length;
            for (uint y = 0; y < leny; ++y) {
                bool remove;
                if (whitelist[_programIds[i]].prefix_sizes[_instructions[i][y]] != 0 && _sizes[i][y] != 0) {
                    continue;
                } else if (_sizes[i][y] == 0) {
                    remove = true;
                }

                whitelist[_programIds[i]].prefix_sizes[_instructions[i][y]] = _sizes[i][y];
                if (remove) {
                    // remove _instructions[i][y] from whitelist[_programIds[i]].prefixes
                } else {
                    whitelist[_programIds[i]].prefixes.push(_instructions[i][y]);
                }
            }
        }
    }
}