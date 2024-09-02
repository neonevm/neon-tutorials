const web3 = require("@solana/web3.js");
const {
    Token,
    TOKEN_PROGRAM_ID,
    TokenAmount, 
    Fraction, 
    Currency, 
    CurrencyAmount, 
    Price, 
    Percent
} = require('@raydium-io/raydium-sdk');
const { BN } = require('bn.js');

const config = {
    SOLANA_NODE: 'https://api.devnet.solana.com',
    SOLANA_NODE_MAINNET: 'https://api.mainnet-beta.solana.com/',
    CALL_SOLANA_SAMPLE_CONTRACT: '0x776E4abe7d73Fed007099518F3aA02C8dDa9baA0',
    CALL_SOLANA_SAMPLE_CONTRACT_MAINNET: '0x5BAB7cAb78D378bBf325705C51ec4649200A311b',
    utils: {
        execute: async function(instruction, lamports, contractInstance, salt, msgSender) {
            const packedProgramId = ethers.solidityPacked( 
                ["bytes32"],
                [config.utils.publicKeyToBytes32(instruction.programId.toBase58())]
            );

            let encodeKeys = '';
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                encodeKeys+= ethers.solidityPacked(["bytes32"], [config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString())]).substring(2);
                encodeKeys+= ethers.solidityPacked(["bool"], [instruction.keys[i].isSigner]).substring(2);
                encodeKeys+= ethers.solidityPacked(["bool"], [instruction.keys[i].isWritable]).substring(2);
            }

            const packedInstructionData = ethers.solidityPacked( 
                ["bytes"],
                [instruction.data]
            ).substring(2);
            
            if (salt == undefined) {
                salt = '0x0000000000000000000000000000000000000000000000000000000000000000';
            }
            
            const tx = await contractInstance.connect(msgSender).execute(
                lamports,
                salt,
                packedProgramId + ethers.zeroPadBytes(ethers.toBeHex(instruction.keys.length), 8).substring(2) + encodeKeys + ethers.zeroPadBytes(ethers.toBeHex(instruction.data.length), 8).substring(2) + packedInstructionData
            );

            const receipt = await tx.wait(3);
            return [tx, receipt];
        },
        batchExecute: async function(instructions, lamports, contractInstance, salts, msgSender) {
            let setSalts = false;
            if (salts == undefined) {
                setSalts = true;
                salts = [];
            }

            let bytesDataArr = [];
            for (let i = 0, len = instructions.length; i < len; ++i) {
                let packedProgramId = ethers.solidityPacked( 
                    ["bytes32"],
                    [config.utils.publicKeyToBytes32(instructions[i].programId.toBase58())]
                );
    
                let encodeKeys = '';
                for (let y = 0, leny = instructions[i].keys.length; y < leny; ++y) {
                    if (instructions[i].keys[y].pubkey != undefined) {
                        encodeKeys+= ethers.solidityPacked(["bytes32"], [config.utils.publicKeyToBytes32(instructions[i].keys[y].pubkey.toString())]).substring(2);
                        encodeKeys+= ethers.solidityPacked(["bool"], [instructions[i].keys[y].isSigner]).substring(2);
                        encodeKeys+= ethers.solidityPacked(["bool"], [instructions[i].keys[y].isWritable]).substring(2);
                    }
                }
            
                let packedInstructionData = ethers.solidityPacked( 
                    ["bytes"],
                    [instructions[i].data]
                ).substring(2);

                bytesDataArr.push(packedProgramId + ethers.zeroPadBytes(ethers.toBeHex(instructions[i].keys.length), 8).substring(2) + encodeKeys + ethers.zeroPadBytes(ethers.toBeHex(instructions[i].data.length), 8).substring(2) + packedInstructionData);

                if (setSalts) {
                    salts.push('0x0000000000000000000000000000000000000000000000000000000000000000');
                }
            }
    
            const tx = await contractInstance.connect(msgSender).batchExecute(
                lamports,
                salts,
                bytesDataArr
            );
            const receipt = await tx.wait(3);

            return [tx, receipt];
        },
        publicKeyToBytes32(pubkey) {
            return ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(pubkey)), 32);
        },
        addressToBytes32(address) {
            return ethers.zeroPadValue(ethers.toBeHex(address), 32);
        }
    },
    orcaHelper: {
        getParamsFromPools: function(pools, tokenAccounts, PDAUtil) {
            const tokenAccKeys = config.orcaHelper.getTokenAccsForPools(pools, tokenAccounts);
            const whirlpoolOne = pools[0].whirlpoolPda.publicKey;
            const whirlpoolTwo = pools[1].whirlpoolPda.publicKey;
            const oracleOne = PDAUtil.getOracle(
                ctx.program.programId,
                whirlpoolOne,
            ).publicKey;
            const oracleTwo = PDAUtil.getOracle(
                ctx.program.programId,
                whirlpoolTwo,
            ).publicKey;

            return {
                whirlpoolOne: pools[0].whirlpoolPda.publicKey,
                whirlpoolTwo: pools[1].whirlpoolPda.publicKey,
                tokenOwnerAccountOneA: tokenAccKeys[0],
                tokenVaultOneA: pools[0].tokenVaultAKeypair.publicKey,
                tokenOwnerAccountOneB: tokenAccKeys[1],
                tokenVaultOneB: pools[0].tokenVaultBKeypair.publicKey,
                tokenOwnerAccountTwoA: tokenAccKeys[2],
                tokenVaultTwoA: pools[1].tokenVaultAKeypair.publicKey,
                tokenOwnerAccountTwoB: tokenAccKeys[3],
                tokenVaultTwoB: pools[1].tokenVaultBKeypair.publicKey,
                oracleOne,
                oracleTwo,
            };
        },
        getTokenAccsForPools: function(pools, tokenAccounts) {
            const mints = [];
            for (const pool of pools) {
                mints.push(pool.tokenMintA);
                mints.push(pool.tokenMintB);
            }
            return mints.map(
                (mint) => tokenAccounts.find((acc) => acc.mint.equals(mint)).account
            );
        }
    },
    raydiumHelper: {
        calcAmountOut: async function(Liquidity, connection, poolKeys, rawAmountIn, swapInDirection, slippage) {
            const poolInfo = await Liquidity.fetchInfo({ connection: connection, poolKeys });
        
            let currencyInMint = poolKeys.baseMint
            let currencyInDecimals = poolInfo.baseDecimals
            let currencyOutMint = poolKeys.quoteMint
            let currencyOutDecimals = poolInfo.quoteDecimals
        
            if (!swapInDirection) {
                currencyInMint = poolKeys.quoteMint
                currencyInDecimals = poolInfo.quoteDecimals
                currencyOutMint = poolKeys.baseMint
                currencyOutDecimals = poolInfo.baseDecimals
            }
        
            const currencyIn = new Token(TOKEN_PROGRAM_ID, currencyInMint, currencyInDecimals)
            const amountIn = new TokenAmount(currencyIn, rawAmountIn, false)
            const currencyOut = new Token(TOKEN_PROGRAM_ID, currencyOutMint, currencyOutDecimals)
        
            const { amountOut, minAmountOut, currentPrice, executionPrice, priceImpact, fee } = Liquidity.computeAmountOut({
                poolKeys,
                poolInfo,
                amountIn,
                currencyOut,
                slippage: new Percent(slippage, 100)
            })
        
            return [
                amountIn,
                amountOut,
                minAmountOut,
                currentPrice,
                executionPrice,
                priceImpact,
                fee
            ];
        },
        findPoolInfoForTokens: async function(liquidityFile, mintA, mintB) {
            const liquidityJsonResp = await fetch(liquidityFile);
            if (!liquidityJsonResp.ok) return
            const liquidityJson = (await liquidityJsonResp.json())
            const allPoolKeysJson = [...(liquidityJson?.official ?? []), ...(liquidityJson?.unOfficial ?? [])]
        
            const poolData = allPoolKeysJson.find(
                (i) => (i.baseMint === mintA && i.quoteMint === mintB) || (i.baseMint === mintB && i.quoteMint === mintA)
            )
          
            if (!poolData) {
                return null;
            } else {
                return config.raydiumHelper.jsonInfo2PoolKeys(poolData);
            }
        },
        jsonInfo2PoolKeys: function(jsonInfo) {
            // @ts-expect-error no need type for inner code
            return typeof jsonInfo === 'string'
              ? config.raydiumHelper.validateAndParsePublicKey(jsonInfo)
              : Array.isArray(jsonInfo)
              ? jsonInfo.map((k) => config.raydiumHelper.jsonInfo2PoolKeys(k))
              : config.raydiumHelper.notInnerObject(jsonInfo)
              ? Object.fromEntries(Object.entries(jsonInfo).map(([k, v]) => [k, config.raydiumHelper.jsonInfo2PoolKeys(v)]))
              : jsonInfo
        },
        validateAndParsePublicKey: function (publicKey) {
            if (publicKey instanceof web3.PublicKey) {
                return publicKey
            }
          
            if (typeof publicKey === 'string') {
              try {
                const key = new web3.PublicKey(publicKey)
                return key
              } catch {
                throw new Error('invalid public key', 'publicKey', publicKey)
              }
            }
            throw new Error('invalid public key', 'publicKey', publicKey)
        },
        notInnerObject: function(v) {
            return (
                typeof v === 'object' &&
                v !== null &&
                ![TokenAmount, web3.PublicKey, Fraction, BN, Currency, CurrencyAmount, Price, Percent].some(
                    (o) => typeof o === 'object' && v instanceof o,
                )
            )
        }
    }
};
module.exports = { config };