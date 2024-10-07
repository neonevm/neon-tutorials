//
//
// !!! Important !!! - this script used the Anchor SDK and have to define ANCHOR_PROVIDER_URL & ANCHOR_WALLET shell variables. ANCHOR_PROVIDER_URL is Solana's RPC URL and ANCHOR_WALLET is Solana's private key in json format. Name the private key file id.json and place him in the root of hardhat project folder. This key will be used only for the Anchor SDK initialization, it does not sign or submit any transactions.
// Test purpose - in this script we will be performing a swap in Orca DEX. Input swap token is devUSDC and output swap token is devSAMO. You can request devUSDCs at https://everlastingsong.github.io/nebula/. In order to initiate the swap the contract's account must have both ATA's initialized before the swap execution ( ATA for devSAMO and ATA for devUSDC )
//
//

const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    getAccount
} = require('@solana/spl-token');
const { config } = require('../config');
const { AnchorProvider } = require("@coral-xyz/anchor");
const { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil, swapQuoteByInputToken, IGNORE_CACHE, getAllWhirlpoolAccountsForConfig, WhirlpoolIx, SwapUtils } = require("@orca-so/whirlpools-sdk");
const { DecimalUtil, Percentage } = require("@orca-so/common-sdk");
const { Decimal } = require("decimal.js");
const {
    Liquidity
} = require('@raydium-io/raydium-sdk');

