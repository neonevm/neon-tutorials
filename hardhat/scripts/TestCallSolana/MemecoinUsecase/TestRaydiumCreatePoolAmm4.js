const { ethers } = require("hardhat");
const web3 = require("@solana/web3.js");
const {
  getAssociatedTokenAddress,
  getAccount,
  TOKEN_PROGRAM_ID,
} = require("@solana/spl-token");
const {
  MARKET_STATE_LAYOUT_V3,
  AMM_V4,
  OPEN_BOOK_PROGRAM,
  FEE_DESTINATION_ID,
  DEVNET_PROGRAM_ID,
} = require("@raydium-io/raydium-sdk-v2");
const { config } = require("../config");
const { initSdk, txVersion } = require("./config");
const BN = require("bn.js");

async function main() {
  const [owner] = await ethers.getSigners();
  const connection = new web3.Connection(config.SOLANA_NODE, "processed");

  const raydium = await initSdk();
  //console.log(raydium);

  //let TestCreateRaydiumPoolAddress = config.CREATE_RAYDIUM_POOL_MAINNET;
  let TestCreateRaydiumPoolAddress = config.CREATE_RAYDIUM_POOL_DEVNET;
  const TestCreateRaydiumPoolFactory = await ethers.getContractFactory(
    "TestCreateRaydiumPool"
  );
  let TestCreateRaydiumPool;
  let tx;

  const WSOL = new ethers.Contract(
    config.DATA.EVM.ADDRESSES.WSOL_DEVNET,
    config.DATA.EVM.ABIs.ERC20ForSPL,
    ethers.provider
  );

  const TNEON2 = new ethers.Contract(
    config.DATA.EVM.ADDRESSES.TNEON2,
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
        config.utils.publicKeyToBytes32(
          config.DATA.SVM.ADDRESSES.NEON_PROGRAM_DEVNET
        ),
        config.utils.publicKeyToBytes32(
          config.DATA.SVM.ADDRESSES.RAYDIUM_PROGRAM_DEVNET
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

  const ownerPublicKeyInBytes = await TestCreateRaydiumPool.getNeonAddress(
    owner
  );
  const ownerPublicKey = ethers.encodeBase58(ownerPublicKeyInBytes);
  console.log(ownerPublicKey, "ownerPublicKey");

  console.log("\n ***USER*** Broadcast WSOL approval ... ");
  tx = await WSOL.connect(owner).approve(
    TestCreateRaydiumPoolAddress,
    0.03 * 10 ** 9
  );
  await tx.wait(1);
  console.log(tx, "tx");

  console.log("\n ***USER*** Broadcast TNEON2 approval ... ");
  tx = await TNEON2.connect(owner).approve(
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

  const ataContractTNEON2 = await getAssociatedTokenAddress(
    new web3.PublicKey(config.DATA.SVM.ADDRESSES.TNEON2),
    new web3.PublicKey(contractPublicKey),
    true
  );
  try {
    await getAccount(connection, ataContractTNEON2);
  } catch (err) {
    return console.error(
      "Account " +
        contractPublicKey +
        " does not have initialized ATA account for TokenB ( " +
        config.DATA.SVM.ADDRESSES.TNEON2 +
        " )."
    );
  }

  console.log(ataContractWSOL, "ataContractWSOL");
  console.log(ataContractTNEON2, "ataContractTNEON2");

  const marketId = new web3.PublicKey(
    "3Q2N1a1eKpdeFgPG1QCmNpXy1DW3kUqcrrETWsknw4WW"
  );

  //const txVersion = TxVersion.V0;

  // If you are sure about your market info, you don't need to get market info from RPC
  const marketBufferInfo = await connection.getAccountInfo(
    new web3.PublicKey(marketId)
  );
  const { baseMint, quoteMint } = MARKET_STATE_LAYOUT_V3.decode(
    marketBufferInfo.data
  );

  // Check mint info here: https://api-v3.raydium.io/mint/list
  // Or get mint info using the API: await raydium.token.getTokenInfo('mint address')

  // AMM pool doesn't support token 2022
  const baseMintInfo = await raydium.token.getTokenInfo(baseMint);
  const quoteMintInfo = await raydium.token.getTokenInfo(quoteMint);
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

  const addInstructions = await raydium.liquidity.createPoolV4({
    //programId: AMM_V4,
    programId: DEVNET_PROGRAM_ID.AmmV4, // devnet
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
    //feeDestinationId: FEE_DESTINATION_ID,
    feeDestinationId: DEVNET_PROGRAM_ID.FEE_DESTINATION_ID, // devnet
    // Optional: Set up priority fee here
    /*computeBudgetConfig: {
      units: 600000,
      microLamports: 46591500,
    },*/
  });
  console.log(addInstructions.builder, "createPoolOnRaydium");
  console.log(addInstructions.builder.instructions[0], "createPoolOnRaydium0");

  //addInstructions.builder.instructions[1].keys[2].isSigner = true;
  //addInstructions.builder.instructions[1].keys[2].isWritable = true;
  console.log(addInstructions.builder.instructions[1], "createPoolOnRaydium1");

  console.log(addInstructions.builder.instructions[2], "createPoolOnRaydium2");

  // /BUILD RAYDIUM CREATE POOL INSTRUCTION

  console.log("\n ***OWNER*** Broadcast Raydium create WSOL/TNEON2 pool ... ");
  tx = await TestCreateRaydiumPool.connect(owner).createRaydiumPool(
    config.DATA.EVM.ADDRESSES.TNEON2,
    config.DATA.EVM.ADDRESSES.WSOL_DEVNET,
    parseInt(baseAmount),
    parseInt(quoteAmount),
    [
      config.utils.prepareInstructionData(
        addInstructions.builder.instructions[0]
      ),
      config.utils.prepareInstructionData(
        addInstructions.builder.instructions[1]
      ),
      config.utils.prepareInstructionData(
        addInstructions.builder.instructions[2]
      ),
      /*config.utils.prepareInstructionData(
        addInstructions.builder.endInstructions[0]
      ),*/
    ],
    [
      config.utils.prepareInstructionAccounts(
        addInstructions.builder.instructions[0]
      ),
      config.utils.prepareInstructionAccounts(
        addInstructions.builder.instructions[1]
      ),
      config.utils.prepareInstructionAccounts(
        addInstructions.builder.instructions[2]
      ),
      /*config.utils.prepareInstructionAccounts(
        addInstructions.builder.endInstructions[0]
      ),*/
    ]
  );
  await tx.wait(1);
  console.log(tx, "tx");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
