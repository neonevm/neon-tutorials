require("dotenv").config();
const Web3 = require("web3");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new Web3.providers.HttpProvider(process.env.NETWORK);

module.exports = {
    networks: {
        neonlabs: {
            provider: () => {
                return new HDWalletProvider([process.env.PRIVATE_KEY_OWNER], provider);
            },
            network_id: "*",
        }
    },
    compilers: {
        solc: {
            version: "0.8.21"
        }
    }
};