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
    const solanaAccount = '0x5181e94d818ee4f3f26c9fa90443d8b894de38fd19eb8274f3747aa1e5c053da'; //6VAvEN2x6bPxBDc6xcDtnzYUw7cLziBAuadRZmmM8GJD
    let TestReadSolanaData;

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
        solanaAccount, 
        0, 
        await TestReadSolanaData.readSolanaDataAccountLen(solanaAccount)
    );
    console.log(tokenAccountRawData, 'tokenAccountRawData');

    let mint = await TestReadSolanaData.readSolanaDataAccountPublicKey(solanaAccount, 0, 32);
    console.log(bs58.encode(Buffer.from(mint.slice(2), 'hex')), 'mint');

    let owner = await TestReadSolanaData.readSolanaDataAccountPublicKey(solanaAccount, 32, 32);
    console.log(bs58.encode(Buffer.from(owner.slice(2), 'hex')), 'owner');

    let amount = await TestReadSolanaData.readSolanaDataAccountAmount(solanaAccount, 64, 8);
    console.log(amount, 'amount');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});