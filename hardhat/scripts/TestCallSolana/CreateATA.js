//
//
// Test purpose - in this script we will be creating ATA account instructions for the contract and the contract's owner ONLY if their ATA accounts are not currently made yet. ATA account is a primary Token Account. The Token Mint address have to be defined in the tokenMintPublicKey variable. You can place any SPLToken address in that variable or head to MintSPLToken.js test and deploy a SPLToken there. Anyone can create ATA for any account for any Token Mint.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction
} = require('@solana/spl-token');
const { config } = require('./config');
const { SOL } = require("@metaplex-foundation/js");

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [user1, user2] = await ethers.getSigners();
    const tokenMintPublicKey = '';
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

    let user1PublicKeyInBytes = await TestCallSolana.getNeonAddress(user1.address);
    let user1PublicKey = ethers.encodeBase58(user1PublicKeyInBytes);
    console.log(user1PublicKey, 'user1PublicKey');

    let user2PublicKeyInBytes = await TestCallSolana.getNeonAddress(user2.address);
    let user2PublicKey = ethers.encodeBase58(user2PublicKeyInBytes);
    console.log(user2PublicKey, 'user2PublicKey');

    const minBalance = await connection.getMinimumBalanceForRentExemption(config.SIZES.SPLTOKEN_ACOUNT);
    console.log(minBalance, 'minBalance');

    // ============================= SPLTOKEN ACCOUNT ATA CREATION EXAMPLE ====================================
    let ataContract = await getAssociatedTokenAddress( // calculates Token Account PDA of some account
        token,
        new web3.PublicKey(contractPublicKey),
        true
    );
    console.log(ataContract, 'ataContract');

    const contractInfo = await connection.getAccountInfo(ataContract);
    console.log(contractInfo, 'contractInfo');
    if (!contractInfo || !contractInfo.data) {
        // initialize contract's Token Account
        solanaTx = new web3.Transaction();
        solanaTx.add(
            createAssociatedTokenAccountInstruction(
                new web3.PublicKey(payer),
                ataContract,
                new web3.PublicKey(contractPublicKey),
                token
            )
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

    let ataUser1 = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(user1PublicKey),
        true
    );
    console.log(ataUser1, 'ataUser1');
    
    const user1Info = await connection.getAccountInfo(ataUser1);
    console.log(user1Info, 'user1Info');
    if (!user1Info || !user1Info.data) {
        // initialize contract's Token Account
        solanaTx = new web3.Transaction();
        solanaTx.add(
            createAssociatedTokenAccountInstruction(
                new web3.PublicKey(payer),
                ataUser1,
                new web3.PublicKey(user1PublicKey),
                token
            )
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

    let ataUser2 = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(user1PublicKey),
        true
    );
    console.log(ataUser2, 'ataUser2');
    
    const user2Info = await connection.getAccountInfo(ataUser2);
    console.log(user2Info, 'user2Info');
    if (!user2Info || !user2Info.data) {
        // initialize contract's Token Account
        solanaTx = new web3.Transaction();
        solanaTx.add(
            createAssociatedTokenAccountInstruction(
                new web3.PublicKey(payer),
                ataUser2,
                new web3.PublicKey(user2PublicKey),
                token
            )
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
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});