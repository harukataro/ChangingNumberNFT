/* eslint-disable no-undef */
const { expect } = require("chai");
var fs = require("fs");

describe("ChangingNumber", function () {
  let BadgeToken;
  let token721;
  let _name="ChangingNumber4";
  let _symbol="CN4";
  let a1, a2, a3,a4, a5;
  let zabutonImage;

  beforeEach(async function () {
    //ZabutonImage
    const ZabutonImage = await ethers.getContractFactory("ZabutonImage");
    zabutonImage = await ZabutonImage.deploy();

    token = await ethers.getContractFactory("ChangingNumber");
    [owner, a1, a2, a3, a4, a5] = await ethers.getSigners();
    token721 = await token.deploy();
    //ChangingNumberにZabutonImageのアドレスを登録
    await token721.setZabutonImageContractAddress(zabutonImage.address);
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    
    it("Should has the correct name and symbol ", async function () {
      expect(await token721.name()).to.equal(_name);
      expect(await token721.symbol()).to.equal(_symbol);
    });

    // *********************************** //
    // ********** Minting tests ********** //
    // *********************************** //
    it("Should mint a token by account1", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint();
      expect(await token721.ownerOf(1)).to.equal(a1.address);
      expect((await token721.balanceOf(a1.address)).toNumber()).to.equal(1);      
    });

    it("Should ownerMintTo work", async function () {
      await token721.ownerMintTo(a1.address);
      expect(await token721.ownerOf(1)).to.equal(a1.address);
    });

    it("Should revert if ownerMintTo executed by non owner", async function () {
      await expect(token721.connect(a1).ownerMintTo(a1.address)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should revert if not mint enabled. revert with Mint is not Started", async function () {
      await expect(token721.connect(a1).mint()).to.be.revertedWith("Mint is not Started");
    });

    it("Should revert if not mint enabled. revert with Sender isn't in AL or not start public sale", async function () {
      await token721.setMintable(true);
      await expect(token721.connect(a1).mint()).to.be.revertedWith("Sender no in AL / before public sale");
    });

    //** to use these test need to add address of hardhat network at hardhat.config.js
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
    //   await expect(token721.ownerMintTo(a1.address)).to.be.revertedWith("Mint limit exceeded");
    // });


    it("Should output tokenURI", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint();

      let tokenURI = await token721.tokenURI(1);
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      //console.log(metaData);
      metaData = JSON.parse(metaData);
      expect(metaData.name).to.equal("Changing Number #1");
      expect(metaData.description).to.equal("Changing Number is amazing");
      expect(metaData.attributes[0].trait_type).to.equal("Number");
      expect(metaData.attributes[0].value).to.equal("1");
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/test1.svg", image);
    });

    it("Should output tokenURI2", async function () {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint();
      await token721.changeNumber(1,2);
      
      let tokenURI = await token721.tokenURI(1);
      let metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
      //console.log(metaData);
      metaData = JSON.parse(metaData);
      expect(metaData.name).to.equal("Changing Number #1");
      expect(metaData.description).to.equal("Changing Number is amazing");
      expect(metaData.attributes[0].trait_type).to.equal("Number");
      expect(metaData.attributes[0].value).to.equal("2");
      let image = metaData.image.split(",")[1];
      image = Buffer.from(image, 'base64').toString('ascii');
      //console.log("image:", image);
      fs.writeFileSync("tmp/test2.svg", image);

      for (let i=0; i<8; i++) {
        await token721.changeNumber(1, i + 3);
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

    // ********************************************* //
    // ********** add remove random tests ********** //
    // ********************************************* //

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
      //console.log("winner:", Number(winner));
      //console.log("loser:", Number(loser));

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
      await expect(token721.changeNumber(1,2)).emit(token721, "MetadataUpdate").withArgs(1);
      await expect(token721.randomMove()).emit(token721, "MetadataUpdate").withArgs(1||2);
    });

    it('should stored ether in contract', async () => {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint({value: ethers.utils.parseEther("1", "ether")});
      const balance = await ethers.provider.getBalance(token721.address);
      expect(balance).to.equal(ethers.utils.parseEther("1", "ether"));
    });

    it('should withdraw by owner', async () => {
      await token721.setMintable(true);
      await token721.addAllowedMinters([a1.address]);
      await token721.connect(a1).mint({value: ethers.utils.parseEther("1", "ether")});
      const balance0 = await ethers.provider.getBalance(owner.address);
      await token721.withdraw();
      const balance1 = await ethers.provider.getBalance(owner.address);
      expect(balance1.sub(balance0)).to.greaterThan(ethers.utils.parseEther("0.99", "ether"));
    });
  });
  
  // remove allow list
  it("Should work remove allow list", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();
    await token721.connect(a3).mint();
    await token721.connect(a4).mint();
    await token721.removeAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await expect(token721.connect(a1).mint()).to.be.revertedWith("Sender no in AL / before public sale");
    await expect(token721.connect(a2).mint()).to.be.revertedWith("Sender no in AL / before public sale");
    await expect(token721.connect(a3).mint()).to.be.revertedWith("Sender no in AL / before public sale");
    await expect(token721.connect(a4).mint()).to.be.revertedWith("Sender no in AL / before public sale");
  
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
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    for(let i = 0; i < 5; i++){
      await token721.connect(a1).mint();
    }
    await expect(token721.connect(a1).mint()).to.be.revertedWith("Max per wallet reached");
  } );

  // ********** AllowList operation ********** //


  it("Should addAllowedMinters will not add if it is already exit", async function () {
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
  });

  // addAllowedMinters by not owner
  it("Should work addAllowedMinters by not owner", async function () {
    await token721.setMintable(true);
    await expect(token721.connect(a1).addAllowedMinters([a1.address, a2.address, a3.address, a4.address])).to.be.revertedWith("Err: caller does not have the Operator role");
  });

  it("Should not removeAllowedMinters turn false if it already out of list internally", async function () {
    expect(await token721.isAllowedMinter(a1.address)).to.equal(false);
    token721.removeAllowedMinters([a1.address]);
    expect(await token721.isAllowedMinter(a1.address)).to.equal(false);
  });

  it("Should revert removeAllowedMinters called by non owner", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address, a3.address, a4.address]);
    await expect(token721.connect(a1).removeAllowedMinters([a1.address])).to.be.revertedWith("Err: caller does not have the Operator role");
  } );

  //   it("should revert over allowList Limit of addAllowedMinter", async function () {
  //     await token721.setMintable(true);
  //     await token721.setPublicMint(true);
  //     //  500 address in allowList
  //     for (let i = 0; i < 500; i++) {
  //       const signer = await ethers.getSigner(i);
  //       await token721.connect(signer).addAllowedMinter();
  //     }
  //     // Attempt to add 501th address and expect a revert
  //     const signer501 = await ethers.getSigner(500);
  //     await expect(token721.connect(signer501).addAllowedMinter()).to.be.revertedWith("Allow list is full");
  //     await expect(token721.addAllowedMinters([signer501.address])).to.be.revertedWith("Allow list is full");
  // });

  // it("should revert over allowList Limit of addAllowedMinters", async function () {
  //   await token721.setMintable(true);
  //   await token721.setPublicMint(true);
  //   //  501 address in allowList
  //   let allowList = [];
  //   for (let i = 0; i < 501; i++) {
  //     const signer = await ethers.getSigner(i);
  //     allowList.push(signer.address);
  //   }
  //   // Attempt to add 501th address and expect a revert
  //   await expect(token721.addAllowedMinters(allowList)).to.be.revertedWith("Allow list is full");
  // });


  // changeNumber revet test tokenId must be exist and  Number must be smaller than 10
  it("Should work changeNumber revet test", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address]);
    await token721.connect(a1).mint();
    await expect(token721.changeNumber(2,1)).to.be.revertedWith("tokenId must be exist");
    await expect(token721.changeNumber(1,11)).to.be.revertedWith("Number must be smaller than 10");
  });

  // test randomMove not over 10
  it("Should work randomMove not over 10", async function () {
    await token721.setMintable(true);
    await token721.addAllowedMinters([a1.address, a2.address]);
    await token721.connect(a1).mint();
    await token721.connect(a2).mint();

    await token721.changeNumber(1, 10);
    await token721.changeNumber(2, 10);

    await token721.randomMove();
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
    await token721.changeNumber(1, 0);
    await token721.changeNumber(2, 0);
    await token721.randomMove();
    let number1 = await token721.connect(a1).getNumber(1);
    let number2 = await token721.connect(a1).getNumber(2);
    let loser = await token721.connect(a1).getLoser();
    //console.log("loser:", loser);
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

  // setDefaultRoyalty by not owner
  it("Should not work setDefaultRoyalty by not owner", async function () {
    await expect(token721.connect(a1).setDefaultRoyalty(a1.address, 10)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  // Lock function by holder
  it("Should work Lock Unlock by holder", async function () {
    await token721.ownerMintTo(a1.address);
    await token721.connect(a1).lockNFT(1, true);
    let status = await token721.connect(a1).getLockStatus(1);
    expect(status).to.be.equal(true);
    await token721.connect(a1).lockNFT(1, false);
    status = await token721.connect(a1).getLockStatus(1);
    expect(status).to.be.equal(false);
  });

  // Lock state can not change number
  it("Should not work Lock state can not change number", async function () {
    await token721.ownerMintTo(a1.address);
    await token721.connect(a1).lockNFT(1, true);
    await expect(token721.connect(a1).changeNumber(1, 1)).to.be.revertedWith("Err: caller does not have the Operator role");
  });

  // Lock state can not be loser
  it("Should not work Lock state can not be loser", async function () {
    await token721.ownerMintTo(a1.address);
    await token721.ownerMintTo(a2.address);
    await token721.changeNumber(1, 10);
    await token721.changeNumber(2, 10);
    await token721.connect(a1).lockNFT(1, true);
    await token721.connect(a2).lockNFT(2, true);
    for(let i = 0; i < 100; i++) {
      await token721.randomMove();
      let number1 = await token721.connect(a1).getNumber(1);
      let number2 = await token721.connect(a1).getNumber(2);
      expect(number1).to.be.equal(10);
      expect(number2).to.be.equal(10);
    }
  })
});