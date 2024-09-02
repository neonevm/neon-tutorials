# Chainlink Price Data Feeds Integration Example on Neon EVM Mainnet and Devnet

To know more about Chainlink price feeds, please see this [documentation](https://neonevm.org/docs/developing/integrate/oracles/integrating_chainlink).

## Deploy script

1. To deploy `TestChainlink.sol`, run the following -

```sh
npx hardhat run scripts/TestChainlink/deploy.js --network neondevnet
```

2. The output will look like this -

```sh
TestChainlink deployed to 0xd7B08bEEE599235778D7e72a997d3dd116860703
BTC_USD 58393.25
ETH_USD 2521.6
LINK_USD 10.699538
SOL_USD 131.73112
USDC_USD 1
USDT_USD 1
```

**Note:** To deploy the smart contract on Neon EVM Mainnet, `--network neondevnet` should be replaced by `--network neonmainnet` while running the hardhat command for running the script.
