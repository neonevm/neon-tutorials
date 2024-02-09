// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./openzeppelin-fork/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./openzeppelin-fork/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./openzeppelin-fork/contracts/proxy/beacon/BeaconProxy.sol";
import "./interfaces/IERC20ForSPLMintable.sol";
import "./ERC20ForSPLMintable.sol";


/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPLFactory is OwnableUpgradeable, UUPSUpgradeable {
    address private _implementation;
    address private _uupsImplementation;
    mapping(bytes32 => address) public tokensData;
    address[] public tokens;
    address public beacon;

    event TokenDeploy(bytes32 tokenMint, address token);
    event Upgraded(address indexed implementation);

    error BeaconInvalidImplementation(address implementation);

    /// @notice Disabling the initializers to prevent of implementation getting hijacked
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

    function deploy(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) external {
        BeaconProxy token = new BeaconProxy(
            address(this),
            abi.encodeWithSelector(
                ERC20ForSPLMintable(address(0)).initialize.selector, 
                _name,
                _symbol,
                _decimals,
                msg.sender
            )
        );

        tokensData[IERC20ForSPLMintable(address(token)).findMintAccount()] = address(token);
        tokens.push(address(token));

        emit TokenDeploy(tokenMint, address(token));
    }
}