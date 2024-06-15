// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
    getAssociatedTokenAddress,
    getAccount
} = require('@solana/spl-token');
const { config } = require('./config');
const { AnchorProvider } = require("@coral-xyz/anchor");
const { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil, swapQuoteByInputToken, IGNORE_CACHE, getAllWhirlpoolAccountsForConfig, WhirlpoolIx, SwapUtils } = require("@orca-so/whirlpools-sdk");
const { DecimalUtil, Percentage } = require("@orca-so/common-sdk");
const { Decimal } = require("decimal.js");

// run following command before proceeding with the script execution:
// export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com && export ANCHOR_WALLET=./id.json

async function main() {
    const connection = new web3.Connection(config.SOLANA_NODE, "processed");
    const provider = AnchorProvider.env();
    const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
    const client = buildWhirlpoolClient(ctx);
    const DEVNET_WHIRLPOOLS_CONFIG = new web3.PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR");

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

    let contractPublicKeyInBytes = await TestCallSolana.getNeonAddress(TestCallSolanaAddress);
    let contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
    console.log(contractPublicKey, 'contractPublicKey');

    const TokenA = {mint: new web3.PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa"), decimals: 9}; // devSAMO
    const TokenB = {mint: new web3.PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"), decimals: 6}; // devUSDC

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

    const amount_in = new Decimal("0.1");

    const ataContractTokenA = await getAssociatedTokenAddress(
        TokenA.mint,
        new web3.PublicKey(contractPublicKey),
        true
    );
    let ataContractTokenAInfo = await connection.getAccountInfo(ataContractTokenA);

    const ataContractTokenB = await getAssociatedTokenAddress(
        TokenB.mint,
        new web3.PublicKey(contractPublicKey),
        true
    );

    let ataContractTokenBInfo = await connection.getAccountInfo(ataContractTokenB);
    if (!ataContractTokenAInfo || !ataContractTokenBInfo) {
        if (!ataContractTokenAInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA.');
        }
        if (!ataContractTokenBInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB.');
        }
        return;
    } else if (Number((await getAccount(connection, ataContractTokenB)).amount) < Number(DecimalUtil.toBN(amount_in, TokenB.decimals))) {
        console.log('Account ' + contractPublicKey + ' does not have enough TokenB amount to proceed with the swap execution.');
        return;
    }

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

    console.log(quote, 'quote');

    // Output the estimation
    console.log("estimatedAmountIn:", DecimalUtil.fromBN(quote.estimatedAmountIn, TokenB.decimals).toString(), "TokenB");
    console.log("estimatedAmountOut:", DecimalUtil.fromBN(quote.estimatedAmountOut, TokenA.decimals).toString(), "TokenA");
    console.log("otherAmountThreshold:", DecimalUtil.fromBN(quote.otherAmountThreshold, TokenA.decimals).toString(), "TokenA");

    solanaTx = new web3.Transaction();
    solanaTx.add(
        WhirlpoolIx.swapIx(
            ctx.program,
            SwapUtils.getSwapParamsFromQuote(
                quote,
                ctx,
                whirlpool,
                ataContractTokenB,
                ataContractTokenA,
                new web3.PublicKey(contractPublicKey)
            )
        )
    );

    [tx, receipt] = await config.utils.executeComposabilityMethod(solanaTx.instructions[0], 0, TestCallSolana);
    console.log(tx, 'tx');
    console.log(receipt.logs[0].args, 'receipt args');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});