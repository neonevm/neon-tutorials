# Neon tutorials with Hardhat

This directory contains several examples to deploy smart contracts on Neon EVM Devnet or Mainnet.

## Cloning repository

Run command

```sh
git clone https://github.com/neonlabsorg/neon-tutorials.git
```

**NOTE** All the next operations must be performed from the **neon-tutorials/hardhat** directory.

## Install the required dependencies

```sh
npm install
```

## Setup Neon network in the Metamask wallet

1. Go to [Chainlist](https://chainlist.org/?search=Neon+EVM&testnets=true) and add the Neon EVM DevNet and Neon EVM MainNet networks to your Metamask wallet.
2. Airdrop at most 100 NEONs to the created **account #1** [from here](https://neonfaucet.org/)
3. Copy your Metamask account's private key (Account Details >> Export Private Key) and insert them into **.env**
   **NOTE!** Add **0x** prefix at the beginning

## Set up .env file

Create a .env file in the root project folder and add these lines -

```sh
PRIVATE_KEY_OWNER=<1ST_PRIVATE_KEY>
USER1_KEY=<2ND_PRIVATE_KEY>
USER2_KEY=<3RD_PRIVATE_KEY>
```

## References to the example scripts to deploy contracts

1. [TestERC20](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestERC20/README.md)
2. [TestERC721](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestERC721/README.md)
3. [TestAPI3](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestAPI3/README.md)
4. [TestChainlink](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestChainlink)
5. [TestReadSolanaData](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestReadSolanaData/README.md)
6. [TestCallSolana](https://github.com/neonlabsorg/neon-tutorials/blob/main/hardhat/scripts/TestCallSolana/README.md)

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
