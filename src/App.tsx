import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { ShoppingBag, MessageCircle, ShieldAlert, Download, CheckCircle2, Star, ExternalLink, Server, FileArchive, AlertCircle, AlertTriangle, ChevronDown, HelpCircle, ChevronUp, Gamepad2, Shield, Cpu, Wrench, X, LogIn, LogOut, MonitorPlay, Maximize2, Youtube, Copy, Check, Sun, Moon, LayoutDashboard, Users, Package, Clock, RefreshCw, Mail, Hash, Trash2, UserX, ShieldOff, Crown, UserPlus, Key, Plus, Ban, Snowflake, Play } from 'lucide-react';
import { auth, loginWithGoogle, logout, checkUserVIP, activateOrder, isAdmin, getAdminStats, banUser, unbanUser, removeVIP, deleteUserData, addAdminUser, removeAdminUser, checkIsAdmin, checkBanned, getAllOrders, deleteOrder, banOrder, unbanOrder, freezeOrder, unfreezeOrder, isValidOrderFormat } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

const LOGO_URL = "/logo.png";
const STORE_URL = "https://salla.sa/t3nn";
const DISCORD_URL = "https://discord.gg/tjMWEccj3J";
const DISCORD_OAUTH_URL = "https://discord.com/api/oauth2/authorize?client_id=1462976673007013908&redirect_uri=https%3A%2F%2Ft3n-2a2i.vercel.app%2F&response_type=token&scope=identify%20guilds.join";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy} 
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all duration-300 ${copied ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 shrink-0'}`}
    >
      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
      <span>{copied ? 'تم النسخ' : 'نسخ الأمر'}</span>
    </button>
  );
}

// 3D Tilt Card Component
function TiltCard({ children, className = "", href, target, rel }: any) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.3, 0, 0.3]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const content = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`relative ${className}`}
    >
      <motion.div
        className="absolute inset-0 z-50 pointer-events-none rounded-[inherit]"
        style={{
          background: "radial-gradient(circle at center, rgba(255,255,255,0.4) 0%, transparent 40%)",
          left: glareX,
          top: glareY,
          opacity: glareOpacity,
          transform: "translate(-50%, -50%)",
          width: "200%",
          height: "200%",
          mixBlendMode: "overlay",
        }}
      />
      <div style={{ transform: "translateZ(40px)" }} className="h-full w-full">
        {children}
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className="block perspective-1000">
        {content}
      </a>
    );
  }

  return <div className="perspective-1000">{content}</div>;
}

function Navbar({ isVerified, user, onLogin, onLogout, authLoading, onSpooferClick, onTroubleshootClick }: { isVerified?: boolean, user?: User | null, onLogin?: () => void, onLogout?: () => void, authLoading?: boolean, onSpooferClick?: () => void, onTroubleshootClick?: () => void }) {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0"
    >
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.img 
            whileHover={{ rotate: 10, scale: 1.1 }}
            src={LOGO_URL} 
            alt="تعن T3N" 
            className="w-10 h-10 object-contain rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
          />
          <span className="font-bold text-xl tracking-tight text-white drop-shadow-md">تعن T3N</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#delivery" className="hover:text-blue-400 transition-colors drop-shadow-sm">استلام الطلبات</a>
          <a href="#products" className="hover:text-blue-400 transition-colors drop-shadow-sm">المنتجات</a>
          <a href="#reviews" className="hover:text-blue-400 transition-colors drop-shadow-sm">التقييمات</a>
          <a href="#faq" className="hover:text-blue-400 transition-colors drop-shadow-sm">الأسئلة الشائعة</a>
          <a href="#policies" className="hover:text-blue-400 transition-colors drop-shadow-sm">القوانين</a>
          {isVerified && (
            <div className="flex items-center gap-3">
              <button 
                onClick={onTroubleshootClick}
                className="text-red-400 hover:text-red-300 transition-colors drop-shadow-sm flex items-center gap-1.5 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
              >
                <Wrench className="w-4 h-4" />
                حل مشاكل
              </button>
              <button 
                onClick={onSpooferClick}
                className="text-yellow-400 hover:text-yellow-300 transition-colors drop-shadow-sm flex items-center gap-1.5 bg-yellow-500/10 px-4 py-1.5 rounded-full border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]"
              >
                <Cpu className="w-4 h-4" />
                شرح السبوفر
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isVerified && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.2)] ml-2"
            >
              <div className="relative flex items-center justify-center w-6 h-6 animate-pulse drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]">
                <img 
                  src={LOGO_URL} 
                  alt="نجمة المتجر" 
                  className="w-full h-full object-cover bg-amber-500/10"
                  style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }} 
                />
              </div>
              <span className="text-yellow-400 font-bold text-sm tracking-wide">عميل مميز</span>
            </motion.div>
          )}

          <motion.a 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href={DISCORD_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 flex items-center justify-center hover:bg-[#5865F2]/30 hover:shadow-[0_0_15px_rgba(88,101,242,0.4)] transition-all"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.a>
          {!authLoading && (
            user ? (
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="h-10 px-3 md:px-4 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all gap-2"
              >
                <img src={user.photoURL || ''} alt="User" className="w-6 h-6 rounded-full object-cover" />
                <span className="text-sm font-bold hidden md:block">تسجيل خروج</span>
                <LogOut className="w-4 h-4 md:hidden" />
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogin}
                className="h-10 px-4 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all gap-2"
              >
                <svg className="w-5 h-5 bg-white rounded-full p-[2px]" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-bold">دخول Google</span>
              </motion.button>
            )
          )}
          <motion.a 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            href={STORE_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all ml-1"
          >
            <ShoppingBag className="w-5 h-5" />
          </motion.a>
        </div>
      </div>
    </motion.nav>
  );
}

