const config = {
    SOLANA_NODE: 'https://personal-access-devnet.sol-rpc.neoninfra.xyz:8513/FB2702O22GSyGdGOpaAj2J723mZASFmBWdeTiXas',
    //SOLANA_NODE: 'https://api.mainnet-beta.solana.com/',
    CALL_SOLANA_SAMPLE_CONTRACT: '0xE41A9faeb17bfAb7f4F6c4CE201c05ED5F1B4eeA',
    ACCOUNTS: {
        TOKEN_PROGRAM: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
    },
    SIZES: {
        ACCOUNT: 70,
        SPLTOKEN: 82, // needed bytes for SPLToken mint and initialization
        SPLTOKEN_ACOUNT: 165 // needed bytes to initalize a Token Account
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
    
            const tx = await contractInstance.execute(
                config.utils.publicKeyToBytes32(instruction.programId.toString()),
                keys,
                instruction.data,
                lamports
            );
            const receipt = await tx.wait(3);

            return [tx, receipt];
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
    
            const tx = await contractInstance.batchExecute(
                programIds,
                keysArr,
                instructionsData,
                lamports
            );
            const receipt = await tx.wait(3);

            return [tx, receipt];
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
//
// List with instructions that are currently not supported:
// createAccount :
//    ( createResource + getResourceAddress ) + transfer
//    ( test with getExtAuthority + executeWithSeed )
// transfer
// setComputeUnitLimit
// setComputeUnitPrice