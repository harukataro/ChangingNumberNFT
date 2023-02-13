// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/common/ERC2981.sol";
import "../node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "../node_modules/operator-filter-registry/src/DefaultOperatorFilterer.sol";
import "../node_modules/base64-sol/base64.sol";
import "../node_modules/hardhat/console.sol";

/// @title EIP-721 Metadata Update Extension
interface IERC4906 {
    /// @dev This event emits when the metadata of a token is changed.
    /// So that the third-party platforms such as NFT market could
    /// timely update the images and related attributes of the NFT.
    event MetadataUpdate(uint256 _tokenId);

    /// @dev This event emits when the metadata of a range of tokens is changed.
    /// So that the third-party platforms such as NFT market could
    /// timely update the images and related attributes of the NFTs.
    event BatchMetadataUpdate(uint256 _fromTokenId, uint256 _toTokenId);
}

//utility
contract ChangingNumberNFT is DefaultOperatorFilterer, ERC721, IERC4906, ERC2981, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    uint256 MAX_SUPPLY = 1000;
    uint256 MAX_PER_WALLET = 5;

    mapping(uint256 => uint256) private myNumber;
    mapping(address => bool) private allowedMinters;
    bool private mintable = false;
    bool private publicMint = false;

    uint256 loser = 0;
    uint256 winner = 0;

    event moveRandom(uint256 winner, uint256 loser);

    function GetTwoRandomNumbers(uint256 lowerBound, uint256 upperBound) public view returns (uint256, uint256) {
        uint256 randSeed = uint256(keccak256(abi.encodePacked(block.timestamp, block.gaslimit)));
        uint256 rIdx1 = 1;
        uint256 rIdx2 = 2;
        uint256 rNum1 = (uint256(keccak256(abi.encodePacked(randSeed, rIdx1))) % (upperBound - lowerBound + 1)) + lowerBound;
        uint256 rNum2 = (uint256(keccak256(abi.encodePacked(randSeed, rIdx2))) % (upperBound - lowerBound + 1)) + lowerBound;
        return (rNum1, rNum2);
    }

    constructor() ERC721("ChangingNumberNFT", "CHNN") {}

    function mintTo(address recipient) public payable returns (uint256) {
        require(mintable, "Mint is not Started");
        require(publicMint || isMinter(msg.sender), "Sender is not in AL or not public mintState");
        require(currentTokenId.current() < MAX_SUPPLY, "Max supply reached");
        require(balanceOf(recipient) < MAX_PER_WALLET, "Max per wallet reached");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(recipient, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    // allow list operation

    //special for testing
    function addMinter(address _minter) public {
        require(msg.sender == _minter, "Only wallet owner can add minter");
        require(!isMinter(_minter), "Minter is already added");
        require(mintable, "Mint is not started");
        allowedMinters[_minter] = true;
    }

    function addMinters(address[] memory _minters) public onlyOwner {
        for (uint256 i = 0; i < _minters.length; i++) {
            allowedMinters[_minters[i]] = true;
        }
    }

    function removeMinters(address[] memory _minters) public onlyOwner {
        for (uint256 i = 0; i < _minters.length; i++) {
            allowedMinters[_minters[i]] = false;
        }
    }

    function isMinter(address _minter) public view returns (bool) {
        return allowedMinters[_minter];
    }

    // metadata control
    function addNumber(uint256 tokenId) public {
        require(myNumber[tokenId] < 10, "Number is already 10");
        myNumber[tokenId] += 1;
        emit MetadataUpdate(tokenId);
    }

    function decreaseNumber(uint256 tokenId) public {
        require(myNumber[tokenId] > 0, "Number is already 0");
        myNumber[tokenId] -= 1;
        emit MetadataUpdate(tokenId);
    }

    function randomMove() public {
        uint256 tokenNum = currentTokenId.current();
        uint256 winToken;
        uint256 loseToken;

        (winToken, loseToken) = GetTwoRandomNumbers(1, tokenNum);
        // console.log("winner:", winToken);
        // console.log("Loser:", loseToken);

        if (myNumber[winToken] < 10) {
            myNumber[winToken] += 1;
        }
        if (myNumber[loseToken] > 0) {
            myNumber[loseToken] -= 1;
        }
        winner = winToken;
        loser = loseToken;
        emit MetadataUpdate(winToken);
        emit MetadataUpdate(loseToken);
        emit moveRandom(winToken, loseToken);
    }

    function getWinner() public view returns (uint256) {
        return winner;
    }

    function getLoser() public view returns (uint256) {
        return loser;
    }

    //DefaultOperatorFilterer
    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId) public override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(1 <= _tokenId && _tokenId <= currentTokenId.current(), "tokenId must be exist");
        string[11] memory colorMap = ["#000000", "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5"];
        string[3] memory p;
        p[0] = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 320 320">',
                '<rect x="10" y="10" width="300" height="300" fill="none" stroke="#fff" stroke-width="2" />'
                '<rect x="15" y="15" width="290" height="290" fill="',
                colorMap[myNumber[_tokenId]],
                '" stroke="',
                colorMap[myNumber[_tokenId]],
                '" stroke-width="2" />',
                '<circle cx="160" cy="160" r="120" stroke="white" fill="white"/>'
            )
        );
        p[1] = string(
            abi.encodePacked(
                '<text x="160" y="160" font-size="140" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="',
                colorMap[myNumber[_tokenId]],
                '">',
                Strings.toString(myNumber[_tokenId]),
                "</text>"
            )
        );
        console.log("before p[2]");
        p[2] = "";
        if (_tokenId == winner) {
            p[2] = string('<text x="160" y="250" font-size="50" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="blue">WIN</text>');
        } else if (_tokenId == loser) {
            p[2] = string('<text x="160" y="250" font-size="50" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="blue">LOSE</text>');
        }
        console.log("after p[2]");
        string memory svg = string(abi.encodePacked(p[0], p[1], p[2], "</svg>"));
        string memory meta = string(
            abi.encodePacked(
                '{"name": "Changing Number NFT #',
                Strings.toString(_tokenId),
                '","description": "Changing Number NFT amazing",',
                '"attributes": [{"trait_type":"Number","value":"',
                Strings.toString(myNumber[_tokenId]),
                '"}],',
                '"image": "data:image/svg+xml;base64,'
            )
        );
        string memory json = Base64.encode(bytes(string(abi.encodePacked(meta, Base64.encode(bytes(svg)), '"}'))));
        string memory output = string(abi.encodePacked("data:application/json;base64,", json));
        return output;
    }

    // administrator
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function getMintable() public view returns (bool) {
        return mintable;
    }

    function getPublicMint() public view returns (bool) {
        return publicMint;
    }

    function setMintable(bool _status) public onlyOwner {
        mintable = _status;
    }

    function setPublicMint(bool _status) public onlyOwner {
        publicMint = _status;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
