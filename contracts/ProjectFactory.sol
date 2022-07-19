//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "./Project.sol";

contract ProjectFactory {
    mapping(string => address) private projectsMap;

    event ProjectCreated(address newProject, string projectName, uint256 goal);

    function create(string memory _name, uint256 _goal) external {
        require(projectsMap[_name] == address(0), "Project name already taken");
        Project project = new Project(_name, msg.sender, _goal);

        projectsMap[_name] = msg.sender;

        emit ProjectCreated(address(project), _name, _goal);
    }
}
