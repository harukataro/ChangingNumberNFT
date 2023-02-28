// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IChangingNumber {
    function ownerOf(uint256 _tokenId) external view returns (address);

    function getNumber(uint256 _tokenId) external view returns (uint256);

    function changeNumber(uint256 _tokenId, uint256 _newNumber) external;
}
