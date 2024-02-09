// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./openzeppelin-fork/contracts-upgradeable/proxy/utils/Initializable.sol";
import './ERC20ForSPLBackbone.sol';


/// @title ERC20ForSPL
/// @author https://twitter.com/mnedelchev_
/// @notice This contract serve as an interface of alrready deployed SPLToken on Solana. Thru this interface Ethereum-like address on Neon chain can apply changes on Solana.
/// @dev This contract logic is being used as BeaconProxy implementation. The Beacon is defined and inherited from ERC20ForSPLBackbone.sol at slot 0.
/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPL is ERC20ForSPLBackbone, Initializable {
    /// @notice Disabling the initializers to prevent of implementation getting hijacked
    constructor() {
        _disableInitializers();
    }

    function initialize(bytes32 _tokenMint) public initializer {
        if (!SPL_TOKEN.getMint(_tokenMint).isInitialized) revert InvalidTokenMint();
        if (!METAPLEX.isInitialized(_tokenMint)) revert MissingMetaplex();

        tokenMint = _tokenMint;
    }
}