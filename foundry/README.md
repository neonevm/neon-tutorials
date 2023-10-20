# Foundry Examples

# Example deploying ERC20 to Neon Labs Devnet using Foundry

This directory contains all the files necessary to deploy simplest ERC20-like contract using Neon onto the Solana blockchain.

## Prerequisites

To use this project, Rust and Foundry must be installed on the machine.

### Rust installation

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

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
cd foundry
forge install foundry-rs/forge-std --no-commit
forge install openzeppelin/openzeppelin-contracts --no-commit
```

## Setup Neon account (using Metamask)

To create new account:

1. Setup your Metamask wallet to work with Neon devnet:

   - Connect your metamask wallet to Neon Devnet using these settings:
     - Network Name: Neon Devnet
     - New RPC URL: https://devnet.neonevm.org
     - Chain ID: 245022926
     - Currency Symbol (optional): NEON

2. Create a new account in Metamask
3. Airdrop at most 100 NEONs to just created **account #1** [from here](https://neonfaucet.org/)
4. Copy your Metamask account's private key (Account Details >> Export Private Key) and insert them into **.env**
   **NOTE!** Add **0x** prefix at the beginning

## Set up .env file

Create a .env file in the root project folder and add these lines -

```sh
RPC_URL=https://devnet.neonevm.org
PRIVATE_KEY=<YOUR_PRIVATE_KEY>
```

Then run this -

```sh
source .env
```

## Building contracts and running tests on devnet

1. Compiling contract

```sh
forge build
```

This command will compile all the contracts. After successfully running this step you should get console output similar to:

```sh
[⠢] Compiling...
[⠒] Compiling 24 files with 0.8.21
[⠃] Solc 0.8.21 finished in 2.48s
Compiler run successful!
```

2. Running tests

```sh
forge test
```

This command runs the test file ./test/MyToken.t.sol. After successfully running this step you should get console output similar to:

```sh
[⠰] Compiling...
No files changed, compilation skipped

Running 26 tests for test/TestERC20/TestERC20.t.sol:ContractTest
[PASS] testApprove() (gas: 33708)
[PASS] testBurn() (gas: 61142)
[PASS] testFailApproveFromZeroAddress() (gas: 10679)
[PASS] testFailApproveToZeroAddress() (gas: 5665)
[PASS] testFailBurnFromZero() (gas: 5765)
[PASS] testFailBurnInsufficientBalance() (gas: 60789)
[PASS] testFailFuzzBurnInsufficientBalance(address,uint256,uint256) (runs: 256, μ: 55030, ~: 57952)
[PASS] testFailFuzzTransferFromInsufficientApprove(address,address,uint256,uint256) (runs: 256, μ: 81261, ~: 86014)
[PASS] testFailFuzzTransferFromInsufficientBalance(address,address,uint256,uint256) (runs: 256, μ: 82024, ~: 86415)
[PASS] testFailMintToZero() (gas: 5764)
[PASS] testFailTransferFromInsufficientApprove() (gas: 88211)
[PASS] testFailTransferFromInsufficientBalance() (gas: 88524)
[PASS] testFailTransferFromZeroAddress() (gas: 65190)
[PASS] testFailTransferInsufficientBalance() (gas: 62680)
[PASS] testFailTransferInsufficientBalance(address,uint256,uint256) (runs: 256, μ: 55465, ~: 57650)
[PASS] testFailTransferToZeroAddress() (gas: 60184)
[PASS] testFuzzApprove(address,uint256) (runs: 256, μ: 33509, ~: 34598)
[PASS] testFuzzBurn(address,uint256,uint256) (runs: 256, μ: 61918, ~: 64926)
[PASS] testFuzzMint(address,uint256) (runs: 256, μ: 55528, ~: 57083)
[PASS] testFuzzTransfer(address,uint256) (runs: 256, μ: 62703, ~: 63636)
[PASS] testFuzzTransferFrom(address,address,uint256,uint256) (runs: 256, μ: 92421, ~: 96757)
[PASS] testMint() (gas: 56198)
[PASS] testName() (gas: 9585)
[PASS] testSymbol() (gas: 9607)
[PASS] testTransfer() (gas: 89918)
[PASS] testTransferFrom() (gas: 117412)
Test result: ok. 26 passed; 0 failed; 0 skipped; finished in 37.04ms
Ran 1 test suites: 26 tests passed, 0 failed, 0 skipped (26 total tests)
```

## Deploying contract

```sh
forge create --rpc-url $RPC_URL --private-key $PRIVATE_KEY src/TestERC20/TestERC20.sol:TestERC20 --constructor-args "Test ERC20 Token" "TERC20" --legacy
```

After successfully running this step you should get console output similar to:

```sh
[⠰] Compiling...
No files changed, compilation skipped
Deployer: 0x4455E84Eaa56a01676365D4f86348B311969a4f4
Deployed to: 0x5537599aa2F97Dd60a66342522a465A7f2e40Ff9
Transaction hash: 0x6de9dab8a526cbac33008056d185b93dff725605efb791bf116b6bece4f0c486
```

## Send a transaction with a deployed smart contract function

```sh
cast send <contract_address> --rpc-url $RPC_URL --private-key $PRIVATE_KEY "mint(address,uint256)" <deployer_address> 20000000000000000000 --legacy
```

After successfully running this step you should get console output similar to:

```sh
blockHash               0x60c530c2a73f48d9d7dea410d6a314f951e4120fa57a5472c1baf91fc50c6622
blockNumber             252337066
contractAddress
cumulativeGasUsed       1527280
effectiveGasPrice
gasUsed                 1527280
logs                    [{"address":"0x5537599aa2f97dd60a66342522a465a7f2e40ff9","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0x0000000000000000000000000000000000000000000000000000000000000000","0x0000000000000000000000004455e84eaa56a01676365d4f86348b311969a4f4"],"data":"0x000000000000000000000000000000000000000000000001158e460913d00000","blockHash":"0x60c530c2a73f48d9d7dea410d6a314f951e4120fa57a5472c1baf91fc50c6622","blockNumber":"0xf0a5baa","transactionHash":"0x6a0aafa041c4e27abdf55abb430c5ff9da5606af466b7beff4f4e8da3e7829ae","transactionIndex":"0x0","logIndex":"0x0","transactionLogIndex":"0x0","removed":false}]
logsBloom               0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
root
status                  1
transactionHash         0x6a0aafa041c4e27abdf55abb430c5ff9da5606af466b7beff4f4e8da3e7829ae
transactionIndex        0
type                    0
```

## Call a deployed smart contract function

```sh
cast call <contract_address> --rpc-url $RPC_URL "balanceOf(address)" <account_address>
```

After successfully running this step you should get console output similar to:

```sh
0x000000000000000000000000000000000000000000000001158e460913d00000
```

**Note** The returned value is in hexadecimal form. So you can use this [link](https://www.rapidtables.com/convert/number/hex-to-decimal.html) to convert it into decimal form and check the value.

## ...Try it with your own contract and have fun!
