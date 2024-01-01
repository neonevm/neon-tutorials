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
    const NAME = 'Testcoin';
    const SYMBOL = 'TST';
    const DECIMALS = 9;
    const MINT_AMOUNT = ethers.parseUnits('1000', 9);
    // /DEPLOYMENT PARAMS

    const [owner] = await ethers.getSigners();
    const ERC20ForSPLMintableFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintable');
    const ERC20ForSPLMintable = await upgrades.deployProxy(ERC20ForSPLMintableFactory, [
        NAME,
        SYMBOL,
        DECIMALS
    ], {kind: 'uups'});
    await ERC20ForSPLMintable.waitForDeployment();

    const CONTRACT_OWNER = await ERC20ForSPLMintable.owner();
    const IMPLEMENTATION = await upgrades.erc1967.getImplementationAddress(ERC20ForSPLMintable.target);
    const ownerInitialBalance = await ERC20ForSPLMintable.balanceOf(owner.address);

    console.log(
        `ERC20ForSPLMintable proxy deployed to ${ERC20ForSPLMintable.target}`
    );
    console.log(
        `ERC20ForSPLMintable implementation deployed to ${IMPLEMENTATION}`
    );

    let tx = await ERC20ForSPLMintable.mint(owner.address, MINT_AMOUNT);
    await tx.wait(1);

    expect(owner.address).to.eq(CONTRACT_OWNER);
    expect(ownerInitialBalance).to.eq(0);
    expect(await ERC20ForSPLMintable.balanceOf(owner.address)).to.be.greaterThan(ownerInitialBalance);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});