function Hero({ onSiteGuideClick }: { onSiteGuideClick: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/30 blur-[120px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/30 blur-[120px] rounded-full" 
        />
      </div>
      
      <div className="container mx-auto px-4 relative z-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <motion.div 
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="relative mb-10"
          >
            <div className="absolute inset-0 bg-blue-500/30 blur-[60px] rounded-full" />
            <div className="relative z-10 p-2 rounded-3xl bg-white/5 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-sm">
              <img src={LOGO_URL} alt="تعن T3N" className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-2xl" />
            </div>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 drop-shadow-lg">
            تعن T3N
          </h1>
          <p className="text-xl md:text-2xl text-zinc-300 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium">
            وجهتك الأولى للمنتجات الرقمية المتميزة. جودة، سرعة، وموثوقية في مكان واحد.
          </p>
          
          <div className="flex flex-col gap-5 justify-center w-full sm:w-auto items-center mt-4">
            {/* Site Guide Button */}
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(59,130,246,0.3)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onSiteGuideClick}
              className="px-8 py-4 bg-blue-600 border border-blue-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all w-full md:w-auto md:min-w-[300px]"
            >
              <MonitorPlay className="w-5 h-5" />
              شرح بوابة تعن
            </motion.button>
            
            {/* Store and Discord Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 w-full">
              <motion.a 
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
                whileTap={{ scale: 0.95 }}
                href={STORE_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(0,0,0,0.3)] transition-colors w-full sm:w-auto"
              >
                <ShoppingBag className="w-5 h-5" />
                تصفح المتجر
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(88,101,242,0.3)" }}
                whileTap={{ scale: 0.95 }}
                href={DISCORD_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-8 py-4 glass-panel text-[#5865F2] font-bold rounded-2xl hover:bg-[#5865F2]/10 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
              >
                <MessageCircle className="w-5 h-5" />
                مجتمع ديسكورد
              </motion.a>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-20 flex justify-center w-full text-zinc-500 animate-bounce translate-x-3 md:translate-x-4"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </div>
    </section>
  );
}

function OrderDelivery({ onVerify, user }: { onVerify?: (orderId: string) => void, user?: User | null }) {
  const [orderInput, setOrderInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) return;

    if (!user) {
      setStatus('error');
      setErrorMsg('يجب تسجيل الدخول بحساب جوجل أولاً للتحقق من رقم الطلب');
      return;
    }

    if (!isValidOrderFormat(orderInput)) {
      setStatus('error');
      setErrorMsg('رقم الطلب غير صحيح، تأكد من إدخال رقم الطلب الصحيح');
      return;
    }

    setStatus('loading');

    try {
      const result = await activateOrder(orderInput.trim(), user.uid, user.email || '');
      if (result.success) {
        setTimeout(() => {
          setStatus('success');
          if (onVerify) onVerify(orderInput.trim());
        }, 1500);
      } else {
        setStatus('error');
        setErrorMsg(result.error || 'حدث خطأ أثناء التحقق');
      }
    } catch (e) {
      console.error('Error activating order:', e);
      setStatus('error');
      setErrorMsg('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً');
    }
  };

  return (
    <section id="delivery" className="py-32 relative z-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">تفعيل رقم الطلب</h2>
          <p className="text-zinc-400 text-lg">أدخل رقم الطلب من سلّة لاستلام الملفات والحصول على رتبتك في ديسكورد</p>
        </motion.div>

        <TiltCard className="glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <AnimatePresence mode="wait">
            {status === 'idle' || status === 'error' ? (
              <motion.form
                key="form"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleVerify}
                className="flex flex-col items-center max-w-md mx-auto relative z-10"
              >
                <div className="w-full mb-4 relative">
                  <input
                    type="text"
                    value={orderInput}
                    onChange={(e) => {
                      setOrderInput(e.target.value);
                      if (status === 'error') setStatus('idle');
                    }}
                    placeholder="أدخل رقم الطلب"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-center text-xl focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all text-white placeholder:text-zinc-600 shadow-inner font-mono tracking-wider"
                    dir="ltr"
                  />
                </div>

                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm font-medium">{errorMsg}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(37,99,235,0.4)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!orderInput.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(37,99,235,0.2)] border-t border-blue-400/30"
                >
                  <Hash className="w-6 h-6" />
                  تفعيل رقم الطلب
                </motion.button>
              </motion.form>
            ) : status === 'loading' ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 relative z-10"
              >
                <div className="w-20 h-20 relative mb-8">
                  <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                  <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                </div>
                <p className="text-zinc-300 font-medium animate-pulse text-lg">جاري التحقق من رقم الطلب...</p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center relative z-10"
              >
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <CheckCircle2 className="w-12 h-12" />
                </motion.div>
                <h3 className="text-3xl font-bold mb-2 text-white">تم التفعيل بنجاح!</h3>
                <p className="text-zinc-400 mb-2 text-lg">رقم الطلب <span className="text-white font-mono bg-white/10 px-2 py-1 rounded-md text-sm">{orderInput}</span> مُفعّل ومرتبط بحسابك.</p>
                <p className="text-emerald-400 text-sm mb-10 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> مرتبط بحسابك بشكل دائم</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-black/40 border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-lg"
                  >
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                      <FileArchive className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="font-bold text-xl mb-3 text-white">ملفات الطلب</h4>
                    <p className="text-sm text-zinc-400 mb-8 leading-relaxed">ملف مضغوط (RAR) يحتوي على طلبك مع شرح الاستخدام والترتيب.</p>
                    <motion.button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/discord.gg.t3n.rar';
                        link.download = 'discord.gg.t3n.rar';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      onContextMenu={(e) => e.preventDefault()}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="mt-auto w-full bg-white text-black hover:bg-zinc-200 font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <Download className="w-5 h-5" />
                      تحميل الملف
                    </motion.button>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-black/40 border border-white/10 rounded-3xl p-8 flex flex-col items-center shadow-lg"
                  >
                    <div className="w-16 h-16 bg-[#5865F2]/10 rounded-2xl flex items-center justify-center mb-6 border border-[#5865F2]/20">
                      <Server className="w-8 h-8 text-[#5865F2]" />
                    </div>
                    <h4 className="font-bold text-xl mb-3 text-white">رتبة ديسكورد</h4>
                    <p className="text-sm text-zinc-400 mb-8 leading-relaxed">احصل على رتبة <span className="text-zinc-200 font-mono bg-white/5 px-1 rounded">Customer</span> في سيرفرنا للوصول للدعم.</p>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.location.href = DISCORD_OAUTH_URL}
                      onContextMenu={(e) => e.preventDefault()}
                      className="mt-auto w-full bg-[#5865F2] text-white hover:bg-[#4752C4] font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md border-t border-white/20"
                    >
                      <MessageCircle className="w-5 h-5" />
                      ربط الحساب وإستلام الرتبة
                    </motion.button>
                  </motion.div>
                </div>
                
                <button 
                  onClick={() => { setStatus('idle'); setOrderInput(''); }}
                  className="mt-10 text-sm text-zinc-500 hover:text-white transition-colors underline underline-offset-4"
                >
                  تفعيل رقم طلب آخر
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </TiltCard>
      </div>
    </section>
  );
}

function Products() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Lock scroll when product details modal is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedProduct]);

  const products = [
    {
      id: 1,
      title: "سبوفر بيرم الألعاب",
      desc: "يدعم جميع المذربوردات وجميع حمايات الألعاب. استعمال مرة واحدة فقط للأبد. يدعم COD، Rust، VALORANT، FiveM وغيرها.",
      url: "https://salla.sa/t3nn/EXGRXdv",
      image: "/product-spoofer-perm.jpg",
      icon: <Cpu className="w-5 h-5" />,
      tag: "الأكثر مبيعاً",
      details: "المميزات\n\n[+] يدعم جميع مذربوردات:\nMSI · ASUS · GIGABYTE · ASROCK · HP · EVGA · MICROSTAR · AORUS · COLORFUL · LENOVO · ACER · DELL\n[+] بعض أجهزة ASUS قد لا يعمل عليها\n[+] يدعم جميع حمايات الألعاب\n[+] الألعاب المدعومة:\nCall of Duty · Rust · VALORANT · FiveM · يدعم جميع العاب أخرى\n[+] استعمال مرة واحدة فقط وقت الفك، ولا تحتاج استعماله مرة أخرى للأبد\n[+] يتم تسليم المنتج فورياً\n[+] 100% مضمون وموثوق\n[+] يتم تسليمك مفتاح فوري بعد الشراء\n\nإذا كنت بحاجة إلى مساعدة من الدعم الفني والتحكم بجهازك لتنفيذ الخطوات، يوجد رسوم قدرها 35 ريال مخصصة للخدمة.\n\nملاحظات مهمة قبل الشراء:\n[+] في بعض الأجهزة قد تحتاج إلى فورمات أو تغيير إصدار ويندوز\n[+] المنتج لا يُسترد، شغال 100%، إذا فيه خلل عندك نحن غير مسؤولين\n[+] بمجرد شرائك للمنتج: سيتم إرسال كود التفعيل على البريد الإلكتروني أو رقم الجوال"
    },
    {
      id: 2,
      title: "فك باند فورت نايت",
      desc: "تغيير معلومات جهازك لإلغاء الحظر نهائياً. فك باند البطولات بنسبة نجاح 100%. تنفيذ سريع وفوري.",
      url: "https://salla.sa/t3nn/BpwOKQa",
      image: "/product-fortnite-unban.jpg",
      icon: <Gamepad2 className="w-5 h-5" />,
      tag: "مضمون",
      details: "يقوم بتغيير معلومات جهازك إلى معلومات جديدة لإلغاء الحظر في لعبة فورت نايت نهائياً.\n\nالمميزات:\n- فك باند البطولات\n- نسبة نجاح 100%\n- فك باند نهائي بدون رجوع\n- تنفيذ سريع وفوري\n- خدمة مضمونة بالكامل\n\nدعم جميع اللوحات الأم بدون استثناء:\nASUS · MSI · GIGABYTE · ASROCK · HP · EVGA · MICROSTAR · AORUS · COLORFUL · LENOVO · ACER · DELL\n[+] يدعم جميع المذربوردات\n[+] بعض أجهزة ASUS قد لا يعمل عليها\n[+] استعمال مرة واحدة فقط وقت الفك، ولا تحتاج استعماله مرة أخرى للأبد\n\nملاحظات مهمة قبل الشراء:\n[+] في بعض الأجهزة قد تحتاج إلى فورمات أو تغيير إصدار ويندوز\n[+] المنتج لا يُسترد، شغال 100%، إذا فيه خلل عندك نحن غير مسؤولين\n[+] مبجرد شرائك للمنتج: سيتم إرسال كود التفعيل على البريد الإلكتروني أو رقم الجوال"
    },
    {
      id: 3,
      title: "سبوفر مدى الحياة VIP",
      desc: "مفتاح خاص فيك مدى الحياة. كل ما تبندت في أي لعبة تفكه. بدون مدة انتهاء وبدون إعادة شراء.",
      url: "https://salla.sa/t3nn/OyWpQyw",
      image: "/product-spoofer-lifetime.jpg",
      icon: <Shield className="w-5 h-5" />,
      tag: "VIP",
      details: "🎮 VIP سبوفر لجميع الألعاب\nاحصل الآن على سبوفر بيزم (مدى الحياة) مخصص لفك الباند عن جميع الألعاب بكل سهولة وأمان.\n\n🎮 يدعم جميع الألعاب الشهيرة:\nفورت نايت\nفالورانت\nرست\nديد باي داي لايت\nفايف إم\nوأي لعبة أخرى في بالك\n\n✅ ماذا تحصل عند الشراء؟\n📦 رقم طلب خاص بك مدى الحياة\nتسليم فوري لرقم الطلب\nيمكنك فك الباند في أي وقت\nبدون مدة انتهاء وبدون الحاجة لإعادة الشراء\n\n💬 آلية الاستلام وتحكم الدعم الفني متوفرة 24/7\nشرح كامل للخطوات، تحكم بجهازك مجاناً لفك الباند.\n\n♡ ضمان الخدمة مؤثر 100%\n⚠️ ملاحظة: المنتج غير قابل للاسترجاع بعد الشراء"
    },
    {
      id: 4,
      title: "طلب خاص",
      desc: "طلب خاص تريده أنت. تواصل معنا عبر الديسكورد أو المتجر وسنلبي طلبك.",
      url: "https://salla.sa/t3nn/jgBZWje",
      image: "/product-custom-order.jpg",
      icon: <Wrench className="w-5 h-5" />,
      tag: "مخصص",
      details: "طلب خاص\n\nطلب خاص تريده أنت\n\nإذا كنت بحاجة إلى مساعدة من الدعم الفني والتحكم بجهازك لتنفيذ الخطوات كاملة بنفسنا، يرجى التوجه هنا لدفع رسوم الخدمة 35 ريال.\n\nلدينا دعم فني جاهز لخدمتك في الديسكورد."
    }
  ];

  return (
    <section id="products" className="py-32 relative z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">منتجاتنا</h2>
          <p className="text-zinc-400 text-lg">تصفح أفضل منتجاتنا الرقمية المتوفرة في المتجر</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <TiltCard href={product.url} target="_blank" rel="noopener noreferrer" className="glass-panel-hover glass-panel rounded-3xl overflow-hidden block transition-all duration-300 group">
                <div className="aspect-video overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#06060c] via-[#06060c]/40 to-transparent z-10" />
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                    {product.icon}
                    {product.tag}
                  </div>
                </div>
                <div className="p-8 relative z-20 -mt-16 bg-gradient-to-t from-[#0a1a5c]/40 to-transparent">
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-blue-400 transition-colors drop-shadow-md">{product.title}</h3>
                  <p className="text-zinc-400 mb-8 leading-relaxed line-clamp-2">{product.desc}</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProduct(product); }}
                      className="text-sm font-bold text-blue-300 flex items-center justify-center gap-2 bg-blue-500/10 px-4 py-2.5 rounded-xl hover:bg-blue-500/20 border border-blue-500/20 transition-colors w-full sm:w-auto flex-1 cursor-pointer"
                    >
                      تفاصيل المنتجات
                    </button>
                    <a 
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-bold text-white flex flex-row-reverse items-center justify-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl hover:bg-blue-500 hover:text-white transition-colors w-full sm:w-auto flex-1 z-30"
                    >
                      شراء الآن <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <motion.a 
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            href={STORE_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-panel rounded-2xl hover:bg-white/10 transition-all text-white font-bold"
          >
            عرض جميع المنتجات <ExternalLink className="w-5 h-5" />
          </motion.a>
        </motion.div>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] flex justify-center items-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#06060c] border border-blue-500/30 rounded-[2rem] p-6 md:p-8 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-[0_0_50px_rgba(37,99,235,0.2)] relative custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 left-6 w-10 h-10 bg-white/5 hover:bg-red-500/20 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                  <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedProduct.title}</h3>
                  <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full text-xs font-bold mt-2 w-fit">
                    {selectedProduct.icon} {selectedProduct.tag}
                  </div>
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none text-zinc-300">
                {selectedProduct.details.split('\n').map((line: string, i: number) => {
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} className="my-1.5">{line}</p>;
                })}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
                <a 
                  href={selectedProduct.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-4 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  انتقل للمتجر لشراء المنتج <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Reviews() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const reviewImages = [
    "/reviews/0092536c-2359-46e6-9687-68bd8a63ab2a.jpg",
    "/reviews/148a0680-d94f-4872-8edc-baae55fb99c3.png",
    "/reviews/15b5fba4-c8cd-410a-ba44-a40b387006be.jpg",
    "/reviews/1cf6fde4-f699-48c1-b138-62b31d85481e.png",
    "/reviews/1edfc461-eafa-4876-9be9-de6b668c0410.jpg",
    "/reviews/21257bad-57a1-46b8-b4a9-170b65b0517c.png",
    "/reviews/3db92eae-f863-4bf2-b642-b1a7065e6141.jpg",
    "/reviews/5766c4f7-aabf-4859-a93f-809699dde917.jpg",
    "/reviews/666acf6b-07d4-4764-84ec-7ed1886e0dd7.jpg",
    "/reviews/6d44bcab-1467-4c02-bb58-6ac082c30616.png",
    "/reviews/6d8059c1-8fb0-4374-8825-72ef42b4e67a.jpg",
    "/reviews/8801a17d-01f2-4f58-9810-2155bc2ebdd2.jpg",
    "/reviews/93081051-6699-465a-a156-0f1d15b01a5a.jpg",
    "/reviews/a06a962f-6c53-488c-a8c8-af98e10ce1a7.jpg",
    "/reviews/c0b2af52-a6aa-4278-8c67-51d88500b468.png",
    "/reviews/d4c3fce5-32ea-4b0d-af20-f64fe1b66b8d.jpg",
    "/reviews/ef94177f-cb9c-42b1-8f54-995b3c33385d.jpg",
    "/reviews/f6cfed1a-8c23-41d9-85f7-e1d33961e2b8.jpg"
  ];

  useEffect(() => {
    if (isModalOpen || selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, selectedImage]);

  return (
    <section id="reviews" className="py-32 relative z-10">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">آراء العملاء</h2>
          <p className="text-zinc-400 text-lg">تقييمات عملائنا من متجر سلة</p>
        </motion.div>

        <TiltCard className="max-w-5xl mx-auto glass-panel glass-panel-hover rounded-[2rem] overflow-hidden relative group cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <div className="absolute inset-0 z-0 flex rounded-[2rem] overflow-hidden opacity-30 group-hover:opacity-50 transition-opacity duration-500 blur-sm">
            <div className="grid grid-cols-3 gap-2 p-2 w-full h-full">
              {reviewImages.slice(0, 3).map((src, i) => (
                <img key={i} src={src} className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-500" alt="تقييم" />
              ))}
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-[#06060c]/60 to-black/90 z-10" />
          
          <div className="relative z-20 flex flex-col items-center justify-center p-16 md:p-32 text-center h-[400px]">
            <Star className="w-16 h-16 text-yellow-500 fill-yellow-500 mb-6 drop-shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
            <h3 className="text-3xl md:text-5xl font-bold text-white mb-8 drop-shadow-lg">مئات التقييمات الإيجابية</h3>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
              className="px-10 py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xl rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] hover:shadow-[0_10px_40px_rgba(37,99,235,0.6)] hover:-translate-y-1 flex items-center gap-2 border-t border-blue-400/30"
            >
              عرض التقييمات
            </button>
          </div>
        </TiltCard>

        {isModalOpen && createPortal(
          <div className="relative z-[999999]">
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="fixed inset-0 flex justify-center items-center p-4 md:p-10 bg-black/80 backdrop-blur-md overflow-y-auto"
              >
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-[#0a0a0f] border border-white/10 rounded-[2rem] p-6 md:p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto relative shadow-[0_0_50px_rgba(0,0,0,0.5)] custom-scrollbar"
                >
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-6 left-6 md:top-8 md:left-8 w-10 h-10 bg-white/5 hover:bg-red-500/20 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-400 transition-colors z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex flex-col items-center mb-10">
                    <Star className="w-12 h-12 text-yellow-500 fill-yellow-500 mb-4 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
                    <h3 className="text-3xl md:text-4xl font-bold text-center text-white drop-shadow-md">تقييمات عملائنا</h3>
                  </div>
                  
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {reviewImages.map((src, idx) => (
                      <motion.div 
                        key={idx}
                        onClick={() => setSelectedImage(src)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="break-inside-avoid rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/50 transition-colors bg-white/5 cursor-zoom-in relative group"
                      >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors z-10 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg transition-transform transform scale-90 group-hover:scale-100">
                            تكبير
                          </span>
                        </div>
                        <img src={src} alt={`تقييم ${idx + 1}`} className="w-full h-auto" />
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-16 mb-8 text-center flex justify-center">
                    <div className="px-12 py-4 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
                      <p className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                        ... وغيرها الكثير ...
                      </p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {selectedImage && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedImage(null)}
                  className="fixed inset-0 z-[9999999] flex justify-center items-center p-4 bg-black/95 backdrop-blur-xl"
                >
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-6 left-6 w-12 h-12 bg-white/10 hover:bg-red-500/20 rounded-full flex items-center justify-center text-white hover:text-red-400 transition-colors z-[100]"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <motion.img 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", bounce: 0.4 }}
                    onClick={(e) => e.stopPropagation()}
                    src={selectedImage} 
                    alt="عرض مكبر" 
                    className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl relative z-50 cursor-zoom-out"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>,
          document.body
        )}
      </div>
    </section>
  );
}

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "هل رقم الطلب أقدر استخدمه طول الوقت؟",
      answer: "نعم، رقم الطلب سيرتبط بحسابك بشكل دائم ولا يوجد له مدة انتهاء. ولكن السبوفر يستخدم لفك الحظر مرة واحدة، وإذا أردت سبوفر دائم اطلب منتج (سبوفر مدى الحياة)."
    },
    {
      question: "هل أستخدمه مرة واحدة ولا كل ما شغّلت الـ PC؟",
      answer: "فقط تستعمله مرة واحدة تفك فيها باندك عن اللعبة المطلوبة، ثم خلاص ترتاح! ما يحتاج تشغّل السبوفر غير مرة واحدة للأبد."
    },
    {
      question: "هل أقدر أدخل بحسابي القديم ولا لازم حساب جديد؟",
      answer: "لا، ما تقدر تدخل بحسابك القديم لأن مربوط فيه الباند. لازم حساب جديد نظيف عشان يكون ما عليه باند.\n\nإلا إذا حسابك القديم مو متبند ولا قد دخلت فيه أبداً لما كنت متبند."
    },
    {
      question: "هل يحتاج فورمات؟",
      answer: "في الغالب ما يحتاج أبداً! لكن لو ظهرت عندك مشكلة تستوجب الفورمات، وقتها راح تعرف لأن بعض الأنظمة تكون معطوبة."
    },
    {
      question: "هل لازم أطفي الحماية؟",
      answer: "نعم، مهم جداً! لازم تطفي الحماية (Windows Defender) عشان كل شي يمشي صح."
    },
    {
      question: "هل يفك باند سنه 365 يوم فورت نايت ؟",
      answer: "نعم يفكه نهائي + يفك بوطولات"
    },
    {
      question: "هل يفك باند الهارد وير ؟",
      answer: "نعم يقدر يفك باند الهاردوير بل كامل"
    },
    {
      question: "ماعرفت كيف تستخدم المنتج الاسبوفر ؟",
      answer: "اذا ماعرفت تسويه في خدمه ب 35 ريال يجيك دعم يسوي لك خطوات وكلشي وبيكون معك اول باول وتقدر تسال اي سوال عادي"
    },
    {
      question: "هل اقدر افرمت بعد مااستعمل الاسبوفر وا ينفك باندي ؟",
      answer: "نعم تقدر لو ترفمت 100 مره وا تبيع الجهاز مايرجع لك الباند ابدا"
    },
    {
      question: "هل لما تدخل قيم في فورت نايت يطلعك من القيم وا تضهر رساله لك ؟",
      answer: (
        <div className="flex flex-col gap-5 mt-3">
          <p className="leading-relaxed">
            مشكلتك باند هارد وير وا الحل ؟ تتوجه المتجر وتاخذ لك (
            <a href="https://salla.sa/t3nn/BpwOKQa" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 mx-1 transition-colors">منتج فك باند فورت نايت</a>
            ) وتحط رقم طلبك في استلام الطلبات في نفس الموقع وا بيوصلك كل شي تحتاجه
          </p>
          <img src="/hwid-message.png" alt="رسالة باند هاردوير" className="max-w-[100%] md:max-w-[400px] w-auto h-auto rounded-xl border border-white/10 shadow-lg object-contain" />
        </div>
      )
    }
  ];

  return (
    <section id="faq" className="py-32 relative z-10">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center gap-4 mb-16 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-2">
            <HelpCircle className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold drop-shadow-md">الأسئلة الشائعة</h2>
          <p className="text-zinc-400 text-lg">إجابات لأكثر الأسئلة المتكررة</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <div 
                className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.1)]' : ''}`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-right hover:bg-white/5 transition-colors"
                >
                  <span className="font-bold text-lg text-white flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-sm font-bold border border-blue-500/20 shrink-0">
                      {index + 1}
                    </span>
                    {faq.question}
                  </span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="shrink-0 mr-4"
                  >
                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-0 mr-11">
                        {typeof faq.answer === 'string' ? (
                          <p className="text-zinc-400 leading-relaxed whitespace-pre-line text-base">{faq.answer}</p>
                        ) : (
                          <div className="text-zinc-400 leading-relaxed text-base">{faq.answer}</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Policies() {
  const policies = [
    {
      title: "سياسة الاسترجاع",
      content: "يتم استرجاع المبلغ فقط في حال وجود خطأ من المسؤول أو المنفذ للطلب. غير ذلك لا يحق للعميل المطالبة بالاسترجاع."
    },
    {
      title: "بعد الشراء",
      content: "لا يمكنك طلب استرجاع المبلغ بعد شراء المنتج أو استلامه بأي حال من الأحوال، يرجى التأكد قبل إتمام عملية الدفع."
    },
    {
      title: "فترة الضمان",
      content: "لا يمكن طلب تعويض أو استرجاع بعد مرور 3 أيام من استخدام المنتج. نرجو فحص المنتج فور استلامه."
    }
  ];

  return (
    <section id="policies" className="py-32 relative z-10">
      <div className="absolute inset-0 bg-gradient-to-t from-[#050508] to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 max-w-4xl relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center gap-4 mb-16 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-2">
            <ShieldAlert className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold drop-shadow-md">القوانين والشروط</h2>
        </motion.div>

        <div className="space-y-6">
          {policies.map((policy, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <TiltCard className="glass-panel-hover glass-panel rounded-2xl p-6 md:p-8 flex gap-6 items-start transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold shrink-0 border border-blue-500/20 shadow-inner">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{policy.title}</h3>
                  <p className="text-zinc-400 leading-relaxed text-lg">{policy.content}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-red-400 text-center font-medium shadow-[0_0_30px_rgba(239,68,68,0.05)] backdrop-blur-sm"
        >
          شرائك من المتجر يعني موافقتك التامة على جميع الشروط والقوانين المذكورة أعلاه.
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 border-t border-white/5 bg-[#050508] text-center relative z-20">
      <div className="container mx-auto px-4">
        <motion.img 
          whileHover={{ scale: 1.1, rotate: 5, filter: "grayscale(0%) opacity(100%)" }}
          src={LOGO_URL} 
          alt="تعن T3N" 
          className="w-16 h-16 object-contain mx-auto mb-6 opacity-40 grayscale transition-all duration-500 rounded-xl" 
        />
        <p className="text-zinc-500 text-sm mb-6 font-medium">
          جميع الحقوق محفوظة لمتجر تعن T3N &copy; {new Date().getFullYear()}
        </p>
        <div className="flex items-center justify-center gap-6 text-zinc-600">
          <a href={STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">المتجر</a>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ديسكورد</a>
        </div>
      </div>
    </footer>
  );
}

function SpooferGuide({ onClose }: { onClose: () => void }) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const winCommand = 'windowsdefender://threatsettings/';

  const copyCommand = () => {
    navigator.clipboard.writeText(winCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  useEffect(() => {
    // Lock body scroll when overlay is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{
        background: 'radial-gradient(ellipse at center, #0a1a5c 0%, #040c2e 50%, #020618 100%)',
      }}
    >
      {/* Blue Grid Background */}
      <div className="fixed inset-0 z-0 opacity-30 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.15) 0%, transparent 70%)',
      }} />

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#040c2e]/80 border-b border-blue-500/20">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="T3N" className="w-10 h-10 object-contain rounded-lg" />
            <span className="font-bold text-xl text-white">شرح السبوفر Spoofer</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl relative z-10">
        
        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Cpu className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200">شرح استخدام السبوفر</h1>
          <p className="text-blue-200/60 text-lg max-w-2xl mx-auto">اتبع الخطوات التالية بالترتيب لتفعيل السبوفر بنجاح</p>
        </motion.div>

        {/* ===== STEP 1: Disable Defender ===== */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="rounded-2xl p-6 md:p-8 bg-[#0a1a5c]/60 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.1)]">
            <div className="flex gap-5 items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center shrink-0 border border-red-500/20">
                <Shield className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">أول شي: تطفي الحماية بشكل كامل</h3>
                <p className="text-blue-200/60 leading-relaxed text-lg">والي ما يعرف، تضغط <span className="text-white font-bold">Win+R</span> وتحط هذا الأمر:</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/40 rounded-xl p-4 border border-blue-500/20 mb-4">
              <code className="text-blue-300 font-mono text-lg flex-1 select-all" dir="ltr">{winCommand}</code>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyCommand}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${copiedCmd ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
              >
                {copiedCmd ? <><CheckCircle2 className="w-4 h-4" /> تم النسخ</> : <><ExternalLink className="w-4 h-4" /> نسخ</>}
              </motion.button>
            </div>
            
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <p className="text-red-400 font-bold text-lg">⚠️ وتطفي جميع الخيارات حقت الحماية اللي ظاهرة لك بالكامل!</p>
            </motion.div>
          </div>
        </motion.div>

        {/* ===== STEP 2: UpdatedApple ===== */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <div className="rounded-2xl p-6 md:p-8 bg-[#0a1a5c]/60 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.1)]">
            <div className="flex gap-5 items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-400 flex items-center justify-center shrink-0 border border-yellow-500/20">
                <FileArchive className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">ثم تروح لملف discord.gg t3n</h3>
                <p className="text-blue-200/60 leading-relaxed text-lg">تدخل على مجلد <span className="text-white font-bold">كلين</span> ثم تشغل ملف <span className="text-yellow-400 font-bold">UpdatedApple.exe</span> — مهم تسويه قبل السبوفر!</p>
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">👇</span> شرح UpdatedApple طريقة استعمال
            </h4>
            <div className="rounded-xl overflow-hidden border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full" preload="metadata">
                <source src="/video-updatedapple.mp4" type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>
          </div>
        </motion.div>

        {/* ===== STEP 3: Spoofer ===== */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <div className="rounded-2xl p-6 md:p-8 bg-[#0a1a5c]/60 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.1)]">
            <div className="flex gap-5 items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Cpu className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-white">بعد ما تسوي UpdatedApple.exe وإعادة تشغيل للجهاز</h3>
                <p className="text-blue-200/60 leading-relaxed text-lg">تكمل شرح السبوفر 👇</p>
              </div>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-400">👇</span> شرح السبوفر
            </h4>
            <div className="rounded-xl overflow-hidden border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full" preload="metadata">
                <source src="/video-spoofer.mp4" type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>
          </div>
        </motion.div>

        {/* ===== STEP 4: Done ===== */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }} className="mb-8">
          <div className="rounded-2xl p-6 md:p-8 bg-[#0a1a5c]/60 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.1)]">
            <div className="flex flex-col md:flex-row gap-5 items-start">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Gamepad2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-white">بعد ما تسوي السبوفر وإعادة تشغيل للجهاز</h3>
                <p className="text-blue-200/60 leading-relaxed text-lg mb-4">تخش بحساب جديد بأي لعبة تبيها ومبروك عليك باندك انفك! 🎉</p>
                
                <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 mb-6 flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-red-200 text-sm md:text-base font-bold leading-relaxed">
                    مهم جداً: لازم تسوي وتخش بحساب جديد تماماً عشان ما يرجع لك الباند! لو دخلت بحسابك القديم المتبند راح تنحظر من جديد وعشان تتأكد إنه راح الباند.
                  </p>
                </div>

                <div className="bg-black/30 p-5 md:p-6 rounded-2xl border border-blue-500/10">
                  <p className="text-zinc-200 leading-relaxed mb-3 font-medium">
                    وهذا <a href="https://tmailor.com/ar/" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all">موقع ايميل مهمل</a> تقدر تسوي فيه حساب على السريع.
                  </p>
                  <p className="text-zinc-400 leading-relaxed">
                    ولو ما زبط دور لك ايميل معتمد سوا{' '}
                    <a href="https://mail.google.com/mail" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all">gmail</a>{' '}
                    أو{' '}
                    <a href="https://account.proton.me/mail" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all">Proton Mail</a>{' '}
                    أو أي ايميل جاهز عندك.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ===== Formatted Warning Section ===== */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }} className="mb-8">
          <div className="rounded-2xl p-6 md:p-8 bg-black/40 backdrop-blur-lg border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-red-500 to-transparent"></div>
            
            <div className="flex gap-5 items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 border border-red-500/30">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-red-500">تنبيه للي ما ضبط معه ⚠️</h3>
                <p className="text-red-200/80 leading-relaxed text-lg">
                  والي ما يضبط معه أو رجع له الباند، يفرمت الجهاز PC بفلاشة USB.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <a href="https://youtu.be/XZ-9RbqlA2k?si=AfSzAF9BtqForaG6" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#0a1a5c]/40 p-5 rounded-xl border border-blue-500/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-bold text-white group">
                <div className="bg-red-500/20 p-2 rounded-lg text-red-400 group-hover:bg-red-500/40 transition-colors">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-red-300/60 mb-1">شرح يوتيوب</div>
                  <div className="text-lg">فورمات ويندوز <span className="text-blue-400">11</span></div>
                </div>
              </a>
              <a href="https://youtu.be/WaFxvUmsNWs?si=EORZDATVTJYPor_X" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#0a1a5c]/40 p-5 rounded-xl border border-blue-500/20 hover:border-red-500/50 hover:bg-red-500/10 transition-all font-bold text-white group">
                <div className="bg-red-500/20 p-2 rounded-lg text-red-400 group-hover:bg-red-500/40 transition-colors">
                  <MonitorPlay className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-red-300/60 mb-1">شرح يوتيوب</div>
                  <div className="text-lg">فورمات ويندوز <span className="text-blue-400">10</span></div>
                </div>
              </a>
            </div>

            <p className="text-white font-bold mt-6 text-center text-lg bg-red-500/20 p-4 rounded-xl border border-red-500/30 shadow-inner">
              وبعد الفورمات عيد خطوات الشرح كاملة، وخش بحساب جديد، وبينفك الباند عنك! 💯
            </p>
          </div>
        </motion.div>

        {/* ===== Reviews Section ===== */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mb-6">
          <div className="rounded-2xl p-6 md:p-8 bg-[#0a1a5c]/60 backdrop-blur-lg border border-yellow-500/20 shadow-[0_0_25px_rgba(234,179,8,0.1)] text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, rotate: -180 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.8 + i * 0.1, type: "spring", stiffness: 200 }}
                  className="w-12 h-12 relative"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(234,179,8,0.5))' }}
                >
                  <img
                    src={LOGO_URL}
                    alt="★"
                    className="w-full h-full object-cover"
                    style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
                  />
                </motion.div>
              ))}
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">شي أخير، لا تحرمنا من تقييمك!</h3>
            <p className="text-blue-200/60 text-lg mb-2">
              في روم الدسكورد{' '}
              <a href="https://discord.com/channels/1396959491786018826/1397221014215331891" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 transition-colors">التقييمات</a>
              {' '}وفي{' '}
              <a href="https://salla.sa/t3nn/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-4 transition-colors">متجر تعن</a>
            </p>
          </div>
        </motion.div>

        {/* Note about role */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}>
          <div className="rounded-2xl p-5 bg-blue-500/5 border border-blue-500/20 text-center">
            <p className="text-blue-300/70 text-sm leading-relaxed">
              إذا ما عندك الرتبة عشان تقيّم في الديسكورد، روح عند <span className="text-white font-bold">استلام الطلبات</span> وحط رقم طلبك وبيطلع لك خيار <span className="text-white font-bold">ربط الحساب وإستلام الرتبة</span>
            </p>
          </div>
        </motion.div>

        {/* Back Button */}
        <div className="mt-12 text-center pb-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-8 py-3 bg-white/10 text-white rounded-xl border border-white/10 hover:bg-white/20 transition-all font-bold"
          >
            الرجوع للصفحة الرئيسية
          </motion.button>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

