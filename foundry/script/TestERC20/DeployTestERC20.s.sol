// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../../lib/forge-std/src/Script.sol";
import "../../src/TestERC20/TestERC20.sol";
import "forge-std/console.sol";

contract DeployTestERC20Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Change the address to your own deployer account address    
        TestERC20 testERC20Address = new TestERC20("Test ERC20 Token", "TERC20", vm.addr(deployerPrivateKey));
        console.log('TestERC20 deployed at: ', address(testERC20Address));
        vm.stopBroadcast();
    }
}