// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';
import './SolanaComposabilityValidation.sol';

contract TestVaultCraftFlow {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 public immutable NEON_EVM_PROGRAM;
    bytes32 public immutable RAYDIUM_PROGRAM;

    event ComposabilityResponse(bytes response);

    constructor(
        bytes32 _NEON_EVM_PROGRAM,
        bytes32 _RAYDIUM_PROGRAM
    ) {
        NEON_EVM_PROGRAM = _NEON_EVM_PROGRAM;
        RAYDIUM_PROGRAM = _RAYDIUM_PROGRAM;
    }

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    // 1st instruction - swap USDC to RAY
    // 2nd instruction - deposit USDC & RAY
    function depositIntoRaydium(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 programId,
        bytes[] calldata instructions,
        bytes[] calldata accountsDatas
    ) external {
        // accounts validation - this validation validates that the receiver of the swap output is the token arbitrary account of the msg.sender
        bytes32[] memory accounts = new bytes32[](1);
        accounts[0] = CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            SolanaComposabilityValidation.getAssociateTokenAccountSeeds(
                CALL_SOLANA.getNeonAddress(address(this)),
                TOKEN_PROGRAM,
                IERC20(tokenOut).tokenMint()
            )
        );

        uint[] memory accountsIndex = new uint[](1);
        accountsIndex[0] = 16;

        SolanaComposabilityValidation.validateComposabilityRequest(
            RAYDIUM_PROGRAM,
            programId,
            hex"09881300", // swap instruction ID of SOL/ USDC pool
            instructions[0],
            accountsDatas[0],
            accounts,
            accountsIndex
        );

        if (amount > 0) {
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amount); // transfer the tokens from the user to the contract's arbitrary Token account = owner = Neon EVM Program
            IERC20(tokenIn).transferSolana(
                CALL_SOLANA.getSolanaPDA(
                    ASSOCIATED_TOKEN_PROGRAM,
                    SolanaComposabilityValidation.getAssociateTokenAccountSeeds(
                        CALL_SOLANA.getNeonAddress(address(this)), 
                        TOKEN_PROGRAM,
                        IERC20(tokenIn).tokenMint()
                    )
                ),
                amount
            ); // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        }

        // swap
        _executeComposabilityRequest(0, programId, instructions[0], accountsDatas[0]);

        SolanaComposabilityValidation.validateComposabilityRequest(
            RAYDIUM_PROGRAM,
            programId,
            //hex"038f7400", // deposit LP instruction ID of SOL/ USDC pool
            hex"03", // remove
            instructions[1],
            accountsDatas[1],
            new bytes32[](0),
            new uint[](0)
        );

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