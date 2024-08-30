// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/ICallSolana.sol';

contract TestCallSolana {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    event LogData(bytes response);
    event CreateResource(bytes32 salt, uint64 space, uint64 lamports, bytes32 programId, bytes32 response);

    function getNeonAddress(address _address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(_address);
    }

    function getPayer() public view returns(bytes32) {
        return CALL_SOLANA.getPayer();
    }

    function getSolanaPDA(bytes32 program_id, bytes memory seeds) external view returns (bytes32) {
        return CALL_SOLANA.getSolanaPDA(program_id, seeds);
    }

    function getResourceAddress(bytes32 salt) external view returns (bytes32) {
        return CALL_SOLANA.getResourceAddress(salt);
    }

    function getExtAuthority(bytes32 salt) external view returns (bytes32) {
        return CALL_SOLANA.getExtAuthority(salt);
    }

    function execute(
        uint64 lamports,
        bytes32 salt,
        bytes memory instruction
    ) external {
        _execute(lamports, salt, instruction);
    }

    function batchExecute(
        uint64[] memory lamports,
        bytes32[] memory salt,
        bytes[] memory instruction
    ) external {
        uint len = instruction.length;
        for (uint i = 0; i < len; ++i) {
            _execute(lamports[i], salt[i], instruction[i]);
        }
    }

    function createResource(
        bytes32 salt, 
        uint64 space, 
        uint64 lamports, 
        bytes32 program_id
    ) external returns (bytes32) {
        bytes32 response = CALL_SOLANA.createResource(
            salt, 
            space,
            lamports,
            program_id
        );

        emit CreateResource(salt, space, lamports, program_id, response);
        return response;
    }

    function _execute(
        uint64 lamports,
        bytes32 salt,
        bytes memory instruction
    ) internal {
        bytes memory response;
        if (salt != bytes32(0)) {
            response = CALL_SOLANA.executeWithSeed(
                lamports,
                salt,
                instruction
            );
        } else {
            response = CALL_SOLANA.execute(
                lamports,
                instruction
            );
        }
        
        emit LogData(response);
    }
}