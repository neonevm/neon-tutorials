// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

async function main() {
    [owner] = ethers.getSigners();

    const ERC20ForSPLFactoryAddress = '';
    const ERC20ForSPLFactoryInstance = await ethers.getContractAt('ERC20ForSPLFactory', ERC20ForSPLFactoryAddress);

    let tx = await ERC20ForSPLFactoryInstance.deploy(
        'Test Token',
        'TST',
        9,
        owner.address
    );
    await tx.wait(3);

    let mintableToken = await ERC20ForSPLFactoryInstance.tokens();
    console.log(mintableToken[mintableToken.length - 1], 'tokensData(TOKEN_MINT)');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});