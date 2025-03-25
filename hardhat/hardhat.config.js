require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
        compilers:[
            {
                version: '0.8.28',
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 10000,
                    }
                }
            },
            {
                version: '0.8.26',
                settings: {
                    viaIR: true,
                    optimizer: {
                        enabled: true,
                        runs: 10000,
                    }
                }
            },
        ],
  },
  etherscan: {
    apiKey: {
      neonevm: "test",
    },
    customChains: [
      {
        network: "neonevm",
        chainId: 245022926,
        urls: {
          apiURL: "https://devnet-api.neonscan.org/hardhat/verify",
          browserURL: "https://devnet.neonscan.org",
        },
      },
      {
        network: "neonevm",
        chainId: 245022934,
        urls: {
          apiURL: "https://api.neonscan.org/hardhat/verify",
          browserURL: "https://neonscan.org",
        },
      },
    ],
  },
  networks: {
  curvestand: {
      url: process.env.NEON_EVM_NODE,
      accounts: [process.env.DEPLOYER_KEY, process.env.PRIVATE_KEY_OWNER, process.env.USER1_KEY],
      allowUnlimitedContractSize: false,
      gasMultiplier: 2,
      maxFeePerGas: 10000,
      maxPriorityFeePerGas: 5000
  },
    neondevnet: {
      url: "https://devnet.neonevm.org",
      accounts: [process.env.PRIVATE_KEY_OWNER, process.env.USER1_KEY],
      chainId: 245022926,
      allowUnlimitedContractSize: false,
      gas: "auto",
      gasPrice: "auto",
    },
    neonmainnet: {
      url: "https://neon-proxy-mainnet.solana.p2p.org",
      accounts: [process.env.PRIVATE_KEY_OWNER, process.env.USER1_KEY],
      chainId: 245022934,
      allowUnlimitedContractSize: false,
      gas: "auto",
      gasPrice: "auto",
    },
  },
};
