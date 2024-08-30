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
const { config } = require('./config');
const { AnchorProvider } = require("@coral-xyz/anchor");
const { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil, swapQuoteByInputToken, IGNORE_CACHE, getAllWhirlpoolAccountsForConfig, WhirlpoolIx, SwapUtils } = require("@orca-so/whirlpools-sdk");
const { DecimalUtil, Percentage } = require("@orca-so/common-sdk");
const { Decimal } = require("decimal.js");

async function main() {
    let SOLANA_NODE;
    let TestCallSolanaAddress;
    let WHIRLPOOLS_CONFIG;
    let TokenA;
    let TokenB;
    let tickSpacing;
    let amountIn;
    if (network.name == "neonmainnet") {
        if (process.env.ANCHOR_PROVIDER_URL != config.SOLANA_NODE_MAINNET || process.env.ANCHOR_WALLET == undefined) {
            return console.log('This script uses the @coral-xyz/anchor library which requires the variables ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set. Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_PROVIDER_URL='+config.SOLANA_NODE_MAINNET+' && export ANCHOR_WALLET=./id.json');
        }
        SOLANA_NODE = config.SOLANA_NODE_MAINNET;
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT_MAINNET;
        WHIRLPOOLS_CONFIG = new web3.PublicKey("2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ");
        TokenA = {mint: new web3.PublicKey("So11111111111111111111111111111111111111112"), decimals: 9}; // WSOL
        TokenB = {mint: new web3.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), decimals: 6}; // USDC
        tickSpacing = 4;
        amountIn = new Decimal('0.0001');
    } else if (network.name == "neondevnet") {
        if (process.env.ANCHOR_PROVIDER_URL != config.SOLANA_NODE || process.env.ANCHOR_WALLET == undefined) {
            return console.log('This script uses the @coral-xyz/anchor library which requires the variables ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set. Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_PROVIDER_URL='+config.SOLANA_NODE+' && export ANCHOR_WALLET=./id.json');
        }
        SOLANA_NODE = config.SOLANA_NODE;
        TestCallSolanaAddress = config.CALL_SOLANA_SAMPLE_CONTRACT;
        WHIRLPOOLS_CONFIG = new web3.PublicKey("FcrweFY1G9HJAHG5inkGB6pKg1HZ6x9UC2WioAfWrGkR");
        TokenA = {mint: new web3.PublicKey("Jd4M8bfJG3sAkd82RsGWyEXoaBXQP7njFzBwEaCTuDa"), decimals: 9}; // devSAMO
        TokenB = {mint: new web3.PublicKey("BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k"), decimals: 6}; // devUSDC
        tickSpacing = 64;
        amountIn = new Decimal('0.1');
    }
    console.log(ORCA_WHIRLPOOL_PROGRAM_ID, 'ORCA_WHIRLPOOL_PROGRAM_ID');

    const [user1] = await ethers.getSigners();
    const connection = new web3.Connection(SOLANA_NODE, "processed");
    const provider = AnchorProvider.env();
    const ctx = WhirlpoolContext.withProvider(provider, ORCA_WHIRLPOOL_PROGRAM_ID);
    const client = buildWhirlpoolClient(ctx);

    const TestCallSolanaFactory = await ethers.getContractFactory("TestCallSolana");
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

    const whirlpool_pubkey = PDAUtil.getWhirlpool(
        ORCA_WHIRLPOOL_PROGRAM_ID,
        WHIRLPOOLS_CONFIG,
        TokenA.mint,
        TokenB.mint,
        tickSpacing // tick spacing
    ).publicKey;
    const whirlpool = await client.getPool(whirlpool_pubkey);
    
    const ataContractTokenA = await getAssociatedTokenAddress(
        TokenA.mint,
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenAInfo = await connection.getAccountInfo(ataContractTokenA);

    const ataContractTokenB = await getAssociatedTokenAddress(
        TokenB.mint,
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractTokenBInfo = await connection.getAccountInfo(ataContractTokenB);

    // in order to proceed with swap the executor account needs to have existing Token Accounts for both tokens
    if (!ataContractTokenAInfo || !ataContractTokenBInfo) {
        if (!ataContractTokenAInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + TokenA.mint.toBase58() + ' ).');
        }
        if (!ataContractTokenBInfo) {
            console.log('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenB ( ' + TokenB.mint.toBase58() + ' ).');
        }
        return;
    } else if (Number((await getAccount(connection, ataContractTokenA)).amount) < Number(DecimalUtil.toBN(amountIn, TokenA.decimals))) {
        console.log('Account ' + contractPublicKey + ' does not have enough TokenA ( ' + TokenA.mint.toBase58() + ' ) amount to proceed with the swap execution.');
        return;
    }

    // Obtain swap estimation (run simulation)
    const quote = await swapQuoteByInputToken(
        whirlpool,
        TokenA.mint,
        DecimalUtil.toBN(amountIn, TokenA.decimals), // Input Token Mint amount
        Percentage.fromFraction(10, 1000), // Acceptable slippage (10/1000 = 1%)
        ctx.program.programId,
        ctx.fetcher,
        IGNORE_CACHE
    );

    // Output the estimation
    console.log("estimatedAmountIn:", DecimalUtil.fromBN(quote.estimatedAmountIn, TokenA.decimals).toString(), "TokenA");
    console.log("estimatedAmountOut:", DecimalUtil.fromBN(quote.estimatedAmountOut, TokenB.decimals).toString(), "TokenB");
    console.log("otherAmountThreshold:", DecimalUtil.fromBN(quote.otherAmountThreshold, TokenB.decimals).toString(), "TokenB");

    console.log('Processing execute method with Orca\'s swap instruction ...');
    // Prepare the swap instruction
    solanaTx = new web3.Transaction();
    solanaTx.add(
        WhirlpoolIx.swapIx(
            ctx.program,
            SwapUtils.getSwapParamsFromQuote(
                quote,
                ctx,
                whirlpool,
                ataContractTokenA,
                ataContractTokenB,
                new web3.PublicKey(contractPublicKey)
            )
        )
    );

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