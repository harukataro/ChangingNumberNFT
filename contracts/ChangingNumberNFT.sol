// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "operator-filter-registry/src/DefaultOperatorFilterer.sol";
import "base64-sol/base64.sol";
import "./ERC4906.sol";
import "./OperatorRole.sol";
import "hardhat/console.sol";

contract ChangingNumberNFT is ERC721, ERC4906, ERC2981, DefaultOperatorFilterer, OperatorRole {
    using Counters for Counters.Counter;
    Counters.Counter private currentTokenId;

    uint256 private MAX_SUPPLY = 1000;
    uint256 private MAX_AL_SUPPLY = 500;
    uint256 private MAX_PER_WALLET = 5;

    mapping(uint256 => uint256) private myNumber;
    mapping(address => bool) private allowedMinters;
    mapping(uint256 => bool) private lockStatus;
    uint256 private numOfAllowedMinters;
    bool private mintable;
    bool private publicMint;
    uint256 private loser;
    uint256 private winner;

    event moveRandom(uint256 winner, uint256 loser);
    event LockStatusChange(uint256 tokenId, bool status);

    constructor() ERC721("ChangingNumberNFT3", "CHNN3") {}

    function mint() public payable returns (uint256) {
        require(mintable, "Mint is not Started");
        require(publicMint || allowedMinters[msg.sender], "Sender no in AL / before public sale");
        require(currentTokenId.current() < MAX_SUPPLY, "Mint limit exceeded");
        require(balanceOf(msg.sender) < MAX_PER_WALLET, "Max per wallet reached");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(msg.sender, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    /// @dev ownerMint
    /// @param recipient address of recipient
    function ownerMintTo(address recipient) public onlyOwner returns (uint256) {
        require(currentTokenId.current() < MAX_SUPPLY, "Mint limit exceeded");
        require(balanceOf(recipient) < MAX_PER_WALLET, "Max per wallet reached");

        currentTokenId.increment();
        uint256 newItemId = currentTokenId.current();
        _safeMint(recipient, newItemId);
        myNumber[newItemId] = 1;
        return newItemId;
    }

    // ******************** Allow list control ******************** //

    /// @dev add Aloow list address onlyOwner
    /// @param _minters address array
    function addAllowedMinters(address[] memory _minters) public onlyOperator {
        require(numOfAllowedMinters + _minters.length <= MAX_AL_SUPPLY, "Allow list is full");
        for (uint256 i = 0; i < _minters.length; i++) {
            if (allowedMinters[_minters[i]] == false) {
                allowedMinters[_minters[i]] = true;
                numOfAllowedMinters += 1;
            }
        }
    }

    /// @dev remove Allow list address onlyOwner
    /// @param _minters address array
    function removeAllowedMinters(address[] memory _minters) public onlyOperator {
        for (uint256 i = 0; i < _minters.length; i++) {
            if (allowedMinters[_minters[i]]) {
                allowedMinters[_minters[i]] = false;
                numOfAllowedMinters -= 1;
            }
        }
    }

    /// @dev check Allow list address
    /// @param _minter address
    function isAllowedMinter(address _minter) public view returns (bool) {
        return allowedMinters[_minter];
    }

    // ******************** metadata control ******************** //
    // metadata control
    /// @dev change Number metadata for specific token id
    /// @param _tokenId token id
    /// @param _number number
    function changeNumber(uint256 _tokenId, uint256 _number) public onlyOperator {
        require(_exists(_tokenId), "tokenId must be exist");
        require(_number <= 10, "Number must be smaller than 10");
        require(lockStatus[_tokenId] == false, "Token is locked");
        myNumber[_tokenId] = _number;
        emit MetadataUpdate(_tokenId);
    }

    /// @dev ramdomly increase number metadata of one of token and decrease number metadata of another token
    /// this is for testing purpose as public. anyone can call this function.
    function randomMove() public onlyOperator {
        uint256 tokenNum = currentTokenId.current();
        uint256 prevWinToken = winner;
        uint256 prevLoseToken = loser;

        // random number generator
        bytes32 blockHash = blockhash(block.number - 1);
        uint256 rId1 = (uint256(blockHash) % (tokenNum - 1 + 1)) + 1;
        uint256 rId2 = (uint256(keccak256(abi.encodePacked(blockHash, rId1))) % (tokenNum - 1 + 1)) + 1;
        if (rId1 == rId2) {
            if (rId2 == tokenNum) {
                rId2 = 1;
            } else {
                rId2 = rId2 + 1;
            }
        }
        uint256 winToken = rId1;
        uint256 loseToken = rId2;

        if (myNumber[winToken] < 10) {
            myNumber[winToken] += 1;
        }
        if (myNumber[loseToken] > 0 && lockStatus[loseToken] == false) {
            myNumber[loseToken] -= 1;
        }
        winner = winToken;
        loser = loseToken;

        // if (prevWinToken != 0) {
        //     emit MetadataUpdate(prevWinToken);
        // }
        // if (prevLoseToken != prevWinToken && prevLoseToken != 0) {
        //     emit MetadataUpdate(prevLoseToken);
        // }
        // if (winToken != prevWinToken && winToken != prevLoseToken) {
        //     emit MetadataUpdate(winToken);
        // }
        // if (loseToken != prevWinToken && loseToken != prevLoseToken && loseToken != winToken) {
        //     emit MetadataUpdate(loseToken);
        // }
        emit MetadataUpdate(prevWinToken);
        emit MetadataUpdate(prevLoseToken);
        emit MetadataUpdate(winToken);
        emit MetadataUpdate(loseToken);
        emit moveRandom(winToken, loseToken);
    }

    ///@dev get number metadata of Token Id
    function getNumber(uint256 _tokenId) public view returns (uint256) {
        return myNumber[_tokenId];
    }

    /// @dev get winner Token Id
    function getWinner() public view returns (uint256) {
        return winner;
    }

    /// @dev get loser Token Id
    function getLoser() public view returns (uint256) {
        return loser;
    }

    // ******************** lock function ******************** //
    function lockNFT(uint256 _tokenId, bool _status) public {
        require(ownerOf(_tokenId) == msg.sender, "You are not the owner of this token");
        if (lockStatus[_tokenId] != _status) {
            lockStatus[_tokenId] = _status;
            emit LockStatusChange(_tokenId, _status);
        }
    }

    function getLockStatus(uint256 _tokenId) public view returns (bool) {
        return lockStatus[_tokenId];
    }

    // ******************** tokenURI ******************** //
    /// @dev get metadata for specific token id
    /// @param _tokenId token id
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        require(_exists(_tokenId), "tokenId must be exist");
        string[11] memory colorMap = ["#000000", "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5"];
        string memory color = colorMap[myNumber[_tokenId]];
        string memory numberStr = Strings.toString(myNumber[_tokenId]);
        string memory nftState = _tokenId == winner ? "WIN" : _tokenId == loser ? "LOSE" : "";
        if (lockStatus[_tokenId]) {
            nftState = "LOCKED";
        }

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect x="15" y="15" width="290" height="290" fill="',
                color,
                '" stroke-width="2" /><circle cx="160" cy="160" r="120" fill="white"/><text x="160" y="160" font-size="140" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="black">',
                numberStr,
                '</text><text x="160" y="250" font-size="50" text-anchor="middle" dominant-baseline="central" font-weight="bold" fill="blue">',
                nftState,
                "</text></svg>"
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Changing Number NFT #',
                        Strings.toString(_tokenId),
                        '","description": "Changing Number NFT amazing","attributes": [{"trait_type":"Number","value":"',
                        numberStr,
                        '", "nftStatus": "',
                        nftState,
                        '"}],"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );
        string memory output = string(abi.encodePacked("data:application/json;base64,", json));
        return output;
    }

    // ******************** Owner functions ******************** //

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

    // ******************** DefaultOperatorFilterer ******************** //
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

    // ******************** ERC2981 ******************** //
    // ERC2981
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) public onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    // ******************** ERC165 ******************** //
    /**
     * @dev IERC165-supportsInterface
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981, ERC4906) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
