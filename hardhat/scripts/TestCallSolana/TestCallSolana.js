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
    createTransferInstruction,
    getAccount
 } = require('@solana/spl-token');

async function main() {
    // 1 400 000 compute units = ~8 instructions
    const connection = new web3.Connection("http://proxy.night.stand.neontest.xyz/node-solana", "processed");
    const [owner] = await ethers.getSigners();
    const token = new web3.PublicKey('AE25jac7VDNAuWz7P8fCV16YuXxhKKPmk7gsHt5sJH1e'); // SPLToken on the night stand

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    const TestCallSolanaAddress = "0x40e33C96bd3ffcD4E3ee2c67b3A750D46282EF2E";
    let TestCallSolana;

    if (ethers.isAddress(TestCallSolanaAddress)) {
        TestCallSolana = TestCallSolanaFactory.attach(
            TestCallSolanaAddress
        );
    } else {
        TestCallSolana = await ethers.deployContract("TestCallSolana");
        await TestCallSolana.waitForDeployment();

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
    console.log(await getAccount(connection, ataContract), 'getAccount contract');

    let ataOwner = await getAssociatedTokenAddress(
        token,
        new web3.PublicKey(ownerPublicKey),
        true
    );
    console.log(await getAccount(connection, ataOwner), 'getAccount owner');

    const transaction = new web3.Transaction();
    // token transfer instruction from the contract to owner
    transaction.add(
        createTransferInstruction(
            ataContract,
            ataOwner,
            contractPublicKey,
            1000,
            []
        )
    );

    let instruction = transaction.instructions[0];
    let keys = [];
    for (let i = 0, len = instruction.keys.length; i < len; ++i) {
        keys.push({
            account: ethers.toBeHex(ethers.decodeBase58(instruction.keys[i].pubkey.toString())),
            is_signer: instruction.keys[i].isSigner,
            is_writable: instruction.keys[i].isWritable
        });
    }

    let tx = await TestCallSolana.execute(
        ethers.toBeHex(ethers.decodeBase58(instruction.programId.toString())),
        keys,
        instruction.data,
        0 // lamports
    );
    await tx.wait(3);
    console.log(tx, 'tx');

    console.log(await getAccount(connection, ataOwner), 'getAccount owner');

    /* let ata = await getOrCreateAssociatedTokenAccount(
        connection,
        keypair,
        token,
        new web3.PublicKey(ownerPublicKey),
        true // allow to create ATA for PDAs ( for off-curve accounts )
    );
    console.log(ata, 'ata');

    return; */


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

/* 

curl -X POST --data '{"jsonrpc":"2.0","method":"neon_getTransactionReceipt","params":["0x8c5d43c886aeafdce3bf1fcea32ce13da073046faf5d8a9fb18395d933bedf41"],"id":1}' -H "Content-Type: application/json" http://proxy.night.stand.neontest.xyz/solana | jq


// https://explorer.solana.com/?cluster=custom&customUrl=http://proxy.release.stand.neontest.xyz/node-solana


curl http://proxy.night.stand.neontest.xyz/node-solana -X POST -H "Content-Type: application/json" -d '
  {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "getTransaction",
    "params": [
      "3YHsTkyvfgRTwe2qTmKiZFAaSLSKBfthqc7vAFXpDhzDuXa9BwfMe4obmTrNXdQmtdEhCqNPqPQuPFJWkr66FSd1",
      "json"
    ]
  }
' */



    /* let execute = await TestCallSolana.execute(
        "0x0306466fe5211732ffecadba72c39be7bc8ce5bbc5f7126b2c439b3a40000000",
        [],
        "0x0240420f00",
        0
    );
    console.log(execute, 'execute'); */