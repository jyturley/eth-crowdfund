# CrowdFundr Project

```
- The smart contract is reusable; multiple projects can be registered and accept ETH concurrently.
  - Specifically, you should use the factory contract pattern.
- The goal is a preset amount of ETH.
  - This cannot be changed after a project gets created.
- Regarding contributing:
  - The contribute amount must be at least 0.01 ETH.
  - There is no upper limit.
  - Anyone can contribute to the project, including the creator.
  - One address can contribute as many times as they like.
  - No one can withdraw their funds until the project either fails or gets cancelled.
- Regarding contributer badges:
  - An address receives a badge if their total contribution is at least 1 ETH.
  - One address can receive multiple badges, but should only receive 1 badge per 1 ETH.
  - Each project should use its own NFT contract.
- If the project is not fully funded within 30 days:
  - The project goal is considered to have failed.
  - No one can contribute anymore.
  - Supporters get their money back.
  - Contributor badges are left alone. They should still be tradable.
- Once a project becomes fully funded:
  - No one else can contribute (however, the last contribution can go over the goal).
  - The creator can withdraw any amount of contributed funds.
- The creator can choose to cancel their project before the 30 days are over,
  which has the same effect as a project failing.
```

## Project Notes

- All tests are passing. I believe I've implemented all features.
- My design is as follows:
  - Very minimal `ProjectFactory` implementation using a single mapping `projectsMap` as storage. This is to ensure creators do not create duplicate projects. The primary key is the project name.
  - `Project` implementation that extends to OZ's `ERC721` contract.
    - State is organized using the private `projectState` enum.
    - Badges are awarded using the pull mechanism in which the contributors who put in 1+ ETH will be able to mint themselves a badge, one at a time.
    - Project contributions (total value) are kept track using the `contributions` mapping.
    - `refunded` maps contributors who have or have not refunded.
    - `mintedSoFar` maps contributors to the number of badges they have ever minted.

## Other Deliverables

### Non-Technical Client

The asynchronous Q&A is documented in a separate document [here](non-technical-client-questions.md).

### Design Exercise

```
Smart contracts have a hard limit of 24kb. Crowdfundr hands out an NFT to everyone who contributes.
However, consider how Kickstarter has multiple contribution tiers.
How would you design your contract to support this, without creating three separate NFT contracts?
```

- I believe there are multiple ways to go about this.

1. If the goal is to simply provide more "prestige" to the bigger contributor, we can do the following: in the same way certain PFP NFT projects have a small handful of "extra special" NFTs with valuable properties, we can reserve the first, say, 20 NFTs per project for top contributors by contribution percentile. This can be calculated at mint time, however for this work, we must withhold contributors from minting immediately, and only allow mint after project funding completion. This would allow for the top 90%+ percentile contributor to receive a different a token from someone who is a 50% percentile contributor, for example.

2. If the project creator needs to deliver more features to higher tier contributors, then the above solution will not be sufficient since percentile is calculated at project finish. The contract that extends to OZ's `ERC721` (in my case `Project`) can add an immutable storage field that can signify the tier of the token. This will be set by the constructor so the contributor will know beforehand if he/she will be receiving a high tier badge depending on the tier parameters the project specifies. These tokens will still be tradable just like an other ERC721 token.
