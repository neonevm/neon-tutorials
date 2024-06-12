// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    createInitializeMint2Instruction
} = require('@solana/spl-token');
const { Metaplex } = require("@metaplex-foundation/js");
const { createCreateMetadataAccountV3Instruction } = require('@metaplex-foundation/mpl-token-metadata');
const { config } = require('./config');

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const [owner] = await ethers.getSigners();

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

    const seed = 'seed' + Date.now().toString(); // random seed on each script call
    const createWithSeed = await web3.PublicKey.createWithSeed(new web3.PublicKey(contractPublicKey), seed, new web3.PublicKey(config.ACCOUNTS.TOKEN_PROGRAM));
    console.log(createWithSeed, 'createWithSeed');

    const minBalance = await connection.getMinimumBalanceForRentExemption(config.SIZES.SPLTOKEN);

    // ============================= createAccountWithSeed INSTRUCTION ====================================
    solanaTx = new web3.Transaction();
    solanaTx.add(
        web3.SystemProgram.createAccountWithSeed({
            fromPubkey: new web3.PublicKey(payer),
            basePubkey: new web3.PublicKey(contractPublicKey),
            newAccountPubkey: createWithSeed,
            seed: seed,
            lamports: minBalance, // enough lamports to make the account rent exempt
            space: config.SIZES.SPLTOKEN,
            programId: new web3.PublicKey(config.ACCOUNTS.TOKEN_PROGRAM) // programId
        })
    );

    // ============================= InitializeMint2 INSTRUCTION ====================================
    solanaTx.add(
        createInitializeMint2Instruction(
            createWithSeed, 
            9, // decimals
            new web3.PublicKey(contractPublicKey), // mintAuthority
            new web3.PublicKey(contractPublicKey), // freezeAuthority
            new web3.PublicKey(config.ACCOUNTS.TOKEN_PROGRAM) // programId
        )
    );

    // ============================= CreateMetadataAccountV3Instruction INSTRUCTION ====================================
    const metaplex = new Metaplex(connection);
    const metadata = metaplex.nfts().pdas().metadata({mint: createWithSeed});
    solanaTx.add(
        createCreateMetadataAccountV3Instruction(
            {
                metadata: metadata,
                mint: createWithSeed,
                mintAuthority: new web3.PublicKey(contractPublicKey),
                payer: new web3.PublicKey(payer),
                updateAuthority: new web3.PublicKey(contractPublicKey)
            },
            {
                createMetadataAccountArgsV3: {
                    data: {
                        name: "Doge coin on Neon EVM",
                        symbol: "DOGE",
                        uri: 'https://ipfs.io/ipfs/QmW2JdmwWsTVLw1Gx4ympCn1VHJiuojfNLS5ZNLEPcBd5x/doge.json',
                        sellerFeeBasisPoints: 0,
                        collection: null,
                        creators: null,
                        uses: null
                    },
                    isMutable: true,
                    collectionDetails: null
                },
            },
        )
    );

    console.log('Executing batchExecuteComposabilityMethod with all instructions ...');
    [tx, receipt] = await config.utils.batchExecuteComposabilityMethod(
        solanaTx.instructions, 
        [minBalance, 0, 100000000], 
        TestCallSolana
    );
    console.log(tx, 'tx');
    for (let i = 0, len = receipt.logs.length; i < len; ++i) {
        console.log(receipt.logs[i].args, ' receipt args instruction #', i);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});