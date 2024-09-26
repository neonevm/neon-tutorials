// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TestVaultCraftFlow is Ownable {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;

    event ComposabilityResponse(bytes response);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    function deposit(address tokenIn, uint amount) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);
    }

    function depositIntoRaydium(
        address token,
        uint64 amount,
        bytes32 programId,
        bytes[] calldata instructions,
        bytes[] calldata accountsDatas
    ) external onlyOwner {
        // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(token).transferSolana(
            CALL_SOLANA.getSolanaPDA(
                ASSOCIATED_TOKEN_PROGRAM,
                abi.encodePacked(
                    CALL_SOLANA.getNeonAddress(address(this)),
                    TOKEN_PROGRAM,
                    IERC20(token).tokenMint()
                )
            ),
            amount
        );
        
        // swap
        _executeComposabilityRequest(0, programId, instructions[0], accountsDatas[0]);
        
        // deposit LP
        _executeComposabilityRequest(0, programId, instructions[1], accountsDatas[1]);
    }

    function _executeComposabilityRequest(
        uint64 lamports,
        bytes32 programId,
        bytes calldata instruction,
        bytes calldata accountsData
    ) public {
        bytes memory response = CALL_SOLANA.execute(
            lamports,
            abi.encodePacked(
                programId, 
                accountsData,
                instruction
            )
        );
        
        emit ComposabilityResponse(response);
    }
}