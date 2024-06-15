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

    let payer = ethers.encodeBase58(await TestCallSolana.getPayer());
    console.log(payer, 'payer');

    let contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    let contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    let ownerPublicKeyInBytes = await TestCallSolana.getNeonAddress(owner.address);
    let ownerPublicKey = ethers.encodeBase58(ownerPublicKeyInBytes);
    console.log(ownerPublicKey, 'ownerPublicKey');

    const salt = ethers.encodeBytes32String('salt' + Date.now().toString()); // random seed on each script call
    let getExtAuthority = await TestCallSolana.getExtAuthority(salt);
    console.log(getExtAuthority, 'getExtAuthority');

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

    solanaTx = new web3.Transaction();
    solanaTx.add(
        createApproveInstruction(
            ataContract,
            ethers.encodeBase58(getExtAuthority),
            contractPublicKey,
            2 * 10 ** 9
        )
    );

    console.log('Executing batchExecuteComposabilityMethod with all instructions ...');
    [tx, receipt] = await config.utils.executeComposabilityMethod(
        solanaTx.instructions[0], 
        0, 
        TestCallSolana
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt');

    solanaTx = new web3.Transaction();
    solanaTx.add(
        createTransferInstruction(
            ataContract,
            ataOwner,
            contractPublicKey,
            2 * 10 ** 9, // transfers 10 tokens
            []
        )
    );

    console.log('Executing batchExecuteComposabilityMethod with all instructions ...');
    [tx, receipt] = await config.utils.executeComposabilityMethod(
        solanaTx.instructions[0], 
        0, 
        TestCallSolana,
        salt
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});