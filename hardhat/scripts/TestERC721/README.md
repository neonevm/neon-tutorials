# Deploying an ERC721 non-fungible token example on Neon EVM Mainnet and Devnet

This is an example of deploying an ERC721 non-fungible token on Neon EVM Devnet and Mainnet.

## Deploy script

1. To deploy `TestERC721.sol`, run the following -

```sh
npx hardhat run scripts/TestERC721/deploy.js --network neondevnet
```

2. The output will look like this -

```sh
TestERC721 token deployed to 0xa776bE5b34258f0E6d5c42e29767dFD58DeF803f
```

## Mint ERC721 non-fingible tokens

1. Paste the deployed contract address from the above step in the `mint.js` file. to mint some NFTs to the deployer address, run the following -

```sh
npx hardhat run scripts/TestERC721/mint.js --network neondevnet
```

2. The output will look like this -

```sh
TestERC721 NFT with tokenId 2009 has been minted to 0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959
```

**Note:** To deploy the smart contract on Neon EVM Mainnet, `--network neondevnet` should be replaced by `--network neonmainnet` while running the hardhat command for running the script.
