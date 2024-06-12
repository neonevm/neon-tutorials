// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const { config } = require('./config');
const { AnchorProvider } = require("@coral-xyz/anchor");
const { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil, swapQuoteByInputToken, IGNORE_CACHE, getAllWhirlpoolAccountsForConfig, WhirlpoolIx, SwapUtils } = require("@orca-so/whirlpools-sdk");
const { DecimalUtil, Percentage } = require("@orca-so/common-sdk");
const { Decimal } = require("decimal.js");

//export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
//export ANCHOR_WALLET=./id.json

async function main() {
    //const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const provider = AnchorProvider.env();
    const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
    const client = buildWhirlpoolClient(ctx);
    const DEVNET_WHIRLPOOLS_CONFIG = new web3.PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR");
    const [owner] = await ethers.getSigners();

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
    let TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT;
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

    let payer = ethers.encodeBase58(await TestCallSolana.getPayer());
    console.log(payer, 'payer');

    let contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    let contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    let ownerPublicKeyInBytes = await TestCallSolana.getNeonAddress(owner.address);
    let ownerPublicKey = ethers.encodeBase58(ownerPublicKeyInBytes);
    console.log(ownerPublicKey, 'ownerPublicKey');

    const TokenA = {mint: new web3.PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa"), decimals: 9};
    const TokenB = {mint: new web3.PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"), decimals: 6};

    const tick_spacing = 64;
    const whirlpool_pubkey = PDAUtil.getWhirlpool(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        DEVNET_WHIRLPOOLS_CONFIG,
        TokenA.mint, 
        TokenB.mint, 
        tick_spacing
    ).publicKey;
    console.log("whirlpool_key:", whirlpool_pubkey.toBase58());
    const whirlpool = await client.getPool(whirlpool_pubkey);
    

    /* const swapParams = {
        whirlpool: whirlpool_pubkey,
        authority: new web3.PublicKey(contractPublicKey),
        sourceTokenAccount: new web3.PublicKey('DvCn1Ce1CvnGqKQGHkK7xJtmXE7xr8Wzrj9YYViyX1Zp'),
        destinationTokenAccount: new web3.PublicKey('4KDudC7XagDiZZbd9Xzabcy5yZMC8bvz7c8q7Bb9vXTa'),
        amount: DecimalUtil.toBN(new Decimal("0.1"), TokenB.decimals),
        otherAmountThreshold: DecimalUtil.toBN(new Decimal("0")),
        sqrtPriceLimit: DecimalUtil.toBN(new Decimal("0")),
        aToB: false
    };
    console.log(swapParams, 'swapParams');
    return;

    const swapTransaction = await whirlpool.swap(swapParams);
    consolr.log(swapTransaction, 'swapTransaction'); */


    // Swap 1 TokenB for TokenA
    const amount_in = new Decimal("0.1");

    // Obtain swap estimation (run simulation)
    const quote = await swapQuoteByInputToken(
        whirlpool,
        // Input token and amount
        TokenB.mint,
        DecimalUtil.toBN(amount_in, TokenB.decimals),
        // Acceptable slippage (10/1000 = 1%)
        Percentage.fromFraction(10, 1000),
        ctx.program.programId,
        ctx.fetcher,
        IGNORE_CACHE,
    );

    // Output the estimation
    console.log("estimatedAmountIn:", DecimalUtil.fromBN(quote.estimatedAmountIn, TokenB.decimals).toString(), "TokenB");
    console.log("estimatedAmountOut:", DecimalUtil.fromBN(quote.estimatedAmountOut, TokenA.decimals).toString(), "TokenA");
    console.log("otherAmountThreshold:", DecimalUtil.fromBN(quote.otherAmountThreshold, TokenA.decimals).toString(), "TokenA");

    let instruction = WhirlpoolIx.swapIx(
        ctx.program,
        SwapUtils.getSwapParamsFromQuote(
            quote,
            ctx,
            whirlpool,
            yourInputTokenAccount,
            yourOutputTokenAccount,
            ctx.wallet.publicKey
        )
    )
    console.log(instruction, 'instruction');

    //tx = await whirlpool.swap(quote, new web3.PublicKey('DHaMF8ZrvrADBo8xmDRVHXzrZQkpSGuaYAoTYxkMrv3H'));
    /* tx = await whirlpool.swap(quote);
    console.log(tx, 'tx'); */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});