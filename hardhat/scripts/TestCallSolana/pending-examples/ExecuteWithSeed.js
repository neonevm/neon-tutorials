// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    createTransferInstruction,
    createApproveInstruction,
    getAccount
} = require('@solana/spl-token');
const { config } = require('../config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [user1] = await ethers.getSigners();
    const tokenMintPublicKey = '2s3eVZaszuYW1PkhEjTUP4UxMUXAv3uWM6DGQEPq1h5y';
    if (tokenMintPublicKey == '') {
        return console.error('Before proceeding with instructions execution please set value for the tokenMintPublicKey variable.');
    }
    const token = new web3.PublicKey(tokenMintPublicKey);

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    let TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT;
    let TestCallSolana;
    let solanaTx;
    let tx;
    let receipt;

    if (ethers.isAddress(TestCallSolanaAddress)) {
        TestCallSolana = TestCallSolanaFactory.attach(TestCallSolanaAddress);
    } else {
        TestCallSolana = await ethers.deployContract("TestCallSolana");
        await TestCallSolana.waitForDeployment();

        TestCallSolanaAddress = TestCallSolana.target;
        console.log(
            `TestCallSolana deployed to ${TestCallSolana.target}`
        );
    }

    let payer = ethers.encodeBase58(await TestCallSolana.getPayer());
    console.log(payer, 'payer');

    let contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    let contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    const user1PublicKeyInBytes = await TestCallSolana.getNeonAddress(user1.address);
    const user1PublicKey = ethers.encodeBase58(user1PublicKeyInBytes);
    console.log(user1PublicKey, 'user1PublicKey');

    const salt = ethers.encodeBytes32String('salt' + Date.now().toString()); // random seed on each script call
    let getExtAuthority = await TestCallSolana.getExtAuthority(salt);
    console.log(getExtAuthority, 'getExtAuthority'); //bytes32

    let ataContract = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(contractPublicKey),
        true
    );
    console.log(await getAccount(connection, ataContract), 'ataContract');

    let ataUser1 = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(user1PublicKey),
        true
    );
    console.log(await getAccount(connection, ataUser1), 'ataUser1');

    solanaTx = new web3.Transaction();
    solanaTx.add(
        createApproveInstruction(
            ataContract, // ATA of Contract
            ethers.encodeBase58(getExtAuthority), // publicKey
            contractPublicKey,
            2 * 10 ** 9
        )
    );

    console.log('Processing execute method with all instructions ...');
    [tx, receipt] = await config.utils.execute(
        solanaTx.instructions[0], 
        0, 
        TestCallSolana,
        undefined,
        user1
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt');

    solanaTx = new web3.Transaction();
    // option 1 with executeWithSeed - PDA([ACCOUNT_SEED_VERSION, "AUTH", address(this), msg.sender], evm_loader_id)
    solanaTx.add(
        createTransferInstruction(
            ataContract, 
            ataUser1,
            ethers.encodeBase58(getExtAuthority),
            2 * 10 ** 9, // transfers 10 tokens
            []
        )
    );

    // option 2 with execute - PDA([ACCOUNT_SEED_VERSION, address(this)], evm_loader_id)
    /* solanaTx.add(
        createTransferInstruction(
            ataContract, 
            ataUser1,
            contractPublicKey,
            2 * 10 ** 9, // transfers 10 tokens
            []
        )
    ); */

    console.log('Processing execute method with all instructions ...');
    [tx, receipt] = await config.utils.execute(
        solanaTx.instructions[0], 
        0, 
        TestCallSolana,
        salt,
        user1
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});