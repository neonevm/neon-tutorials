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

## References to the example scripts to deploy contracts

1. [TestERC20](https://github.com/neonlabsorg/neon-tutorials/blob/main/foundry/script/TestERC20/README.md)
2. [TransientStorage](https://github.com/neonlabsorg/neon-tutorials/blob/main/foundry/script/TransientStorage/README.md)

## ...Try it with your own contract and have fun!
