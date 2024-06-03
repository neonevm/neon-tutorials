const config = {
    utils: {
        executeComposabilityMethod: async function(instruction, lamports, contractInstance) {
            let keys = [];
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                keys.push({
                    account: ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(instruction.keys[i].pubkey.toString())), 32),
                    is_signer: instruction.keys[i].isSigner,
                    is_writable: instruction.keys[i].isWritable
                });
            }
    
            let tx = await contractInstance.execute(
                ethers.zeroPadValue(ethers.toBeHex(ethers.decodeBase58(instruction.programId.toString())), 32),
                keys,
                instruction.data,
                lamports // lamports
            );
            await tx.wait(3);
            return tx;
        }
    },
    SOLANA_NODE: 'https://personal-access-devnet.sol-rpc.neoninfra.xyz:8513/FB2702O22GSyGdGOpaAj2J723mZASFmBWdeTiXas',
    SIZES: {
        SPLTOKEN: 84,
        SPLTOKEN_ACOUNT: 165
    }
  };
  
  module.exports = { config };
  

// default size of every Solana account is 128 bytes
// Solana can't allow transfer from accounts with data
// createAccount + SOL transfer - not working, becuase we cannot attach private key
// createAccountWithSeed + SOL transferWithSeed - not working if account has data
    // 1 400 000 compute units = ~8 instructions
    // you cant execute more than 1 instruction into call to 006 precompile, but you can make multiple calls to the precompile inside single solidity method call