// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IChangingNumberNFT {
    function ownerOf(uint256 _tokenId) external view returns (address);

    function getNumber(uint256 _tokenId) external view returns (uint256);
}
