// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

async function main() {
    const [owner] = await ethers.getSigners();

    const ERC20ForSPLMintableFactory = await hre.ethers.getContractFactory('ERC20ForSPLMintable');
    const ERC20ForSPLMintable = await upgrades.deployProxy(ERC20ForSPLMintableFactory, [
        'Testcoin',
        'TST',
        9
    ], {kind: 'uups'});
    await ERC20ForSPLMintable.waitForDeployment();

    console.log(
        `ERC20ForSPLMintable proxy deployed to ${ERC20ForSPLMintable.target}`
    );
    console.log(
        `ERC20ForSPLMintable implementation deployed to ${await upgrades.erc1967.getImplementationAddress(ERC20ForSPLMintable.target)}`
    );

    console.log(await ERC20ForSPLMintable.owner(), 'owner');
    console.log(await ERC20ForSPLMintable.balanceOf(owner.address), 'balanceOf');

    let tx = await ERC20ForSPLMintable.mint(owner.address, ethers.parseUnits('1000', 9));
    await tx.wait(1);

    console.log(await ERC20ForSPLMintable.balanceOf(owner.address), 'balanceOf');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});