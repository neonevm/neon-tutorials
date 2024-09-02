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
const { config } = require('../config');

async function main() {
    const [user1] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");

    const swapConfig = {
        tokenAAmount: 0.0001, // Swap 0.0001 SOL for USDC in this example
        TokenA: "So11111111111111111111111111111111111111112", // WSOL
        TokenB: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC address
        TokenC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh", // WBTC address
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

    const ataContractTokenC = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenC),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenCInfo = await connection.getAccountInfo(ataContractTokenC);

    // in order to proceed with swap the executor account needs to have existing Token Accounts for all of the tokens needed for the swap
    if (!ataContractTokenAInfo || !ataContractTokenBInfo || !ataContractTokenCInfo) {
        if (!ataContractTokenAInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + swapConfig.TokenA + ' ).');
        }
        if (!ataContractTokenBInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB ( ' + swapConfig.TokenB + ' ).');
        }
        if (!ataContractTokenCInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenC ( ' + swapConfig.TokenC + ' ).');
        }
        return;
    }  else if (Number((await getAccount(connection, ataContractTokenA)).amount) < swapConfig.tokenAAmount * 10 ** 9) {
        console.log('Account ' + contractPublicKey + ' does not have enough TokenA ( ' + swapConfig.TokenA + ' ) amount to proceed with the swap execution.');
        return;
    }

    const poolKeysPool1 = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenA, swapConfig.TokenB);
    if (!poolKeysPool1) {
        console.error('Pool info not found');
        return 'Pool #1 info not found';
    } else {
        console.log('Found pool #1 info');
    }

    const poolKeysPool2 = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenB, swapConfig.TokenC);
    if (!poolKeysPool2) {
        console.error('Pool info not found');
        return 'Pool #2 info not found';
    } else {
        console.log('Found pool #2 info');
    }
    
    solanaTx = new web3.Transaction();

    // BUILD RAYDIUM SWAP #1 INSTRUCTION
    const [amountInPool1, ,minAmountOutPool1] = await config.raydiumHelper.calcAmountOut(
        Liquidity, 
        connection, 
        poolKeysPool1, 
        swapConfig.tokenAAmount, 
        poolKeysPool1.quoteMint.toString() == swapConfig.TokenB,
        0 // 0 slippage for the first swap
    );
    
    const swap1Instruction = Liquidity.makeSwapInstruction({
        poolKeys: poolKeysPool1,
        userKeys: {
            tokenAccountIn: ataContractTokenA,
            tokenAccountOut: ataContractTokenB,
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: amountInPool1.raw,
        amountOut: minAmountOutPool1.raw,
        fixedSide: "in"
    });
    solanaTx.add(swap1Instruction.innerTransaction.instructions[0]);
    // /BUILD RAYDIUM SWAP #1 INSTRUCTION

    // BUILD RAYDIUM SWAP #2 INSTRUCTION
    const [amountInPool2, ,minAmountOutPool2] = await config.raydiumHelper.calcAmountOut(
        Liquidity, 
        connection, 
        poolKeysPool2, 
        Number(minAmountOutPool1.raw / 10 ** 6), // divide by USDC decimals
        poolKeysPool2.quoteMint.toString() == swapConfig.TokenC, 
        swapConfig.slippage
    );

    const swap2Instruction = Liquidity.makeSwapInstruction({
        poolKeys: poolKeysPool2,
        userKeys: {
            tokenAccountIn: ataContractTokenB,
            tokenAccountOut: ataContractTokenC,
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: amountInPool2.raw,
        amountOut: minAmountOutPool2.raw,
        fixedSide: "in"
    });
    solanaTx.add(swap2Instruction.innerTransaction.instructions[0]);
    // BUILD RAYDIUM SWAP #2 INSTRUCTION

    console.log('\nProcessing batchExecute method ...');
    [tx, receipt] = await config.utils.batchExecute(
        solanaTx.instructions,
        [0, 0], 
        TestCallSolana,
        undefined,
        user1
    );
    console.log(tx, 'tx');
    for (let i = 0, len = receipt.logs.length; i < len; ++i) {
        console.log(receipt.logs[i].args, ' receipt args instruction #', i);
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});