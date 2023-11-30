# Neon tutorials with Hardhat
This directory contains several examples of how to deploy on Neon network.

### Setup terminal commands:
* ```npm install``` - Downloading required packages.

### Deployment terminal commands:
The commands are pretty much the same for all of the examples, you only have to point to different files. This specific example shows you how to deploy OpenZeppelin's ERC20 on Neon Devnet.
* ```npx hardhat run scripts/TestERC20/deploy.js --network neondevnet``` - Sample command of deploying ``contracts/TestERC20/TestERC20.sol`` on Neon Devnet network. If you wish to deploy on Neon Mainnet then change the ``--network`` parameter to ``neonmainnet``.
* ```npx hardhat run scripts/TestERC20/transfer.js --network neondevnet``` - this command initiates a transfer from our user to randomly generated address. _( Before running this command you've to attach the address of the ERC20 contract which we deployed with the previous command )_
* ```npx hardhat verify --network neondevnet <CONTRACT_ADDRESS>``` - Sample command of verifying a contract deployed on Neon Devnet network. ``<CONTRACT_ADDRESS>`` parameter has to be replaced with the smart contract address. If your contract has any constructor parameters you need change the command to ```npx hardhat verify --network neondevnet <CONTRACT_ADDRESS> <PARAM_1> <PARAM_2>```.

#### Before starting make sure to create .env file containing the following data ( make a copy of .env.example file and rename it to .env ):
```
    PRIVATE_KEY_OWNER=XYZ
```
- *PRIVATE_KEY_OWNER - the private key used to deploy the contracts.*