function SiteGuide({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
    >
      {/* Background Image */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none" style={{ backgroundImage: 'url("/bg-site-guide.jpg")' }} />
      <div className="fixed inset-0 z-0 bg-black/50 backdrop-blur-sm pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/10">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="T3N" className="w-10 h-10 object-contain rounded-lg shadow-lg" />
            <span className="font-bold text-xl text-white drop-shadow-md">شرح بوابة تعن</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10 backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 w-full">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-xl">فيديو شرح الموقع</h1>
          <p className="text-zinc-200 text-lg max-w-2xl mx-auto drop-shadow-md">الآن يمكنك مشاهدة طريقة استخدام مميزات البوابة وربط حسابك خطوة بخطوة</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.2 }}
          className="w-full rounded-[2rem] overflow-hidden border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.6)] bg-black/60 backdrop-blur-lg"
        >
          <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} poster="/guide-poster.jpg" className="w-full h-auto max-h-[70vh] aspect-[16/9] object-contain" autoPlay playsInline>
            <source src="/guide-video.mp4" type="video/mp4" />
            متصفحك لا يدعم تشغيل الفيديو
          </video>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="mt-12 text-center pb-12 w-full"
        >
          <button
            onClick={onClose}
            className="px-10 py-4 bg-white/10 text-white rounded-2xl border border-white/20 hover:bg-white/20 transition-all font-bold backdrop-blur-lg shadow-xl"
          >
            الرجوع للصفحة الرئيسية
          </button>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}

