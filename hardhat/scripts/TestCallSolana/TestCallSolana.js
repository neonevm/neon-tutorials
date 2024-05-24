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
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    createApproveInstruction
 } = require('@solana/spl-token');

async function main() {
    // 1 400 000 compute units = ~8 instructions
    const connection = new web3.Connection("http://proxy.night.stand.neontest.xyz/node-solana", "processed");
    const [owner] = await ethers.getSigners();
    const token = new web3.PublicKey('AE25jac7VDNAuWz7P8fCV16YuXxhKKPmk7gsHt5sJH1e'); // SPLToken on the night stand

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    let TestCallSolanaAddress = "0x56f30F1a39054020be1E2D1dDE7F32B2255D1CdE";
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

    // ============================= SPLTOKEN DEPLOY EXAMPLE??? ====================================
    /* solanaTx = new web3.Transaction();
    let mintKeypair = web3.Keypair.generate();
     // calculate minimum balance to make account rent-exempt
    const tokenMintDataSize = 84;
    const minBalance = await connection.getMinimumBalanceForRentExemption(tokenMintDataSize);
    const seed = "123";
    let createWithSeed = await web3.PublicKey.createWithSeed(mintKeypair.publicKey, seed, new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'));
    console.log(createWithSeed, 'createWithSeed');
    
    solanaTx.add(
        web3.SystemProgram.createAccountWithSeed({
            fromPubkey: new web3.PublicKey(payer),
            newAccountPubkey: createWithSeed,
            basePubkey: mintKeypair.publicKey,
            seed: seed,
            lamports: minBalance,
            space: tokenMintDataSize,
            programId: new web3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
        })
    );
    response = await executeComposabilityMethod(solanaTx.instructions[0], minBalance);
    console.log(response, 'response');
    // createInitializeMint2Instruction(keypair.publicKey, decimals, mintAuthority, freezeAuthority, programId) */

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
        response = await executeComposabilityMethod(solanaTx.instructions[0], 1000000000);
        console.log(response, 'response');
    }

    let ataOwner = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(ownerPublicKey),
        true
    );
    const ownerInfo = await connection.getAccountInfo(ataContract);
    console.log(ownerInfo, 'ownerInfo');
    if (!ownerInfo || !ownerInfo.data) {
        // initialize contract's Token Account
        solanaTx = new web3.Transaction();
        solanaTx.add(
            createAssociatedTokenAccountInstruction(
                new web3.PublicKey(payer),
                ataContract,
                new web3.PublicKey(ownerPublicKey),
                token
            )
        );
        response = await executeComposabilityMethod(solanaTx.instructions[0], 1000000000);
        console.log(response, 'response');
    }

    // ============================= SPLTOKEN ACCOUNT TRANSFER EXAMPLE ====================================
    /* console.log(await getAccount(connection, ataOwner), 'ataOwner');
    solanaTx = new web3.Transaction();
    solanaTx.add(
        createTransferInstruction(
            ataContract,
            ataOwner,
            contractPublicKey,
            1000,
            []
        )
    );
    response = await executeComposabilityMethod(solanaTx.instructions[0], 1000000000);
    console.log(response, 'response');
    console.log(await getAccount(connection, ataOwner), 'ataOwner'); */

    // ============================= SPLTOKEN ACCOUNT APPROVE EXAMPLE ====================================
    /* console.log(await getAccount(connection, ataContract), 'ataContract getAccount');
    solanaTx = new web3.Transaction();
    solanaTx.add(
        createApproveInstruction(
            ataContract,
            ataOwner,
            contractPublicKey,
            2000000 * 10 ** 6
        )
    );
    response = await executeComposabilityMethod(solanaTx.instructions[0], 1000000000);
    console.log(response, 'response');
    console.log(await getAccount(connection, ataContract), 'ataContract getAccount'); */

    async function executeComposabilityMethod(instruction, lamports) {
        let keys = [];
        for (let i = 0, len = instruction.keys.length; i < len; ++i) {
            keys.push({
                account: ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(instruction.keys[i].pubkey.toString())), 32),
                is_signer: instruction.keys[i].isSigner,
                is_writable: instruction.keys[i].isWritable
            });
        }

        let tx = await TestCallSolana.execute(
            ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(instruction.programId.toString())), 32),
            keys,
            instruction.data,
            lamports // lamports
        );
        await tx.wait(3);
        return tx;
    }
    return;

    // ============================= SOL TRANSFER ====================================
    // prepare instruction data
    /* const transaction = new Transaction();
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: new web3.PublicKey(contractPublicKey), // RESOURCE ACCOUNT
            toPubkey: new web3.PublicKey(ownerPublicKey),
            lamports: 1
        })
    );
    console.log(contractPublicKey, 'contractPublicKey');
    console.log(ownerPublicKey, 'ownerPublicKey');
    console.log(transaction.instructions[0].data, 'data');
    
    // Send SOL through composability:
    // instruction#1 createWithSeed account X
    // instruction#2 send SOL to account X
    // instruction#3 initiate transferWithSeed from account X to account Y

    let execute = await TestCallSolana.execute(
        "0x0000000000000000000000000000000000000000000000000000000000000000", // 11111111111111111111111111111111
        [
            {
                account: contractPublicKeyInBytes,
                is_signer: true,
                is_writable: true
            },
            {
                account: ownerPublicKeyInBytes,
                is_signer: false,
                is_writable: true
            }
        ],
        transaction.instructions[0].data, // data
        0 // lamports
    );
    console.log(execute, 'execute');  */

    /* const transaction = new Transaction();
    transaction.add(
        SystemProgram.transfer({
            fromPubkey: new PublicKey(contractPublicKey),
            toPubkey: new PublicKey(ownerPublicKey),
            lamports: 1
        })
    );

    let execute = await TestCallSolana.execute(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        [
            {
                account: contractPublicKeyInBytes,
                is_signer: true,
                is_writable: true
            },
            {
                account: ownerPublicKeyInBytes,
                is_signer: false,
                is_writable: true
            }
        ],
        transaction.instructions[0].data, // data
        0 // lamports
    );
    console.log(execute, 'execute'); */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});