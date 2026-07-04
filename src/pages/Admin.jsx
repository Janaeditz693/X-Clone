import React, { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { RiShieldUserLine, RiArticleLine, RiGroupLine, RiAlertLine, RiCheckLine, RiDeleteBinLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('reports');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, totalPosts: 0, totalReports: 0 });
  const { currentUser } = useAuth();

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersList = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
      setUsers(usersList);

      const postsSnapshot = await getDocs(collection(db, 'posts'));
      
      const reportsQuery = query(collection(db, 'reports'), where('status', '==', 'pending'));
      const reportsSnapshot = await getDocs(reportsQuery);
      const reportsList = reportsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsList);

      setStats({
        totalUsers: usersList.length,
        totalPosts: postsSnapshot.size,
        totalReports: reportsList.length
      });
    } catch (err) {
      console.error(err);
      toast.error("Could not fetch dashboard details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDismissReport = async (reportId) => {
    try {
      await updateDoc(doc(db, 'reports', reportId), { status: 'resolved' });
      setReports(prev => prev.filter(r => r.id !== reportId));
      setStats(prev => ({ ...prev, totalReports: Math.max(0, prev.totalReports - 1) }));
      toast.success("Report dismissed.");
    } catch (err) {
      console.error(err);
      toast.error("Could not resolve report.");
    }
  };

  const handleDeletePost = async (report) => {
    if (!window.confirm("Are you sure you want to delete this reported post?")) return;
    try {
      await deleteDoc(doc(db, 'posts', report.postId));
      await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
      
      setReports(prev => prev.filter(r => r.id !== report.id));
      setStats(prev => ({ 
        ...prev, 
        totalReports: Math.max(0, prev.totalReports - 1),
        totalPosts: Math.max(0, prev.totalPosts - 1) 
      }));
      
      toast.success("Post deleted and report resolved.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete post.");
    }
  };

  const handleToggleUserStatus = async (user) => {
    const isBanned = user.status === 'banned';
    const newStatus = isBanned ? 'active' : 'banned';
    
    if (!window.confirm(`Are you sure you want to ${isBanned ? 'unban' : 'ban'} @${user.username}?`)) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, status: newStatus } : u));
      toast.success(`User @${user.username} is now ${newStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to change user status");
    }
  };

  const handleToggleUserRole = async (user) => {
    const isAdmin = user.role === 'admin';
    const newRole = isAdmin ? 'user' : 'admin';
    
    if (!window.confirm(`Promote @${user.username} to admin?`)) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole } : u));
      toast.success(`User @${user.username} role updated to ${newRole}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to change user role");
    }
  };

  return (
    <Layout mobileTitle="Admin Panel">
      <div className="sticky top-0 bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-md px-4 py-3 border-b border-divider z-10 select-none flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-brand-text dark:text-brand-darkText text-lg flex items-center gap-2">
            <RiShieldUserLine className="text-red-500" />
            Admin Control Center
          </h2>
          <p className="text-xs text-brand-muted dark:text-brand-darkMuted">Manage users and content review timelines</p>
        </div>
        <button 
          onClick={fetchAdminData} 
          className="text-xs font-bold text-brand-blue border border-divider hover:bg-gray-50 dark:hover:bg-zinc-900 rounded-full px-3 py-1"
        >
          Refresh
        </button>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3 select-none">
        <div className="bg-gray-50 dark:bg-zinc-900/40 p-4 border border-divider rounded-2xl flex items-center gap-3">
          <RiGroupLine className="text-2xl text-brand-blue" />
          <div>
            <p className="text-xs text-brand-muted">Total Users</p>
            <h3 className="font-bold text-lg leading-none">{stats.totalUsers}</h3>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-zinc-900/40 p-4 border border-divider rounded-2xl flex items-center gap-3">
          <RiArticleLine className="text-2xl text-green-500" />
          <div>
            <p className="text-xs text-brand-muted">Total Posts</p>
            <h3 className="font-bold text-lg leading-none">{stats.totalPosts}</h3>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-zinc-900/40 p-4 border border-divider rounded-2xl flex items-center gap-3">
          <RiAlertLine className="text-2xl text-red-500 animate-pulse" />
          <div>
            <p className="text-xs text-brand-muted">Pending Reports</p>
            <h3 className="font-bold text-lg leading-none text-red-500">{stats.totalReports}</h3>
          </div>
        </div>
      </div>

      <div className="flex border-b border-divider select-none text-sm font-bold">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === 'reports' ? 'border-brand-blue text-brand-text dark:text-brand-darkText' : 'border-transparent text-brand-muted'
          }`}
        >
          Reports Review ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === 'users' ? 'border-brand-blue text-brand-text dark:text-brand-darkText' : 'border-transparent text-brand-muted'
          }`}
        >
          User Management ({users.length})
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-zinc-800 rounded-xl"></div>
            ))}
          </div>
        ) : activeTab === 'reports' ? (
          reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border border-divider rounded-2xl p-4 bg-red-50/5 dark:bg-red-950/5 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                        Reason: {report.reason}
                      </span>
                      <p className="text-xs text-brand-muted mt-1 select-none">
                        Reported by user ID: {report.reporterId}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDismissReport(report.id)}
                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition"
                        title="Dismiss Report"
                      >
                        <RiCheckLine />
                      </button>
                      <button
                        onClick={() => handleDeletePost(report)}
                        className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
                        title="Delete Post"
                      >
                        <RiDeleteBinLine />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-divider pt-2">
                    <p className="text-xs text-brand-muted mb-1 select-none">Post Content by @{report.authorUsername}:</p>
                    <p className="text-sm bg-gray-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-divider">
                      {report.postContent}
                    </p>
                    {report.comment && (
                      <p className="text-xs text-brand-text dark:text-brand-darkText italic mt-2">
                        Reporter comment: "{report.comment}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center select-none text-brand-muted">
              No pending reports. Platform content is clean.
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-divider text-brand-muted select-none">
                  <th className="py-2.5">User</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-divider">
                {users.map((user) => {
                  const isCurrentUser = currentUser?.uid === user.uid;
                  return (
                    <tr key={user.uid} className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/10">
                      <td className="py-3 flex items-center gap-2">
                        <img
                          src={user.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.uid}`}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-brand-text dark:text-brand-darkText truncate">{user.displayName}</span>
                          <span className="text-brand-muted truncate">@{user.username}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                          user.status === 'banned' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                        }`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!isCurrentUser && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`px-2.5 py-1 font-semibold rounded text-[10px] select-none transition ${
                                user.status === 'banned'
                                  ? 'bg-green-500 hover:bg-green-600 text-white'
                                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                              }`}
                            >
                              {user.status === 'banned' ? 'Unban' : 'Ban'}
                            </button>
                            
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleUserRole(user)}
                                className="px-2.5 py-1 bg-brand-blue hover:bg-brand-blueHover text-white font-semibold rounded text-[10px] select-none transition"
                              >
                                Admin
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