function TroubleshootGuide({ onClose }: { onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    // Lock body scroll when overlay is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
    >
      {/* Dark Base Background */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{ backgroundColor: '#030000' }} 
      />

      {/* Red Glow at the bottom */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-80" 
        style={{
          background: 'radial-gradient(60% 60% at 50% 100%, rgba(200, 10, 10, 0.6) 0%, transparent 100%)'
        }}
      />

      {/* Crisp CSS Grid */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-40" 
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} 
      />

      {/* Dark fade overlay from top (so the grid fades into black like the original image) */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none" 
        style={{
          background: 'linear-gradient(to bottom, #000000 0%, rgba(0,0,0,0.8) 20%, transparent 60%)'
        }}
      />
      
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 z-0 bg-black/40 pointer-events-none backdrop-blur-[1px]" />

      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-black/60 border-b border-red-500/30">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="T3N" className="w-10 h-10 object-contain rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
            <span className="font-bold text-xl text-white drop-shadow-md">حل مشاكل السبوفر</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/30 hover:text-red-400 transition-all border border-white/20 backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 max-w-5xl relative z-10 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full mb-16">
          <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Wrench className="w-12 h-12 text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white drop-shadow-xl">شروحات حل المشاكل</h1>
          <p className="text-red-200/80 text-xl font-bold max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            هنا تجد جميع الحلول والفيديوهات لحل أي مشكلة قد تواجهك أثناء تطبيق السبوفر
          </p>
        </motion.div>

        {/* Tutorials Grid */}
        <div className="w-full grid gap-8 md:grid-cols-1">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#0a0a0f]/80 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center">
            
            <div className="flex gap-4 items-center mb-8 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-lg">1</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">حل مشكلة خطأ الوقت</h3>
            </div>
            
            <p className="text-zinc-300 text-xl font-medium mb-6 leading-relaxed text-center">
              هل تظهر لك رسالة خطأ الوقت الموضحة بالصورة؟
            </p>
            
            <div 
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg mb-8 max-w-2xl w-full cursor-zoom-in relative group"
              onClick={() => setSelectedImage('/error-time.png')}
            >
              <img src="/error-time.png" alt="صورة خطأ الوقت" className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-bold text-sm">
                  <Maximize2 className="w-4 h-4" /> انقر لتكبير الصورة
                </span>
              </div>
            </div>
            
            <div className="w-full max-w-3xl flex items-center gap-4 mb-8 opacity-90">
              <span className="h-[2px] flex-1 bg-gradient-to-l from-red-500 to-transparent"></span>
              <span className="text-red-400 font-bold flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-7 h-7" /> إليك الحل بالفيديو 👇
              </span>
              <span className="h-[2px] flex-1 bg-gradient-to-r from-red-500 to-transparent"></span>
            </div>

            <div className="w-full max-w-4xl rounded-3xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)] bg-black backdrop-blur-sm">
              <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full aspect-video outline-none" preload="metadata">
                <source src="/video-solution-time.mp4" type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>

          </motion.div>

          {/* Second Tutorial: Epic Games Error */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0a0a0f]/80 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center">
            
            <div className="flex gap-4 items-center mb-8 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-lg">2</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">إيبك قيمز لا يعمل أو لا يحمل؟</h3>
            </div>
            
            <p className="text-zinc-300 text-xl font-medium mb-6 leading-relaxed text-center">
              هل تواجه مشكلة في تشغيل إيبك قيمز أو عدم قدرتة على التحميل بعد تطبيق الشرح؟
            </p>
            
            <div 
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg mb-8 max-w-2xl w-full cursor-zoom-in relative group"
              onClick={() => setSelectedImage('/error-epic.png')}
            >
              <img src="/error-epic.png" alt="صورة مشكلة إيبك قيمز" className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300 bg-black/50" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-bold text-sm">
                  <Maximize2 className="w-4 h-4" /> انقر لتكبير الصورة
                </span>
              </div>
            </div>
            
            <div className="w-full max-w-3xl flex items-center gap-4 mb-8 opacity-90">
              <span className="h-[2px] flex-1 bg-gradient-to-l from-red-500 to-transparent"></span>
              <span className="text-red-400 font-bold flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-7 h-7" /> إليك الحل بالفيديو 👇
              </span>
              <span className="h-[2px] flex-1 bg-gradient-to-r from-red-500 to-transparent"></span>
            </div>

            <div className="w-full max-w-4xl rounded-3xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)] bg-black backdrop-blur-sm">
              <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full aspect-video outline-none" preload="metadata">
                <source src="/video-solution-epic.mp4" type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>

          </motion.div>

          {/* Third Tutorial: Network / Blue Text Error */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0a0a0f]/80 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center">
            
            <div className="flex gap-4 items-center mb-8 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-lg">3</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">خطأ في الشبكة أو كلام أزرق؟</h3>
            </div>
            
            <p className="text-zinc-300 text-xl font-medium mb-6 leading-relaxed text-center">
              هل عند تشغيل السبوفر يطفى فجأة أو يظهر لك خطأ بالشبكة و رسالة باللون الأزرق الموضحة؟
            </p>
            
            <div 
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg mb-8 max-w-2xl w-full cursor-zoom-in relative group"
              onClick={() => setSelectedImage('/error-network.png')}
            >
              <img src="/error-network.png" alt="صورة خطأ الشبكة" className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300 bg-black/50" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-bold text-sm">
                  <Maximize2 className="w-4 h-4" /> انقر لتكبير الصورة
                </span>
              </div>
            </div>
            
            <div className="w-full max-w-3xl flex items-center gap-4 mb-8 opacity-90">
              <span className="h-[2px] flex-1 bg-gradient-to-l from-red-500 to-transparent"></span>
              <span className="text-red-400 font-bold flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-7 h-7" /> إليك الحل بالفيديو 👇
              </span>
              <span className="h-[2px] flex-1 bg-gradient-to-r from-red-500 to-transparent"></span>
            </div>

            <div className="w-full max-w-4xl rounded-3xl overflow-hidden border-2 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.2)] bg-black backdrop-blur-sm">
              <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full aspect-video outline-none" preload="metadata">
                <source src="/video-solution-network.mp4" type="video/mp4" />
                متصفحك لا يدعم تشغيل الفيديو
              </video>
            </div>

            {/* WARP Download Section */}
            <div className="w-full max-w-4xl mt-8 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_20px_rgba(59,130,246,0.1)] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
                  <Download className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xl md:text-2xl font-bold text-white mb-3 flex items-center gap-2 flex-wrap">
                    <span>رابط تحميل برنامج</span>
                    <img src="/warp-icon.png" alt="WARP" className="h-6 md:h-7 w-auto object-contain" style={{ transform: "translateY(1px)" }} />
                    <span>WARP</span>
                  </h4>
                  <p className="text-blue-200/80 leading-relaxed max-w-lg">
                    حمله من هنا، وبعد التثبيت كمل الشرح في الفيديو لحل المشكلة بالكامل.
                  </p>
                </div>
              </div>
              <a 
                href="https://downloads.cloudflareclient.com/v1/download/windows/ga" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full md:w-auto bg-[#F38020] hover:bg-[#F38020]/80 text-white font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] shadow-lg shrink-0"
              >
                تحميل البرنامج الآن <Download className="w-5 h-5" />
              </a>
            </div>

            {/* USB Format Warning */}
            <div className="w-full max-w-4xl mt-8 bg-red-950/40 border border-red-500/30 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-yellow-500 shrink-0" />
                <h4 className="text-2xl font-bold text-red-400">تنبيه هام جداً! ⚠️</h4>
              </div>
              
              <p className="text-zinc-200 text-lg md:text-xl font-medium mb-8 leading-relaxed text-right border-r-4 border-red-500 pr-4">
                للي ما زبط معه الطريقة اللي في الفيديو والمشكلة نفسها للحين موجودة؛ الحل الوحيد إنك <span className="text-red-400 font-bold">تفرمت بفلاشة USB</span> ثم ترجع بعد الفورمات وبيشتغل معك البرنامج طبيعي.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://youtu.be/XZ-9RbqlA2k?si=AfSzAF9BtqForaG6" target="_blank" rel="noopener noreferrer" className="bg-black/50 hover:bg-white/5 border border-white/10 hover:border-red-500/30 rounded-xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] shadow-lg text-right">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                    <Youtube className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-lg mb-1">شرح فورمات Windows 11</h5>
                    <span className="text-sm text-blue-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> انقر للمشاهدة على يوتيوب</span>
                  </div>
                </a>

                <a href="https://youtu.be/WaFxvUmsNWs?si=EORZDATVTJYPor_X" target="_blank" rel="noopener noreferrer" className="bg-black/50 hover:bg-white/5 border border-white/10 hover:border-red-500/30 rounded-xl p-5 flex items-center gap-4 transition-all hover:scale-[1.02] shadow-lg text-right">
                  <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
                    <Youtube className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-lg mb-1">شرح فورمات Windows 10</h5>
                    <span className="text-sm text-blue-400 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> انقر للمشاهدة على يوتيوب</span>
                  </div>
                </a>
              </div>
            </div>

          </motion.div>

          {/* Fourth Tutorial: Antivirus Error */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0a0a0f]/80 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center">
            
            <div className="flex gap-4 items-center mb-8 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-lg">4</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">خطأ بسبب حماية الويندوز؟</h3>
            </div>
            
            <p className="text-zinc-300 text-xl font-medium mb-6 leading-relaxed text-center">
              لما تشغل ملف السبوفر أو UpdatedApple ويطلع لك رسالة الخطأ هذي؟
            </p>
            
            <div 
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg mb-8 max-w-2xl w-full cursor-zoom-in relative group"
              onClick={() => setSelectedImage('/error-antivirus.png')}
            >
              <img src="/error-antivirus.png" alt="صورة خطأ الحماية" className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300 bg-white" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-bold text-sm">
                  <Maximize2 className="w-4 h-4" /> انقر لتكبير الصورة
                </span>
              </div>
            </div>
            
            <div className="w-full max-w-3xl flex items-center gap-4 mb-8 opacity-90">
              <span className="h-[2px] flex-1 bg-gradient-to-l from-red-500 to-transparent"></span>
              <span className="text-red-400 font-bold flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-7 h-7" /> الحل بخطوات سريعة 👇
              </span>
              <span className="h-[2px] flex-1 bg-gradient-to-r from-red-500 to-transparent"></span>
            </div>

            <div className="w-full max-w-4xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <ol className="list-decimal list-inside text-zinc-200 text-lg md:text-xl font-medium leading-loose space-y-5 text-right">
                <li>الحل إنك ترجع وتتأكد إنك مطفي الحماية.</li>
                <li>تضغط زر <kbd className="bg-black/50 text-white px-3 py-1 rounded-lg border border-white/20 font-sans mx-1">Win + R</kbd> وتحط الأمر هذا في المربع: <br/>
                  <div className="bg-black/70 p-4 mt-3 mb-2 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-500/30 shadow-inner">
                    <div className="text-blue-400 font-sans text-[1.1rem] md:text-xl select-all overflow-x-auto text-left" dir="ltr">
                      windowsdefender://threatsettings/
                    </div>
                    <CopyButton text="windowsdefender://threatsettings/" />
                  </div>
                </li>
                <li>الآن قم بإيقاف الحماية بالكامل، ثم ارجع وفك ضغط الملف من جديد.</li>
                <li>بمجرد فك الضغط، شغل الملف اللي تبيه وراح يشتغل معك بدون أي مشاكل! 💯</li>
              </ol>
            </div>
        </motion.div>

          {/* Fifth Tutorial: DLL Missing Error */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0a0a0f]/80 backdrop-blur-md p-6 lg:p-10 rounded-[2rem] border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] flex flex-col items-center">
            
            <div className="flex gap-4 items-center mb-8 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 text-white font-bold text-lg">5</span>
              <h3 className="text-2xl md:text-3xl font-bold text-white">مشكلة تعريفات النظام (DLL) الناقصة؟</h3>
            </div>
            
            <p className="text-zinc-300 text-xl font-medium mb-6 leading-relaxed text-center">
              هل تظهر لك رسالة الخطأ هذي لما تشغل السبوفر أو UpdatedApple؟
            </p>
            
            <div 
              className="rounded-2xl overflow-hidden border-2 border-white/10 shadow-lg mb-8 max-w-2xl w-full cursor-zoom-in relative group"
              onClick={() => setSelectedImage('/error-dll.png')}
            >
              <img src="/error-dll.png" alt="صورة خطأ ملفات النظام" className="w-full h-auto object-cover opacity-90 group-hover:scale-[1.02] transition-transform duration-300 bg-white/5" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-black/80 text-white px-4 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 font-bold text-sm">
                  <Maximize2 className="w-4 h-4" /> انقر لتكبير الصورة
                </span>
              </div>
            </div>
            
            <div className="w-full max-w-3xl flex items-center gap-4 mb-8 opacity-90">
              <span className="h-[2px] flex-1 bg-gradient-to-l from-red-500 to-transparent"></span>
              <span className="text-red-400 font-bold flex items-center gap-2 text-xl">
                <CheckCircle2 className="w-7 h-7" /> روابط التحميل للإصلاح 👇
              </span>
              <span className="h-[2px] flex-1 bg-gradient-to-r from-red-500 to-transparent"></span>
            </div>

            <div className="w-full max-w-4xl bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.1)]">
              <p className="text-zinc-200 text-lg md:text-xl font-medium leading-relaxed text-center md:text-right mb-6">
                هذي المشكلة بسبب أن تعريفات ومكونات النظام بجهازك ناقصة. الحل سهل، حمل الملفين هذي وثبتها:
              </p>

              <div className="flex flex-col gap-4 mb-8">
                <a href="https://aka.ms/vc14/vc_redist.x64.exe" target="_blank" rel="noopener noreferrer" className="bg-[#121212] hover:bg-black border border-white/10 hover:border-blue-500/40 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:scale-[1.02] shadow-md group">
                  <div className="flex items-center gap-4">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" className="w-8 h-8 object-contain" />
                    <div>
                      <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors">Microsoft Visual C++ Redistributable</h4>
                      <p className="text-zinc-500 text-sm mt-1">أحدث إصدار ضروري للنظام</p>
                    </div>
                  </div>
                  <span className="text-blue-400 bg-blue-500/10 font-bold px-4 py-2 flex-shrink-0 rounded-lg text-sm flex items-center justify-center gap-2 w-full md:w-auto border border-blue-500/20"><Download className="w-4 h-4" /> تحميل الآن</span>
                </a>

                <a href="https://dotnet.microsoft.com/en-us/download/dotnet-framework/thank-you/net48-web-installer" target="_blank" rel="noopener noreferrer" className="bg-[#121212] hover:bg-black border border-white/10 hover:border-purple-500/40 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:scale-[1.02] shadow-md group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#512bd4] flex items-center justify-center shrink-0 border border-white/10">
                      <span className="text-white font-bold italic text-xs">.NET</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors">.NET Framework</h4>
                      <p className="text-zinc-500 text-sm mt-1">Windows-only version</p>
                    </div>
                  </div>
                  <span className="text-purple-400 bg-purple-500/10 font-bold flex-shrink-0 px-4 py-2 rounded-lg text-sm flex items-center justify-center gap-2 w-full md:w-auto border border-purple-500/20"><Download className="w-4 h-4" /> تحميل الآن</span>
                </a>
              </div>

              <div className="border-t-2 border-red-500/30 pt-6 mt-4 flex items-start gap-4">
                <CheckCircle2 className="w-8 h-8 text-green-500 shrink-0" />
                <p className="text-white text-lg leading-relaxed">
                  <span className="font-bold text-green-400">وأخيراً: </span> 
                  بعد التحميل والتثبيت، ارجع شغل ملف السبوفر أو UpdatedApple حسب البرنامج اللي تبي تستعمله وبيشتغل معك بدون مشاكل! 💯
                </p>
              </div>
            </div>
            
          </motion.div>

        </div>

        {/* Support Section */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-16 text-center w-full max-w-2xl bg-blue-500/10 backdrop-blur-md p-8 rounded-3xl border border-blue-500/30">
          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center justify-center gap-2">
            <MessageCircle className="w-6 h-6" />
            ما زلت تواجه مشكلة؟
          </h3>
          <p className="text-zinc-300 leading-relaxed text-lg mb-6">
            توجه إلى الديسكورد وافتح تذكرة دعم فني وسيقوم الفريق بتقديم المساعدة الكاملة.
          </p>
          <a 
            href={DISCORD_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors inline-flex"
          >
            الانتقال إلى سيرفر الديسكورد <ExternalLink className="w-5 h-5" />
          </a>
        </motion.div>
      </div>

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100000] bg-black/95 flex items-center justify-center p-4 md:p-10 cursor-zoom-out backdrop-blur-md"
          >
            <motion.button 
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-6 h-6" />
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              src={selectedImage}
              alt="صورة مكبرة"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(255,255,255,0.05)] border border-white/5"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>,
    document.body
  );
}

// 🔑 Key Management Panel - Only accessible by admin
function KeyManagement({ onClose }: { onClose: () => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getAllOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (orderId: string) => {
    if (!confirm(`هل أنت متأكد من حذف الطلب ${orderId}؟`)) return;
    setActionLoading(orderId);
    await deleteOrder(orderId);
    await loadOrders();
    setActionLoading(null);
  };

  const handleBan = async (orderId: string) => {
    if (!confirm(`هل تريد حظر الطلب ${orderId}؟`)) return;
    setActionLoading(orderId);
    await banOrder(orderId);
    await loadOrders();
    setActionLoading(null);
  };

  const handleUnban = async (orderId: string) => {
    if (!confirm(`هل تريد فك حظر الطلب ${orderId}؟`)) return;
    setActionLoading(orderId);
    await unbanOrder(orderId);
    await loadOrders();
    setActionLoading(null);
  };

  const handleFreeze = async (orderId: string) => {
    if (!confirm(`هل تريد تجميد الطلب ${orderId}؟`)) return;
    setActionLoading(orderId);
    await freezeOrder(orderId);
    await loadOrders();
    setActionLoading(null);
  };

  const handleUnfreeze = async (orderId: string) => {
    if (!confirm(`هل تريد إلغاء تجميد الطلب ${orderId}؟`)) return;
    setActionLoading(orderId);
    await unfreezeOrder(orderId);
    await loadOrders();
    setActionLoading(null);
  };

  const handleCopyOrder = (orderId: string) => {
    navigator.clipboard.writeText(orderId);
  };

  const getOrderStatus = (k: any) => {
    if (k.status === 'banned') return { text: 'محظور', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🚫' };
    if (k.status === 'frozen') return { text: 'مُجمّد', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '❄️' };
    if (k.status === 'active') return { text: 'نشط', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✅' };
    return { text: 'غير معروف', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: '❓' };
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99998] bg-black/90 backdrop-blur-xl overflow-y-auto"
    >
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">إدارة الطلبات</h1>
                <p className="text-zinc-400 text-sm">عرض وإدارة أرقام الطلبات المرتبطة</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadOrders} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-white">
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-zinc-400 text-xs mb-1">الكل</p>
              <p className="text-xl font-bold text-white">{orders.length}</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
              <p className="text-zinc-400 text-xs mb-1">نشط</p>
              <p className="text-xl font-bold text-emerald-400">{orders.filter(k => k.status === 'active').length}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-zinc-400 text-xs mb-1">محظور</p>
              <p className="text-xl font-bold text-red-400">{orders.filter(k => k.status === 'banned').length}</p>
            </div>
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
              <p className="text-zinc-400 text-xs mb-1">مُجمّد</p>
              <p className="text-xl font-bold text-cyan-400">{orders.filter(k => k.status === 'frozen').length}</p>
            </div>
          </div>

          {/* Orders List */}
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((k) => {
                const st = getOrderStatus(k);
                return (
                  <motion.div
                    key={k.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all"
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      {/* Order Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <button onClick={() => handleCopyOrder(k.id)} className="text-white font-mono font-bold text-lg tracking-wider hover:text-amber-400 transition-colors cursor-pointer" title="نسخ رقم الطلب">
                            {k.id}
                          </button>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`}>
                            {st.icon} {st.text}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                          {k.usedByEmail && (
                            <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {k.usedByEmail}</span>
                          )}
                          {k.activatedAt && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> فُعّل: {new Date(k.activatedAt).toLocaleString('ar-SA')}</span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {k.status !== 'banned' && k.status !== 'frozen' && (
                          <button onClick={() => handleBan(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="حظر الطلب">
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {k.status === 'banned' && (
                          <button onClick={() => handleUnban(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all" title="فك الحظر">
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {k.status !== 'frozen' && k.status !== 'banned' && (
                          <button onClick={() => handleFreeze(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all" title="تجميد مؤقت">
                            <Snowflake className="w-4 h-4" />
                          </button>
                        )}
                        {k.status === 'frozen' && (
                          <button onClick={() => handleUnfreeze(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="إلغاء التجميد">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-all" title="حذف نهائي">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {actionLoading === k.id && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {orders.length === 0 && (
                <div className="text-center py-16 text-zinc-500">
                  <Hash className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg">لا يوجد طلبات بعد</p>
                  <p className="text-sm mt-1">سيظهر هنا أي رقم طلب يتم تفعيله من الزبائن</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

// 🔒 Admin Dashboard Component - Only accessible by admin
function AdminDashboard({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'banned' | 'admins' | 'logins'>('users');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    }
    setLoading(false);
  };

  useEffect(() => { loadStats(); }, []);

  const handleBan = async (uid: string, email: string) => {
    const reason = prompt('سبب الحظر:');
    if (!reason) return;
    if (!confirm(`هل أنت متأكد من حظر ${email}؟`)) return;
    setActionLoading(uid);
    await banUser(uid, email, reason);
    await loadStats();
    setActionLoading(null);
  };

  const handleUnban = async (uid: string) => {
    if (!confirm('هل تريد فك الحظر عن هذا المستخدم؟')) return;
    setActionLoading(uid);
    await unbanUser(uid);
    await loadStats();
    setActionLoading(null);
  };

  const handleRemoveVIP = async (uid: string) => {
    if (!confirm('هل تريد إزالة VIP من هذا المستخدم؟')) return;
    setActionLoading(uid);
    await removeVIP(uid);
    await loadStats();
    setActionLoading(null);
  };

  const handleDelete = async (uid: string, orderId?: string) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا المستخدم نهائياً؟ لا يمكن التراجع!')) return;
    setActionLoading(uid);
    await deleteUserData(uid);
    await loadStats();
    setActionLoading(null);
  };

  const handleAddAdmin = async () => {
    if (!newAdminEmail.includes('@')) { alert('أدخل إيميل صحيح'); return; }
    if (!confirm(`هل تريد إضافة ${newAdminEmail} كمشرف؟`)) return;
    await addAdminUser(newAdminEmail);
    setNewAdminEmail('');
    await loadStats();
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`هل تريد إزالة ${email} من المشرفين؟`)) return;
    await removeAdminUser(email);
    await loadStats();
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl overflow-y-auto"
    >
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">لوحة التحكم</h1>
                <p className="text-zinc-400 text-sm">إدارة متجر تعن T3N</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadStats} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white">
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-white">
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-zinc-400 text-xs">المستخدمين</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-yellow-600/20 to-amber-800/10 border border-yellow-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-zinc-400 text-xs">VIP</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.vipUsers}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-emerald-600/20 to-green-800/10 border border-emerald-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Key className="w-5 h-5 text-emerald-400" />
                    <span className="text-zinc-400 text-xs">المفاتيح</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalKeys}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-gradient-to-br from-red-600/20 to-red-800/10 border border-red-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldOff className="w-5 h-5 text-red-400" />
                    <span className="text-zinc-400 text-xs">محظورين</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.bannedCount}</p>
                </motion.div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> أصحاب المفاتيح ({stats.users.filter((u:any) => u.verifiedKey).length})</span>
                </button>
                <button onClick={() => setActiveTab('logins')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'logins' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                  <span className="flex items-center gap-2"><LogIn className="w-4 h-4" /> تسجيل الدخول ({stats.users.length})</span>
                </button>
                <button onClick={() => setActiveTab('orders')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'orders' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                  <span className="flex items-center gap-2"><Hash className="w-4 h-4" /> الطلبات ({stats.totalOrders})</span>
                </button>
                <button onClick={() => setActiveTab('banned')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'banned' ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                  <span className="flex items-center gap-2"><ShieldOff className="w-4 h-4" /> المحظورين ({stats.bannedCount})</span>
                </button>
                <button onClick={() => setActiveTab('admins')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'admins' ? 'bg-purple-600 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                  <span className="flex items-center gap-2"><Crown className="w-4 h-4" /> المشرفين ({stats.admins?.length || 0})</span>
                </button>
              </div>

              {/* Users Tab (Only with keys) */}
              {activeTab === 'users' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الإيميل</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">المفتاح</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الحالة</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">التاريخ</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.users.filter((u:any) => u.verifiedKey).map((u: any, i: number) => (
                          <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="text-white text-sm truncate max-w-[200px]">{u.email || 'غير معروف'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-zinc-300 text-sm font-mono">{u.verifiedKey || '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              {u.banned ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">🚫 محظور</span>
                              ) : u.isVIP ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Star className="w-3 h-3" /> VIP</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-zinc-500/20 text-zinc-400 border border-zinc-500/30">عادي</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-zinc-400 text-xs">{u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString('ar-SA') : '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {u.isVIP && !u.banned && (
                                  <button onClick={() => handleRemoveVIP(u.id)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-all text-xs" title="إزالة VIP">
                                    <UserX className="w-4 h-4" />
                                  </button>
                                )}
                                {!u.banned ? (
                                  <button onClick={() => handleBan(u.id, u.email)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs" title="حظر">
                                    <ShieldOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleUnban(u.id)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-xs" title="فك الحظر">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(u.id, u.verifiedOrder)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-all text-xs" title="حذف نهائي">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {actionLoading === u.id && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {stats.users.filter((u:any) => u.verifiedKey).length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">لا يوجد مستخدمين بعد</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Logins Tab (All Users) */}
              {activeTab === 'logins' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الإيميل</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الحالة</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">آخر دخول</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">تاريخ التسجيل</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.users.sort((a:any,b:any)=>(b.lastLoginAt||'').localeCompare(a.lastLoginAt||'')).map((u: any, i: number) => (
                          <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                                <span className="text-white text-sm truncate max-w-[200px]">{u.email || 'غير معروف'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {u.verifiedOrder ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"><Check className="w-3 h-3"/> أضاف رقم طلب</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"><Clock className="w-3 h-3"/> مسجل فقط</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-zinc-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('ar-SA') : '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-zinc-400 text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-SA') : '-'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {!u.banned ? (
                                  <button onClick={() => handleBan(u.id, u.email)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs" title="حظر">
                                    <ShieldOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button onClick={() => handleUnban(u.id)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-xs" title="فك الحظر">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>
                                )}
                                <button onClick={() => handleDelete(u.id, u.verifiedOrder)} disabled={actionLoading === u.id} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-all text-xs" title="حذف نهائي">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                {actionLoading === u.id && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {stats.users.length === 0 && (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-zinc-500">لا يوجد تسجيلات بعد</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}


              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">رقم الطلب</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الحالة</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الإيميل</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">تاريخ التفعيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.orders.map((k: any, i: number) => {
                          let statusText = 'نشط';
                          let statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                          if (k.status === 'banned') {
                            statusText = 'محظور';
                            statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                          } else if (k.status === 'frozen') {
                            statusText = 'مجمّد';
                            statusColor = 'bg-blue-500/20 text-blue-400 border-blue-500/30';
                          }
                          return (
                            <tr key={k.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                              <td className="px-4 py-3"><span className="text-white text-sm font-mono font-bold">{k.id}</span></td>
                              <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${statusColor}`}>{statusText}</span></td>
                              <td className="px-4 py-3"><span className="text-zinc-300 text-sm">{k.usedByEmail || '—'}</span></td>
                              <td className="px-4 py-3"><span className="text-zinc-400 text-xs">{k.activatedAt ? new Date(k.activatedAt).toLocaleString('ar-SA') : '-'}</span></td>
                            </tr>
                          );
                        })}
                        {stats.orders.length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">لا يوجد طلبات</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Banned Tab */}
              {activeTab === 'banned' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الإيميل</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">سبب الحظر</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">تاريخ الحظر</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.banned.map((b: any, i: number) => (
                          <tr key={b.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="px-4 py-3"><span className="text-white text-sm">{b.email}</span></td>
                            <td className="px-4 py-3"><span className="text-red-400 text-sm">{b.reason}</span></td>
                            <td className="px-4 py-3"><span className="text-zinc-400 text-xs">{b.bannedAt ? new Date(b.bannedAt).toLocaleString('ar-SA') : '-'}</span></td>
                            <td className="px-4 py-3">
                              <button onClick={() => handleUnban(b.id)} className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all text-xs font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> فك الحظر
                              </button>
                            </td>
                          </tr>
                        ))}
                        {stats.banned.length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-8 text-center text-zinc-500">لا يوجد محظورين 🎉</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {/* Admins Tab */}
              {activeTab === 'admins' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Add Admin */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-4">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><UserPlus className="w-5 h-5 text-purple-400" /> إضافة مشرف جديد</h3>
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="أدخل إيميل المشرف الجديد..."
                        className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/50 text-sm"
                      />
                      <button onClick={handleAddAdmin} className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-500 transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                        إضافة
                      </button>
                    </div>
                  </div>

                  {/* Admins List */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-right">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الإيميل</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الدور</th>
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.admins?.map((a: any, i: number) => (
                          <tr key={a.email} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-white/[0.02]' : ''}`}>
                            <td className="px-4 py-3"><span className="text-white text-sm">{a.email}</span></td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${a.role === 'مالك' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'}`}>
                                <Crown className="w-3 h-3" /> {a.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {a.role !== 'مالك' && (
                                <button onClick={() => handleRemoveAdmin(a.email)} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-bold flex items-center gap-1">
                                  <Trash2 className="w-3 h-3" /> إزالة
                                </button>
                              )}
                              {a.role === 'مالك' && <span className="text-zinc-600 text-xs">لا يمكن إزالته</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          ) : (
            <div className="text-center text-red-400 py-12">فشل تحميل البيانات</div>
          )}
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

export default function App() {
  const [isVerifiedCustomer, setIsVerifiedCustomer] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSpooferGuide, setShowSpooferGuide] = useState(false);
  const [showSiteGuide, setShowSiteGuide] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('t3n-theme');
    return saved ? saved === 'dark' : true;
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', !darkMode);
    localStorage.setItem('t3n-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Parse Discord OAuth hash manually so it doesn't get lost
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const tokenSrc = params.get('access_token');
      if (tokenSrc) {
        localStorage.setItem('discord_token_pending', tokenSrc);
        // Clean the URL hash immediately
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Sync auth and handle Discord role assignment once verified
  useEffect(() => {
    // Check local device ban first
    const localBan = localStorage.getItem('t3n_device_banned');
    if (localBan) {
      setIsBanned(true);
      setBanReason(localStorage.getItem('t3n_ban_reason') || 'تم حظر جهازك لانتهاك شروط الاستخدام.');
      setAuthLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      // If locally banned, prevent any auth actions
      if (localStorage.getItem('t3n_device_banned')) {
        setAuthLoading(false);
        return;
      }

      if (currentUser) {
        const banCheck = await checkBanned(currentUser.uid);
        if (banCheck.banned) {
          setIsBanned(true);
          setBanReason(banCheck.reason || null);
          localStorage.setItem('t3n_device_banned', 'true');
          if (banCheck.reason) localStorage.setItem('t3n_ban_reason', banCheck.reason);
          setAuthLoading(false);
          return;
        } else {
          setIsBanned(false);
          setBanReason(null);
        }

        const isVIP = await checkUserVIP(currentUser.uid);
        setIsVerifiedCustomer(isVIP);

        const isAdm = await checkIsAdmin(currentUser.email);
        setIsAdminUser(isAdm);

        // Process pending Discord OAuth token
        const pendingToken = localStorage.getItem('discord_token_pending');
        if (pendingToken) {
          if (!isVIP) {
            // User has a token but is not VIP yet - keep the token for later
            // Don't remove it - they might activate a key soon
            console.log('Discord token pending but user is not VIP yet. Token will be processed after key activation.');
          } else {
            // User is VIP, process the Discord token
            try {
              console.log('Processing Discord token...');
              const discordRes = await fetch('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${pendingToken}` }
              });
              
              if (!discordRes.ok) {
                console.error('Discord API error:', discordRes.status);
                setToast({ type: 'error', message: 'توكن الديسكورد منتهي، يرجى إعادة ربط الحساب' });
                localStorage.removeItem('discord_token_pending');
              } else {
                const discordUser = await discordRes.json();
                
                if (discordUser && discordUser.id) {
                  console.log('Got Discord user:', discordUser.id);
                  const idToken = await currentUser.getIdToken(true);
                  const backendRes = await fetch('/api/assign-role', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ discordId: discordUser.id, accessToken: pendingToken, idToken: idToken })
                  });
                  
                  if (backendRes.ok) {
                    const result = await backendRes.json();
                    if (result.success) {
                      setToast({ type: 'success', message: 'تم ربط حسابك بالديسكورد وإعطائك رتبة Customer بنجاح! 🎉' });
                    } else {
                      setToast({ type: 'error', message: 'حدث خطأ أثناء إعطائك الرتبة، قد تكون موجودة مسبقاً' });
                    }
                  } else {
                    const errData = await backendRes.json().catch(() => ({}));
                    console.error('Backend error:', backendRes.status, errData);
                    if (backendRes.status === 429) {
                      setToast({ type: 'error', message: 'طلبات كثيرة، يرجى المحاولة بعد 30 ثانية' });
                    } else {
                      setToast({ type: 'error', message: 'فشل في الاتصال بسيرفر الرتب. يرجى المحاولة لاحقاً' });
                    }
                  }
                } else {
                  console.error('Invalid Discord user data');
                  setToast({ type: 'error', message: 'فشل في جلب بيانات حساب الديسكورد' });
                }
                localStorage.removeItem('discord_token_pending');
              }
            } catch (e) {
              console.error('Error assigning rank:', e);
              setToast({ type: 'error', message: 'فشل ربط الديسكورد، يرجى المحاولة لاحقاً' });
              localStorage.removeItem('discord_token_pending');
            }
          }
        }
      } else {
        setIsVerifiedCustomer(false);
        setIsAdminUser(false);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [isVerifiedCustomer]);

  if (isBanned) {
    return (
      <div className="min-h-screen bg-[#06060c] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl backdrop-blur-md">
          <ShieldOff className="w-20 h-20 text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          <h1 className="text-3xl font-extrabold text-white mb-3">تم حظر حسابك</h1>
          <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
            {banReason || 'لقد تم حظرك من استخدام خدمات الموقع لمخالفتك الشروط والقوانين.'}
          </p>
          <div className="w-full py-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-bold shadow-lg flex items-center justify-center gap-2">
            تم تقييد الوصول نهائياً
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#06060c] text-zinc-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Professional Toast Notification */}
      {toast && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] w-[90%] max-w-md"
          >
            <div className={`rounded-2xl p-5 shadow-2xl border backdrop-blur-xl flex items-center gap-4 ${
              toast.type === 'success' 
                ? 'bg-emerald-950/80 border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)]' 
                : 'bg-red-950/80 border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)]'
            }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'
              }`}>
                {toast.type === 'success' 
                  ? <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  : <AlertCircle className="w-6 h-6 text-red-400" />
                }
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm mb-0.5 ${toast.type === 'success' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {toast.type === 'success' ? 'تمت العملية بنجاح' : 'حدث خطأ'}
                </p>
                <p className="text-zinc-300 text-sm">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-white transition-colors shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Theme Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all shadow-[0_8px_25px_rgba(0,0,0,0.3)]"
      >
        {darkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
      </motion.button>

      <Navbar 
        isVerified={isVerifiedCustomer} 
        user={user} 
        onLogin={loginWithGoogle} 
        onLogout={logout} 
        authLoading={authLoading}
        onSpooferClick={() => setShowSpooferGuide(true)} 
        onTroubleshootClick={() => setShowTroubleshoot(true)}
      />

      {/* Admin Button - Only visible to admin */}
      {user && isAdminUser && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(239,68,68,0.4)] border border-red-400/30 hover:shadow-[0_8px_35px_rgba(239,68,68,0.6)] transition-shadow"
        >
          <LayoutDashboard className="w-5 h-5" />
        </motion.button>
      )}

      {/* 📦 Order Management Button - Only visible to admin, right side */}
      {user && isAdminUser && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowKeyManager(true)}
          className="fixed bottom-20 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(245,158,11,0.4)] border border-amber-400/30 hover:shadow-[0_8px_35px_rgba(245,158,11,0.6)] transition-shadow"
        >
          <Hash className="w-5 h-5" />
        </motion.button>
      )}
      <main>
        <Hero onSiteGuideClick={() => setShowSiteGuide(true)} />
        <OrderDelivery 
          user={user}
          onVerify={async (orderId) => {
            setIsVerifiedCustomer(true);
          }} 
        />
        <Products />
        <Reviews />
        <FAQ />
        <Policies />
      </main>
      <Footer />

      {/* Spoofer Guide Page - VIP Only */}
      <AnimatePresence>
        {showSpooferGuide && <SpooferGuide onClose={() => setShowSpooferGuide(false)} />}
      </AnimatePresence>

      {/* Site Guide Page */}
      <AnimatePresence>
        {showSiteGuide && <SiteGuide onClose={() => setShowSiteGuide(false)} />}
      </AnimatePresence>

      {/* VIP Floating Sidebar - Only for verified customers */}
      <AnimatePresence>
        {isVerifiedCustomer && (
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3"
          >
            <motion.button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/discord.gg.t3n.rar';
                link.download = 'discord.gg.t3n.rar';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              onContextMenu={(e) => e.preventDefault()}
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(37,99,235,0.4)] border border-blue-400/30 hover:shadow-[0_8px_35px_rgba(37,99,235,0.6)] transition-shadow"
            >
              <Download className="w-6 h-6" />
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-lg text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-xl">
                تحميل ملف الطلب
              </div>
            </motion.button>

            <motion.a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.95 }}
              className="group relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(88,101,242,0.4)] border border-[#7289da]/30 hover:shadow-[0_8px_35px_rgba(88,101,242,0.6)] transition-shadow"
            >
              <MessageCircle className="w-6 h-6" />
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-lg text-white text-sm font-bold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-xl">
                سيرفر الدعم
              </div>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTroubleshoot && <TroubleshootGuide onClose={() => setShowTroubleshoot(false)} />}
      </AnimatePresence>

      {/* 🔒 Admin Dashboard - Only for admin */}
      <AnimatePresence>
        {showAdmin && user && isAdminUser && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      </AnimatePresence>

      {/* 🔑 Key Manager - Only for admin */}
      <AnimatePresence>
        {showKeyManager && user && isAdminUser && <KeyManagement onClose={() => setShowKeyManager(false)} />}
      </AnimatePresence>
    </div>
  );
}
