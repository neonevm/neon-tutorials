// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import '../ERC20ForSPL.sol';

// !!!!!!!!!!!!!!!!!
// !!! This contract shouldn't be used in production, it's made only to validate the upgradibility on Neon network !!!
// !!!!!!!!!!!!!!!!!
contract ERC20ForSPLV2 is ERC20ForSPL {
    function getDummyData() public pure returns(uint256) {
        return 12345;
    }
}