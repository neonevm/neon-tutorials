// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import '../ERC20ForSPLMintable.sol';

// !!!!!!!!!!!!!!!!!
// !!! This contract shouldn't be used in production, it's made only to validate the upgradibility on Neon network !!!
// !!!!!!!!!!!!!!!!!
contract ERC20ForSPLMintableV2 is ERC20ForSPLMintable {
    function getDummyData() public pure returns(uint256) {
        return 1112131415;
    }
}