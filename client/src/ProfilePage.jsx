import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUI } from "./ui/UiProvider";

// Helper for random avatars
const getAvatarUrl = (seed) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const ProfilePage = () => {
    const navigate = useNavigate();
    const { showToast } = useUI();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // --- STATE ---
    const [user, setUser] = useState({
        _id: "",
        username: "",
        email: "",
        avatar: "felix",
        bio: "",
        interests: [],
        stats: { moodCount: 0, journalCount: 0 }
    });

    const [interestInput, setInterestInput] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleting, setDeleting] = useState(false);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchProfile = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) {
                navigate("/auth");
                return;
            }

            const parsedUser = JSON.parse(storedUser);

            try {
                const res = await axios.get(`http://localhost:5000/api/users/${parsedUser._id || parsedUser.id}`);
                // Ensure interests is an array
                const userData = { ...res.data, interests: res.data.interests || [] };
                setUser(userData);
            } catch (err) {
                console.error("Error fetching profile:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    // --- HANDLERS ---
    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    // --- INTERESTS LOGIC ---
    const addInterest = () => {
        const val = interestInput.trim();
        if (val && !user.interests.includes(val)) {
            setUser({ ...user, interests: [...user.interests, val] });
            setInterestInput("");
        }
    };

    const removeInterest = (interestToRemove) => {
        setUser({
            ...user,
            interests: user.interests.filter((i) => i !== interestToRemove)
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addInterest();
        }
    };

    // --- LOGOUT LOGIC ---
    const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/auth");
    };

    // --- SAVE CHANGES ---
    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.put(`http://localhost:5000/api/users/${user._id}`, {
                username: user.username,
                bio: user.bio,
                avatar: user.avatar,
                interests: user.interests
            });

            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
            showToast("Profile updated successfully!", "success");
        } catch (err) {
            console.error("Error saving profile:", err);
            if (err.response?.data?.message) {
                showToast(err.response.data.message, "error");
            } else {
                showToast("Failed to save changes. Please try again.", "error");
            }
        } finally {
            setSaving(false);
        }
    };

    const regenerateAvatar = () => {
        const randomSeed = Math.random().toString(36).substring(7);
        setUser({ ...user, avatar: randomSeed });
    };

    // --- DELETE ACCOUNT ---
    const handleDeleteAccount = async () => {
        if (!deletePassword.trim()) {
            showToast("Please enter your password to confirm deletion", "error");
            return;
        }

        setDeleting(true);
        try {
            await axios.delete(`http://localhost:5000/api/users/${user._id}`, {
                data: { password: deletePassword }
            });

            showToast("Account deleted successfully", "success");
            localStorage.removeItem("user");
            setTimeout(() => {
                navigate("/auth");
            }, 1500);
        } catch (err) {
            console.error("Error deleting account:", err);
            if (err.response?.data?.message) {
                showToast(err.response.data.message, "error");
            } else {
                showToast("Failed to delete account. Please try again.", "error");
            }
            setDeletePassword("");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-indigo-50 text-indigo-600 font-medium">
            Loading Profile...
        </div>
    );

    return (
        <div className="min-h-screen bg-indigo-50 font-sans p-4 md:p-8">

            {/* Header */}
            <div className="max-w-3xl mx-auto flex items-center justify-between mb-8">
                <button onClick={() => navigate("/home")} className="text-gray-500 hover:text-indigo-600 transition-colors">
                    ← Back to Home
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Edit Profile</h1>
                <div className="w-20"></div> {/* Spacer */}
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden mb-10">

                {/* Banner */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center relative">
                    <div className="relative inline-block group">
                        <img
                            src={getAvatarUrl(user.avatar)}
                            alt="Avatar"
                            className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white"
                        />
                        <button
                            onClick={regenerateAvatar}
                            className="absolute bottom-1 right-1 bg-white text-indigo-600 p-2 rounded-full shadow-md hover:bg-gray-100 transition-transform hover:scale-110"
                            title="New Random Avatar"
                        >
                            🔄
                        </button>
                    </div>
                    <p className="text-indigo-100 mt-2 text-sm">Click icon to randomize look</p>
                </div>

                {/* Notification */}
                {message && (
                    <div className={`text-center py-3 px-4 text-sm font-semibold ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="p-8 space-y-8">

                    {/* 1. Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
                            <div className="text-2xl font-bold text-orange-600">{user.stats.moodCount}</div>
                            <div className="text-xs text-orange-400 font-bold uppercase tracking-wide">Moods Logged</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                            <div className="text-2xl font-bold text-blue-600">{user.stats.journalCount}</div>
                            <div className="text-xs text-blue-400 font-bold uppercase tracking-wide">Entries</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-2xl text-center border border-green-100">
                            <div className="text-2xl font-bold text-green-600">Active</div>
                            <div className="text-xs text-green-400 font-bold uppercase tracking-wide">Status</div>
                        </div>
                    </div>

                    {/* 2. Identity */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Identity</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={user.username}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all font-semibold text-gray-700"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
                            <textarea
                                name="bio"
                                value={user.bio}
                                onChange={handleChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-300 focus:outline-none transition-all h-28 resize-none"
                                placeholder="Tell your circle a bit about yourself..."
                            ></textarea>
                        </div>
                    </div>

                    {/* 3. Interests */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Interests & Hobbies</h3>
                        <p className="text-sm text-gray-500">Add tags to help us find Circles that match your vibe.</p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="e.g. Anxiety, Yoga, Gaming..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                            />
                            <button
                                onClick={addInterest}
                                className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                            >
                                Add
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {user.interests.length === 0 && (
                                <span className="text-gray-400 text-sm italic">No interests added yet.</span>
                            )}
                            {user.interests.map((interest, index) => (
                                <div key={index} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 animate-fade-in">
                                    {interest}
                                    <button
                                        onClick={() => removeInterest(interest)}
                                        className="text-indigo-400 hover:text-indigo-900 w-4 h-4 flex items-center justify-center rounded-full"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={`w-full text-white font-bold text-lg py-4 rounded-2xl shadow-lg transition-all transform hover:-translate-y-1 active:scale-95
              ${saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </button>

                    {/* 5. ACCOUNT ACTIONS */}
                    <div className="mt-8 pt-8 border-t border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4">Account Actions</h4>

                        <div className="flex flex-col gap-3">
                            {/* LOGOUT BUTTON */}
                            <button
                                onClick={handleLogout}
                                className="w-full bg-white border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all"
                            >
                                Log Out
                            </button>

                            {/* DELETE ACCOUNT (Secondary Action) */}
                            <button 
                                onClick={() => setShowDeleteModal(true)}
                                className="text-red-400 hover:text-red-600 text-sm font-medium py-2 transition-colors"
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* DELETE ACCOUNT MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-800">Delete Account</h3>
                        <p className="text-gray-600 text-sm">
                            This action cannot be undone. All your data, including moods, journals, and posts will be permanently deleted.
                        </p>
                        <p className="text-gray-700 font-medium text-sm">
                            Please enter your password to confirm:
                        </p>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-300 focus:outline-none transition-all"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && deletePassword.trim()) {
                                    handleDeleteAccount();
                                }
                            }}
                        />
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setDeletePassword("");
                                }}
                                disabled={deleting}
                                className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || !deletePassword.trim()}
                                className="flex-1 bg-red-600 text-white font-medium py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deleting ? "Deleting..." : "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
