import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const getAvatar = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const SingleCirclePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Data State
  const [circle, setCircle] = useState(null);
  const [posts, setPosts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // View State
  const [activeView, setActiveView] = useState("feed"); // 'feed' or 'qa'
  
  // Feed Interaction
  const [postContent, setPostContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [activeCommentBox, setActiveCommentBox] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [editingPostId, setEditingPostId] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");

  // Q&A Interaction
  const [qaTitle, setQaTitle] = useState("");
  const [qaBody, setQaBody] = useState("");
  const [showAskForm, setShowAskForm] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [activeAnswerBox, setActiveAnswerBox] = useState(null);

  // Admin State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: "", description: "", coverImage: "" });
  const [activeTab, setActiveTab] = useState("settings");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
    fetchCircleData();
  }, [id]);

  const fetchCircleData = async () => {
    try {
      const circleRes = await axios.get(`http://localhost:5000/api/circles/${id}`);
      setCircle(circleRes.data);
      setEditFormData({
        name: circleRes.data.name,
        description: circleRes.data.description,
        coverImage: circleRes.data.coverImage || ""
      });

      // Fetch Feed
      const postsRes = await axios.get(`http://localhost:5000/api/posts/${id}`);
      setPosts(postsRes.data);

      // Fetch Q&A
      const qaRes = await axios.get(`http://localhost:5000/api/questions/${id}`);
      setQuestions(qaRes.data);

      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  // --- FEED ACTIONS ---
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    try {
      const newPost = { circleId: id, userId: currentUser._id, content: postContent, isAnonymous };
      const res = await axios.post("http://localhost:5000/api/posts", newPost);
      setPosts([res.data, ...posts]);
      setPostContent("");
      setIsAnonymous(false);
    } catch (err) { console.error(err); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const isAdmin = circle.admins.some(a => a._id === currentUser._id);
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, { data: { userId: currentUser._id, isAdmin } });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (err) { console.error(err); }
  };

  const startEditing = (post) => { setEditingPostId(post._id); setEditPostContent(post.content); };
  
  const saveEditPost = async (postId) => {
    try {
      await axios.put(`http://localhost:5000/api/posts/${postId}`, { userId: currentUser._id, content: editPostContent });
      setPosts(posts.map(p => p._id === postId ? { ...p, content: editPostContent } : p));
      setEditingPostId(null);
    } catch (err) { console.error(err); }
  };

  const handleLike = async (postId) => {
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
    } catch (err) { console.error(err); }
  };

  const handleCommentSubmit = async (postId) => {
    if (!commentText.trim()) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/posts/${postId}/comment`, { userId: currentUser._id, text: commentText });
      setPosts(posts.map(p => p._id === postId ? res.data : p));
      setCommentText("");
    } catch (err) { console.error(err); }
  };

  // --- Q&A ACTIONS ---
  const handleAskQuestion = async (e) => {
    e.preventDefault();
    try {
      const newQ = { circleId: id, userId: currentUser._id, title: qaTitle, body: qaBody };
      const res = await axios.post("http://localhost:5000/api/questions", newQ);
      setQuestions([res.data, ...questions]);
      setQaTitle(""); setQaBody(""); setShowAskForm(false);
    } catch (err) { console.error(err); }
  };

  const handleAnswerSubmit = async (qId) => {
    if (!answerText.trim()) return;
    try {
      const res = await axios.put(`http://localhost:5000/api/questions/${qId}/answer`, { userId: currentUser._id, text: answerText });
      // Update local state by replacing the question with the new one from backend
      setQuestions(questions.map(q => q._id === qId ? res.data : q));
      setAnswerText("");
    } catch (err) { console.error(err); }
  };

  const handleUpvoteAnswer = async (qId, ansId) => {
    try {
        const res = await axios.put(`http://localhost:5000/api/questions/${qId}/answer/${ansId}/upvote`, { userId: currentUser._id });
        // Although res.data is the full question, let's manually update specifically to feel faster or just swap
        setQuestions(questions.map(q => q._id === qId ? res.data : q)); // simple swap
    } catch(err) { alert("You already upvoted this!"); }
  };


  // --- ADMIN ACTIONS ---
  const handleUpdateCircle = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/circles/${id}`, { userId: currentUser._id, updates: editFormData });
      setShowAdminModal(false); fetchCircleData();
    } catch (err) { alert("Failed update"); }
  };
  const handleKickMember = async (memberId) => { if (window.confirm("Remove member?")) { await axios.put(`http://localhost:5000/api/circles/${id}/kick`, { adminId: currentUser._id, memberId }); fetchCircleData(); }};
  const handlePromoteMember = async (memberId) => { if (window.confirm("Promote to admin?")) { await axios.put(`http://localhost:5000/api/circles/${id}/promote`, { adminId: currentUser._id, memberId }); fetchCircleData(); }};
  const handleRequest = async (userId, action) => { await axios.put(`http://localhost:5000/api/circles/${id}/request`, { adminId: currentUser._id, userId, action }); fetchCircleData(); };
  const handleReportPost = async (postId) => { const r = prompt("Reason?"); if(r) { await axios.put(`http://localhost:5000/api/posts/${postId}/report`, { userId: currentUser._id, reason: r }); alert("Reported"); fetchCircleData(); }};
  const handleDismissReports = async (postId) => { await axios.put(`http://localhost:5000/api/posts/${postId}/dismiss-reports`); setPosts(posts.map(p=>p._id===postId?{...p, reports:[]}:p)); };

  if (loading) return <div className="p-10 text-center">Loading...</div>;
  if (!circle) return <div className="p-10 text-center">Circle not found.</div>;

  const isAdmin = currentUser && circle.admins.some(a => a._id === currentUser._id);
  const isMember = currentUser && circle.members.some(m => m._id === currentUser._id);
  const reportedPostsCount = posts.filter(p => p.reports && p.reports.length > 0).length;

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* HEADER */}
      <div className="bg-white shadow-sm pb-4">
        <div className={`h-48 w-full ${circle.coverImage ? '' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
           {circle.coverImage && <img src={circle.coverImage} className="w-full h-full object-cover" />}
        </div>
        <div className="max-w-5xl mx-auto px-4 -mt-12 flex items-end justify-between mb-4">
          <div>
            <div className="bg-white p-2 rounded-2xl shadow-md inline-block">
              <div className="h-24 w-24 bg-indigo-100 rounded-xl flex items-center justify-center text-4xl">{circle.name[0]}</div>
            </div>
            <h1 className="text-3xl font-bold mt-2 text-gray-800">{circle.name}</h1>
          </div>
          <div className="flex gap-3 mb-2">
            {isAdmin && <button onClick={() => setShowAdminModal(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-black flex items-center gap-2">⚙️ Admin {(circle.pendingMembers?.length > 0 || reportedPostsCount > 0) && <span className="bg-red-500 text-xs px-2 rounded-full">!</span>}</button>}
            <button onClick={() => navigate("/circles")} className="text-indigo-600 font-bold hover:underline px-2">← Back</button>
          </div>
        </div>
        
        {/* VIEW SWITCHER */}
        <div className="max-w-5xl mx-auto px-4 flex gap-8 border-b">
          <button onClick={() => setActiveView("feed")} className={`pb-3 font-bold text-lg ${activeView === "feed" ? "text-indigo-600 border-b-4 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>Circle Feed</button>
          <button onClick={() => setActiveView("qa")} className={`pb-3 font-bold text-lg ${activeView === "qa" ? "text-indigo-600 border-b-4 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}>Q&A Support</button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* MAIN CONTENT AREA */}
        <div className="md:col-span-2 space-y-6">
          
          {/* === FEED VIEW === */}
          {activeView === "feed" && (
            <>
              {isMember && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-4">
                    <img src={getAvatar(currentUser?.avatar)} className="w-10 h-10 rounded-full bg-gray-100" />
                    <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} placeholder={`Share something...`} className="w-full bg-gray-50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none h-24"></textarea>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600"><input type="checkbox" checked={isAnonymous} onChange={() => setIsAnonymous(!isAnonymous)} className="rounded" /> 🕵️ Post anonymously</label>
                    <button onClick={handlePostSubmit} disabled={!postContent.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50">Post</button>
                  </div>
                </div>
              )}
              {posts.map(post => {
                const isLiked = post.likes.includes(currentUser?._id);
                const isOwner = currentUser?._id === post.userId?._id;
                return (
                  <div key={post._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <img src={post.isAnonymous ? getAvatar("anon") : getAvatar(post.userId?.avatar)} className="w-10 h-10 rounded-full bg-gray-100" />
                        <div><h4 className="font-bold text-gray-800">{post.isAnonymous ? "Anonymous" : post.userId?.username}</h4><p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p></div>
                      </div>
                      <div className="flex gap-3 text-xs">{(isOwner || isAdmin) && <><button onClick={() => handleDeletePost(post._id)} className="text-red-500 hover:underline">Delete</button> {isOwner && <button onClick={() => startEditing(post)} className="text-indigo-600">Edit</button>}</>} {!isOwner && <button onClick={() => handleReportPost(post._id)}>🚩</button>}</div>
                    </div>
                    {editingPostId === post._id ? ( <div className="mb-4"><textarea value={editPostContent} onChange={e => setEditPostContent(e.target.value)} className="w-full border p-2 rounded-lg" /><button onClick={() => saveEditPost(post._id)} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm mt-2">Save</button></div> ) : ( <p className="text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">{post.content}</p> )}
                    <div className="flex items-center gap-6 text-gray-500 text-sm border-t pt-4"><button onClick={() => handleLike(post._id)} className={`${isLiked ? "text-pink-500 font-bold" : ""}`}>{isLiked ? "❤️" : "🤍"} {post.likes.length}</button><button onClick={() => setActiveCommentBox(activeCommentBox === post._id ? null : post._id)}>💬 {post.comments.length}</button></div>
                    {activeCommentBox === post._id && ( <div className="mt-4 pt-4 border-t border-gray-50">{post.comments.map((c, i) => (<div key={i} className="flex gap-2 mb-2"><img src={getAvatar(c.userId?.avatar)} className="w-6 h-6 rounded-full" /><div className="bg-gray-50 px-3 py-1 rounded-lg text-sm flex-1"><span className="font-bold mr-2">{c.userId?.username}</span>{c.text}</div></div>))}<div className="flex gap-2 mt-2"><input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => e.key==='Enter' && handleCommentSubmit(post._id)} placeholder="Write a comment..." className="flex-1 border rounded px-2 py-1 text-sm" /><button onClick={() => handleCommentSubmit(post._id)} className="text-indigo-600 text-sm font-bold">Send</button></div></div> )}
                  </div>
                );
              })}
            </>
          )}

          {/* === Q&A VIEW === */}
          {activeView === "qa" && (
            <div className="space-y-6">
              {isMember && (
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                  {!showAskForm ? (
                    <button onClick={() => setShowAskForm(true)} className="w-full bg-white text-indigo-600 py-3 rounded-xl font-bold border border-indigo-200 hover:shadow-md transition-all text-left px-6 flex justify-between items-center">
                      <span>❓ Ask a question...</span> <span className="text-2xl">+</span>
                    </button>
                  ) : (
                    <form onSubmit={handleAskQuestion} className="space-y-3">
                      <input value={qaTitle} onChange={e => setQaTitle(e.target.value)} placeholder="Question Title (e.g. How to deal with...)" className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ring-indigo-200 font-bold text-gray-800" autoFocus />
                      <textarea value={qaBody} onChange={e => setQaBody(e.target.value)} placeholder="Describe your situation..." className="w-full p-3 rounded-xl border focus:outline-none focus:ring-2 ring-indigo-200 h-24"></textarea>
                      <div className="flex gap-3">
                        <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700">Submit Question</button>
                        <button type="button" onClick={() => setShowAskForm(false)} className="text-gray-500 font-bold px-4">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {questions.map(q => (
                <div key={q._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1 w-12 pt-1">
                      <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center font-bold text-gray-500 text-sm">{q.answers.length}</div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">Ans</span>
                    </div>
                    <div className="flex-1">
                       <h3 className="font-bold text-lg text-gray-800 hover:text-indigo-600 cursor-pointer">{q.title}</h3>
                       <p className="text-gray-600 text-sm mt-1 mb-3 line-clamp-3">{q.body}</p>
                       <div className="flex items-center gap-2 text-xs text-gray-400">
                         <img src={getAvatar(q.userId?.avatar)} className="w-5 h-5 rounded-full" />
                         <span>{q.userId?.username} asked on {new Date(q.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                  </div>
                  
                  {/* Answers Section */}
                  <div className="mt-4 pl-16">
                     <button onClick={() => setActiveAnswerBox(activeAnswerBox === q._id ? null : q._id)} className="text-indigo-600 text-sm font-bold mb-2 hover:underline">
                        {activeAnswerBox === q._id ? "Hide Answers" : "View / Add Answers"}
                     </button>
                     
                     {activeAnswerBox === q._id && (
                       <div className="mt-2 space-y-4 border-t pt-4">
                         {/* List Answers */}
                         {q.answers.sort((a,b) => b.upvotes.length - a.upvotes.length).map(ans => (
                           <div key={ans._id} className="flex gap-3">
                             <div className="flex flex-col items-center">
                               <button onClick={() => handleUpvoteAnswer(q._id, ans._id)} className="text-gray-400 hover:text-green-500">▲</button>
                               <span className="text-xs font-bold text-gray-700">{ans.upvotes.length}</span>
                             </div>
                             <div className="bg-gray-50 p-3 rounded-lg flex-1">
                               <div className="flex items-center gap-2 mb-1">
                                  <img src={getAvatar(ans.userId?.avatar)} className="w-5 h-5 rounded-full" />
                                  <span className="text-xs font-bold text-gray-800">{ans.userId?.username}</span>
                               </div>
                               <p className="text-sm text-gray-700">{ans.text}</p>
                             </div>
                           </div>
                         ))}
                         
                         {/* Add Answer */}
                         <div className="flex gap-2 mt-4">
                           <input value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Type a helpful answer..." className="flex-1 border rounded px-3 py-2 text-sm" />
                           <button onClick={() => handleAnswerSubmit(q._id)} className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-bold">Answer</button>
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR (Shared) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">About</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{circle.description}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">Members ({circle.members.length})</h3>
            <div className="flex flex-wrap gap-2">
              {circle.members.slice(0, 10).map(m => ( <img key={m._id} src={getAvatar(m.avatar)} title={m.username} className="w-8 h-8 rounded-full border bg-gray-100" /> ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- ADMIN MODAL (Preserved) --- */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gray-800 text-white p-4 flex justify-between items-center shrink-0"><h2 className="font-bold text-lg">⚙️ Admin Dashboard</h2><button onClick={() => setShowAdminModal(false)} className="text-gray-400 hover:text-white text-xl">&times;</button></div>
            <div className="flex border-b shrink-0 bg-gray-50 overflow-x-auto">{['settings', 'members', 'requests', 'moderation'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-3 px-4 text-sm font-bold capitalize whitespace-nowrap ${activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600 bg-white" : "text-gray-500 hover:bg-gray-100"}`}>{tab} {tab === 'requests' && circle.pendingMembers?.length > 0 && <span className="ml-1 text-red-500">({circle.pendingMembers.length})</span>}{tab === 'moderation' && reportedPostsCount > 0 && <span className="ml-1 text-red-500">({reportedPostsCount})</span>}</button>))}</div>
            <div className="p-6 overflow-y-auto">
              {activeTab === "settings" && (<form onSubmit={handleUpdateCircle} className="space-y-4"><div><label className="text-xs font-bold text-gray-500">Name</label><input value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full border rounded p-2" /></div><div><label className="text-xs font-bold text-gray-500">Description</label><textarea value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full border rounded p-2 h-24"></textarea></div><div><label className="text-xs font-bold text-gray-500">Cover URL</label><input value={editFormData.coverImage} onChange={e => setEditFormData({...editFormData, coverImage: e.target.value})} className="w-full border rounded p-2" /></div><button className="w-full bg-indigo-600 text-white font-bold py-2 rounded">Save Changes</button></form>)}
              {activeTab === "members" && (<div className="space-y-2">{circle.members.map(member => (<div key={member._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-200"><div className="flex items-center gap-2"><img src={getAvatar(member.avatar)} className="w-8 h-8 rounded-full" /><span className="font-medium text-gray-700">{member.username}</span>{circle.admins.some(a => a._id === member._id) && <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded">Admin</span>}</div>{currentUser._id !== member._id && (<div className="flex gap-2">{!circle.admins.some(a => a._id === member._id) && (<button onClick={() => handlePromoteMember(member._id)} className="text-indigo-600 text-xs font-bold hover:underline">Promote</button>)}<button onClick={() => handleKickMember(member._id)} className="text-red-500 text-xs font-bold hover:underline">Kick</button></div>)}</div>))}</div>)}
              {activeTab === "requests" && (<div className="space-y-2">{(!circle.pendingMembers || circle.pendingMembers.length === 0) && <p className="text-gray-400 text-center italic">No pending requests.</p>}{circle.pendingMembers?.map(reqUser => (<div key={reqUser._id} className="flex items-center justify-between p-2 border rounded"><div className="flex items-center gap-2"><img src={getAvatar(reqUser.avatar)} className="w-8 h-8 rounded-full" /><span className="font-bold text-gray-700">{reqUser.username}</span></div><div className="flex gap-2"><button onClick={() => handleRequest(reqUser._id, 'approve')} className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs font-bold hover:bg-green-200">Accept</button><button onClick={() => handleRequest(reqUser._id, 'reject')} className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs font-bold hover:bg-red-200">Reject</button></div></div>))}</div>)}
              {activeTab === "moderation" && (<div className="space-y-4">{reportedPostsCount === 0 && <p className="text-gray-400 text-center italic">No reported posts.</p>}{posts.filter(p => p.reports && p.reports.length > 0).map(post => (<div key={post._id} className="border border-red-100 bg-red-50 rounded-lg p-3"><div className="flex justify-between items-start mb-2"><div className="text-xs text-red-600 font-bold uppercase">Reported {post.reports.length} times</div><div className="flex gap-2"><button onClick={() => handleDismissReports(post._id)} className="text-gray-500 text-xs hover:underline">Dismiss</button><button onClick={() => handleDeletePost(post._id)} className="text-red-600 text-xs font-bold hover:underline">Delete Post</button></div></div><p className="text-sm text-gray-800 bg-white p-2 rounded mb-2 border border-gray-200">{post.content}</p><div className="space-y-1">{post.reports.map((r, i) => (<div key={i} className="text-xs text-gray-500 flex gap-2"><span>🚩 Reason:</span><span className="italic">"{r.reason}"</span></div>))}</div></div>))}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SingleCirclePage;