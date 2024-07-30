// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20 {
    constructor() ERC20("TestERC20", "TST") {
        _mint(msg.sender, 1000 * 10 ** decimals());
    }
}