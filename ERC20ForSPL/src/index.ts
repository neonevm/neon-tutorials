import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { NeonProxyRpcApi, neonTransferMintWeb3Transaction } from '@neonevm/token-transfer';
import { sendSolanaTransaction } from './utils';
import Web3 from 'web3'; 

const walletsToSendTokens = process.argv.slice(2);
if (walletsToSendTokens.length == 0) {
    console.error('No wallets passed as script argument in order to fill them with some tokens.');
    process.exit();
}

const TOKEN_MINT_OWNER_KEY = [78,81,129,107,97,54,158,166,105,36,148,243,127,227,221,104,173,237,82,88,9,40,125,84,72,58,18,127,64,4,57,72,233,61,118,28,77,199,152,180,254,202,218,160,248,36,159,200,62,127,19,152,24,46,235,35,129,7,252,152,27,95,24,62];
const signer = Keypair.fromSecretKey(Uint8Array.from(TOKEN_MINT_OWNER_KEY));

let ERC20ForSPLAddress = ''; // PLACE HERE ERC20ForSPL address on Neon EVM
const neonNeonEvmUrl = 'https://devnet.neonevm.org';
const solanaUrl = 'https://api.devnet.solana.com';
const neonProxyApi = new NeonProxyRpcApi({ neonProxyRpcApi: neonNeonEvmUrl, solanaRpcApi: solanaUrl });

const connection = new Connection(solanaUrl, 'confirmed'); 
const web3 = new Web3(neonNeonEvmUrl); 

const token = {
    chainId: 245022926,
    address_spl: 'C5h24dhh9PjaVtHmf6CaqXbhi9SgrfwUSQt2MskWRLYr',
    address: ERC20ForSPLAddress,
    decimals: 6,
    name: 'ERC20ForSPL Test Token',
    symbol: 'TST',
    logoURI: ''
};

if (token.address == '') {
    console.error('Please setup the variable which should contain the ERC20ForSPL address on Neon EVM.');
    process.exit();
}

async function buildAndSubmitSolanaTx(neonWallet: string) {
    const neonProxyStatus = await neonProxyApi.evmParams(); 
    const transaction = await neonTransferMintWeb3Transaction(
        connection, 
        web3, 
        neonProxyApi, 
        neonProxyStatus, 
        new PublicKey(neonProxyStatus.NEON_EVM_ID)/* or solEvmProgram*/, 
        signer.publicKey, 
        neonWallet, 
        token, 
        100, 
        token.chainId
    );
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    return await sendSolanaTransaction(connection, transaction, [signer], true, { skipPreflight: false });
}

async function init() {
    for (let i = 0, len = walletsToSendTokens.length; i < len; i+=1) {
        let hash = await buildAndSubmitSolanaTx(walletsToSendTokens[i]);
        console.log(hash, 'Solana TX HASH');
    }
}
init()