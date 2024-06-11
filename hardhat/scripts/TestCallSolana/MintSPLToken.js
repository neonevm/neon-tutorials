// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    createInitializeMint2Instruction,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createMintToInstruction
} = require('@solana/spl-token');
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

    const seed = 'seed' + Date.now().toString(); // random seed on each script call
    const createWithSeed = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seed, new web3.PublicKey(config.ACCOUNTS.TOKEN_PROGRAM));
    console.log(createWithSeed, 'createWithSeed');

    const minBalance = await connection.getMinimumBalanceForRentExemption(config.SIZES.SPLTOKEN);

    // CREATE MINT ACCOUNT
    solanaTx = new web3.Transaction();
    solanaTx.add(
        web3.SystemProgram.createAccountWithSeed({
            fromPubkey: new web3.PublicKey(payer),
            basePubkey: new web3.PublicKey(contractPublicKey),
            newAccountPubkey: createWithSeed,
            seed: seed,
            lamports: minBalance, // enough lamports to make the account rent exempt
            space: config.SIZES.SPLTOKEN,
            programId: new web3.PublicKey(config.ACCOUNTS.TOKEN_PROGRAM) // programId
        })
    );

    // INITIALIZE THE MINT
    solanaTx.add(
        createInitializeMint2Instruction(
            createWithSeed, 
            9, // decimals
            new web3.PublicKey(contractPublicKey), // mintAuthority
            new web3.PublicKey(contractPublicKey), // freezeAuthority
            new web3.PublicKey(config.ACCOUNTS.TOKEN_PROGRAM) // programId
        )
    );

    // CREATE ASSOCIATE TOKEN ACCOUNT FOR THE CONTRACT ACCOUNT
    let ataContract = await getAssociatedTokenAddress(
        createWithSeed,
        new web3.PublicKey(contractPublicKey),
        true
    );
    const minBalanceForATA = await connection.getMinimumBalanceForRentExemption(config.SIZES.SPLTOKEN_ACOUNT);
    solanaTx.add(
        createAssociatedTokenAccountInstruction(
            new web3.PublicKey(payer),
            ataContract,
            new web3.PublicKey(contractPublicKey),
            createWithSeed
        )
    );

    // MINT TO CONTRACT's ATA ACCOUNT
    solanaTx.add(
        createMintToInstruction(
            createWithSeed,
            ataContract,
            new web3.PublicKey(contractPublicKey),
            1000 * 10 ** 9 // mint 1000 tokens
        )
    );

    [tx, receipt] = await config.utils.batchExecuteComposabilityMethod(
        solanaTx.instructions, 
        [minBalance, 0, minBalanceForATA, 0], 
        TestCallSolana
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'createAccountWithSeed receipt args');
    console.log(receipt.logs[1].args, 'createInitializeMint2Instruction receipt args');
    console.log(receipt.logs[2].args, 'createAssociatedTokenAccountInstruction receipt args');
    console.log(receipt.logs[3].args, 'createMintToInstruction receipt args');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});