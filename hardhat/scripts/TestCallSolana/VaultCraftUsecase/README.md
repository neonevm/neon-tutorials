# VaultCraft flow with Neon EVM composability to Solana

This flow describes the user's interaction with Solana through Neon EVM's composability feature.

### Commands:
- `npx hardhat run scripts/TestCallSolana/VaultCraftUsecase/TestVaultCraftRaydiumAddLP.js --network neonmainnet` - This script performs the following actions:
    - User depositing WSOL into the protocol
    - Owner approved wallet managing the protocol's assets _( WSOL )_:
        - Transfer the protocol's asset from protocol's arbitrary token account to contract's ATA account
        - Swap half of the protocol's asset to Raydium DEX ( WSOL -> USDC )
        - Provide WSOL and USDC as liquidity to Raydium
- `npx hardhat run scripts/TestCallSolana/VaultCraftUsecase/TestVaultCraftRaydiumRemoveLP.js --network neonmainnet`- This script performs the following actions:
    - Owner approved wallet managing the protocol's assets:
        - Withdraw WSOL and USDC from the LP position in Raydium
        - Swap back the USDC amount to WSOL
        - Transfer the protocol's asset from contract's ATA account to protocol's arbitrary token account

### Comments:
- This example uses the following smart contract deployed on the Neon EVM Mainnet [0xBD8bAFA0b09920b2933dd0eD044f27B10B20F265](https://neonscan.org/address/0xBD8bAFA0b09920b2933dd0eD044f27B10B20F265).
- Before starting with the execution you need to make sure that the smart contract has all of the needed ATA accounts initialized. This can be done through using script:

    ```node scripts/TestCallSolana/CreateATAThroughSolanaWeb3.js```

    This script has included 3 of the tokens needed for the scripts to run _( WSOL, USDC, WSOL_USDC_LP_TOKEN )_, but you're free to add more tokens to the list if you wish to swap more tokens. Setting up the ATA accounts for the smart contract is a one time procedure.
- This tutorial uses the public Solana RPC node _( `https://api.mainnet-beta.solana.com/` )_ and this RPC have rate limits. At some point if you send too many requests you will be rate limitted for a while. Getting a Solana RPC node from providers like P2P, Everstake or QuickNode will solve this issue.