# ERC20ForSPL

This repo constains an example of how to deploy ERC20ForSPL standard. ERC20ForSPL is a standard that allows you to deploy a token which exists natively on both chains of Neon and Solana. This token can be transfered on both Neon & Solana EOA's, example:
* Method to transfer tokens to Neon address - ```function transfer(address to, uint256 amount) public returns (bool)```
* Method to transfer tokens to Solana address - ```function transferSolana(bytes32 to, uint64 amount) public returns (bool)``` _( The **to** parameter is the Solana public address of the transfer receiver decoded with `ethers.decodeBase58()` )_

This current version is also upgradeable by using OpenZeppelin's UUPS library and it has ownership logic which sets the deployer as the smart contract owner. The owner can manage the contract upgradibility and the `mint` method.

This standard also interacts with the following 2 predefines on the Neon network:
* ```ISPLToken(0xFf00000000000000000000000000000000000004)``` - this is a factory protocol on Solana where all of the Solana tokens are being deployed.
* ```IMetaplex(0xff00000000000000000000000000000000000005)``` - Metaplex is a set of protocols which allows deployers to attach metadata to their deployed tokens on Solana.

> [!IMPORTANT]  
> When deploying an ERC20ForSPL token the maximum of decimals we are allowed to use for our token is 9, because the maximum number we can store on Solana is uint64.