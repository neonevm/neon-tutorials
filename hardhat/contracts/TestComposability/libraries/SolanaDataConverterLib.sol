// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SolanaDataConverterLib
/// @author https://twitter.com/mnedelchev_
/// @notice This contract serves as a helper library when interacting with precompile QueryAccount ( 0xFF00000000000000000000000000000000000002 )
library SolanaDataConverterLib {
    function toAddress(bytes memory _bytes, uint256 _start) internal pure returns (address) {
        require(_bytes.length >= _start + 20, "toAddress_outOfBounds");
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(add(_bytes, 0x20), _start)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

    function toBytes32(bytes memory _bytes, uint256 _start) internal pure returns (bytes32) {
        require(_bytes.length >= _start + 32, "toBytes32_outOfBounds");
        bytes32 tempBytes32;

        assembly {
            tempBytes32 := mload(add(add(_bytes, 0x20), _start))
        }

        return tempBytes32;
    }

    function toUint8(bytes memory _bytes, uint256 _start) internal pure returns (uint8) {
        require(_bytes.length >= _start + 1, "toUint8_outOfBounds");
        uint8 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x1), _start))
        }

        return tempUint;
    }

    function toUint16(bytes memory _bytes, uint256 _start) internal pure returns (uint16) {
        require(_bytes.length >= _start + 2, "toUint16_outOfBounds");
        uint16 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x2), _start))
        }

        return tempUint;
    }

    function toUint32(bytes memory _bytes, uint256 _start) internal pure returns (uint32) {
        require(_bytes.length >= 4, "toUint32_outOfBounds");
        uint32 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x4), _start))
        }

        return tempUint;
    }

    function toUint64(bytes memory _bytes, uint256 _start) internal pure returns (uint64) {
        require(_bytes.length >= _start + 8, "toUint64_outOfBounds");
        uint64 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x8), _start))
        }

        return tempUint;
    }

    function toUint96(bytes memory _bytes, uint256 _start) internal pure returns (uint96) {
        require(_bytes.length >= _start + 12, "toUint96_outOfBounds");
        uint96 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0xc), _start))
        }

        return tempUint;
    }

    function toUint128(bytes memory _bytes, uint256 _start) internal pure returns (uint128) {
        require(_bytes.length >= _start + 16, "toUint128_outOfBounds");
        uint128 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x10), _start))
        }

        return tempUint;
    }

    function toUint256(bytes memory _bytes, uint256 _start) internal pure returns (uint256) {
        require(_bytes.length >= _start + 32, "toUint256_outOfBounds");
        uint256 tempUint;

        assembly {
            tempUint := mload(add(add(_bytes, 0x20), _start))
        }

        return tempUint;
    }

    function readLittleEndianUnsigned32(uint32 input) internal pure returns (uint32) {
        // swap bytes
        input = ((input & 0xFF00FF00) >> 8) | ((input & 0x00FF00FF) << 8);

        // swap 2-byte long pairs
        return (input >> 16) | (input << 16);
    }

    function readLittleEndianSigned32(uint32 input) internal pure returns (int32) {
        input = ((input << 8) & 0xFF00FF00) | ((input >> 8) & 0x00FF00FF);
        return int32((input << 16) | ((input >> 16) & 0xFFFF));
    }

    function readLittleEndianUnsigned64(uint64 input) internal pure returns (uint64) {
        // swap bytes
        input = ((input & 0xFF00FF00FF00FF00) >> 8) | ((input & 0x00FF00FF00FF00FF) << 8);

        // swap 2-byte long pairs
        input = ((input & 0xFFFF0000FFFF0000) >> 16) | ((input & 0x0000FFFF0000FFFF) << 16);

        // swap 4-byte long pairs
        return(input >> 32) | (input << 32);
    }

    function readLittleEndianSigned64(uint64 input) internal pure returns (int64) {
        input = ((input << 8) & 0xFF00FF00FF00FF00) | ((input >> 8) & 0x00FF00FF00FF00FF);
        input = ((input << 16) & 0xFFFF0000FFFF0000) | ((input >> 16) & 0x0000FFFF0000FFFF);
        return int64((input << 32) | ((input >> 32) & 0xFFFFFFFF));
    }

    function readLittleEndianUnsigned128(uint128 input) internal pure returns (uint128) {
        // swap bytes
        input = ((input & 0xFF00FF00FF00FF00FF00FF00FF00FF00) >> 8) | ((input & 0x00FF00FF00FF00FF00FF00FF00FF00FF) << 8);

        // swap 2-byte long pairs
        input = ((input & 0xFFFF0000FFFF0000FFFF0000FFFF0000) >> 16) | ((input & 0x0000FFFF0000FFFF0000FFFF0000FFFF) << 16);

        // swap 4-byte long pairs
        input = ((input & 0xFFFFFFFF00000000FFFFFFFF00000000) >> 32) | ((input & 0x00000000FFFFFFFF00000000FFFFFFFF) << 32);

        // swap 8-byte long pairs
        return (input >> 64) | (input << 64);
    }

    function readLittleEndianSigned128(uint128 input) internal pure returns (int128) {
        input = ((input << 8) & 0xFF00FF00FF00FF00FF00FF00FF00FF00) | ((input >> 8) & 0x00FF00FF00FF00FF00FF00FF00FF00FF);
        input = ((input << 16) & 0xFFFF0000FFFF0000FFFF0000FFFF0000) | ((input >> 16) & 0x0000FFFF0000FFFF0000FFFF0000FFFF);
        input = ((input << 32) & 0xFFFFFFFF00000000FFFFFFFF00000000) | ((input >> 32) & 0x00000000FFFFFFFF00000000FFFFFFFF);
        return int128((input << 64) | ((input >> 64) & 0xFFFFFFFFFFFFFFFF));
    }

    function readLittleEndianUnsigned256(uint256 input) internal pure returns (uint256) {
        // swap bytes
        input = ((input & 0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((input & 0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) << 8);

        // swap 2-byte long pairs
        input = ((input & 0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((input & 0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) << 16);

        // swap 4-byte long pairs
        input = ((input & 0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((input & 0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) << 32);

        // swap 8-byte long pairs
        input = ((input & 0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >> 64) |
            ((input & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) << 64);

        // swap 16-byte long pairs
        return (input >> 128) | (input << 128);
    }

    function readLittleEndianSigned256(uint256 input) internal pure returns (int256) {
        input = ((input << 8) & 0xFF00FF00FF00FF00FF00FF00FF00FF00) | ((input >> 8) & 0x00FF00FF00FF00FF00FF00FF00FF00FF);
        input = ((input << 16) & 0xFFFF0000FFFF0000FFFF0000FFFF0000) | ((input >> 16) & 0x0000FFFF0000FFFF0000FFFF0000FFFF);
        input = ((input << 32) & 0xFFFFFFFF00000000FFFFFFFF00000000) | ((input >> 32) & 0x00000000FFFFFFFF00000000FFFFFFFF);
        input = ((input << 64) & 0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) | ((input >> 64) & 0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF);
        return int256((input << 128) | ((input >> 128) & 0xFFFFFFFFFFFFFFFF));
    }
}