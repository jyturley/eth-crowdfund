## Questions for the Client

Thanks again for the clarifying answers. To summarize things again (italicized items are new):

- Creators can fund multiple projects.
- Projects will be minimally represented by the `creator address` and `funding goal in ETH`
- All projects have a 30 day expiration.
- For projects that do not meet the goal by the expiration, the protocol allows contributors to get his/her money back through a pull system. Meaning, funders themselves need to actively go back to the retrieve their own money they have contributed.
- Contributors who add more than 1ETH (total) to a project will receive an NFT as a reward.
- NFTs are on a per-project basis. Meaning if Satoshi contributes 1ETH each to project A and project B, Satoshi will be eligible to receive two distinct NFTs.
- Images are out of scope for this project.
- _A contributor can mint his/her NFT as soon as he/she contributes 1+ total ETH for a project, regardless of whether it fails or succeeds._
- _Creators can contribute to their own projects and also qualify for the project NFT_

Please let me know if any of the above is inaccurate.

**Questions**

- Ballpark, how many project registrations are we expecting? How many contributors are we expecting? Getting a sense of scale here would aid in us in where we should focus our efforts in optimizing.

---

Hello!

Thank you for the clarifying answers. To summarize below:

- Creators can fund multiple projects.
- Projects will be minimally represented by the `creator address` and `funding goal in ETH`
- All projects have a 30 day expiration.
- For projects that do not meet the goal by the expiration, the protocol allows contributors to get his/her money back through a pull system. Meaning, funders themselves need to actively go back to the retrieve their own money they have contributed.
- Contributors who add more than 1ETH (total) to a project will receive an NFT as a reward.
- NFTs are on a per-project basis. Meaning if Satoshi contributes 1ETH each to project A and project B, Satoshi will be eligible to receive two distinct NFTs.
- Images are out of scope for this project.

### Questions:

- Will the funders of a project be notified in any way that a project as succeeded or failed? This is possible on the blockchain with leveraging `events`. Is this part of the requirement?
- Can a project creator contribute to his/her own project? If yes, I have the following questions:
  - Does the creator qualify for the NFT if the creator contributes more than 1ETH?
  - Do we need the ability to have seed funding upon registration of a project so that the creator does not need to submit more than one transaction (registering, and then contributing to the project)
- Will NFTs be given out to projects that do not meet the funding goal?

---

🌊 Hello! Excited to work with you. I have a few questions:

> _Build a smart contract that allows creators to register their project_

1. A few questions regarding this. What defines a project? I am assuming something like, `name of project`, `description`, `creator identifier`, `goal in ETH?` — am I missing anything else?
   1. Can projects expire? Or does the protocol determine when projects automatically expire.
   2. Can we have more than one creator for a single project?
   3. Can a creator have multiple projects?

> _Other people can contribute ETH to that project._

1. What happens if a goal for a project is never met? Does the contributor receive the ETH back, or is this considered a donation to the project.

> _Once the goal has been met, the creators can withdraw the funds_

1. Do you mind providing more detail on what a goal is? I am assuming a monetary ETH goal. Are there any other parameters that define whether a particular goal is met?

> _When someone contributes 1 ETH, they receive a contributor badge NFT, which is tradable._

1. Do we have a certain NFT in mind, or is this part of the spec? If we need to create our own NFT, we will need to following information:
   1. NFT name
   2. NFT description
   3. Is this a collection of NFTs that are all unique, or would this be a single NFT with the same image that all 1 ETH+ contributors will recieve
   4. Where would you like to host the image? Are you okay with the images being hosted on a centralized server, or would you prefer IPFS?

> _which is tradable._

1. I just want to verify here. When you say “tradable”, you are saying that the owner of these NFTs can send it to his/her friends, right? Please let me know if this is not what you are looking for.
