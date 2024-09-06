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
        TokenADecimals: 9,
        direction: "in", // Swap direction: 'in' or 'out'
        liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        slippage: 1 // percents
    };

    const TestICSFlowFactory = await ethers.getContractFactory("TestICSFlow");
    let TestICSFlowAddress = config.ICS_FLOW_MAINNET;
    let TestICSFlow;
    let tx;
    let receipt;

    if (ethers.isAddress(TestICSFlowAddress)) {
        TestICSFlow = TestICSFlowFactory.attach(TestICSFlowAddress);
    } else {
        TestICSFlow = await ethers.deployContract("TestICSFlow");
        await TestICSFlow.waitForDeployment();

        TestICSFlowAddress = TestICSFlow.target;
        console.log(
            `TestICSFlow deployed to ${TestICSFlow.target}`
        );
    }

    const contractPublicKeyInBytes = await TestICSFlow.getNeonAddress(TestICSFlowAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    let ataContractWSOL = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenA),
        new web3.PublicKey(contractPublicKey),
        true
    );
    //const ataContractInfoWSOL = await connection.getAccountInfo(ataContractWSOL);

    let ataContractUSDC = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenB),
        new web3.PublicKey(contractPublicKey),
        true
    );
    //const ataContractInfoUSDC = await connection.getAccountInfo(ataContractUSDC);

    const user1WBTCTokenAccount = config.utils.calculateTokenAccount(
        config.TOKENS.ADDRESSES.WBTC,
        user1.address,
        new web3.PublicKey('NeonVMyRX5GbCrsAHnUwx1nYYoJAtskU1bWUo6JGNyG')
    );

    /* // in order to proceed with swap the executor account needs to have existing Token Accounts for all of the tokens needed for the swap
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
    } */

    const WSOL = new ethers.Contract(
        config.TOKENS.ADDRESSES.WSOL,
        config.TOKENS.ABIs.ERC20ForSPL,
        ethers.provider
    );

    console.log('\nQuery Raydium pool #1 data ...');
    const poolKeysPool1 = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenA, swapConfig.TokenB);
    if (!poolKeysPool1) {
        console.error('Pool info not found');
        return 'Pool #1 info not found';
    } else {
        console.log('Found pool #1 info');
    }

    console.log('\nQuery Raydium pool #2 data ...');
    const poolKeysPool2 = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenB, swapConfig.TokenC);
    if (!poolKeysPool2) {
        console.error('Pool info not found');
        return 'Pool #2 info not found';
    } else {
        console.log('Found pool #2 info');
    }

    // BUILD RAYDIUM SWAP #1 INSTRUCTION
    const [amountInPool1, , minAmountOutPool1] = await config.raydiumHelper.calcAmountOut(
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
            tokenAccountIn: ataContractWSOL,
            tokenAccountOut: ataContractUSDC,
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: amountInPool1.raw,
        amountOut: minAmountOutPool1.raw,
        fixedSide: "in"
    });
    // /BUILD RAYDIUM SWAP #1 INSTRUCTION

    // BUILD RAYDIUM SWAP #2 INSTRUCTION
    const [amountInPool2, , minAmountOutPool2] = await config.raydiumHelper.calcAmountOut(
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
            tokenAccountIn: ataContractUSDC,
            tokenAccountOut: user1WBTCTokenAccount[0],
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: amountInPool2.raw,
        amountOut: minAmountOutPool2.raw,
        fixedSide: "in"
    });
    // BUILD RAYDIUM SWAP #2 INSTRUCTION
    
    console.log('\nBroadcast WSOL approval ... ');
    tx = await WSOL.connect(user1).approve(TestICSFlowAddress, swapConfig.tokenAAmount * 10 ** swapConfig.TokenADecimals);
    await tx.wait(1);
    console.log(tx, 'tx');

    console.log('\nBroadcast Raydium multihop swap WSOL -> USDC -> WBTC ... ');
    tx = await TestICSFlow.connect(user1).batchExecute(
        config.TOKENS.ADDRESSES.WSOL,
        config.TOKENS.ADDRESSES.WBTC,
        swapConfig.tokenAAmount * 10 ** swapConfig.TokenADecimals,
        ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(ataContractWSOL.toBase58())), 32),
        [0, 0], 
        [
            '0x0000000000000000000000000000000000000000000000000000000000000000',
            '0x0000000000000000000000000000000000000000000000000000000000000000'
        ],
        [
            config.utils.prepareInstructionData(swap1Instruction.innerTransaction.instructions[0]),
            config.utils.prepareInstructionData(swap2Instruction.innerTransaction.instructions[0])
        ]
    );
    receipt = await tx.wait(1);
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