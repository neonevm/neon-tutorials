const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const fetch = require('cross-fetch');
const {
    getAssociatedTokenAddress
} = require('@solana/spl-token');
const { config } = require('../config');
const { Decimal } = require("decimal.js");

async function main() {
    let TestICSFlowAddress = config.ICS_FLOW_MAINNET;

    const swapConfig = {
        TokenA: {
            SVM: config.DATA.SVM.ADDRESSES.USDC,
            EVM: config.DATA.EVM.ADDRESSES.USDC
        },
        TokenB: {
            SVM: config.DATA.SVM.ADDRESSES.WSOL,
            EVM: config.DATA.EVM.ADDRESSES.WSOL
        },
        TokenAAmount: new Decimal('0.01'),
        TokenADecimals: 6,
        TokenBDecimals: 9,
        slippage: 1
    };

    const [user1] = await ethers.getSigners();
    const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");

    const TestICSFlowFactory = await ethers.getContractFactory("TestICSFlow");
    let TestICSFlow;
    let tx;

    if (ethers.isAddress(TestICSFlowAddress)) {
        TestICSFlow = TestICSFlowFactory.attach(TestICSFlowAddress);
        console.log(
            `TestICSFlow at ${TestICSFlow.target}`
        );
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

    let ataContract = await getAssociatedTokenAddress(
        new web3.PublicKey(swapConfig.TokenA.SVM),
        new web3.PublicKey(contractPublicKey),
        true
    );
    const ataContractInfo = await connection.getAccountInfo(ataContract);

    const user1TokenBTokenAccount = config.utils.calculateTokenAccount(
        swapConfig.TokenB.EVM,
        user1.address,
        new web3.PublicKey(config.DATA.SVM.ADDRESSES.NEON_PROGRAM)
    );

    // in order to proceed with swap the executor account needs to have existing ATA account
    if (!ataContractInfo) {
        return console.error('Account ' + contractPublicKey + ' does not have initialized ATA account for TokenA ( ' + swapConfig.TokenA.SVM.toBase58() + ' ).');
    }

    const TokenA = new ethers.Contract(
        swapConfig.TokenA.EVM,
        config.DATA.EVM.ABIs.ERC20ForSPL,
        ethers.provider
    );

    const TokenB = new ethers.Contract(
        swapConfig.TokenB.EVM,
        config.DATA.EVM.ABIs.ERC20ForSPL,
        ethers.provider
    );

    console.log(await TokenA.balanceOf(user1.address), 'user1 TokenA balance');
    console.log(await TokenB.balanceOf(user1.address), 'user1 TokenB balance');

    console.log('\nBroadcast TokenA approval ... ');
    tx = await TokenA.connect(user1).approve(TestICSFlowAddress, swapConfig.TokenAAmount * 10 ** swapConfig.TokenADecimals);
    await tx.wait(1);
    console.log(tx, 'tx');

    const asLegacyTransaction = true;
    const onlyDirectRoutes = false;

    // prepare Jupiter quote
    const quoteResponse = await (
        await fetch('https://quote-api.jup.ag/v6/quote?asLegacyTransaction='+asLegacyTransaction+'&onlyDirectRoutes='+onlyDirectRoutes+'&inputMint=' + swapConfig.TokenA.SVM + '&outputMint=' + swapConfig.TokenB.SVM + '&amount=' + (swapConfig.TokenAAmount * 10 ** swapConfig.TokenADecimals) + '&slippageBps=' + swapConfig.slippage)
    ).json();
    console.log(quoteResponse, 'quoteResponse');

    // prepare Jupiter swap instruction
    const { swapTransaction } = await (
        await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey: contractPublicKey,
                wrapAndUnwrapSol: false,
                asLegacyTransaction: asLegacyTransaction,
                onlyDirectRoutes: onlyDirectRoutes,
                destinationTokenAccount: user1TokenBTokenAccount[0]
            })
        })
    ).json();
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const jupiterSwap = web3.Transaction.from(swapTransactionBuf);

    console.log('\nBroadcast Jupiter swap TokenA -> TokenB ... ');
    tx = await TestICSFlow.connect(user1).jupiterSwap(
        swapConfig.TokenA.EVM,
        swapConfig.TokenB.EVM,
        swapConfig.TokenAAmount * 10 ** swapConfig.TokenADecimals,
        config.utils.publicKeyToBytes32(jupiterSwap.instructions[jupiterSwap.instructions.length - 1].programId.toBase58()), // Orca programId
        config.utils.prepareInstructionData(jupiterSwap.instructions[jupiterSwap.instructions.length - 1]),
        config.utils.prepareInstructionAccounts(jupiterSwap.instructions[jupiterSwap.instructions.length - 1])
    );
    await tx.wait(1);
    console.log(tx, 'tx');

    console.log(await TokenA.balanceOf(user1.address), 'user1 TokenA balance after swap');
    console.log(await TokenB.balanceOf(user1.address), 'user1 TokenB balance after swap');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});