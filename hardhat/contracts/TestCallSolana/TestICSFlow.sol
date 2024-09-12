// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';
import './SolanaComposabilityValidation.sol';

contract TestICSFlow is SolanaComposabilityValidation {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public immutable NEON_EVM_PROGRAM;

    event LogData(bytes response);

    constructor(
        address initialOwner,
        bytes32 _NEON_EVM_PROGRAM,
        bytes32[] memory programIds, 
        bytes[][] memory instructions
    ) SolanaComposabilityValidation(initialOwner, programIds, instructions) {
        NEON_EVM_PROGRAM = _NEON_EVM_PROGRAM;
    }

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    function execute(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 ataAccount,
        uint64 lamports,
        bytes32 programId,
        bytes calldata instruction,
        bytes calldata accountsData
    ) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount); // transfer the tokens from the user to the contract's arbitrary Token account = owner = Neon EVM Program
        IERC20(tokenIn).transferSolana(ataAccount, amount); // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(tokenOut).transfer(msg.sender, 0); // needed to make sure that the receiver has arbitrary Token account initialized; if the receiver is different than msg.sender then this line should be changed

        bytes32[] memory accounts = new bytes32[](1);
        accounts[0] = CALL_SOLANA.getSolanaPDA(
            NEON_EVM_PROGRAM,
            prepareArbitraryTokenAccountSeeds(tokenOut, msg.sender)
        );

        uint[] memory accountIndex = new uint[](1);
        accountIndex[0] = 5;

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