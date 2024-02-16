// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
    // deploy Beacon's implementation
    const ERC20ForSPLContractFactory = await ethers.getContractFactory('ERC20ForSPL');
    const ERC20ForSPLImpl = await ethers.deployContract('ERC20ForSPL');
    await ERC20ForSPLImpl.waitForDeployment();
    console.log(ERC20ForSPLImpl.target, 'Beacon\'s implementation');

    // deploy Factory's implementation
    const ERC20ForSPLFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLFactory');
    const ERC20ForSPLFactoryImpl = await ethers.deployContract('ERC20ForSPLFactory');
    await ERC20ForSPLFactoryImpl.waitForDeployment();
    console.log(ERC20ForSPLFactoryImpl.target, 'Factory\'s UUPS implementation');

    // deploy Factory's UUPS proxy
    const ERC1967Proxy = await ethers.getContractFactory('ERC1967Proxy');
    const ERC20ForSPLFactoryProxy = await ERC1967Proxy.deploy(
        ERC20ForSPLFactoryImpl.target,
        ERC20ForSPLFactoryUUPSFactory.interface.encodeFunctionData('initialize', [ERC20ForSPLImpl.target])
    );
    await ERC20ForSPLFactoryProxy.waitForDeployment(); 

    // create Factory's instance
    const ERC20ForSPLFactoryInstance = ERC20ForSPLFactoryUUPSFactory.attach(ERC20ForSPLFactoryProxy.target);
    console.log(ERC20ForSPLFactoryInstance.target, 'Factory\'s UUPS proxy address');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});