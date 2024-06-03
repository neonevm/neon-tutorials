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
    const [owner] = await ethers.getSigners();
    const token = new web3.PublicKey('3Dt135DpvL2BHmHADFwQJPjPBSXJy2BNYygZvRDCRAws'); // SPLToken

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    let TestCallSolanaAddress = "0xE932db55483ce550779416b3EBbe8b93C028A887";
    let TestCallSolana;
    let solanaTx;
    let response;

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
        response = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], 1000000000, TestCallSolana);
        console.log(response, 'response');
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
        response = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], 1000000000, TestCallSolana);
        console.log(response, 'response');
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});