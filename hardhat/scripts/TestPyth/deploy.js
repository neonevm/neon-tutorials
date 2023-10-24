// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, network } = require("hardhat");
const { NEON_CONFIG } = require('../NEON_CONFIG');

async function main() {
    let pythAddress;
    if (network.name == 'neondevnet') {
        pythAddress = NEON_CONFIG.DEVNET.PYTH.PROXY;
    } else if (network.name == 'neonmainnet') {
        pythAddress = NEON_CONFIG.MAINNET.PYTH.PROXY;
    }
    console.log(pythAddress, 'pythAddress');

    const TestPyth = await ethers.deployContract("TestPyth", [pythAddress]);
    await TestPyth.waitForDeployment();

    console.log(
        `TestPyth deployed to ${TestPyth.target}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});