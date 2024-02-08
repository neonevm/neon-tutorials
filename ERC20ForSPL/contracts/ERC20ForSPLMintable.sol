// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import "./openzeppelin-fork/contracts-upgradeable/proxy/utils/Initializable.sol";
import './ERC20ForSPLBackbone.sol';

contract ERC20ForSPLMintable is ERC20ForSPLBackbone, Initializable {
    error InvalidDecimals();

    /// @notice Method used by the OpenZeppelin's UUPS lib that mimics the functionality of a constructor
    /// @param _name The name of the SPLToken
    /// @param _symbol The symbol of the SPLToken
    /// @param _decimals The decimals of the SPLToken. This value cannot be bigger than 9, because of Solana's maximum value limit of uint64
    function initialize(
        string memory _name,
        string memory _symbol,
        uint8 _decimals
    ) public initializer {
        if (_decimals > 9) revert InvalidDecimals();
        
        bytes32 _tokenMint = _initialize(_name, _symbol, _decimals);
        if (!SPL_TOKEN.getMint(_tokenMint).isInitialized) revert InvalidTokenMint();
        if (!METAPLEX.isInitialized(_tokenMint)) revert MissingMetaplex();

        tokenMint = _tokenMint;
    }

    /// @notice Returns the Solana address of the Token Mint
    function findMintAccount() public pure returns (bytes32) {
        return SPL_TOKEN.findAccount(bytes32(0));
    }

    /// @notice Mint new SPLToken directly on Solana chain
    /// @custom:getter balanceOf
    function mint(address to, uint256 amount) public {
        if (to == address(0)) revert EmptyAddress();
        if (totalSupply() + amount > type(uint64).max) revert AmountExceedsUint64();

        bytes32 toSolana = solanaAccount(to);
        if (SPL_TOKEN.isSystemAccount(toSolana)) {
            SPL_TOKEN.initializeAccount(_salt(to), tokenMint);
        }

        SPL_TOKEN.mintTo(tokenMint, toSolana, uint64(amount));
        emit Transfer(address(0), to, amount);
    }

    /// @notice Internal method which deploys the Token Mint on Solana and setups the metadata ( name & symbol ) to the Metaplex protocol on Solana
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