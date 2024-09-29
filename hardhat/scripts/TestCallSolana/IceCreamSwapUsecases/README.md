# IceCreamSwap flow with Neon EVM composability to Solana

![alt text](https://github.com/neonlabsorg/neon-tutorials/blob/test/icecreamswap-usecases/hardhat/scripts/TestCallSolana/IceCreamSwapUsecases/ics-flow.jpeg)

This flow describes the user's interaction with Solana through Neon EVM's composability feature.

### Commands:
- `npx hardhat run scripts/TestCallSolana/IceCreamSwapUsecases/TestICSFlowOrcaSwap.js --network neonmainnet` - Broadcasting of singlehop WSOL -> USDC swap to Orca
- `npx hardhat run scripts/TestCallSolana/IceCreamSwapUsecases/TestICSFlowOrcaMultihopSwap.js --network neonmainnet` - Broadcasting of multihop WSOL -> USDC -> WBTC swap to Orca
- `npx hardhat run scripts/TestCallSolana/IceCreamSwapUsecases/TestICSFlowRaydiumSwap.js --network neonmainnet` - Broadcasting of singlehop WSOL -> USDC swap to Raydium
- `npx hardhat run scripts/TestCallSolana/IceCreamSwapUsecases/TestICSFlowBatchOrcaRaydiumSwaps.js --network neonmainnet` - Broadcasting a batch of 2 singlehop WSOL -> USDC swaps to Orca & Raydium
- `npx hardhat run scripts/TestCallSolana/IceCreamSwapUsecases/TestICSFlowJupiter.js --network neonmainnet` - Broadcasting a swap to Jupiter

### Comments:
- This example uses the following smart contract deployed on the Neon EVM Mainnet [0x16906ADb704590F94F8a32ff0a690306A34A0bfC](https://neonscan.org/address/0x16906ADb704590F94F8a32ff0a690306A34A0bfC). This smart contract includes a funnel-like mechanism which process instructions on Solana. To be able to use the Neon EVM's composability feature you need basic knowledge on Solana. The main methods used in this smart contract are `execute` and `batchExecute`. Second method is used if you have to include multiple Solana instructions _( like for example the batch swap to Orca & Raydium )_.
- Before starting with the execution you need to make sure that the smart contract has all of the needed ATA accounts initialized. This can be done through using script:

    ```node scripts/TestCallSolana/CreateATAThroughSolanaWeb3.js```

    This script has included 4 of the most used tokens _( WSOL, USDC, USDT, WBTC )_, but you're free to add more tokens to the list if you wish to swap more tokens.
- This specific flow does not store token balances, it's just forwarding user's assets to DEX on Solana and then on successful swap the DEX is sending the swap output back to the user.
- This tutorial uses the public Solana RPC node _( `https://api.mainnet-beta.solana.com/` )_ and this RPC have rate limits. At some point if you send too many requests you will be rate limitted for a while. Getting a Solana RPC node from providers like P2P, Everstake or QuickNode will solve this issue.
- [List with errors for debugging](https://orca-so.gitbook.io/orca-developer-portal/whirlpools/interacting-with-the-protocol/errors)