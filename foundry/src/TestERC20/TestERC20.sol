// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

contract TestERC20 is ERC20, Ownable {

    constructor (string memory _name, string memory _symbol, address initialOwner) 
        ERC20 (_name, _symbol)
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function burn(address from, uint amount) public onlyOwner {
        _burn(from, amount);
    }
}