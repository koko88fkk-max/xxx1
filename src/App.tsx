import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'motion/react';
import { ShoppingBag, MessageCircle, ShieldAlert, Download, CheckCircle2, Star, ExternalLink, Server, FileArchive, AlertCircle, AlertTriangle, ChevronDown, HelpCircle, ChevronUp, Gamepad2, Shield, Cpu, Wrench, X, LogIn, LogOut, MonitorPlay, Maximize2, Youtube, Copy, Check, Sun, Moon, LayoutDashboard, Users, Package, Clock, RefreshCw, Mail, Hash, Trash2, UserX, ShieldOff, Crown, UserPlus, Key, Plus, Ban, Snowflake, Play, Search, Bell, List, Crosshair } from 'lucide-react';
import { auth, loginWithDiscord, logout, checkUserVIP, activateKey, isAdmin, getAdminStats, banUser, unbanUser, removeVIP, deleteUserData, addAdminUser, removeAdminUser, checkIsAdmin, checkBanned, getAllKeys, deleteKey, deleteAllKeys, banKey, unbanKey, freezeKey, unfreezeKey, isValidKeyFormat, trackSiteVisit, checkKeyStatus, createKeys, listenToNotifications, deleteNotification, listenToMaintenanceMode, toggleMaintenanceMode } from './lib/firebase';
import { onAuthStateChanged, User, signInWithCustomToken } from 'firebase/auth';
import LoginModal from './LoginModal';

const LOGO_URL = "/logo.png";
const STORE_URL = "https://salla.sa/t3nn";
const DISCORD_URL = "https://discord.gg/tjMWEccj3J";
const DISCORD_OAUTH_URL = "https://discord.com/api/oauth2/authorize?client_id=1462977086653464729&redirect_uri=https%3A%2F%2Ft3n-2a2i.vercel.app%2F&response_type=token&scope=identify%20guilds.join";

// Capture Discord OAuth access_token from URL hash IMMEDIATELY on page load
// Discord implicit grant returns: /#access_token=xxx&token_type=Bearer&...
if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
  const fragment = new URLSearchParams(window.location.hash.substring(1));
  const accessToken = fragment.get('access_token');
  if (accessToken) {
    console.log('[T3N] Discord OAuth token captured from URL hash');
    localStorage.setItem('discord_token_pending', accessToken);
    // Clean the URL to remove the token
    window.history.replaceState(null, '', window.location.pathname);
  }
}

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

