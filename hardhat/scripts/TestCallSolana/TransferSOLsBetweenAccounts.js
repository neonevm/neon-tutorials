//
//
// Test purpose - in this test we demonstrate 2 accounts ( accounts X & Z ) creation through createAccountWithSeed instruction and then we ask operator to grant payer with 1 SOL, we transfer the 1 SOL from payer to account X and then we execute another transfer from account X to account Y. The idea is to demonstrate a SOL transfer between accounts.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');

async function main() {
    let SOLANA_NODE;
    let TestCallSolanaAddress;
    if (network.name == "neonmainnet") {
        SOLANA_NODE = config.SOLANA_NODE_MAINNET;
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT_MAINNET;
    } else if (network.name == "neondevnet") {
        SOLANA_NODE = config.SOLANA_NODE;
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT;
    }

    const connection = new web3.Connection(SOLANA_NODE, "processed");
    const [user1] = await ethers.getSigners();

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
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

    const payer = ethers.encodeBase58(await TestCallSolana.getPayer());
    console.log(payer, 'payer');

    const contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

     // calculate minimum balance to make account rent-exempt
    const minBalance = await connection.getMinimumBalanceForRentExemption(0);
    console.log(minBalance, 'minBalance');

    const seedSender = 'salt' + Date.now().toString(); // random seed on each script call
    const seedReceiver = seedSender + "1";

    const SenderAccount = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seedSender, web3.SystemProgram.programId);
    console.log(SenderAccount, 'SenderAccount');

    const ReceiverAccount = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seedReceiver, web3.SystemProgram.programId);
    console.log(ReceiverAccount, 'ReceiverAccount');
    
    const senderAccountData = await connection.getAccountInfo(SenderAccount);
    const receiverAccountData = await connection.getAccountInfo(ReceiverAccount);

    // if sender's account has not been created yet
    if (senderAccountData == null) {
        console.log('Creating SenderAccount through createAccountWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.createAccountWithSeed({
                fromPubkey: new web3.PublicKey(payer),
                basePubkey: new web3.PublicKey(contractPublicKey),
                newAccountPubkey: SenderAccount,
                seed: seedSender,
                lamports: minBalance, // rent exempt
                space: 0,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.execute(
            solanaTx.instructions[0], 
            minBalance, 
            TestCallSolana, 
            undefined, 
            user1
        );
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }
    
    // if receiver's account has not been created yet
    if (receiverAccountData == null) {
        console.log('Creating ReceiverAccount through createAccountWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.createAccountWithSeed({
                fromPubkey: new web3.PublicKey(payer),
                basePubkey: new web3.PublicKey(contractPublicKey),
                newAccountPubkey: ReceiverAccount,
                seed: seedReceiver,
                lamports: minBalance, // rent exempt
                space: 0,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.execute(
            solanaTx.instructions[0], 
            minBalance, 
            TestCallSolana, 
            undefined, 
            user1
        );
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }

    console.log(await connection.getAccountInfo(SenderAccount), 'getAccountInfo SenderAccount');
    console.log(await connection.getAccountInfo(ReceiverAccount), 'getAccountInfo SenderAccount');

    // This instruction is only to fill in some SOLs into SenderAccount
    const amount = 1000000000; // 1 SOL, changing this value will reflect on the fee of the transaction on Neon EVM
    // example if we ask for 5 SOLs and we use them then our NEON transaction fee will increase with the equivalence of 5 SOLs in NEONs
    solanaTx = new web3.Transaction();
    solanaTx.add(
        web3.SystemProgram.transfer({
            fromPubkey: new web3.PublicKey(payer),
            toPubkey: new web3.PublicKey(SenderAccount),
            lamports: amount
        })
    );

    // initiate SOL transfer from SenderAccount to ReceiverAccount
    solanaTx.add(
        web3.SystemProgram.transfer({
            fromPubkey: SenderAccount,
            basePubkey: new web3.PublicKey(contractPublicKey),
            toPubkey: ReceiverAccount,
            lamports: amount,
            seed: seedSender,
            programId: web3.SystemProgram.programId
        })
    );
    
    console.log('Processing batchExecute method with all instructions ...');
    [tx, receipt] = await config.utils.batchExecute(
        solanaTx.instructions, 
        [amount, 0], 
        TestCallSolana, 
        undefined, 
        user1
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