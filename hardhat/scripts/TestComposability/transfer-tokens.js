const { ethers, network, run } = require("hardhat")
const web3 = require("@solana/web3.js")
const { deployTestComposabilityContract, getSolanaTransactions } = require("./utils")
const config = require("./config");

async function main(testComposabilityContractAddress = null) {
    await run("compile")

    console.log("\n\u{231B}", "\x1b[33m Testing on-chain formatting and execution of Solana Token program's \x1b[36mtransfer\x1b[33m instruction\x1b[0m")

    console.log("\nNetwork name: " + network.name)

    const solanaConnection = new web3.Connection(process.env.SOLANA_NODE, "processed")

    const { deployer, testComposability } = await deployTestComposabilityContract(testComposabilityContractAddress)

    // =================================== Create and initialize new ATA for Solana recipient ====================================

    const solanaRecipientPublicKey = (await web3.Keypair.generate()).publicKey
    console.log("\nSolana recipient account: " + solanaRecipientPublicKey.toBase58())

    const tokenMintInBytes =  await testComposability.tokenMint()
    const decimals = config.tokenMintDecimals[network.name]

    console.log('\nCalling testComposability.testCreateInitializeATA: ')

    let tx = await testComposability.connect(deployer).testCreateInitializeATA(
        tokenMintInBytes,
        solanaRecipientPublicKey.toBuffer(), // Pass Solana recipient public key as owner
        solanaRecipientPublicKey.toBuffer(), // Pass Solana recipient public key as tokenOwner so that it owns the ATA
    )

    console.log('\nNeonEVM transaction hash: ' + tx.hash)
    await tx.wait(1) // Wait for 1 confirmation
    let txReceipt = await ethers.provider.getTransactionReceipt(tx.hash)
    console.log(txReceipt.status, 'txReceipt.status')

    let solanaTransactions = (await (await getSolanaTransactions(tx.hash)).json()).result

    console.log('\nSolana transactions signatures:')
    for await (let txId of solanaTransactions) {
        console.log(txId)
    }

    console.log("\n")

    const solanaRecipientATAInBytes = await testComposability.getAssociatedTokenAccount(
        tokenMintInBytes,
        solanaRecipientPublicKey.toBuffer(),
    )
    console.log('Created Solana recipient ATA: ' + ethers.encodeBase58(solanaRecipientATAInBytes))

    // ========================== Transfer SPL token amount from deployer ATA to NeonEVM user ATA ======================

    const neonEVMUser = (await ethers.getSigners())[1]
    const neonEVMUserPublicKeyInBytes = await testComposability.getNeonAddress(neonEVMUser.address)
    const neonEVMUserATAInBytes = await testComposability.getAssociatedTokenAccount(
        tokenMintInBytes,
        neonEVMUserPublicKeyInBytes,
    )
    console.log('\nNeonEVM user ATA: ' + ethers.encodeBase58(neonEVMUserATAInBytes))
    let info = await solanaConnection.getTokenAccountBalance(new web3.PublicKey(ethers.encodeBase58(neonEVMUserATAInBytes)))
    console.log('Initial NeonEVM user ATA balance: ' + info.value.uiAmount)

    console.log('\nCalling testComposability.testTransferTokens: ')

    tx = await testComposability.connect(deployer).testTransferTokens(
        tokenMintInBytes,
        neonEVMUserATAInBytes,
        100 * 10 ** decimals // amount (transfer 100 tokens)
    )

    console.log('\nNeonEVM transaction hash: ' + tx.hash)
    await tx.wait(1) // Wait for 1 confirmation
    txReceipt = await ethers.provider.getTransactionReceipt(tx.hash)
    console.log(txReceipt.status, 'txReceipt.status')

    solanaTransactions = (await (await getSolanaTransactions(tx.hash)).json()).result

    console.log('\nSolana transactions signatures:')
    for await (let txId of solanaTransactions) {
        console.log(txId)
    }

    info = await solanaConnection.getTokenAccountBalance(new web3.PublicKey(ethers.encodeBase58(neonEVMUserATAInBytes)))
    console.log('\nNew NeonEVM user ATA balance: ' + info.value.uiAmount)

    // ================== Transfer SPL token amount from NeonEVM user ATA to Solana user ATA============================
    info = await solanaConnection.getTokenAccountBalance(
        new web3.PublicKey(ethers.encodeBase58(solanaRecipientATAInBytes))
    )
    console.log('\nInitial Solana recipient ATA balance: ' + info.value.uiAmount)

    console.log('\nCalling testComposability.testTransferTokens: ')

    tx = await testComposability.connect(neonEVMUser).testTransferTokens(
        tokenMintInBytes,
        solanaRecipientATAInBytes,
        10 * 10 ** decimals // amount (transfer 10 tokens)
    )

    console.log('\nNeonEVM transaction hash: ' + tx.hash)
    await tx.wait(1) // Wait for 1 confirmation
    txReceipt = await ethers.provider.getTransactionReceipt(tx.hash)
    console.log(txReceipt.status, 'txReceipt.status')

    solanaTransactions = (await (await getSolanaTransactions(tx.hash)).json()).result

    console.log('\nSolana transactions signatures:')
    for await (let txId of solanaTransactions) {
        console.log(txId)
    }
    console.log("\n")

    info = await solanaConnection.getTokenAccountBalance(
        new web3.PublicKey(ethers.encodeBase58(solanaRecipientATAInBytes))
    )
    console.log('New Solana user ATA balance: ' + info.value.uiAmount)

    console.log("\n\u{2705} \x1b[32mSuccess!\x1b[0m\n")

    return(testComposability.target)
}

module.exports = {
    main
}
