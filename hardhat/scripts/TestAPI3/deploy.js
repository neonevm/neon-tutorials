// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, network } = require("hardhat");
const { NEON_CONFIG } = require("../NEON_CONFIG");

async function main() {
  let priceFeeds;
  if (network.name == "neondevnet") {
    priceFeeds = NEON_CONFIG.DEVNET.API3.PRICE_FEEDS;
  } else if (network.name == "neonmainnet") {
    priceFeeds = NEON_CONFIG.MAINNET.API3.PRICE_FEEDS;
  }

  const TestAPI3 = await ethers.deployContract("TestAPI3");
  await TestAPI3.waitForDeployment();

  console.log(`TestAPI3 deployed to ${TestAPI3.target}`);

  for (const key in priceFeeds) {
    console.log(key, await TestAPI3.readDataFeed(priceFeeds[key]));
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
