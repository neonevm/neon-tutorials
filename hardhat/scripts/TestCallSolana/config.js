const config = {
    SOLANA_NODE: 'https://personal-access-devnet.sol-rpc.neoninfra.xyz:8513/FB2702O22GSyGdGOpaAj2J723mZASFmBWdeTiXas',
    CALL_SOLANA_SAMPLE_CONTRACT: '0xae77695Be546Dd3DD410fEb948940578e478cDea',
    SIZES: {
        SPLTOKEN: 84,
        SPLTOKEN_ACOUNT: 165
    },
    utils: {
        executeComposabilityMethod: async function(instruction, lamports, contractInstance) {
            let keys = [];
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                keys.push({
                    account: config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString()),
                    is_signer: instruction.keys[i].isSigner,
                    is_writable: instruction.keys[i].isWritable
                });
            }
    
            let tx = await contractInstance.execute(
                config.utils.publicKeyToBytes32(instruction.programId.toString()),
                keys,
                instruction.data,
                lamports
            );
            await tx.wait(3);
            return tx;
        },
        batchExecuteComposabilityMethod: async function(instructions, lamports, contractInstance) {
            let keysArr = [];
            let programIds = [];
            let instructionsData = [];
            for (let i = 0, len = instructions.length; i < len; ++i) {
                let keys = [];
                for (let y = 0, leny = instructions[i].keys.length; y < leny; ++y) {
                    keys.push({
                        account: config.utils.publicKeyToBytes32(instructions[i].keys[y].pubkey.toString()),
                        is_signer: instructions[i].keys[y].isSigner,
                        is_writable: instructions[i].keys[y].isWritable
                    });
                }
                keysArr.push(keys);
                programIds.push(config.utils.publicKeyToBytes32(instructions[i].programId.toString()));
                instructionsData.push(instructions[i].data);
            }
    
            let tx = await contractInstance.batchExecute(
                programIds,
                keysArr,
                instructionsData,
                lamports
            );
            await tx.wait(3);
            return tx;
        },
        publicKeyToBytes32(pubkey) {
            return ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(pubkey)), 32);
        }
    }
  };
  
  module.exports = { config };
  

// default size of every Solana account is 128 bytes
// Solana can't allow transfer from accounts with data
// createAccount + SOL transfer - not working, becuase we cannot attach private key
// createAccountWithSeed + SOL transferWithSeed - not working if account has data
// 1 400 000 compute units = ~8 instructions
// you cant execute more than 1 instruction into call to 006 precompile, but you can make multiple calls to the precompile inside single solidity method call
// List with instructions that are currently not supported:
// transfer
// setComputeUnitLimit
// setComputeUnitPrice