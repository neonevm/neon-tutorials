// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "../../src/TransientStorage/TransientStorage.sol";

contract DeployTransientStorage is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        TransientStorage transientStorage = new TransientStorage();

        // Call the functions to test gas consumption
        transientStorage.test_gas_1();
        transientStorage.test_gas_2();
        
        vm.stopBroadcast();
    }
}