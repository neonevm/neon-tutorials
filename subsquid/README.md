# Subsquid SDK Example

Here's an example of how SDK packages can be combined into a working indexer (called squid) on Neon EVM Devnet.
This squid example tracks transfers of WNEON on Neon EVM Devnet, then save the resulting data to PostgreSQL and serve it as a GraphQL API.

## Prerequisites

1. NodeJS 16.x or newer
2. Docker

## Cloning repository

Run command

```sh
git clone https://github.com/neonlabsorg/neon-tutorials.git
```

**NOTE** All the next operations must be performed from the **neon-tutorials/subsquid** directory.

## Install the required dependencies

```sh
cd neon-tutorials/subsquid
npm install
```

**NOTE** Before starting, make a copy of .env.local.example file and rename it to .env

## Steps to run squid

1. Generate TypeORM classes based on the schema -

```sh
npx squid-typeorm-codegen
```

The TypeORM classes are now available at src/model/index.ts.

2. Start the database container -

```sh
docker compose up -d
```

3. Compile the TypeORM classes -

```sh
npx tsc
```

4. Generate the migration file -

```sh
npx squid-typeorm-migration generate
```

5. Apply the migration with -

```sh
npx squid-typeorm-migration apply
```

6. Create a file src/abi/wneon.json and copy the WNEON contract ABI from https://devnet.neonscan.org/address/0x11adc2d986e334137b9ad0a0f290771f31e9517f#contract.

7. Run -

```sh
npx squid-evm-typegen src/abi ./src/abi/wneon.json
```

The utility classes will be now available at src/abi/wneon.ts.

8. Tie all the generated code together with a src/main.ts executable with the following code -

```sh
import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import { lookupArchive } from "@subsquid/archive-registry";
import * as wneonAbi from "./abi/wneon";
import { Transfer } from "./model";

const processor = new EvmBatchProcessor()
  .setGateway(lookupArchive("neon-devnet"))
  .setRpcEndpoint({
    // set RPC endpoint in .env
    url: process.env.RPC_NEON_HTTP,
    //rateLimit: 10,
  })
  .setBlockRange({ from: 177455580 }) // Neon EVM Devnet genesis block
  .setFinalityConfirmation(75) // 15 mins to finality
  .addLog({
    address: ["0x11adC2d986E334137b9ad0a0F290771F31e9517F"], // WNEON contract address on Neon EVM Devnet
    topic0: [wneonAbi.events.Transfer.topic],
  });

const db = new TypeormDatabase();

processor.run(db, async (ctx) => {
  const transfers: Transfer[] = [];
  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      let { src, dst, wad } = wneonAbi.events.Transfer.decode(log);
      transfers.push(
        new Transfer({
          id: log.id,
          src,
          dst,
          wad,
        })
      );
    }
  }
  await ctx.store.insert(transfers);
});
```

9. Compile the project and start the processor process -

```sh
npx tsc
node -r dotenv/config lib/main.js
```

9. In a separate terminal, configure the GraphQL port and start the GraphQL server -

```sh
npx squid-graphql-server
```

The finished GraphQL API with GraphiQL is available at localhost:4350/graphql.
