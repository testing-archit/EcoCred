import { useEffect, useState, useCallback } from 'react';
import { Loader2, Plus, Vote, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useBlockchain } from '../hooks/useBlockchain';
import { useWallet } from '../contexts/WalletContext';
import { useNotifications } from '../contexts/NotificationContext';
import { ethers } from 'ethers';

interface Proposal {
    id: number;
    description: string;
    proposer: string;
    votesFor: bigint;
    votesAgainst: bigint;
    deadline: bigint;
    executed: boolean;
    status: string;
}

export function Governance() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [votingId, setVotingId] = useState<number | null>(null);
    const [executingId, setExecutingId] = useState<number | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { isAuthenticated, user } = useUser();
    const { address } = useWallet();
    const { addNotification } = useNotifications();
    const {
        getProposalCount,
        getProposal,
        createProposal,
        voteOnProposal,
        executeProposal,
        hasVoted,
        getVotingPeriod
    } = useBlockchain();

    const [description, setDescription] = useState('');
    const [targetAddress, setTargetAddress] = useState('');
    const [proposalData, setProposalData] = useState('');

    const loadProposals = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const count = await getProposalCount();
            const proposalsList: Proposal[] = [];

            // Load all proposals
            for (let i = 1; i <= count; i++) {
                try {
                    const proposal = await getProposal(i);
                    if (proposal) {
                        const deadline = Number(proposal.deadline) * 1000; // Convert to milliseconds
                        const now = Date.now();
                        const isActive = now < deadline && !proposal.executed;
                        const hasPassed = Number(proposal.votesFor) > Number(proposal.votesAgainst) && now >= deadline;
                        
                        proposalsList.push({
                            id: i,
                            description: proposal.description,
                            proposer: proposal.proposer,
                            votesFor: proposal.votesFor,
                            votesAgainst: proposal.votesAgainst,
                            deadline: proposal.deadline,
                            executed: proposal.executed,
                            status: proposal.executed
                                ? 'Executed'
                                : hasPassed
                                ? 'Passed'
                                : isActive
                                ? 'Active'
                                : Number(proposal.votesAgainst) >= Number(proposal.votesFor)
                                ? 'Rejected'
                                : 'Ended'
                        });
                    }
                } catch (error) {
                    console.error(`Failed to load proposal ${i}:`, error);
                }
            }

            // Sort by ID descending (newest first)
            proposalsList.sort((a, b) => b.id - a.id);
            setProposals(proposalsList);
        } catch (error) {
            console.error('Failed to load proposals:', error);
            addNotification('error', 'Failed to load proposals from blockchain');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated, getProposalCount, getProposal, addNotification]);

    useEffect(() => {
        loadProposals();
    }, [loadProposals]);

    function getStatusColor(status: string) {
        switch (status) {
            case 'Active':
                return 'bg-blue-100 text-blue-800';
            case 'Passed':
                return 'bg-green-100 text-green-800';
            case 'Rejected':
                return 'bg-red-100 text-red-800';
            case 'Executed':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    function formatTimeRemaining(deadline: bigint) {
        const deadlineMs = Number(deadline) * 1000; // Convert from seconds to milliseconds
        const now = Date.now();
        if (now > deadlineMs) return 'Ended';

        const diff = deadlineMs - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) return `${days}d ${hours}h remaining`;
        return `${hours}h remaining`;
    }

    async function handleCreateProposal() {
        if (!description.trim()) {
            addNotification('error', 'Please enter a proposal description');
            return;
        }

        setCreating(true);
        try {
            const target = targetAddress || '0x0000000000000000000000000000000000000000'; // Default to zero address if not provided
            const data = proposalData || '';
            
            await createProposal(description, target, data);
            setDescription('');
            setTargetAddress('');
            setProposalData('');
            setShowCreateModal(false);
            await loadProposals();
        } catch (error) {
            console.error('Failed to create proposal:', error);
        } finally {
            setCreating(false);
        }
    }

    async function handleVote(proposalId: number, support: boolean) {
        if (!address) {
            addNotification('error', 'Please connect your wallet to vote');
            return;
        }

        setVotingId(proposalId);
        try {
            const alreadyVoted = await hasVoted(proposalId, address);
            if (alreadyVoted) {
                addNotification('error', 'You have already voted on this proposal');
                return;
            }

            await voteOnProposal(proposalId, support);
            await loadProposals();
        } catch (error) {
            console.error('Failed to vote:', error);
        } finally {
            setVotingId(null);
        }
    }

    async function handleExecute(proposalId: number) {
        setExecutingId(proposalId);
        try {
            await executeProposal(proposalId);
            await loadProposals();
        } catch (error) {
            console.error('Failed to execute proposal:', error);
        } finally {
            setExecutingId(null);
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Governance</h1>
                    <p className="mt-2 text-secondary-600">
                        Vote on proposals to shape the future of EcoCred.
                    </p>
                </div>

                <button
                    className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={20} />
                    New Proposal
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={40} className="animate-spin text-primary-600" />
                </div>
            ) : proposals.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-secondary-200">
                    <Vote size={48} className="mx-auto text-secondary-400 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900">No proposals yet</h3>
                    <p className="text-secondary-500 mt-1">Be the first to create a proposal!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {proposals.map((proposal) => {
                        const votesForNum = Number(proposal.votesFor);
                        const votesAgainstNum = Number(proposal.votesAgainst);
                        const totalVotes = votesForNum + votesAgainstNum;
                        const forPercentage = totalVotes > 0 ? (votesForNum / totalVotes) * 100 : 0;
                        const againstPercentage = totalVotes > 0 ? (votesAgainstNum / totalVotes) * 100 : 0;
                        const votesForFormatted = ethers.formatEther(proposal.votesFor);
                        const votesAgainstFormatted = ethers.formatEther(proposal.votesAgainst);

                        return (
                            <div key={proposal.id} className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold text-secondary-900">#{proposal.id}</span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                                            {proposal.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-secondary-500">
                                        <Clock size={16} className="mr-1" />
                                        {formatTimeRemaining(proposal.deadline)}
                                    </div>
                                </div>

                                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                                    {proposal.description}
                                </h3>

                                <div className="flex items-center text-sm text-secondary-500 mb-6">
                                    <span className="mr-2">Proposer:</span>
                                    <span className="font-mono bg-secondary-100 px-2 py-0.5 rounded text-secondary-700">
                                        {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                                    </span>
                                </div>

                                {/* Voting Progress */}
                                <div className="space-y-3 mb-6">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-green-700">For</span>
                                            <span className="text-secondary-600">{parseFloat(votesForFormatted).toFixed(2)} Votes</span>
                                        </div>
                                        <div className="w-full bg-secondary-100 rounded-full h-2.5">
                                            <div
                                                className="bg-green-500 h-2.5 rounded-full"
                                                style={{ width: `${forPercentage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-red-700">Against</span>
                                            <span className="text-secondary-600">{parseFloat(votesAgainstFormatted).toFixed(2)} Votes</span>
                                        </div>
                                        <div className="w-full bg-secondary-100 rounded-full h-2.5">
                                            <div
                                                className="bg-red-500 h-2.5 rounded-full"
                                                style={{ width: `${againstPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                {proposal.status === 'Active' ? (
                                    <div className="flex gap-4 pt-4 border-t border-secondary-100">
                                        <button
                                            onClick={() => handleVote(proposal.id, true)}
                                            className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded px-4 py-2 flex justify-center items-center gap-2 transition-colors"
                                            disabled={votingId === proposal.id || !address}
                                        >
                                            {votingId === proposal.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <CheckCircle size={18} />
                                                    Vote For
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => handleVote(proposal.id, false)}
                                            className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded px-4 py-2 flex justify-center items-center gap-2 transition-colors"
                                            disabled={votingId === proposal.id || !address}
                                        >
                                            {votingId === proposal.id ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <XCircle size={18} />
                                                    Vote Against
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ) : proposal.status === 'Passed' && !proposal.executed ? (
                                    <div className="pt-4 border-t border-secondary-100">
                                        <button
                                            onClick={() => handleExecute(proposal.id)}
                                            disabled={executingId === proposal.id || !address}
                                            className="w-full bg-purple-600 text-white hover:bg-purple-700 rounded px-4 py-2 flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                                        >
                                            {executingId === proposal.id ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    Executing...
                                                </>
                                            ) : (
                                                'Execute Proposal'
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-secondary-100 text-center text-secondary-500 text-sm">
                                        {proposal.executed ? 'Proposal has been executed' : 'Voting has ended'}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Proposal Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div
                            className="fixed inset-0 bg-secondary-900 bg-opacity-75 transition-opacity"
                            onClick={() => setShowCreateModal(false)}
                        />

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-secondary-900 mb-4">
                                    Create New Proposal
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-secondary-700">
                                            Description *
                                        </label>
                                        <textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={4}
                                            className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                            placeholder="Describe your proposal..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="target" className="block text-sm font-medium text-secondary-700">
                                            Target Address (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            id="target"
                                            value={targetAddress}
                                            onChange={(e) => setTargetAddress(e.target.value)}
                                            className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                                            placeholder="0x..."
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="data" className="block text-sm font-medium text-secondary-700">
                                            Calldata (Optional)
                                        </label>
                                        <textarea
                                            id="data"
                                            value={proposalData}
                                            onChange={(e) => setProposalData(e.target.value)}
                                            rows={2}
                                            className="mt-1 block w-full border-secondary-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border font-mono"
                                            placeholder="0x..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-secondary-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                                <button
                                    type="button"
                                    onClick={handleCreateProposal}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:w-auto sm:text-sm disabled:opacity-50"
                                    disabled={creating || !address}
                                >
                                    {creating ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin mr-2" />
                                            Processing...
                                        </>
                                    ) : (
                                        'Create Proposal'
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-secondary-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-secondary-700 hover:bg-secondary-50 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
