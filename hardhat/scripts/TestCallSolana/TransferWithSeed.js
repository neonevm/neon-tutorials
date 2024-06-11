// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [owner] = await ethers.getSigners();

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

    let ownerPublicKeyInBytes = await TestCallSolana.getNeonAddress(owner.address);
    let ownerPublicKey = ethers.encodeBase58(ownerPublicKeyInBytes);
    console.log(ownerPublicKey, 'ownerPublicKey');

    // ============================= SOL TRANSFER EXAMPLE ( createAccountWithSeed + transferWithSeed ) ====================================
     // calculate minimum balance to make account rent-exempt
    const minBalance = await connection.getMinimumBalanceForRentExemption(0);
    console.log(minBalance, 'minBalance');

    const seedSender = "seed1234";
    const seedReceiver = seedSender + "1";

    let createWithSeedSender = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seedSender, web3.SystemProgram.programId);
    console.log(createWithSeedSender, 'createWithSeedSender');

    let createWithSeedReceiver = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seedReceiver, web3.SystemProgram.programId);
    console.log(createWithSeedReceiver, 'createWithSeedReceiver');
    
    let senderAccount = await connection.getAccountInfo(createWithSeedSender);
    console.log(senderAccount, 'getAccountInfo createWithSeedSender');
    let receiverAccount = await connection.getAccountInfo(createWithSeedReceiver);
    console.log(receiverAccount, 'getAccountInfo createWithSeedSender');

    if (senderAccount == null) {
        console.log('Creating senderAccount through createAccountWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.createAccountWithSeed({
                fromPubkey: new web3.PublicKey(payer),
                basePubkey: new web3.PublicKey(contractPublicKey),
                newAccountPubkey: createWithSeedSender,
                seed: seedSender,
                lamports: minBalance, // rent exempt
                space: 0,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], minBalance, TestCallSolana);
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }
    
    if (receiverAccount == null) {
        console.log('Creating receiverAccount through createAccountWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.createAccountWithSeed({
                fromPubkey: new web3.PublicKey(payer),
                basePubkey: new web3.PublicKey(contractPublicKey),
                newAccountPubkey: createWithSeedReceiver,
                seed: seedReceiver,
                lamports: minBalance, // rent exempt
                space: 0,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], minBalance, TestCallSolana);
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }

    senderAccount = await connection.getAccountInfo(createWithSeedSender);
    console.log(senderAccount, 'getAccountInfo createWithSeedSender');
    receiverAccount = await connection.getAccountInfo(createWithSeedReceiver);
    console.log(receiverAccount, 'getAccountInfo createWithSeedSender');

    if (senderAccount.lamports < 10000000) {
        console.log('In order to proceed with the transferFromSeed test please fill in at least 0.01 SOL to account ', createWithSeedSender.toString());
    } else {
        console.log('Executing transferWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.transfer({
                fromPubkey: createWithSeedSender,
                basePubkey: new web3.PublicKey(contractPublicKey),
                toPubkey: createWithSeedReceiver,
                lamports: 10000,
                seed: seedSender,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], 0, TestCallSolana);
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});