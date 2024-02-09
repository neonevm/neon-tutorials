// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./openzeppelin-fork/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./openzeppelin-fork/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./openzeppelin-fork/contracts/proxy/beacon/BeaconProxy.sol";
import "./ERC20ForSPL.sol";


/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPLFactory is OwnableUpgradeable, UUPSUpgradeable {
    address private _implementation;
    address private _uupsImplementation;
    mapping(bytes32 => Token) public tokensData;
    address[] public tokens;
    address public beacon;

    struct Token {
        address token;
        State state;
    }

    enum State {
        New,
        AlreadyExisting
    }

    event TokenDeploy(bytes32 tokenMint, address token);
    event Upgraded(address indexed implementation);

    error InvalidTokenData();
    error AlreadyExistingERC20ForSPL();
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

    function addAlreadyExistingERC20ForSPL(bytes32[] memory tokenMints, address[] memory alreadyExistingTokens) external onlyOwner {
        uint tokensLen = alreadyExistingTokens.length;
        if (tokensLen != tokenMints.length) revert InvalidTokenData();

        for (uint i; i < tokensLen; ++i) {
            if (tokensData[tokenMints[i]].token != address(0)) revert AlreadyExistingERC20ForSPL();

            tokensData[tokenMints[i]] = Token({
                token: alreadyExistingTokens[i],
                state: State.AlreadyExisting
            });
            tokens.push(address(alreadyExistingTokens[i]));
        }
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

    function deploy(bytes32 tokenMint) external {
        if (tokensData[tokenMint].token != address(0)) revert AlreadyExistingERC20ForSPL();

        BeaconProxy token = new BeaconProxy(
            address(this),
            abi.encodeWithSelector(ERC20ForSPL(address(0)).initialize.selector, tokenMint)
        );

        tokensData[tokenMint] = Token({
            token: address(token),
            state: State.New
        });
        tokens.push(address(token));

        emit TokenDeploy(tokenMint, address(token));
    }
}