// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import "./SolanaDataConverterLib.sol";
import "./QueryAccount.sol";


contract TestReadTokenAccountData {
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

    function readSolanaTokenAccountData(bytes32 solanaAddress, uint64 offset, uint64 len) public view returns(
        bytes32,
        bytes32,
        uint64
    ) {
        (bool success, bytes memory data) = QueryAccount.data(uint256(solanaAddress), offset, len);
        require(success, "failed to query account data");

        return (
            data.toBytes32(0),
            data.toBytes32(32),
            (data.toUint64(64)).readLittleEndianUnsigned64()
        );
    }
}