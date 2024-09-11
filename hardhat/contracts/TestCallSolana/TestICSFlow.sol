// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';
import './with-keccak/SolanaComposabilityValidation.sol';

contract TestICSFlow is SolanaComposabilityValidation {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);

    event LogData(bytes response);

    constructor(
        address initialOwner,
        bytes32[] memory programIds, 
        bytes[][] memory instructions
    ) SolanaComposabilityValidation(initialOwner, programIds, instructions) {}

    function getNeonAddress(address _address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(_address);
    }

    function execute(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 ataAccount,
        bytes32 msgSenderTokenAccount, // !!! this have to be defined on-chain !!!
        uint64 lamports,
        bytes32 programId,
        bytes calldata instruction,
        bytes calldata accountsData
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount); // transfer the tokens from the user to the contract's arbitrary Token account = owner = Neon EVM Program
        IERC20(tokenIn).transferSolana(ataAccount, amount); // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(tokenOut).transfer(msg.sender, 0); // needed to make sure that the receiver has arbitrary Token account initialized; if the receiver is different than msg.sender then this line should be changed

        bytes32[] memory accounts = new bytes32[](1);
        accounts[0] = msgSenderTokenAccount;

        uint[] memory accountIndex = new uint[](1);
        accountIndex[0] = 5;

        // only requests to orca LP deposit
        _execute(lamports, programId, instruction, accountsData, accounts, accountIndex);
    }

    /* function batchExecute(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 ataAccount,
        uint64[] calldata lamports,
        bytes32[] calldata programId,
        bytes[] calldata accountsData,
        bytes[] calldata instruction
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount); // transfer the tokens from the user to the contract's arbitrary Token account
        IERC20(tokenIn).transferSolana(ataAccount, amount); // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(tokenOut).transfer(msg.sender, 0); // needed to make sure that the receiver has arbitrary Token account initialized; if the receiver is different than msg.sender then this line should be changed

        uint len = instruction.length;
        for (uint i = 0; i < len; ++i) {
            _execute(lamports[i], programId[i], accountsData[i], instruction[i], new bytes32[](0), new uint[](0));
        }
    } */

    function _execute(
        uint64 lamports,
        bytes32 programId,
        bytes calldata instruction,
        bytes calldata accountsData,
        bytes32[] memory accounts,
        uint[] memory accountIndex
    ) internal validateComposabilityRequest(
        programId, 
        instruction,
        accountsData,
        accounts,
        accountIndex
    ) {
        bytes memory response = CALL_SOLANA.execute(
            lamports,
            abi.encodePacked(
                programId, 
                accountsData,
                instruction
            )
        );
        
        emit LogData(response);
    }
}