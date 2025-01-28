const {
  Raydium,
  TxVersion,
  parseTokenAccountResp,
} = require("@raydium-io/raydium-sdk-v2");
const { Connection, Keypair, clusterApiUrl } = require("@solana/web3.js");
const {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
} = require("@solana/spl-token");
const bs58 = require("bs58");
require("dotenv").config();

const owner = Keypair.fromSecretKey(
  bs58.default.decode(process.env.PRIVATE_KEY_OWNER)
);
const connection = new Connection(
  "https://api.mainnet-beta.solana.com/",
  "processed"
); // Replace <YOUR_RPC_URL> with your RPC URL
//const connection = new Connection(clusterApiUrl("devnet")); // For devnet
const txVersion = TxVersion.V0; // or TxVersion.LEGACY

let raydium;
const initSdk = async (params) => {
  if (raydium) return raydium;
  raydium = await Raydium.load({
    owner,
    connection,
    cluster: "mainnet", // 'mainnet' | 'devnet'
    disableFeatureCheck: true,
    disableLoadToken: !(params && params.loadToken),
    blockhashCommitment: "finalized",
    // urlConfigs: {
    //   BASE_HOST: '<API_HOST>', // API URL configs, currently API doesn't support devnet
    // },
  });

  /**
   * By default: SDK will automatically fetch token account data when needed or any SOL balance changes.
   * If you want to handle token account by yourself, set token account data after initializing the SDK.
   * Code below shows how to do it.
   * Note: After calling raydium.account.updateTokenAccount, Raydium will not automatically fetch token accounts.
   */

  /*
    raydium.account.updateTokenAccount(await fetchTokenAccountData());
    connection.onAccountChange(owner.publicKey, async () => {
      raydium.account.updateTokenAccount(await fetchTokenAccountData());
    });
    */

  return raydium;
};

const fetchTokenAccountData = async () => {
  const solAccountResp = await connection.getAccountInfo(owner.publicKey);
  const tokenAccountResp = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );
  const token2022Req = await connection.getTokenAccountsByOwner(
    owner.publicKey,
    { programId: TOKEN_2022_PROGRAM_ID }
  );
  const tokenAccountData = parseTokenAccountResp({
    owner: owner.publicKey,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  });
  return tokenAccountData;
};

module.exports = {
  owner,
  connection,
  txVersion,
  initSdk,
  fetchTokenAccountData,
};
