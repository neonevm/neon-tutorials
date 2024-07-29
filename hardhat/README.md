# Neon tutorials with Hardhat

This directory contains several examples to deploy smart contracts on Neon EVM Devnet or Mainnet.

## Install the required dependencies

```sh
npm install
```

## Deploy scripts

### TestChainlink script

```sh
npx hardhat run scripts/TestChainlink/deploy.js --network neondevnet
```

### TestAPI3 script

```sh
npx hardhat run scripts/TestAPI3/deploy.js --network neondevnet
```

### TestERC20 scripts

1. Deploy TestERC20.sol

```sh
npx hardhat run scripts/TestERC20/deploy.js --network neondevnet
```

2. Initiate a transfer from the deployer address to a randomly generated address. Add the deployed address from the above step in the `transfer.js` file and run -

```sh
npx hardhat run scripts/TestERC20/transfer.js --network neondevnet
```

### TestERC721 scripts

1. Deploy TestERC721.sol

```sh
npx hardhat run scripts/TestERC721/deploy.js --network neondevnet
```

2. Paste the deployed contract address from the above step in the `mint.js` file and mint some NFTs to the deployer address.

```sh
npx hardhat run scripts/TestERC721/mint.js --network neondevnet
```

### TestReadSolanaData scripts

1. Read Pyth price feeds from Solana

```sh
npx hardhat run scripts/TestReadSolanaData/TestReadPythPriceFeed.js --network neondevnet
```

2. Read token account data from Solana

```sh
npx hardhat run scripts/TestReadSolanaData/TestReadTokenAccountData.js --network neondevnet
```

## Verify smart contracts on NeonScan

```sh
npx hardhat verify --network neondevnet <CONTRACT_ADDRESS>
```

If the smart contract has constructor parameters, then the command to verify is -

```sh
npx hardhat verify --network neondevnet <CONTRACT_ADDRESS> <PARAM_1> <PARAM_2>
```

`<CONTRACT_ADDRESS>`, `<PARAM_1>`, `<PARAM_2>` should be replaced with the smart contract address deployed and the constructor parameters for it.

## Verify smart contracts on Blockscout

By default, `hardhat.config.js` file includes the verification details on NeonScan. However, smart contracts can also be verified on Blockscout.

Please replace the following lines in `hardhat.config.js` -

```sh
etherscan: {
    apiKey: {
      neonevm: "test",
    },
    customChains: [
      {
        network: "neonevm",
        chainId: 245022926,
        urls: {
          apiURL: "https://neon-devnet.blockscout.com/api",
          browserURL: "https://neon-devnet.blockscout.com",
        },
      },
      {
        network: "neonevm",
        chainId: 245022934,
        urls: {
          apiURL: "https://neon.blockscout.com/api",
          browserURL: "https://neon.blockscout.com",
        },
      },
    ],
},
```

Run the following to verify -

```sh
npx hardhat verify --network neondevnet <CONTRACT_ADDRESS>
```

If the smart contract has constructor parameters, then the command to verify is -

```sh
npx hardhat verify --network neondevnet <CONTRACT_ADDRESS> <PARAM_1> <PARAM_2>
```

`<CONTRACT_ADDRESS>`, `<PARAM_1>`, `<PARAM_2>` should be replaced with the smart contract address deployed and the constructor parameters for it.

**Note:** To deploy the smart contracts on Neon EVM Mainnet, `--network neondevnet` should be replaced by `--network neonmainnet` while running the hardhat command for running the scripts.

#### Before starting make sure to create .env file containing the following data ( make a copy of .env.example file and rename it to .env ):

```
    PRIVATE_KEY_OWNER=XYZ
```

- _PRIVATE_KEY_OWNER - the private key used to deploy the contracts._
