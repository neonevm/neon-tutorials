//
//
// Test purpose - in this script we will ask Payer for 1 SOL and we will submit it to the contract's account address. You will notice how high is the tx fee of the Neon EVM transaction, why? Because we requested 1 SOL to be given to us.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');

async function main() {
    let TestCallSolanaAddress;
    if (network.name == "neonmainnet") {
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT_MAINNET;
    } else if (network.name == "neondevnet") {
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT;
    }

    const [user1] = await ethers.getSigners();

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
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

    const payer = ethers.encodeBase58(await TestCallSolana.getPayer());
    console.log(payer, 'payer');

    const contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    const amount = 10000000; // 0.01 SOL, changing this value will reflect on the fee of the transaction on Neon EVM
    // example if we ask for 5 SOLs and we use them then our NEON transaction fee will increase with the equivalence of 5 SOLs in NEONs

    solanaTx = new web3.Transaction();
    solanaTx.add(
        web3.SystemProgram.transfer({
            fromPubkey: new web3.PublicKey(payer),
            toPubkey: new web3.PublicKey(contractPublicKey),
            lamports: amount
        })
    );
    [tx, receipt] = await config.utils.execute(
        solanaTx.instructions[0], 
        amount, 
        TestCallSolana,
        undefined,
        user1
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});