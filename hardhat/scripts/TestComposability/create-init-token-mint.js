const { ethers, network, run } = require("hardhat")
const web3 = require("@solana/web3.js")
const { getMint } = require('@solana/spl-token')
const { deployTestComposabilityContract, getSolanaTransactions } = require("./utils")
const config = require("./config");

async function main(testComposabilityContractAddress = null) {
    await run("compile")

    console.log("\n\u{231B}", "\x1b[33m Testing on-chain formatting and execution of Solana Token program's \x1b[36minitializeMint2\x1b[33m instruction\x1b[0m")

    console.log("\nNetwork name: " + network.name)

    const solanaConnection = new web3.Connection(process.env.SOLANA_NODE, "processed")

    const { deployer, testComposability } = await deployTestComposabilityContract(testComposabilityContractAddress)

    // =================================== Create and initialize new SPL token mint ====================================

    const seed = config.tokenMintSeed[network.name]
    const decimals = config.tokenMintDecimals[network.name]

    console.log('\nCalling testComposability.testCreateInitializeTokenMint: ')

    let tx = await testComposability.connect(deployer).testCreateInitializeTokenMint(
        Buffer.from(seed), // Seed to generate new SPL token mint account on-chain
        decimals, // Decimals value for the new SPL token to be created on Solana
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

    const tokenMint = await testComposability.tokenMint()
    console.log(ethers.encodeBase58(tokenMint), '<-- token mint\n')
    const info = await getMint(solanaConnection, new web3.PublicKey(ethers.encodeBase58(tokenMint)))
    console.log(info, '<-- token mint info')

    console.log("\n\u{2705} \x1b[32mSuccess!\x1b[0m\n")

    return(testComposability.target)
}

module.exports = {
    main
}
