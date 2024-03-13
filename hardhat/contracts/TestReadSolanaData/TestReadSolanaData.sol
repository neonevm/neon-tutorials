// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./SolanaDataConverterLib.sol";
import "./QueryAccount.sol";


contract TestReadSolanaData {
    using SolanaDataConverterLib for bytes;
    using SolanaDataConverterLib for uint64;

    function readSolanaDataAccountLen(bytes32 solanaAddress) public view returns(uint256) {
        (bool success, uint256 data) = QueryAccount.length(uint256(solanaAddress));
        require(success, "failed to query account data");

        return data;
    }

    function readSolanaDataAccountRaw(bytes32 solanaAddress, uint64 offset, uint64 len) public view returns(bytes memory) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(solanaAddress), offset, len);
        require(success, "failed to query account data");

        return data;
    }

    function readSolanaDataAccountAmount(bytes32 solanaAddress, uint64 offset, uint64 len) public view returns(uint64) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(solanaAddress), offset, len);
        require(success, "failed to query account data");

        return (data.toUint64()).readLittleEndianUnsigned64();
    }

    function readSolanaDataAccountPublicKey(bytes32 solanaAddress, uint64 offset, uint64 len) public view returns(bytes32) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(solanaAddress), offset, len);
        require(success, "failed to query account data");

        return data.toBytes32();
    }
}