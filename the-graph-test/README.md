# The Graph integration on Neon EVM

This is an example of how we can integrate **[the Graph](https://thegraph.com/)** on Neon network. In this example we will be querying the ERC20 history data for the **[USDC token](https://neonscan.org/address/0xea6b04272f9f62f997f666f07d3a974134f7ffb9)** deployed on Neon EVM Mainnet.

### Setup terminal commands:

- `npm install` - Downloading required packages.

### Deployment terminal commands:

- `graph create <SUBGRAPH_SLUG> --node <DEPLOYMENT_URL>` - Creating a subgraph on Neon EVM.
- `graph codegen` - Generates AssemblyScript types for a subgraph.
- `graph build` - Builds a subgraph and (optionally) uploads it to IPFS.
- `graph deploy <SUBGRAPH_SLUG> --node <DEPLOYMENT_URL> --ipfs <IPFS_URL>` - Deploys a subgraph to a Graph node.

#### Neon EVM Mainnet data:

- `<SUBGRAPH_SLUG>` - For the sake of the demo we will be using slug **neonlabs/usdc-token-subgraph**
- `<DEPLOYMENT_URL>` - **https://thegraph.neonevm.org/deploy**
- `<IPFS_URL>` - **https://ipfs.neonevm.org**
- GraphQL can be accessed at url https://thegraph.neonevm.org/subgraphs/name/<SUBGRAPH_SLUG>/graphql

> [!IMPORTANT]  
> Currently the Neon EVM Mainnet version of The Graph is managed in a permissioned way. If your project requires the need of this tool, please reach out to us on [Discord](http://discord.com/invite/neonevm).

#### Neon EVM Devnet data:

- `<SUBGRAPH_SLUG>` - For the sake of the demo we will be using slug **neonlabs/usdc-token-subgraph**
- `<DEPLOYMENT_URL>` - **https://ch2-graph.neontest.xyz/deploy/**
- `<IPFS_URL>` - **https://ch-ipfs.neontest.xyz**
- GraphQL can be accessed at url https://ch2-graph.neontest.xyz/subgraphs/name/<SUBGRAPH_SLUG>/graphql

### Querying subgraph data outside the GraphQL

Inside file `src/index.js` is an example of how we can submit post queries to our subgraph on Neon EVM chain. Run the script with command `node index.js`.
