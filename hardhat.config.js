/** @type import('hardhat/config').HardhatUserConfig */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {
      parallel: false,
      accounts: {
        count: 22, // Change if you want more wallet for test
      },
    },
    goerli: {
      url: process.env.ALC_GOERLI_URL,
      chainId: 5,
      accounts: [process.env.PRIVATE_KEY]
    },
    polygon: {
      url: process.env.ALC_POLYGON_URL,
      chainId: 137,
      accounts: [process.env.PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  },
};

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});