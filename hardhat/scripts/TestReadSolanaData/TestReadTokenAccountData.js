// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const bs58 = require("bs58");

async function main() {
    const TestReadTokenAccountDataFactory = await ethers.getContractFactory("TestReadTokenAccountData");
    const TestReadTokenAccountDataAddress = "";
    const solanaTokenAccount = "6VAvEN2x6bPxBDc6xcDtnzYUw7cLziBAuadRZmmM8GJD";
    const tokenProgramAccount = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    let TestReadTokenAccountData;

    const solanaTokenAccountHex = "0x" + bs58.decode(solanaTokenAccount).toString("hex");
    console.log("Solana token account converted to hex: ", solanaTokenAccountHex);

    const tokenProgramAccountHex = "0x" + bs58.decode(tokenProgramAccount).toString("hex");
    console.log("Token mint account converted to hex: ", tokenProgramAccountHex);

    if (ethers.isAddress(TestReadTokenAccountDataAddress)) {
        TestReadTokenAccountData = TestReadTokenAccountDataFactory.attach(TestReadTokenAccountDataAddress);
    } else {
        TestReadTokenAccountData = await ethers.deployContract("TestReadTokenAccountData");
        await TestReadTokenAccountData.waitForDeployment();

        console.log(
        `TestReadTokenAccountData token deployed to ${TestReadTokenAccountData.target}`
        );
    }

    const tokenAccountLength = await TestReadTokenAccountData.readSolanaDataAccountLen(solanaTokenAccountHex);
    console.log("Token account length:", tokenAccountLength);

    const readSolanaAccountLamports = await TestReadTokenAccountData.readSolanaAccountLamports(solanaTokenAccountHex);
    console.log("Token account lamports:", readSolanaAccountLamports);

    const readSolanaAccountOwner = await TestReadTokenAccountData.readSolanaAccountOwner(solanaTokenAccountHex);
    console.log("Token account owner:", bs58.encode(Buffer.from(readSolanaAccountOwner.slice(2), "hex")));

    const readSolanaTokenMintAccountOwner = await TestReadTokenAccountData.readSolanaAccountOwner(tokenProgramAccountHex);
    console.log("Token Mint account owner:", bs58.encode(Buffer.from(readSolanaTokenMintAccountOwner.slice(2), "hex")));

    const checkIfSolanaAccountIsExecutable = await TestReadTokenAccountData.checkIfSolanaAccountIsExecutable(solanaTokenAccountHex);
    console.log("Token account check if executable:", checkIfSolanaAccountIsExecutable);

    const checkIfSolanaTokenMintAccountIsExecutable = await TestReadTokenAccountData.checkIfSolanaAccountIsExecutable(tokenProgramAccountHex);
    console.log("Token Mint account check if executable:", checkIfSolanaTokenMintAccountIsExecutable);

    let tokenAccountRawData = await TestReadTokenAccountData.readSolanaDataAccountRaw(
        solanaTokenAccountHex,
        0,
        tokenAccountLength
    );
    console.log("Token account raw data:", tokenAccountRawData);

    let tokenAccountData = await TestReadTokenAccountData.readSolanaTokenAccountData(
        solanaTokenAccountHex,
        0,
        tokenAccountLength
    );
    console.log(
        "Mint account public key: ",
        bs58.encode(Buffer.from(tokenAccountData[0].slice(2), "hex"))
    );
    console.log(
        "Owner account public key: ",
        bs58.encode(Buffer.from(tokenAccountData[1].slice(2), "hex"))
    );
    console.log(
        "Tokens amount: ",
        tokenAccountData[2]
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
