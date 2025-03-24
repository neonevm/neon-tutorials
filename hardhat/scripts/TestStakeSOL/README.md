# Staking on Solana from NeonEVM

This example illustrates how to stake `SOL` on **_Solana_** by interacting with the `TestStakeSOL` smart contract 
deployed on **_NeonEVM_**.

Run with the following command:

```sh
npx hardhat run scripts/TestStakeSOL/index.js --network neondevnet
```

A user holding `wSOL` in a **_NeonEVM_** wallet must first approve the `TestStakeSOL` smart contract to transfer the 
`wSOL` amount which will be used for staking.

By calling the `stake` function on the `TestStakeSOL` smart contract, a staking account is created on **_Solana_** to 
hold user's stake and `wSOL` is transferred, unwrapped and staked on this staking account as `SOL` on **_Solana_**. 
User's stake is delegated to a **_Solana_** validator specified in the example script.

By calling the `initWithdraw` function, user's stake is deactivated and will be available for withdrawal after the end 
of the current **_Solana_** epoch.

By calling the `withdraw` function after the end of the _**Solana**_ epoch during which user's stake was deactivated,
user's stake is wrapped as `wSOL` and transferred back to user's **_NeonEVM_** wallet.
