//
//
// Test purpose - in this test we demonstrate 2 accounts ( accounts X & Z ) creation through createAccountWithSeed instruction and then we mint some tokens to account X and initiate a transfer from account to account Y. The idea is to demonstrate a SPLToken transfer between accounts.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');
const {
    ACCOUNT_SIZE,
    TOKEN_PROGRAM_ID,
    createMintToInstruction, 
    createTransferInstruction,
    createInitializeAccount2Instruction
} = require("@solana/spl-token");

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
    const [user1, user2] = await ethers.getSigners();
    const tokenMintPublicKey = '';
    if (tokenMintPublicKey == '') {
        return console.error('Before proceeding with instructions execution please set value for the tokenMintPublicKey variable.');
    }
    const token = new web3.PublicKey(tokenMintPublicKey);

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
    const minBalance = await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE);
    console.log(minBalance, 'minBalance');

    const seedSender = 'salt' + Date.now().toString(); // random seed on each script call
    const seedReceiver = seedSender + "1";

    const SenderAccount = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seedSender, TOKEN_PROGRAM_ID);
    console.log(SenderAccount, 'SenderAccount');

    const ReceiverAccount = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seedReceiver, TOKEN_PROGRAM_ID);
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
                lamports: minBalance,
                space: ACCOUNT_SIZE,
                programId: TOKEN_PROGRAM_ID
            })
        );
        
        solanaTx.add(
            createInitializeAccount2Instruction(
                SenderAccount, 
                token, 
                new web3.PublicKey(contractPublicKey)
            )
        );
        
        [tx, receipt] = await config.utils.batchExecuteComposabilityMethod(
            solanaTx.instructions, 
            [minBalance, 0], 
            TestCallSolana, 
            undefined, 
            user1
        );
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
        console.log(receipt.logs[1].args, 'receipt args');
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
                lamports: minBalance,
                space: ACCOUNT_SIZE,
                programId: TOKEN_PROGRAM_ID
            })
        );

        solanaTx.add(
            createInitializeAccount2Instruction(
                ReceiverAccount, 
                token, 
                new web3.PublicKey(contractPublicKey)
            )
        );
        
        [tx, receipt] = await config.utils.batchExecuteComposabilityMethod(
            solanaTx.instructions, 
            [minBalance, 0], 
            TestCallSolana, 
            undefined, 
            user1
        );
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
        console.log(receipt.logs[1].args, 'receipt args');
    }
 
    console.log(await connection.getAccountInfo(SenderAccount), 'getAccountInfo SenderAccount');
    console.log(await connection.getAccountInfo(ReceiverAccount), 'getAccountInfo SenderAccount');


    console.log('Minting SPLTokens to SenderAccount and transfering them to ReceiverAccount ...');
    solanaTx = new web3.Transaction();
    // This instruction is only to fill in some SPLTokens into ataUser1
    solanaTx.add(
        createMintToInstruction(
            token,
            SenderAccount,
            new web3.PublicKey(contractPublicKey),
            1000 * 10 ** 9 // mint 1000 tokens
        )
    );

    solanaTx.add(
        createTransferInstruction(
            SenderAccount,
            ReceiverAccount,
            contractPublicKey,
            10 * 10 ** 9, // transfers 10 tokens
            []
        )
    );

    console.log('Processing batchExecute method ...');
    [tx, receipt] = await config.utils.batchExecute(
        solanaTx.instructions, 
        [0, 0, 0, 0, 0], 
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