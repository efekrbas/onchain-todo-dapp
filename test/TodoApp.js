const {
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TodoApp", function () {
    async function deployTodoFixture() {
        const [owner, otherAccount] = await ethers.getSigners();
        const TodoApp = await ethers.getContractFactory("TodoApp");
        const todoApp = await TodoApp.deploy();
        return { todoApp, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should start with empty todos", async function () {
            const { todoApp } = await loadFixture(deployTodoFixture);
            const todos = await todoApp.getTodos();
            expect(todos.length).to.equal(0);
        });
    });

    describe("Todos", function () {
        it("Should add a todo", async function () {
            const { todoApp, owner } = await loadFixture(deployTodoFixture);
            const todoText = "Buy groceries";

            await expect(todoApp.addTodo(todoText))
                .to.emit(todoApp, "TodoCreated")
                .withArgs(owner.address, 0, todoText);

            const todos = await todoApp.getTodos();
            expect(todos.length).to.equal(1);
            expect(todos[0].text).to.equal(todoText);
            expect(todos[0].completed).to.be.false;
            expect(todos[0].id).to.equal(0);
        });

        it("Should toggle todo completion", async function () {
            const { todoApp, owner } = await loadFixture(deployTodoFixture);

            await todoApp.addTodo("Learn Solidity");

            await expect(todoApp.toggleTodo(0))
                .to.emit(todoApp, "TodoToggled")
                .withArgs(owner.address, 0, true);

            const todos = await todoApp.getTodos();
            expect(todos[0].completed).to.be.true;

            await expect(todoApp.toggleTodo(0))
                .to.emit(todoApp, "TodoToggled")
                .withArgs(owner.address, 0, false);

            const todosAfter = await todoApp.getTodos();
            expect(todosAfter[0].completed).to.be.false;
        });

        it("Should delete a todo", async function () {
            const { todoApp, owner } = await loadFixture(deployTodoFixture);

            await todoApp.addTodo("Task 1");
            await todoApp.addTodo("Task 2");

            await expect(todoApp.deleteTodo(0))
                .to.emit(todoApp, "TodoDeleted")
                .withArgs(owner.address, 0);

            const todos = await todoApp.getTodos();
            expect(todos.length).to.equal(1);

            expect(todos[0].text).to.equal("Task 2");
            expect(todos[0].id).to.equal(1);
        });
    });
});
