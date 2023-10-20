// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const { network } = require("hardhat");
const { neonConfig } = require('../neonConfig');

async function main() {
    let priceFeeds;
    if (network.name == 'neondevnet') {
        priceFeeds = neonConfig.DEVNET.ADDRESS.CHAINLINK_PRICE_FEEDS;
    } else if (network.name == 'neonmainnet') {
        priceFeeds = neonConfig.MAINNET.ADDRESS.CHAINLINK_PRICE_FEEDS;
    }

    const TestChainlink = await hre.ethers.deployContract("TestChainlink");
    await TestChainlink.waitForDeployment();

    console.log(
        `TestChainlink deployed to ${TestChainlink.target}`
    );

    for (const key in priceFeeds) {
        let decimals = await TestChainlink.getDecimals(priceFeeds[key]);
        console.log(key, Number(await TestChainlink.getLatestPrice(priceFeeds[key])) / (10 ** Number(decimals)));
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});