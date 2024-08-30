//
//
// Test purpose - in this script we will perform some of the SPLToken instructions - mintTo, transfers and approve. The Token Mint address have to be defined in the tokenMintPublicKey variable and the Token Mint has to be created by the contract, because the MintTo instruction will fail. First head to MintSPLToken.js test and deploy a SPLToken there.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    getAccount,
    createTransferInstruction,
    createApproveInstruction,
    createMintToInstruction
} = require('@solana/spl-token');
const { config } = require('./config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [user1] = await ethers.getSigners();
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

    const contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    const user1PublicKeyInBytes = await TestCallSolana.getNeonAddress(user1.address);
    const user1PublicKey = ethers.encodeBase58(user1PublicKeyInBytes);
    console.log(user1PublicKey, 'user1PublicKey');

    let ataContract = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(contractPublicKey),
        true
    );

    let ataUser1 = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(user1PublicKey),
        true
    );

    const contractInfo = await connection.getAccountInfo(ataContract);
    const user1Info = await connection.getAccountInfo(ataUser1);
    if ((!contractInfo || !contractInfo.data) || (!user1Info || !user1Info.data)) {
        return console.error('Before proceeding with instructions execution you need to make sure that contract & user1 have their ATAs intialized, this can be done at CreateATA.js file.');
    }

    console.log(await getAccount(connection, ataContract), 'ataContract getAccount');
    console.log(await getAccount(connection, ataUser1), 'ataUser1 getAccount');

    solanaTx = new web3.Transaction();

    // ============================= SPLTOKEN MINT INSTRUCTION ====================================
    solanaTx.add(
        createMintToInstruction(
            token,
            ataContract,
            new web3.PublicKey(contractPublicKey),
            1000 * 10 ** 9 // mint 1000 tokens
        )
    );

    // ============================= SPLTOKEN TRANSFER INSTRUCTION ====================================
    solanaTx.add(
        createTransferInstruction(
            ataContract,
            ataUser1,
            contractPublicKey,
            10 * 10 ** 9, // transfers 10 tokens
            []
        )
    );

    // ============================= SPLTOKEN APPROVE INSTRUCTION ====================================
    solanaTx.add(
        createApproveInstruction(
            ataContract,
            ataUser1,
            contractPublicKey,
            Date.now() // approve amount !!! CHANGE THIS IN PRODUCTION !!!
        )
    );

    console.log('Processing batchExecute method with all instructions ...');
    [tx, receipt] = await config.utils.batchExecute(
        solanaTx.instructions, 
        [0, 0, 0], 
        TestCallSolana,
        undefined,
        user1
    );
    console.log(tx, 'tx');
    for (let i = 0, len = receipt.logs.length; i < len; ++i) {
        console.log(receipt.logs[i].args, ' receipt args instruction #', i);
    }

    console.log(await getAccount(connection, ataContract), 'ataContract getAccount after execution');
    console.log(await getAccount(connection, ataUser1), 'ataUser1 getAccount after execution');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});