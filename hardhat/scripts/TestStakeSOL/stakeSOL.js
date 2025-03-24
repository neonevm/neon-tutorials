const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    ACCOUNT_SIZE,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} = require("@solana/spl-token");
const { getStakeActivation } = require("@anza-xyz/solana-rpc-get-stake-activation");
const { config } = require('./config');
const { utils } = require('../TestCallSolana/config').config;

async function setUp() {
    let TestStakeSOLAddress, wSOLAddress, SOLANA_NODE;
    if (network.name == "neonmainnet") {
        SOLANA_NODE = config.SOLANA_NODE_MAINNET;
        TestStakeSOLAddress = config.STAKE_SOL_SAMPLE_CONTRACT_MAINNET;
        wSOLAddress = config.DATA.EVM.MAINNET.ADDRESSES.WSOL;
    } else if (network.name == "neondevnet") {
        SOLANA_NODE = config.SOLANA_NODE;
        TestStakeSOLAddress = config.STAKE_SOL_SAMPLE_CONTRACT;
        wSOLAddress = config.DATA.EVM.DEVNET.ADDRESSES.WSOL;
    }
    console.log(TestStakeSOLAddress, "TestStakeSOLAddress")

    const connection = new web3.Connection(SOLANA_NODE, "processed");
    const [deployer, user] = await ethers.getSigners();
    console.log(user.address, "user")

    const validatorPubKey = new web3.PublicKey("vgcDar2pryHvMgPkKaZfh8pQy4BJxv7SpwUG7zinWjG");

    const wSOL = await ethers.getContractAt(
        "contracts/TestStakeSOL/interfaces/IERC20ForSPL.sol:IERC20ForSPL",
        wSOLAddress,
        user
    );
    const wSOLMintPublicKeyInBytes = await wSOL.tokenMint()
    const wSOLMintPublicKey = ethers.encodeBase58(wSOLMintPublicKeyInBytes);
    console.log(wSOLMintPublicKey, "wSOLMintPublicKey")

    const TestStakeSOLFactory = await ethers.getContractFactory("TestStakeSOL");
    let TestStakeSOL;
    if (ethers.isAddress(TestStakeSOLAddress)) {
        TestStakeSOL = TestStakeSOLFactory.attach(TestStakeSOLAddress);
    } else {
        TestStakeSOL = await TestStakeSOLFactory.deploy(wSOLAddress);
        await TestStakeSOL.waitForDeployment();
        TestStakeSOLAddress = TestStakeSOL.target;
        console.log(
            `TestStakeSOL deployed to ${TestStakeSOLAddress}`
        );
    }

    const payerInBytes = await TestStakeSOL.getPayer();
    const payerPublicKey = ethers.encodeBase58(payerInBytes);
    console.log(payerPublicKey, 'payerPublicKey');

    const contractPublicKeyInBytes = await TestStakeSOL.getNeonAddress();
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    return({
        connection,
        user,
        wSOL,
        TestStakeSOL,
        TestStakeSOLAddress,
        wSOLAddress,
        wSOLMintPublicKey,
        contractPublicKey,
        payerPublicKey,
        validatorPubKey
    })
}


