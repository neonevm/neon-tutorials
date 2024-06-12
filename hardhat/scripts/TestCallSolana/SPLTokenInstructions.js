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
    getAccount,
    createTransferInstruction,
    createApproveInstruction,
    createMintToInstruction
} = require('@solana/spl-token');
const { config } = require('./config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [owner] = await ethers.getSigners();
    const tokenAddress = '';
    if (tokenAddress == '') {
        return console.error('Before proceeding with instructions execution please set value for the tokenAddress variable.');
    }
    const token = new web3.PublicKey(tokenAddress);

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

    let contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    let contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    let ownerPublicKeyInBytes = await TestCallSolana.getNeonAddress(owner.address);
    let ownerPublicKey = ethers.encodeBase58(ownerPublicKeyInBytes);
    console.log(ownerPublicKey, 'ownerPublicKey');

    let ataContract = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(contractPublicKey),
        true
    );

    let ataOwner = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(ownerPublicKey),
        true
    );

    const contractInfo = await connection.getAccountInfo(ataContract);
    const ownerInfo = await connection.getAccountInfo(ataOwner);
    if ((!contractInfo || !contractInfo.data) || (!ownerInfo || !ownerInfo.data)) {
        return console.error('Before proceeding with instructions execution you need to make sure about contract & owner have their ATAs intialized, this can be done at CreateATA.js file.');
    }

    console.log(await getAccount(connection, ataContract), 'ataContract getAccount');
    console.log(await getAccount(connection, ataOwner), 'ataOwner getAccount');

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
            ataOwner,
            contractPublicKey,
            10 * 10 ** 9, // transfers 10 tokens
            []
        )
    );

    // ============================= SPLTOKEN APPROVE INSTRUCTION ====================================
    solanaTx.add(
        createApproveInstruction(
            ataContract,
            ataOwner,
            contractPublicKey,
            Date.now() // approve amount !!! CHANGE THIS IN PRODUCTION !!!
        )
    );

    console.log('Executing batchExecuteComposabilityMethod with all instructions ...');
    [tx, receipt] = await config.utils.batchExecuteComposabilityMethod(
        solanaTx.instructions, 
        [0, 0, 0], 
        TestCallSolana
    );
    console.log(tx, 'tx');
    for (let i = 0, len = receipt.logs.length; i < len; ++i) {
        console.log(receipt.logs[i].args, ' receipt args instruction #', i);
    }

    console.log(await getAccount(connection, ataContract), 'ataContract getAccount after execution');
    console.log(await getAccount(connection, ataOwner), 'ataOwner getAccount after execution');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});