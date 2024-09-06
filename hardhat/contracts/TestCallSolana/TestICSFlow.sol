// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';

contract TestICSFlow {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    event LogData(bytes response);

    function getNeonAddress(address _address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(_address);
    }

    function execute(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 ataAccount,
        uint64 lamports,
        bytes32 salt,
        bytes memory instruction
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount); // transfer the tokens from the user to the contract's arbitrary Token account
        IERC20(tokenIn).transferSolana(ataAccount, amount); // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(tokenOut).transfer(msg.sender, 0); // needed to make sure that the receiver has arbitrary Token account initialized; if the receiver is different than msg.sender then this line should be changed

        _execute(lamports, salt, instruction);
    }

    function batchExecute(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 ataAccount,
        uint64[] memory lamports,
        bytes32[] memory salt,
        bytes[] memory instruction
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount); // transfer the tokens from the user to the contract's arbitrary Token account
        IERC20(tokenIn).transferSolana(ataAccount, amount); // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(tokenOut).transfer(msg.sender, 0); // needed to make sure that the receiver has arbitrary Token account initialized; if the receiver is different than msg.sender then this line should be changed

        uint len = instruction.length;
        for (uint i = 0; i < len; ++i) {
            _execute(lamports[i], salt[i], instruction[i]);
        }
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