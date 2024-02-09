// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

interface IERC20ForSPLMintable {
    function findMintAccount() public pure returns (bytes32);
}