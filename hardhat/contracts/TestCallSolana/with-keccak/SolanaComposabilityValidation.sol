// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";


contract SolanaComposabilityValidation is Ownable {
    struct ProgramData {
        mapping(bytes => bool) prefixesData;
        bytes[] prefixes;
    }

    mapping(bytes32 programId => ProgramData) private whitelist;

    constructor(
        address initialOwner,
        bytes32[] memory _programIds,
        bytes[][] memory _instructions
    ) Ownable(initialOwner) {
        _setProgramData(_programIds, _instructions);
    }

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
        bytes[][] memory _instructions
    ) external onlyOwner {
        _setProgramData(_programIds, _instructions);
    }

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
}