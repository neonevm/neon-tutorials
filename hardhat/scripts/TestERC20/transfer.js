// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

async function main() {
    const TestERC20Address = ''; // !!! paste here your deployed smart contract address !!!
    if (!ethers.isAddress(TestERC20Address)) {
        console.log('Invalid TestERC20Address');
        return false;
    }
    
    const [owner] = await ethers.getSigners();
    const receiver = ethers.Wallet.createRandom(); // !!! change this to valid address on production !!!
    const TestERC20 = await ethers.getContractAt('TestERC20', TestERC20Address);

    console.log('Sender balance before transfer', await TestERC20.balanceOf(owner.address));
    console.log('Receiver balance before transfer', await TestERC20.balanceOf(receiver.address));

    let tx = await TestERC20.transfer(receiver, ethers.parseUnits('10', 18));
    await tx.wait(3);

    console.log('Sender balance after transfer', await TestERC20.balanceOf(owner.address));
    console.log('Receiver balance after transfer', await TestERC20.balanceOf(receiver.address));
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});