# Deploying an ERC20 token example on Neon EVM Mainnet and Devnet

This is an example of deploying an ERC20 token on Neon EVM Devnet and Mainnet.

## Deploy script

1. To deploy `TestERC20.sol`, run the following -

```sh
npx hardhat run scripts/TestERC20/deploy.js --network neondevnet
```

2. The output will look like this -

```sh
TestERC20 token deployed to 0xA0BE9710820E4434d6af7816aBeF973f8ecE01B4
```

## Transfer ERC20 tokens

1. To initiate a transfer from the deployer address to a randomly generated address and add the deployed address from the above step in the `transfer.js` file and run the following -

```sh
npx hardhat run scripts/TestERC20/transfer.js --network neondevnet
```

2. The output will look like this -

```sh
Sender balance before transfer 1000000000000000000000n
Receiver balance before transfer 0n
Sender balance after transfer 990000000000000000000n
Receiver balance after transfer 10000000000000000000n
```

**Note:** To deploy the smart contract on Neon EVM Mainnet, `--network neondevnet` should be replaced by `--network neonmainnet` while running the hardhat command for running the script.
