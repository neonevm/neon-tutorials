// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import '../ERC20ForSPLMintableFactory.sol';


/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPLMintableFactoryV2 is ERC20ForSPLMintableFactory {
    function getDummyData() public pure returns(uint256) {
        return 1617181920;
    }
}