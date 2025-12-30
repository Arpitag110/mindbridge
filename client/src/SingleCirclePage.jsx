import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSocket } from "./SocketContext";
import {
  Settings, Users, AlertCircle, Trash2, Edit3, Flag,
  Check, X, Shield, Search
} from "lucide-react";

const getAvatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const SingleCirclePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Data State
  const [circle, setCircle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // View State
  const [activeView, setActiveView] = useState("feed");
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  // Q&A State
  const [qaTitle, setQaTitle] = useState("");
  const [qaBody, setQaBody] = useState("");
  const [showAskForm, setShowAskForm] = useState(false);

  // ADMIN STATE
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminTab, setAdminTab] = useState("overview"); // overview, requests, reports, members, settings
  const [editFormData, setEditFormData] = useState({ name: "", description: "", coverImage: "" });

  // Member modal state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedMemberEntries, setSelectedMemberEntries] = useState({ moods: [], journals: [] });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
    fetchCircleData();
    if (socket) socket.emit("joinCircle", id);
  }, [id, socket]);

  const fetchCircleData = async () => {
    try {
      const circleRes = await axios.get(`http://localhost:5000/api/circles/${id}`);
      setCircle(circleRes.data);
      setEditFormData({
        name: circleRes.data.name,
        description: circleRes.data.description,
        coverImage: circleRes.data.coverImage || ""
      });

      const postsRes = await axios.get(`http://localhost:5000/api/posts/${id}`);
      setPosts(postsRes.data);

      const qaRes = await axios.get(`http://localhost:5000/api/questions/${id}`);
      setQuestions(qaRes.data);

      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  // --- POST & NOTIFICATION LOGIC ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    try {
      const newPost = { circleId: id, userId: currentUser._id, content: postContent, isAnonymous };
      const res = await axios.post("http://localhost:5000/api/posts", newPost);
      setPosts([res.data, ...posts]);
      setPostContent("");
      setIsAnonymous(false);

      if (socket && circle) {
        socket.emit("sendCircleNotification", {
          senderId: currentUser._id,
          senderName: isAnonymous ? "Anonymous" : currentUser.username,
          circleId: id,
          type: "post",
          message: `posted in ${circle.name}`,
          members: circle.members
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleLike = async (postId, postOwnerUsername) => {
    try {
      const updatedPosts = posts.map(p => {
        if (p._id === postId) {
          const isLiked = p.likes.includes(currentUser._id);
          return { ...p, likes: isLiked ? p.likes.filter(uid => uid !== currentUser._id) : [...p.likes, currentUser._id] };
        }
        return p;
      });
      setPosts(updatedPosts);
      await axios.put(`http://localhost:5000/api/posts/${postId}/like`, { userId: currentUser._id });

      if (currentUser.username !== postOwnerUsername) {
        socket.emit("sendNotification", { senderName: currentUser.username, receiverName: postOwnerUsername, type: "like", message: "liked your post" });
      }
    } catch (err) { console.error(err); }
  };

  const handleCommentSubmit = async (postId, postOwnerUsername) => {
    if (!commentText.trim()) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/posts/${postId}/comment`, { userId: currentUser._id, text: commentText });
      setPosts(posts.map(p => p._id === postId ? res.data : p));
      setCommentText("");
      if (currentUser.username !== postOwnerUsername) {
        socket.emit("sendNotification", { senderName: currentUser.username, receiverName: postOwnerUsername, type: "comment", message: "commented on your post" });
      }
    } catch (err) { console.error(err); }
  };

  // --- ADMIN ACTIONS ---

  // 1. Manage Requests
  const handleRequestAction = async (targetUserId, action) => {
    try {
      // action = 'accept' or 'reject'
      await axios.put(`http://localhost:5000/api/circles/${id}/request`, { userId: targetUserId, action, adminId: currentUser._id });
      fetchCircleData(); // Refresh list
    } catch (err) { console.error(err); alert("Action failed"); }
  };

  // 2. Manage Members (Kick)
  const handleRemoveMember = async (targetUserId) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      await axios.put(`http://localhost:5000/api/circles/${id}/remove-member`, { userId: targetUserId, adminId: currentUser._id });
      fetchCircleData();
    } catch (err) { console.error(err); alert("Failed to remove member"); }
  };

  // 3. Manage Content (Delete/Dismiss)
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Permanently delete this post?")) return;
    try {
      const isAdmin = circle.admins.some(a => a._id === currentUser._id);
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, { data: { userId: currentUser._id, isAdmin } });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) { console.error(err); }
  };

  const handleDismissReport = async (postId) => {
    try {
      await axios.put(`http://localhost:5000/api/posts/${postId}/dismiss-reports`, { adminId: currentUser._id });
      fetchCircleData(); // Refresh to clear report flag from local data if necessary, or update posts
      const updatedPosts = posts.map(p => p._id === postId ? { ...p, reports: [] } : p);
      setPosts(updatedPosts);
    } catch (err) { console.error(err); }
  };

  // 4. Update Circle Settings
  const handleUpdateCircle = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/circles/${id}`, { userId: currentUser._id, updates: editFormData });
      setShowAdminModal(false);
      fetchCircleData();
    } catch (err) { alert("Failed update"); }
  };

  // User Actions
  const handleReportPost = async (postId) => {
    const r = prompt("Reason for reporting?");
    if (r) {
      await axios.put(`http://localhost:5000/api/posts/${postId}/report`, { userId: currentUser._id, reason: r });
      alert("Reported to admins.");
      fetchCircleData();
    }
  };

  const startEditing = (post) => { setEditingPostId(post._id); setEditPostContent(post.content); };
  const saveEditPost = async (postId) => {
    try {
      await axios.put(`http://localhost:5000/api/posts/${postId}`, { userId: currentUser._id, content: editPostContent });
      setPosts(posts.map(p => p._id === postId ? { ...p, content: editPostContent } : p));
      setEditingPostId(null);
    } catch (err) { console.error(err); }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      const newQ = { circleId: id, userId: currentUser._id, title: qaTitle, body: qaBody };
      const res = await axios.post("http://localhost:5000/api/questions", newQ);
      setQuestions([res.data, ...questions]);
      setQaTitle(""); setQaBody(""); setShowAskForm(false);

      if (socket && circle) {
        socket.emit("sendCircleNotification", {
          senderId: currentUser._id,
          senderName: currentUser.username,
          circleId: id,
          type: "question",
          message: `asked: ${qaTitle}`,
          members: circle.members
        });
      }
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!circle) return <div className="p-10 text-center">Circle not found.</div>;

  const isAdmin = currentUser && circle.admins.some(a => a._id === currentUser._id);
  const isMember = currentUser && circle.members.some(m => m._id === currentUser._id);

  // Admin Counts
  const pendingRequests = circle.pendingMembers || [];
  const reportedPosts = posts.filter(p => p.reports && p.reports.length > 0);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">

      {/* HEADER */}
      <div className="bg-white shadow-sm pb-4">
        <div className={`h-48 w-full ${circle.coverImage ? '' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
          {circle.coverImage && <img src={circle.coverImage} className="w-full h-full object-cover" />}
        </div>
        <div className="max-w-6xl mx-auto px-4 -mt-12 flex items-end justify-between mb-4">
          <div>
            <div className="bg-white p-2 rounded-2xl shadow-md inline-block">
              <div className="h-24 w-24 bg-indigo-100 rounded-xl flex items-center justify-center text-4xl overflow-hidden font-bold text-indigo-500">
                {circle.name[0]}
              </div>
            </div>
            <h1 className="text-3xl font-bold mt-2 text-gray-800">{circle.name}</h1>
          </div>
          <button onClick={() => navigate("/circles")} className="text-indigo-600 font-bold hover:underline px-2 mb-2">← Back to Circles</button>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-8 border-b">
          <button onClick={() => setActiveView("feed")} className={`pb-3 font-bold text-lg ${activeView === "feed" ? "text-indigo-600 border-b-4 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>Circle Feed</button>
          <button onClick={() => setActiveView("qa")} className={`pb-3 font-bold text-lg ${activeView === "qa" ? "text-indigo-600 border-b-4 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>Q&A Support</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* MAIN FEED / Q&A */}
        <div className="md:col-span-2 space-y-6">
          {activeView === "feed" && (
            <>
              {isMember && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-4"><img src={getAvatar(currentUser?.avatar)} className="w-10 h-10 rounded-full bg-gray-100" /><textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder={`Share something with the ${circle.name} community...`} className="w-full bg-gray-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none h-24"></textarea></div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100"><label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600"><input type="checkbox" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} className="rounded" /> 🕵️ Post anonymously</label><button onClick={handlePostSubmit} disabled={!postContent.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">Post</button></div>
                </div>
              )}

              {posts.map(post => {
                const isLiked = post.likes.includes(currentUser?._id);
                const isOwner = currentUser?._id === post.userId?._id;
                return (
                  <div key={post._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3"><img src={post.isAnonymous ? getAvatar("anon") : getAvatar(post.userId?.avatar)} className="w-10 h-10 rounded-full bg-gray-100" /><div><h4 className="font-bold text-gray-800">{post.isAnonymous ? "Anonymous" : post.userId?.username}</h4><p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p></div></div>
                      <div className="flex gap-3 text-xs">{(isOwner || isAdmin) && <><button onClick={() => handleDeletePost(post._id)} className="text-red-500 hover:underline">Delete</button> {isOwner && <button onClick={() => startEditing(post)} className="text-indigo-600">Edit</button>}</>} {!isOwner && <button onClick={() => handleReportPost(post._id)} className="text-gray-400 hover:text-red-500 flex items-center gap-1"><Flag size={14} /> Report</button>}</div>
                    </div>
                    {editingPostId === post._id ? (<div className="mb-4"><textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} className="w-full border p-2 rounded-lg" /><button onClick={() => saveEditPost(post._id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm mt-2">Save</button></div>) : (<p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p>)}
                    <div className="flex items-center gap-6 text-gray-500 text-sm border-t pt-4"><button onClick={() => handleLike(post._id, post.userId?.username)} className={`${isLiked ? "text-pink-500 font-bold" : ""}`}>{isLiked ? "❤️" : "🤍"} {post.likes.length}</button><button onClick={() => setActiveCommentBox(activeCommentBox === post._id ? null : post._id)}>💬 {post.comments.length}</button></div>
                    {activeCommentBox === post._id && (<div className="mt-4 pt-4 border-t border-gray-50">{post.comments.map((c, i) => (<div key={i} className="flex gap-2 mb-2"><img src={getAvatar(c.userId?.avatar)} className="w-6 h-6 rounded-full" /><div className="bg-gray-50 px-3 py-1 rounded-lg text-sm flex-1"><span className="font-bold mr-2">{c.userId?.username}</span>{c.text}</div></div>))}<div className="flex gap-2 mt-2"><input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(post._id, post.userId?.username)} placeholder="Write a comment..." className="flex-1 border rounded px-2 py-1 text-sm" /><button onClick={() => handleCommentSubmit(post._id, post.userId?.username)} className="text-indigo-600 text-sm font-bold">Send</button></div></div>)}
                  </div>
                );
              })}
            </>
          )}

          {activeView === "qa" && (
            <div className="space-y-6">
              {isMember && (
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                  {!showAskForm ? (
                    <button onClick={() => setShowAskForm(true)} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold border border-indigo-200 hover:shadow-md transition-all text-left px-6 flex justify-between items-center"><span>❓ Ask a question...</span> <span className="text-2xl">+</span></button>
                  ) : (
                    <form onSubmit={handleAskQuestion} className="space-y-3">
                      <input value={qaTitle} onChange={e => setQaTitle(e.target.value)} placeholder="Question Title" className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ring-indigo-200 font-bold" autoFocus />
                      <textarea value={qaBody} onChange={e => setQaBody(e.target.value)} placeholder="Description..." className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ring-indigo-200 h-24"></textarea>
                      <div className="flex gap-3"><button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Submit</button><button type="button" onClick={() => setShowAskForm(false)} className="text-gray-500 font-bold px-4">Cancel</button></div>
                    </form>
                  )}
                </div>
              )}
              {questions.map(q => (<div key={q._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="font-bold text-lg">{q.title}</h3><p className="text-gray-600">{q.body}</p></div>))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR: Info & Admin Summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-3 text-lg">About</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{circle.description}</p>
          </div>

          {/* Admin Summary Box */}
          {isAdmin && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100 bg-indigo-50/50">
              <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold">
                <Shield size={20} /> Admin Dashboard
              </div>
              <div className="space-y-3">
                <button onClick={() => { setAdminTab('requests'); setShowAdminModal(true); }} className="w-full bg-white border border-indigo-200 p-3 rounded-xl flex justify-between items-center hover:bg-indigo-50">
                  <span className="text-sm font-bold text-gray-700">Join Requests</span>
                  {pendingRequests.length > 0 && <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}
                </button>

                <button onClick={() => { setAdminTab('reports'); setShowAdminModal(true); }} className="w-full bg-white border border-indigo-200 p-3 rounded-xl flex justify-between items-center hover:bg-indigo-50">
                  <span className="text-sm font-bold text-gray-700">Flagged Content</span>
                  {reportedPosts.length > 0 ? <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{reportedPosts.length}</span> : <Check size={16} className="text-green-500" />}
                </button>

                <button onClick={() => { setAdminTab('settings'); setShowAdminModal(true); }} className="w-full text-center text-indigo-600 text-sm font-bold py-2 hover:underline">
                  Open Full Settings
                </button>
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2"><Users size={20} className="text-gray-400" /> Members</h3>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">{circle.members.length}</span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {circle.members.map(member => (
                <div key={member._id} className="flex items-center gap-3">
                  <img src={getAvatar(member.avatar)} className="w-8 h-8 rounded-full bg-gray-50" />
                  <div>
                    <p onClick={async () => {
                      // fetch visible entries for this member within the circle context
                      try {
                        const res = await axios.get(`http://localhost:5000/api/users/${member._id}/visible-entries?viewerId=${currentUser?._id}&circleId=${id}`);
                        setSelectedMember({ ...member });
                        setSelectedMemberEntries(res.data);
                        setShowMemberModal(true);
                      } catch (err) { console.error('Failed to load member entries', err); alert('Failed to load entries'); }
                    }} className="text-sm font-bold text-gray-700 cursor-pointer hover:underline">{member.username}</p>
                    {circle.admins.some(a => a._id === member._id) && <span className="text-[10px] uppercase font-bold text-indigo-500">Admin</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* --- COMPLEX ADMIN MODAL --- */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Settings className="text-indigo-600" /> Circle Administration</h2>
              <button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b">
              <button onClick={() => setAdminTab('settings')} className={`flex-1 py-3 text-sm font-bold ${adminTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>Settings</button>
              <button onClick={() => setAdminTab('requests')} className={`flex-1 py-3 text-sm font-bold ${adminTab === 'requests' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>Requests ({pendingRequests.length})</button>
              <button onClick={() => setAdminTab('reports')} className={`flex-1 py-3 text-sm font-bold ${adminTab === 'reports' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>Reports ({reportedPosts.length})</button>
              <button onClick={() => setAdminTab('members')} className={`flex-1 py-3 text-sm font-bold ${adminTab === 'members' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:bg-gray-50'}`}>Members</button>
            </div>

            {/* Modal Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white">

              {/* TAB: SETTINGS */}
              {adminTab === 'settings' && (
                <form onSubmit={handleUpdateCircle} className="space-y-4 max-w-md mx-auto mt-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Circle Name</label>
                    <input className="w-full border p-3 rounded-xl focus:ring-2 ring-indigo-200 outline-none" placeholder="Name" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                    <textarea className="w-full border p-3 rounded-xl focus:ring-2 ring-indigo-200 outline-none h-32 resize-none" placeholder="Description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cover Image URL</label>
                    <input className="w-full border p-3 rounded-xl focus:ring-2 ring-indigo-200 outline-none" placeholder="https://..." value={editFormData.coverImage} onChange={e => setEditFormData({ ...editFormData, coverImage: e.target.value })} />
                  </div>
                  <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Save Changes</button>
                </form>
              )}

              {/* TAB: REQUESTS */}
              {adminTab === 'requests' && (
                <div className="space-y-4">
                  {pendingRequests.length === 0 ? <div className="text-center text-gray-400 mt-10">No pending requests.</div> :
                    pendingRequests.map(req => (
                      <div key={req._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border">
                        <div className="flex items-center gap-3">
                          <img src={getAvatar(req.avatar)} className="w-10 h-10 rounded-full" />
                          <span className="font-bold text-gray-800">{req.username}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleRequestAction(req._id, 'accept')} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200"><Check size={18} /></button>
                          <button onClick={() => handleRequestAction(req._id, 'reject')} className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200"><X size={18} /></button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* TAB: REPORTS */}
              {adminTab === 'reports' && (
                <div className="space-y-6">
                  {reportedPosts.length === 0 ? <div className="text-center text-gray-400 mt-10">No flagged content. Safe sailing! 🛡️</div> :
                    reportedPosts.map(post => (
                      <div key={post._id} className="border border-red-100 rounded-xl p-4 bg-red-50/30">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded">Reported {post.reports.length} times</span>
                            <span className="text-xs text-gray-500">by {post.userId?.username}</span>
                          </div>
                        </div>

                        <p className="bg-white p-3 rounded-lg border text-gray-600 text-sm mb-3 italic">"{post.content}"</p>

                        <div className="bg-white p-3 rounded-lg border mb-3">
                          <p className="text-xs font-bold text-gray-500 uppercase mb-1">Reasons:</p>
                          <ul className="list-disc list-inside text-xs text-red-600">
                            {post.reports.map((r, i) => <li key={i}>{r.reason}</li>)}
                          </ul>
                        </div>

                        <div className="flex gap-3 justify-end">
                          <button onClick={() => handleDismissReport(post._id)} className="text-gray-500 text-sm font-bold hover:text-gray-700 px-3 py-2">Dismiss Reports</button>
                          <button onClick={() => handleDeletePost(post._id)} className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"><Trash2 size={16} /> Delete Post</button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* TAB: MEMBERS */}
              {adminTab === 'members' && (
                <div className="space-y-2">
                  <input type="text" placeholder="Search members..." className="w-full border p-2 rounded-lg mb-4 text-sm" />
                  {circle.members.map(member => (
                    <div key={member._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition">
                      <div className="flex items-center gap-3">
                        <img src={getAvatar(member.avatar)} className="w-10 h-10 rounded-full bg-gray-100" />
                        <div>
                          <p className="font-bold text-gray-800">{member.username}</p>
                          {circle.admins.some(a => a._id === member._id) ? <span className="text-xs text-indigo-600 font-bold">Admin</span> : <span className="text-xs text-gray-500">Member</span>}
                        </div>
                      </div>
                      {/* Don't show delete button for self or other admins if you aren't owner (simplified logic here: admins can kick non-admins) */}
                      {!circle.admins.some(a => a._id === member._id) && (
                        <button onClick={() => handleRemoveMember(member._id)} className="text-gray-400 hover:text-red-500 p-2" title="Remove Member"><Trash2 size={18} /></button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Member Entries Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-auto max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center gap-3"><img src={getAvatar(selectedMember.avatar)} className="w-10 h-10 rounded-full" /><div><div className="font-bold">{selectedMember.username}</div><div className="text-xs text-gray-500">Member</div></div></div>
              <button onClick={() => setShowMemberModal(false)} className="text-gray-500">Close</button>
            </div>
            <div className="p-4 space-y-4">
              <h3 className="font-bold">Recent Moods</h3>
              {selectedMemberEntries.moods.length === 0 ? <div className="text-sm text-gray-400">No visible moods</div> : (
                selectedMemberEntries.moods.map(m => (
                  <div key={m._id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="text-sm font-bold">Mood: {m.score}</div>
                    {m.note && <div className="text-xs text-gray-600 mt-1">{m.note}</div>}
                    <div className="text-xs text-gray-400 mt-2">{new Date(m.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}

              <h3 className="font-bold">Recent Journals</h3>
              {selectedMemberEntries.journals.length === 0 ? <div className="text-sm text-gray-400">No visible journals</div> : (
                selectedMemberEntries.journals.map(j => (
                  <div key={j._id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="font-bold">{j.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{j.content.slice(0, 200)}{j.content.length > 200 ? '...' : ''}</div>
                    <div className="text-xs text-gray-400 mt-2">{new Date(j.createdAt).toLocaleString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
export default SingleCirclePage;