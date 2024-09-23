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
    getAccount,
    TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const {
    Liquidity,
    TokenAmount,
    Token,
    Percent,
    
} = require('@raydium-io/raydium-sdk');
const { config } = require('../config');

async function main() {
    const [user1] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");

    const addLPConfig = {
        TokenA: config.DATA.SVM.ADDRESSES.USDC,
        TokenB: config.DATA.SVM.ADDRESSES.SOL,
        PoolAB: config.DATA.SVM.ADDRESSES.RAYDIUM_SOL_USDC_POOL,
        //liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        liquidityFile: "raydiumPools.json",
        slippage: 1 // percents
    };

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    let TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT_MAINNET;
    let TestCallSolana;
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

    console.log('\nQuery Raydium pools data ...');
    const poolKeys = await config.raydiumHelper.findPoolInfoForTokens(addLPConfig.liquidityFile, addLPConfig.TokenA, addLPConfig.TokenB);
    if (!poolKeys) {
        console.error('Pool info not found');
        return 'Pool info not found';
    } else {
        console.log('Found pool info');
    }
    const targetPoolInfo = await config.raydiumHelper.formatAmmKeysById(connection, addLPConfig.PoolAB);
    const extraPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

    const ataContractTokenA = await getAssociatedTokenAddress(
        new web3.PublicKey(addLPConfig.TokenA),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenAInfo = await connection.getAccountInfo(ataContractTokenA);

    const ataContractTokenB = await getAssociatedTokenAddress(
        new web3.PublicKey(addLPConfig.TokenB),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenBInfo = await connection.getAccountInfo(ataContractTokenB);

    const ataContractTokenLP = await getAssociatedTokenAddress(
        new web3.PublicKey(targetPoolInfo.lpMint),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenLPInfo = await connection.getAccountInfo(ataContractTokenLP);

    // in order to proceed with swap the executor account needs to have existing Token Accounts for both tokens
    if (!ataContractTokenAInfo || !ataContractTokenBInfo || !ataContractTokenLPInfo) {
        if (!ataContractTokenAInfo) {
            console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + addLPConfig.TokenA + ' ).');
        }
        if (!ataContractTokenBInfo) {
            console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB ( ' + addLPConfig.TokenB + ' ).');
        }
        if (!ataContractTokenLPInfo) {
            console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for LP Token ( ' + targetPoolInfo.lpMint + ' ).');
        }
        return;
    }

    const inputAmount = new TokenAmount(
        new Token(
            TOKEN_PROGRAM_ID, 
            new web3.PublicKey(addLPConfig.TokenA), 
            6
        ),
        10000
    );
    
    const { maxAnotherAmount, anotherAmount, liquidity } = Liquidity.computeAnotherAmount({
        poolKeys,
        poolInfo: { ...targetPoolInfo, ...extraPoolInfo },
        amount: inputAmount,
        anotherCurrency: new Token(
            TOKEN_PROGRAM_ID, 
            new web3.PublicKey(addLPConfig.TokenB), 
            6
        ),
        slippage: new Percent(addLPConfig.slippage, 100)
    });

    console.log(Number(inputAmount.raw), 'inputAmount.raw');
    console.log(Number(maxAnotherAmount.raw), 'maxAnotherAmount.raw');

    const addLiquidityInstruction = Liquidity.makeAddLiquidityInstruction({
        poolKeys,
        userKeys: {
            baseTokenAccount: ataContractTokenB,
            quoteTokenAccount: ataContractTokenA,
            lpTokenAccount: ataContractTokenLP,
            owner: new web3.PublicKey(contractPublicKey)
        },
        baseAmountIn: maxAnotherAmount.raw,
        quoteAmountIn: inputAmount.raw,
        fixedSide: 'a'
    });
    console.log(addLiquidityInstruction.innerTransaction.instructions, 'addLiquidityInstruction');

    /* const addLiquidityInstructionResponse = await Liquidity.makeAddLiquidityInstructionSimple({
        connection,
        poolKeys,
        userKeys: {
            owner: new web3.PublicKey(contractPublicKey),
            tokenAccounts: await config.raydiumHelper.getWalletTokenAccount(connection, new web3.PublicKey(contractPublicKey))
        },
        amountInA: inputAmount,
        amountInB: maxAnotherAmount,
        fixedSide: 'a',
        config: {
            checkCreateATAOwner: true
        }
    }); */

    console.log('Processing execute method with Raydium\'s swap instruction ...');
    [tx, receipt] = await config.utils.execute(
        addLiquidityInstruction.innerTransaction.instructions[0], 
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