# Examples of Interacting with Solana from Neon EVM

The following examples are based on the `Composability` feature of Solana. `TestCallSolana.sol` contract is deployed on both Neon EVM Devnet and Mainnet and the contract addresses are added in the `config.js` file.

1. [Mint an SPLToken](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestCallSolana/MintSPLToken.js) - This script mints a new SPLToken and attach Metaplex metadata to it on Solana Devnet via Neon EVM Devnet.

```sh
npx hardhat run scripts/TestCallSolana/MintSPLToken.js --network neondevnet
```

2. [Transfer SOLs between accounts](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestCallSolana/TransferSOLsBetweenAccounts.js) - This script demonstrates transferring SOLs between two accounts on Solana Devnet via Neon EVM Devnet.

```sh
npx hardhat run scripts/TestCallSolana/TransferSOLsBetweenAccounts.js --network neondevnet
```

3. [Transfer SPLToken between accounts](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestCallSolana/TransferSPLTokenBetweenAccounts.js) - This script demonstrates transferring an SPLToken between two accounts on Solana Devnet via Neon EVM Devnet.

```sh
npx hardhat run scripts/TestCallSolana/TransferSPLTokenBetweenAccounts.js --network neondevnet
```

4. [Swap on Orca DEX](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestCallSolana/OrcaSwap.js) - This script demonstrates a swap on Orca DEX on Solana Devnet via Neon EVM Devnet where input swap token is devUSDC and output swap token is devSAMO.

```sh
npx hardhat run scripts/TestCallSolana/OrcaSwap.js --network neondevnet
```

5. [Swap on Raydium DEX](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestCallSolana/RaydiumSwap.js) - This script demonstrates a swap on Raydium DEX on Solana Mainnet via Neon EVM Mainnet where input swap token is WSOL and output swap token is USDC.

```sh
npx hardhat run scripts/TestCallSolana/RaydiumSwap.js --network neonmainnet
```

6. [Using Verifiable Random Function (VRF)](https://neonevm.org/docs/composability/using_composability/using_vrf) - This script demonstrates the steps of requesting on-chain randomness on Solana using ORAO VRF (Verifiable Random Function) program via Neon EVM Devnet.

```sh
npx hardhat run scripts/TestCallSolana/OraoNetworkVRF.js --network neondevnet
```
