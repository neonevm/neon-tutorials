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
    CALL_SOLANA_SAMPLE_CONTRACT: '0x004FB641e6C998Fc7dbdfB595F723727c8d07535',
    CALL_SOLANA_SAMPLE_CONTRACT_MAINNET: '0xEf7b3ed123d2c51c780F8684B0DD7c0b4bd89190',
    utils: {
        executeComposabilityMethod: async function(instruction, lamports, contractInstance, seed, msgSender) {
            let keys = [];
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                if (instruction.keys[i].pubkey != undefined) {
                    keys.push({
                        account: config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString()),
                        is_signer: instruction.keys[i].isSigner,
                        is_writable: instruction.keys[i].isWritable
                    });
                }
            }
    
            if (seed == undefined) {
                seed = '0x0000000000000000000000000000000000000000000000000000000000000000';
            }
            const tx = await contractInstance.connect(msgSender).execute(
                config.utils.publicKeyToBytes32(instruction.programId.toString()),
                keys,
                instruction.data,
                lamports,
                seed
            );
            const receipt = await tx.wait(3);

            return [tx, receipt];
        },
        batchExecuteComposabilityMethod: async function(instructions, lamports, contractInstance, seeds, msgSender) {
            let keysArr = [];
            let programIds = [];
            let instructionsData = [];
            let setSeeds = false;
            if (seeds == undefined) {
                setSeeds = true;
                seeds = [];
            }
            for (let i = 0, len = instructions.length; i < len; ++i) {
                let keys = [];
                for (let y = 0, leny = instructions[i].keys.length; y < leny; ++y) {
                    if (instructions[i].keys[y].pubkey != undefined) {
                        keys.push({
                            account: config.utils.publicKeyToBytes32(instructions[i].keys[y].pubkey.toString()),
                            is_signer: instructions[i].keys[y].isSigner,
                            is_writable: instructions[i].keys[y].isWritable
                        });
                    }
                }
                keysArr.push(keys);
                programIds.push(config.utils.publicKeyToBytes32(instructions[i].programId.toString()));
                instructionsData.push(instructions[i].data);

                if (setSeeds) {
                    seeds.push('0x0000000000000000000000000000000000000000000000000000000000000000');
                }
            }
    
            const tx = await contractInstance.connect(msgSender).batchExecute(
                programIds,
                keysArr,
                instructionsData,
                lamports,
                seeds
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
        
            return {
                amountIn,
                amountOut,
                minAmountOut,
                currentPrice,
                executionPrice,
                priceImpact,
                fee
            }
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