# Reading Solana account data via Neon EVM Devnet

## Reading Pyth price feeds from Solana Devnet via Neon EVM Devnet

This is an example showing how to read Pyth price feeds from Solana Devnet via Neon EVM Devnet.

### Deploy script

1. To deploy `TestReadPythPriceFeed.sol`, run the following -

```sh
npx hardhat run scripts/TestReadSolanaData/TestReadPythPriceFeed.js --network neondevnet
```

2. The output will look like this -

```sh
TestReadPythPriceFeed deployed to 0x7068EbfED06C7a87ba23e339199FACeF76515Df2
Result(3) [ 102486086n, 1714670447n, 1n ] neonPrice
Result(3) [ 13932481388n, 1714670448n, 1n ] solPrice
Result(3) [ 299735750000n, 1714670448n, 1n ] ethPrice
Result(3) [ 5919709374999n, 1714670448n, 1n ] btcPrice
```

The result represents an array with the following parameters:

- 1st parameter - Price
- 2nd parameter - Timestamp of the last price push
- 3rd parameter - Status (0 = UNKNOWN, 1 = TRADING, 2 = HALTED, 3 = AUCTION)

## Reading Solana token account data example on Neon EVM Devnet

This is an example showing how to read data from a token account on Solana.

### Deploy script

1. To deploy `TestReadTokenAccountData.sol`, run the following -

```sh
npx hardhat run scripts/TestReadSolanaData/TestReadTokenAccountData.js --network neondevnet
```

2. The output will look like this -

```sh
Solana token account converted to hex:  0x5181e94d818ee4f3f26c9fa90443d8b894de38fd19eb8274f3747aa1e5c053da
Token mint account converted to hex:  0x06ddf6e1d765a193d9cbe146ceeb79ac1cb485ed5f5b37913a8cf5857eff00a9
TestReadTokenAccountData token deployed to 0x57450E8305E6D8F76D1F65f55Ec0f8faedB7e7E9
Token account length: 165n
Token account lamports: 2039280n
Token account owner: TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
Token Mint account owner: BPFLoader2111111111111111111111111111111111
Token account check if executable: false
Token Mint account check if executable: true
Token account raw data: 0x6a3820c5cf7b46c16f82d0b645b5bbbd3b7e41f9dc0fa47f46e6730554aa93f31c5c89b78497f3c4a29bc2890677903b98a697abc284902d54da1a197d308d6100aea68f02000000000000006280f63b331ce511f27b1ee241affc24bce894c2cd5d76082e85811e32d5456b010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
Mint account public key:  89dre8rZjLNft7HoupGiyxu3MNftR577ZYu8bHe2kK7g
Owner account public key:  2uiFt7tpJFkK8PUTmZt4waWouhTd2hPeiLJpJuv4qt9N
Tokens amount:  11000000000n
```
