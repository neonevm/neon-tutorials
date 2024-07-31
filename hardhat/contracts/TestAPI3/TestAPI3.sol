// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@api3/contracts/api3-server-v1/proxies/interfaces/IProxy.sol";

contract TestAPI3 {
    // Use your proxy address as the argument
    function readDataFeed(address proxy) public view returns (int224 value, uint32 timestamp) {
        (value, timestamp) = IProxy(proxy).read();
        // If you have any assumptions about `value` and `timestamp`, make sure
        // to validate them right after reading from the proxy. For example,
        // if the value you are reading is the spot price of an asset, you may
        // want to reject non-positive values...
        require(value > 0, "Value not positive");
        // ...and if the data feed is being updated with a one day-heartbeat
        // interval, you may want to check for that.
        require(
            timestamp + 1 days > block.timestamp,
            "Timestamp older than one day"
        );
    }
}