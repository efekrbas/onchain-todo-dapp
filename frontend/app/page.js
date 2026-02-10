"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/utils/contract";
import { Trash2, Check, Wallet, Plus, Loader2 } from "lucide-react";
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
    const [isConnecting, setIsConnecting] = useState(false);

    // Connect Wallet
    const connectWallet = async () => {
        if (window.ethereum) {
            setIsConnecting(true);
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();

                // Check Network (Sepolia)
                const network = await provider.getNetwork();
                if (network.chainId !== 11155111n) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: "0xaa36a7" }],
                        });
                    } catch (switchError) {
                        if (switchError.code === 4902) {
                            alert("Please add Sepolia network to MetaMask");
                        } else {
                            alert("Please switch to Sepolia network");
                        }
                        setIsConnecting(false);
                        return;
                    }
                }

                setAccount(address);
                localStorage.setItem("connectedWith", "metamask");

                const todoContract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );
                setContract(todoContract);
            } catch (error) {
                console.error("Connection failed", error);
                alert("Failed to connect wallet.");
            } finally {
                setIsConnecting(false);
            }
        } else {
            alert("Please install MetaMask!");
        }
    };

    // Auto Connect
    useEffect(() => {
        const checkConnection = async () => {
            if (localStorage.getItem("connectedWith") === "metamask") {
                await connectWallet();
            }
        };
        checkConnection();
    }, []);

    // Fetch Todos
    const fetchTodos = async () => {
        if (contract) {
            setLoading(true);
            try {
                const data = await contract.getTodos();
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
            if (error.code === 4001 || error.code === "ACTION_REJECTED") {
                console.warn("Transaction rejected by user");
                return;
            }
            console.error("Error adding todo", error);
            alert("Failed to add todo. See console for details.");
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
            if (error.code === 4001 || error.code === "ACTION_REJECTED") {
                console.warn("Transaction rejected by user");
                return;
            }
            console.error("Error toggling todo", error);
            alert("Failed to toggle todo. See console for details.");
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
            if (error.code === 4001 || error.code === "ACTION_REJECTED") {
                console.warn("Transaction rejected by user");
                return;
            }
            console.error("Error deleting todo", error);
            alert("Failed to delete todo. See console for details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 font-sans selection:bg-blue-500/30">

            {/* Main Container - Glassmorphism */}
            <div className="w-full max-w-[800px] bg-black/40 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] overflow-hidden relative">

                {/* Glow Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 blur-sm"></div>
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 p-8 sm:p-12">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-16">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Check size={18} className="text-white stroke-[3]" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-white tracking-tight">
                                OnChain<span className="text-gray-400 font-light">Todo</span>
                            </h1>
                        </div>

                        {!account ? (
                            <button
                                onClick={connectWallet}
                                disabled={isConnecting}
                                className="group relative px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:border-blue-500/30 active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                <div className="flex items-center gap-2 relative z-10">
                                    {isConnecting ? (
                                        <Loader2 size={16} className="animate-spin text-blue-400" />
                                    ) : (
                                        <Wallet size={16} className="text-blue-400 group-hover:text-blue-300 transition-colors" />
                                    )}
                                    <span className="text-sm font-medium text-blue-100 group-hover:text-white transition-colors">
                                        {isConnecting ? "Connecting..." : "Connect Wallet"}
                                    </span>
                                </div>
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </div>
                                <span className="text-xs font-mono text-gray-400 tracking-wide">
                                    {account.slice(0, 6)}...{account.slice(-4)}
                                </span>
                            </div>
                        )}
                    </header>

                    {/* Hero / Input Section */}
                    <div className="mb-14">
                        {account ? (
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                                <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl focus-within:border-blue-500/50 focus-within:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Create a new task..."
                                        className="flex-1 bg-transparent text-white placeholder-gray-500 pl-6 pr-4 py-4 text-lg focus:outline-none"
                                        style={{ color: 'white' }}
                                        onKeyDown={(e) => e.key === "Enter" && addTodo()}
                                    />
                                    <button
                                        onClick={addTodo}
                                        disabled={loading || !input.trim()}
                                        className="p-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:hover:bg-blue-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95"
                                    >
                                        {loading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <Plus size={20} strokeWidth={2.5} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 px-6 rounded-2xl bg-white/5 border border-dashed border-white/10">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-800 to-black flex items-center justify-center border border-white/5 shadow-inner">
                                    <Wallet size={32} className="text-gray-600" />
                                </div>
                                <h3 className="text-xl font-medium text-white mb-2">Connect to Start</h3>
                                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                                    Connect your wallet to manage your decentralized tasks securely on the blockchain.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Task List */}
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {account && todos.length > 0 ? (
                            todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className="group relative bg-[#111] hover:bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 flex items-center gap-6 transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                                >
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        disabled={loading}
                                        className={cn(
                                            "flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300",
                                            todo.completed
                                                ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                                : "border-gray-600 text-transparent hover:border-blue-500"
                                        )}
                                    >
                                        <Check size={14} strokeWidth={3} className={cn("transition-transform", todo.completed ? "scale-100" : "scale-0")} />
                                    </button>

                                    <span
                                        className={cn(
                                            "flex-1 text-base leading-none transition-all duration-300",
                                            todo.completed ? "text-gray-500 line-through decoration-gray-700" : "text-gray-200"
                                        )}
                                    >
                                        {todo.text}
                                    </span>

                                    <button
                                        onClick={() => deleteTodo(todo.id)}
                                        disabled={loading}
                                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        ) : account ? (
                            <div className="text-center py-10">
                                <p className="text-gray-500 text-sm">No tasks found. Add one above! ✨</p>
                            </div>
                        ) : null}
                    </div>

                </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 text-center">
                <p className="font-mono text-[10px] text-gray-500 tracking-[0.2em] opacity-60">
                    POWERED BY SEPOLIA TESTNET
                </p>
            </footer>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
        </main>
    );
}
