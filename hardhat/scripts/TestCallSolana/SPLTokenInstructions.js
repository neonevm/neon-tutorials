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
} = require('@solana/spl-token');
const { config } = require('./config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [owner] = await ethers.getSigners();
    const token = new web3.PublicKey('3Dt135DpvL2BHmHADFwQJPjPBSXJy2BNYygZvRDCRAws'); // SPLToken

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

    let ataContract = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(contractPublicKey),
        true
    );
    console.log(await getAccount(connection, ataContract), 'ataContract');

    let ataOwner = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(ownerPublicKey),
        true
    );
    console.log(await getAccount(connection, ataOwner), 'ataOwner');

    // ============================= SPLTOKEN ACCOUNT APPROVE EXAMPLE ====================================
    console.log('Broadcasting createApproveInstruction instruction ...');
    console.log(await getAccount(connection, ataContract), 'ataContract getAccount');
    let getAccountAtaContract = await getAccount(connection, ataContract);
    console.log(getAccountAtaContract.delegate, 'getAccountAtaContract.delegate');
    console.log(getAccountAtaContract.delegatedAmount, 'getAccountAtaContract.delegatedAmount');
    solanaTx = new web3.Transaction();
    solanaTx.add(
        createApproveInstruction(
            ataContract,
            ataOwner,
            contractPublicKey,
            parseInt(getAccountAtaContract.delegatedAmount) + 1000
        )
    );
    [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], 0, TestCallSolana);
    console.log(tx, 'tx createApproveInstruction');
    console.log(receipt.logs[0].args, 'receipt args createApproveInstruction');
    getAccountAtaContract = await getAccount(connection, ataContract);
    console.log(getAccountAtaContract.delegate, 'getAccountAtaContract.delegate');
    console.log(getAccountAtaContract.delegatedAmount, 'getAccountAtaContract.delegatedAmount');
    
    // ============================= SPLTOKEN ACCOUNT TRANSFER EXAMPLE ====================================
    if (getAccountAtaContract.amount < 1000000000) {
        console.log('In order to proceed with the transfer test please fill in at least 0.1 of the SPLToken to account ', contractPublicKey.toString());
    } else {
        console.log('Broadcasting createTransferInstruction instruction ...');
        solanaTx = new web3.Transaction();
        solanaTx.add(
            createTransferInstruction(
                ataContract,
                ataOwner,
                contractPublicKey,
                10000000,
                []
            )
        );
        [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], 0, TestCallSolana);
        console.log(tx, 'tx createTransferInstruction');
        console.log(receipt.logs[0].args, 'receipt args createTransferInstruction');
        console.log(await getAccount(connection, ataOwner), 'ataOwner');
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});