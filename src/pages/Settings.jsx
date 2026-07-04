import React from 'react';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { RiSunLine, RiMoonLine, RiLockPasswordLine, RiUserLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function Settings() {
  const { userData, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handlePasswordReset = async () => {
    if (!userData?.email) return;
    try {
      await resetPassword(userData.email);
      toast.success("Password reset email sent!");
    } catch (err) {
      console.error(err);
      toast.error("Could not send password reset request.");
    }
  };

  return (
    <Layout mobileTitle="Settings">
      <div className="sticky top-0 bg-white/90 dark:bg-brand-darkBg/90 backdrop-blur-md px-4 py-3 select-none border-b border-divider z-10">
        <h2 className="font-extrabold text-brand-text dark:text-brand-darkText text-lg">Settings</h2>
        <p className="text-xs text-brand-muted dark:text-brand-darkMuted">Manage account settings and theme preferences</p>
      </div>

      <div className="p-4 space-y-6 select-none">
        {/* Profile Info Summary */}
        {userData && (
          <div className="bg-gray-50 dark:bg-zinc-900/40 p-4 border border-divider rounded-2xl flex items-center gap-4">
            <img
              src={userData.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userData.uid}`}
              alt="Avatar"
              className="w-12 h-12 rounded-full object-cover bg-gray-200"
            />
            <div>
              <h3 className="font-bold text-sm text-brand-text dark:text-brand-darkText leading-none mb-1">
                {userData.displayName}
              </h3>
              <p className="text-xs text-brand-muted dark:text-brand-darkMuted">
                @{userData.username} · {userData.email}
              </p>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-base text-brand-text dark:text-brand-darkText">Theme Preference</h3>
          <div className="border border-divider rounded-2xl divide-y divide-divider">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 dark:hover:bg-zinc-900/10 transition text-sm text-brand-text dark:text-brand-darkText text-left"
            >
              <span className="flex items-center gap-3">
                {theme === 'dark' ? <RiSunLine className="text-xl text-yellow-500" /> : <RiMoonLine className="text-xl text-indigo-500" />}
                <span>Toggle Theme Mode</span>
              </span>
              <span className="text-xs text-brand-muted uppercase font-bold">{theme}</span>
            </button>
          </div>
        </div>

        {/* Security Settings */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-base text-brand-text dark:text-brand-darkText">Account Security</h3>
          <div className="border border-divider rounded-2xl">
            <button
              onClick={handlePasswordReset}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-50/50 dark:hover:bg-zinc-900/10 transition text-sm text-brand-text dark:text-brand-darkText text-left"
            >
              <RiLockPasswordLine className="text-xl text-brand-blue" />
              <div>
                <p className="font-semibold leading-none mb-0.5">Reset Password</p>
                <p className="text-xs text-brand-muted">Sends a password reset link to your email</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
