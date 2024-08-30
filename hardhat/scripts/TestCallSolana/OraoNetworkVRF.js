//
//
// Test purpose - in this script we are submitting a VRF request to the Orao Network program.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');
const { AnchorProvider } = require("@coral-xyz/anchor");
const { Orao } = require("@orao-network/solana-vrf");

async function main() {
    let TestCallSolanaAddress;
    if (network.name == "neonmainnet") {
        if (process.env.ANCHOR_PROVIDER_URL != config.SOLANA_NODE_MAINNET || process.env.ANCHOR_WALLET == undefined) {
            return console.log('This script uses the @coral-xyz/anchor library which requires the variables ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set. Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_PROVIDER_URL='+config.SOLANA_NODE_MAINNET+' && export ANCHOR_WALLET=./id.json');
        }
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT_MAINNET;
    } else if (network.name == "neondevnet") {
        if (process.env.ANCHOR_PROVIDER_URL != config.SOLANA_NODE || process.env.ANCHOR_WALLET == undefined) {
            return console.log('This script uses the @coral-xyz/anchor library which requires the variables ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set. Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_PROVIDER_URL='+config.SOLANA_NODE+' && export ANCHOR_WALLET=./id.json');
        }
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT;
    }
    
    const [user1] = await ethers.getSigners();
    const provider = AnchorProvider.env();
    const vrf = new Orao(provider);

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

    const randomKeypair = web3.Keypair.generate();
    const seed = randomKeypair._keypair.publicKey; // use new generated keypair publicKey as VRF seed

    let req = await vrf.request(seed);
    let instruction = await req.build();

    const data = vrf.coder.instruction.encode('requestV2', {seed: instruction._args[0]});
    const programId = vrf.programId;
    const keys = [
        {
            pubkey: new web3.PublicKey(payer),
            isSigner: true,
            isWritable: true
        },
        {
            pubkey: instruction._accounts.networkState,
            isSigner: false,
            isWritable: true
        },
        {
            pubkey: instruction._accounts.treasury,
            isSigner: false,
            isWritable: true
        },
        {
            pubkey: instruction._accounts.request,
            isSigner: false,
            isWritable: true
        },
        {
            pubkey: web3.SystemProgram.programId,
            isSigner: false,
            isWritable: false
        }
    ];

    solanaTx = new web3.Transaction();
    solanaTx.add(
        new web3.TransactionInstruction({
            keys: keys,
            programId: programId,
            data: data
        })
    );

    [tx, receipt] = await config.utils.execute(
        solanaTx.instructions[0], 
        7103920, 
        TestCallSolana,
        undefined,
        user1
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');

    const randomness = await vrf.waitFulfilled(seed);
    console.log(Buffer.from(randomness.randomness).readBigUInt64LE(), 'randomness');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});