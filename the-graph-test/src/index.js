#!/usr/bin/ nodejs
const axios = require("axios");

async function init() {
    const graphLink = 'https://thegraph.neonevm.org/subgraphs/name/neonlabs/usdc-token-subgraph';
    const graphQuery = `
    {
        transfers {
            id
            blockNumber
            blockTimestamp
            gasPrice
            creator {
                id
            }
            receiver
            tokenAmount
        }
        users {
            id
        }
    }
    `;

    const graphDeposits = await axios({
        url: graphLink,
        method: 'post',
        data: {
            query: graphQuery
        }
    });

    if (graphDeposits.data.data != undefined && (graphDeposits.data.data.hasOwnProperty('transfers') || graphDeposits.data.data.hasOwnProperty('users'))){
        console.log(graphDeposits.data.data.transfers, 'transfers');
        console.log(graphDeposits.data.data.users, 'users');
    } else {
        console.error('ERROR: No data found!');
        return false;
    }
}
init();