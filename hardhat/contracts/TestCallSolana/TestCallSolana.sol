// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import './interfaces/ICallSolana.sol';

contract TestCallSolana {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    function getPayer() public view returns(bytes32) {
        return CALL_SOLANA.getPayer();
    }

    function getNeonAddress(address _address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(_address);
    }

    function execute(
        bytes32 program_id, 
        ICallSolana.AccountMeta[] memory accounts, 
        bytes memory instruction_data, 
        uint64 lamports
    ) external {
        _execute(program_id, accounts, instruction_data, lamports);
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
        bytes memory response = CALL_SOLANA.execute(lamports, instruction);
        (bytes32 data1, bytes memory data2) = CALL_SOLANA.getReturnData();
    }
}