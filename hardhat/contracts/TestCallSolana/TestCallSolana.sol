// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import './interfaces/ICallSolana.sol';

contract TestCallSolana {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    function getNeonAddress(address _address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(_address);
    }

    function getPayer() public view returns(bytes32) {
        return CALL_SOLANA.getPayer();
    }

    function getSolanaPDA(bytes32 program_id, bytes memory seeds) external view returns (bytes32) {
        return CALL_SOLANA.getSolanaPDA(program_id, seeds);
    }

    function execute(
        bytes32 program_id, 
        ICallSolana.AccountMeta[] memory accounts, 
        bytes memory instruction_data, 
        uint64 lamports
    ) external {
        _execute(program_id, accounts, instruction_data, lamports);
    }

    function batchExecute(
        bytes32[] memory program_id,
        ICallSolana.AccountMeta[][] memory accounts, 
        bytes[] memory instruction_data, 
        uint64[] memory lamports
    ) external {
        uint len = program_id.length;
        for (uint i = 0; i < len; ++i) {
            _execute(program_id[i], accounts[i], instruction_data[i], lamports[i]);
        }
    }

    function createResource(bytes32 salt, uint64 space, uint64 lamports, bytes32 owner) external returns (bytes32) {
        bytes32 response = CALL_SOLANA.createResource(
            salt, 
            space,
            lamports,
            owner
        );
    }

    function _execute(
        bytes32 program_id, 
        ICallSolana.AccountMeta[] memory accounts, 
        bytes memory instruction_data, 
        uint64 lamports
    ) internal {
        ICallSolana.Instruction memory instruction = ICallSolana.Instruction({
            program_id: program_id,
            accounts: accounts,
            instruction_data: instruction_data
        });
        bytes memory response = CALL_SOLANA.execute(
            lamports, 
            instruction
        );
        (bytes32 data1, bytes memory data2) = CALL_SOLANA.getReturnData();
    }
}