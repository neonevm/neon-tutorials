# ERC20ForSPL & ERC20ForSPLMintable

This repo constains an example of how to deploy and use the ERC20ForSPL standard. But first what is the difference between ``ERC20ForSPL`` and ``ERC20ForSPLMintable``:
* **ERC20ForSPL** - Allows you to deploy the standard on Neon EVM for an already existing SPLToken on Solana. This smart contract accepts only 1 constructor parameter ( `bytes32 _tokenMint` ) which is the public address of the SPLToken on Solana _( HEX decoded )_.
* **ERC20ForSPLMintable** - Allows you to deploy the standard on Neon EVM at the same time as deploying a new SPLToken on Solana. The constructor accepts 3 parameters ( ` string memory _name, string memory _symbol, uint8 _decimals `) which are needed to deploy the SPLToken and to submit the token metadata to the Metaplex protocol on Solana.

Basically this standard allows you to interact with a token which exists natively on both chains of Neon and Solana. This token can be transfered on both Neon & Solana EOA's, example:
* Method to transfer tokens to Neon address - `function transfer(address to, uint256 amount) public returns (bool)`
* Method to transfer tokens to Solana address - `function transferSolana(bytes32 to, uint64 amount) public returns (bool)` _( The **to** parameter is the Solana public address of the transfer receiver in `bytes32` format )_

This current version is also upgradeable by using OpenZeppelin's UUPS library and it has ownership logic which sets the deployer as the smart contract owner. The owner can manage the contract upgradibility and the `mint` method.

This standard also interacts with the following 2 predefines on the Neon network:
* `ISPLToken(0xFf00000000000000000000000000000000000004)` - this is a factory protocol on Solana where all of the Solana tokens are being deployed.
* `IMetaplex(0xff00000000000000000000000000000000000005)` - Metaplex is a set of protocols which allows deployers to attach metadata to their deployed tokens on Solana.

> [!IMPORTANT]  
> When deploying the **ERC20ForSPLMintable** standard the maximum of decimals we are allowed to use for our token is 9, because the maximum number we can store on Solana is `uint64`.

### Deploying & executing tests on Neon EVM Devnet:
> [!IMPORTANT]  
> Before starting the tests make sure to create `.env` file containing the following data _( make a copy of .env.example file and rename it to .env )_:
```
    PRIVATE_KEY_OWNER=XYZ
    USER1_KEY=XYZ
    USER2_KEY=XYZ
    USER3_KEY=XYZ
```
> These are the private keys of our testers - make sure that these accounts have enough NEON balance to cover the transactions executed in the tests. _( You can get Devnet NEONs from the **[Neon Faucet](https://neonfaucet.org)** )_

#### ERC20ForSPL:
Like mentioned before ERC20ForSPL is used when we already have existing SPLToken on Solana and for the sake of this demo we will be using this *[SPLToken](https://solscan.io/token/C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr?cluster=devnet)*. The address of the token is already included in the testing script.
1. Run `npx hardhat test --network neondevnet test/ERC20ForSPL.js` - this command will deploy ERC20ForSPL on the Neon EVM Devnet. You will notice that some of the tests are being skipped and that's because the Solana associated token accounts for our testers are not being initialized yet. _( this will be done in step 3. )_
2. In the terminal output you should see an address labeled as _"ERC20ForSPL address on Neon EVM"_, take this address and place it as value for variable `ERC20ForSPLAddress` inside `test/ERC20ForSPL.js` and same thing should be done for file `src/index.ts`.
3. Next thing to do is in order to execute the tests for this standard we have to fill in some token balance for our testers. This can be done by executing the `src/index.ts` script with the following command `npx ts-node ./src/index.ts <OWNER_NEON_WALLET> <USER1_NEON_WALLET> <USER2_NEON_WALLET>`. Example - `npx ts-node ./src/index.ts 0xAB1c34b53F12980a4fa9043B70c864CEE6891c0C 0xb8f913C9AB9944891993F6c6fDAc421D98461294 0x358726276F5ea5dE31150D2BE61AC2a71F2ecE87`. This step is basically initializing ATAs _( Associate token accounts )_ for our testers and initiating token transfer transactions with some amounts from Solana wallet to our testers.
4. Run again `npx hardhat test --network neondevnet test/ERC20ForSPL.js` and you will notice that the complete tests are getting executed.

#### ERC20ForSPLMintable:
ERC20ForSPLMintable is used when we don't have an existing SPLToken and we want to deploy one. The steps to produce the ERC20ForSPLMintable's tests are lesser - we don't have to fill in our testers balances with a transaction from Solana to Neon, because the ERC20ForSPLMintable smart contract includes a minting method which we can use in our tests `function mint(address to, uint256 amount) public onlyOwner`.

To run the ERC20ForSPLMintable tests run the following command - `npx hardhat test --network neondevnet test/ERC20ForSPLMintable.js `.