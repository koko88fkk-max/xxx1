import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, ShieldCheck } from 'lucide-react';
import { loginWithGoogle } from './lib/firebase';

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    setLoading(false);
    onClose();
  };

  const handleDiscordLogin = () => {
    setLoading(true);
    const clientId = '1462977086653464729';
    const redirectUri = encodeURIComponent('https://t3n-2a2i.vercel.app/api/discord-auth');
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=identify`;
    window.location.href = discordAuthUrl;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-md bg-[#0F111A] border border-blue-500/20 rounded-3xl p-6 shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 left-4 p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all z-10"><X className="w-5 h-5" /></button>

        <div className="text-center mb-6 pt-4 relative z-10">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">تسجيل الدخول</h2>
          <p className="text-gray-400 text-sm">بوابة الدخول الرسمية لمتجر تعن T3N</p>
        </div>

        <div className="space-y-4 relative z-10">
          {/* Discord Button */}
          <button disabled={loading} onClick={handleDiscordLogin} className="w-full flex items-center justify-center gap-3 p-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)]">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <svg className="w-6 h-6 fill-current" viewBox="0 0 127.14 96.36">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a67.58,67.58,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.09,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                <span>الدخول باستخدام Discord</span>
              </>
            )}
          </button>
        <div className="relative flex items-center py-2"><div className="flex-grow border-t border-white/10"></div><span className="flex-shrink-0 mx-4 text-white/40 text-sm">أو</span><div className="flex-grow border-t border-white/10"></div></div>

          {/* Google Button */}
          <button disabled={loading} onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 p-4 bg-white hover:bg-gray-100 text-gray-900 rounded-2xl font-bold transition-all">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span>الدخول باستخدام Google</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}



