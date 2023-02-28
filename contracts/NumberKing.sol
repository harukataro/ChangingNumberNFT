// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "base64-sol/base64.sol";
import "./ERC4906.sol";
import "./IChangingNumber.sol";
import "./OperatorRole.sol";
import "hardhat/console.sol";

contract NumberKing is ERC721, ERC721Enumerable, ERC721Burnable, OperatorRole, ERC4906 {
    string[8] imageURI;
    mapping(address => bool) isHolder;
    mapping(uint256 => uint256) rank;
    address[] private operators;
    address changingNumberAddress; // contract address for ChangingNumber as reference

    constructor() ERC721("NumberKing", "NK") {
        changingNumberAddress = 0xbCD589571C4D3eB22775D65bB30c52e6E2eF462F;
        imageURI[0] = "https://nftnews.jp/wp-content/uploads/2023/02/King_0.png";
        imageURI[1] = "https://nftnews.jp/wp-content/uploads/2023/02/King_1.png";
        imageURI[2] = "https://nftnews.jp/wp-content/uploads/2023/02/King_2.png";
        imageURI[3] = "https://nftnews.jp/wp-content/uploads/2023/02/King_3.png";
        imageURI[4] = "https://nftnews.jp/wp-content/uploads/2023/02/King_4.png";
        imageURI[5] = "https://nftnews.jp/wp-content/uploads/2023/02/King_5.png";
        imageURI[6] = "https://nftnews.jp/wp-content/uploads/2023/02/King_6.png";
        imageURI[7] = "https://nftnews.jp/wp-content/uploads/2023/02/King_7.png";
    }

    function safeMint(uint256 tokenId) public {
        address to = msg.sender;
        require(isHolder[to] == false, "You already have a NumberKing");
        require(isKing(to, tokenId), "You don't have a ChangingNumber with number 10");
        isHolder[to] = true;
        _safeMint(to, tokenId);

        // reset ChangingNumber to 1
        IChangingNumber changingNuberContract = IChangingNumber(changingNumberAddress);
        changingNuberContract.changeNumber(tokenId, 1);
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "tokenId must be exist");
        uint256 myRank = rank[_tokenId];
        string memory meta = string(
            abi.encodePacked(
                '{"name": "Number King #',
                Strings.toString(_tokenId),
                '","description": "Number King is a NFT that can be minted by a user who has a ChangingNumber with number 10.",',
                '"attributes": [{"trait_type":"Rank","value":"',
                Strings.toString(myRank),
                '"}],',
                '"image":"',
                imageURI[myRank],
                '"}'
            )
        );
        string memory json = Base64.encode(bytes(string(abi.encodePacked(meta))));
        string memory output = string(abi.encodePacked("data:application/json;base64,", json));
        return output;
    }

    function isKing(address to, uint256 _tokenId) internal view returns (bool) {
        IChangingNumber changingNuberContract = IChangingNumber(changingNumberAddress);

        if (changingNuberContract.ownerOf(_tokenId) != to || changingNuberContract.getNumber(_tokenId) != 10) {
            return false;
        }
        return true;
    }

    function updateImageURI(string[8] memory _imageURI) public onlyOperator {
        imageURI = _imageURI;
    }

    function getChangingNumberContractAddress() public view onlyOperator returns (address) {
        return changingNumberAddress;
    }

    function setChangingNumberContractAddress(address _address) public onlyOperator {
        changingNumberAddress = _address;
    }

    function getRank(uint256 _tokenId) public view returns (uint256) {
        require(_exists(_tokenId), "tokenId must be exist");
        return rank[_tokenId];
    }

    function setRank(uint256 _tokenId, uint256 _rank) public onlyOperator {
        require(_exists(_tokenId), "tokenId must be exist for setRank");
        require(0 <= _rank && _rank <= 7, "rank must be 0 to 7");
        rank[_tokenId] = _rank;
        emit MetadataUpdate(_tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        require(from == address(0) || to == address(0), "This a SBT. It cannot be transferred. It can only be burned by the token owner.");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC4906) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
