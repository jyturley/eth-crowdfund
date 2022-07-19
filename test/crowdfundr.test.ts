// ----------------------------------------------------------------------------
// REQUIRED: Instructions
// ----------------------------------------------------------------------------
/*
  For this first project, we've provided a significant amount of scaffolding
  in your test suite. We've done this to:

    1. Set expectations, by example, of where the bar for testing is.
    2. Encourage more students to embrace an Advanced Typescript Hardhat setup.
    3. Reduce the amount of time consumed this week by "getting started friction".

  Please note that:

    - We will not be so generous on future projects!
    - The tests provided are about ~90% complete.
    - IMPORTANT:
      - We've intentionally left out some tests that would reveal potential
        vulnerabilities you'll need to identify, solve for, AND TEST FOR!

      - Failing to address these vulnerabilities will leave your contracts
        exposed to hacks, and will certainly result in extra points being
        added to your micro-audit report! (Extra points are _bad_.)

  Your job (in this file):

    - DO NOT delete or change the test names for the tests provided
    - DO complete the testing logic inside each tests' callback function
    - DO add additional tests to test how you're securing your smart contracts
         against potential vulnerabilties you identify as you work through the
         project.

    - You will also find several places where "FILL_ME_IN" has been left for
      you. In those places, delete the "FILL_ME_IN" text, and replace with
      whatever is appropriate.
*/
// ----------------------------------------------------------------------------

import chai, { expect } from "chai";
import { ethers, network, waffle } from "hardhat";
import { BigNumber } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { Project, ProjectFactory, ProjectFactory__factory } from "../typechain";
import { isAddress } from "ethers/lib/utils";

chai.use(waffle.solidity);

// ----------------------------------------------------------------------------
// OPTIONAL: Constants and Helper Functions
// ----------------------------------------------------------------------------
// We've put these here for your convenience. Feel free to use them if they
// are helpful!
const SECONDS_IN_DAY: number = 60 * 60 * 24;
const SECONDS_IN_MONTH: number = 30 * SECONDS_IN_DAY;
const ONE_ETHER: BigNumber = ethers.utils.parseEther("1");
const HALF_ETHER: BigNumber = ethers.utils.parseEther("0.5");
const STATUS_ACCEPTING_FUNDS: Number = 0;
const STATUS_CANCELLED: Number = 1;
const STATUS_FAILED: Number = 2;
const STATUS_SUCCEEDED: Number = 3;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// Bump the timestamp by a specific amount of seconds
const timeTravel = async (seconds: number) => {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
};

// Or, set the time to be a specific amount (in seconds past epoch time)
const setBlockTimeTo = async (seconds: number) => {
  await network.provider.send("evm_setNextBlockTimestamp", [seconds]);
  await network.provider.send("evm_mine");
};
// ----------------------------------------------------------------------------

