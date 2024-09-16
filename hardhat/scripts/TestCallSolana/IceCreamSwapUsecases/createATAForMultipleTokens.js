const web3 = require("@solana/web3.js");
const fs = require("fs");
const {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const { config } = require('../config');

const connection = new web3.Connection(config.SOLANA_NODE_MAINNET, "processed");
if (process.env.ANCHOR_WALLET == undefined) {
    return console.error('Please create id.json in the root of the hardhat project with your Solana\'s private key and run the following command in the terminal in order to proceed with the script execution: \n\n export ANCHOR_WALLET=./id.json');
}
const keypair = web3.Keypair.fromSecretKey(Uint8Array.from(new Uint8Array(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET).toString()))));
console.log(keypair.publicKey.toBase58(), 'payer');

const owner = new web3.PublicKey('FztZn4GPVuarLGA7G1GLKjX36fnMpu51EHwt1HFDWDtL'); // set your contractPublicKey here
const tokenMintsArray = [
    'So11111111111111111111111111111111111111112', // WSOL
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
    /* 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
    '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // WBTC */
];
let atasToBeCreated = '';

async function init() {
    if (await connection.getBalance(keypair.publicKey) < 10000000) {
        return console.error('\nYou need at least 0.01 SOL in your wallet to proceed with transactions execution.');
    }
    const transaction = new web3.Transaction();

    for (let i = 0, len = tokenMintsArray.length; i < len; ++i) {
        const associatedToken = getAssociatedTokenAddressSync(
            new web3.PublicKey(tokenMintsArray[i]), 
            owner, 
            true, 
            TOKEN_PROGRAM_ID, 
            ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const ataInfo = await connection.getAccountInfo(associatedToken);

        // create ATA only if it's missing
        if (!ataInfo || !ataInfo.data) {
            atasToBeCreated += tokenMintsArray[i] + ', ';

            transaction.add(
                createAssociatedTokenAccountInstruction(
                    keypair.publicKey,
                    associatedToken,
                    owner,
                    new web3.PublicKey(tokenMintsArray[i]), 
                    TOKEN_PROGRAM_ID, 
                    ASSOCIATED_TOKEN_PROGRAM_ID
                )
            );
        }
    }

    if (transaction.instructions.length) {
        console.log('\nCreating ATA accounts for the following SPLTokens - ', atasToBeCreated.substring(0, atasToBeCreated.length - 2));
        const signature = await web3.sendAndConfirmTransaction(
            connection,
            transaction,
            [keypair]
        );

        console.log('\nTx signature', signature);
    } else {
        return console.error('\nNo instructions included into transaction.');
    }
} 
init();