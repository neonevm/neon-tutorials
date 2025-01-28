const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
/*const {
  Liquidity,
  TokenAmount,
  Token,
  Percent,
} = require("@raydium-io/raydium-sdk");*/
const {
  Raydium,
  TxVersion,
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
} = require("@raydium-io/raydium-sdk-v2");
const { config } = require("../config");
//const { config } = require("./config");

async function main() {
  const [owner, user2] = await ethers.getSigners();
  const connection = new web3.Connection(
    config.SOLANA_NODE_MAINNET,
    "processed"
  );

  let TestCreateRaydiumPoolAddress = config.CREATE_RAYDIUM_POOL_MAINNET;
  const TestCreateRaydiumPoolFactory = await ethers.getContractFactory(
    "TestCreateRaydiumPool"
  );
  let TestCreateRaydiumPool;
  let tx;

  const WSOL = new ethers.Contract(
    config.DATA.EVM.ADDRESSES.WSOL,
    config.DATA.EVM.ABIs.ERC20ForSPL,
    ethers.provider
  );

  const TNEON = new ethers.Contract(
    config.DATA.EVM.ADDRESSES.TNEON,
    config.DATA.EVM.ABIs.ERC20ForSPL,
    ethers.provider
  );

  if (ethers.isAddress(TestCreateRaydiumPoolAddress)) {
    TestCreateRaydiumPool = TestCreateRaydiumPoolFactory.attach(
      TestCreateRaydiumPoolAddress
    );
    console.log(`TestCreateRaydiumPool at ${TestCreateRaydiumPool.target}`);
  } else {
    TestCreateRaydiumPool = await ethers.deployContract(
      "TestCreateRaydiumPool",
      [
        owner.address,
        config.utils.publicKeyToBytes32(config.DATA.SVM.ADDRESSES.NEON_PROGRAM),
        config.utils.publicKeyToBytes32(
          config.DATA.SVM.ADDRESSES.RAYDIUM_PROGRAM
        ),
      ]
    );
    await TestCreateRaydiumPool.waitForDeployment();

    TestCreateRaydiumPoolAddress = TestCreateRaydiumPool.target;
    console.log(
      `TestCreateRaydiumPool deployed to ${TestCreateRaydiumPool.target}`
    );
  }

  const contractPublicKeyInBytes = await TestCreateRaydiumPool.getNeonAddress(
    TestCreateRaydiumPoolAddress
  );
  const contractPublicKey = ethers.encodeBase58(contractPublicKeyInBytes);
  console.log(contractPublicKey, "contractPublicKey");

  console.log("\n ***USER*** Broadcast WSOL approval ... ");
  tx = await WSOL.connect(owner).approve(
    TestCreateRaydiumPoolAddress,
    0.03 * 10 ** 9
  );
  await tx.wait(1);
  console.log(tx, "tx");

  console.log("\n ***USER*** Broadcast TNEON approval ... ");
  tx = await TNEON.connect(owner).approve(
    TestCreateRaydiumPoolAddress,
    10 * 10 ** 6
  );
  await tx.wait(1);
  console.log(tx, "tx");

  const ataContractWSOL = await getAssociatedTokenAddress(
    new web3.PublicKey(config.DATA.SVM.ADDRESSES.WSOL),
    new web3.PublicKey(contractPublicKey),
    true
  );
  try {
    await getAccount(connection, ataContractWSOL);
  } catch (err) {
    return console.error(
      "\nAccount " +
        contractPublicKey +
        " does not have initialized ATA account for TokenA ( " +
        config.DATA.SVM.ADDRESSES.WSOL +
        " )."
    );
  }

  const ataContractTNEON = await getAssociatedTokenAddress(
    new web3.PublicKey(config.DATA.SVM.ADDRESSES.TNEON),
    new web3.PublicKey(contractPublicKey),
    true
  );
  try {
    await getAccount(connection, ataContractTNEON);
  } catch (err) {
    return console.error(
      "Account " +
        contractPublicKey +
        " does not have initialized ATA account for TokenB ( " +
        config.DATA.SVM.ADDRESSES.TNEON +
        " )."
    );
  }

  console.log(ataContractWSOL, "ataContractWSOL");
  console.log(ataContractTNEON, "ataContractTNEON");

  const marketId = new PublicKey(
    "BhTBX9GdK6MVpCCmd4s37Gxe5Vu7HnoBAzeWnim5svyi"
  );

  const txVersion = TxVersion.V0;

  // If you are sure about your market info, you don't need to get market info from RPC
  const marketBufferInfo = await connection.getAccountInfo(
    new PublicKey(marketId)
  );
  const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(
    marketBufferInfo.data
  );

  // Check mint info here: https://api-v3.raydium.io/mint/list
  // Or get mint info using the API: await raydium.token.getTokenInfo('mint address')

  // AMM pool doesn't support token 2022
  const baseMintInfo = await Raydium.token.getTokenInfo(baseMint);
  const quoteMintInfo = await Raydium.token.getTokenInfo(quoteMint);
  const baseAmount = new BN(4000000);
  const quoteAmount = new BN(10000000);

  if (
    baseMintInfo.programId !== TOKEN_PROGRAM_ID.toBase58() ||
    quoteMintInfo.programId !== TOKEN_PROGRAM_ID.toBase58()
  ) {
    throw new Error(
      "AMM pools with OpenBook market only support TOKEN_PROGRAM_ID mints. For token-2022, create a CPMM pool instead."
    );
  }

  if (
    baseAmount
      .mul(quoteAmount)
      .lte(new BN(1).mul(new BN(10 ** baseMintInfo.decimals)).pow(new BN(2)))
  ) {
    throw new Error(
      "Initial liquidity too low. Try adding more baseAmount/quoteAmount."
    );
  }

  const { execute, extInfo } = await Raydium.liquidity.createPoolV4({
    programId: AMM_V4,
    marketInfo: {
      marketId,
      programId: OPEN_BOOK_PROGRAM,
    },
    baseMintInfo: {
      mint: baseMint,
      decimals: baseMintInfo.decimals, // If you know mint decimals, you can pass the number directly
    },
    quoteMintInfo: {
      mint: quoteMint,
      decimals: quoteMintInfo.decimals, // If you know mint decimals, you can pass the number directly
    },
    baseAmount: new BN(4000000),
    quoteAmount: new BN(10000000),

    startTime: new BN(0), // Unit in seconds
    ownerInfo: {
      useSOLBalance: true,
    },
    associatedOnly: false,
    txVersion,
    feeDestinationId: FEE_DESTINATION_ID,
    // Optional: Set up priority fee here
    /*computeBudgetConfig: {
      units: 600000,
      microLamports: 46591500,
    },*/
  });
  console.log(execute.innerTransaction.instructions, "createPoolOnRaydium");

  // /BUILD RAYDIUM CREATE POOL INSTRUCTION

  /*console.log("\n ***OWNER*** Broadcast Raydium create WSOL/TNEON pool ... ");
  tx = await TestCreateRaydiumPool.connect(owner).createRaydiumPool(
    config.DATA.EVM.ADDRESSES.TNEON,
    config.DATA.EVM.ADDRESSES.WSOL,
    parseInt(baseAmountAmount * 10 ** 6),
    parseInt(quoteAmount * 10 ** 9),
    [
      config.utils.prepareInstructionData(
        execute.innerTransaction.instructions[0]
      ),
    ],
    [
      config.utils.prepareInstructionAccounts(
        execute.innerTransaction.instructions[0]
      ),
    ]
  );
  await tx.wait(1);
  console.log(tx, "tx");*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
