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
    WSOL,
} = require('@raydium-io/raydium-sdk');
const { config } = require('../config');

async function main() {
    const [owner, user2] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");

    let TestVaultCraftFlowAddress = config.VAULTCRAFT_FLOW_MAINNET;
    const TestVaultCraftFlowFactory = await ethers.getContractFactory("TestVaultCraftFlow");
    let TestVaultCraftFlow;
    let tx;
    const userDeposit = 0.01; // 1 USDC

    const swapConfig = {
        tokenAAmount: (userDeposit * 0.9) / 2, // 10% from the deposits stay as floating amount
        TokenA: config.DATA.SVM.ADDRESSES.USDC,
        TokenB: config.DATA.SVM.ADDRESSES.SOL,
        PoolAB: config.DATA.SVM.ADDRESSES.RAYDIUM_SOL_USDC_POOL,
        TokenADecimals: 6,
        TokenBDecimals: 9,
        direction: "in", // Swap direction: 'in' or 'out'
        //liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        liquidityFile: "raydiumPools.json",
        slippage: 0 // percents
    };

    const addLpConfig = {
        slippage: 5
    };

    if (ethers.isAddress(TestVaultCraftFlowAddress)) {
        TestVaultCraftFlow = TestVaultCraftFlowFactory.attach(TestVaultCraftFlowAddress);
        console.log(
            `TestVaultCraftFlow at ${TestVaultCraftFlow.target}`
        );
    } else {
        TestVaultCraftFlow = await ethers.deployContract("TestVaultCraftFlow", [
            owner.address
        ]);
        await TestVaultCraftFlow.waitForDeployment();

        TestVaultCraftFlowAddress = TestVaultCraftFlow.target;
        console.log(
            `TestVaultCraftFlow deployed to ${TestVaultCraftFlow.target}`
        );
    }

    const contractPublicKeyInBytes = await TestVaultCraftFlow.getNeonAddress(TestVaultCraftFlowAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    console.log('\nQuery Raydium pools data ...');
    const poolKeys = await config.raydiumHelper.findPoolInfoForTokens(swapConfig.liquidityFile, swapConfig.TokenA, swapConfig.TokenB);
    if (!poolKeys) {
        console.error('Pool info not found');
        return 'Pool info not found';
    } else {
        console.log('Found pool info');
    }

    const targetPoolInfo = await config.raydiumHelper.formatAmmKeysById(connection, swapConfig.PoolAB);
    const extraPoolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

    const ataContractTokenA = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenA),
        new web3.PublicKey(contractPublicKey),
        true
    );
    try {
        await getAccount(connection, ataContractTokenA);
    } catch(err) {
        return console.error('\nAccount ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + swapConfig.TokenA + ' ).');
    }

    const ataContractTokenB = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenB),
        new web3.PublicKey(contractPublicKey),
        true
    );
    try {
        await getAccount(connection, ataContractTokenB);
    } catch(err) {
        return console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB ( ' + swapConfig.TokenB + ' ).');
    }

    const ataContractTokenLP = await getAssociatedTokenAddress(
        new web3.PublicKey(targetPoolInfo.lpMint),
        new web3.PublicKey(contractPublicKey),
        true
    );
    try {
        await getAccount(connection, ataContractTokenLP);
    } catch(err) {
        return console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for LP Token ( ' + targetPoolInfo.lpMint + ' ).');
    }

    console.log(ataContractTokenA, 'ataContractTokenA');
    console.log(ataContractTokenB, 'ataContractTokenB');
    console.log(ataContractTokenLP, 'ataContractTokenLP');

    const USDC = new ethers.Contract(
        config.DATA.EVM.ADDRESSES.USDC,
        config.DATA.EVM.ABIs.ERC20ForSPL,
        ethers.provider
    );

    console.log('\nBroadcast USDC approval ... ');
    tx = await USDC.connect(user2).approve(TestVaultCraftFlowAddress, userDeposit * 10 ** swapConfig.TokenADecimals);
    await tx.wait(1);
    console.log(tx, 'tx');

    console.log('\nBroadcast USDC deposit ... ');
    tx = await TestVaultCraftFlow.connect(user2).deposit(config.DATA.EVM.ADDRESSES.USDC, userDeposit * 10 ** swapConfig.TokenADecimals);
    await tx.wait(1);
    console.log(tx, 'tx');

    // BUILD SWAP INSTRUCTION
    let [amountIn, , minAmountOut] = await config.raydiumHelper.calcAmountOut(
        connection, 
        poolKeys, 
        swapConfig.tokenAAmount, 
        poolKeys.quoteMint.toString() == swapConfig.TokenB, 
        swapConfig.slippage
    );
    console.log(Number(amountIn.raw), 'amountIn');
    console.log(Number(minAmountOut.raw), 'minAmountOut');

    const raydiumSwap = Liquidity.makeSwapInstruction({
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
    console.log(raydiumSwap.innerTransaction.instructions, 'raydiumSwap');
    // /BUILD SWAP INSTRUCTION

    const inputAmount = new TokenAmount(
        new Token(
            TOKEN_PROGRAM_ID,
            new web3.PublicKey(swapConfig.TokenB),
            swapConfig.TokenBDecimals
        ),
        minAmountOut.raw
    );
    
    const { maxAnotherAmount, anotherAmount, liquidity } = Liquidity.computeAnotherAmount({
        poolKeys,
        poolInfo: { ...targetPoolInfo, ...extraPoolInfo },
        amount: inputAmount,
        anotherCurrency: new Token(
            TOKEN_PROGRAM_ID,
            new web3.PublicKey(swapConfig.TokenA),
            swapConfig.TokenADecimals
        ),
        slippage: new Percent(addLpConfig.slippage, 100)
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
        baseAmountIn: inputAmount.raw,
        quoteAmountIn: maxAnotherAmount.raw,
        fixedSide: 'a'
    });
    console.log(addLiquidityInstruction.innerTransaction.instructions, 'addLiquidityInstruction');

    console.log('\nBroadcast Raydium swap USDC -> RAY & Raydium deposit LP to USDC/ RAY pool ... ');
    tx = await TestVaultCraftFlow.connect(owner).depositIntoRaydium(
        config.DATA.EVM.ADDRESSES.USDC,
        userDeposit * 10 ** swapConfig.TokenADecimals,
        config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.RAYDIUM_PROGRAM),
        [
            config.utils.prepareInstructionData(raydiumSwap.innerTransaction.instructions[0]),
            config.utils.prepareInstructionData(addLiquidityInstruction.innerTransaction.instructions[0])
        ],
        [
            config.utils.prepareInstructionAccounts(raydiumSwap.innerTransaction.instructions[0]),
            config.utils.prepareInstructionAccounts(addLiquidityInstruction.innerTransaction.instructions[0])
        ]
    );
    await tx.wait(1);
    console.log(tx, 'tx');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});