async function main() {
    if (process.env.ANCHOR_PROVIDER_URL != config.SOLANA_NODE_MAINNET || process.env.ANCHOR_WALLET == undefined) {
        return console.log('This script uses the @coral-xyz/anchor library which requires the variables ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set. Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_PROVIDER_URL='+config.SOLANA_NODE_MAINNET+' && export ANCHOR_WALLET=./id.json');
    }
    const WHIRLPOOLS_CONFIG = new web3.PublicKey(config.DATA.SVM.ADDRESSES.WHIRLPOOLS_CONFIG);
    const TokenA = {mint: new web3.PublicKey(config.DATA.SVM.ADDRESSES.WSOL), decimals: 9}; // WSOL
    const TokenB = {mint: new web3.PublicKey(config.DATA.SVM.ADDRESSES.USDC), decimals: 6}; // USDC

    const [user1] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");
    const provider = AnchorProvider.env();
    const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
    const client = buildWhirlpoolClient(ctx);

    let TestICSFlowAddress = config.ICS_FLOW_MAINNET;
    const TestICSFlowFactory = await ethers.getContractFactory("TestICSFlow");
    let TestICSFlow;
    let tx;

    if (ethers.isAddress(TestICSFlowAddress)) {
        TestICSFlow = TestICSFlowFactory.attach(TestICSFlowAddress);
    } else {
        TestICSFlow = await ethers.deployContract("TestICSFlow", [
            config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.NEON_PROGRAM),
            config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.ORCA_PROGRAM),
            config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.JUPITER_PROGRAM),
            config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.RAYDIUM_PROGRAM)
        ]);
        await TestICSFlow.waitForDeployment();

        TestICSFlowAddress = TestICSFlow.target;
        console.log(
            `TestICSFlow deployed to ${TestICSFlow.target}`
        );
    }

    const contractPublicKeyInBytes = await TestICSFlow.getNeonAddress(TestICSFlowAddress);
    const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    const swapAmountIn = new Decimal('0.0002');
    
    let ataContract = await getAssociatedTokenAddress(
        TokenA.mint,
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractInfo = await connection.getAccountInfo(ataContract);

    const user1USDCTokenAccount = config.utils.calculateTokenAccount(
        config.DATA.EVM.ADDRESSES.USDC,
        user1.address,
        new web3.PublicKey(config.DATA.SVM.ADDRESSES.NEON_PROGRAM)
    );

    // in order to proceed with swap the executor account needs to have existing ATA account
    if (!ataContractInfo) {
        return console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + TokenA.mint.toBase58() + ' ).');
    }

    const WSOL = new ethers.Contract(
        config.DATA.EVM.ADDRESSES.WSOL,
        config.DATA.EVM.ABIs.ERC20ForSPL,
        ethers.provider
    );
    
    console.log('\nBroadcast WSOL approval ... ');
    tx = await WSOL.connect(user1).approve(TestICSFlowAddress, swapAmountIn * 10 ** TokenA.decimals);
    await tx.wait(1);
    console.log(tx, 'tx');

    const raydiymSwapConfig = {
        liquidityFile: "https://api.raydium.io/v2/sdk/liquidity/mainnet.json",
        slippage: 1 // percents
    };

    console.log('\nQuery Raydium pools data ...');
    const poolKeys = await config.raydiumHelper.findPoolInfoForTokens(raydiymSwapConfig.liquidityFile, TokenA.mint.toBase58(), TokenB.mint.toBase58());
    if (!poolKeys) {
        console.error('Pool info not found');
        return 'Pool info not found';
    } else {
        console.log('Found pool info');
    }

    // BUILD ORCA SWAP INSTRUCTION
    console.log('\nBUILD ORCA SWAP INSTRUCTION ...');
    const whirlpool_pubkey = PDAUtil.getWhirlpool(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        WHIRLPOOLS_CONFIG,
        TokenA.mint,
        TokenB.mint,
        4 // tick spacing
    ).publicKey;
    const whirlpool = await client.getPool(whirlpool_pubkey);

    // Obtain swap estimation (run simulation)
    const quote = await swapQuoteByInputToken(
        whirlpool,
        TokenA.mint,
        DecimalUtil.toBN(new Decimal(swapAmountIn / 2), TokenA.decimals), // Input Token Mint amount
        Percentage.fromFraction(10, 1000), // Acceptable slippage (10/1000 = 1%)
        ctx.program.programId,
        ctx.fetcher,
        IGNORE_CACHE
    );

    // Output the estimation
    console.log("estimatedAmountIn:", DecimalUtil.fromBN(quote.estimatedAmountIn, TokenA.decimals).toString(), "TokenA");
    console.log("estimatedAmountOut:", DecimalUtil.fromBN(quote.estimatedAmountOut, TokenB.decimals).toString(), "TokenB");
    console.log("otherAmountThreshold:", DecimalUtil.fromBN(quote.otherAmountThreshold, TokenB.decimals).toString(), "TokenB");

    // Prepare the swap instruction
    const orcaSwap = WhirlpoolIx.swapIx(
        ctx.program,
        SwapUtils.getSwapParamsFromQuote(
            quote,
            ctx,
            whirlpool,
            ataContract,
            user1USDCTokenAccount[0],
            new web3.PublicKey(contractPublicKey)
        )
    );
    // /BUILD ORCA SWAP INSTRUCTION

    // BUILD RAYDIUM SWAP INSTRUCTION
    console.log('\nBUILD RAYDIUM SWAP INSTRUCTION ...');
    const directionIn = poolKeys.quoteMint.toString() == TokenB.mint.toBase58();
    const [amountIn, , minAmountOut] = await config.raydiumHelper.calcAmountOut(connection, poolKeys, swapAmountIn / 2, directionIn, raydiymSwapConfig.slippage);
    
    const raydiumSwap = Liquidity.makeSwapInstruction({
        poolKeys: poolKeys,
        userKeys: {
            tokenAccountIn: ataContract,
            tokenAccountOut: user1USDCTokenAccount[0],
            owner: new web3.PublicKey(contractPublicKey)
        },
        amountIn: amountIn.raw,
        amountOut: minAmountOut.raw,
        fixedSide: "in"
    });
    // /BUILD RAYDIUM SWAP INSTRUCTION

    console.log('\nBroadcast batch of Orca & Raydium swaps WSOL -> USDC ... ');
    tx = await TestICSFlow.connect(user1).batchOrcaRaydiumSwap(
        config.DATA.EVM.ADDRESSES.WSOL,
        config.DATA.EVM.ADDRESSES.USDC,
        swapAmountIn * 10 ** TokenA.decimals,
        [
            config.utils.publicKeyToBytes32(ORCA_WHIRLPOOL_PROGRAM_ID.toBase58()), // Orca programId,
            config.utils.publicKeyToBytes32(raydiumSwap.innerTransaction.instructions[0].programId.toBase58()), // Orca programId
        ],
        [
            config.utils.prepareInstructionData(orcaSwap.instructions[0]),
            config.utils.prepareInstructionData(raydiumSwap.innerTransaction.instructions[0])
        ],
        [
            config.utils.prepareInstructionAccounts(orcaSwap.instructions[0]),
            config.utils.prepareInstructionAccounts(raydiumSwap.innerTransaction.instructions[0])
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