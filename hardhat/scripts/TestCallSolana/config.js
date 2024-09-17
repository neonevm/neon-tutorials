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
    ICS_FLOW_MAINNET: '0xE1498451381968185911aC5E056Cd18CCCc1a4B5',
    utils: {
        prepareInstructionAccounts: function(instruction) {
            let encodeKeys = '';
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                console.log(config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString()), 'pk');
                encodeKeys+= ethers.solidityPacked(["bytes32"], [config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString())]).substring(2);
                encodeKeys+= ethers.solidityPacked(["bool"], [instruction.keys[i].isSigner]).substring(2);
                encodeKeys+= ethers.solidityPacked(["bool"], [instruction.keys[i].isWritable]).substring(2);
            }

            return '0x' + ethers.zeroPadBytes(ethers.toBeHex(instruction.keys.length), 8).substring(2) + encodeKeys;
        },
        prepareInstructionData: function(instruction) {
            const packedInstructionData = ethers.solidityPacked( 
                ["bytes"],
                [instruction.data]
            ).substring(2);

            // Orca:
            // USDC -> WSOL
            // f8c69e91e17587c81027000000000000d92c010000000000af331ba8327fbb35b1c4feff000000000100

            // WSOL -> USDC
            // f8c69e91e17587c8a086010000000000aa31000000000000503b01000100000000000000000000000101

            // WSOL -> WBTC
            // f8c69e91e17587c8a0860100000000001600000000000000503b01000100000000000000000000000101

            // WBTC <> SOL
            // f8c69e91e17587c840420f0000000000936bb42000000000503b01000100000000000000000000000101

            // Raydium

            return /* packedProgramId +  */ '0x' + ethers.zeroPadBytes(ethers.toBeHex(instruction.data.length), 8).substring(2) + packedInstructionData;
        },
        execute: async function(instruction, lamports, contractInstance, salt, msgSender) { 
            if (salt == undefined) {
                salt = '0x0000000000000000000000000000000000000000000000000000000000000000';
            }
            
            const tx = await contractInstance.connect(msgSender).execute(
                lamports,
                salt,
                config.utils.prepareInstructionData(instruction)
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

            let instructionsDataArr = [];
            for (let i = 0, len = instructions.length; i < len; ++i) {
                instructionsDataArr.push(config.utils.prepareInstructionData(instructions[i]));

                if (setSalts) {
                    salts.push('0x0000000000000000000000000000000000000000000000000000000000000000');
                }
            }
    
            const tx = await contractInstance.connect(msgSender).batchExecute(
                lamports,
                salts,
                instructionsDataArr
            );
            const receipt = await tx.wait(3);

            return [tx, receipt];
        },
        publicKeyToBytes32: function(pubkey) {
            return ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(pubkey)), 32);
        },
        addressToBytes32: function(address) {
            return ethers.zeroPadValue(ethers.toBeHex(address), 32);
        },
        calculateTokenAccount: function (tokenEvmAddress, userEvmAddress, neonEvmProgram) {
            const neonAccountAddressBytes = Buffer.concat([Buffer.alloc(12), Buffer.from(config.utils.isValidHex(userEvmAddress) ? userEvmAddress.substring(2) : userEvmAddress, 'hex')]);
            const seed = [
                new Uint8Array([0x03]),
                new Uint8Array(Buffer.from('ContractData', 'utf-8')),
                Buffer.from(tokenEvmAddress.substring(2), 'hex'),
                Buffer.from(neonAccountAddressBytes, 'hex')
            ];
        
            return web3.PublicKey.findProgramAddressSync(seed, neonEvmProgram);
        },
        isValidHex: function(hex) {
            const isHexStrict = /^(0x)?[0-9a-f]*$/i.test(hex.toString());
            if (!isHexStrict) {
                throw new Error(`Given value "${hex}" is not a valid hex string.`);
                //return console.error(`Given value "${hex}" is not a valid hex string.`);
            } else {
                return isHexStrict;
            }
        }
    },
    orcaHelper: {
        getParamsFromPools: function(
            pools, 
            PDAUtil, 
            programId,
            ataContractTokenA,
            ataContractTokenB,
            ataContractTokenC
        ) {
            const whirlpoolOne = pools[0].address;
            const whirlpoolTwo = pools[1].address;
            const oracleOne = PDAUtil.getOracle(
                programId,
                whirlpoolOne,
            ).publicKey;
            const oracleTwo = PDAUtil.getOracle(
                programId,
                whirlpoolTwo,
            ).publicKey;

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
                oracleTwo
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
    },
    DATA: {
        SVM: {
            ADDRESSES: {
                SOL: 'So11111111111111111111111111111111111111112',
                USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                WBTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
                NEON_PROGRAM: 'NeonVMyRX5GbCrsAHnUwx1nYYoJAtskU1bWUo6JGNyG',
                ORCA_PROGRAM: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
                ORCA_WSOL_USDC_POOL: 'Czfq3xZZDmsdGdUyrNLtRhGc47cXcZtLG4crryfu44zE',
                ORCA_WBTC_USDC_POOL: '55BrDTCLWayM16GwrMEQU57o4PTm6ceF9wavSdNZcEiy',
                WHIRLPOOLS_CONFIG: '2LecshUwdy9xi7meFgHtFJQNSKk4KdTrcpvaB56dP2NQ',
                RAYDIUM_PROGRAM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'
            }
        },
        EVM: {
            ADDRESSES: {
                WSOL: '0x5f38248f339bf4e84a2caf4e4c0552862dc9f82a',
                USDC: '0xea6b04272f9f62f997f666f07d3a974134f7ffb9',
                WBTC: '0x16a3Fe59080D6944A42B441E44450432C1445372'
            },
            ABIs: {
                ERC20ForSPL: [{"inputs":[{"internalType":"bytes32","name":"_tokenMint","type":"bytes32"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"bytes32","name":"spender","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"amount","type":"uint64"}],"name":"ApprovalSolana","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"bytes32","name":"to","type":"bytes32"},{"indexed":false,"internalType":"uint64","name":"amount","type":"uint64"}],"name":"TransferSolana","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"spender","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"approveSolana","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"who","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burn","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"burnFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"from","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"claim","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"from","type":"bytes32"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"claimTo","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"tokenMint","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"to","type":"bytes32"},{"internalType":"uint64","name":"amount","type":"uint64"}],"name":"transferSolana","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]
            }
        }
    }
};
module.exports = { config };