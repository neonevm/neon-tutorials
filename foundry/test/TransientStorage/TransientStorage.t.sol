// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Test.sol";
import "../../src/TransientStorage/TransientStorage.sol";

contract TransientStorageTest is Test {
    TransientStorage transientStorage;

    function setUp() public {
        transientStorage = new TransientStorage();
    }

    function testNonReentrant1() public {
        transientStorage.test_gas_1();
    }

    function testNonReentrant2() public {
        transientStorage.test_gas_2();
    }

    function testReentrancyProtection1() public {
        // Call test_gas_1 twice to check reentrancy protection
        transientStorage.test_gas_1();
        transientStorage.test_gas_1();
    }

    function testReentrancyProtection2() public {
        // Call test_gas_2 twice to check reentrancy protection
        transientStorage.test_gas_2();
        transientStorage.test_gas_2();
    }
}
