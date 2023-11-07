import { CovalentClient } from "@covalenthq/client-sdk";

const ADDRESS = '0x3B4E7623b106b010Ab3CE7797690688540fb64e0';
const CHAIN = 'neon-mainnet';
const client = new CovalentClient(import.meta.env.VITE_COVALENT_API_KEY);

async function getApprovals() {
    const resp = await client.SecurityService.getApprovals(CHAIN, ADDRESS);
    if (!resp.error) {
        console.log(resp.data, 'getApprovals');
    } else {
        console.log(resp.error_message);
    }
}
getApprovals();

async function getTokenBalancesForWalletAddress() {
    const resp = await client.BalanceService.getTokenBalancesForWalletAddress(CHAIN, ADDRESS);
    if (!resp.error) {
        console.log(resp.data, 'getTokenBalancesForWalletAddress');
    } else {
        console.log(resp.error_message);
    }
}
getTokenBalancesForWalletAddress();