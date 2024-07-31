// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


contract TestChainlink {
    /**
     * Returns the latest price for specific price feed
     */
    function getLatestPrice(address _priceFeed) external view returns (int) {
        (
            /* uint80 roundID */,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = AggregatorV3Interface(_priceFeed).latestRoundData();
        return price;
    }

    /**
     * Returns the decimals for specific price feed
     */
    function getDecimals(address _priceFeed) external view returns (uint8) {
        return AggregatorV3Interface(_priceFeed).decimals();
    }
}