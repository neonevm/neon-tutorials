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
    const ERC20ForSPLMintableContractFactory = await ethers.getContractFactory('ERC20ForSPLMintable');
    const ERC20ForSPLMintable = await ethers.deployContract('ERC20ForSPLMintable');
    await ERC20ForSPLMintable.waitForDeployment();
    console.log(ERC20ForSPLMintable.target, 'Beacon\'s implementation');

    // deploy Mintable Factory's implementation
    const ERC20ForSPLMintableFactoryUUPSFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintableFactory');
    const ERC20ForSPLMintableFactoryImpl = await ethers.deployContract('ERC20ForSPLMintableFactory');
    await ERC20ForSPLMintableFactoryImpl.waitForDeployment();
    console.log(ERC20ForSPLMintableFactoryImpl.target, 'Mintable Factory\'s UUPS implementation');

    // deploy Mintable Factory's UUPS proxy
    const ERC1967Proxy = await ethers.getContractFactory('ERC1967Proxy');
    const ERC20ForSPLMintableFactoryProxy = await ERC1967Proxy.deploy(
        ERC20ForSPLMintableFactoryImpl.target,
        ERC20ForSPLMintableFactoryUUPSFactory.interface.encodeFunctionData('initialize', [ERC20ForSPLMintable.target])
    );
    await ERC20ForSPLMintableFactoryProxy.waitForDeployment(); 

    // create Mintable Factory's instance
    const ERC20ForSPLMintableFactoryInstance = ERC20ForSPLMintableFactoryUUPSFactory.attach(ERC20ForSPLMintableFactoryProxy.target);
    console.log(ERC20ForSPLMintableFactoryInstance.target, 'Mintable Factory\'s UUPS proxy address');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});