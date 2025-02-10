const web3 = require("@solana/web3.js");
const {
  Liquidity,
  Token,
  TOKEN_PROGRAM_ID,
  TokenAmount,
  Fraction,
  Currency,
  CurrencyAmount,
  Price,
  Percent,
  LIQUIDITY_STATE_LAYOUT_V4,
  MARKET_STATE_LAYOUT_V3,
  SPL_MINT_LAYOUT,
  SPL_ACCOUNT_LAYOUT,
  Market,
} = require("@raydium-io/raydium-sdk");
const fs = require("fs");
const { BN } = require("bn.js");

const config = {
  SOLANA_NODE: "https://api.devnet.solana.com",
  SOLANA_NODE_MAINNET: "https://api.mainnet-beta.solana.com/",
  CALL_SOLANA_SAMPLE_CONTRACT: "0x776E4abe7d73Fed007099518F3aA02C8dDa9baA0",
  CALL_SOLANA_SAMPLE_CONTRACT_MAINNET:
    "0x5BAB7cAb78D378bBf325705C51ec4649200A311b",
  ICS_FLOW_MAINNET: "0x16906ADb704590F94F8a32ff0a690306A34A0bfC",
  VAULTCRAFT_FLOW_MAINNET: "0xBD8bAFA0b09920b2933dd0eD044f27B10B20F265",
  CREATE_RAYDIUM_POOL_MAINNET: "0x4c7a02A3c24836511436b9470535B783849e4F69",
  CREATE_RAYDIUM_POOL_DEVNET: "0x1956Ef8dC5C3d08caD18753Fc5c1fc17e1d3862c",
  DATA: {
    SVM: {
      ADDRESSES: {
        WSOL: "So11111111111111111111111111111111111111112",
        USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
        WBTC: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
        RAY: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
        TNEON: "AX4fyYtJ3siMimcDercvZPQnus9SCG4xWicHJck9URhd",
        TNEON2: "HEantcHdnmLdjo7noFC5Qqhz3NCG8m6ivvk5vp7QZX8Q", // DEVNET
        NEON_PROGRAM: "NeonVMyRX5GbCrsAHnUwx1nYYoJAtskU1bWUo6JGNyG",
        ORCA_PROGRAM: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
        ORCA_WSOL_USDC_POOL: "Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE",
        ORCA_WBTC_USDC_POOL: "55BrDTCLWayM16GwrMEQU57o4PTm6ceF9wavSdNZcEiy",
        WHIRLPOOLS_CONFIG: "2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ",
        RAYDIUM_PROGRAM: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
        RAYDIUM_PROGRAM_DEVNET: "HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8", //DEVNET
        RAYDIUM_RAY_USDC_POOL: "6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg",
        RAYDIUM_RAY_SOL_POOL: "AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA",
        RAYDIUM_SOL_USDC_POOL: "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2",
        RAYDIUM_SOL_WBTC_POOL: "HCfytQ49w6Dn9UhHCqjNYTZYQ6z5SwqmsyYYqW4EKDdA",
        RAYDIUM_SOL_USDT_POOL: "7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX",
        JUPITER_PROGRAM: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      },
    },
    EVM: {
      ADDRESSES: {
        WSOL: "0x5f38248f339bf4e84a2caf4e4c0552862dc9f82a",
        WSOL_DEVNET: "0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c",
        USDC: "0xea6b04272f9f62f997f666f07d3a974134f7ffb9",
        USDT: "0x5f0155d08eF4aaE2B500AefB64A3419dA8bB611a",
        WBTC: "0x16a3Fe59080D6944A42B441E44450432C1445372",
        TNEON: "0x4a146030d717a06e4ee7771b7c21cf836649d45f",
        TNEON2: "0x2e6bff0797e262182d048e517ff7a6aef9131842", // DEVNET
      },
      ABIs: {
        ERC20ForSPL: [
          {
            inputs: [
              { internalType: "bytes32", name: "_tokenMint", type: "bytes32" },
            ],
            stateMutability: "nonpayable",
            type: "constructor",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                indexed: true,
                internalType: "address",
                name: "spender",
                type: "address",
              },
              {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            name: "Approval",
            type: "event",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
              },
              {
                indexed: true,
                internalType: "bytes32",
                name: "spender",
                type: "bytes32",
              },
              {
                indexed: false,
                internalType: "uint64",
                name: "amount",
                type: "uint64",
              },
            ],
            name: "ApprovalSolana",
            type: "event",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
              },
              {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
              },
              {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
              },
            ],
            name: "Transfer",
            type: "event",
          },
          {
            anonymous: false,
            inputs: [
              {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
              },
              {
                indexed: true,
                internalType: "bytes32",
                name: "to",
                type: "bytes32",
              },
              {
                indexed: false,
                internalType: "uint64",
                name: "amount",
                type: "uint64",
              },
            ],
            name: "TransferSolana",
            type: "event",
          },
          {
            inputs: [
              { internalType: "address", name: "owner", type: "address" },
              { internalType: "address", name: "spender", type: "address" },
            ],
            name: "allowance",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "spender", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "approve",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "bytes32", name: "spender", type: "bytes32" },
              { internalType: "uint64", name: "amount", type: "uint64" },
            ],
            name: "approveSolana",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [{ internalType: "address", name: "who", type: "address" }],
            name: "balanceOf",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "burn",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "from", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "burnFrom",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "bytes32", name: "from", type: "bytes32" },
              { internalType: "uint64", name: "amount", type: "uint64" },
            ],
            name: "claim",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "bytes32", name: "from", type: "bytes32" },
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint64", name: "amount", type: "uint64" },
            ],
            name: "claimTo",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [],
            name: "decimals",
            outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "name",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "symbol",
            outputs: [{ internalType: "string", name: "", type: "string" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "tokenMint",
            outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [],
            name: "totalSupply",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "transfer",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "address", name: "from", type: "address" },
              { internalType: "address", name: "to", type: "address" },
              { internalType: "uint256", name: "amount", type: "uint256" },
            ],
            name: "transferFrom",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
          {
            inputs: [
              { internalType: "bytes32", name: "to", type: "bytes32" },
              { internalType: "uint64", name: "amount", type: "uint64" },
            ],
            name: "transferSolana",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "nonpayable",
            type: "function",
          },
        ],
      },
    },
  },
  utils: {
    prepareInstructionAccounts: function (instruction, overwriteAccounts) {
      let encodeKeys = "";
      for (let i = 0, len = instruction.keys.length; i < len; ++i) {
        if (
          typeof overwriteAccounts != "undefined" &&
          Object.hasOwn(overwriteAccounts, i)
        ) {
          console.log(
            config.utils.publicKeyToBytes32(overwriteAccounts[i].key),
            "publicKey"
          );
          encodeKeys += ethers
            .solidityPacked(
              ["bytes32"],
              [config.utils.publicKeyToBytes32(overwriteAccounts[i].key)]
            )
            .substring(2);
          encodeKeys += ethers
            .solidityPacked(["bool"], [overwriteAccounts[i].isSigner])
            .substring(2);
          encodeKeys += ethers
            .solidityPacked(["bool"], [overwriteAccounts[i].isWritable])
            .substring(2);
        } else {
          console.log(
            config.utils.publicKeyToBytes32(
              instruction.keys[i].pubkey.toString()
            ),
            "publicKey"
          );
          encodeKeys += ethers
            .solidityPacked(
              ["bytes32"],
              [
                config.utils.publicKeyToBytes32(
                  instruction.keys[i].pubkey.toString()
                ),
              ]
            )
            .substring(2);
          encodeKeys += ethers
            .solidityPacked(["bool"], [instruction.keys[i].isSigner])
            .substring(2);
          encodeKeys += ethers
            .solidityPacked(["bool"], [instruction.keys[i].isWritable])
            .substring(2);
        }
      }

      return (
        "0x" +
        ethers
          .zeroPadBytes(ethers.toBeHex(instruction.keys.length), 8)
          .substring(2) +
        encodeKeys
      );
    },
    prepareInstructionData: function (instruction) {
      const packedInstructionData = ethers
        .solidityPacked(["bytes"], [instruction.data])
        .substring(2);
      console.log(packedInstructionData, "packedInstructionData");

      return (
        "0x" +
        ethers
          .zeroPadBytes(ethers.toBeHex(instruction.data.length), 8)
          .substring(2) +
        packedInstructionData
      );
    },
    prepareInstruction: function (instruction) {
      return (
        config.utils.publicKeyToBytes32(instruction.programId.toBase58()) +
        config.utils.prepareInstructionAccounts(instruction).substring(2) +
        config.utils.prepareInstructionData(instruction).substring(2)
      );
    },
    execute: async function (
      instruction,
      lamports,
      contractInstance,
      salt,
      msgSender
    ) {
      if (salt == undefined) {
        salt =
          "0x0000000000000000000000000000000000000000000000000000000000000000";
      }

      const tx = await contractInstance
        .connect(msgSender)
        .execute(lamports, salt, config.utils.prepareInstruction(instruction));

      const receipt = await tx.wait(3);
      return [tx, receipt];
    },
    batchExecute: async function (
      instructions,
      lamports,
      contractInstance,
      salts,
      msgSender
    ) {
      let setSalts = false;
      if (salts == undefined) {
        setSalts = true;
        salts = [];
      }

      let instructionsDataArr = [];
      for (let i = 0, len = instructions.length; i < len; ++i) {
        instructionsDataArr.push(
          config.utils.prepareInstruction(instructions[i])
        );

        if (setSalts) {
          salts.push(
            "0x0000000000000000000000000000000000000000000000000000000000000000"
          );
        }
      }

      const tx = await contractInstance
        .connect(msgSender)
        .batchExecute(lamports, salts, instructionsDataArr);
      const receipt = await tx.wait(3);

      return [tx, receipt];
    },
    publicKeyToBytes32: function (pubkey) {
      return ethers.zeroPadValue(
        ethers.toBeHex(ethers.decodeBase58(pubkey)),
        32
      );
    },
    addressToBytes32: function (address) {
      return ethers.zeroPadValue(ethers.toBeHex(address), 32);
    },
    calculateTokenAccount: function (
      tokenEvmAddress,
      userEvmAddress,
      neonEvmProgram
    ) {
      const neonAccountAddressBytes = Buffer.concat([
        Buffer.alloc(12),
        Buffer.from(
          config.utils.isValidHex(userEvmAddress)
            ? userEvmAddress.substring(2)
            : userEvmAddress,
          "hex"
        ),
      ]);
      const seed = [
        new Uint8Array([0x03]),
        new Uint8Array(Buffer.from("ContractData", "utf-8")),
        Buffer.from(tokenEvmAddress.substring(2), "hex"),
        Buffer.from(neonAccountAddressBytes, "hex"),
      ];

      return web3.PublicKey.findProgramAddressSync(seed, neonEvmProgram);
    },
    isValidHex: function (hex) {
      const isHexStrict = /^(0x)?[0-9a-f]*$/i.test(hex.toString());
      if (!isHexStrict) {
        throw new Error(`Given value "${hex}" is not a valid hex string.`);
      } else {
        return isHexStrict;
      }
    },
    toFixed: function (num, fixed) {
      let re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
      return num.toString().match(re)[0];
    },
  },
  orcaHelper: {
    getParamsFromPools: function (
      pools,
      PDAUtil,
      programId,
      ataContractTokenA,
      ataContractTokenB,
      ataContractTokenC
    ) {
      const whirlpoolOne = pools[0].address;
      const whirlpoolTwo = pools[1].address;
      const oracleOne = PDAUtil.getOracle(programId, whirlpoolOne).publicKey;
      const oracleTwo = PDAUtil.getOracle(programId, whirlpoolTwo).publicKey;

      return {
        whirlpoolOne: whirlpoolOne,
        whirlpoolTwo: whirlpoolTwo,
        tokenOwnerAccountOneA: ataContractTokenA,
        tokenVaultOneA: pools[0].tokenVaultAInfo.address,
        tokenOwnerAccountOneB: ataContractTokenB,
        tokenVaultOneB: pools[0].tokenVaultBInfo.address,
        tokenOwnerAccountTwoA: ataContractTokenC,
        tokenVaultTwoA: pools[1].tokenVaultAInfo.address,
        tokenOwnerAccountTwoB: ataContractTokenB,
        tokenVaultTwoB: pools[1].tokenVaultBInfo.address,
        oracleOne,
        oracleTwo,
      };
    },
    getTokenAccsForPools: function (pools, tokenAccounts) {
      const mints = [];
      for (const pool of pools) {
        mints.push(pool.tokenMintA);
        mints.push(pool.tokenMintB);
      }

      return mints.map(
        (mint) => tokenAccounts.find((acc) => acc.mint.equals(mint)).account
      );
    },
  },
  raydiumHelper: {
    calcAmountOut: async function (
      connection,
      poolKeys,
      rawAmountIn,
      swapInDirection,
      slippage
    ) {
      const poolInfo = await Liquidity.fetchInfo({
        connection: connection,
        poolKeys,
      });
      let currencyInMint = poolKeys.baseMint;
      let currencyInDecimals = poolInfo.baseDecimals;
      let currencyOutMint = poolKeys.quoteMint;
      let currencyOutDecimals = poolInfo.quoteDecimals;

      if (!swapInDirection) {
        currencyInMint = poolKeys.quoteMint;
        currencyInDecimals = poolInfo.quoteDecimals;
        currencyOutMint = poolKeys.baseMint;
        currencyOutDecimals = poolInfo.baseDecimals;
      }

      const currencyIn = new Token(
        TOKEN_PROGRAM_ID,
        currencyInMint,
        currencyInDecimals
      );
      const currencyOut = new Token(
        TOKEN_PROGRAM_ID,
        currencyOutMint,
        currencyOutDecimals
      );
      const amountIn = new TokenAmount(currencyIn, rawAmountIn, false);
      const {
        amountOut,
        minAmountOut,
        currentPrice,
        executionPrice,
        priceImpact,
        fee,
      } = Liquidity.computeAmountOut({
        poolKeys,
        poolInfo,
        amountIn,
        currencyOut,
        slippage: new Percent(slippage, 100),
      });

      return [
        amountIn,
        amountOut,
        minAmountOut,
        currentPrice,
        executionPrice,
        priceImpact,
        fee,
      ];
    },
    calcAmountIn: async function (
      connection,
      poolKeys,
      rawAmountOut,
      swapInDirection,
      slippage
    ) {
      const poolInfo = await Liquidity.fetchInfo({
        connection: connection,
        poolKeys,
      });
      let currencyInMint = poolKeys.baseMint;
      let currencyInDecimals = poolInfo.baseDecimals;
      let currencyOutMint = poolKeys.quoteMint;
      let currencyOutDecimals = poolInfo.quoteDecimals;

      if (!swapInDirection) {
        currencyInMint = poolKeys.quoteMint;
        currencyInDecimals = poolInfo.quoteDecimals;
        currencyOutMint = poolKeys.baseMint;
        currencyOutDecimals = poolInfo.baseDecimals;
      }

      const currencyIn = new Token(
        TOKEN_PROGRAM_ID,
        currencyInMint,
        currencyInDecimals
      );
      const currencyOut = new Token(
        TOKEN_PROGRAM_ID,
        currencyOutMint,
        currencyOutDecimals
      );
      const amountOut = new TokenAmount(currencyOut, rawAmountOut, false);
      const {
        amountIn,
        maxAmountIn,
        currentPrice,
        executionPrice,
        priceImpact,
      } = Liquidity.computeAmountIn({
        poolKeys,
        poolInfo,
        amountOut,
        currencyIn,
        slippage: new Percent(slippage, 100),
      });

      return [
        amountIn,
        amountOut,
        maxAmountIn,
        currentPrice,
        executionPrice,
        priceImpact,
      ];
    },
    findPoolInfoForTokens: async function (liquidityFile, mintA, mintB) {
      const liquidityJson = JSON.parse(
        fs.readFileSync(__dirname + "/" + liquidityFile, "utf8")
      );

      /* const liquidityJsonResp = await fetch(liquidityFile);
            if (!liquidityJsonResp.ok) return
            const liquidityJson = (await liquidityJsonResp.json()) */

      const allPoolKeysJson = [
        ...(liquidityJson?.official ?? []),
        ...(liquidityJson?.unOfficial ?? []),
      ];

      const poolData = allPoolKeysJson.find(
        (i) =>
          (i.baseMint === mintA && i.quoteMint === mintB) ||
          (i.baseMint === mintB && i.quoteMint === mintA)
      );

      if (!poolData) {
        return null;
      } else {
        return config.raydiumHelper.jsonInfo2PoolKeys(poolData);
      }
    },
    jsonInfo2PoolKeys: function (jsonInfo) {
      // @ts-expect-error no need type for inner code
      return typeof jsonInfo === "string"
        ? config.raydiumHelper.validateAndParsePublicKey(jsonInfo)
        : Array.isArray(jsonInfo)
        ? jsonInfo.map((k) => config.raydiumHelper.jsonInfo2PoolKeys(k))
        : config.raydiumHelper.notInnerObject(jsonInfo)
        ? Object.fromEntries(
            Object.entries(jsonInfo).map(([k, v]) => [
              k,
              config.raydiumHelper.jsonInfo2PoolKeys(v),
            ])
          )
        : jsonInfo;
    },
    validateAndParsePublicKey: function (publicKey) {
      if (publicKey instanceof web3.PublicKey) {
        return publicKey;
      }

      if (typeof publicKey === "string") {
        try {
          const key = new web3.PublicKey(publicKey);
          return key;
        } catch {
          throw new Error("invalid public key", "publicKey", publicKey);
        }
      }
      throw new Error("invalid public key", "publicKey", publicKey);
    },
    notInnerObject: function (v) {
      return (
        typeof v === "object" &&
        v !== null &&
        ![
          TokenAmount,
          web3.PublicKey,
          Fraction,
          BN,
          Currency,
          CurrencyAmount,
          Price,
          Percent,
        ].some((o) => typeof o === "object" && v instanceof o)
      );
    },
    formatAmmKeysById: async function (connection, id) {
      const account = await connection.getAccountInfo(new web3.PublicKey(id));
      if (account === null) throw Error(" get id info error ");
      const info = LIQUIDITY_STATE_LAYOUT_V4.decode(account.data);

      const marketId = info.marketId;
      const marketAccount = await connection.getAccountInfo(marketId);
      if (marketAccount === null) throw Error(" get market info error");
      const marketInfo = MARKET_STATE_LAYOUT_V3.decode(marketAccount.data);

      const lpMint = info.lpMint;
      const lpMintAccount = await connection.getAccountInfo(lpMint);
      if (lpMintAccount === null) throw Error(" get lp mint info error");
      const lpMintInfo = SPL_MINT_LAYOUT.decode(lpMintAccount.data);

      return {
        id,
        baseMint: info.baseMint.toString(),
        quoteMint: info.quoteMint.toString(),
        lpMint: info.lpMint.toString(),
        baseDecimals: info.baseDecimal.toNumber(),
        quoteDecimals: info.quoteDecimal.toNumber(),
        lpDecimals: lpMintInfo.decimals,
        version: 4,
        programId: account.owner.toString(),
        authority: Liquidity.getAssociatedAuthority({
          programId: account.owner,
        }).publicKey.toString(),
        openOrders: info.openOrders.toString(),
        targetOrders: info.targetOrders.toString(),
        baseVault: info.baseVault.toString(),
        quoteVault: info.quoteVault.toString(),
        withdrawQueue: info.withdrawQueue.toString(),
        lpVault: info.lpVault.toString(),
        marketVersion: 3,
        marketProgramId: info.marketProgramId.toString(),
        marketId: info.marketId.toString(),
        marketAuthority: Market.getAssociatedAuthority({
          programId: info.marketProgramId,
          marketId: info.marketId,
        }).publicKey.toString(),
        marketBaseVault: marketInfo.baseVault.toString(),
        marketQuoteVault: marketInfo.quoteVault.toString(),
        marketBids: marketInfo.bids.toString(),
        marketAsks: marketInfo.asks.toString(),
        marketEventQueue: marketInfo.eventQueue.toString(),
        lookupTableAccount: web3.PublicKey.default.toString(),
      };
    },
    getWalletTokenAccount: async function (connection, wallet) {
      const walletTokenAccount = await connection.getTokenAccountsByOwner(
        wallet,
        {
          programId: TOKEN_PROGRAM_ID,
        }
      );

      return walletTokenAccount.value.map((i) => ({
        pubkey: i.pubkey,
        programId: i.account.owner,
        accountInfo: SPL_ACCOUNT_LAYOUT.decode(i.account.data),
      }));
    },
  },
};
module.exports = { config };