async function stake(setup, stakeAmount) {
    let tx, receipt;

    const rentExemptATABalance = await setup.connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
    console.log(rentExemptATABalance, 'rentExemptATABalance');

    // ============================= APPROVE TestStakeSOL CONTRACT IF NEEDED ====================================

    const allowance = await setup.wSOL.connect(setup.user).allowance(setup.user.address, setup.TestStakeSOLAddress);
    console.log(allowance, 'allowance');
    if(allowance < stakeAmount - rentExemptATABalance) {
        console.log('Approving TesStakeSOL contract to transfer wSOL...');
        // We only need to approve stakeAmount - rentExemptATABalance since ATA rent balance will be added to stake
        // amount when closing contract's wSOL ATA account
        let tx = await setup.wSOL.connect(setup.user).approve(setup.TestStakeSOLAddress, stakeAmount - rentExemptATABalance);
        let receipt = await tx.wait(3);
    }

    // ============================= FORMAT INSTRUCTION TO CREATE wSOL ATA FOR TestStakeSOL CONTRACT ====================================

    const contractATA = await getAssociatedTokenAddress(
        new web3.PublicKey(setup.wSOLMintPublicKey),
        new web3.PublicKey(setup.contractPublicKey),
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
    console.log(contractATA.toString(), 'contractATA');

    const contractATAInfo = await setup.connection.getAccountInfo(contractATA);
    console.log(contractATAInfo, 'contractATAInfo')
    let initATAIx;
    if (!contractATAInfo || !contractATAInfo.data) {
        initATAIx = createAssociatedTokenAccountInstruction(
            new web3.PublicKey(setup.payerPublicKey),
            contractATA,
            new web3.PublicKey(setup.contractPublicKey),
            new web3.PublicKey(setup.wSOLMintPublicKey),
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
        )
    }

    // ============================= FORMAT INSTRUCTIONS TO CREATE USER'S STAKING ACCOUNT (PDA) ====================================

    const stakingAccountPublicKeyInBytes = await setup.TestStakeSOL.connect(setup.user).getStakingAccount();
    const stakingAccountPublicKey = ethers.encodeBase58(stakingAccountPublicKeyInBytes);
    console.log(stakingAccountPublicKey, 'stakingAccountPublicKey');

    const stakingAccountInfo = await setup.connection.getAccountInfo(new web3.PublicKey(stakingAccountPublicKey));
    console.log(stakingAccountInfo, 'stakingAccountInfo')
    let initStakingAccountIx;
    let rentExemptStakingAccountBalance = 0;
    if (!stakingAccountInfo || !stakingAccountInfo.data) {
        rentExemptStakingAccountBalance = await setup.connection.getMinimumBalanceForRentExemption(web3.StakeProgram.space);
        console.log(rentExemptStakingAccountBalance, 'rentExemptStakingAccountBalance');

        initStakingAccountIx = web3.StakeProgram.initialize({
            stakePubkey: new web3.PublicKey(stakingAccountPublicKey),
            authorized: new web3.Authorized(new web3.PublicKey(setup.contractPublicKey), new web3.PublicKey(setup.contractPublicKey)),
            // lockup: new web3.Lockup(0, 0, contractPublicKey), // Optional. We'll set this to 0 for demonstration
            // purposes.
        });
    }

    // ============================= FORMAT INSTRUCTION TO UNWRAP wSOL ====================================

    const unwrapIx = createCloseAccountInstruction(
        contractATA, // PDA to sync
        new web3.PublicKey(stakingAccountPublicKey), // Recipient
        new web3.PublicKey(setup.contractPublicKey), // Authority
        [],
        TOKEN_PROGRAM_ID // Program Id
    );

    // ============================= FORMAT INSTRUCTION TO DELEGATE STAKE TO VALIDATOR ====================================

    const delegateIx = web3.StakeProgram.delegate({
        stakePubkey: new web3.PublicKey(stakingAccountPublicKey),
        authorizedPubkey: new web3.PublicKey(setup.contractPublicKey),
        votePubkey: setup.validatorPubKey,
    }).instructions[0];

    // ============================= EXECUTE INSTRUCTIONS ====================================
    console.log('Staking...');
    tx = await setup.TestStakeSOL.connect(setup.user).stake(
        stakeAmount - rentExemptATABalance, // ATA rent balance will be added to stake amount when closing contract's wSOL ATA account
        initATAIx ? utils.prepareInstruction(initATAIx) : ethers.zeroPadValue("0x00", 1),
        rentExemptATABalance,
        rentExemptStakingAccountBalance,
        initStakingAccountIx ? utils.prepareInstruction(initStakingAccountIx) : ethers.zeroPadValue("0x", 0),
        utils.prepareInstruction(unwrapIx),
        utils.prepareInstruction(delegateIx)
    );
    receipt = await tx.wait(3);
    // console.log(receipt, 'receipt');

    // Verify the status of our staking account. This should now be activating.
    const stakingAccountStatus = await getStakeActivation(setup.connection, new web3.PublicKey(stakingAccountPublicKey));
    console.log(`Staking account status after stake:`);
    console.log(stakingAccountStatus);
}

async function initWithdraw(setup) {

    // ============================= FORMAT INSTRUCTION TO DEACTIVATE STAKE ====================================

    const stakingAccountPublicKeyInBytes = await setup.TestStakeSOL.connect(setup.user).getStakingAccount();
    const stakingAccountPublicKey = ethers.encodeBase58(stakingAccountPublicKeyInBytes);
    console.log(stakingAccountPublicKey, 'stakingAccountPublicKey');

    const deactivateIx = web3.StakeProgram.deactivate({
        stakePubkey: new web3.PublicKey(stakingAccountPublicKey),
        authorizedPubkey: new web3.PublicKey(setup.contractPublicKey),
    }).instructions[0];

    // ============================= EXECUTE INSTRUCTION ====================================

    console.log('Init withdraw...');
    const tx = await setup.TestStakeSOL.connect(setup.user).initWithdraw(
        utils.prepareInstruction(deactivateIx)
    );
    const receipt = await tx.wait(3);
    // console.log(receipt, 'receipt');

    // Verify the status of our staking account. This should now be inactive.
    const stakingAccountStatus = await getStakeActivation(setup.connection, new web3.PublicKey(stakingAccountPublicKey));
    console.log(`Staking account status after initWithdraw:`);
    console.log(stakingAccountStatus);
}

async function withdraw(setup, withdrawAmount) {

    // ============================= FORMAT INSTRUCTION TO WITHDRAW STAKE ====================================
    // Once deactivated, we can withdraw our SOL back to our main wallet after the end of the current epoch.
    // See: https://solana.com/staking#delegation-timing-considerations
    // However, funds sent to our stake account after it was delegated can be withdrawn immediately.

    const stakingAccountPublicKeyInBytes = await setup.TestStakeSOL.connect(setup.user).getStakingAccount();
    const stakingAccountPublicKey = ethers.encodeBase58(stakingAccountPublicKeyInBytes);
    console.log(stakingAccountPublicKey, 'stakingAccountPublicKey');

    const userPDATokenAccountPublicKey = new web3.PublicKey(utils.calculateTokenAccount(
        setup.wSOLAddress,
        setup.user.address,
        new web3.PublicKey(config.DATA.SVM.DEVNET.ADDRESSES.NEON_PROGRAM)
    )[0]);
    console.log(userPDATokenAccountPublicKey.toBase58(), 'userPDATokenAccountPublicKey');

    const withdrawIx = web3.StakeProgram.withdraw({
        stakePubkey: new web3.PublicKey(stakingAccountPublicKey),
        authorizedPubkey: new web3.PublicKey(setup.contractPublicKey),
        toPubkey: userPDATokenAccountPublicKey, // Withdraw to user's wSOL PDA account
        lamports: withdrawAmount
    }).instructions[0];

    const wrapIx = createSyncNativeInstruction(
        userPDATokenAccountPublicKey,
        TOKEN_PROGRAM_ID
    )

    // ============================= EXECUTE INSTRUCTION ====================================

    console.log('Withdraw...');
    const tx = await setup.TestStakeSOL.connect(setup.user).withdraw(
        utils.prepareInstruction(withdrawIx),
        utils.prepareInstruction(wrapIx)
    );
    const receipt = await tx.wait(3);
    // console.log(receipt, 'receipt');

    // Verify the status of our staking account. This should now be inactive.
    const stakingAccountStatus = await getStakeActivation(setup.connection, new web3.PublicKey(stakingAccountPublicKey));
    console.log(`Staking account status after withdraw:`);
    console.log(stakingAccountStatus);
}

module.exports = {
    setUp,
    stake,
    initWithdraw,
    withdraw
}