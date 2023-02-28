// tests/NumberKing.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

function convertToJason(str) {
  let output = Buffer.from(str.split(",")[1], 'base64').toString('ascii');
  return JSON.parse(output);
}

describe("NumberKing", function () {
  let numberKing;
  let changingNumber;
  let owner;
  let holder;
  let holder2;
  let holder3;
  let holder4;

  const kingTokenId = 1;
  const nonKingTokenId = 3;

  beforeEach(async function () {
    const NumberKing = await ethers.getContractFactory("NumberKing");
    numberKing = await NumberKing.deploy();

    const ChangingNumber = await ethers.getContractFactory("ChangingNumber");
    changingNumber = await ChangingNumber.deploy();

    // NumberKing に ChangingNumber のアドレスを登録
    await numberKing.setChangingNumberContractAddress(changingNumber.address);
    // ChangingNumber に NumberKing のアドレスを登録
    await changingNumber.setAllowedContract(numberKing.address);

    owner = (await ethers.getSigners())[0];
    holder = (await ethers.getSigners())[1]; // 10を持っているユーザー
    holder2 = (await ethers.getSigners())[2]; // 持ってないユーザー
    holder3 = (await ethers.getSigners())[3]; // 9を持っているユーザー
    holder4 = (await ethers.getSigners())[4]; // OPERATOR ROLEを持っているユーザー

    await changingNumber.addAllowedMinters([holder.address, holder2.address, holder3.address]);

    // ChangingNumber を持っているユーザーを準備
    await changingNumber.setMintable(true);
    await changingNumber.connect(holder).mint();
    await changingNumber.changeNumber(1, 10);

    // ChangingNumberで９を持っているユーザーを準備
    await changingNumber.connect(holder3).mint();
    await changingNumber.changeNumber(2, 9);

    // OPERATOR ROLEを持っているユーザーを準備
    await numberKing.grantOperatorRoleToUser(holder4.address);
  });

  it("should allow a user to mint a token if they have a ChangingNumber with number 10", async function () {

    // ChangingNumberに存在しないトークンは mint できない
    await expect(
      numberKing.connect(holder).safeMint(nonKingTokenId)
    ).to.be.revertedWith("ERC721: invalid token ID");

    // ChangingNumber を持っていないウオレットは mint できない
    await expect(
      numberKing.connect(holder2).safeMint(kingTokenId)
    ).to.be.revertedWith("You don't have a ChangingNumber with number 10");

    // ChangingNumber を持っているユーザーは mint できる
    const currentNumber = await changingNumber.connect(holder).getNumber(1);
    await expect(numberKing.connect(holder).safeMint(kingTokenId))
      .to.emit(numberKing, "Transfer")
      .withArgs(ethers.constants.AddressZero, holder.address, kingTokenId);

    const ownerOfToken = await numberKing.ownerOf(kingTokenId);
    expect(ownerOfToken).to.equal(holder.address);

    // ChangingNumberは１にリセットされる
    const newNumber = await changingNumber.connect(holder).getNumber(1);
    expect(newNumber).to.equal(1);

    //10以下の数字を持っていると mint できない
    await expect(
      numberKing.connect(holder3).safeMint(kingTokenId)
    ).to.be.revertedWith("You don't have a ChangingNumber with number 10");

  });

  it("Should expected metadata", async function () {
    numberKing.connect(holder).safeMint(kingTokenId)
    const uri = await numberKing.connect(holder).tokenURI(kingTokenId);
    let metaData = convertToJason(uri);
    expect(metaData.name).to.equal("Number King #1");
    expect(metaData.description).to.equal("Number King is a NFT that can be minted by a user who has a ChangingNumber with number 10.");
    expect(metaData.attributes[0].trait_type).to.equal("Rank");
    expect(metaData.attributes[0].value).to.equal("0");
    expect(metaData.image).to.equal("https://nftnews.jp/wp-content/uploads/2023/02/King_0.png");
  });

  it("Should work set Rank", async function () {
    await numberKing.connect(holder).safeMint(kingTokenId)
    await numberKing.setRank(kingTokenId, 2);
    let readRank = await numberKing.getRank(kingTokenId);
    expect(readRank).to.equal(2);
    const uri = await numberKing.connect(holder).tokenURI(kingTokenId);
    let metaData = convertToJason(uri);
    expect(metaData.attributes[0].value).to.equal("2");

    // by operator control
    await numberKing.connect(holder4).setRank(kingTokenId, 3);
    readRank = await numberKing.getRank(kingTokenId);
    expect(readRank).to.equal(3);
  });

  // SBT features
  it("Should revert transfer as SBT", async function () {
    await numberKing.connect(holder).safeMint(kingTokenId)
    await expect(
      numberKing.connect(holder).transferFrom(holder.address, holder2.address, kingTokenId)
    ).to.be.revertedWith("This a SBT. It cannot be transferred. It can only be burned by the token owner.");

    await expect(
      numberKing.connect(holder)["safeTransferFrom(address,address,uint256)"](holder.address, holder2.address, kingTokenId)
    ).to.be.revertedWith("This a SBT. It cannot be transferred. It can only be burned by the token owner.");

    await expect(
      numberKing.connect(holder)["safeTransferFrom(address,address,uint256,bytes)"](holder.address, holder2.address, kingTokenId, "0x")
    ).to.be.revertedWith("This a SBT. It cannot be transferred. It can only be burned by the token owner.");
    });

  it("Should burn as SBT", async function () {
    await numberKing.connect(holder).safeMint(kingTokenId)
    await numberKing.connect(holder).burn(kingTokenId);
    await expect(
      numberKing.connect(holder).ownerOf(kingTokenId)
    ).to.be.revertedWith("ERC721: invalid token ID");
  });

  // Operator control features
  it("Should work Operator controls", async function () {
    let num =  await numberKing.connect(holder4).getOperatorMemberCount();
    expect(num).to.equal(1);

    //holder4 is 2nd member
    let op = await numberKing.connect(holder4).getOperatorMember(0);
    expect(op).to.equal(holder4.address);

    let hasOp = await numberKing.connect(holder4).hasOperatorRole(holder4.address);
    expect(hasOp).to.equal(true);
    
    await numberKing.revokeOperatorRoleFromUser(holder4.address);
    num =  await numberKing.connect(holder4).getOperatorMemberCount();
    expect(num).to.equal(0);

    await expect(
      numberKing.connect(holder4).setRank(kingTokenId, 3)
    ).to.be.revertedWith("Err: caller does not have the Operator role");
  });

});