function Navbar({ isVerified, user, onLogin, onLogout, authLoading, onSuperstarClick, onFortniteClick, onFortniteHackClick, onTroubleshootClick, notifications = [], unreadCount = 0, onReadNotifications, isAdminUser = false, activatedProducts = [] }: { isVerified?: boolean, user?: User | null, onLogin?: () => void, onLogout?: () => void, authLoading?: boolean, onSuperstarClick?: () => void, onFortniteClick?: () => void, onFortniteHackClick?: () => void, onTroubleshootClick?: () => void, notifications?: any[], unreadCount?: number, onReadNotifications?: () => void, isAdminUser?: boolean, activatedProducts?: string[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifPopup, setShowNotifPopup] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState<any>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifPopup(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotifClick = () => {
    setShowNotifPopup(!showNotifPopup);
    if (!showNotifPopup && unreadCount > 0 && onReadNotifications) {
      onReadNotifications();
    }
  };

  const handleDeleteNotif = async (notifId: string) => {
    try { await deleteNotification(notifId); } catch (e) { console.error(e); }
  };


  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setMobileMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  const mobileNavLinks = [
    { href: '#delivery', label: 'استلام الطلبات' },
    { href: '#products', label: 'المنتجات' },
    { href: '#reviews', label: 'التقييمات' },
    { href: '#faq', label: 'الأسئلة الشائعة' },
    { href: '#policies', label: 'القوانين' },
  ];

  return (
    <>
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
              alt="T3N Logo" 
              className="w-12 h-12 object-contain rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
            />
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
                  حل مشاكل عامة
                </button>
                <div className="relative group">
                  <button 
                    className="text-emerald-400 hover:text-emerald-300 transition-colors drop-shadow-sm flex items-center gap-1.5 bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                  >
                    <List className="w-4 h-4" />
                    اختيار المنتج
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute top-full left-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left z-50">
                    <div className="bg-[#0a0a0f] border border-emerald-500/20 rounded-xl shadow-xl overflow-hidden flex flex-col p-1 gap-1">
                      {activatedProducts.includes('superstar') && (
                        <button 
                          onClick={onSuperstarClick}
                          className="w-full text-right px-4 py-3 text-sm text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors flex items-center gap-2 font-bold"
                        >
                          <Cpu className="w-4 h-4" />
                          شرح السبوفر
                        </button>
                      )}
                      {activatedProducts.includes('fortnite-hack') && (
                        <button 
                          onClick={onFortniteHackClick}
                          className="w-full text-right px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2 font-bold"
                        >
                          <Crosshair className="w-4 h-4" />
                          شرح هاك فورت
                        </button>
                      )}
                      {activatedProducts.length === 0 && (
                        <div className="px-4 py-3 text-sm text-zinc-500 text-center font-bold">
                          لا توجد منتجات مفعلة
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
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

            {/* Bell Notifications */}
            <div className="relative" ref={notifRef}>
              <motion.button 
                onClick={handleNotifClick}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-10 h-10 rounded-full bg-white/10 text-white border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#06060c] animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </motion.button>
              
              <AnimatePresence>
                {showNotifPopup && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-14 w-[340px] bg-[#0a0a14]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 text-right flex flex-col"
                  >
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                      <span className="text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded-full">تنبيهات تلقائية من الديسكورد 🔔</span>
                      <h3 className="font-bold text-white flex gap-2 items-center">الإشعارات <Bell className="w-4 h-4 text-zinc-400" /></h3>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2 flex flex-col gap-2">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-zinc-500 text-sm">لا توجد إشعارات حالياً</div>
                      ) : (
                        notifications.map((n, i) => (
                          <div key={n.id || i} className="p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors relative group">
                            <div className="flex items-center gap-3 mb-2">
                              {n.avatar ? <img src={n.avatar} className="w-8 h-8 rounded-full border border-blue-500/30" /> : <div className="w-8 h-8 rounded-full bg-blue-500/20" />}
                              <div className="flex-1 min-w-0 flex justify-between items-center">
                                <span className="font-bold text-sm text-blue-200 truncate">{n.author || 'إدارة T3N'}</span>
                                {n.createdAt && <span className="text-[10px] text-zinc-500">{new Date(n.createdAt).toLocaleDateString('ar-SA')}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words" dangerouslySetInnerHTML={{ __html: n.content ? n.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>') : '' }} />
                            {n.attachments && n.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {n.attachments.map((att: string, idx: number) => (
                                  att.split('?')[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 
                                    <img key={idx} src={att} className="rounded-lg max-h-24 object-cover border border-white/10 w-full cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setExpandedNotif(n)} /> : 
                                    <a key={idx} href={att} target="_blank" className="flex items-center gap-1 text-[11px] bg-blue-500/20 text-blue-300 px-2 py-1 rounded truncate w-full"><ExternalLink className="w-3 h-3 shrink-0" /> {att.split('/').pop()}</a>
                                ))}
                              </div>
                            )}
                            {/* Action buttons */}
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
                              <button onClick={() => setExpandedNotif(n)} className="text-[10px] flex items-center gap-1 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-1 rounded-md transition-all"><Maximize2 className="w-3 h-3" /> تكبير</button>
                              {isAdminUser && (
                                <button onClick={() => handleDeleteNotif(n.id)} className="text-[10px] flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1 rounded-md transition-all mr-auto"><Trash2 className="w-3 h-3" /> حذف</button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Expanded Notification Modal */}
            {expandedNotif && createPortal(
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                  onClick={() => setExpandedNotif(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 30 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[#0c0c18] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto text-right"
                  >
                    <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                      <button onClick={() => setExpandedNotif(null)} className="text-zinc-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-bold text-white text-sm">{expandedNotif.author || 'إدارة T3N'}</h3>
                          {expandedNotif.createdAt && <p className="text-[11px] text-zinc-500">{new Date(expandedNotif.createdAt).toLocaleString('ar-SA')}</p>}
                        </div>
                        {expandedNotif.avatar ? <img src={expandedNotif.avatar} className="w-10 h-10 rounded-full border border-blue-500/30" /> : <div className="w-10 h-10 rounded-full bg-blue-500/20" />}
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words mb-4" dangerouslySetInnerHTML={{ __html: expandedNotif.content ? expandedNotif.content.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>') : '' }} />
                      {expandedNotif.attachments && expandedNotif.attachments.length > 0 && (
                        <div className="flex flex-col gap-3">
                          {expandedNotif.attachments.map((att: string, idx: number) => (
                            att.split('?')[0].match(/\.(jpeg|jpg|gif|png|webp)$/i) ? 
                              <img key={idx} src={att} className="rounded-xl w-full object-contain border border-white/10 max-h-[60vh]" /> : 
                              <a key={idx} href={att} target="_blank" className="flex items-center gap-2 text-sm bg-blue-500/20 text-blue-300 px-4 py-3 rounded-xl hover:bg-blue-500/30 transition-colors"><ExternalLink className="w-4 h-4 shrink-0" /> {att.split('/').pop()}</a>
                          ))}
                        </div>
                      )}
                      {isAdminUser && (
                        <button onClick={() => { handleDeleteNotif(expandedNotif.id); setExpandedNotif(null); }} className="mt-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-xl transition-all border border-red-500/20"><Trash2 className="w-4 h-4" /> حذف هذا الإشعار</button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>,
              document.body
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
                  <span className="text-sm font-bold hidden sm:block">تسجيل الدخول</span>
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

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all ml-1"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[49] bg-[#06060c]/95 backdrop-blur-xl md:hidden"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center justify-center h-full gap-6 px-8"
            >
              {mobileNavLinks.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06 }}
                  className="text-2xl font-bold text-white hover:text-blue-400 transition-colors w-full text-center py-3 border-b border-white/5"
                >
                  {link.label}
                </motion.a>
              ))}

              {isVerified && (
                <div className="flex flex-col gap-3 w-full mt-4">
                  <button 
                    onClick={() => { setMobileMenuOpen(false); onTroubleshootClick?.(); }}
                    className="text-red-400 font-bold flex items-center justify-center gap-2 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20 w-full"
                  >
                    <Wrench className="w-5 h-5" />
                    حل مشاكل عامة
                  </button>
                  {activatedProducts.includes('superstar') && (
                    <button 
                      onClick={() => { setMobileMenuOpen(false); onSuperstarClick?.(); }}
                      className="text-yellow-400 font-bold flex items-center justify-center gap-2 bg-yellow-500/10 px-6 py-3 rounded-2xl border border-yellow-500/20 w-full hover:bg-yellow-500/20 transition-colors"
                    >
                      <Cpu className="w-5 h-5" />
                      شرح السبوفر (سوبر ستار)
                    </button>
                  )}
                  {activatedProducts.includes('fortnite-hack') && (
                    <button 
                      onClick={() => { setMobileMenuOpen(false); onFortniteHackClick?.(); }}
                      className="text-red-400 font-bold flex items-center justify-center gap-2 bg-red-500/10 px-6 py-3 rounded-2xl border border-red-500/20 w-full hover:bg-red-500/20 transition-colors"
                    >
                      <Crosshair className="w-5 h-5" />
                      شرح هاك فورت
                    </button>
                  )}
                  {activatedProducts.length === 0 && (
                    <div className="w-full text-center py-3 text-zinc-500 font-bold bg-zinc-900/50 rounded-2xl border border-zinc-800">
                      لا توجد منتجات مفعلة
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero({ onSiteGuideClick, onFortniteClick }: { onSiteGuideClick: () => void, onFortniteClick: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.08, 0.15, 0.08]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-amber-500/30 blur-[120px] rounded-full mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.05, 0.12, 0.05]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" 
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
            className="relative mb-8"
          >
            <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] rounded-full" />
            <div className="relative z-10 p-2 rounded-3xl bg-white/5 border border-yellow-500/20 shadow-[0_20px_50px_rgba(212,175,55,0.15)] backdrop-blur-md">
              <img src={LOGO_URL} alt="تعن T3N" className="w-40 h-40 md:w-48 md:h-48 object-contain rounded-2xl" />
            </div>
          </motion.div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-400 text-sm font-bold tracking-wider">الإصدار المتميز</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-transparent bg-clip-text text-gradient-gold drop-shadow-2xl">
            تعن T3N
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md font-medium px-4">
            وجهتك الأولى للمنتجات الرقمية الفاخرة. استمتع بتجربة استثنائية، جودة عالية، وموثوقية لا تضاهى.
          </p>
          
          <div className="flex flex-col gap-4 justify-center items-center mt-4 w-full max-w-md mx-auto">
            {/* Site Guide Button */}
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('delivery')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 glass-panel text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all w-full relative overflow-hidden group border-white/20"
            >
              <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Hash className="w-5 h-5 text-yellow-400 relative z-10" />
              <span className="relative z-10 tracking-wide">بوابة الاستلام</span>
            </motion.button>
            
            {/* Store and Discord Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <motion.a 
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(212,175,55,0.4)" }}
                whileTap={{ scale: 0.95 }}
                href={STORE_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-8 py-4 bg-gradient-gold text-black font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(212,175,55,0.2)] transition-all w-full sm:flex-1 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-2xl" />
                <ShoppingBag className="w-5 h-5 relative z-10" />
                <span className="relative z-10">تصفح المتجر</span>
              </motion.a>
              <motion.a 
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(88,101,242,0.3)" }}
                whileTap={{ scale: 0.95 }}
                href={DISCORD_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-8 py-4 glass-panel text-[#5865F2] font-bold rounded-2xl hover:bg-[#5865F2]/10 flex items-center justify-center gap-2 transition-colors w-full sm:flex-1"
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
          className="mt-20 flex justify-center w-full text-zinc-500 animate-bounce"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </div>
    </section>
  );
}

function CustomVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [durationText, setDurationText] = useState('0:00');
  const [isMuted, setIsMuted] = useState(false);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const dur = videoRef.current.duration;
      setProgress((current / dur) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedData = () => {
    if (videoRef.current) {
      setDurationText(formatTime(videoRef.current.duration));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const toggleFullScreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = pos * videoRef.current.duration;
    }
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(37,99,235,0.2)] bg-black/80 relative group">
      <video
        ref={videoRef}
        src="/site-guide-vid.mp4"
        poster="/site-guide-poster.jpg"
        className="w-full aspect-video object-contain outline-none bg-black cursor-pointer"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onContextMenu={(e) => e.preventDefault()}
        controlsList="nodownload"
        playsInline
        preload="metadata"
      />
      
      {/* Custom Control Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col gap-2">
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer relative"
          onClick={handleSeek}
        >
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" 
            style={{ width: `${progress}%` }} 
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border border-black/20 transition-transform scale-0 group-hover:scale-100"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between text-white mt-1">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
              {isPlaying ? <div className="w-4 h-4 bg-white hover:bg-blue-400" style={{ clipPath: 'polygon(10% 0, 40% 0, 40% 100%, 10% 100%, 60% 0, 90% 0, 90% 100%, 60% 100%)' }} /> : <Play className="w-5 h-5 fill-current" />}
            </button>
            <span className="text-xs font-mono opacity-80" dir="ltr">{currentTime} / {durationText}</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
              {isMuted ? <span className="text-lg">🔇</span> : <span className="text-lg">🔊</span>}
            </button>
            <button onClick={toggleFullScreen} className="hover:text-blue-400 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Big Play Button Overlay */}
      {!isPlaying && (
        <button 
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-blue-600/80 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition-all border border-white/20 shadow-xl"
        >
          <Play className="w-6 h-6 ml-1 fill-current" />
        </button>
      )}
    </div>
  );
}

function OrderDelivery({ onVerify, user, onLogin, onSuperstarClick, onFortniteClick, onFortniteHackClick, activatedProducts }: { onVerify?: (keyId: string, products: string[]) => void, user?: User | null, onLogin?: () => void, onSuperstarClick?: () => void, onFortniteClick?: () => void, onFortniteHackClick?: () => void, activatedProducts?: string[] }) {
  const [orderInput, setOrderInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [lastActivatedType, setLastActivatedType] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) return;
    if (!user) { setStatus('error'); setErrorMsg('يجب تسجيل الدخول بحساب ديسكورد أو جوجل أولاً'); return; }
    if (!isValidKeyFormat(orderInput)) { setStatus('error'); setErrorMsg('صيغة المفتاح غير صحيحة. الصيغة: T3N-XXXXXX-XXXXXX'); return; }
    setStatus('loading');
    try {
      const result = await activateKey(orderInput.trim(), user.uid, user.email || '', { displayName: user.displayName || undefined, photoURL: user.photoURL || undefined, provider: 'google' });
      if (result.success) {
        setLastActivatedType(result.productType || '');
        setTimeout(() => { setStatus('success'); if (onVerify) onVerify(orderInput.trim(), result.activatedProducts || []); }, 1500);
      } else { setStatus('error'); setErrorMsg(result.error || 'حدث خطأ'); }
    } catch (e: any) { setStatus('error'); setErrorMsg(e?.message || 'حدث خطأ غير متوقع'); }
  };

  return (
    <section id="delivery" className="py-20 md:py-28 relative z-10">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">بوابة التفعيل</h2>
          <p className="text-zinc-400 text-lg">من هنا يمكنك تفعيل مفتاحك للارتباط بحسابك واستلام منتجك</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-[85rem] mx-auto w-full">
          {/* Right Side: Form (Order 2 on mobile, 1 on Desktop RTL) */}
          <TiltCard className="glass-panel-hover glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden h-full order-2 lg:order-1 min-h-[500px]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="flex flex-col items-center justify-start h-full min-h-[300px] pt-4">

              <AnimatePresence mode="wait">
              {status === 'idle' || status === 'error' ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={handleVerify}
                  className="flex flex-col items-center w-full mx-auto relative z-10 p-4"
                >
                  <div className="w-16 h-16 bg-gradient-gold rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.4)]">
                    <Key className="w-8 h-8 text-black" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-md text-center">تفعيل المفتاح</h3>
                  <p className="text-zinc-400 mb-8 text-center text-lg leading-relaxed max-w-sm">
                    أدخل مفتاح المنتج الخاص بك لاستلام مشترياتك فوراً. يرجى تسجيل الدخول باستخدام جوجل أو ديسكورد.
                  </p>

                  {/* Google Login Button - Show when NOT logged in */}
                  {!user && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(212,175,55,0.2)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onLogin}
                      className="w-full mb-5 bg-white/5 border border-yellow-500/30 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
                    >
                      <svg className="w-6 h-6 bg-white rounded-full p-[2px] shrink-0" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span className="text-white font-bold text-base">يجب تسجيل الدخول أولاً</span>
                    </motion.button>
                  )}

                  {/* Show logged-in status */}
                  {user && (
                    <div className="w-full mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 flex items-center justify-center gap-2">
                      <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" />
                      <p className="text-green-400 text-sm font-medium">مسجّل دخول: {user.displayName || user.email}</p>
                    </div>
                  )}

                  <div className="w-full mb-4 relative">
                    <input
                      type="text"
                      value={orderInput}
                      onChange={(e) => {
                        setOrderInput(e.target.value);
                        if (status === 'error') setStatus('idle');
                      }}
                      placeholder="T3N-XXXXXX-XXXXXX"
                      className="w-full bg-black/60 border border-yellow-500/30 rounded-2xl px-6 py-5 text-center text-xl focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/30 transition-all text-white placeholder:text-zinc-600 shadow-inner font-mono tracking-wider"
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
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(212,175,55,0.4)" }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!orderInput.trim() || !user}
                    className="w-full bg-gradient-gold text-black font-bold py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(212,175,55,0.2)] border-t border-yellow-200/30 mt-2"
                  >
                    <Key className="w-6 h-6" />
                    تفعيل المفتاح
                  </motion.button>
                </motion.form>
              ) : status === 'loading' ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12 relative z-10 w-full h-full"
                >
                  <div className="w-20 h-20 relative mb-8">
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                  </div>
                  <p className="text-zinc-300 font-medium animate-pulse text-lg">جاري التفعيل وبناء الصلاحيات...</p>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center text-center relative z-10 w-full h-full justify-center mt-8"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-2xl font-bold mb-2 text-white">تم التفعيل بنجاح!</h3>
                  <p className="text-zinc-400 mb-2 text-md">المفتاح <span className="text-white font-mono bg-white/10 px-2 py-1 rounded-md text-sm">{orderInput}</span> مُفعّل ومرتبط بحسابك.</p>
                  <p className="text-emerald-400 text-sm mb-8 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> مرتبط بحسابك للأبد</p>

                  <div className="flex flex-col gap-4 w-full">

                    {/* === SUPERSTAR SECTION === */}
                    {(activatedProducts?.includes('superstar') || lastActivatedType === 'superstar' || activatedProducts?.includes('spoofer') || lastActivatedType === 'spoofer') && (
                      <motion.div 
                        whileHover={{ y: -2 }}
                        className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-lg hover:border-yellow-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-4 mb-4 w-full">
                          <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center border border-yellow-500/20 shrink-0">
                            <Cpu className="w-6 h-6 text-yellow-400" />
                          </div>
                          <div className="text-right flex-1">
                            <h4 className="font-bold text-lg text-white">السبوفر (سوبر ستار)</h4>
                            <p className="text-xs text-zinc-400 mt-1">منتج السبوفر والشروحات الخاصة به.</p>
                          </div>
                        </div>
                        <motion.button
                          onClick={onSuperstarClick}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border border-yellow-500/20"
                        >
                          <MonitorPlay className="w-5 h-5" />
                          الانتقال إلى الشرح والملفات
                        </motion.button>
                      </motion.div>
                    )}

                    {/* === FORTNITE HACK SECTION === */}
                    {(activatedProducts?.includes('fortnite-hack') || lastActivatedType === 'fortnite-hack') && (
                      <div className="bg-black/40 border border-red-500/30 rounded-2xl p-5 flex flex-col items-center shadow-lg transition-colors hover:border-red-500/50">
                        <div className="flex items-center gap-4 mb-4 w-full">
                          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20 shrink-0">
                            <Crosshair className="w-6 h-6 text-red-400" />
                          </div>
                          <div className="text-right flex-1">
                            <h4 className="font-bold text-lg text-white">هاك فورت نايت</h4>
                            <p className="text-xs text-zinc-400 mt-1">شرح وتحميل ملفات الهاك.</p>
                          </div>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={onFortniteHackClick}
                          className="w-full bg-red-500 text-white hover:bg-red-600 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                        >
                          <MonitorPlay className="w-5 h-5" />
                          الانتقال لشرح هاك فورت نايت
                        </motion.button>
                      </div>
                    )}

                    {/* === DISCORD ROLE - shown for ALL products === */}
                    <motion.div 
                      whileHover={{ y: -2 }}
                      className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-lg hover:border-[#5865F2]/30 transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#5865F2]/10 rounded-xl flex items-center justify-center border border-[#5865F2]/20 shrink-0">
                          <Server className="w-6 h-6 text-[#5865F2]" />
                        </div>
                        <div className="text-right flex-1">
                          <h4 className="font-bold text-lg text-white">رتبة ديسكورد</h4>
                          <p className="text-xs text-zinc-400 mt-1">اربط حسابك بالسيرفر للوصول للدعم.</p>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = DISCORD_OAUTH_URL}
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4] font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <MessageCircle className="w-5 h-5" />
                        ربط الحساب وإستلام الرتبة
                      </motion.button>
                    </motion.div>

                  </div>
                  
                  <button 
                    onClick={() => { setStatus('idle'); setOrderInput(''); }}
                    className="mt-6 text-sm text-zinc-500 hover:text-white transition-colors underline underline-offset-4"
                  >
                    تفعيل مفتاح آخر
                  </button>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </TiltCard>

          {/* Left Side: Video (Order 1 on mobile, 2 on Desktop RTL) */}
          <TiltCard className="glass-panel rounded-[2rem] p-8 md:p-12 relative overflow-hidden h-full flex flex-col items-center justify-center order-1 lg:order-2">
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-2xl border border-blue-500/30 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                <MonitorPlay className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold mb-4 text-white drop-shadow-md text-center">فيديو الشرح</h3>
              <p className="text-zinc-400 mb-8 text-center text-lg leading-relaxed max-w-md">
                شاهد هذا المقطع القصير لمعرفة كيفية تفعيل رقم طلبك واستلام الملفات بطريقة صحيحة وبكل سهولة.
              </p>
              
              <CustomVideoPlayer />

            </div>
          </TiltCard>
        </div>
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
      title: "السبوفر المتميز (سوبر ستار)",
      desc: "أقوى أداة سبوفر تدعم جميع المذربوردات وحمايات الألعاب. استعمال مرة واحدة لفك الحظر نهائياً للأبد بضمان كامل.",
      url: "https://salla.sa/t3nn",
      image: "/product-spoofer-perm.jpg",
      icon: <Cpu className="w-5 h-5" />,
      tag: "الإصدار الذهبي",
      details: "المميزات\n\n[+] يدعم جميع مذربوردات:\nMSI · ASUS · GIGABYTE · ASROCK · HP · EVGA · MICROSTAR · AORUS · COLORFUL · LENOVO · ACER · DELL\n[+] يدعم جميع حمايات الألعاب\n[+] الألعاب المدعومة:\nCall of Duty · Rust · VALORANT · FiveM · فورت نايت\n[+] استعمال مرة واحدة فقط وقت الفك، ولا تحتاج استعماله مرة أخرى للأبد\n[+] يتم تسليم المنتج فورياً\n[+] 100% مضمون وموثوق\n[+] يتم تسليمك مفتاح فوري بعد الشراء"
    },
    {
      id: 2,
      title: "هاك فورت نايت (النسخة الفاخرة)",
      desc: "أفضل وأأمن هاك لفورت نايت بمميزات حصرية وتحديثات مستمرة للحماية من الباند. لعب آمن واحترافي.",
      url: "https://salla.sa/t3nn",
      image: "/product-fortnite-hack.jpg",
      icon: <Crosshair className="w-5 h-5" />,
      tag: "الأكثر طلباً",
      details: "المميزات:\n- آيمبوت احترافي دقيق\n- رادار لكشف أماكن اللاعبين واللوت\n- أمان عالي جداً وتحديثات تلقائية مع كل تحديث للعبة\n- نسبة حظر شبه معدومة\n- تنفيذ سريع وفوري\n- خدمة مضمونة بالكامل\n\nملاحظات مهمة قبل الشراء:\n[+] المنتج لا يُسترد، شغال 100%\n[+] بمجرد شرائك للمنتج: سيتم إرسال كود التفعيل على البريد الإلكتروني"
    }
  ];

  return (
    <section id="products" className="py-20 md:py-32 relative z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-yellow-900/5 to-transparent pointer-events-none" />
      <div className="container mx-auto px-4 relative z-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-yellow-500/20 bg-yellow-500/5 mb-6 backdrop-blur-sm">
            <span className="text-yellow-500/80 text-sm font-bold tracking-widest uppercase">CATALOGUE</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text text-gradient-gold drop-shadow-lg">منتجاتنا الحصرية</h2>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto">تشكيلة مختارة من أفضل المنتجات الرقمية المصممة لتعطيك الأفضلية</p>
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
              <TiltCard href={product.url} target="_blank" rel="noopener noreferrer" className="glass-panel-hover glass-panel rounded-3xl overflow-hidden block transition-all duration-500 group">
                <div className="aspect-[16/10] overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent z-10" />
                  <img 
                    src={product.image} 
                    alt={product.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-90"
                  />
                  <div className="absolute top-5 right-5 z-20 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-yellow-400 flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                    {product.icon}
                    {product.tag}
                  </div>
                </div>
                <div className="p-8 relative z-20 -mt-8 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-yellow-400 transition-colors drop-shadow-md">{product.title}</h3>
                  <p className="text-zinc-400 mb-8 leading-relaxed line-clamp-2">{product.desc}</p>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedProduct(product); }}
                      className="text-sm font-bold text-yellow-300 flex items-center justify-center gap-2 bg-yellow-500/10 px-5 py-3 rounded-xl hover:bg-yellow-500/20 border border-yellow-500/30 transition-colors w-full sm:w-auto flex-1 cursor-pointer"
                    >
                      تفاصيل المنتج
                    </button>
                    <a 
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-bold text-black flex flex-row-reverse items-center justify-center gap-2 bg-gradient-gold px-5 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all w-full sm:w-auto flex-1 z-30"
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
    <section id="reviews" className="py-20 md:py-28 relative z-10">
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
    <section id="policies" className="py-20 md:py-28 relative z-10">
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
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg shrink-0 border border-blue-500/20 shadow-inner leading-none">
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

function SuperstarGuide({ onClose }: { onClose: () => void }) {
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
      <div className="container mx-auto px-4 py-16 max-w-6xl relative z-10 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* RIGHT SIDEBAR (Sticky Download Box) */}
        <div className="w-full lg:w-80 shrink-0 sticky top-28 order-1">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-lg hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-4 mb-4 w-full">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shrink-0">
                <FileArchive className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-right flex-1">
                <h4 className="font-bold text-lg text-white">سبوفر تعن</h4>
                <p className="text-xs text-zinc-400 mt-1">الملف الرئيسي للسبوفر</p>
              </div>
            </div>
            <button 
              onClick={() => { const a=document.createElement('a'); a.href='/discord.gg_t3n.rar'; a.download='discord.gg_t3n.rar'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <Download className="w-5 h-5" /> تحميل الملف
            </button>
          </div>
        </div>

        {/* LEFT MAIN CONTENT */}
        <div className="flex-1 order-2 w-full max-w-4xl">
        
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
        
        </div> {/* End of Main Content Left Side */}
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
          <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} poster="/site-guide-poster.jpg" className="w-full h-auto max-h-[70vh] aspect-[16/9] object-contain" autoPlay playsInline>
            <source src="/site-guide-vid.mp4" type="video/mp4" />
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
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'superstar' | 'fortnite' | 'fortnite-hack' | 'used' | 'banned' | 'frozen'>('superstar');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [createCount, setCreateCount] = useState(1);
  const [createType, setCreateType] = useState<'superstar' | 'fortnite' | 'fortnite-hack'>('superstar');
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreated, setLastCreated] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    try { const data = await getAllKeys(); setKeys(data); } catch (e) { console.error('Failed to load keys:', e); }
    setLoading(false);
  };

  useEffect(() => { loadKeys(); }, []);
  useEffect(() => { const iv = setInterval(() => { loadKeys(); }, 30000); return () => clearInterval(iv); }, []);

  const handleCreateKeys = async () => {
    if (createCount < 1 || createCount > 100) return;
    setIsCreating(true);
    try {
      const created = await createKeys(createCount, createType);
      setLastCreated(created);
      await loadKeys();
    } catch (e) { console.error('Failed to create keys:', e); }
    setIsCreating(false);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(lastCreated.join('\n'));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDelete = async (id: string) => { if (!confirm(`حذف المفتاح ${id}؟`)) return; setActionLoading(id); await deleteKey(id); await loadKeys(); setActionLoading(null); };
  const handleDeleteAll = async () => { if (!confirm('⚠️ تحذير: هل أنت متأكد من رغبتك في حذف جميع المفاتيح بالكامل من الموقع؟ هذا الإجراء لا يمكن التراجع عنه وسيلغي منتجات كل من فعلها.')) return; setActionLoading('all'); await deleteAllKeys(); await loadKeys(); setActionLoading(null); };
  const handleBan = async (id: string) => { if (!confirm(`حظر المفتاح ${id}؟`)) return; setActionLoading(id); await banKey(id); await loadKeys(); setActionLoading(null); };
  const handleUnban = async (id: string) => { if (!confirm(`فك حظر ${id}؟`)) return; setActionLoading(id); await unbanKey(id); await loadKeys(); setActionLoading(null); };
  const handleFreeze = async (id: string) => { if (!confirm(`تجميد ${id}؟`)) return; setActionLoading(id); await freezeKey(id); await loadKeys(); setActionLoading(null); };
  const handleUnfreeze = async (id: string) => { if (!confirm(`إلغاء تجميد ${id}؟`)) return; setActionLoading(id); await unfreezeKey(id); await loadKeys(); setActionLoading(null); };

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResult(null); return; }
    setIsSearching(true);
    try {
      const res = await checkKeyStatus(searchQuery.trim());
      setSearchResult(res);
    } catch (err: any) { setSearchResult({ error: err.message }); }
    setIsSearching(false);
  };

  const getKeyStatus = (k: any) => {
    if (k.status === 'banned') return { text: 'محظور', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🚫' };
    if (k.status === 'frozen') return { text: 'مُجمّد', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: '❄️' };
    if (k.status === 'active') return { text: 'مُفعّل', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: '✅' };
    if (k.status === 'unused') return { text: 'غير مستخدم', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '🔑' };
    return { text: 'غير معروف', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: '❓' };
  };

  const filteredKeys = keys.filter(k => {
    if (activeTab === 'superstar') return k.productType === 'superstar' && k.status !== 'banned' && k.status !== 'frozen';
    if (activeTab === 'fortnite') return k.productType === 'fortnite' && k.status !== 'banned' && k.status !== 'frozen';
    if (activeTab === 'fortnite-hack') return k.productType === 'fortnite-hack' && k.status !== 'banned' && k.status !== 'frozen';
    if (activeTab === 'used') return k.status === 'active';
    if (activeTab === 'banned') return k.status === 'banned';
    if (activeTab === 'frozen') return k.status === 'frozen';
    return true;
  });

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99998] bg-black/90 backdrop-blur-xl overflow-y-auto">
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"><Key className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-2xl font-bold text-white">إدارة المفاتيح</h1><p className="text-zinc-400 text-sm">إنشاء وإدارة مفاتيح المنتجات</p></div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeleteAll} disabled={actionLoading === 'all'} className="px-4 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500/20 transition-all text-red-400 font-bold gap-2">
                {actionLoading === 'all' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash2 className="w-4 h-4" /> مسح جميع البيانات (تهيئة)</>}
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadKeys} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all text-white"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all text-white"><X className="w-5 h-5" /></motion.button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* RIGHT: Create & Search */}
            <div className="lg:col-span-1 order-1 space-y-6 sticky top-8">
              {/* Create Keys */}
              <div className="bg-[#0a0a0f]/80 backdrop-blur-md rounded-3xl p-6 border border-emerald-500/20">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-emerald-400" /> إنشاء مفاتيح</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">المنتج</label>
                    <div className="flex gap-2">
                      <button onClick={() => setCreateType('superstar')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${createType === 'superstar' ? 'bg-blue-600 text-white' : 'bg-white/5 text-zinc-400 border border-white/10'}`}><Cpu className="w-4 h-4 inline mr-1" />سبوفر</button>
                      <button onClick={() => setCreateType('fortnite-hack')} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${createType === 'fortnite-hack' ? 'bg-red-600 text-white' : 'bg-white/5 text-zinc-400 border border-white/10'}`}><Crosshair className="w-4 h-4 inline mr-1" />هاك فورت</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-zinc-400 text-xs mb-1 block">العدد (1-100)</label>
                    <input type="number" min={1} max={100} value={createCount} onChange={(e) => setCreateCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-center font-mono focus:outline-none focus:border-emerald-500/50" />
                  </div>
                  <button onClick={handleCreateKeys} disabled={isCreating} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
                    {isCreating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus className="w-5 h-5" /> إنشاء {createCount} مفتاح</>}
                  </button>
                </div>
                {lastCreated.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-emerald-400 font-bold">✅ تم إنشاء {lastCreated.length} مفتاح</span>
                      <button onClick={handleCopyAll} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all">
                        {copySuccess ? <><Check className="w-3 h-3" /> تم النسخ</> : <><Copy className="w-3 h-3" /> نسخ الكل</>}
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-black/30 rounded-xl p-3">
                      {lastCreated.map((k, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-xs font-mono text-zinc-300">{k}</span>
                          <button onClick={() => { navigator.clipboard.writeText(k); }} className="text-zinc-500 hover:text-white transition-colors"><Copy className="w-3 h-3" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {/* Search */}
              <div className="bg-[#0a0a0f]/80 backdrop-blur-md rounded-3xl p-6 border border-blue-500/20">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4"><Search className="w-5 h-5 text-blue-400" /> التحقق من مفتاح</h3>
                <input type="text" placeholder="T3N-XXXXXX-XXXXXX" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 mb-4 font-mono text-center" dir="ltr" />
                <button onClick={handleSearch} disabled={isSearching} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2">
                  {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'بحث واستعلام'}
                </button>
                {searchResult && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    {searchResult.status === 'not_found' ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center"><AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" /><p className="text-red-400 font-bold">المفتاح غير موجود</p></div>
                    ) : searchResult.error ? (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center"><p className="text-red-400">{searchResult.error}</p></div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center"><span className="text-zinc-400 text-xs">الحالة</span><span className={`px-2 py-1 rounded-full text-xs font-bold border ${getKeyStatus(searchResult).color}`}>{getKeyStatus(searchResult).icon} {getKeyStatus(searchResult).text}</span></div>
                        <div className="flex justify-between items-center"><span className="text-zinc-400 text-xs">المنتج</span><span className="text-white text-sm font-bold">{searchResult.productType === 'superstar' ? '🛡️ سوبر ستار' : searchResult.productType === 'fortnite' ? '🎮 فورت نايت' : '🎯 هاك فورت'}</span></div>
                        {searchResult.usedByEmail && <div className="bg-black/30 p-3 rounded-lg"><p className="text-xs text-zinc-500 mb-1">المستخدم:</p><p className="text-sm text-white flex items-center gap-2">{searchResult.usedByPhoto && <img src={searchResult.usedByPhoto} className="w-5 h-5 rounded-full" />}{searchResult.usedByName || searchResult.usedByEmail}</p></div>}
                        {searchResult.activatedAt && <div className="bg-black/30 p-3 rounded-lg"><p className="text-xs text-zinc-500 mb-1">تاريخ التفعيل:</p><p className="text-sm text-white">{new Date(searchResult.activatedAt).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh', dateStyle: 'full', timeStyle: 'short' })}</p><p className="text-xs text-zinc-500 mt-1">{new Date(searchResult.activatedAt).toLocaleString('en-US', { timeZone: 'Asia/Riyadh' })}</p></div>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LEFT: Keys List */}
            <div className="lg:col-span-2 order-2">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center"><p className="text-zinc-400 text-xs mb-1">الكل</p><p className="text-xl font-bold text-white">{keys.length}</p></div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center"><p className="text-zinc-400 text-xs mb-1">سوبر ستار</p><p className="text-xl font-bold text-blue-400">{keys.filter(k => k.productType === 'superstar').length}</p></div>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center"><p className="text-zinc-400 text-xs mb-1">فورت نايت</p><p className="text-xl font-bold text-purple-400">{keys.filter(k => k.productType === 'fortnite').length}</p></div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"><p className="text-zinc-400 text-xs mb-1">هاك فورت</p><p className="text-xl font-bold text-red-400">{keys.filter(k => k.productType === 'fortnite-hack').length}</p></div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center"><p className="text-zinc-400 text-xs mb-1">مُفعّل</p><p className="text-xl font-bold text-emerald-400">{keys.filter(k => k.status === 'active').length}</p></div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center"><p className="text-zinc-400 text-xs mb-1">غير مستخدم</p><p className="text-xl font-bold text-yellow-400">{keys.filter(k => k.status === 'unused').length}</p></div>
              </div>

              {/* Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { id: 'spoofer' as const, label: 'سبوفر', icon: <Cpu className="w-4 h-4" />, color: 'blue' },
                  { id: 'fortnite' as const, label: 'فورت نايت', icon: <Gamepad2 className="w-4 h-4" />, color: 'purple' },
                  { id: 'used' as const, label: 'المستخدمة', icon: <CheckCircle2 className="w-4 h-4" />, color: 'emerald' },
                  { id: 'banned' as const, label: 'المحظورة', icon: <Ban className="w-4 h-4" />, color: 'red' },
                  { id: 'frozen' as const, label: 'المجمدة', icon: <Snowflake className="w-4 h-4" />, color: 'cyan' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === tab.id ? `bg-${tab.color}-600 text-white shadow-lg` : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                    {tab.icon} {tab.label} ({filteredKeys.length === keys.filter(k => { if(tab.id==='spoofer') return k.productType==='spoofer'&&k.status!=='banned'&&k.status!=='frozen'; if(tab.id==='fortnite') return k.productType==='fortnite'&&k.status!=='banned'&&k.status!=='frozen'; if(tab.id==='used') return k.status==='active'; if(tab.id==='banned') return k.status==='banned'; if(tab.id==='frozen') return k.status==='frozen'; return false; }).length && activeTab === tab.id ? filteredKeys.length : keys.filter(k => { if(tab.id==='spoofer') return k.productType==='spoofer'&&k.status!=='banned'&&k.status!=='frozen'; if(tab.id==='fortnite') return k.productType==='fortnite'&&k.status!=='banned'&&k.status!=='frozen'; if(tab.id==='used') return k.status==='active'; if(tab.id==='banned') return k.status==='banned'; if(tab.id==='frozen') return k.status==='frozen'; return false; }).length})
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-40"><div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-3">
                  {filteredKeys.map((k) => {
                    const st = getKeyStatus(k);
                    return (
                      <motion.div key={k.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-all">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <button onClick={() => navigator.clipboard.writeText(k.id)} className="text-white font-mono font-bold text-lg tracking-wider hover:text-emerald-400 transition-colors" title="نسخ">{k.id}</button>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${st.color}`}>{st.icon} {st.text}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${k.productType === 'superstar' ? 'bg-blue-500/20 text-blue-400' : k.productType === 'fortnite' ? 'bg-purple-500/20 text-purple-400' : 'bg-red-500/20 text-red-400'}`}>{k.productType === 'superstar' ? '🛡️ سوبر ستار' : k.productType === 'fortnite' ? '🎮 فورت نايت' : '🎯 هاك فورت'}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                              {k.usedByEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {k.usedByEmail}</span>}
                              {k.usedByName && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {k.usedByName}</span>}
                              {k.activatedAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(k.activatedAt).toLocaleString('ar-SA')}</span>}
                              {!k.usedByUid && <span className="text-yellow-500">🔑 لم يُستخدم بعد</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {k.status !== 'banned' && k.status !== 'frozen' && <button onClick={() => handleBan(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="حظر"><Ban className="w-4 h-4" /></button>}
                            {k.status === 'banned' && <button onClick={() => handleUnban(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all" title="فك الحظر"><CheckCircle2 className="w-4 h-4" /></button>}
                            {k.status !== 'frozen' && k.status !== 'banned' && <button onClick={() => handleFreeze(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-all" title="تجميد"><Snowflake className="w-4 h-4" /></button>}
                            {k.status === 'frozen' && <button onClick={() => handleUnfreeze(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all" title="إلغاء التجميد"><Play className="w-4 h-4" /></button>}
                            <button onClick={() => handleDelete(k.id)} disabled={actionLoading === k.id} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-all" title="حذف"><Trash2 className="w-4 h-4" /></button>
                            {actionLoading === k.id && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredKeys.length === 0 && <div className="text-center py-16 text-zinc-500"><Key className="w-12 h-12 mx-auto mb-4 opacity-30" /><p className="text-lg">لا توجد مفاتيح في هذا القسم</p></div>}
                </div>
              )}
            </div>
          </div>
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
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'banned' | 'admins' | 'logins'>('users');
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
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
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
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-gradient-to-br from-cyan-600/20 to-teal-800/10 border border-cyan-500/20 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <MonitorPlay className="w-5 h-5 text-cyan-400" />
                    <span className="text-zinc-400 text-xs">زيارات الموقع</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalVisits?.toLocaleString() || 0}</p>
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
                <button onClick={() => setActiveTab('keys')} className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'keys' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-white/10'}`}>
                  <span className="flex items-center gap-2"><Key className="w-4 h-4" /> المفاتيح ({stats.totalKeys})</span>
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
                          <th className="px-4 py-3 text-zinc-400 text-xs font-bold">الدولة</th>
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
                              {u.country ? (
                                <span className="inline-flex items-center gap-1.5 text-sm">
                                  <img src={`https://flagcdn.com/20x15/${(u.countryCode || '').toLowerCase()}.png`} alt="" className="w-5 h-4 rounded-sm object-cover" style={{pointerEvents: 'auto'}} />
                                  <span className="text-zinc-300">{u.country}</span>
                                  {u.city && <span className="text-zinc-500 text-xs">({u.city})</span>}
                                </span>
                              ) : (
                                <span className="text-zinc-600 text-xs">—</span>
                              )}
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


              {/* Keys Tab */}
              {activeTab === 'keys' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-zinc-400 text-xs mb-1 font-bold">الكل</span>
                      <span className="text-white font-bold">{stats.keys.length}</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-emerald-400 text-xs mb-1 font-bold">نشط</span>
                      <span className="text-emerald-400 font-bold">{stats.usedKeys}</span>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-red-400 text-xs mb-1 font-bold">محظور</span>
                      <span className="text-red-400 font-bold">{stats.bannedKeys}</span>
                    </div>
                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-4 flex flex-col items-center">
                      <span className="text-cyan-400 text-xs mb-1 font-bold">مجمد</span>
                      <span className="text-cyan-400 font-bold">{stats.frozenKeys}</span>
                    </div>
                  </div>

                  {/* Keys List */}
                  <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                    {stats.keys.map((k: any, i: number) => {
                      let statusText = 'غير مستخدم';
                      let badgeColors = 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
                      
                      if (k.status === 'active') {
                        statusText = 'نشط';
                        badgeColors = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                      } else if (k.status === 'banned') {
                        statusText = 'محظور';
                        badgeColors = 'bg-red-500/20 text-red-500 border-red-500/30';
                      } else if (k.status === 'frozen') {
                        statusText = 'مجمد';
                        badgeColors = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
                      }

                      return (
                        <div key={k.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/[0.07] transition-all group">
                          {/* Left Actions */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDelete(k.usedByUid, k.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all opacity-70 group-hover:opacity-100" title="حذف">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            {k.status !== 'frozen' && k.status !== 'banned' && (
                              <button className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 transition-all opacity-70 group-hover:opacity-100" title="تجميد">
                                <Snowflake className="w-4 h-4" />
                              </button>
                            )}
                            {k.status !== 'banned' && k.status !== 'frozen' && (
                              <button className="w-8 h-8 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all opacity-70 group-hover:opacity-100" title="حظر">
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Right Info */}
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${k.productType === 'spoofer' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'} flex items-center gap-1`}>
                                {k.productType === 'spoofer' ? '🛡️ سبوفر' : '🎮 فورت نايت'}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-bold border ${badgeColors} flex items-center gap-1`}>
                                {statusText === 'نشط' && <Check className="w-3 h-3" />}
                                {statusText}
                              </span>
                              <span className="text-white font-bold text-lg tracking-wider font-mono">{k.id}</span>
                            </div>
                            <div className="flex items-center justify-end gap-4 text-xs text-zinc-500">
                              {k.activatedAt && (
                                <span className="flex items-center gap-1" dir="ltr">
                                  {new Date(k.activatedAt).toLocaleString('ar-SA')} <Clock className="w-3 h-3" /> فُعل:
                                </span>
                              )}
                              {k.usedByEmail && (
                                <span className="flex items-center gap-1" dir="ltr">
                                  {k.usedByEmail} <Mail className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    {stats.keys.length === 0 && (
                      <div className="p-8 text-center text-zinc-500 bg-white/5 rounded-xl">لا توجد مفاتيح حالياً</div>
                    )}
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

function FortniteHackGuide({ onClose }: { onClose: () => void }) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] overflow-y-auto"
      style={{ background: 'radial-gradient(ellipse at center, #0a1930 0%, #030814 50%, #000000 100%)' }}
    >
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'url(/bg-fortnite-new.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', filter: 'blur(10px) brightness(0.5)' }} />
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />

      <div className="sticky top-0 z-50 backdrop-blur-xl bg-[#030814]/80 border-b border-blue-500/20">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="T3N" className="w-10 h-10 object-contain rounded-lg" />
            <span className="font-bold text-xl text-white">شرح استخدام هاك فورت نايت</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-4xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <Gamepad2 className="w-10 h-10 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200">شرح استخدام هاك فورت نايت</h1>
          <p className="text-blue-200/60 text-lg max-w-2xl mx-auto">اتبع الخطوات التالية بالترتيب لتشغيل الهاك بنجاح</p>
        </motion.div>

        <div className="flex flex-col gap-12">
          {/* Section 1: Main Hack */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="rounded-2xl p-6 md:p-8 bg-[#0a1930]/60 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.1)] mb-6">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-blue-400">1️⃣</span> شرح هاك فورت
              </h4>
              <div className="rounded-xl overflow-hidden border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] mb-6">
                <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full" preload="metadata">
                  <source src="/video-fortnite-main.mp4" type="video/mp4" />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-lg hover:border-blue-500/30 transition-colors mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shrink-0">
                    <FileArchive className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold text-lg text-white">ملف هاك فورت نايت</h4>
                    <p className="text-xs text-zinc-400 mt-1">الملف الرئيسي للهاك</p>
                  </div>
                </div>
                <button 
                  onClick={() => { const a=document.createElement('a'); a.href='/t3n-fortnite.rar'; a.download='T3N Fortnite.rar'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="w-5 h-5" /> تحميل الملف
                </button>
              </div>
            </div>
          </motion.div>

          {/* Section 2: Mouse Driver */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="rounded-2xl p-6 md:p-8 bg-[#0a1930]/60 backdrop-blur-lg border border-blue-500/20 shadow-[0_0_25px_rgba(59,130,246,0.1)]">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-blue-400">2️⃣</span> شرح تركيب تعريفات الهاك
              </h4>
              <div className="rounded-xl overflow-hidden border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)] mb-6">
                <video controls controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} className="w-full" preload="metadata">
                  <source src="/video-fortnite-driver.mp4" type="video/mp4" />
                  متصفحك لا يدعم تشغيل الفيديو
                </video>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col items-center shadow-lg hover:border-blue-500/30 transition-colors mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 shrink-0">
                    <FileArchive className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-right flex-1">
                    <h4 className="font-bold text-lg text-white">Mouse Driver</h4>
                    <p className="text-xs text-zinc-400 mt-1">هو عباره عن ملف تعريفات هاك فورت نايت مهم تحميله عشان الهاك يعملل بدون مشاكل</p>
                  </div>
                </div>
                <button 
                  onClick={() => { const a=document.createElement('a'); a.href='/mouse-driver.rar'; a.download='Mouse Driver.rar'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="w-5 h-5" /> تحميل الملف
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}

function MaintenanceScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-blue-900/10 mix-blend-screen" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-2xl flex flex-col items-center glass-panel p-12 rounded-[3rem] border border-white/5 shadow-2xl"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 mb-8 relative flex items-center justify-center bg-orange-500/10 rounded-full border border-orange-500/20 shadow-[0_0_50px_rgba(249,115,22,0.2)]"
        >
          <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping opacity-50"></div>
          <Wrench className="w-16 h-16 text-orange-400 relative z-10" />
        </motion.div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-orange-200 to-orange-500 drop-shadow-md">
          الموقع تحت التحديث والصيانة
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-lg">
          نعمل حالياً على تطوير وترقية <span className="text-white font-bold">متجر تعن</span> لتقديم تجربة أفضل وأكثر أماناً لكم. سنعود للعمل في أقرب وقت ممكن.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <motion.a 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={DISCORD_URL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-[0_10px_25px_rgba(88,101,242,0.4)]"
          >
            <MessageCircle className="w-6 h-6" />
            تواصل معنا عبر الديسكورد
          </motion.a>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isVerifiedCustomer, setIsVerifiedCustomer] = useState(false);
  const [activatedProducts, setActivatedProducts] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSuperstarGuide, setShowSuperstarGuide] = useState(false);
  const [showFortniteGuide, setShowFortniteGuide] = useState(false);
  const [showFortniteHackGuide, setShowFortniteHackGuide] = useState(false);
  const [showSiteGuide, setShowSiteGuide] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('t3n-theme');
    return saved ? saved === 'dark' : true;
  });

  const [appLoading, setAppLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsub = listenToNotifications((notifs) => {
      setNotifications(notifs);
      const lastReadId = localStorage.getItem('t3n_last_read_notif');
      if (!lastReadId) {
        setUnreadCount(notifs.length);
      } else {
        const lastReadIndex = notifs.findIndex(n => n.id === lastReadId);
        if (lastReadIndex === -1) {
          setUnreadCount(notifs.length);
        } else {
          setUnreadCount(lastReadIndex);
        }
      }
    });

    const unsubMaintenance = listenToMaintenanceMode((mode) => {
      setIsMaintenance(mode);
    });

    return () => {
      unsub();
      unsubMaintenance();
    };
  }, []);

  const handleReadNotifications = () => {
    if (notifications.length > 0) {
      localStorage.setItem('t3n_last_read_notif', notifications[0].id);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    // Scroll to top listener
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    
    // Initial loading screen timeout
    const timer = setTimeout(() => setAppLoading(false), 2000);

    // 📈 Track site visit
    trackSiteVisit();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

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

  // Parse Custom Token returned from Discord API Backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const customToken = params.get('token');
    if (customToken) {
      setAuthLoading(true);
      signInWithCustomToken(auth, customToken).then(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }).catch(err => {
        console.error("Custom token login error:", err);
      }).finally(() => {
        setAuthLoading(false);
      });
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

        const vipResult = await checkUserVIP(currentUser.uid);
        setIsVerifiedCustomer(vipResult.isVIP);

        if (vipResult.isVIP) {
          if (vipResult.products && Array.isArray(vipResult.products)) {
            setActivatedProducts(vipResult.products);
          }
        }

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
                      setToast({ type: 'error', message: errData.error || 'طلبات كثيرة، يرجى المحاولة بعد 30 ثانية' });
                    } else {
                      setToast({ type: 'error', message: errData.error || 'فشل في الاتصال بسيرفر الرتب. يرجى المحاولة لاحقاً' });
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

  // Show Maintenance Screen if active and user is not admin
  if (isMaintenance && !isAdminUser && !authLoading) {
    return <MaintenanceScreen />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#06060c] text-zinc-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* 🚀 Initial Loading Screen */}
      <AnimatePresence>
        {appLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[999999] bg-[#06060c] flex flex-col items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              className="relative w-32 h-32 mb-8"
            >
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
              <img src={LOGO_URL} alt="T3N Logo" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-4"
            >
              <h2 className="text-3xl font-extrabold text-white tracking-widest drop-shadow-lg">T3N STORE</h2>
              <div className="flex gap-2 mt-2">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    className="w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                  />
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 right-6 z-40 w-12 h-12 rounded-full bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 flex items-center justify-center text-blue-400 hover:bg-blue-600 hover:text-white transition-all shadow-[0_8px_25px_rgba(37,99,235,0.3)]"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

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
        onLogin={() => setShowLoginModal(true)} 
        onLogout={logout} 
        authLoading={authLoading}
        onSuperstarClick={() => setShowSuperstarGuide(true)} 
        onFortniteClick={() => setShowFortniteGuide(true)}
        onFortniteHackClick={() => setShowFortniteHackGuide(true)}
        onTroubleshootClick={() => setShowTroubleshoot(true)}
        notifications={notifications}
        unreadCount={unreadCount}
        onReadNotifications={handleReadNotifications}
        isAdminUser={isAdminUser}
        activatedProducts={activatedProducts}
      />

      {/* Admin Button - Only visible to admin */}
      {user && isAdminUser && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleMaintenanceMode(isMaintenance)}
            className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg border transition-all duration-300 ${isMaintenance ? 'bg-orange-600 border-orange-400/50 shadow-[0_8px_25px_rgba(234,88,12,0.5)]' : 'bg-black/60 backdrop-blur-md border-white/10 hover:border-orange-500/50 hover:bg-black/80 shadow-xl hover:shadow-[0_8px_25px_rgba(249,115,22,0.3)]'}`}
            title={isMaintenance ? "الموقع في وضع الصيانة - اضغط للإيقاف" : "تفعيل وضع الصيانة"}
          >
            {isMaintenance ? <Wrench className="w-6 h-6 animate-pulse" /> : <ShieldAlert className="w-6 h-6 text-orange-400/70" />}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowAdmin(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-orange-500 text-white flex items-center justify-center shadow-[0_8px_25px_rgba(239,68,68,0.4)] border border-red-400/30 hover:shadow-[0_8px_35px_rgba(239,68,68,0.6)] transition-shadow"
            title="لوحة التحكم"
          >
            <LayoutDashboard className="w-6 h-6" />
          </motion.button>
        </div>
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
        <Hero onSiteGuideClick={() => setShowSiteGuide(true)} onFortniteClick={() => setShowFortniteGuide(true)} />
        <OrderDelivery 
          user={user}
          onLogin={() => setShowLoginModal(true)}
          onVerify={async (keyId, products) => {
            setIsVerifiedCustomer(true);
            if (products && Array.isArray(products) && products.length > 0) {
              setActivatedProducts(products);
            } else {
              try {
                const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
                const { db: firestoreDb } = await import('./lib/firebase');
                const userDocRef = firestoreDoc(firestoreDb, 'users', user!.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                  const prods = userDocSnap.data()?.activatedProducts;
                  if (prods && Array.isArray(prods)) setActivatedProducts(prods);
                }
              } catch (e) {
                console.log('Could not read activatedProducts');
              }
            }
          }}
          onFortniteClick={() => setShowFortniteGuide(true)}
          onSuperstarClick={() => setShowSuperstarGuide(true)}
          onFortniteHackClick={() => setShowFortniteHackGuide(true)}
          activatedProducts={activatedProducts}
        />
        <Products />
        <Reviews />
        <FAQ />
        <Policies />
      </main>
      <Footer />

      {/* Superstar Guide Page - VIP Only */}
      <AnimatePresence>
        {showSuperstarGuide && <SuperstarGuide onClose={() => setShowSuperstarGuide(false)} />}
      </AnimatePresence>

      {/* Fortnite Hack Guide Page - VIP Only */}
      <AnimatePresence>
        {showFortniteHackGuide && <FortniteHackGuide onClose={() => setShowFortniteHackGuide(false)} />}
      </AnimatePresence>

      {/* Site Guide Page */}
      <AnimatePresence>
        {showSiteGuide && <SiteGuide onClose={() => setShowSiteGuide(false)} />}
      </AnimatePresence>

      {/* Floating Buttons Removed as requested */}


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

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}









