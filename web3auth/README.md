# Web3Auth (`@web3auth/modal`) x Neon EVM x React

This example demonstrates how to use Web3Auth with React on Neon EVM chain. For more information on Web3Auth, please follow this link https://web3auth.io/docs.

## Install dependencies and start the React application

```sh
npm install
npm run start
```

## Features included with this example

### Ways of Signing in

This Web3Auth example allows you to login via the following ways -

1. Social logins like Google, Facebook, Reddit, Discord, Apple, Github, X, Linkedin and many more.
2. Email or Phone number.
3. Metamask wallet.

### Web3 RPC methods on Neon EVM

After successfully signing in with any of the above mentioned ways of signing, the following methods can be checked on Neon EVM -

1. **Get Chain ID:** Displays the network chain ID to which the dApp is connected. In this example, it is `245022926`, which is the chain ID of Neon EVM Devnet.

2. **Get Accounts:** Displays the wallet account on Neon EVM Devnet connected to the dApp.

3. **Get Balance:** Displays the balance of NEONs for the wallet account that is connected to the dApp.

4. **Sign Message:** Signs a message with the connected wallet account and returns the signed message.

5. **Send Transaction:** Does a simple NEON transfer from account to another and returns the transaction receipt.

6. **Read Contract:** Calls a read-only contract method and returns the result. In this example, it returns a message stored in the simple storage contract `0x093451875d5A8D61bB90faA7A8645eB17c86b297` deployed on Neon EVM Devnet.

7. **Write Contract:** Sends a transaction to the smart contract method and returns the transaction receipt. In this example, the message is updated in the simple storage contract `0x093451875d5A8D61bB90faA7A8645eB17c86b297` deployed on Neon EVM Devnet.

8. **Log Out:** Logs out of the account connected.
