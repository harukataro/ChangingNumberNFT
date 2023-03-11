/* eslint-disable no-undef */
const { expect } = require("chai");
var fs = require("fs");

describe("ZabutonImage", function () {
    let za;
  
    beforeEach(async function () {
      //ZabutonImage
      const ZabutonImage = await ethers.getContractFactory("ZabutonImage");
      za = await ZabutonImage.deploy();
    });
  
    
    describe("Deployment", function () {
      
      it("Should return Image ", async function () {
        for(let i = 0; i <= 10; i++){
          const image = await za.getImage(i);
          const filename = "tmp/za" + (i) + ".svg";
          fs.writeFileSync(filename, image);
    }});
    });
  });