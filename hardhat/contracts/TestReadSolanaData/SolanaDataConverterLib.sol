// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

library SolanaDataConverterLib {
    function toAddress(bytes memory _bytes) internal pure returns (address) {
        require(_bytes.length >= 20, "toAddress_outOfBounds");
        address tempAddress;

        assembly {
            tempAddress := div(mload(add(_bytes, 0x20)), 0x1000000000000000000000000)
        }

        return tempAddress;
    }

    function toBytes32(bytes memory _bytes) internal pure returns (bytes32) {
        require(_bytes.length >= 32, "toBytes32_outOfBounds");
        bytes32 tempBytes32;

        assembly {
            tempBytes32 := mload(add(_bytes, 0x20))
        }

        return tempBytes32;
    }

    function toUint8(bytes memory _bytes) internal pure returns (uint8) {
        require(_bytes.length >= 1 , "toUint8_outOfBounds");
        uint8 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x1))
        }

        return tempUint;
    }

    function toUint16(bytes memory _bytes) internal pure returns (uint16) {
        require(_bytes.length >= 2, "toUint16_outOfBounds");
        uint16 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x2))
        }

        return tempUint;
    }

    function toUint32(bytes memory _bytes) internal pure returns (uint32) {
        require(_bytes.length >= 4, "toUint32_outOfBounds");
        uint32 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x4))
        }

        return tempUint;
    }

    function toUint64(bytes memory _bytes) internal pure returns (uint64) {
        require(_bytes.length >= 8, "toUint64_outOfBounds");
        uint64 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x8))
        }

        return tempUint;
    }

    function toUint96(bytes memory _bytes) internal pure returns (uint96) {
        require(_bytes.length >= 12, "toUint96_outOfBounds");
        uint96 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0xc))
        }

        return tempUint;
    }

    function toUint128(bytes memory _bytes) internal pure returns (uint128) {
        require(_bytes.length >= 16, "toUint128_outOfBounds");
        uint128 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x10))
        }

        return tempUint;
    }

    function toUint256(bytes memory _bytes) internal pure returns (uint256) {
        require(_bytes.length >= 32, "toUint256_outOfBounds");
        uint256 tempUint;

        assembly {
            tempUint := mload(add(_bytes, 0x20))
        }

        return tempUint;
    }

    function readLittleEndianUnsigned16(uint16 input) internal pure returns (uint16) {
        // swap bytes
        return (input >> 8) | (input << 8);
    }

    function readLittleEndianUnsigned32(uint32 input) internal pure returns (uint32) {
        // swap bytes
        input = ((input & 0xFF00FF00) >> 8) |
            ((input & 0x00FF00FF) << 8);

        // swap 2-byte long pairs
        return (input >> 16) | (input << 16);
    }

    function readLittleEndianUnsigned64(uint64 input) internal pure returns (uint64) {
        // swap bytes
        input = ((input & 0xFF00FF00FF00FF00) >> 8) | ((input & 0x00FF00FF00FF00FF) << 8);

        // swap 2-byte long pairs
        input = ((input & 0xFFFF0000FFFF0000) >> 16) | ((input & 0x0000FFFF0000FFFF) << 16);

        // swap 4-byte long pairs
        return(input >> 32) | (input << 32);
    }

    function readLittleEndianUnsigned128(uint128 input) internal pure returns (uint128) {
        // swap bytes
        input = ((input & 0xFF00FF00FF00FF00FF00FF00FF00FF00) >> 8) |
            ((input & 0x00FF00FF00FF00FF00FF00FF00FF00FF) << 8);

        // swap 2-byte long pairs
        input = ((input & 0xFFFF0000FFFF0000FFFF0000FFFF0000) >> 16) |
            ((input & 0x0000FFFF0000FFFF0000FFFF0000FFFF) << 16);

        // swap 4-byte long pairs
        input = ((input & 0xFFFFFFFF00000000FFFFFFFF00000000) >> 32) |
            ((input & 0x00000000FFFFFFFF00000000FFFFFFFF) << 32);

        // swap 8-byte long pairs
        return (input >> 64) | (input << 64);
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
}