# Foundry Examples

## Prerequisites

To use this project, Foundry must be installed on the machine.

### Foundry installation

```sh
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Cloning repository

Run command

```sh
git clone https://github.com/neonlabsorg/neon-tutorials.git
```

**NOTE** All the next operations must be performed from the **neon-tutorials/foundry** directory.

## Install the required libraries

```sh
cd neon-tutorials/foundry
forge install foundry-rs/forge-std --no-commit
forge install openzeppelin/openzeppelin-contracts --no-commit
```

## Setup Neon network in the Metamask wallet

1. Go to [Chainlist](https://chainlist.org/?search=Neon+EVM&testnets=true) and add the Neon EVM DevNet and Neon EVM MainNet networks to your Metamask wallet.
2. Airdrop at most 100 NEONs to the created **account #1** [from here](https://neonfaucet.org/)
3. Copy your Metamask account's private key (Account Details >> Export Private Key) and insert them into **.env**
   **NOTE!** Add **0x** prefix at the beginning

## Set up .env file

Create a .env file in the root project folder and add these lines -

```sh
RPC_URL_DEVNET=https://devnet.neonevm.org
CHAIN_ID_DEVNET=245022926
RPC_URL_MAINNET=https://neon-proxy-mainnet.solana.p2p.org
CHAIN_ID_MAINNET=245022934
PRIVATE_KEY=<YOUR_PRIVATE_KEY>
VERIFIER_URL_BLOCKSCOUT=https://neon-devnet.blockscout.com/api
```

Then run this -

```sh
source .env
```

## Building contracts

```sh
forge build --evm-version cancun
```

This command will compile all the contracts. After successfully running this step you should get console output similar to:

```sh
[⠢] Compiling...
[⠒] Compiling 56 files with 0.8.26
[⠃] Solc 0.8.26 finished in 2.48s
Compiler run successful!
```

**_NOTE_:** The commands include the flag `--evm-version cancun` because the Transient Storage example needs the evm version to be mentioned explicitly as `cancun`. You can learn more about in the official page [Transient Storage](https://soliditylang.org/blog/2024/01/26/transient-storage/)

## Example deploying an example contract that uses Transient Storage to Neon EVM Devnet using Foundry

This example contains all the files necessary to deploy and test Transient Storage example contract using Neon onto the Solana blockchain. It demonstrates a nonreentrancy lock using Transient Storage as well as using traditional locks and compares the gas consumption between the two methods.

### Running tests

```sh
forge test --match-contract TransientStorageTest --gas-report --rpc-url $RPC_URL_DEVNET --evm-version cancun
```

This command runs the test file ./test/TransientStorage.t.sol. After successfully running this step you should get console output similar to:

```sh
[⠊] Compiling...
[⠘] Compiling 25 files with Solc 0.8.26
[⠃] Solc 0.8.26 finished in 778.71ms
Compiler run successful!

Ran 4 tests for test/TransientStorage/TransientStorage.t.sol:TransientStorageTest
[PASS] testNonReentrant1() (gas: 48592)
[PASS] testNonReentrant2() (gas: 26793)
[PASS] testReentrancyProtection1() (gas: 72523)
[PASS] testReentrancyProtection2() (gas: 48848)
Suite result: ok. 4 passed; 0 failed; 0 skipped; finished in 2.24s (1.78ms CPU time)

Ran 1 test suite in 3.55s (2.24s CPU time): 4 tests passed, 0 failed, 0 skipped (4 total tests)
```

### Deploying contract using Foundry Scripts

```sh
forge script script/TransientStorage/DeployTransientStorage.s.sol:DeployTransientStorage --broadcast --rpc-url $RPC_URL_DEVNET --legacy --skip-simulation --evm-version cancun
```

After successfully running this step you should get console output similar to:

```sh
[⠊] Compiling...
No files changed, compilation skipped
Script ran successfully.

SKIPPING ON CHAIN SIMULATION.
⠠ Sequence #1 on 245022926 | Waiting for pending transactions
    ⢀ [Pending] 0xb2b191b82592a060efbae77aa243179cfb40970572e4127a8446beefa459c134
    ⠙ [00:00:02] [###########################################>--------------------------------------------------------------------------------------] 1/3 txes (4.0s)

##### 245022926
✅  [Success]Hash: 0xb2b191b82592a060efbae77aa243179cfb40970572e4127a8446beefa459c134
Contract Address: 0x05104950D0229E4b4a9Dcb8950C4A2D5fffc6017
Block: 315546046
Paid: 6.77508275311385984 ETH (18064240 gas * 375.054956816 gwei)


##### 245022926
✅  [Success]Hash: 0xe729b41ce3f077eac94c2adcb24f955b172154a55303ed1ecf928e4471d11770
Block: 315546104
Paid: 0.00375054956816 ETH (10000 gas * 375.054956816 gwei)


##### 245022926
✅  [Success]Hash: 0x8b52973f4290baccded8a6fa267b7536313a91f7f9c3ad3dd5a6e367484153c1
Block: 315546164
Paid: 0.00375054956816 ETH (10000 gas * 375.054956816 gwei)

✅ Sequence #1 on 245022926 | Total Paid: 6.78258385225017984 ETH (18084240 gas * avg 375.054956816 gwei)

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.

Transactions saved to: /Users/sukanyaparashar/Desktop/NeonLabs/NeonInternalRepositories/neon-tutorials/foundry/broadcast/DeployTransientStorage.s.sol/245022926/run-latest.json

Sensitive values saved to: /Users/sukanyaparashar/Desktop/NeonLabs/NeonInternalRepositories/neon-tutorials/foundry/cache/DeployTransientStorage.s.sol/245022926/run-latest.json

```

**_NOTE_** The native token displayed above should be NEON instead of ETH and the unit should be Galan instead of gwei (It is not possible to customize the display).

### Deploying contract without using Foundry Scripts

1. Deploy contract

```sh
forge create --rpc-url $RPC_URL_DEVNET --private-key $PRIVATE_KEY src/TransientStorage/TransientStorage.sol:TransientStorage --legacy --evm-version cancun
```

After successfully running this step you should get console output similar to:

```sh
[⠊] Compiling...
No files changed, compilation skipped
Deployer: 0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959
Deployed to: 0x751F0fDeA0E8C358f6dcBA8f359B5bcab113e227
Transaction hash: 0x0096a77a8979e701ca6e01b13c7f79872bef1ca1e89c4f954fceb1cd8eae7873
```

## ...Try it with your own contract and have fun!
