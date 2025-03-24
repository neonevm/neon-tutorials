// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20ForSPL {
    function balanceOf(address _owner) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external;

    function transfer(address recipient, uint256 amount) external;

    function transferSolana(bytes32 to, uint64 amount) external returns(bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external;

    function decimals() external view returns (uint8);

    function symbol() external view returns(string memory);

    function tokenMint() external view returns(bytes32);
}