// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, network } = require("hardhat");
const { EvmPriceServiceConnection } = require("@pythnetwork/pyth-evm-js");
const { NEON_CONFIG } = require("../NEON_CONFIG");

async function main() {
  const TestPythAddress = ""; // paste here your deployed smart contract address
  if (!ethers.isAddress(TestPythAddress)) {
    console.log("Invalid TestPythAddress");
    return false;
  }

  const TestPyth = await ethers.getContractAt("TestPyth", TestPythAddress);
  const [owner] = await ethers.getSigners();
  const connection = new EvmPriceServiceConnection(
    "https://hermes.pyth.network"
  );

  const priceIds = NEON_CONFIG.PYTH_PRICE_FEEDS;

  const priceUpdateData = await connection.getPriceFeedsUpdateData(
    Object.values(priceIds)
  );

  // fee has to be paid when you update Pyth price feeds
  const fee = await TestPyth.getUpdateFee(priceUpdateData);
  let tx = await TestPyth.connect(owner).updatePriceFeeds(priceUpdateData, {
    value: fee,
  });
  await tx.wait(3);

  for (const key in priceIds) {
    console.log(key, await TestPyth.getPrice(priceIds[key]));
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
