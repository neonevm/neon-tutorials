// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./openzeppelin-fork/contracts-upgradeable/proxy/utils/Initializable.sol";
import './ERC20ForSPLBackbone.sol';

contract ERC20ForSPL is ERC20ForSPLBackbone, Initializable {
    function initialize(bytes32 _tokenMint) public initializer {
        if (!SPL_TOKEN.getMint(_tokenMint).isInitialized) revert InvalidTokenMint();
        if (!METAPLEX.isInitialized(_tokenMint)) revert MissingMetaplex();

        tokenMint = _tokenMint;
    }
}