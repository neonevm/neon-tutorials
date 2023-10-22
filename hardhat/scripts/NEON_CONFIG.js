const NEON_CONFIG = {
    MAINNET: {
        CHAINLINK: {
            PRICE_FEEDS: {
                AVAX_USD: '0x1d6E632542B7E405FAA8D26C4805C981260A9e70',
                BTC_USD: '0x002A8368a4fd76C1809765ea66a9AFa3D424d8e0',
                BNB_USD: '0x3c864365f961f1fb31a6682EB388E84832fd159C',
                DAI_USD: '0xa13Cbd21e5De770Bb9104B951B0b0a876c46ef85',
                ETH_USD: '0xC55B1E0c36A69e2b40BD16759434B071F4bBe8df',
                LINK_USD: '0x22eE81bFA94049c9d880e81c5d40b12423307DFb',
                MATIC_USD: '0x5864ccda29c78845460639021287c3f192350816',
                OP_USD: '0x996c00D1E9DDA20a6d0B7dd516394D5978AC0B92',
                SOL_USD: '0x76721563EC3CF5fB94737Eb583F38f3cD166C7Bb',
                SRM_USD: '0xd010175e4eA718569A105FCbeAa8db44c590730E',
                USDC_USD: '0x8cb22a71AD5ef0384B85FF08Ba1343ec71880C35',
                USDT_USD: '0xba92eACD3fb46661E130577cD03fa32E6D4D757a'
            }
        },
        PYTH: {
            PROXY: '0x7f2db085efc3560aff33865dd727225d91b4f9a5',
            PRICE_FEEDS: {
                BTC_USD: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
                ETH_USD: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
                SOL_USD: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d'
            }
        }
    },
    DEVNET: {
        CHAINLINK: {
            PRICE_FEEDS: {
                BTC_USD: '0x878738FdbCC9Aa39Ce68Fa3B0B0B93426EcB6417',
                ETH_USD: '0x7235B04963600fA184f6023696870F49d014416d',
                LINK_USD: '0xc75E93c4593c23A50cff935F8916774e02c506C7',
                SOL_USD: '0xec852B2A009f49E4eE4ffEddeDcF81a1AD1bbD6d',
                USDC_USD: '0xedc0d80E85292fEf5B0946DEc957563Ceb7C8e6c',
                USDT_USD: '0xE69C1E63ef3E95bE56A50f326aC97Bb7994890aD'
            }
        },
        PYTH: {
            PROXY: '0x2FF312f50689ad279ABb164dB255Eb568733BD6c',
            PRICE_FEEDS: {
                BTC_USD: '0xf9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b',
                ETH_USD: '0xca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
                SOL_USD: '0xfe650f0367d4a7ef9815a593ea15d36593f0643aaaf0149bb04be67ab851decd'
            }
        }
    }
};

module.exports = {NEON_CONFIG};