describe("Crowdfundr", () => {
  let deployer: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let chris: SignerWithAddress;

  let ProjectFactory: ProjectFactory__factory;
  let projectFactory: ProjectFactory;

  beforeEach(async () => {
    [deployer, alice, bob, chris] = await ethers.getSigners();

    // NOTE: You may need to pass arguments to the `deploy` function if your
    //       ProjectFactory contract's constructor has input parameters
    ProjectFactory = await ethers.getContractFactory("ProjectFactory");
    projectFactory = (await ProjectFactory.deploy()) as ProjectFactory;
    await projectFactory.deployed();
  });

  describe("ProjectFactory: Additional Tests", () => {
    /* 
    TODO: You may add additional tests here if you need to
    
    NOTE: If you wind up writing Solidity code to protect against a
    vulnerability that is not tested for below, you should add
    at least one test here.
    
    DO NOT: Delete or change the test names for the tests provided below
    */
    it("Prevents duplicate projects from being created", async () => {
      expect(await projectFactory.connect(alice).create("Mushroom Lab", ONE_ETHER)).to.be.ok;
      await expect(
        projectFactory.connect(alice).create("Mushroom Lab", ONE_ETHER)
      ).to.be.revertedWith("Project name already taken");
    });
    it("Prevents project with empty name", async () => {
      await expect(projectFactory.connect(alice).create("", ONE_ETHER)).to.be.revertedWith(
        "Invalid project name"
      );
    });

    it("Prevents project with very high goal", async () => {
      const goal = 2 ** 53 - 1;
      await expect(projectFactory.connect(alice).create("An Ambitious Project", 2 ** 53 - 1)).to.be
        .reverted;
    });
  });

  describe("ProjectFactory", () => {
    it("Deploys a contract", () => {
      expect(projectFactory.address).to.be.ok;
    });

    it("Can register a single project", async () => {
      const name = "Orange Juice Factory";
      const goal = ethers.utils.parseEther("2");
      expect(await projectFactory.connect(alice).create(name, goal)).to.be.ok;
    });

    it("Can register multiple projects", async () => {
      const goal = ethers.utils.parseEther("2");
      expect(await projectFactory.connect(alice).create("Orange Juice Factory", goal)).to.be.ok;
      expect(await projectFactory.connect(alice).create("Mango Juice Factory", goal)).to.be.ok;
    });

    it("Registers projects with the correct owner", async () => {
      const projectName = "Lemonade Stand";
      const projectGoal = ethers.utils.parseEther("5");
      const txReceiptUnresolved = await projectFactory
        .connect(alice)
        .create(projectName, projectGoal);
      const txReceipt = await txReceiptUnresolved.wait();

      const projectAddress = txReceipt.events![0].args![0];
      const project = await ethers.getContractAt("Project", projectAddress);
      expect(await project.owner()).to.equal(alice.address);
    });

    it("Registers projects with a preset funding goal (in units of ether)", async () => {
      const projectName = "Lemonade Stand";
      const projectGoal = ethers.utils.parseEther("5");
      const txReceiptUnresolved = await projectFactory
        .connect(alice)
        .create(projectName, projectGoal);
      const txReceipt = await txReceiptUnresolved.wait();

      const projectAddress = txReceipt.events![0].args![0];
      const project = await ethers.getContractAt("Project", projectAddress);
      expect(await project.ethFundGoal()).to.equal(projectGoal);
    });

    it('Emits a "ProjectCreated" event after registering a project', async () => {
      const name = "Orange Juice Factory";
      const goal = ethers.utils.parseEther("2");
      await expect(projectFactory.connect(alice).create(name, goal)).to.emit(
        projectFactory,
        "ProjectCreated"
      );
    });

    it("Allows multiple contracts to accept ETH simultaneously", async () => {
      const goal1 = ethers.utils.parseEther("5");
      const goal2 = ethers.utils.parseEther("6");
      const txReceiptUnr1 = await projectFactory
        .connect(alice)
        .create("Orange Juice Factory", goal1);
      const txReceipt1 = await txReceiptUnr1.wait();
      const projectAddress1 = txReceipt1.events![0].args![0];
      const project1 = await ethers.getContractAt("Project", projectAddress1);

      const txReceiptUnr2 = await projectFactory.connect(bob).create("Mango Juice Factory", goal2);
      const txReceipt2 = await txReceiptUnr2.wait();
      const projectAddress2 = txReceipt2.events![0].args![0];
      const project2 = await ethers.getContractAt("Project", projectAddress2);

      expect(project1.address).to.be.ok;
      expect(project2.address).to.be.ok;
      expect(await project1.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
      expect(await project2.connect(alice).contribute({ value: ONE_ETHER })).to.be.ok;
    });
  });

  describe("Project: Additional Tests", () => {
    /* 
      TODO: You may add additional tests here if you need to

      NOTE: If you wind up protecting against a vulnerability that is not
            tested for below, you should add at least one test here.

      DO NOT: Delete or change the test names for the tests provided below
    */
    let projectAddress: string;
    let project: Project;
    let projectName: string;
    let projectGoal: BigNumber;

    beforeEach(async () => {
      projectName = "Lemonade Stand";
      projectGoal = ethers.utils.parseEther("5");
      const txReceiptUnresolved = await projectFactory
        .connect(alice)
        .create(projectName, projectGoal);
      const txReceipt = await txReceiptUnresolved.wait();

      projectAddress = txReceipt.events![0].args![0];
      project = await ethers.getContractAt("Project", projectAddress);
    });

    it("Prevents project to be initialized with invalid fund goal", async () => {
      const projectName = "Micro Lemonade Stand";
      const projectGoal = ethers.utils.parseEther("0");
      await expect(projectFactory.create(projectName, projectGoal)).to.be.revertedWith(
        "Invalid fund goal"
      );

      const projectName2 = "Tiny Lemonade Stand";
      const projectGoal2 = ethers.utils.parseEther("0.01");
      await expect(projectFactory.create(projectName2, projectGoal)).to.be.revertedWith(
        "Invalid fund goal"
      );
    });

    it("Prevents project to be initialized with a zero address", async () => {
      const Project = await ethers.getContractFactory("Project");
      await expect(Project.deploy("zero", ZERO_ADDRESS, ONE_ETHER)).to.be.reverted;
    });

    it("Cancelled project: Address can mint and then refund", async () => {
      expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
      expect(await project.connect(alice).cancelProject()).to.be.ok;
      expect(await project.connect(bob).mint()).to.be.ok;
      expect(await project.ownerOf(1)).to.equal(bob.address);
      expect(await project.connect(bob).refund()).to.be.ok;
    });

    it("Cancelled project: Address can refund and then mint", async () => {
      expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
      expect(await project.connect(alice).cancelProject()).to.be.ok;
      expect(await project.connect(bob).refund()).to.be.ok;
      expect(await project.connect(bob).mint()).to.be.ok;
    });

    it("Address cannot gain more from refunding twice", async () => {
      expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
      timeTravel(SECONDS_IN_MONTH);
      const beforeRefund = await bob.getBalance();
      expect(await project.connect(bob).refund()).to.be.ok;
      expect(await project.getProjectStatus()).to.equal(STATUS_FAILED);
      const afterRefund = await bob.getBalance();
      expect(afterRefund).to.be.gt(beforeRefund);

      // now try to refund again
      await expect(project.connect(bob).refund()).to.be.revertedWith(
        "Cannot refund multiple times"
      );
    });

    it("Cancelling project again reverts", async () => {
      expect(await project.connect(alice).cancelProject()).to.be.ok;
      await expect(project.connect(alice).cancelProject()).to.be.revertedWith(
        "Can only cancel an active project accepting funds."
      );
    });

    it('Emits a "NewBadgeAwarded" event after contributor recieves a badge', async () => {
      expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
      expect(await project.connect(bob).mint())
        .to.emit(project, "NewBadgeAwarded")
        .withArgs(bob.address, 0);
    });
  });

  describe("Project", () => {
    let projectAddress: string;
    let project: Project;
    let projectName: string;
    let projectGoal: BigNumber;

    beforeEach(async () => {
      projectName = "Lemonade Stand";
      projectGoal = ethers.utils.parseEther("5");
      const txReceiptUnresolved = await projectFactory
        .connect(alice)
        .create(projectName, projectGoal);
      const txReceipt = await txReceiptUnresolved.wait();

      projectAddress = txReceipt.events![0].args![0];
      project = await ethers.getContractAt("Project", projectAddress);
    });

    describe("Contributions", () => {
      describe("Contributors", () => {
        it("Allows the creator to contribute", async () => {
          expect(await project.connect(alice).contribute({ value: ONE_ETHER })).to.be.ok;
        });

        it("Allows any EOA to contribute", async () => {
          const before = await project.currentFunding();
          expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
          const after = await project.currentFunding();
          expect(after.toString()).to.equal(before.add(ONE_ETHER).toString());
          expect((await project.getContribution(bob.address)).toString()).to.equal(
            ONE_ETHER.toString()
          );
        });

        it("Allows an EOA to make many separate contributions", async () => {
          const before = await project.currentFunding();
          expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
          expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
          expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
          expect(await project.contributions(bob.address)).to.equal(ethers.utils.parseEther("3"));
          const after = await project.currentFunding();
          expect(after.toString()).to.equal(before.add(ethers.utils.parseEther("3")).toString());
        });

        it('Emits a "ProjectContribution" event after a contribution is made', async () => {
          expect(await project.connect(bob).contribute({ value: ONE_ETHER }))
            .to.emit(project, "ProjectContribution")
            .withArgs(bob.address, ONE_ETHER);
        });
      });

      describe("Minimum ETH Per Contribution", () => {
        it("Reverts contributions below 0.01 ETH", async () => {
          const tinyAmount = ethers.utils.parseEther("0.001");
          await expect(project.connect(bob).contribute({ value: tinyAmount })).to.be.revertedWith(
            "Minimum contribution is 0.01 eth"
          );
        });

        it("Accepts contributions of exactly 0.01 ETH", async () => {
          const exactAmount = ethers.utils.parseEther("0.01");
          await expect(project.connect(bob).contribute({ value: exactAmount })).to.be.ok;
          expect(await project.contributions(bob.address)).to.equal(exactAmount);
        });
      });

      describe("Final Contributions", () => {
        it("Allows the final contribution to exceed the project funding goal", async () => {
          const moreThanGoal = ethers.utils.parseEther("6");
          await expect(project.connect(bob).contribute({ value: moreThanGoal })).to.be.ok;
          expect(await project.ethFundGoal()).to.be.lt(moreThanGoal);
          expect(await project.contributions(bob.address)).to.equal(moreThanGoal);
        });

        it("Prevents additional contributions after a project is fully funded", async () => {
          const moreThanGoal = ethers.utils.parseEther("6");
          await project.connect(bob).contribute({ value: moreThanGoal });
          await expect(project.connect(bob).contribute({ value: moreThanGoal })).to.be.revertedWith(
            "Project is not active."
          );
        });

        it("Prevents additional contributions after 30 days have passed since Project instance deployment", async () => {
          await timeTravel(SECONDS_IN_MONTH);
          await expect(project.connect(bob).contribute({ value: ONE_ETHER })).to.be.revertedWith(
            "Project is not active."
          );
        });
      });
    });

    describe("Withdrawals", () => {
      describe("Project Status: Active", () => {
        it("Prevents the creator from withdrawing any funds", async () => {
          await expect(
            project.connect(alice).withdrawFinishedProject(ONE_ETHER)
          ).to.be.revertedWith("Project must be successful for owner to withdraw.");
        });

        it("Prevents contributors from withdrawing any funds", async () => {
          await expect(project.connect(bob).withdrawFinishedProject(ONE_ETHER)).to.be.revertedWith(
            "Only owners can withdraw from finished project."
          );
        });

        it("Prevents non-contributors from withdrawing any funds", async () => {
          await expect(project.connect(bob).withdrawFinishedProject(ONE_ETHER)).to.be.revertedWith(
            "Only owners can withdraw from finished project."
          );
        });
      });

      describe("Project Status: Success", () => {
        it("Allows the creator to withdraw some of the contribution balance", async () => {
          await project.connect(bob).contribute({ value: ethers.utils.parseEther("15") });
          expect(await project.connect(alice).withdrawFinishedProject(ONE_ETHER)).to.be.ok;
        });

        it("Allows the creator to withdraw the entire contribution balance", async () => {
          const total = ethers.utils.parseEther("15");
          const before = await alice.getBalance();
          await project.connect(bob).contribute({ value: total });

          const txResponse = await project.connect(alice).withdrawFinishedProject(total);
          const txReceipt = await txResponse.wait();
          const { gasUsed, effectiveGasPrice } = txReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          expect(await project.currentFunding()).to.equal(ethers.utils.parseEther("0"));
          const after = await alice.getBalance();
          expect(after).to.equal(before.add(total).sub(gasCost));
        });

        it("Allows the creator to make multiple withdrawals", async () => {
          await project.connect(bob).contribute({ value: ethers.utils.parseEther("15") });
          expect(await project.connect(alice).withdrawFinishedProject(ONE_ETHER)).to.be.ok;
          expect(await project.connect(alice).withdrawFinishedProject(ONE_ETHER)).to.be.ok;
          expect(await project.connect(alice).withdrawFinishedProject(ONE_ETHER)).to.be.ok;
          expect(await project.currentFunding()).to.equal(ethers.utils.parseEther("12"));
        });

        it("Prevents the creator from withdrawing more than the contribution balance", async () => {
          await project.connect(bob).contribute({ value: ethers.utils.parseEther("15") });
          const moreThanFunds = ethers.utils.parseEther("18");
          await expect(
            project.connect(alice).withdrawFinishedProject(moreThanFunds)
          ).to.be.revertedWith("Cannot withdraw more than what is in the project.");
        });

        it('Emits a "ProjectWithdraw" event after a withdrawal is made by the creator', async () => {
          const start = ethers.utils.parseEther("15");
          await project.connect(bob).contribute({ value: start });
          await expect(project.connect(alice).withdrawFinishedProject(ONE_ETHER))
            .to.emit(project, "ProjectWithdraw")
            .withArgs(ONE_ETHER, start.sub(ONE_ETHER));
        });

        it("Prevents contributors from withdrawing any funds", async () => {
          const start = ethers.utils.parseEther("15");
          await project.connect(bob).contribute({ value: start });

          await expect(project.connect(bob).withdrawFinishedProject(ONE_ETHER)).to.be.revertedWith(
            "Only owners can withdraw from finished project."
          );
          expect(await project.currentFunding()).to.equal(start);
        });

        it("Prevents non-contributors from withdrawing any funds", async () => {
          const start = ethers.utils.parseEther("15");
          await project.connect(bob).contribute({ value: start });
          expect(await project.getProjectStatus()).to.equal(STATUS_SUCCEEDED);
          await expect(
            project.connect(chris).withdrawFinishedProject(ONE_ETHER)
          ).to.be.revertedWith("Only owners can withdraw from finished project.");
        });
      });

      describe("Project Status: Failure", () => {
        it("Prevents the creator from withdrawing any funds (if not a contributor)", async () => {
          const start = ethers.utils.parseEther("2");
          await project.connect(bob).contribute({ value: start });
          timeTravel(SECONDS_IN_MONTH);
          await expect(
            project.connect(alice).withdrawFinishedProject(ONE_ETHER)
          ).to.be.revertedWith("Project must be successful for owner to withdraw.");
        });

        it("Prevents contributors from withdrawing any funds (though they can still refund)", async () => {
          const start = ethers.utils.parseEther("2");
          await project.connect(bob).contribute({ value: start });
          timeTravel(SECONDS_IN_MONTH);
          await expect(project.connect(bob).withdrawFinishedProject(ONE_ETHER)).to.be.revertedWith(
            "Only owners can withdraw from finished project."
          );
          expect(await project.currentFunding()).to.equal(start);
          expect(await project.connect(bob).refund()).to.be.ok;
          expect(await project.getProjectStatus()).to.equal(STATUS_FAILED);
        });

        it("Prevents non-contributors from withdrawing any funds", async () => {
          const start = ethers.utils.parseEther("2");
          await project.connect(bob).contribute({ value: start });
          timeTravel(SECONDS_IN_MONTH);
          await expect(
            project.connect(chris).withdrawFinishedProject(ONE_ETHER)
          ).to.be.revertedWith("Only owners can withdraw from finished project.");
          expect(await project.currentFunding()).to.equal(start);
        });
      });
    });

    describe("Refunds", () => {
      it("Allows contributors to be refunded when a project fails", async () => {
        const start = ethers.utils.parseEther("2");
        await project.connect(bob).contribute({ value: start });
        timeTravel(SECONDS_IN_MONTH);
        expect(await project.connect(bob).refund()).to.be.ok;
        expect(await project.getProjectStatus()).to.equal(STATUS_FAILED);
      });

      it("Prevents contributors from being refunded if a project has not failed", async () => {
        const start = ethers.utils.parseEther("2");
        await project.connect(bob).contribute({ value: start });
        await expect(project.connect(bob).refund()).to.be.revertedWith(
          "Project must be cancelled or failed for refunds"
        );
        expect(await project.contributions(bob.address)).to.equal(start);
      });

      it('Emits a "ProjectRefund" event after a a contributor receives a refund', async () => {
        const start = ethers.utils.parseEther("2");
        await project.connect(bob).contribute({ value: start });
        timeTravel(SECONDS_IN_MONTH);
        expect(await project.connect(bob).refund())
          .to.emit(project, "ProjectRefund")
          .withArgs(bob.address, start);
      });
    });

    describe("Cancelations (creator-triggered project failures)", () => {
      it("Allows the creator to cancel the project if < 30 days since deployment has passed ", async () => {
        expect(await project.connect(alice).cancelProject()).to.be.ok;
      });

      it("Prevents the creator from canceling the project if at least 30 days have passed", async () => {
        timeTravel(SECONDS_IN_MONTH);
        await expect(project.connect(alice).cancelProject()).to.be.revertedWith(
          "Cannot cancel a project if more than 30 days have passed"
        );
      });

      it('Emits a "ProjectCancelled" event after a project is cancelled by the creator', async () => {
        await expect(project.connect(alice).cancelProject()).to.emit(project, "ProjectCancelled");
      });
    });

    describe("NFT Contributor Badges", () => {
      const firstTokenId = 1;
      beforeEach(async () => {
        expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
        expect(await project.connect(chris).contribute({ value: HALF_ETHER })).to.be.ok;
      });
      it("Awards a contributor with a badge when they make a single contribution of at least 1 ETH", async () => {
        const txUnrs = await project.connect(bob).mint();
        const txReceipt = await txUnrs.wait();
        const tokenId = txReceipt.events![0].args![2];
        expect(tokenId).to.equal(1);
        expect(await project.ownerOf(tokenId)).to.equal(bob.address);
        expect(await project.mintedSoFar(bob.address)).to.be.equal(1);
      });

      it("Awards a contributor with a badge when they make multiple contributions to a single project that sum to at least 1 ETH", async () => {
        expect(await project.connect(chris).contribute({ value: HALF_ETHER })).to.be.ok;
        expect(await project.connect(chris).mint()).to.be.ok;
        expect(await project.ownerOf(firstTokenId)).to.equal(chris.address);
      });

      it("Does not award a contributor with a badge if their total contribution to a single project sums to < 1 ETH", async () => {
        await expect(project.connect(chris).mint()).to.be.revertedWith(
          "Only addresses that contribute more than 1ETH can receive badges"
        );
        expect(await project.connect(chris).contribute({ value: ethers.utils.parseEther("0.3") }))
          .to.be.ok;
        await expect(project.connect(chris).mint()).to.be.revertedWith(
          "Only addresses that contribute more than 1ETH can receive badges"
        );
      });

      it("Awards a contributor with a second badge when their total contribution to a single project sums to at least 2 ETH", async () => {
        // Note: One address can receive multiple badges for a single project,
        //       but they should only receive 1 badge per 1 ETH contributed.
        expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
        expect(await project.contributions(bob.address)).equal(ethers.utils.parseEther("2"));
        expect(await project.connect(bob).mint()).to.be.ok;
        expect(await project.connect(bob).mint()).to.be.ok;
        await expect(project.connect(bob).mint()).to.be.revertedWith(
          "Only addresses that contribute more than 1ETH can receive badges"
        );
        expect(await project.mintedSoFar(bob.address)).to.be.equal(2);
        expect(await project.ownerOf(firstTokenId)).to.equal(bob.address);
        expect(await project.ownerOf(firstTokenId + 1)).to.equal(bob.address);
      });

      it("Does not award a contributor with a second badge if their total contribution to a single project is > 1 ETH but < 2 ETH", async () => {
        expect(await project.connect(chris).contribute({ value: ONE_ETHER })).to.be.ok;
        // total funding is now 1.5eth
        expect(await project.connect(chris).mint()).to.be.ok;
        await expect(project.connect(chris).mint()).to.be.revertedWith(
          "Only addresses that contribute more than 1ETH can receive badges"
        );
      });

      it("Awards contributors with different NFTs for contributions to different projects", async () => {
        // bob sets up second project
        const txReceiptUnresolved = await projectFactory
          .connect(alice)
          .create("Bob's Burgers", ethers.utils.parseEther("5"));
        const txReceipt = await txReceiptUnresolved.wait();
        const bobProjectAddress = txReceipt.events![0].args![0];
        const bobProject = await ethers.getContractAt("Project", bobProjectAddress);

        // chris contributes to both existing projects
        expect(await project.connect(chris).contribute({ value: ONE_ETHER })).to.be.ok;
        expect(await bobProject.connect(chris).contribute({ value: ONE_ETHER })).to.be.ok;

        // chris mints a badge from each
        expect(await project.connect(chris).mint()).to.be.ok;
        expect(await bobProject.connect(chris).mint()).to.be.ok;

        // verify chris has two badges
        expect(await project.ownerOf(firstTokenId)).to.equal(chris.address);
        expect(await bobProject.ownerOf(firstTokenId)).to.equal(chris.address);
      });

      it("Allows contributor badge holders to trade the NFT to another address", async () => {
        expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
        expect(await project.connect(bob).mint()).to.be.ok;
        expect(await project.ownerOf(firstTokenId)).to.equal(bob.address);
        expect(
          await project
            .connect(bob)
            ["safeTransferFrom(address,address,uint256)"](bob.address, chris.address, firstTokenId)
        ).to.be.ok;
        expect(await project.ownerOf(firstTokenId)).to.equal(chris.address);
      });

      it("Allows contributor badge holders to trade the NFT to another address even after its related project fails", async () => {
        expect(await project.connect(bob).contribute({ value: ONE_ETHER })).to.be.ok;
        timeTravel(SECONDS_IN_MONTH);
        expect(await project.connect(bob).refund()).to.be.ok;
        expect(await project.getProjectStatus()).to.equal(STATUS_FAILED);
        expect(await project.connect(bob).mint()).to.be.ok;
        expect(await project.ownerOf(firstTokenId)).to.equal(bob.address);
        expect(
          await project
            .connect(bob)
            ["safeTransferFrom(address,address,uint256)"](bob.address, chris.address, firstTokenId)
        ).to.be.ok;
      });
    });
  });
});
