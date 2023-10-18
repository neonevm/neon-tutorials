# Neon tutorials with Hardhat

### Setup terminal commands:
* ```npm install``` - Downloading required packages.

### Deployment terminal commands:
* ```npx hardhat run scripts/TestERC20/deploy.js --network neondevnet``` - Sample command of deploying ``contracts/TestERC20/TestERC20.sol`` on Neon Devnet network. If you wish to deploy on Neon Mainnet then change the ``--network`` parameter to ``neonmainnet``.
* ```npx hardhat verify --network neondevnet <CONTRACT_ADDRESS>``` - Sample command of verifying a contract deployed on Neon Devnet network. ``<CONTRACT_ADDRESS>`` parameter has to be replaced with the smart contract address.

#### Before starting make sure to create .env file containing the following data ( make a copy of .env.example file and rename it to .env ):
```
    PRIVATE_KEY_OWNER=XYZ
```
- *PRIVATE_KEY_OWNER - the private key used to deploy the contracts.*