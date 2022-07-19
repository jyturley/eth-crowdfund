
<!---
student 0xMacro repo link WITH COMMIT HASH. You can get this from the training app, by viewing the submission link
--->
https://github.com/0xMacro/student.jyturley/tree/3f7ec2575ff4d6d8d3882335ed5487f3431ca968/crowdfund

Audited By: Cameron Voell

<!--- Remember, you can find a list of issues found by previous staff here:
https://www.notion.so/0xmacro/TA-Role-and-Responsibilities-01b41500ad254ff0b48f2f3b85064cac#47ea7563f6d7429597df734d24a7a9f1
--->

# General Comments

This project was really well done. In particular, you handled well the tricky situations around distributing reward badges corrrectly, even if previously transferred by contributors. Your logic around allowing withdraws and updating project states was all simple and without error as far as I could tell. The style of minimal code in order to more clearly handle complexity will bode well for you in future projects as complexity increases. Nice!


# Design Exercise

Your first idea about calculating tonribution tiers after funding and sending out top 20 NFTs was an original idea, and would work if you could wait until after funding to send rewards. 

The immutable storage field for holding tier of reward is a nice minimalist approach for rewarding users using the same contract. Nice!


# Issues

**[L-1]** `getProjectStatus` may not show correct state to user

This external function will not update if the deadline has recently passed without any contributions going through. It may be confusing for users or front ends to call `getProjectStatus` and see accepting funds after the deadline, and then only when they call `contribute`, see the status update to `Failed`

Consider tweaking this function so that it takes into account whether the deadline has passed.

---

**[L-2]** Use of transfer

Your contract uses the `tranfer()` function to send ETH. Although this will 
work it is no longer the recommended approach. `Transfer()` limits the gas 
sent with the transfer call and has the potential to fail due to 
rising gas costs. `Call()` is currently the best practice way to send ETH.

For a full breakdown of why, check out [this resource](https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/)
 
For example: instead of using

```
payable(someAddress).transfer(amount);
```

The alternative, admittedly somewhat clumsy looking, recommendation is:

```
(bool success,) = payable(someAddress).call{value:amount}("");
require(success, "transfer failed"
```

Consider replacing your `transfer()` functions with `call()` to send ETH.


**[Q-1]** Uneccessary "getter" methods

`getContribution` methods is redundant because the corresponding public field `contributions` will automatically generate a solidity getter function that can be called the same way.  

**[Q-2]** Consider adding the indexed modifier to your event fields. 

See indexed here for more information: https://docs.soliditylang.org/en/latest/contracts.html#events

**[Q-3]** Long Error Messages

Long error messages cost you. Generally, try to keep error messages 
[below 32 ASCII characters](https://medium.com/@chebyk.in/how-big-is-solidity-custom-error-messages-overhead-1e915724b450).

If you feel you need longer error messages, it's best practice to store them
within your client/front end.

Instead of:

`require(
            projectStatus == State.Cancelled || projectStatus == State.Failed,
            "Project must be cancelled or failed for refunds"
        );`

Consider:

`require(
            projectStatus == State.Cancelled || projectStatus == State.Failed,
            "NO_CANCEL_FAIL"
        );`


# Nitpicks

- For `getProjectStatus` seems more useful because `projectStatus` is set to be private, but I do not see any advantage to this pattern over just making `projectStatus` itself public and getting rid of the `getProjectStatus` function.
- I wonder if perhaps you meant to have the ProjectFactory.sol `projectsMap` assign the project address as values instead of the `msg.sender`? A mapping of names to owners seems less useful to me than names to address, but maybe I'm missing something. In any case the emitted event has address and name, so that can be used by applications to associate addresses with project names. 



# Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 2 |
| Unanswered design exercise | - |
| Insufficient tests         | - |
| Technical mistake          | - |

Total: 2

Great Job!
