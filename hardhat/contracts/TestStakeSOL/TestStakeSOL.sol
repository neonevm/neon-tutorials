// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import { ICallSolana } from './interfaces/ICallSolana.sol';
import { IERC20ForSPL } from './interfaces/IERC20ForSPL.sol';
import { SolanaComposabilityValidation } from './SolanaComposabilityValidation.sol';

contract TestStakeSOL {
    ICallSolana private constant CALL_SOLANA = ICallSolana(0xFF00000000000000000000000000000000000006);
    bytes32 private constant TOKEN_PROGRAM = 0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9;
    bytes32 private constant ASSOCIATED_TOKEN_PROGRAM = 0x8c97258f4e2489f1bb3d1029148e0d830b5a1399daff1084048e7bd8dbe9f859;
    bytes32 private constant STAKE_PROGRAM = 0x06a1d8179137542a983437bdfe2a7ab2557f535c8a78722b68a49dc000000000;
    uint64 private constant STAKING_ACCOUNT_SPACE = 200;
    address public immutable wSOL;

    event Stake(address indexed user, bytes32 indexed stakingAccount, uint256 amount);
    event InitWithdraw(address indexed user, bytes32 indexed stakingAccount);
    event Withdraw(address indexed user, bytes32 indexed stakingAccount, bytes32 indexed recipientAccount, uint64 amount);

    modifier isStakeOwner(bytes calldata instruction) {
        // Staking account pubKey in instruction data must match staking account pubKey derived from msg.sender
        require(
            getStakingAccount() == bytes32(instruction[40:72]),
            "TestStakeSOL: sender must be staking account owner."
        );
        _;
    }

    constructor(address _wSOL){
        wSOL = _wSOL;
    }

    function stake(
        uint64 amount,
        bytes calldata initATAInstruction,
        uint64 rentExemptATABalance,
        uint64 rentExemptStakingAccountBalance,
        bytes calldata initStakingAccountInstruction,
        bytes calldata unwrapInstruction,
        bytes calldata delegateInstruction
    ) external isStakeOwner(delegateInstruction) {
        // Transfer wSOL from user to contract's arbitrary (PDA) token account (owner = NeonEVM program)
        IERC20ForSPL(wSOL).transferFrom(msg.sender, address(this), amount);

        // Create and initialize contract's associated token account for wSOL
        CALL_SOLANA.execute(rentExemptATABalance, initATAInstruction);

        // Transfer wSOL from contract's arbitrary token account to contract's associated token account
        bytes32 thisContractATA = CALL_SOLANA.getSolanaPDA(
            ASSOCIATED_TOKEN_PROGRAM,
            SolanaComposabilityValidation.getAssociateTokenAccountSeeds(
                CALL_SOLANA.getNeonAddress(address(this)),
                TOKEN_PROGRAM,
                IERC20ForSPL(wSOL).tokenMint()
            )
        );
        IERC20ForSPL(wSOL).transferSolana(thisContractATA, amount);

        // Create staking account if needed
        if(rentExemptStakingAccountBalance > 0) {
            CALL_SOLANA.createResource(
                bytes32(uint256(uint160(msg.sender))), // Staking account is linked to msg.sender allowing authentication
                STAKING_ACCOUNT_SPACE,
                rentExemptStakingAccountBalance,
                STAKE_PROGRAM
            );
        }

        // Initialize staking account if needed
        if(initStakingAccountInstruction.length > 0) {
            CALL_SOLANA.execute(0, initStakingAccountInstruction);
        }

        // Unwrap wSOL (this closes the contract's ATA for wSOL and transfers the SOL amount to user's staking account)
        CALL_SOLANA.execute(0, unwrapInstruction);

        // Delegate staking account balance to validator (isStakeOwner modifier already authenticated msg.sender as the
        // owner of the staking account being delegated)
        CALL_SOLANA.execute(0, delegateInstruction);

        emit Stake(msg.sender, bytes32(delegateInstruction[40:72]), amount);
    }

    function initWithdraw(bytes calldata deactivateInstruction) isStakeOwner(deactivateInstruction) external {
        // Deactivate user's stake
        CALL_SOLANA.execute(0, deactivateInstruction);

        emit InitWithdraw(msg.sender, bytes32(deactivateInstruction[40:72]));
    }

    function withdraw(
        bytes calldata withdrawInstruction,
        bytes calldata wrapInstruction
    ) isStakeOwner(withdrawInstruction) external {
        // Withdraw user's stake to user's wSOL PDA account (stake can only be withdrawn after the end of the epoch
        // during which initWithdraw was executed)
        CALL_SOLANA.execute(0, withdrawInstruction);

        // Sync  user's wSOL PDA account
        CALL_SOLANA.execute(0, wrapInstruction);

        emit Withdraw(
            msg.sender,
            bytes32(withdrawInstruction[40:72]),
            bytes32(withdrawInstruction[74:106]),
            uint64(bytes8(withdrawInstruction[222:226])) // TO DO: check if conversion works here (instruction bytes are little endian)
        );
    }

    function getStakingAccount() public view returns(bytes32) {
        return CALL_SOLANA.getResourceAddress(bytes32(uint256(uint160(msg.sender))));
    }

    function getPayer() public view returns(bytes32) {
        return CALL_SOLANA.getPayer();
    }

    function getNeonAddress() public view returns(bytes32) {
        return CALL_SOLANA.getNeonAddress(address(this));
    }
}
