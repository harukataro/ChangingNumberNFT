# ChangingNumber and NumberKing NFT

## Introduction

Changing Number NFT is full onchain NFT, and it can be change the metadata of number. it shows image metadata.
KindNumberNFT can mint only if owner have ChangingNumber NFT and that number is 10.

## How to setup

1. Clone this repository
2. deploy contracts
3. Set the NumberKing contract address to ChangingNumber contract with setAllowedContract function
4. Set the ChangingNumber contract address to NumberKing contract with setChangingNumberContractAddress function
5. Both contract have Operator role to help daily operation of contract. You can set the operator role with grantOperatorRoleToUser function.
6. Minting of ChangingNumber, Owner can use mintTo anytime. each wallet have limit.
7. Allow Lift function exist. Owner can add/delete the address to allow list.
8. Mint enabling switch exist. Owner can enable/disable minting.
9. Public minting switch exist. Owner can enable/disable public minting.

