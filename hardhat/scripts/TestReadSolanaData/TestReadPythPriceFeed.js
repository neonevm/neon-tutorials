// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const { NEON_CONFIG } = require("../NEON_CONFIG");

async function main() {
    const TestReadPythPriceFeedFactory = await ethers.getContractFactory("TestReadPythPriceFeed");
    const TestReadPythPriceFeedAddress = "0x5347Fc89044D7e24EBBd23328B7f679d0E23a597";
    let TestReadPythPriceFeed;

    if (ethers.isAddress(TestReadPythPriceFeedAddress)) {
        TestReadPythPriceFeed = TestReadPythPriceFeedFactory.attach(TestReadPythPriceFeedAddress);
    } else {
        TestReadPythPriceFeed = await ethers.deployContract("TestReadPythPriceFeed");
        await TestReadPythPriceFeed.waitForDeployment();

        console.log(`TestReadPythPriceFeed deployed to ${TestReadPythPriceFeed.target}`);
    }
    
    let neonPrice = await TestReadPythPriceFeed.readSolanaPythPriceFeed(
        NEON_CONFIG.PYTH_PRICE_FEEDS.NEON_USD,
        208, // offset for current updated price
        8 // length of current updated price
    );
    console.log(neonPrice, 'neonPrice');

    let solPrice = await TestReadPythPriceFeed.readSolanaPythPriceFeed(
        NEON_CONFIG.PYTH_PRICE_FEEDS.SOL_USD,
        208, // offset for current updated price
        8 // length of current updated price
    );
    console.log(solPrice, 'solPrice');

    let ethPrice = await TestReadPythPriceFeed.readSolanaPythPriceFeed(
        NEON_CONFIG.PYTH_PRICE_FEEDS.ETH_USD,
        208, // offset for current updated price
        8 // length of current updated price
    );
    console.log(ethPrice, 'ethPrice');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
