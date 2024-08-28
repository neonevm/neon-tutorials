//
//
// Test purpose - in this script we will requesting the createResource method of the SolanaCall precompile. We will be passing a random generated salt which can also be passed to method getResourceAddress in order to get the account address previously made by the createResource instruction. This method can be used to create account with any size defined by us ( can be used instead of createAccountWithSeed )
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    ACCOUNT_SIZE,
    TOKEN_PROGRAM_ID
} = require("@solana/spl-token");
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

    // ============================= SPLTOKEN ACCOUNT ATA CREATION EXAMPLE ====================================
    console.log('Creating SPLToken account through createResource method ...');
    let salt = ethers.encodeBytes32String('salt' + Date.now().toString()); // random seed on each script call
    tx = await TestCallSolana.createResource(
        salt,
        ACCOUNT_SIZE,
        await connection.getMinimumBalanceForRentExemption(ACCOUNT_SIZE),
        config.utils.publicKeyToBytes32(TOKEN_PROGRAM_ID)
    );
    receipt = await tx.wait(3);
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');
    
    let getResourceAddress = await TestCallSolana.connect(user1).getResourceAddress(salt);
    console.log(getResourceAddress, 'getResourceAddress');

    // ============================= ACCOUNT CREATION EXAMPLE ====================================
    console.log('Creating Account through createResource method ...');
    salt = ethers.encodeBytes32String('salt' + Date.now().toString()); // random seed on each script call
    tx = await TestCallSolana.createResource(
        salt,
        0,
        await connection.getMinimumBalanceForRentExemption(0),
        config.utils.publicKeyToBytes32(web3.SystemProgram.programId)
    );
    receipt = await tx.wait(3);
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');
    
    getResourceAddress = await TestCallSolana.connect(user1).getResourceAddress(salt);
    console.log(getResourceAddress, 'getResourceAddress');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});