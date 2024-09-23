//
//
// Test purpose - in this script we will be performing a swap in Raydium DEX. Input swap token is WSOL and output swap token is USDC. In order to initiate the swap the contract's account must have both ATA's initialized before the swap execution ( ATA for WSOL and ATA for USDC )
// !!! Important !!! - Raydium does not support the Solana's Devnet chain thus this tutorial is built on top of Solana Mainnet.
// Note - some of the logic used for this swap test is placed inside the config.js file inside the config.raydiumHelper object.
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    getAccount
} = require('@solana/spl-token');
const {
    Liquidity
} = require('@raydium-io/raydium-sdk');
const { config } = require('./config');

async function main() {
    const [user1] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");

    const swapConfig = {
        tokenAAmount: 0.0001, // Swap 0.0001 SOL for USDC in this example
        TokenA: "So11111111111111111111111111111111111111112", // WSOL
        TokenB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC address
        direction: "in", // Swap direction: 'in' or 'out'
        liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        slippage: 1 // percents
    };

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    let TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT_MAINNET;
    let TestCallSolana;
    let solanaTx;
    let tx;
    let receipt;

    if (ethers.isAddress(TestCallSolanaAddress)) {
        TestCallSolana = TestCallSolanaFactory.attach(TestCallSolanaAddress);
    } else {
        TestCallSolana = await ethers.deployContract("TestCallSolana");
        await TestCallSolana.waitForDeployment();

        TestCallSolanaAddress = TestCallSolana.target;
        console.log(
            `TestCallSolana deployed to ${TestCallSolana.target}`
        );
    }

    const contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    const poolKeys = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenA, swapConfig.TokenB);
    if (!poolKeys) {
        console.error('Pool info not found');
        return 'Pool info not found';
    } else {
        console.log('Found pool info');
    }
    
    const directionIn = poolKeys.quoteMint.toString() == swapConfig.TokenB;
    const { minAmountOut, amountIn } = await config.raydiumHelper.calcAmountOut(connection, poolKeys, swapConfig.tokenAAmount, directionIn, swapConfig.slippage);

    const ataContractTokenA = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenA),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenAInfo = await connection.getAccountInfo(ataContractTokenA);

    const ataContractTokenB = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenB),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenBInfo = await connection.getAccountInfo(ataContractTokenB);

    // in order to proceed with swap the executor account needs to have existing Token Accounts for both tokens
    if (!ataContractTokenAInfo || !ataContractTokenBInfo) {
        if (!ataContractTokenAInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + swapConfig.TokenA + ' ).');
        }
        if (!ataContractTokenBInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB ( ' + swapConfig.TokenB + ' ).');
        }
        return;
    } else if (Number((await getAccount(connection, ataContractTokenA)).amount) < swapConfig.tokenAAmount * 10 ** amountIn.currency.decimals) {
        console.log('Account ' + contractPublicKey + ' does not have enough TokenA ( ' + swapConfig.TokenA + ' ) amount to proceed with the swap execution.');
        return;
    }

    const ins = Liquidity.makeSwapInstruction({
        poolKeys: poolKeys,
        userKeys: {
            tokenAccountIn: ataContractTokenA,
            tokenAccountOut: ataContractTokenB,
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: amountIn.raw,
        amountOut: minAmountOut.raw,
        fixedSide: "in"
    });

    console.log('Processing execute method with Raydium\'s swap instruction ...');
    solanaTx = new web3.Transaction();
    solanaTx.add(ins.innerTransaction.instructions[0]);

    [tx, receipt] = await config.utils.execute(
        solanaTx.instructions[0], 
        0, 
        TestCallSolana,
        undefined,
        user1
    );
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});