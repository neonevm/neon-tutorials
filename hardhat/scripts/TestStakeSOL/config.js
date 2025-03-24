const config = {
    SOLANA_NODE: 'https://api.devnet.solana.com',
    SOLANA_NODE_MAINNET: 'https://api.mainnet-beta.solana.com/',
    STAKE_SOL_SAMPLE_CONTRACT: '0xd7DF1523d385De4cE4c66F5944023F1AFA07d039',
    STAKE_SOL_SAMPLE_CONTRACT_MAINNET: '',
    DATA: {
        EVM: {
            DEVNET: {
                ADDRESSES: {
                    WSOL: '0xc7Fc9b46e479c5Cb42f6C458D1881e55E6B7986c',
                }
            },
            MAINNET: {
                ADDRESSES: {
                    WSOL: '',
                }
            }
        },
        SVM: {
            DEVNET: {
                ADDRESSES: {
                    NEON_PROGRAM: 'eeLSJgWzzxrqKv1UxtRVVH8FX3qCQWUs9QuAjJpETGU',
                }
            },
            MAINNET: {
                ADDRESSES: {
                    NEON_PROGRAM: '',
                }
            }
        }
    }
};
module.exports = { config };