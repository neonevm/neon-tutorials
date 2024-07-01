const config = {
    SOLANA_NODE: 'https://api.devnet.solana.com',
    CALL_SOLANA_SAMPLE_CONTRACT: '0x004FB641e6C998Fc7dbdfB595F723727c8d07535',
    utils: {
        executeComposabilityMethod: async function(instruction, lamports, contractInstance, seed, msgSender) {
            let keys = [];
            for (let i = 0, len = instruction.keys.length; i < len; ++i) {
                keys.push({
                    account: config.utils.publicKeyToBytes32(instruction.keys[i].pubkey.toString()),
                    is_signer: instruction.keys[i].isSigner,
                    is_writable: instruction.keys[i].isWritable
                });
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
                    keys.push({
                        account: config.utils.publicKeyToBytes32(instructions[i].keys[y].pubkey.toString()),
                        is_signer: instructions[i].keys[y].isSigner,
                        is_writable: instructions[i].keys[y].isWritable
                    });
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
    }
};
module.exports = { config };