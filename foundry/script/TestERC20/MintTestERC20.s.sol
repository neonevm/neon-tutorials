// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "../../lib/forge-std/src/Script.sol";
import "../../src/TestERC20/TestERC20.sol";
import "forge-std/console.sol";

contract MintTestERC20Script is Script {
    uint internal constant mintAmount = 1e14;
    uint internal constant transferAmount = 1e12;
    address internal recipient = makeAddr("recipient");
    address internal testERC20Address; // define here your TestERC20's address

    function run() external {
        require(testERC20Address != address(0), "Before running this test please define variable testERC20Address with the address of your deployed TestERC20.");

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Change the address to your own deployed contract address    
        TestERC20 testToken = TestERC20(testERC20Address);
        address owner = testToken.owner();

        // Change the address to your own deployer account address    
        uint256 initialBalanceOfDeployer = testToken.balanceOf(owner);
        console.log("The initial balance of the deployer account is: ");
        console.logUint(initialBalanceOfDeployer);

        // Change the address to your own deployer account address
        testToken.mint(owner, mintAmount);

        // Change the address to your own deployer account address
        uint256 newBalanceOfDeployer = testToken.balanceOf(owner);
        console.log("The new balance of the deployer account is: ");
        console.logUint(newBalanceOfDeployer);

        // Change the address to the recipient account address
        uint256 initialBalanceOfTheReceiver = testToken.balanceOf(recipient);
        console.log("The initial balance of the receiver account before the transfer is: ");
        console.logUint(initialBalanceOfTheReceiver);

        require(
            newBalanceOfDeployer > initialBalanceOfDeployer && 
            newBalanceOfDeployer == initialBalanceOfDeployer + mintAmount, 
            "newBalanceOfDeployer should be bigger"
        );

        // Change the address to the recipient account address
        testToken.transfer(recipient, transferAmount);

        // Change the address to your own deployer account address
        uint256 newBalanceOfDeployerAfterTransfer = testToken.balanceOf(owner);
        console.log("The new balance of the deployer account after the transfer is: ");
        console.logUint(newBalanceOfDeployerAfterTransfer);

        // Change the address to the recipient account address
        uint256 newBalanceOfTheReceiver = testToken.balanceOf(recipient);
        console.log("The new balance of the receiver account after the transfer is: ");
        console.logUint(newBalanceOfTheReceiver);

        require(newBalanceOfDeployer > newBalanceOfDeployerAfterTransfer, "newBalanceOfDeployer should be bigger");
        require(
            newBalanceOfTheReceiver > initialBalanceOfTheReceiver && 
            newBalanceOfTheReceiver == initialBalanceOfTheReceiver + transferAmount,
            "newBalanceOfTheReceiver should be bigger"
        );

        vm.stopBroadcast();
    }
}