// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const bs58 = require('bs58');

async function main() {
    const TestReadSolanaDataFactory = await ethers.getContractFactory('TestReadSolanaData');
    const TestReadSolanaDataAddress = '';
    const solanaTokenAccount = '6VAvEN2x6bPxBDc6xcDtnzYUw7cLziBAuadRZmmM8GJD';
    let TestReadSolanaData;
    
    const solanaTokenAccountHex = '0x' + bs58.decode(solanaTokenAccount).toString('hex');

    if (ethers.isAddress(TestReadSolanaDataAddress)) {
        TestReadSolanaData = TestReadSolanaDataFactory.attach(TestReadSolanaDataAddress);
    } else {
        TestReadSolanaData = await ethers.deployContract("TestReadSolanaData");
        await TestReadSolanaData.waitForDeployment();

        console.log(
            `TestReadSolanaData token deployed to ${TestReadSolanaData.target}`
        );
    }

    let tokenAccountRawData = await TestReadSolanaData.readSolanaDataAccountRaw(
        solanaTokenAccountHex, 
        0, 
        await TestReadSolanaData.readSolanaDataAccountLen(solanaTokenAccountHex)
    );
    console.log(tokenAccountRawData, 'tokenAccountRawData');

    let mint = await TestReadSolanaData.readSolanaDataAccountPublicKey(solanaTokenAccountHex, 0, 32);
    console.log(bs58.encode(Buffer.from(mint.slice(2), 'hex')), 'mint');

    let owner = await TestReadSolanaData.readSolanaDataAccountPublicKey(solanaTokenAccountHex, 32, 32);
    console.log(bs58.encode(Buffer.from(owner.slice(2), 'hex')), 'owner');

    let amount = await TestReadSolanaData.readSolanaDataAccountAmount(solanaTokenAccountHex, 64, 8);
    console.log(amount, 'amount');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});