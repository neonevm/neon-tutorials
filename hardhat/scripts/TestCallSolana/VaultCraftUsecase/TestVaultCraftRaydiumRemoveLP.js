const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    getAccount,
    createTransferInstruction
} = require('@solana/spl-token');
const {
    Liquidity
} = require('@raydium-io/raydium-sdk');
const BN = require('bn.js');
const { config } = require('../config');

async function main() {
    const [owner] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");

    let TestVaultCraftFlowAddress = config.VAULTCRAFT_FLOW_MAINNET;
    const TestVaultCraftFlowFactory = await ethers.getContractFactory("TestVaultCraftFlow");
    let TestVaultCraftFlow;
    let tx;

    const removeLpConfig = {
        amountToWithdraw: 10 // percents
    };

    const swapConfig = {
        TokenA: config.DATA.SVM.ADDRESSES.USDC,
        TokenB: config.DATA.SVM.ADDRESSES.WSOL,
        PoolAB: config.DATA.SVM.ADDRESSES.RAYDIUM_SOL_USDC_POOL,
        TokenADecimals: 6,
        TokenBDecimals: 9,
        direction: "in", // Swap direction: 'in' or 'out'
        //liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        liquidityFile: "raydiumPools.json", // download from https://api.raydium.io/v2/sdk/liquidity/mainnet.json
        slippage: 0 // percents
    };

    if (ethers.isAddress(TestVaultCraftFlowAddress)) {
        TestVaultCraftFlow = TestVaultCraftFlowFactory.attach(TestVaultCraftFlowAddress);
        console.log(
            `TestVaultCraftFlow at ${TestVaultCraftFlow.target}`
        );
    } else {
        TestVaultCraftFlow = await ethers.deployContract("TestVaultCraftFlow", [
            owner.address,
            config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.NEON_PROGRAM),
            config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.RAYDIUM_PROGRAM)
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
    let ataContractTokenLPAccount;
    try {
        ataContractTokenLPAccount = await getAccount(connection, ataContractTokenLP);
        if (ataContractTokenLPAccount.amount == 0) {
            return console.error('Account ' + contractPublicKey + ' does not have any balance inside ATA account for LP Token ( ' + targetPoolInfo.lpMint + ' ).');
        }
    } catch(err) {
        return console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for LP Token ( ' + targetPoolInfo.lpMint + ' ).');
    }

    console.log(ataContractTokenA, 'ataContractTokenA');
    console.log(ataContractTokenB, 'ataContractTokenB');
    console.log(ataContractTokenLP, 'ataContractTokenLP');

    const withdrawAmount = parseInt((Number(ataContractTokenLPAccount.amount) * removeLpConfig.amountToWithdraw) / 100);
    const withdrawShare = new BN(withdrawAmount) / extraPoolInfo.lpSupply;
    // fixing to 6 decimals ( fix in production )
    const estimatedTokenAAmount = config.utils.toFixed((withdrawShare * extraPoolInfo.quoteReserve) / new BN(10 ** extraPoolInfo.quoteDecimals), 6);
    const estimatedTokenBAmount = config.utils.toFixed((withdrawShare * extraPoolInfo.baseReserve) / new BN(10 ** extraPoolInfo.baseDecimals), 6);
    console.log(estimatedTokenAAmount, 'estimatedTokenAAmount');
    console.log(estimatedTokenBAmount, 'estimatedTokenBAmount');

    // BUILD RAYDIUM REMOVE LP INSTRUCTION
    const removeLiquidityInstruction = Liquidity.makeRemoveLiquidityInstruction({
        poolKeys,
        userKeys: {
            baseTokenAccount: ataContractTokenB,
            quoteTokenAccount: ataContractTokenA,
            lpTokenAccount: ataContractTokenLP,
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: withdrawAmount
    });
    console.log(removeLiquidityInstruction.innerTransaction.instructions, 'removeLiquidityInstruction');
    // /BUILD RAYDIUM REMOVE LP INSTRUCTION

    // BUILD RAYDIUM SWAP INSTRUCTION
    let [amountIn, , minAmountOut] = await config.raydiumHelper.calcAmountOut(
        connection, 
        poolKeys, 
        estimatedTokenAAmount,
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
    // /BUILD RAYDIUM SWAP INSTRUCTION

    // BUILD INSTRUCTION TO TRANSFER THE WITHDRAWN AMOUNT FROM CONTACT'S ATA ACCOUNT TO CONTRACT'S ARBITRARY TOKEN ACCOUNT 
    const transferInstruction = createTransferInstruction(
        ataContractTokenB,
        ethers.encodeBase58(await TestVaultCraftFlow.getNeonArbitraryTokenAccount(
            config.DATA.EVM.ADDRESSES.WSOL,
            TestVaultCraftFlow.target
        )),
        new web3.PublicKey(contractPublicKey),
        (estimatedTokenBAmount * 10 ** swapConfig.TokenBDecimals) + Number(minAmountOut.raw)
    );
    // /BUILD INSTRUCTION TO TRANSFER THE WITHDRAWN AMOUNT FROM CONTACT'S ATA ACCOUNT TO CONTRACT'S ARBITRARY TOKEN ACCOUNT 

    console.log('\n ***OWNER*** Broadcast Raydium withdraw LP from USDC/ WSOL pool & Raydium swap USDC -> WSOL ... ');
    tx = await TestVaultCraftFlow.connect(owner).withdrawFromRaydium(
        [
            config.utils.prepareInstructionData(removeLiquidityInstruction.innerTransaction.instructions[0]),
            config.utils.prepareInstructionData(raydiumSwap.innerTransaction.instructions[0]),
            config.utils.prepareInstructionData(transferInstruction)
        ],
        [
            config.utils.prepareInstructionAccounts(
                removeLiquidityInstruction.innerTransaction.instructions[0],
                { // this object is being passed to overwrite account list, because of existing issue with Raydium's SDK when dealing with the native token SOL
                    8: {
                        key: swapConfig.PoolAB,
                        isSigner: false,
                        isWritable: true
                    },
                    9: {
                        key: swapConfig.PoolAB,
                        isSigner: false,
                        isWritable: true
                    }
                }
            ),
            config.utils.prepareInstructionAccounts(raydiumSwap.innerTransaction.instructions[0]),
            config.utils.prepareInstructionAccounts(transferInstruction)
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