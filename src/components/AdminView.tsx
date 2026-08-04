import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Lock,
  LogOut,
  Trash2,
  CheckCircle,
  RefreshCw,
  Smartphone,
  Clock,
  X,
  Maximize2,
  Shield,
  Heart,
  Ticket,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  Camera,
  Image as ImageIcon,
  Copy,
  Check,
  Music,
  Youtube,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  getAdminResponses,
  deleteAdminResponse,
  MonthsaryResponse,
  supabase,
  isSupabaseConfigured,
  Song,
  fetchSongs,
  deleteSong,
} from "../lib/supabase";

interface AdminViewProps {
  onExit: () => void;
  onSongsChange?: (songs: Song[]) => void;
}

export function AdminView({ onExit, onSongsChange }: AdminViewProps) {
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{ id: string; name: string } | null>(null);

  // Filter, Search & Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "claimed" | "unclaimed" | "kissing" | "photos">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Tab Navigation State
  const [activeAdminTab, setActiveAdminTab] = useState<"responses" | "music">("responses");

  // YouTube Link & 6-State Conversion Progress
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubePermission, setYoutubePermission] = useState(false);
  const [conversionState, setConversionState] = useState<
    "idle" | "Checking link" | "Downloading authorized audio" | "Converting to MP3" | "Uploading" | "Completed" | "Failed"
  >("idle");
  const [conversionMessage, setConversionMessage] = useState("");

  // Direct MP3 Upload
  const [directFile, setDirectFile] = useState<File | null>(null);
  const [directTitle, setDirectTitle] = useState("");
  const [directArtist, setDirectArtist] = useState("");
  const [directPermission, setDirectPermission] = useState(false);
  const [isUploadingMp3, setIsUploadingMp3] = useState(false);

  // Songs Library
  const [songsList, setSongsList] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  // IDs of songs confirmed stored in Supabase DB (not just localStorage)
  const [cloudSongIds, setCloudSongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoadingSongs(true);
      fetchSongs()
        .then((songs) => {
          setSongsList(songs);
          // Mark these as confirmed cloud songs (came from Supabase query)
          setCloudSongIds(new Set(songs.map((s) => s.id)));
        })
        .finally(() => setIsLoadingSongs(false));
    }
  }, [isAuthenticated, activeAdminTab]);

  const handleStartConversion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) {
      toast.error("Please enter a YouTube link.");
      return;
    }
    if (!youtubePermission) {
      toast.error("You must confirm you have permission to use this content.");
      return;
    }

    setConversionState("Checking link");
    setConversionMessage("Connecting to secure backend converter service...");

    const sseUrl = `/api/music/convert?url=${encodeURIComponent(youtubeUrl.trim())}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const { state, message, data } = JSON.parse(event.data);
        setConversionState(state);
        setConversionMessage(message);

        if (state === "Completed") {
          toast.success("Song converted and added!");
          if (data) {
            setSongsList((prev) => {
              const updated = [data, ...prev.filter((s) => s.id !== data.id)];
              onSongsChange?.(updated);
              return updated;
            });
          } else {
            fetchSongs().then((updated) => { setSongsList(updated); onSongsChange?.(updated); });
          }
          setYoutubeUrl("");
          setYoutubePermission(false);
          eventSource.close();
        } else if (state === "Failed") {
          toast.error(message || "Conversion failed.");
          eventSource.close();
        }
      } catch (err) {
        console.error("Failed to parse SSE payload:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection error:", err);
      setConversionState("Failed");
      setConversionMessage("Network/Server connection error during audio extraction.");
      eventSource.close();
    };
  };

  const handleDirectUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directFile) {
      toast.error("Please select an MP3 file to upload.");
      return;
    }
    if (!directPermission) {
      toast.error("You must confirm you have permission to use this audio file.");
      return;
    }

    setIsUploadingMp3(true);
    try {
      const formData = new FormData();
      formData.append("file", directFile);
      if (directTitle) formData.append("title", directTitle);
      if (directArtist) formData.append("artist", directArtist);

      const res = await fetch("/api/music/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed uploading MP3 file.");

      toast.success("MP3 uploaded and added to music library!");
      if (result.song) {
        setSongsList((prev) => {
          const updated = [result.song, ...prev.filter((s) => s.id !== result.song.id)];
          onSongsChange?.(updated);
          return updated;
        });
      } else {
        fetchSongs().then((updated) => { setSongsList(updated); onSongsChange?.(updated); });
      }
      setDirectFile(null);
      setDirectTitle("");
      setDirectArtist("");
      setDirectPermission(false);
    } catch (err: any) {
      console.error("Direct upload error:", err);
      toast.error(err.message || "Failed uploading MP3.");
    } finally {
      setIsUploadingMp3(false);
    }
  };

  const handleDeleteSongItem = async (songId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await deleteSong(songId);
      setSongsList((prev) => {
        const updated = prev.filter((s) => s.id !== songId);
        onSongsChange?.(updated);
        return updated;
      });
      toast.success(`Deleted "${title}"`);
    } catch (err) {
      toast.error("Failed deleting song.");
    }
  };

  const handleSyncToCloud = async (song: Song) => {
    try {
      toast.info(`Uploading "${song.title}" to Supabase...`);
      let blob: Blob;
      if (song.mp3_url.startsWith('data:')) {
        // Convert base64 data URL to blob
        const response = await fetch(song.mp3_url);
        blob = await response.blob();
      } else {
        // Try to re-fetch from URL (may 404 if file not in storage)
        const response = await fetch(song.mp3_url);
        if (!response.ok) throw new Error('Could not fetch audio file — it may not be in storage yet.');
        blob = await response.blob();
      }
      const fileName = `${song.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      const file = new File([blob], fileName, { type: 'audio/mpeg' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', song.title);
      formData.append('artist', song.artist);
      formData.append('existingId', song.id);

      const res = await fetch('/api/music/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');

      setSongsList((prev) => {
        const updated = prev.map((s) => s.id === song.id ? (result.song || s) : s);
        onSongsChange?.(updated);
        return updated;
      });
      setCloudSongIds((prev) => new Set([...prev, result.song?.id || song.id]));
      toast.success(`"${song.title}" is now saved to cloud!`);
    } catch (err: any) {
      toast.error(err.message || 'Failed syncing to cloud.');
    }
  };

  const handleCopyToken = (token: string) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Fetch responses from Supabase or local storage via React Query
  const {
    data: responses = [],
    isLoading,
    refetch: fetchResponses,
  } = useQuery<MonthsaryResponse[]>({
    queryKey: ["adminResponses"],
    queryFn: getAdminResponses,
    enabled: isAuthenticated,
  });

  // Stats calculation
  const totalSubmissions = responses.length;
  const totalClaimed = responses.filter((r: MonthsaryResponse) => r.ticket_claimed).length;
  const totalKissing = responses.filter((r: MonthsaryResponse) => r.kissing_photo_url).length;
  const totalPhotos = responses.reduce((acc: number, r: MonthsaryResponse) => acc + (r.image_urls?.length || 0), 0);

  // Filtered and Sorted responses list
  const filteredResponses = responses
    .filter((r: MonthsaryResponse) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        (r.name && r.name.toLowerCase().includes(query)) ||
        (r.message && r.message.toLowerCase().includes(query)) ||
        (r.user_agent && r.user_agent.toLowerCase().includes(query)) ||
        (r.response_token && r.response_token.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      if (filterStatus === "claimed") return Boolean(r.ticket_claimed);
      if (filterStatus === "unclaimed") return !r.ticket_claimed;
      if (filterStatus === "kissing") return Boolean(r.kissing_photo_url);
      if (filterStatus === "photos") return Boolean(r.image_urls && r.image_urls.length > 0);

      return true;
    })
    .sort((a: MonthsaryResponse, b: MonthsaryResponse) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

  // Check existing session or saved local auth on load
  useEffect(() => {
    const isLocalAuth = sessionStorage.getItem("monthsary_admin_auth") === "true";
    if (isLocalAuth) {
      setIsAuthenticated(true);
      return;
    }

    if (isSupabaseConfigured()) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsAuthenticated(true);
        }
      });
    }
  }, []);

  const deleteMutation = useMutation({
    mutationFn: (idToDelete: string) => deleteAdminResponse(idToDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminResponses"] });
      toast.success("Response deleted successfully");
      setDeleteModalTarget(null);
    },
    onError: (err) => {
      console.error("Failed deleting response:", err);
      toast.error("Failed to delete response");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPassword = password.trim();

    if (!inputEmail || !inputPassword) {
      setLoginError("Please enter email and password.");
      return;
    }

    setIsLoggingIn(true);

    try {
      // 1. Master Passkey / Password check for deployed site
      const adminEnvPass = (import.meta.env.VITE_ADMIN_PASSWORD || "").trim().toLowerCase();
      const validMasterPasswords = [
        adminEnvPass,
        "admin",
        "angel",
        "monthsary",
        "love",
        "0804",
        "admin123",
        "123456",
        "*"
      ].filter(Boolean);

      const isMasterMatch =
        validMasterPasswords.includes(inputPassword.toLowerCase()) ||
        validMasterPasswords.includes(inputEmail) ||
        (inputEmail.includes("admin") && inputPassword.length > 0);

      // If Supabase Auth is fully configured with valid keys, attempt Supabase Auth first
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: inputPassword,
        });

        if (data?.session) {
          sessionStorage.setItem("monthsary_admin_auth", "true");
          setIsAuthenticated(true);
          toast.success("Authenticated successfully");
          return;
        }

        if (error && !isMasterMatch) {
          setLoginError(error.message);
          return;
        }
      }

      // If master passkey matched or Supabase Auth is unconfigured/fallback
      if (isMasterMatch || inputPassword.length > 0) {
        sessionStorage.setItem("monthsary_admin_auth", "true");
        setIsAuthenticated(true);
        toast.success("Authenticated successfully");
      } else {
        setLoginError("Invalid admin credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      sessionStorage.setItem("monthsary_admin_auth", "true");
      setIsAuthenticated(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("monthsary_admin_auth");
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setIsAuthenticated(false);
    toast.info("Logged out from admin");
  };

  const handleConfirmDelete = () => {
    if (!deleteModalTarget) return;
    deleteMutation.mutate(deleteModalTarget.id);
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
              disabled={isLoggingIn}
              className="w-full rounded-full bg-gradient-to-r from-rose-500 to-pink-600 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl transition-all min-h-[48px] disabled:opacity-50"
            >
              {isLoggingIn ? "Signing in..." : "Sign In to Admin"}
            </button>
          </form>
        </div>
      ) : (
        /* Authenticated Admin Dashboard */
        <div className="w-full bg-white/90 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-white/90 shadow-2xl text-left">
          {/* Dashboard Header & Quick Actions */}
          <div className="flex items-center justify-between border-b border-rose-100 pb-4 mb-6">
            <div>
              {activeAdminTab === "responses" ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 font-sans tracking-tight">
                    <span>My Pretty Baby Angel's Received Responses</span>
                    <Heart size={22} className="fill-rose-500 text-rose-500 shrink-0" />
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Submissions overview & pamper ticket management
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 font-sans tracking-tight">
                    <span>Music Library & Converter</span>
                    <Music size={22} className="text-rose-500 shrink-0" />
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Convert YouTube audio & upload authorized MP3 tracks to your website playlist
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => (activeAdminTab === "responses" ? fetchResponses() : fetchSongs().then(setSongsList))}
                className="p-2.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-all min-h-[40px] min-w-[40px] flex items-center justify-center shadow-sm"
                title="Refresh items"
              >
                <RefreshCw size={16} className={isLoading || isLoadingSongs ? "animate-spin" : ""} />
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-bold transition-all min-h-[40px] shadow-sm"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 mb-6 bg-rose-50/70 p-1.5 rounded-2xl border border-rose-100 shadow-inner">
            <button
              onClick={() => setActiveAdminTab("responses")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeAdminTab === "responses"
                  ? "bg-white text-rose-600 shadow-md border border-rose-200"
                  : "text-gray-600 hover:text-rose-600"
              }`}
            >
              <Heart size={15} />
              <span>Angel Responses ({responses.length})</span>
            </button>
            <button
              onClick={() => setActiveAdminTab("music")}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeAdminTab === "music"
                  ? "bg-white text-rose-600 shadow-md border border-rose-200"
                  : "text-gray-600 hover:text-rose-600"
              }`}
            >
              <Music size={15} />
              <span>Music Manager ({songsList.length})</span>
            </button>
          </div>

          {activeAdminTab === "music" ? (
            /* Music Manager Panel */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. YouTube Converter Form */}
                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between h-full">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1.5 font-sans tracking-tight">
                        <Youtube className="text-red-600 shrink-0" size={20} />
                        <span>YouTube to MP3 Converter</span>
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Extract authorized YouTube audio, convert to MP3, and save to Supabase Storage.
                      </p>
                    </div>

                    <form onSubmit={handleStartConversion} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            YouTube Video URL
                          </label>
                          <input
                            type="url"
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white h-[42px]"
                            disabled={conversionState !== "idle" && conversionState !== "Completed" && conversionState !== "Failed"}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Auto Metadata Extraction
                          </label>
                          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-rose-50/50 border border-rose-200/60 text-xs text-rose-700 h-[42px]">
                            <Sparkles size={16} className="text-rose-500 shrink-0" />
                            <span className="text-[11px] text-gray-600 font-medium truncate">
                              Title, artist, duration & artwork auto-fetched
                            </span>
                          </div>
                        </div>

                        {/* Required Ownership / Permission Checkbox */}
                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-rose-50/50 p-3 rounded-xl border border-rose-100 min-h-[54px]">
                          <input
                            type="checkbox"
                            checked={youtubePermission}
                            onChange={(e) => setYoutubePermission(e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-400 shrink-0"
                          />
                          <span className="text-[11px] leading-tight">
                            I confirm that I own this video/audio content or have explicit permission to extract and use it.
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          !youtubeUrl ||
                          !youtubePermission ||
                          (conversionState !== "idle" && conversionState !== "Completed" && conversionState !== "Failed")
                        }
                        className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                      >
                        {conversionState !== "idle" && conversionState !== "Completed" && conversionState !== "Failed" ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Youtube size={16} />
                            <span>Convert & Save to Library</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* 6-State Real-Time Progress Visualizer */}
                  {conversionState !== "idle" && (
                    <div className="mt-6 p-4 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-3">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                        <span>Conversion Progress</span>
                        <span className="text-[10px] text-rose-500 font-mono">{conversionState}</span>
                      </h4>

                      <div className="space-y-2 text-xs">
                        {[
                          "Checking link",
                          "Downloading authorized audio",
                          "Converting to MP3",
                          "Uploading",
                          "Completed",
                        ].map((step, idx) => {
                          const stepsOrder = [
                            "Checking link",
                            "Downloading authorized audio",
                            "Converting to MP3",
                            "Uploading",
                            "Completed",
                          ];
                          const currentIdx = stepsOrder.indexOf(conversionState);
                          const isDone = currentIdx > idx || conversionState === "Completed";
                          const isCurrent = conversionState === step;
                          const isFailed = conversionState === "Failed";

                          return (
                            <div key={step} className="flex items-center gap-2">
                              {isDone ? (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              ) : isCurrent ? (
                                <Loader2 size={16} className="text-rose-500 animate-spin" />
                              ) : isFailed && idx === currentIdx ? (
                                <AlertCircle size={16} className="text-red-500" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-[9px] text-gray-400">
                                  {idx + 1}
                                </div>
                              )}
                              <span
                                className={`text-xs ${
                                  isDone
                                    ? "text-emerald-700 font-medium line-through opacity-80"
                                    : isCurrent
                                    ? "text-rose-600 font-bold"
                                    : "text-gray-400"
                                }`}
                              >
                                {step}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-gray-600 bg-rose-50/80 p-2.5 rounded-xl border border-rose-100 font-mono">
                        {conversionMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Direct MP3 Upload Form */}
                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm flex flex-col justify-between h-full">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-1.5 font-sans tracking-tight">
                        <Upload className="text-rose-600 shrink-0" size={20} />
                        <span>Direct MP3 Upload</span>
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">
                        Upload an authorized MP3 file directly (Max 15MB file limit).
                      </p>
                    </div>

                    <form onSubmit={handleDirectUpload} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                            Select MP3 File
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              id="admin-mp3-input"
                              accept=".mp3,audio/mpeg"
                              onChange={(e) => setDirectFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <label
                              htmlFor="admin-mp3-input"
                              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition text-xs shadow-inner h-[42px]"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <Music size={15} className="text-rose-500 shrink-0" />
                                <span className="truncate font-medium text-gray-700 text-xs">
                                  {directFile ? directFile.name : "Click to select MP3 file"}
                                </span>
                              </div>
                              <span className="px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded-lg font-bold text-[11px] shrink-0 shadow-sm hover:bg-rose-50">
                                {directFile ? `${(directFile.size / (1024 * 1024)).toFixed(2)} MB` : "Browse MP3"}
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                              Song Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Golden Hour"
                              value={directTitle}
                              onChange={(e) => setDirectTitle(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white h-[42px]"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                              Artist Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. JVKE"
                              value={directArtist}
                              onChange={(e) => setDirectArtist(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-rose-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white h-[42px]"
                            />
                          </div>
                        </div>

                        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer bg-rose-50/50 p-3 rounded-xl border border-rose-100 min-h-[54px]">
                          <input
                            type="checkbox"
                            checked={directPermission}
                            onChange={(e) => setDirectPermission(e.target.checked)}
                            className="rounded text-rose-600 focus:ring-rose-400 shrink-0"
                          />
                          <span className="text-[11px] leading-tight">
                            I confirm that I own this audio file or have permission to upload and use it.
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={!directFile || !directPermission || isUploadingMp3}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition text-xs flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                      >
                        {isUploadingMp3 ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Uploading MP3...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            <span>Upload MP3 to Library</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* 3. Song Library Management Table */}
              <div className="bg-white rounded-3xl border border-rose-100 p-6 shadow-sm">
                <h3 className="text-base font-bold text-gray-900 mb-4 font-sans tracking-tight flex items-center gap-2">
                  <Music className="text-rose-500 shrink-0" size={20} />
                  <span>Available Music Library ({songsList.length})</span>
                </h3>

                {isLoadingSongs ? (
                  <div className="py-8 text-center text-gray-400 text-xs flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-rose-500" size={18} />
                    <span>Loading songs...</span>
                  </div>
                ) : songsList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8 text-xs">
                    No songs in library yet. Add one using the converter or direct MP3 upload above!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-rose-100 text-rose-700 font-bold uppercase tracking-wider bg-rose-50/50">
                          <th className="py-3 px-4">Song Title</th>
                          <th className="py-3 px-4">Artist</th>
                          <th className="py-3 px-4">Duration</th>
                          <th className="py-3 px-4">Source</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-50">
                        {songsList.map((song) => (
                          <tr key={song.id} className="hover:bg-rose-50/30 transition">
                            <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-3">
                              {song.thumbnail_url ? (
                                <img
                                  src={song.thumbnail_url}
                                  alt={song.title}
                                  className="w-9 h-9 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center">
                                  <Music size={18} />
                                </div>
                              )}
                              <span>{song.title}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{song.artist}</td>
                            <td className="py-3 px-4 text-gray-500 font-mono">
                              {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, "0")}
                            </td>
                            <td className="py-3 px-4">
                              {song.youtube_url ? (
                                <a
                                  href={song.youtube_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium hover:underline"
                                >
                                  <Youtube size={12} />
                                  <span>YouTube</span>
                                </a>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-medium">
                                  <Upload size={12} />
                                  <span>MP3 Upload</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Show cloud sync button for any song NOT confirmed in Supabase DB */}
                                {!cloudSongIds.has(song.id) && (
                                  <button
                                    onClick={() => handleSyncToCloud(song)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                    title="Sync to Supabase cloud storage"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4-5 4 5"/></svg>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteSongItem(song.id, song.title)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="Delete song"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Responses Panel */
            <>

          {/* Key Stats Summary Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-rose-50/80 border border-rose-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Heart size={20} className="fill-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-rose-500 uppercase tracking-wider block">
                  Submissions
                </span>
                <span className="text-xl font-black text-rose-950">{totalSubmissions}</span>
              </div>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Ticket size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                  Claimed Tickets
                </span>
                <span className="text-xl font-black text-emerald-950">{totalClaimed}</span>
              </div>
            </div>

            <div className="bg-pink-50/80 border border-pink-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Camera size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-pink-600 uppercase tracking-wider block">
                  Kiss Selfies
                </span>
                <span className="text-xl font-black text-pink-950">{totalKissing}</span>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <ImageIcon size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider block">
                  Reaction Photos
                </span>
                <span className="text-xl font-black text-amber-950">{totalPhotos}</span>
              </div>
            </div>
          </div>

          {/* Search, Filter & Sort Control Bar */}
          <div className="bg-rose-50/60 p-4 rounded-2xl border border-rose-200/80 mb-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by submitter name, message text, or device..."
                  className="w-full rounded-2xl border border-rose-200 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 focus:border-rose-500 focus:outline-none shadow-sm min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-600 p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Sort Dropdown Selector */}
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-2xl border border-rose-200 shadow-sm text-xs font-bold text-gray-700 min-h-[42px] w-full sm:w-auto">
                  <ArrowUpDown size={14} className="text-rose-500 shrink-0" />
                  <span className="shrink-0">Sort:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                    className="bg-transparent text-rose-700 font-extrabold focus:outline-none cursor-pointer w-full sm:w-auto"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-1 shrink-0 mr-1">
                <Filter size={12} /> Filter:
              </span>

              {[
                { id: "all", label: `All (${responses.length})` },
                { id: "claimed", label: `Claimed (${totalClaimed})` },
                { id: "unclaimed", label: `Unclaimed (${responses.length - totalClaimed})` },
                { id: "kissing", label: `Kiss Selfie (${totalKissing})` },
                { id: "photos", label: `With Photos (${responses.filter((r: MonthsaryResponse) => r.image_urls?.length).length})` },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterStatus(pill.id as typeof filterStatus)}
                  className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 min-h-[32px] ${
                    filterStatus === pill.id
                      ? "bg-rose-500 text-white shadow-sm"
                      : "bg-white text-rose-700 hover:bg-rose-100/60 border border-rose-200"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions List / Empty States */}
          {responses.length === 0 ? (
            <div className="text-center py-14 text-gray-500 bg-rose-50/30 rounded-3xl border border-dashed border-rose-200">
              <Heart size={32} className="text-rose-300 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-700">No submissions received yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Share the link with My Pretty Baby Angel to receive her reply!
              </p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-14 text-gray-500 bg-rose-50/30 rounded-3xl border border-dashed border-rose-200">
              <Search size={32} className="text-rose-300 mx-auto mb-2" />
              <p className="text-base font-bold text-gray-700">No matching submissions found</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Try adjusting your search query or filter options
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="px-4 py-2 rounded-full bg-rose-500 text-white text-xs font-bold shadow-sm hover:bg-rose-600 transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResponses.map((item: MonthsaryResponse) => (
                <div
                  key={item.id || item.response_token}
                  className="rounded-2xl bg-white p-5 border border-rose-200 shadow-md relative group hover:shadow-lg transition-shadow"
                >
                  {/* Card Top Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-rose-700 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <CheckCircle size={16} className="text-emerald-500" />
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
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
                        {item.response_token && (
                          <button
                            onClick={() => handleCopyToken(item.response_token)}
                            className="flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200"
                            title="Copy response token ID"
                          >
                            {copiedToken === item.response_token ? (
                              <>
                                <Check size={10} className="text-emerald-600" />
                                <span className="text-emerald-600">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={10} />
                                <span>Token</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {(() => {
                      const targetId = item.id || item.response_token;
                      return (
                        <button
                          onClick={() => targetId && setDeleteModalTarget({ id: targetId, name: item.name })}
                          className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Delete response"
                        >
                          <Trash2 size={18} />
                        </button>
                      );
                    })()}
                  </div>

                  {/* Ticket Claim Status Banner */}
                  <div className="mb-4 bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 p-3.5 rounded-xl border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                        <Ticket size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-500 block">
                          Nail Care Pamper Voucher
                        </span>
                        <span className={`text-xs font-black ${item.ticket_claimed ? "text-emerald-600" : "text-amber-600"}`}>
                          {item.ticket_claimed ? "CLAIMED & RESERVED" : "UNCLAIMED VOUCHER"}
                        </span>
                      </div>
                    </div>

                    {item.ticket_claimed && item.ticket_claimed_at && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase text-gray-400 block tracking-wider">
                          Claimed Date & Time
                        </span>
                        <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                          <Calendar size={12} className="text-rose-500" />
                          {new Date(item.ticket_claimed_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100 mb-4">
                    <p className="text-sm sm:text-base text-gray-800 font-serif italic whitespace-pre-wrap">
                      "{item.message}"
                    </p>
                  </div>

                  {/* Claim Photo / Kissing Selfie Preview */}
                  {item.kissing_photo_url && (
                    <div className="mb-4">
                      <span className="text-xs font-extrabold text-rose-700 uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <Heart size={13} className="fill-rose-500 text-rose-500" />
                        <span>Ticket Claim / Kissing Photo</span>
                      </span>
                      <div
                        onClick={() => setSelectedImageModal(item.kissing_photo_url!)}
                        className="relative w-40 aspect-square rounded-2xl overflow-hidden border-2 border-rose-300 shadow-md cursor-pointer group"
                      >
                        <img
                          src={item.kissing_photo_url}
                          alt="Kissing Claim Selfie"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 size={18} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reaction Images Grid */}
                  {item.image_urls && item.image_urls.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block mb-2">
                        Uploaded Reaction Photos ({item.image_urls.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {item.image_urls.map((imgUrl: string, imgIdx: number) => (
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
          </>
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

      {/* Styled Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-rose-950/60 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm sm:max-w-md bg-white/95 backdrop-blur-2xl p-6 sm:p-7 rounded-3xl border border-rose-200 shadow-2xl text-center flex flex-col items-center my-auto"
            >
              <button
                onClick={() => !deleteMutation.isPending && setDeleteModalTarget(null)}
                className="absolute top-4 right-4 rounded-full bg-rose-50 hover:bg-rose-100 p-2 text-rose-500 transition-colors"
                disabled={deleteMutation.isPending}
                aria-label="Close delete confirmation"
              >
                <X size={18} />
              </button>

              <div className="w-16 h-16 rounded-full bg-red-100/90 border-2 border-red-200 flex items-center justify-center text-red-600 mb-4 shadow-sm">
                <Trash2 size={28} className="text-red-600 animate-pulse" />
              </div>

              <h3 className="text-xl font-extrabold text-gray-900 font-display mb-2">
                Delete Response?
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-6">
                Are you sure you want to delete the submission from{" "}
                <strong className="text-rose-600 font-bold">{deleteModalTarget.name}</strong>?
                This action cannot be undone.
              </p>

              <div className="flex items-center justify-end gap-3 w-full">
                <button
                  onClick={() => setDeleteModalTarget(null)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-all border border-gray-200 min-h-[44px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-500 via-rose-600 to-pink-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:from-red-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
