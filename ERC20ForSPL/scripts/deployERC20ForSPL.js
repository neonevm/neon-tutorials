// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
    // DEPLOYMENT PARAMS
    const TOKEN_MINT = '0xa4a420d75f056d9cebb8eda13af07965261cb872b129f99b1ac94525ae8fded3'; // Custom SPLToken on Solana Devnet ( C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr ). Make sure to update this value with your SPLToken address when deploying your contract on the Mainnet!!!
    // /DEPLOYMENT PARAMS

    const [owner] = await ethers.getSigners();
    const ERC20ForSPLFactory = await hre.ethers.getContractFactory('ERC20ForSPL');
    const ERC20ForSPL = await upgrades.deployProxy(ERC20ForSPLFactory, [TOKEN_MINT], {
        kind: 'uups', 
        initializer: 'initializeParent'
    });
    await ERC20ForSPL.waitForDeployment();

    const CONTRACT_OWNER = await ERC20ForSPL.owner();
    const IMPLEMENTATION = await upgrades.erc1967.getImplementationAddress(ERC20ForSPL.target);

    console.log(
        `ERC20ForSPL proxy deployed to ${ERC20ForSPL.target}`
    );
    console.log(
        `ERC20ForSPL implementation deployed to ${IMPLEMENTATION}`
    );

    expect(owner.address).to.eq(CONTRACT_OWNER);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});