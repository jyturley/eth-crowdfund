# CrowdFundr Project

A crowd funding smart contract that allows creators to register their projects with a funding goal. An ERC721 NFT is awarded to users who contribute more than 1 ETH. [Audited by 0xMacro staff](./staff-audit-crowdfund.md).

## Notes

- Run tests with `npx hardhat test`.
- Very minimal `ProjectFactory` implementation using a single mapping `projectsMap` as storage. This is to ensure creators do not create duplicate projects. The primary key is the project name.
- `Project` implementation that extends to OZ's `ERC721` contract.
  - State is organized using the private `projectState` enum.
  - Badges are awarded using the pull mechanism in which the contributors who put in 1+ ETH will be able to mint themselves a badge, one at a time.
  - Project contributions (total value) are kept track using the `contributions` mapping.
  - `refunded` maps contributors who have or have not refunded.
  - `mintedSoFar` maps contributors to the number of badges they have ever minted.
