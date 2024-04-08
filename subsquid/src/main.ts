import { EvmBatchProcessor } from "@subsquid/evm-processor";
import { TypeormDatabase } from "@subsquid/typeorm-store";
import * as wneonAbi from "./abi/wneon";
import { Transfer } from "./model";

const processor = new EvmBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/neon-devnet")
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
