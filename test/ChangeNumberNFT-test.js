/* eslint-disable no-undef */
const { expect } = require("chai");
var fs = require("fs");

describe("ChangingNumberNFT", function () {
  let BadgeToken;
  let token721;
  let _name="ChangingNumberNFT2";
  let _symbol="CHNN2";
  let a1, a2, a3,a4, a5;

  beforeEach(async function () {
    token = await ethers.getContractFactory("ChangingNumberNFT");
    [owner, a1, a2, a3, a4, a5] = await ethers.getSigners();
    token721 = await token.deploy();
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    
    it("Should has the correct name and symbol ", async function () {
      expect(await token721.name()).to.equal(_name);
      expect(await token721.symbol()).to.equal(_symbol);
    });

    it("Should mint a token by account1", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint();
      expect(await token721.ownerOf(1)).to.equal(a1.address);
      expect((await token721.balanceOf(a1.address)).toNumber()).to.equal(1);      
    });

    it("Should output tokeURI", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint();

      let tokenURI = await token721.tokenURI(1);
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      //console.log(metaData);
      metaData = JSON.parse(metaData);
      expect(metaData.name).to.equal("Changing Number NFT #1");
      expect(metaData.description).to.equal("Changing Number NFT amazing");
      expect(metaData.attributes[0].trait_type).to.equal("Number");
      expect(metaData.attributes[0].value).to.equal("1");
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/test1.svg", image);
    });

    it("Should output tokeURI", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint();
      await token721.connect(a1).addNumber(1);

      let tokenURI = await token721.tokenURI(1);
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      //console.log(metaData);
      metaData = JSON.parse(metaData);
      expect(metaData.name).to.equal("Changing Number NFT #1");
      expect(metaData.description).to.equal("Changing Number NFT amazing");
      expect(metaData.attributes[0].trait_type).to.equal("Number");
      expect(metaData.attributes[0].value).to.equal("2");
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/test2.svg", image);

      for (let i=0; i<8; i++) {
        await token721.connect(a1).addNumber(1);
        tokenURI = await token721.tokenURI(1);
        metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
        metaData = JSON.parse(metaData);
        //console.log(metaData.attributes[0].value);
        image = metaData.image.split(",")[1];
        image = Buffer.from(image, 'base64').toString('ascii');
        const filename = "tmp/test" + (i+3) + ".svg";
        fs.writeFileSync(filename, image);
      }
    });

    it("Should work random", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
      await token721.connect(a1).mint();
      await token721.connect(a2).mint();
      await token721.connect(a3).mint();
      await token721.connect(a4).mint();
      await token721.randomMove();

      let winner = await token721.connect(a1).getWinner();
      let loser = await token721.connect(a1).getLoser();
      console.log("winner:", Number(winner));
      console.log("loser:", Number(loser));

      let tokenURI = await token721.tokenURI(Number(winner));
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      metaData = JSON.parse(metaData);
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/testWin.svg", image);

      let tokenURI2 = await token721.tokenURI(Number(loser));
      let metaData2 = Buffer.from(tokenURI2.split(",")[1], 'base64').toString('ascii');
      metaData2 = JSON.parse(metaData2);
      let image2 = metaData2.image.split(",")[1];
      image2 = Buffer.from(image2, 'base64').toString('ascii');
      fs.writeFileSync("tmp/testLose.svg", image2);
    });

    //ERC165 related
    it("implements ERC721", async function () {
      const result = await token721.supportsInterface("0x80ac58cd");
      expect(result).to.be.true;
    });

    it("implements ERC4906", async function () {
        const result = await token721.supportsInterface("0x49064906");
        expect(result).to.be.true;
    });

    it("implements ERC2981", async function () {
        const result = await token721.supportsInterface("0x2a55205a");
        expect(result).to.be.true;
    });

    //ERC2981 related
    it("implements ERC2981", async function () {
    await token721.setDefaultRoyalty(owner.address, 1000)
    const result = await token721.royaltyInfo(1, 1000); 
    expect(result[0]).to.equal(owner.address);
    expect(result[1]).to.equal(100);
    });

    //ERC4906 related
    it("emits MetadataUpdate event at ", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
      await token721.connect(a1).mint();
      await token721.connect(a2).mint();
      await expect(token721.addNumber(1)).emit(token721, "MetadataUpdate").withArgs(1);
      await expect(token721.decreaseNumber(1)).emit(token721, "MetadataUpdate").withArgs(1);
      await expect(token721.randomMove()).emit(token721, "MetadataUpdate").withArgs(1||2);
    });

    //revert tests
    it("Should revert if not mint enabled. revert with Mint is not Started", async function () {
      await expect(token721.connect(a1).mint()).to.be.revertedWith("Mint is not Started");
    });

    it("Should revert if not mint enabled. revert with Sender isn't in AL or not start public sale", async function () {
      await token721.setMintable(true);
      await expect(token721.connect(a1).mint()).to.be.revertedWith("Sender isn't in AL or not start public sale");
    });

    // ** to use these test need to add address of hardhat network at hardhat.config.js
    // it("should have a MintLimit of 1000 total", async function () {
    //   await token721.setMintable(true);
    //   await token721.setPublicMint(true);
    //   // Mint 1000 tokens
    //   for (let i = 0; i < 1000; i++) {
    //     const signer = await ethers.getSigner(i);
    //     await token721.connect(signer).mint();
    //   }
    //   // Attempt to mint a 1001th token and expect a revert
    //   await expect(token721.mint()).to.be.revertedWith("Mint limit exceeded");
    // });

    it("should revert over allowList Limit of addAllowedMinter", async function () {
      await token721.setMintable(true);
      await token721.setPublicMint(true);
      //  500 address in allowList
      for (let i = 0; i < 500; i++) {
        const signer = await ethers.getSigner(i);
        await token721.connect(signer).addAllowedMinter();
      }
      // Attempt to add 501th address and expect a revert
      const signer501 = await ethers.getSigner(500);
      await expect(token721.connect(signer501).addAllowedMinter()).to.be.revertedWith("Allow list is full");
      await expect(token721.addAllowedMinters([signer501.address])).to.be.revertedWith("Allow list is full");
  });

  it("should revert over allowList Limit of addAllowedMinters", async function () {
    await token721.setMintable(true);
    await token721.setPublicMint(true);
    //  501 address in allowList
    let allowList = [];
    for (let i = 0; i < 501; i++) {
      const signer = await ethers.getSigner(i);
      allowList.push(signer.address);
    }
    // Attempt to add 501th address and expect a revert
    await expect(token721.addAllowedMinters(allowList)).to.be.revertedWith("Allow list is full");
});



    it('should stored ether in contract', async () => {
      await token721.setMintable(true);
      await token721.connect(a1).addAllowedMinter();
      await token721.connect(a1).mint({value: ethers.utils.parseEther("1", "ether")});
      const balance = await ethers.provider.getBalance(token721.address);
      expect(balance).to.equal(ethers.utils.parseEther("1", "ether"));
    });

    it('should withdraw by owner', async () => {
      await token721.setMintable(true);
      await token721.connect(a1).addAllowedMinter();
      await token721.connect(a1).mint({value: ethers.utils.parseEther("1", "ether")});
      const balance0 = await ethers.provider.getBalance(owner.address);
      await token721.withdraw();
      const balance1 = await ethers.provider.getBalance(owner.address);
      expect(balance1.sub(balance0)).to.greaterThan(ethers.utils.parseEther("0.99", "ether"));
    });
  });

  // internal function test
  // it('returns two random numbers in the specified range', async () => {    
  //   for (let i = 0; i < 100; i++) {
  //     const min = 1;
  //     const max = 10;
  //     let lowerBound = Math.floor(Math.random() * (max - min + 1)) + min;
  //     let upperBound = Math.floor(Math.random() * (max - min + 1)) + min;
  //     if(lowerBound > upperBound) {
  //       const tmp = lowerBound;
  //       lowerBound = upperBound;
  //       upperBound = tmp;
  //     }
  //     // Call the public function to get two random numbers
  //     const result = await token721.getTwoRandomNumbersPublic(lowerBound, upperBound);
  //     // Check that both values are within the specified range
  //     const value1 = result[0].toNumber();
  //     const value2 = result[1].toNumber();
  //     expect(value1).to.be.at.least(lowerBound).and.at.most(upperBound);
  //     expect(value2).to.be.at.least(lowerBound).and.at.most(upperBound);
  //     //expect(value1).to.not.equal(value2);
  //   }
  // });
  
  // remove allow list
  it("Should work remove allow list", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.removeAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await expect(token721.connect(a1).mint()).to.be.revertedWith("Sender isn't in AL or not start public sale");
    await expect(token721.connect(a2).mint()).to.be.revertedWith("Sender isn't in AL or not start public sale");
    await expect(token721.connect(a3).mint()).to.be.revertedWith("Sender isn't in AL or not start public sale");
    await expect(token721.connect(a4).mint()).to.be.revertedWith("Sender isn't in AL or not start public sale");
  
  });

  // test transfer nft
  it("Should work transfer nft", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).transferFrom(a1.address, a2.address, 1);
    await token721.connect(a2).transferFrom(a2.address, a3.address, 2);
    await token721.connect(a3).transferFrom(a3.address, a4.address, 3);
    await token721.connect(a4).transferFrom(a4.address, a1.address, 4);
  });

  // test setApprovedForAll
  it("Should work setApprovedForAll", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).setApprovalForAll(a2.address, true);
    await token721.connect(a2).setApprovalForAll(a3.address, true);
    await token721.connect(a3).setApprovalForAll(a4.address, true);
    await token721.connect(a4).setApprovalForAll(a1.address, true);
  });

  //test setApprove
  it("Should work setApprove", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).approve(a2.address, 1);
    await token721.connect(a2).approve(a3.address, 2);
    await token721.connect(a3).approve(a4.address, 3);
    await token721.connect(a4).approve(a1.address, 4);
  });

  //test safeTransferFrom
  it("Should work safeTransferFrom", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, 1);
    expect(await token721.ownerOf(1)).to.equal(a2.address);
    await token721.connect(a2)["safeTransferFrom(address,address,uint256)"](a2.address, a3.address, 2);
    expect(await token721.ownerOf(2)).to.equal(a3.address);
    await token721.connect(a3)["safeTransferFrom(address,address,uint256)"](a3.address, a4.address, 3);
    expect(await token721.ownerOf(3)).to.equal(a4.address);
    await token721.connect(a4)["safeTransferFrom(address,address,uint256)"](a4.address, a1.address, 4);
    expect(await token721.ownerOf(4)).to.equal(a1.address);
  });

  //test safeTransferFrom with data
  it("Should work safeTransferFrom with data", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1)["safeTransferFrom(address,address,uint256,bytes)"](a1.address, a2.address, 1, "0x");
    expect(await token721.ownerOf(1)).to.equal(a2.address);
    await token721.connect(a2)["safeTransferFrom(address,address,uint256,bytes)"](a2.address, a3.address, 2, "0x");
    expect(await token721.ownerOf(2)).to.equal(a3.address);
    await token721.connect(a3)["safeTransferFrom(address,address,uint256,bytes)"](a3.address, a4.address, 3, "0x");
    expect(await token721.ownerOf(3)).to.equal(a4.address);
    await token721.connect(a4)["safeTransferFrom(address,address,uint256,bytes)"](a4.address, a1.address, 4, "0x");
    expect(await token721.ownerOf(4)).to.equal(a1.address);
  });

  // test getMintable setMintable
  it("Should work getMintable setMintable", async function () {
    await token721.setMintable(true);
    expect(await token721.getMintable()).to.equal(true);
    await token721.setMintable(false);
    expect(await token721.getMintable()).to.equal(false);
  });

  //test getPublicMInt setPublicMint
  it("Should work getPublicMInt setPublicMint", async function () {
    await token721.setPublicMint(true);
    expect(await token721.getPublicMint()).to.equal(true);
    await token721.setPublicMint(false);
    expect(await token721.getPublicMint()).to.equal(false);
  });

  // get Max per Wallet
  it("Should work getMaxPerWallet setMaxPerWallet", async function () {
    await token721.setMaxPerWallet(10);
    expect(await token721.getMaxPerWallet()).to.equal(10);
  } );

  // test onERC721Received
  it("Should work onERC721Received", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.connect(a1).setApprovalForAll(a2.address, true);
    await token721.connect(a2).setApprovalForAll(a3.address, true);
    await token721.connect(a3).setApprovalForAll(a4.address, true);
    await token721.connect(a4).setApprovalForAll(a1.address, true);
    await token721.connect(a1)["safeTransferFrom(address,address,uint256)"](a1.address, a2.address, 1);
    await token721.connect(a2)["safeTransferFrom(address,address,uint256)"](a2.address, a3.address, 2);
    await token721.connect(a3)["safeTransferFrom(address,address,uint256)"](a3.address, a4.address, 3);
    await token721.connect(a4)["safeTransferFrom(address,address,uint256)"](a4.address, a1.address, 4);
  });

  // Max per wallet reached
  it("Should work Max per wallet reached", async function () {
    await token721.setMaxPerWallet(1);
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await expect(token721.connect(a1).mint()).to.be.revertedWith("Max per wallet reached");
  } );

  // test Minter is already added
  it("Should work Minter is already added", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await expect(token721.connect(a1).addAllowedMinter()).to.be.revertedWith("Minter is already added");
  } );

  // test addAllowedMinters Mint is not started
  it("Should work addAllowedMinters Mint is not started", async function () {
    await expect(token721.connect(a1).mint()).to.be.revertedWith("Mint is not Started");
  });

  // test addAllowedMinters by not owner
  it("Should work addAllowedMinters by not owner", async function () {
    await token721.setMintable(true);
    await expect(token721.connect(a1).addAllowedMinters([a1.address, a2.address, a3.address, a4.address])).to.be.revertedWith("Ownable: caller is not the owner");
  });

  // test removeAllowedMinters by not owner
  it("Should work removeAllowedMinters by not owner", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await expect(token721.connect(a1).removeAllowedMinters([a1.address])).to.be.revertedWith("Ownable: caller is not the owner");
  } );

  // addNumber revet test tokenId must be exist and  Number is already 10
  it("Should work addNumber revet test", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address]);
    await token721.connect(a1).mint();
    await expect(token721.connect(a1).addNumber(2)).to.be.revertedWith("tokenId must be exist");
    for(let i = 0; i < 9; i++) {
      await token721.connect(a1).addNumber(1);
    }
    await expect(token721.connect(a1).addNumber(1)).to.be.revertedWith("Number is already 10");
  });

  // decreaseNumber revet test tokenId must be exist and  Number is already 0
  it("Should work decreaseNumber revet test", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address]);
    await token721.connect(a1).mint();
    await expect(token721.connect(a1).decreaseNumber(2)).to.be.revertedWith("tokenId must be exist");
    await token721.connect(a1).decreaseNumber(1);
    await expect(token721.connect(a1).decreaseNumber(1)).to.be.revertedWith("Number is already 0");
  });

  // test randomMove not over 10
  it("Should work randomMove not over 10", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    for(let i = 0; i < 9; i++) {
      await token721.connect(a1).addNumber(1);
      await token721.connect(a1).addNumber(2);
    }
    await token721.connect(a1).randomMove();
    let number1 = await token721.connect(a1).getNumber(1);
    let number2 = await token721.connect(a1).getNumber(2);
    let winner = await token721.connect(a1).getWinner();

    if(winner == 1) {
      expect(number1).to.be.equal(10);
    } else {
      expect(number2).to.be.equal(10);
    }
  });
  // test randomMove not less than 0
  it("Should work randomMove not less than 0", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a1).decreaseNumber(1);
    await token721.connect(a1).decreaseNumber(2);
    await token721.connect(a1).randomMove();
    let number1 = await token721.connect(a1).getNumber(1);
    let number2 = await token721.connect(a1).getNumber(2);
    let loser = await token721.connect(a1).getLoser();
    console.log("loser:", loser);
    if(loser == 1) {
      expect(number1).to.be.equal(0);
    } else {
      expect(number2).to.be.equal(0);
    }
  });

  //token URI require existing token
  it("Should not work tokeURI not existing token", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address]);
    await expect(token721.connect(a1).tokenURI(2)).to.be.revertedWith("tokenId must be exist");
  });

  //withdraw by not owner
  it("Should not work withdraw by not owner", async function () {
    await expect(token721.connect(a1).withdraw()).to.be.revertedWith("Ownable: caller is not the owner");
  });
  // setMintable by not owner
  it("Should not work setMintable by not owner", async function () {
    await expect(token721.connect(a1).setMintable(true)).to.be.revertedWith("Ownable: caller is not the owner");
  });
  // setPublicMint by not owner
  it("Should not work setPublicMint by not owner", async function () {
    await expect(token721.connect(a1).setPublicMint(true)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  // setMaxPerWallet by not owner
  it("Should not work setMaxPerWallet by not owner", async function () {
    await expect(token721.connect(a1).setMaxPerWallet(10)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  // setDefaultRoyalty by not owner
  it("Should not work setDefaultRoyalty by not owner", async function () {
    await expect(token721.connect(a1).setDefaultRoyalty(a1.address, 10)).to.be.revertedWith("Ownable: caller is not the owner");
  });
});