// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';
import './SolanaComposabilityValidation.sol';

contract TestICSFlow {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 public immutable NEON_EVM_PROGRAM;
    bytes32 public immutable ORCA_PROGRAM;
    bytes32 public immutable RAYDIUM_PROGRAM;

    event LogData(bytes response);

    constructor(
        bytes32 _NEON_EVM_PROGRAM,
        bytes32 _ORCA_PROGRAM,
        bytes32 _RAYDIUM_PROGRAM
    ) {
        NEON_EVM_PROGRAM = _NEON_EVM_PROGRAM;
        ORCA_PROGRAM = _ORCA_PROGRAM;
        RAYDIUM_PROGRAM = _RAYDIUM_PROGRAM;
    }

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    function orcaSwap(
        address tokenIn,
        address tokenOut,
        uint64 amount,
        bytes32 programId,
        bytes calldata programIdinstruction,
        bytes calldata accountsData
    ) external {
        // build accounts validation - this validation basically validate that the receiver of the swap output is the token arbitrary account of the msg.sender
        bytes32[] memory accounts = new bytes32[](1);
        accounts[0] = CALL_SOLANA.getSolanaPDA(
            NEON_EVM_PROGRAM,
            SolanaComposabilityValidation.getArbitraryTokenAccountSeeds(tokenOut, msg.sender)
        );

        uint[] memory accountsIndex = new uint[](1);
        accountsIndex[0] = 5;

        SolanaComposabilityValidation.validateComposabilityRequest(
            ORCA_PROGRAM, 
            programId, 
            hex"f8c69e91e17587c8", // Orca swap instruction ID
            instruction, 
            accountsData, 
            accounts, 
            accountsIndex
        );

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
        IERC20(tokenOut).transfer(msg.sender, 0); // needed to make sure that the receiver has arbitrary Token account initialized; if the receiver is different than msg.sender then this line should be changed

        _execute(0, programId, instruction, accountsData);
    }

    function _execute(
        uint64 lamports,
        bytes32 programId,
        bytes calldata instruction,
        bytes calldata accountsData
    ) internal {
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