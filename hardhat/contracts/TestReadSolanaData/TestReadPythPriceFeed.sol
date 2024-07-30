// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./SolanaDataConverterLib.sol";
import "./QueryAccount.sol";


contract TestReadPythPriceFeed {
    using SolanaDataConverterLib for bytes;
    using SolanaDataConverterLib for uint64;
    using SolanaDataConverterLib for uint32;

    /// @notice This method serves to read the bytes length of a Solana data account
    /// @param solanaAddress The Solana data account address of the price feed
    function readSolanaDataAccountLen(bytes32 solanaAddress) public view returns(uint256) {
        (bool success, uint256 data) = QueryAccount.length(uint256(solanaAddress));
        require(success, "failed to query account data");

        return data;
    }

    /// @notice This method serves to read the raw data of a Solana data account
    /// @param solanaAddress The Solana data account address of the price feed
    /// @param offset The offset in bytes, starting to read from the byte
    /// @param len The length of the Solana data account
    function readSolanaDataAccountRaw(bytes32 solanaAddress, uint64 offset, uint64 len) public view returns(bytes memory) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(solanaAddress), offset, len);
        require(success, "failed to query account data");

        return data;
    }

    /// @notice This method serves to read from Pyth price feeds price, prevPublishTimestamp and status
    /// @param solanaAddress The Solana data account address of the price feed
    /// @param offset The offset in bytes, starting to read from the byte
    /// @param len The length of the Solana data account
    /// @return Price
    /// @return Timestamp
    /// @return Status - could be UNKNOWN, TRADING, HALTED, AUCTION
    function readSolanaPythPriceFeed(bytes32 solanaAddress, uint64 offset, uint64 len) public view returns(int64, uint64, uint32) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(solanaAddress), offset, len);
        require(success, "failed to query account data");

        return (
            (data.toUint64(208)).readLittleEndianSigned64(),
            (data.toUint64(200)).readLittleEndianUnsigned64(), 
            (data.toUint32(224)).readLittleEndianUnsigned32()
        );
    }
}