"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/utils/contract";
import { Trash2, CheckCircle, Circle, RefreshCw, Wallet } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export default function Home() {
    const [account, setAccount] = useState(null);
    const [todos, setTodos] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [contract, setContract] = useState(null);

    // Connect Wallet
    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();

                // Check Network
                const network = await provider.getNetwork();
                if (network.chainId !== 11155111n) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: "0xaa36a7" }],
                        });
                    } catch (switchError) {
                        // This error code indicates that the chain has not been added to MetaMask.
                        if (switchError.code === 4902) {
                            alert("Please add Sepolia network to MetaMask");
                        } else {
                            alert("Please switch to Sepolia network");
                        }
                        return;
                    }
                }

                setAccount(address);

                const todoContract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );
                setContract(todoContract);
            } catch (error) {
                console.error("Connection failed", error);
                alert("Failed to connect wallet.");
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    // Fetch Todos
    const fetchTodos = async () => {
        if (contract) {
            setLoading(true);
            try {
                const data = await contract.getTodos();
                // data is a Struct, need to format it
                const formattedTodos = data.map((todo) => ({
                    id: Number(todo.id),
                    text: todo.text,
                    completed: todo.completed,
                }));
                setTodos(formattedTodos);
            } catch (error) {
                console.error("Error fetching todos", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (contract) {
            fetchTodos();
        }
    }, [contract]);

    // Add Todo
    const addTodo = async () => {
        if (!contract || !input.trim()) return;
        setLoading(true);
        try {
            const tx = await contract.addTodo(input);
            await tx.wait();
            setInput("");
            await fetchTodos();
        } catch (error) {
            console.error("Error adding todo", error);
            alert("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    // Toggle Todo
    const toggleTodo = async (id) => {
        if (!contract) return;
        setLoading(true);
        try {
            const tx = await contract.toggleTodo(id);
            await tx.wait();
            await fetchTodos();
        } catch (error) {
            console.error("Error toggling todo", error);
        } finally {
            setLoading(false);
        }
    };

    // Delete Todo
    const deleteTodo = async (id) => {
        if (!contract) return;
        if (!confirm("Are you sure you want to delete this todo?")) return;
        setLoading(true);
        try {
            const tx = await contract.deleteTodo(id);
            await tx.wait();
            await fetchTodos();
        } catch (error) {
            console.error("Error deleting todo", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-md">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        OnChain Todo
                    </h1>
                    {!account ? (
                        <button
                            onClick={connectWallet}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full font-medium transition-all"
                        >
                            <Wallet size={18} /> Connect
                        </button>
                    ) : (
                        <div className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-400 border border-gray-700">
                            {account.slice(0, 6)}...{account.slice(-4)}
                        </div>
                    )}
                </div>

                {/* Input */}
                {account && (
                    <div className="flex gap-2 mb-8">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="What needs to be done?"
                            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                            onKeyDown={(e) => e.key === "Enter" && addTodo()}
                        />
                        <button
                            onClick={addTodo}
                            disabled={loading || !input.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 rounded-xl font-medium transition-all"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : "Add"}
                        </button>
                    </div>
                )}

                {/* List */}
                <div className="space-y-3">
                    {account ? (
                        todos.length > 0 ? (
                            todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className="group bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between hover:border-gray-700 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleTodo(todo.id)}
                                            disabled={loading}
                                            className={cn(
                                                "text-gray-500 hover:text-blue-400 transition-colors",
                                                todo.completed && "text-green-500 hover:text-green-400"
                                            )}
                                        >
                                            {todo.completed ? <CheckCircle /> : <Circle />}
                                        </button>
                                        <span
                                            className={cn(
                                                "text-lg",
                                                todo.completed && "line-through text-gray-500"
                                            )}
                                        >
                                            {todo.text}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        disabled={loading}
                                        className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-10">
                                No todos found. Add one to get started!
                            </div>
                        )
                    ) : (
                        <div className="text-center text-gray-500 py-10 bg-gray-900/50 rounded-xl border border-gray-800 border-dashed">
                            Please connect your wallet to view your todos.
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
