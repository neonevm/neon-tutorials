// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./openzeppelin-fork/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./openzeppelin-fork/contracts-upgradeable/access/OwnableUpgradeable.sol";


/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPLFactory is OwnableUpgradeable, UUPSUpgradeable {
    address private _implementation;
    address private _uupsImplementation;

    /**
     * @dev The `implementation` of the beacon is invalid.
     */
    error BeaconInvalidImplementation(address implementation);

    /**
     * @dev Emitted when the implementation returned by the beacon is changed.
     */
    event Upgraded(address indexed implementation);

    constructor() {
        _disableInitializers();
    }

    function initialize(address implementation_) public initializer {       
        __Ownable_init(msg.sender);
         _setImplementation(implementation_);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    /**
     * @dev Returns the current implementation address.
     */
    function implementation() public view virtual returns (address) {
        return _implementation;
    }

    /**
     * @dev Upgrades the beacon to a new implementation.
     *
     * Emits an {Upgraded} event.
     *
     * Requirements:
     *
     * - msg.sender must be the owner of the contract.
     * - `newImplementation` must be a contract.
     */
    function upgradeTo(address newImplementation) public virtual onlyOwner {
        _setImplementation(newImplementation);
    }

    /**
     * @dev Sets the implementation contract address for this beacon
     *
     * Requirements:
     *
     * - `newImplementation` must be a contract.
     */
    function _setImplementation(address newImplementation) private {
        if (newImplementation.code.length == 0) {
            revert BeaconInvalidImplementation(newImplementation);
        }
        _implementation = newImplementation;
        emit Upgraded(newImplementation);
    }
}