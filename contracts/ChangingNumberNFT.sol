// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@openzeppelin/contracts/token/common/ERC2981.sol";
import "../node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "../node_modules/operator-filter-registry/src/DefaultOperatorFilterer.sol";
import "../node_modules/base64-sol/base64.sol";
import "../node_modules/hardhat/console.sol";
import "./ERC4906.sol";

contract ChangingNumberNFT is DefaultOperatorFilterer, ERC721, ERC4906, ERC2981, IERC721Receiver, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    uint256 MAX_SUPPLY = 1000;
    uint256 max_per_wallet = 5;

    mapping(uint256 => uint256) private myNumber;
    mapping(address => bool) private allowedMinters;
    bool private mintable;
    bool private publicMint;
    uint256 loser;
    uint256 winner;

    event moveRandom(uint256 winner, uint256 loser);

    //utility function

    /// @dev get two random number
    /// @param lowerBound lower bound of random number
    function GetTwoRandomNumbers(uint256 lowerBound, uint256 upperBound) private view returns (uint256, uint256) {
        bytes32 blockHash = blockhash(block.number - 1);
        uint256 rIdx1 = (uint256(blockHash) % (upperBound - lowerBound + 1)) + lowerBound;
        uint256 rIdx2 = (uint256(keccak256(abi.encodePacked(blockHash, rIdx1))) % (upperBound - lowerBound + 1)) + lowerBound;

        if (rIdx1 == rIdx2) {
            if (rIdx2 == upperBound) {
                rIdx2 = lowerBound;
            } else {
                rIdx2 = rIdx2 + 1;
            }
        }
        return (rIdx1, rIdx2);
    }

    constructor() ERC721("ChangingNumberNFT", "CHNN") {}

    function mintTo(address recipient) public payable returns (uint256) {
        require(mintable, "Mint is not Started");
        require(publicMint || isMinter(msg.sender), "Sender isn't in AL or not start public sale");
        require(currentTokenId.current() < MAX_SUPPLY, "Mint limit exceeded");
        require(balanceOf(recipient) < max_per_wallet, "Max per wallet reached");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(recipient, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    // allow list operation

    /// @dev self allow list operation for experimental
    function addMinter() public {
        require(mintable, "Mint is not started");
        require(!isMinter(msg.sender), "Minter is already added");
        allowedMinters[msg.sender] = true;
    }

    /// @dev add Aloow list address only owner
    /// @param _minters address array
    function addMinters(address[] memory _minters) public onlyOwner {
        for (uint256 i = 0; i < _minters.length; i++) {
            allowedMinters[_minters[i]] = true;
        }
    }

    /// @dev remove Allow list address only owner
    /// @param _minters address array
    function removeMinters(address[] memory _minters) public onlyOwner {
        for (uint256 i = 0; i < _minters.length; i++) {
            allowedMinters[_minters[i]] = false;
        }
    }

    /// @dev check Allow list address
    /// @param _minter address
    function isMinter(address _minter) public view returns (bool) {
        return allowedMinters[_minter];
    }

    // metadata control

    /// @dev add Number metadata for specific token id
    /// @param _tokenId token id
    function addNumber(uint256 _tokenId) public {
        require(_exists(_tokenId), "tokenId must be exist");
        require(myNumber[_tokenId] < 10, "Number is already 10");
        myNumber[_tokenId] += 1;
        emit MetadataUpdate(_tokenId);
    }

    /// @dev decrease Number metadata for specific token id
    /// @param _tokenId token id
    function decreaseNumber(uint256 _tokenId) public {
        require(_exists(_tokenId), "tokenId must be exist");
        require(myNumber[_tokenId] > 0, "Number is already 0");
        myNumber[_tokenId] -= 1;
        emit MetadataUpdate(_tokenId);
    }

    /// @dev ramdomly increase number metadata of one of token and decrease number metadata of another token
    /// this is for testing purpose as public. anyone can call this function.
    function randomMove() public {
        uint256 tokenNum = currentTokenId.current();
        uint256 winToken;
        uint256 loseToken;

        (winToken, loseToken) = GetTwoRandomNumbers(1, tokenNum);

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

    ///@dev get number metadata of Token Id
    function getNumber(uint256 _tokenId) public view returns (uint256) {
        return myNumber[_tokenId];
    }

    /// @dev get increase number metadata of Token Id
    function getWinner() public view returns (uint256) {
        return winner;
    }

    /// @dev get decrease number metadata of Token Id
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

    /// @dev get metadata for specific token id
    /// @param _tokenId token id
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "tokenId must be exist");
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
        p[2] = "";
        if (_tokenId == winner) {
            p[2] = string('<text x="160" y="250" font-size="50" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="blue">WIN</text>');
        } else if (_tokenId == loser) {
            p[2] = string('<text x="160" y="250" font-size="50" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="blue">LOSE</text>');
        }
        string memory svg = string(abi.encodePacked(p[0], p[1], p[2], "</svg>"));

        string memory randomState;
        if (_tokenId == winner) {
            randomState = "WIN";
        } else if (_tokenId == loser) {
            randomState = "LOSE";
        } else {
            randomState = "NOTING";
        }

        string memory meta = string(
            abi.encodePacked(
                '{"name": "Changing Number NFT #',
                Strings.toString(_tokenId),
                '","description": "Changing Number NFT amazing",',
                '"attributes": [{"trait_type":"Number","value":"',
                Strings.toString(myNumber[_tokenId]),
                '", "rundomState": "',
                randomState,
                '"}],',
                '"image": "data:image/svg+xml;base64,'
            )
        );
        string memory json = Base64.encode(bytes(string(abi.encodePacked(meta, Base64.encode(bytes(svg)), '"}'))));
        string memory output = string(abi.encodePacked("data:application/json;base64,", json));
        return output;
    }

    // administrator

    /// @dev withdraw all balance to owner
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    /// @dev get mintable state
    function getMintable() public view returns (bool) {
        return mintable;
    }

    /// @dev set mintable state
    function setMintable(bool _status) public onlyOwner {
        mintable = _status;
    }

    /// @dev get public mint state
    function getPublicMint() public view returns (bool) {
        return publicMint;
    }

    /// @dev set public mint state
    function setPublicMint(bool _status) public onlyOwner {
        publicMint = _status;
    }

    /// @dev get max_per_wallet
    function getMaxPerWallet() public view returns (uint256) {
        return max_per_wallet;
    }

    /// @dev set max_per_wallet
    function setMaxPerWallet(uint256 _max) public onlyOwner {
        max_per_wallet = _max;
    }

    // ERC2981
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev IERC165-supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981, ERC4906) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // fot test only. delete before deploy
    function getTwoRandomNumbersPublic(uint256 lowerBound, uint256 upperBound) public view returns (uint256, uint256) {
        return GetTwoRandomNumbers(lowerBound, upperBound);
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {}
}
