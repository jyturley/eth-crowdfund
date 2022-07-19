//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Project is ERC721 {
    address public immutable owner;
    uint256 public immutable ethFundGoal;

    uint256 public currentFunding;

    // This is when the project will be finalized.
    uint256 public immutable endTime;

    // Tracks the supply of the badges for project
    uint256 private tokenIds;

    mapping(address => uint256) public contributions;
    mapping(address => uint256) public mintedSoFar;
    mapping(address => bool) public refunded;

    enum State {
        AcceptingFunds,
        Cancelled,
        Failed,
        Succeeded
    }
    State private projectStatus;

    event ProjectContribution(address contributor, uint256 amount);
    event ProjectWithdraw(uint256 amount, uint256 fundsLeft);
    event ProjectCancelled();
    event NewBadgeAwarded(address contributor, uint256 tokenId);
    event ProjectRefund(address refunder, uint256 refundAmount);

    constructor(
        string memory _projectName,
        address _owner,
        uint _ethFundGoal
    ) ERC721(_projectName, "CFB") {
        require(_ethFundGoal >= 0.01 ether, "Invalid fund goal");
        require(bytes(_projectName).length != 0, "Invalid project name");
        require(_owner != address(0));
        owner = _owner;
        ethFundGoal = _ethFundGoal;
        currentFunding = 0;
        endTime = block.timestamp + 30 days;
        projectStatus = State.AcceptingFunds;
    }

    function refund() external payable {
        checkFailed();
        require(
            projectStatus == State.Cancelled || projectStatus == State.Failed,
            "Project must be cancelled or failed for refunds"
        );
        require(!refunded[msg.sender], "Cannot refund multiple times");
        uint256 refundAmount = contributions[msg.sender];
        refunded[msg.sender] = true;
        emit ProjectRefund(msg.sender, refundAmount);
        payable(msg.sender).transfer(refundAmount);
    }

    function contribute() external payable {
        checkFailed();
        uint256 minContribution = 0.01 ether;
        require(
            msg.value >= minContribution,
            "Minimum contribution is 0.01 eth"
        );
        require(
            projectStatus == State.AcceptingFunds,
            "Project is not active."
        );
        contributions[msg.sender] += msg.value;
        currentFunding += msg.value;
        if (currentFunding >= ethFundGoal) {
            projectStatus = State.Succeeded;
        }

        emit ProjectContribution(msg.sender, msg.value);
    }

    function getContribution(address _contributor)
        external
        view
        returns (uint256)
    {
        return contributions[_contributor];
    }

    function withdrawFinishedProject(uint256 _amount) external payable {
        checkFailed();
        require(
            msg.sender == owner,
            "Only owners can withdraw from finished project."
        );
        require(
            projectStatus == State.Succeeded,
            "Project must be successful for owner to withdraw."
        );
        require(
            _amount <= currentFunding,
            "Cannot withdraw more than what is in the project."
        );
        require(_amount > 0, "Cannot withdraw zero.");
        currentFunding -= _amount;
        emit ProjectWithdraw(_amount, currentFunding);
        payable(msg.sender).transfer(_amount);
    }

    function mint() external payable {
        require(
            contributions[msg.sender] - (mintedSoFar[msg.sender] * 1 ether) >=
                1 ether,
            "Only addresses that contribute more than 1ETH can receive badges"
        );

        mintedSoFar[msg.sender] += 1;
        uint256 newId = awardBadge(msg.sender);
        emit NewBadgeAwarded(msg.sender, newId);
    }

    function cancelProject() external {
        checkFailed();
        require(
            msg.sender == owner,
            "Only project creators can cancel projects."
        );
        require(
            currentFunding <= ethFundGoal,
            "Fully funded projects cannot be cancelled."
        );
        require(
            block.timestamp <= endTime,
            "Cannot cancel a project if more than 30 days have passed"
        );
        require(
            projectStatus == State.AcceptingFunds,
            "Can only cancel an active project accepting funds."
        );

        projectStatus = State.Cancelled;
        emit ProjectCancelled();
    }

    function getProjectStatus() external view returns (State) {
        return projectStatus;
    }

    function checkFailed() private {
        if (
            block.timestamp > endTime && projectStatus == State.AcceptingFunds
        ) {
            projectStatus = State.Failed;
        }
    }

    function awardBadge(address contributor) private returns (uint256) {
        tokenIds++;
        uint256 newItemId = tokenIds;
        _safeMint(contributor, newItemId);

        return newItemId;
    }
}
