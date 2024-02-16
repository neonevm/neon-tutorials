// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

async function main() {
    const TOKEN_MINT = '0xa4a420d75f056d9cebb8eda13af07965261cb872b129f99b1ac94525ae8fded3'; // Custom SPLToken on Solana Devnet ( C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr )

    const ERC20ForSPLFactoryAddress = '';
    const ERC20ForSPLFactoryInstance = await ethers.getContractAt('ERC20ForSPLFactory', ERC20ForSPLFactoryAddress);

    let tx = await ERC20ForSPLFactoryInstance.deploy(TOKEN_MINT);
    await tx.wait(3);

    console.log(await ERC20ForSPLFactoryInstance.tokensData(TOKEN_MINT), 'tokensData(TOKEN_MINT)');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});