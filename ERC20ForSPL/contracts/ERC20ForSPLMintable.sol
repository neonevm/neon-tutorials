// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import './ERC20ForSPL.sol';


/// @custom:oz-upgrades-unsafe-allow constructor
contract ERC20ForSPLMintable is ERC20ForSPL {
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) public initializer {       
        ERC20ForSPL.initializeParent(_initialize(_name, _symbol, _decimals));
    }

    function findMintAccount() public pure returns (bytes32) {
        return SPL_TOKEN.findAccount(bytes32(0));
    }

    function mint(address to, uint256 amount) public onlyOwner {
        if (to == address(0)) revert EmptyToAddress();
        if (totalSupply() + amount > type(uint64).max) revert AmountExceedsUint64();

        bytes32 toSolana = solanaAccount(to);
        if (SPL_TOKEN.isSystemAccount(toSolana)) {
            SPL_TOKEN.initializeAccount(_salt(to), tokenMint);
        }

        SPL_TOKEN.mintTo(tokenMint, toSolana, uint64(amount));
        emit Transfer(address(0), to, amount);
    }

    function _initialize(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) private returns (bytes32) {
        bytes32 mintAddress = SPL_TOKEN.initializeMint(bytes32(0), _decimals);
        METAPLEX.createMetadata(mintAddress, _name, _symbol, "");
        return mintAddress;
    }
}