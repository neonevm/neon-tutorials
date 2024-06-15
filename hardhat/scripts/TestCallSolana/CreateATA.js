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
    createAssociatedTokenAccountInstruction
} = require('@solana/spl-token');
const { config } = require('./config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [owner, user1] = await ethers.getSigners();
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

    let payer = ethers.encodeBase58(await TestCallSolana.getPayer());
    console.log(payer, 'payer');

    let contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    let contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    let ownerPublicKeyInBytes = await TestCallSolana.getNeonAddress(owner.address);
    let ownerPublicKey = ethers.encodeBase58(ownerPublicKeyInBytes);
    console.log(ownerPublicKey, 'ownerPublicKey');

    let userPublicKeyInBytes = await TestCallSolana.getNeonAddress(user1.address);
    let user1PublicKey = ethers.encodeBase58(userPublicKeyInBytes);
    console.log(user1PublicKey, 'user1PublicKey');

    const minBalance = await connection.getMinimumBalanceForRentExemption(config.SIZES.SPLTOKEN_ACOUNT);
    console.log(minBalance, 'minBalance');

    // ============================= SPLTOKEN ACCOUNT ATA CREATION EXAMPLE ====================================
    let ataContract = await getAssociatedTokenAddress(
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
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], minBalance, TestCallSolana);
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }

    let ataOwner = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(ownerPublicKey),
        true
    );
    console.log(ataOwner, 'ataOwner');
    
    const ownerInfo = await connection.getAccountInfo(ataOwner);
    console.log(ownerInfo, 'ownerInfo');
    if (!ownerInfo || !ownerInfo.data) {
        // initialize contract's Token Account
        solanaTx = new web3.Transaction();
        solanaTx.add(
            createAssociatedTokenAccountInstruction(
                new web3.PublicKey(payer),
                ataOwner,
                new web3.PublicKey(ownerPublicKey),
                token
            )
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], minBalance, TestCallSolana);
        console.log(tx, 'tx');
        console.log(receipt.logs[0].args, 'receipt args');
    }

    let ataUser1 = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(user1PublicKey),
        true
    );
    
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
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], minBalance, TestCallSolana);
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