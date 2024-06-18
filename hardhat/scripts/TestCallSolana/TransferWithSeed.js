//
//
// Test purpose - in this test we demonstrate 2 accounts ( accounts X & Z ) creation through createAccountWithSeed instruction and then we ask operator to grant payer with 1 SOL, we transfer the 1 SOL from payer to account X and then we execute another transfer from account X to account Y.
//
//

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

    const amount = 1000000000; // 1 SOL, changing this value will reflect on the fee of the transaction on Neon EVM
    solanaTx = new web3.Transaction();
    solanaTx.add(
        web3.SystemProgram.transfer({
            fromPubkey: new web3.PublicKey(payer),
            toPubkey: new web3.PublicKey(createWithSeedSender),
            lamports: amount
        })
    );

    solanaTx.add(
        web3.SystemProgram.transfer({
            fromPubkey: createWithSeedSender,
            basePubkey: new web3.PublicKey(contractPublicKey),
            toPubkey: createWithSeedReceiver,
            lamports: amount,
            seed: seedSender,
            programId: web3.SystemProgram.programId
        })
    );
    console.log('Executing batchExecuteComposabilityMethod with all instructions ...');
    [tx, receipt] = await config.utils.batchExecuteComposabilityMethod(
        solanaTx.instructions, 
        [amount, 0], 
        TestCallSolana
    );
    console.log(tx, 'tx');
    for (let i = 0, len = receipt.logs.length; i < len; ++i) {
        console.log(receipt.logs[i].args, ' receipt args instruction #', i);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});