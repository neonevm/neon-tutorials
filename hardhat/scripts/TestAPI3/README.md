# API3 Price Feeds Integration Example on Neon EVM Mainnet and Devnet

To know more about API3 price feeds, please see this [documentation](https://neonevm.org/docs/developing/integrate/oracles/integrating_api3).

## Deploy script

1. To deploy `TestAPI3.sol`, run the following -

```sh
npx hardhat run scripts/TestAPI3/deploy.js --network neondevnet
```

2. The output will look like this -

```sh
TestAPI3 deployed to 0xB8747279e8029108720BcB5386511D70B9129D68
BTC_USD Result(2) [ 64547812100000000000000n, 1721241637n ]
ETH_USD Result(2) [ 3431460000000000000000n, 1721274476n ]
SOL_USD Result(2) [ 159776804400000000000n, 1721284955n ]
USDC_USD Result(2) [ 999900024820969500n, 1721220644n ]
USDT_USD Result(2) [ 1000188700000000000n, 1721220738n ]
NEON_USD Result(2) [ 392570000000000000n, 1721270758n ]
LINK_USD Result(2) [ 13807707000000000000n, 1721291017n ]
```

The result represents an array with the following parameters:

- 1st parameter - Price
- 2nd parameter - Timestamp of the last price push

**Note:** To deploy the smart contract on Neon EVM Mainnet, `--network neondevnet` should be replaced by `--network neonmainnet` while running the hardhat command for running the script.
