// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import '../ERC20ForSPLFactory.sol';


/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPLFactoryV2 is ERC20ForSPLFactory {
    function getDummyData() public pure returns(uint256) {
        return 678910;
    }
}