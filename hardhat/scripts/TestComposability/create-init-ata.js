const { ethers, network, run } = require("hardhat")
const web3 = require("@solana/web3.js")
const { deployTestComposabilityContract, getSolanaTransactions } = require("./utils")

async function main(testComposabilityContractAddress = null) {
    await run("compile")

    console.log("\n\u{231B}", "\x1b[33m Testing on-chain formatting and execution of Solana Token program's \x1b[36minitializeAccount2\x1b[33m instruction\x1b[0m")

    console.log("\nNetwork name: " + network.name)

    const solanaConnection = new web3.Connection(process.env.SOLANA_NODE, "processed")

    const { deployer, testComposability } = await deployTestComposabilityContract(testComposabilityContractAddress)

    // =================================== Create and initialize new ATA for deployer ====================================

    const tokenMintInBytes =  await testComposability.tokenMint()

    console.log('\nCalling testComposability.testCreateInitializeATA: ')

    let tx = await testComposability.connect(deployer).testCreateInitializeATA(
        tokenMintInBytes,
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), // Leave owner field empty so that msg.sender controls the ATA through TestComposability contract
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), // Leave tokenOwner field empty so that TestComposability contract owns the ATA
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
    console.log('\n')

    const deployerPublicKeyInBytes = await testComposability.getNeonAddress(deployer.address)
    let ata = await testComposability.getAssociatedTokenAccount(
        tokenMintInBytes,
        deployerPublicKeyInBytes,
    )
    console.log(ethers.encodeBase58(ata), '<-- deployer ATA')
    let info = await solanaConnection.getTokenAccountBalance(new web3.PublicKey(ethers.encodeBase58(ata)))
    console.log(info, '<-- deployer ATA info')

    // =================================== Create and initialize new ATA for third party NeonEVM user ====================================

    const neonEVMUser = (await ethers.getSigners())[1]
    const neonEVMUserPublicKeyInBytes = await testComposability.getNeonAddress(neonEVMUser.address)

    console.log('\nCalling testComposability.testCreateInitializeATA: ')

    tx = await testComposability.connect(deployer).testCreateInitializeATA(
        tokenMintInBytes,
        neonEVMUserPublicKeyInBytes, // Pass NeonEVM user public key so that neonEVMUser controls the ATA through TestComposability contract
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), // Leave tokenOwner field empty so that TestComposability contract owns the ATA
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
    console.log('\n')

    ata = await testComposability.getAssociatedTokenAccount(
        tokenMintInBytes,
        neonEVMUserPublicKeyInBytes,
    )
    console.log(ethers.encodeBase58(ata), '<-- NeonEVM user ATA')
    info = await solanaConnection.getTokenAccountBalance(new web3.PublicKey(ethers.encodeBase58(ata)))
    console.log(info, '<-- NeonEVM user ATA info')

    console.log("\n\u{2705} \x1b[32mSuccess!\x1b[0m\n")

    return(testComposability.target)
}

module.exports = {
    main
}
