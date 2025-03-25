const {ethers, network} = require("hardhat")
const config = require("./config")

async function asyncTimeout(timeout) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(), timeout)
    })
}

async function airdropNEON(address, amount) {
    await fetch(process.env.NEON_FAUCET, {
        method: 'POST',
        body: JSON.stringify({"amount": amount, "wallet": address}),
        headers: { 'Content-Type': 'application/json' }
    })
    console.log("\nAirdropping " + ethers.formatUnits(amount.toString(), 0) + " NEON to " + address)
    await asyncTimeout(3000)
}

async function deployTestComposabilityContract(testComposabilityContractAddress = null) {
    if (!process.env.DEPLOYER_KEY) {
        throw new Error("\nMissing private key: DEPLOYER_KEY")
    }
    const deployer = (await ethers.getSigners())[0]

    let deployerBalance = BigInt(await ethers.provider.getBalance(deployer.address))
    const minBalance = ethers.parseUnits("10000", 18) // 10000 NEON
    if(
        deployerBalance < minBalance &&
        parseInt(ethers.formatUnits((minBalance - deployerBalance).toString(), 18)) > 0
    ) {
        await airdropNEON(deployer.address, parseInt(ethers.formatUnits((minBalance - deployerBalance).toString(), 18)))
    }

    const testComposabilityContractFactory = await ethers.getContractFactory("TestComposability")
    let testComposability
    if (!config.testComposability[network.name] && !testComposabilityContractAddress) {
        console.log("\nDeployer address: " + deployer.address)
        deployerBalance = BigInt(await ethers.provider.getBalance(deployer.address))
        console.log("\nDeployer balance: " + ethers.formatUnits(deployerBalance.toString(), 18) + " NEON")

        console.log("\nDeploying TestComposability contract to " + network.name + "...")
        testComposability = await testComposabilityContractFactory.deploy()
        await testComposability.waitForDeployment()
        console.log("\nTestComposability contract deployed to: " + testComposability.target)
    } else {
        const contractAddress = testComposabilityContractAddress ? testComposabilityContractAddress : config.testComposability[network.name]
        console.log("\nTestComposability contract already deployed to: " + contractAddress)
        testComposability = testComposabilityContractFactory.attach(contractAddress)
    }

    return { deployer, testComposability }
}

async function getSolanaTransactions(neonTxHash) {
    return await fetch(process.env.NEON_EVM_NODE, {
        method: 'POST',
        body: JSON.stringify({
            "jsonrpc":"2.0",
            "method":"neon_getSolanaTransactionByNeonTransaction",
            "params":[neonTxHash],
            "id":1
        }),
        headers: { 'Content-Type': 'application/json' }
    })
}

module.exports = {
    deployTestComposabilityContract,
    getSolanaTransactions
}