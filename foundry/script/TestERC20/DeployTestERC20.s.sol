// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "../../lib/forge-std/src/Script.sol";
import "../../src/TestERC20/TestERC20.sol";

contract DeployTestERC20Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Change the address to your own deployer account address    
        new TestERC20("Test ERC20 Token", "TERC20", address(0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959));

        vm.stopBroadcast();
    }
}