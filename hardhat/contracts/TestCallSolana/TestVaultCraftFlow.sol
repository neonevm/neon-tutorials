// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import './interfaces/IERC20.sol';
import './interfaces/ICallSolana.sol';
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract TestVaultCraftFlow is Ownable {
    ICallSolana public constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 public constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 public constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 public immutable NEON_EVM_PROGRAM;
    bytes32 public immutable RAYDIUM_PROGRAM;

    event ComposabilityResponse(bytes response);

    constructor(
        address initialOwner,
        bytes32 _NEON_EVM_PROGRAM,
        bytes32 _RAYDIUM_PROGRAM
    ) Ownable(initialOwner) {
        NEON_EVM_PROGRAM = _NEON_EVM_PROGRAM;
        RAYDIUM_PROGRAM = _RAYDIUM_PROGRAM;
    }

    function getNeonAddress(address evm_address) public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(evm_address);
    }

    /**
     * @notice Calculates the Solana arbitrary token account of a given EVM wallet.
     */
    function getNeonArbitraryTokenAccount(address token, address evm_address) public view returns (bytes32) {
        return CALL_SOLANA.getSolanaPDA(
            NEON_EVM_PROGRAM,
            abi.encodePacked(
                hex"03",
                hex"436f6e747261637444617461", // ContractData
                token,
                _salt(evm_address)
            )
        );
    }

    /**
     * @notice Calculates a Solana ATA account.
     */
    function getAssociateTokenAccount(bytes32 svm_address, bytes32 mint) public view returns (bytes32) {
        return CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            abi.encodePacked(
                svm_address,
                TOKEN_PROGRAM,
                mint
            )
        );
    }

    /**
     * @notice Converts address type into bytes32.
     */
    function _salt(address account) internal pure returns (bytes32) {
        return bytes32(uint256(uint160(account)));
    }

    // dummy method that simulates ERC4626 deposit ...
    function deposit(address tokenIn, uint amount) external {
        IERC20(tokenIn).transferFrom(msg.sender, address(this), amount);
    }

    function depositIntoRaydium(
        address token,
        uint64 amount,
        bytes[] calldata instructions,
        bytes[] calldata accountsDatas
    ) external onlyOwner {
        // transfer the tokens from the contract's arbitrary Token account to contract's ATA account
        IERC20(token).transferSolana(
            getAssociateTokenAccount(CALL_SOLANA.getNeonAddress(address(this)), IERC20(token).tokenMint()),
            amount
        );
        
        // swap
        _executeComposabilityRequest(0, RAYDIUM_PROGRAM, instructions[0], accountsDatas[0]);
        
        // deposit LP
        _executeComposabilityRequest(0, RAYDIUM_PROGRAM, instructions[1], accountsDatas[1]);
    }

    function withdrawFromRaydium(
        bytes[] calldata instructions,
        bytes[] calldata accountsDatas
    ) external onlyOwner {
        // withdraw LP
        _executeComposabilityRequest(0, RAYDIUM_PROGRAM, instructions[0], accountsDatas[0]);
        
        // swap
        _executeComposabilityRequest(0, RAYDIUM_PROGRAM, instructions[1], accountsDatas[1]);
        
        // transfer the tokens from the contract's ATA account to the contract's arbitrary Token account
        _executeComposabilityRequest(0, TOKEN_PROGRAM, instructions[2], accountsDatas[2]);
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