// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title TodoApp
 * @dev A simple Todo dApp smart contract where each user manages their own todo list.
 */
contract TodoApp {
    
    // Structure to define a todo item
    struct Todo {
        uint256 id;
        string text;
        bool completed;
    }

    // Mapping from user address to their list of todos
    mapping(address => Todo[]) private userTodos;

    // Counter for unique todo IDs
    uint256 private nextId;

    // Events to log activities on the blockchain
    event TodoCreated(address indexed user, uint256 id, string text);
    event TodoToggled(address indexed user, uint256 id, bool completed);
    event TodoDeleted(address indexed user, uint256 id);

    /**
     * @dev Adds a new todo item to the caller's list.
     * @param _text The text description of the todo.
     */
    function addTodo(string calldata _text) external {
        require(bytes(_text).length > 0, "Text cannot be empty");

        // Create a new todo item
        Todo memory newTodo = Todo({
            id: nextId,
            text: _text,
            completed: false
        });

        // Add it to the user's list
        userTodos[msg.sender].push(newTodo);

        // Emit an event
        emit TodoCreated(msg.sender, nextId, _text);

        // Increment the ID counter for the next todo
        nextId++;
    }

    /**
     * @dev Toggles the completed status of a todo item.
     * @param _id The unique ID of the todo item to toggle.
     */
    function toggleTodo(uint256 _id) external {
        Todo[] storage todos = userTodos[msg.sender];
        
        // Find the todo item with the matching ID
        for (uint256 i = 0; i < todos.length; i++) {
            if (todos[i].id == _id) {
                // Toggle the completed status
                todos[i].completed = !todos[i].completed;
                emit TodoToggled(msg.sender, _id, todos[i].completed);
                return;
            }
        }
        
        revert("Todo not found");
    }

    /**
     * @dev Deletes a todo item from the caller's list.
     * @param _id The unique ID of the todo item to delete.
     */
    function deleteTodo(uint256 _id) external {
        Todo[] storage todos = userTodos[msg.sender];
        
        // Find the todo item with the matching ID
        for (uint256 i = 0; i < todos.length; i++) {
            if (todos[i].id == _id) {
                // To delete efficiently, replace the item with the last item in the array
                // and then pop the last item. This changes the order but is gas efficient.
                // Note: The ID of the moved item remains the same, so referencing by ID still works.
                todos[i] = todos[todos.length - 1];
                todos.pop();
                
                emit TodoDeleted(msg.sender, _id);
                return;
            }
        }
        
        revert("Todo not found");
    }

    /**
     * @dev Returns all todo items for the caller.
     * @return An array of Todo structs belonging to the caller.
     */
    function getTodos() external view returns (Todo[] memory) {
        return userTodos[msg.sender];
    }
}
