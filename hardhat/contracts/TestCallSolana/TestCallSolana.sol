// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import './interfaces/ICallSolana.sol';

contract TestCallSolana {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFf00000000000000000000000000000000000006);

    function execute(bytes32 program_id, ICallSolana.AccountMeta[] memory accounts, bytes instruction_data, uint64 lamports) external {
        ICallSolana.Instruction memory instruction = ICallSolana.Instruction({
            program_id: program_id,
            accounts: accounts,
            instruction_data: instruction_data
        });
        bytes memory response = CALL_SOLANA.execute(lamports, instruction);
        (bytes32 data1, bytes memory data2) = CALL_SOLANA.getReturnData();
    }
}