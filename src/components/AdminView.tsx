import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, LogOut, Trash2, CheckCircle, RefreshCw, Smartphone, Clock, X, Maximize2, Shield, Heart } from "lucide-react";
import { getAdminResponses, deleteAdminResponse, MonthsaryResponse, supabase } from "../lib/supabase";

interface AdminViewProps {
  onExit: () => void;
}

export function AdminView({ onExit }: AdminViewProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [responses, setResponses] = useState<MonthsaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Check existing Supabase session on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
      }
    });
  }, []);

  // Fetch responses from Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchResponses();
    }
  }, [isAuthenticated]);

  const fetchResponses = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminResponses();
      setResponses(data);
    } catch (err) {
      console.error("Failed fetching admin responses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) {
      setLoginError("Please enter email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate EXCLUSIVELY via Supabase Auth database
      const { data, error } = await supabase.auth.signInWithPassword({
        email: inputEmail,
        password: inputPassword,
      });

      if (error || !data.session) {
        setLoginError(error?.message || "Invalid login credentials.");
        return;
      }

      setIsAuthenticated(true);
    } catch (err) {
      console.error("Login error:", err);
      setLoginError("Authentication failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this response?")) return;
    const success = await deleteAdminResponse(id);
    if (success) {
      setResponses((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert("Could not delete response.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center p-3 sm:p-4 max-w-4xl w-full my-auto z-10 text-center"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-6">
        <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 bg-rose-100/80 px-3.5 py-1.5 rounded-full border border-rose-200 inline-flex items-center gap-1.5">
          <Shield size={14} className="text-rose-500" />
          <span>Private Admin Dashboard</span>
        </span>

        <button
          onClick={onExit}
          className="rounded-full bg-white/80 border border-rose-200 px-4 py-1.5 text-xs font-bold text-rose-700 shadow-sm hover:bg-white min-h-[38px]"
        >
          Exit Admin
        </button>
      </div>

      {!isAuthenticated ? (
        /* Admin Login Form */
        <div className="w-full max-w-md bg-white/85 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-white/90 shadow-2xl text-left">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-3">
            <Lock size={22} />
          </div>

          <h2 className="text-2xl font-bold text-rose-600 font-display text-center mb-1">
            Admin Authentication
          </h2>
          <p className="text-xs text-gray-500 text-center mb-6">
            Sign in with Supabase Auth to view My Pretty Baby Angel's responses
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-gray-800 focus:border-rose-500 focus:bg-white focus:outline-none min-h-[48px]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-sm text-gray-800 focus:border-rose-500 focus:bg-white focus:outline-none min-h-[48px]"
                required
              />
            </div>

            {loginError && (
              <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl border border-red-200">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all min-h-[48px] disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In to Admin"}
            </button>
          </form>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="w-full bg-white/85 backdrop-blur-md p-5 sm:p-8 rounded-3xl border border-white/90 shadow-2xl text-left">
          <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-rose-600 font-display flex items-center gap-2">
                <span>My Pretty Baby Angel's Received Responses</span>
                <Heart size={20} className="fill-rose-500 text-rose-500" />
              </h2>
              <p className="text-xs text-gray-500">
                Total submissions: {responses.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchResponses}
                className="p-2 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                title="Refresh responses"
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-bold"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm font-medium">No responses received yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Share the link with My Pretty Baby Angel to receive her reply!
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((item) => (
                <div
                  key={item.id || item.response_token}
                  className="rounded-2xl bg-white p-5 border border-rose-200 shadow-md relative group"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-rose-700 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <CheckCircle size={16} className="text-green-500" />
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(item.created_at || Date.now()).toLocaleString()}
                        </span>
                        {item.user_agent && (
                          <span className="flex items-center gap-1 max-w-[200px] truncate" title={item.user_agent}>
                            <Smartphone size={12} />
                            {item.user_agent.includes("Mobile") ? "Mobile Device" : "Desktop Browser"}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => item.id && handleDelete(item.id)}
                      className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete response"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Message Content */}
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 mb-4">
                    <p className="text-sm sm:text-base text-gray-800 font-serif italic whitespace-pre-wrap">
                      "{item.message}"
                    </p>
                  </div>

                  {/* Reaction Images Grid */}
                  {item.image_urls && item.image_urls.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-2">
                        Uploaded Photos ({item.image_urls.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {item.image_urls.map((imgUrl, imgIdx) => (
                          <div
                            key={imgIdx}
                            onClick={() => setSelectedImageModal(imgUrl)}
                            className="aspect-square rounded-xl overflow-hidden border border-rose-200 shadow-sm relative group cursor-pointer"
                          >
                            <img src={imgUrl} alt="Reaction" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 size={16} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImageModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          >
            <div className="relative max-w-2xl w-full bg-white rounded-3xl p-4 flex flex-col items-center">
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 rounded-full bg-rose-100 p-2 text-rose-600"
              >
                <X size={20} />
              </button>
              <img src={selectedImageModal} alt="Expanded Reaction" className="max-h-[75vh] w-auto object-contain rounded-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
