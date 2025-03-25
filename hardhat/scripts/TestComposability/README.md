# Solidity libraries for NeonEVM composability

The composability feature allows dApps deployed on _NeonEVM_ to interact with _Solana_ programs, which involves 
formatting instructions in ways that are specific to each program.

Here we provide a set of **Solidity** libraries which make it possible to easily implement secure interactions with 
_Solana_'s **System** and **SPL Token** programs.

This work is an example of what program-specific **Solidity** libraries for _NeonEVM_ composability could look like.

## LibSystemProgram library

This library provides helper functions for formatting instructions intended to be executed by _Solana_'s **System** 
program.

## LibSPLTokenProgram library

This library provides helper functions for formatting instructions intended to be executed by _Solana_'s **SPL Token** 
program.

## LibUtils library

This library provides helper functions to **LibSystemProgram** and **LibSPLTokenProgram** libraries.

## TestComposability contract

This contract demonstrates how **LibSystemProgram** and **LibSPLTokenProgram** libraries can be used in practice to 
interact with Solana's System and SPL Token programs.

### Token accounts ownership and authentication

The **TestComposability** contract provides its users with methods to create and initialize SPL token mints and 
associated token accounts, as well as to mint and transfer tokens using those accounts. It features a built-in 
authentication logic ensuring that users remain in control of created accounts.

#### SPL token mint ownership and authentication

The `testCreateInitializeTokenMint` function takes a `seed` parameter as input which is used along with 
`msg.sender` to derive the created token mint account. While the **TestComposability** contract is given mint/freeze 
authority on the created token mint account, the `testMintTokens` function grants `msg.sender` permission to mint tokens
by providing the `seed` that was used to create the token mint account.

#### Associated token account ownership and authentication

The `testCreateInitializeATA` function can be used for three different purposes:

* To create and in initialize an associated token account (ATA) to be used by `msg.sender` to send tokens through the 
**TestComposability** contract. In this case, both the `owner` and `tokenOwner` parameters passed to the function should
be left empty. The ATA to be created is derived from `msg.sender` and a `nonce` (that can be incremented to create 
different ATAs). The owner of the ATA is the **TestComposability** contract. The `testTransferTokens` function grants 
`msg.sender` permission to transfer tokens from this ATA by providing the `nonce` that was used to create the ATA.

* To create and initialize an associated token account (ATA) to be used by a third party `user` NeonEVM account through 
the **TestComposability** contract. In this case, the `owner` parameter passed to the function should be  
`TestComposability.getNeonAddress(user)` and the `tokenOwner` parameter should be left empty. The ATA to be created is 
derived from the `user` account and a `nonce` (that can be incremented to create different ATAs). The owner of the ATA 
is the **TestComposability** contract. The `testTransferTokens` function grants `user` permission to transfer tokens 
from this ATA by providing the `nonce` that was used to create the ATA.

* To create and in initialize an associated token account (ATA) to be used by a third party `solanaUser` _Solana_ account
to send tokens directly on _Solana_ without interacting with the **TestComposability** contract. In this case, both the 
`owner` and the `tokenOwner` parameters passed to the function should be `solanaUser`. The ATA to be created is derived 
from the `solanaUser` account and a `nonce` (that can be incremented to create different ATAs). The owner of the ATA is 
the `solanaUser` account. The `solanaUser` account cannot transfer tokens from this ATA by interacting with the 
**TestComposability** contract, instead it must interact directly with the **SPL Token** program on _Solana_ by signing 
and executing a `transfer` instruction.

## Scripts

The `TestComposability` contract is deployed at the beginning of each script, unless a contract address is passed to the
script's `main` function, or the `config.js` file already contains an address for this contract.

To run all test scripts in a row:

`npx hardhat run ./scripts/TestComposability/test.js --network <network_name>`

### System Program interactions

* The `create-account-with-seed.js` script lets you format and execute _Solana_'s **System** program 
`createAccountWithSeed` instruction.

### SPL Token Program interactions

* The `test-create-init-token-mint` script lets you format and execute _Solana_'s **SPL Token** program 
`initializeMint2` instruction after creating a SPL token mint account using _NeonEVM_ composability's `createResource` 
method.

* The `test-create-init-ata` script lets you format and execute _Solana_'s **SPL Token** program 
`initializeAccount2` instruction to create and initialize two associated token accounts using _NeonEVM_ composability's 
`createResource` method. Make sure to have run the `test-create-init-token-mint` script first before running this script.

* The `test-mint-tokens` script lets you format and execute _Solana_'s **SPL Token** program 
`mintTo` instruction, minting SPL tokens to a recipient's associated token account. Make sure to have run the 
`test-create-init-token-mint` and `test-create-init-ata` scripts first before running this script.

* The `test-transfer-tokens` script lets you format and execute _Solana_'s **SPL Token** program 
`transfer` instruction, transferring SPL tokens from NeonEVM deployer ATA to another NeonEVM user ATA then from this 
NeonEVM user ATA to a random Solana user ATA. Make sure to have run the `test-create-init-token-mint`, 
`test-create-init-ata` and `test-mint-tokens` scripts first before running this script.

* The `test-update-mint-authority` script lets you format and execute _Solana_'s **SPL Token** program
`createSetAuthority` instruction in a way that updates a token's mint authority to a new account. Make sure to have run 
the `test-create-init-token-mint` script first before running this script.

* The `test-revoke-appoval` script lets you format and execute _Solana_'s **SPL Token** program `revoke` instruction to 
revoke all delegation from NeonEVM deployer ATA. Make sure to have run the `test-create-init-token-mint` and 
`test-create-init-ata` scripts first before running this script.
