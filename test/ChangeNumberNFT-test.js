/* eslint-disable no-undef */
const { expect } = require("chai");
var fs = require("fs");

describe("ChangingNumberNFT", function () {
  let BadgeToken;
  let token721;
  let _name="ChangingNumberNFT";
  let _symbol="CHNN";
  let a1, a2, a3,a4, a5;

  beforeEach(async function () {
    BadgeToken = await ethers.getContractFactory("ChangingNumberNFT");
    [owner, a1, a2, a3, a4, a5] = await ethers.getSigners();
    token721 = await BadgeToken.deploy();
  });

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    
    it("Should has the correct name and symbol ", async function () {
      expect(await token721.name()).to.equal(_name);
      expect(await token721.symbol()).to.equal(_symbol);
    });

    it("Should mint a token by account1", async function () {
      await token721.setMintable(true);
      await token721.addMinters([a1.address]);
      await token721.connect(a1).mintTo(a1.address);
      expect(await token721.ownerOf(1)).to.equal(a1.address);
      expect((await token721.balanceOf(a1.address)).toNumber()).to.equal(1);      
    });

    it("Should output tokeURI", async function () {
      await token721.setMintable(true);
      await token721.addMinters([a1.address]);
      await token721.connect(a1).mintTo(a1.address);

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
      fs.writeFileSync("test1.svg", image);
    });

    it("Should output tokeURI", async function () {
      await token721.setMintable(true);
      await token721.addMinters([a1.address]);
      await token721.connect(a1).mintTo(a1.address);
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
      fs.writeFileSync("test2.svg", image);

      for (let i=0; i<8; i++) {
        await token721.connect(a1).addNumber(1);
        tokenURI = await token721.tokenURI(1);
        metaData = Buffer.from(tokenURI.split(",")[1], 'base64').toString('ascii');
        metaData = JSON.parse(metaData);
        //console.log(metaData.attributes[0].value);
        image = metaData.image.split(",")[1];
        image = Buffer.from(image, 'base64').toString('ascii');
        const filename = "test" + (i+3) + ".svg";
        fs.writeFileSync(filename, image);
      }
    });

    it("Should work random", async function () {
      await token721.setMintable(true);
      await token721.addMinters([a1.address, a2.address, a3.address, a4.address]);
      await token721.connect(a1).mintTo(a1.address);
      await token721.connect(a2).mintTo(a2.address);
      await token721.connect(a3).mintTo(a3.address);
      await token721.connect(a4).mintTo(a4.address);
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
      fs.writeFileSync("testWin.svg", image);

      let tokenURI2 = await token721.tokenURI(Number(loser));
      let metaData2 = Buffer.from(tokenURI2.split(",")[1], 'base64').toString('ascii');
      metaData2 = JSON.parse(metaData2);
      let image2 = metaData2.image.split(",")[1];
      image2 = Buffer.from(image2, 'base64').toString('ascii');
      fs.writeFileSync("testLose.svg", image2);
    });
  });
});