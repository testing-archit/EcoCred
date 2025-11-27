import { useEffect, useState } from 'react';
import { Loader2, User, Building, Mail, Wallet, Edit2, Save, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useWallet } from '../contexts/WalletContext';


export function Profile() {
    const { user, updateProfile } = useUser();
    const { address, formatAddress } = useWallet();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        companyName: '',
        industry: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                companyName: user.companyName || '',
                industry: user.industry || ''
            });
        }
    }, [user]);

    async function handleSave() {
        setLoading(true);
        try {
            await updateProfile(formData);
            setEditing(false);
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleCancel() {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                companyName: user.companyName || '',
                industry: user.industry || ''
            });
        }
        setEditing(false);
    }

    if (!user) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-secondary-200">
                    <User size={48} className="mx-auto text-secondary-400 mb-4" />
                    <h3 className="text-lg font-medium text-secondary-900">Not logged in</h3>
                    <p className="text-secondary-500 mt-1">Please connect your wallet to view your profile</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900">Profile</h1>
                    <p className="mt-2 text-secondary-600">Manage your account settings and information.</p>
                </div>

                {!editing ? (
                    <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
                    >
                        <Edit2 size={20} />
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="flex items-center gap-2 bg-secondary-200 text-secondary-700 px-4 py-2 rounded hover:bg-secondary-300 transition-colors disabled:opacity-50"
                        >
                            <X size={20} />
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden mb-6">
                <div className="p-6 border-b border-secondary-200">
                    <h2 className="text-lg font-semibold text-secondary-900">Personal Information</h2>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <User size={16} className="inline mr-2" />
                            Name
                        </label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        ) : (
                            <p className="text-secondary-900">{user.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <Mail size={16} className="inline mr-2" />
                            Email
                        </label>
                        {editing ? (
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                        ) : (
                            <p className="text-secondary-900">{user.email || 'Not provided'}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-secondary-700 mb-2">
                            <Wallet size={16} className="inline mr-2" />
                            Wallet Address
                        </label>
                        <p className="text-secondary-900 font-mono text-sm">
                            {address ? formatAddress(address) : 'Not connected'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Company Information */}
            {user.role === 'COMPANY_ADMIN' && (
                <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden mb-6">
                    <div className="p-6 border-b border-secondary-200">
                        <h2 className="text-lg font-semibold text-secondary-900">Company Information</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                <Building size={16} className="inline mr-2" />
                                Company Name
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                            ) : (
                                <p className="text-secondary-900">{user.companyName || 'Not provided'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                                Industry
                            </label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={formData.industry}
                                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full px-4 py-2 border border-secondary-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                                />
                            ) : (
                                <p className="text-secondary-900">{user.industry || 'Not provided'}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Account Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 overflow-hidden">
                <div className="p-6 border-b border-secondary-200">
                    <h2 className="text-lg font-semibold text-secondary-900">Account Statistics</h2>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{user.totalCredits || 0}</p>
                            <p className="text-sm text-secondary-500">Total Credits</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{user.totalActions || 0}</p>
                            <p className="text-sm text-secondary-500">Eco Actions</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{user.badgesEarned || 0}</p>
                            <p className="text-sm text-secondary-500">Badges</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">#{user.ranking || 'N/A'}</p>
                            <p className="text-sm text-secondary-500">Ranking</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
