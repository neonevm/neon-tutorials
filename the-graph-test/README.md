# The Graph integration on Neon network
This is an example of how we can integrate **[the Graph](https://thegraph.com/)** on Neon network. In this example we will be querying the ERC20 history data for the **[USDC token](https://neonscan.org/address/0xea6b04272f9f62f997f666f07d3a974134f7ffb9)** deployed on the Neon Mainnet network.

### Setup terminal commands:
* ```npm install``` - Downloading required packages.

### Deployment terminal commands:
* ```graph create <SUBGRAPH_SLUG> --node <DEPLOYMENT_URL>``` - Creating a subgraph on Neon EVM.
* ```graph codegen``` - Generates AssemblyScript types for a subgraph.
* ```graph build``` - Builds a subgraph and (optionally) uploads it to IPFS.
* ```graph deploy <SUBGRAPH_SLUG> --ipfs <IPFS_URL> --node <DEPLOYMENT_URL> -—version-label="v0.0.1"``` - Deploys a subgraph to a Graph node. Keep in mind always to increase the ```-—version-label``` value on each deploy.

#### Neon Mainnet data:
* ```<SUBGRAPH_SLUG>``` - For the sake of the demo we will be using slug **neonlabs/usdc-token-subgraph**
* ```<DEPLOYMENT_URL>``` - **https://thegraph.neonevm.org/deploy**
* ```<IPFS_URL>``` - **https://ipfs.neonevm.org**
* GraphQL can be accessed at url https://thegraph.neonevm.org/subgraphs/name/<SUBGRAPH_SLUG>/graphql

#### Neon Devnet data:
* ```<SUBGRAPH_SLUG>``` - For the sake of the demo we will be using slug **neonlabs/usdc-token-subgraph**
* ```<DEPLOYMENT_URL>``` - **https://ch2-graph.neontest.xyz/deploy/**
* ```<IPFS_URL>``` - **https://ch-ipfs.neontest.xyz**
* GraphQL can be accessed at url https://ch2-graph.neontest.xyz/subgraphs/name/<SUBGRAPH_SLUG>/graphql

#### Before starting make sure to create .env file containing the following data ( make a copy of .env.example file and rename it to .env ):
```
    PRIVATE_KEY_OWNER=XYZ
    NETWORK=XYZ
```
- *PRIVATE_KEY_OWNER - The private key used to create account inside truffle-config.js. This file is used to create custom Graph network, no transactions are being signed and submitted in this project.*
- *NETWORK - this is the RPC URL for Neon Mainnet or Devnet, please head to **[Chainlist](https://chainlist.org/?search=Neon+EVM&testnets=true)** and take it from there.*

### Querying subgraph data outside the GraphQL
Inside file ```src/index.js``` is an example of how we can submit post queries to our subgraph on Neon network. Run the script with command ```node index.js```.