//
//
// Test purpose - in this script we will ask Payer for 1 SOL and we will submit it to the contract's account address
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');

async function main() {
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

    const amount = 1000000000; // 1 SOL, changing this value will reflect on the fee of the transaction on Neon EVM

    solanaTx = new web3.Transaction();
    solanaTx.add(
        web3.SystemProgram.transfer({
            fromPubkey: new web3.PublicKey(payer),
            toPubkey: new web3.PublicKey(contractPublicKey),
            lamports: amount
        })
    );
    [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], amount, TestCallSolana);
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});