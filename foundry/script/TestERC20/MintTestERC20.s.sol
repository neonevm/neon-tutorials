// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "../../lib/forge-std/src/Script.sol";
import "../../src/TestERC20/TestERC20.sol";
import "forge-std/console.sol";

contract MintTestERC20Script is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Change the address to your own deployed contract address    
        TestERC20 testToken = TestERC20(0x0E4fa8e0Cfb3612faCe78515D3b485D474BD17b3);

        // Change the address to your own deployer account address    
        uint256 initialBalanceOfDeployer = testToken.balanceOf(address(0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959));
        console.log("The initial balance of the deployer account is: ");
        console.logUint(initialBalanceOfDeployer);

        // Change the address to your own deployer account address
        testToken.mint(address(0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959), 1e14);

        // Change the address to your own deployer account address
        uint256 newBalanceOfDeployer = testToken.balanceOf(address(0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959));
        console.log("The new balance of the deployer account is: ");
        console.logUint(newBalanceOfDeployer);

        // Change the address to the recipient account address
        uint256 initialBalanceOfTheReceiver = testToken.balanceOf(address(0x4455E84Eaa56a01676365D4f86348B311969a4f4));
        console.log("The initial balance of the receiver account before the transfer is: ");
        console.logUint(initialBalanceOfTheReceiver);

        // Change the address to the recipient account address
        testToken.transfer(address(0x4455E84Eaa56a01676365D4f86348B311969a4f4), 1e12);

        // Change the address to your own deployer account address
        uint256 newBalanceOfDeployerAfterTransfer = testToken.balanceOf(address(0x9CE2A03A7a258fB96d04Afb8Dd84b69A748B5959));
        console.log("The new balance of the deployer account after the transfer is: ");
        console.logUint(newBalanceOfDeployerAfterTransfer);

        // Change the address to the recipient account address
        uint256 newBalanceOfTheReceiver = testToken.balanceOf(address(0x4455E84Eaa56a01676365D4f86348B311969a4f4));
        console.log("The new balance of the receiver account after the transfer is: ");
        console.logUint(newBalanceOfTheReceiver);

        vm.stopBroadcast();
    }
}