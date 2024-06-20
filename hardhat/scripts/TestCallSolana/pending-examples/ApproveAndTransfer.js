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
    const [user1, user2] = await ethers.getSigners();

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

    let user1PublicKeyInBytes = await TestCallSolana.getNeonAddress(user2.address);
    let user1PublicKey = ethers.encodeBase58(user1PublicKeyInBytes);
    console.log(user1PublicKey, 'user1PublicKey');

    let user2PublicKeyInBytes = await TestCallSolana.getNeonAddress(user2.address);
    let user2PublicKey = ethers.encodeBase58(user2PublicKeyInBytes);
    console.log(user2PublicKey, 'user2PublicKey');

    // ============================= SOL TRANSFER EXAMPLE ( createAccountWithSeed + transferWithSeed ) ====================================
     // calculate minimum balance to make account rent-exempt
    const minBalance = await connection.getMinimumBalanceForRentExemption(0);
    console.log(minBalance, 'minBalance');

    let user1Salt = ethers.sha256(user1.address);
    user1Salt = user1Salt.slice(2, 34);

    let user2Salt = ethers.sha256(user2.address);
    user2Salt = user2Salt.slice(2, 34);

    let user1SeedAccount = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), user1Salt, web3.SystemProgram.programId);
    console.log(user1SeedAccount, 'user1SeedAccount');

    let user2SeedAccount = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), user2.address, web3.SystemProgram.programId);
    console.log(user2SeedAccount, 'user2SeedAccount');
    
    let user1Account = await connection.getAccountInfo(user1SeedAccount);
    console.log(user1Account, 'getAccountInfo user1Account');
    let user2Account = await connection.getAccountInfo(user2SeedAccount);
    console.log(user2Account, 'getAccountInfo user2Account');

    if (user1Account == null) {
        console.log('Creating user1Account through createAccountWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.createAccountWithSeed({
                fromPubkey: new web3.PublicKey(payer),
                basePubkey: new web3.PublicKey(contractPublicKey),
                newAccountPubkey: user1SeedAccount,
                seed: user1Salt,
                lamports: minBalance, // rent exempt
                space: 0,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(
            solanaTx.instructions[0], 
            minBalance, 
            TestCallSolana,
            undefined,
            user1
        );
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }
    
    if (user2Account == null) {
        console.log('Creating user2Account through createAccountWithSeed instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            web3.SystemProgram.createAccountWithSeed({
                fromPubkey: new web3.PublicKey(payer),
                basePubkey: new web3.PublicKey(contractPublicKey),
                newAccountPubkey: user2SeedAccount,
                seed: user2Salt,
                lamports: minBalance, // rent exempt
                space: 0,
                programId: web3.SystemProgram.programId
            })
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(
            solanaTx.instructions[0], 
            minBalance, 
            TestCallSolana,
            undefined,
            user2
        );
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }

    user1Account = await connection.getAccountInfo(user1SeedAccount);
    console.log(user1Account, 'getAccountInfo user1SeedAccount');
    user2Account = await connection.getAccountInfo(user2SeedAccount);
    console.log(user2Account, 'getAccountInfo user1SeedAccount');


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});