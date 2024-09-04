# Example deploying ERC20 to Neon EVM Devnet using Foundry

This example contains all the files necessary to deploy simplest ERC20-like contract using Neon onto the Solana blockchain.

## Running tests

```sh
forge test --match-contract ContractTest --gas-report --rpc-url $RPC_URL_DEVNET --evm-version cancun
```

This command runs the test file ./test/TestERC20/TestERC20.t.sol. After successfully running this step you should get console output similar to:

```sh
[[⠊] Compiling...
No files changed, compilation skipped

Ran 26 tests for test/TestERC20/TestERC20.t.sol:ContractTest
[PASS] testApprove() (gas: 58558)
[PASS] testBurn() (gas: 122193)
[PASS] testFailApproveFromZeroAddress() (gas: 32333)
[PASS] testFailApproveToZeroAddress() (gas: 27079)
[PASS] testFailBurnFromZero() (gas: 29276)
[PASS] testFailBurnInsufficientBalance() (gas: 108513)
[PASS] testFailFuzzBurnInsufficientBalance(address,uint256,uint256) (runs: 256, μ: 105800, ~: 107249)
[PASS] testFailFuzzTransferFromInsufficientApprove(address,address,uint256,uint256) (runs: 256, μ: 154056, ~: 155585)
[PASS] testFailFuzzTransferFromInsufficientBalance(address,address,uint256,uint256) (runs: 256, μ: 154616, ~: 157973)
[PASS] testFailMintToZero() (gas: 29386)
[PASS] testFailTransferFromInsufficientApprove() (gas: 158214)
[PASS] testFailTransferFromInsufficientBalance() (gas: 160826)
[PASS] testFailTransferFromZeroAddress() (gas: 145323)
[PASS] testFailTransferInsufficientBalance() (gas: 110649)
[PASS] testFailTransferInsufficientBalance(address,uint256,uint256) (runs: 256, μ: 103623, ~: 105072)
[PASS] testFailTransferToZeroAddress() (gas: 105909)
[PASS] testFuzzApprove(address,uint256) (runs: 256, μ: 56860, ~: 56951)
[PASS] testFuzzBurn(address,uint256,uint256) (runs: 256, μ: 121277, ~: 122669)
[PASS] testFuzzMint(address,uint256) (runs: 256, μ: 81141, ~: 81478)
[PASS] testFuzzTransfer(address,uint256) (runs: 256, μ: 125248, ~: 125360)
[PASS] testFuzzTransferFrom(address,address,uint256,uint256) (runs: 256, μ: 183810, ~: 186066)
[PASS] testMint() (gas: 83084)
[PASS] testName() (gas: 12470)
[PASS] testSymbol() (gas: 12492)
[PASS] testTransfer() (gas: 141569)
[PASS] testTransferFrom() (gas: 196574)
Suite result: ok. 26 passed; 0 failed; 0 skipped; finished in 79.58s (232.19s CPU time)
```

## Deploying contract, minting tokens, transferring tokens using Foundry Scripts

1. Deploy contract

```sh
forge script script/TestERC20/DeployTestERC20.s.sol:DeployTestERC20Script --broadcast --rpc-url $RPC_URL_DEVNET --legacy --skip-simulation --evm-version cancun
```

After successfully running this step you should get console output similar to:

```sh
[⠢] Compiling...
[⠒] Compiling 2 files with 0.8.26
[⠢] Solc 0.8.26 finished in 842.35ms
Compiler run successful!
Script ran successfully.

SKIPPING ON CHAIN SIMULATION.

###
Finding wallets for all the necessary addresses...
##
Sending transactions [0 - 0].
⠁ [00:00:00] [######################################################################################################################################] 1/1 txes (0.0s)

##
Waiting for receipts.
⠉ [00:00:04] [##################################################################################################################################] 1/1 receipts (0.0s)
##### 245022926
✅  [Success]Hash: 0x93b3a7f39f9bb5e6326d73b8f1c77ffe90a79390c784f1ece1ba74d6da356e31
Contract Address: 0x853dA9a815c817866848Aff7fE43e4a74b8FF282
Block: 278115244
Paid: 5.7943561133217 ETH (33229200 gas * 174.37543225 gwei)

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
Total Paid: 5.7943561133217 ETH (33229200 gas * avg 174.37543225 gwei)
```

2. Mint tokens to the deployer account and transfer tokens from the deployer account to another account

```sh
forge script script/TestERC20/MintTestERC20.s.sol:MintTestERC20Script --broadcast --rpc-url $RPC_URL_DEVNET --legacy --skip-simulation --evm-version cancun
```

After successfully running this step you should get console output similar to:

```sh
[⠢] Compiling...
No files changed, compilation skipped
Script ran successfully.

== Logs ==
  The initial balance of the deployer account is:
  99000000000000
  The new balance of the deployer account is:
  199000000000000
  The initial balance of the receiver account before the transfer is:
  1000000000000
  The new balance of the deployer account after the transfer is:
  198000000000000
  The new balance of the receiver account after the transfer is:
  2000000000000

SKIPPING ON CHAIN SIMULATION.

###
Finding wallets for all the necessary addresses...
##
Sending transactions [0 - 1].
⠉ [00:00:01] [######################################################################################################################################] 2/2 txes (0.0s)

##
Waiting for receipts.
⠙ [00:00:06] [##################################################################################################################################] 2/2 receipts (0.0s)
##### 245022926
✅  [Success]Hash: 0x2b4e080fef106d489fbb986fe517f8ce393ba593019939b2c591ec37035126fc
Block: 278118078
Paid: 0.0017438435201 ETH (10000 gas * 174.38435201 gwei)


##### 245022926
✅  [Success]Hash: 0x7975d08e3cf9413670ede44ee9cc2f5d69c0d375530948453585b5195c5ca472
Block: 278118084
Paid: 0.0017438435201 ETH (10000 gas * 174.38435201 gwei)

==========================

ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
Total Paid: 0.0034876870402 ETH (20000 gas * avg 174.38435201 gwei)
```

**_NOTE_:** The native token displayed above should be NEON instead of ETH and the unit should be Galan instead of gwei (It is not possible to customize the display).

## Deploying contract, minting tokens, transferring tokens without using Foundry Scripts

1. Deploy contract

```sh
forge create --rpc-url $RPC_URL_DEVNET --private-key $PRIVATE_KEY src/TestERC20/TestERC20.sol:TestERC20 --constructor-args "Test ERC20 Token" "TERC20" --legacy
```

After successfully running this step you should get console output similar to:

```sh
[⠰] Compiling...
No files changed, compilation skipped
Deployer: 0x4455E84Eaa56a01676365D4f86348B311969a4f4
Deployed to: 0x5537599aa2F97Dd60a66342522a465A7f2e40Ff9
Transaction hash: 0x6de9dab8a526cbac33008056d185b93dff725605efb791bf116b6bece4f0c486
```

2. Send a transaction with a deployed smart contract mint function

```sh
cast send <contract_address> --rpc-url $RPC_URL_DEVNET --private-key $PRIVATE_KEY "mint(address,uint256)" <deployer_address> 20000000000000000000 --legacy
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

3. Call a deployed smart contract function

```sh
cast call <contract_address> --rpc-url $RPC_URL_DEVNET "balanceOf(address) (uint256)" <account_address>
```

After successfully running this step you should get console output similar to:

```sh
20000000000000000000
```

4. Transfer the ERC20 token to another address

```sh
cast send <contract_address> --rpc-url $RPC_URL_DEVNET --private-key $PRIVATE_KEY "transfer(address,uint256)" <receiver_address> 10000000000000000000 --legacy
```

After successfully running this step you should get console output similar to:

```sh
blockHash               0xe26ca21b4c336e3b6d6f55883b619f8ebe6a103dd8bb9ba2e77acb86770e5a42
blockNumber             253619486
contractAddress
cumulativeGasUsed       1527280
effectiveGasPrice
gasUsed                 1527280
logs                    [{"address":"0x61cd476038ff69b0bf4d9ae881130c396c610004","topics":["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef","0x0000000000000000000000009ce2a03a7a258fb96d04afb8dd84b69a748b5959","0x0000000000000000000000004455e84eaa56a01676365d4f86348b311969a4f4"],"data":"0x0000000000000000000000000000000000000000000000008ac7230489e80000","blockHash":"0xe26ca21b4c336e3b6d6f55883b619f8ebe6a103dd8bb9ba2e77acb86770e5a42","blockNumber":"0xf1ded1e","transactionHash":"0x5cee8f357282f0439deb7d45b2f8639b54fcdcdff8cacc0e24157fa5ef0c5041","transactionIndex":"0x0","logIndex":"0x0","transactionLogIndex":"0x0","removed":false}]
logsBloom               0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
root
status                  1
transactionHash         0x5cee8f357282f0439deb7d45b2f8639b54fcdcdff8cacc0e24157fa5ef0c5041
transactionIndex        0
type                    0
```

## Verify deployed contract on Blockscout

This is an example for verification of smart contracts on Blockcout using Foundry.

```sh
forge verify-contract --chain-id $CHAIN_ID_DEVNET <contract_address> src/TestERC20/TestERC20.sol:TestERC20 --verifier-url $VERIFIER_URL_BLOCKSCOUT --verifier blockscout
```

After successfully running this step you should get console output similar to:

```sh
Start verifying contract `0x5537599aa2F97Dd60a66342522a465A7f2e40Ff9` deployed on 245022926

Submitting verification for [src/TestERC20/TestERC20.sol:TestERC20] "0x5537599aa2F97Dd60a66342522a465A7f2e40Ff9".
Submitted contract for verification:
	Response: `OK`
	GUID: `5537599aa2f97dd60a66342522a465a7f2e40ff9654118b3`
	URL:
        https://neon-devnet.blockscout.com/api?/address/0x5537599aa2f97dd60a66342522a465a7f2e40ff9
```
