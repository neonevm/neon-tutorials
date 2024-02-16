# ERC20ForSPL & ERC20ForSPLMintable

This repo contains an example of how to deploy and use the ERC20ForSPL standard. But first what is the difference between **ERC20ForSPL** and **ERC20ForSPLMintable**:
* **ERC20ForSPL** - Allows you to deploy the standard on Neon EVM for an already existing SPLToken on Solana. This smart contract accepts only 1 constructor parameter _( `bytes32 _tokenMint` )_ which is the public address of the SPLToken on Solana _( HEX decoded )_.
* **ERC20ForSPLMintable** - Allows you to deploy the standard on Neon EVM as well as deploying a new SPLToken on Solana. The constructor accepts 4 parameters _( ` string memory _name, string memory _symbol, uint8 _decimals, address _owner `)_ which are needed to deploy the SPLToken and to submit the token metadata to the Metaplex protocol on Solana.

Basically this standard allows you to interact with a token which exists natively on both chains of Neon EVM and Solana. This token can be transferred between Neon EVM and Solana EOAs, example:
* Method to transfer tokens to Neon EVM address - `function transfer(address to, uint256 amount) public returns (bool)`
* Method to transfer tokens to Solana address - `function transferSolana(bytes32 to, uint64 amount) public returns (bool)` _( The **to** parameter is the Solana public address of the transfer receiver in `bytes32` format )_

Another important thing worth mentioning is that this standard interacts with the following 2 predefined smart contracts on the Neon EVM chain:
* `ISPLToken(0xFf00000000000000000000000000000000000004)` - this is a factory protocol on Solana where all of the Solana's SPL tokens are being deployed.
* `IMetaplex(0xff00000000000000000000000000000000000005)` - Metaplex is a set of protocols which allows deployers to attach metadata to their deployed tokens on Solana.

### **ERC20ForSPLFactory** & **ERC20ForSPLMintableFactory**:
Both **ERC20ForSPL** and **ERC20ForSPLMintable** are being deployed through the following factory smart contracts - **ERC20ForSPLFactory** and **ERC20ForSPLMintableFactory**. The factory contracts are Beacons built with forked OpenZeppelin's BeaconProxy library and they serve to hold the implementation for the Beacon proxies _( **ERC20ForSPL** and **ERC20ForSPLMintable** )_. The factory contracts are also upgradeable by using forked OpenZeppelin's UUPS library. Only the factory owner _( the Neon DAO )_ can decide whether to upgrade the factory's UUPS implementation or the beacon proxies's implementation.

**ERC20ForSPLMintable** has ownership logic _( forked OpenZeppelin's Ownable library )_ which allows the **ERC20ForSPLMintableFactory** to decide which address will be the smart contract owner. This owner has the permission to call the `mint` method.

## Deploying & executing tests on Neon EVM Devnet:
> [!IMPORTANT]  
> Before starting the tests make sure to create `.env` file containing the private keys of the needed 4 testers _( make a copy of `.env.example` file and rename it to `.env` )_. Make sure that these accounts have enough NEON balance to cover the fees for the transactions executed in the tests. _( You can get Devnet NEONs from the **[Neon Faucet](https://neonfaucet.org)** )_
```
    PRIVATE_KEY_OWNER=XYZ
    USER1_KEY=XYZ
    USER2_KEY=XYZ
    USER3_KEY=XYZ
```

### ERC20ForSPL:
Like mentioned before ERC20ForSPL is used when we have an already existing SPLToken on Solana. For the sake of this demo we will be using this **[SPLToken](https://solscan.io/token/C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr?cluster=devnet)**. The address of the token is already included in the testing script.
1. Run `npx hardhat test --network neondevnet test/ERC20ForSPL.js` - this command will deploy ERC20ForSPL on the Neon EVM Devnet. You will notice that some of the tests are being skipped and this is because the Solana associated token accounts are not being initialized yet for our testers. _( This will be done in step 3. )_
2. In the terminal output you should see an address labeled as _**ERC20ForSPL address on Neon EVM**_, take this address and place it as value for variable `ERC20ForSPLAddress` inside `test/ERC20ForSPL.js` and same thing should be done inside file `src/index.ts`.
3. Next thing to do is in order to execute the tests we need some tokens balance for our testers. This can be done by executing the `src/index.ts` script with the following command `npx ts-node ./src/index.ts <OWNER_NEON_WALLET> <USER1_NEON_WALLET> <USER2_NEON_WALLET>`. Example - `npx ts-node ./src/index.ts 0xAB1c34b53F12980a4fa9043B70c864CEE6891c0C 0xb8f913C9AB9944891993F6c6fDAc421D98461294 0x358726276F5ea5dE31150D2BE61AC2a71F2ecE87`. This step is basically initializing the ATAs _( Associate token accounts )_ for our testers and initiating token transfer transactions with some testing amounts from Solana wallet to our tester wallets.
4. Run again `npx hardhat test --network neondevnet test/ERC20ForSPL.js` and you will notice that now all of the tests are getting executed.

### ERC20ForSPLMintable:
> [!IMPORTANT]  
> When deploying the **ERC20ForSPLMintable** standard the maximum of decimals we are allowed to use for our token is 9, because the maximum number we can store on Solana is `uint64`.

ERC20ForSPLMintable is used when we don't have an existing SPLToken and we want to deploy one. The steps to produce the ERC20ForSPLMintable's tests are lesser - we don't have to fill in our testers balances with a transaction from Solana to Neon, because the ERC20ForSPLMintable smart contract includes a minting method which we can use in our tests `function mint(address to, uint256 amount) public onlyOwner`.

To run the ERC20ForSPLMintable tests run the following command - `npx hardhat test --network neondevnet test/ERC20ForSPLMintable.js`.