import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Trash2,
  CheckCircle,
  RefreshCw,
  Smartphone,
  Clock,
  X,
  Maximize2,
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
  Song,
  fetchSongs,
  deleteSong,
} from "../../lib/supabase";

interface AdminResponsesMusicPanelProps {
  onSongsChange?: (songs: Song[]) => void;
}

/**
 * Preserved existing admin content (Angel Responses + Music Manager), moved out of
 * the old in-panel login shell. Auth + role gating now handled by /admin routes.
 */
export function AdminResponsesMusicPanel({ onSongsChange }: AdminResponsesMusicPanelProps) {
  const queryClient = useQueryClient();
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [deleteModalTarget, setDeleteModalTarget] = useState<{ id: string; name: string } | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "claimed" | "unclaimed" | "kissing" | "photos"
  >("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"responses" | "music">("responses");

  // YouTube converter
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubePermission, setYoutubePermission] = useState(false);
  const [conversionState, setConversionState] = useState<
    "idle" | "Checking link" | "Downloading authorized audio" | "Converting to MP3" | "Uploading" | "Completed" | "Failed"
  >("idle");
  const [conversionMessage, setConversionMessage] = useState("");

  // Direct MP3 upload
  const [directFile, setDirectFile] = useState<File | null>(null);
  const [directTitle, setDirectTitle] = useState("");
  const [directArtist, setDirectArtist] = useState("");
  const [directPermission, setDirectPermission] = useState(false);
  const [isUploadingMp3, setIsUploadingMp3] = useState(false);

  const [songsList, setSongsList] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);
  const [cloudSongIds, setCloudSongIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsLoadingSongs(true);
    fetchSongs()
      .then((songs) => {
        setSongsList(songs);
        setCloudSongIds(new Set(songs.map((s) => s.id)));
      })
      .finally(() => setIsLoadingSongs(false));
  }, [activeTab]);

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
            fetchSongs().then((updated) => {
              setSongsList(updated);
              onSongsChange?.(updated);
            });
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
    eventSource.onerror = () => {
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
      const res = await fetch("/api/music/upload", { method: "POST", body: formData });
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
        fetchSongs().then((updated) => {
          setSongsList(updated);
          onSongsChange?.(updated);
        });
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
    } catch {
      toast.error("Failed deleting song.");
    }
  };

  const handleSyncToCloud = async (song: Song) => {
    try {
      toast.info(`Uploading "${song.title}" to Supabase...`);
      let blob: Blob;
      if (song.mp3_url.startsWith("data:")) {
        const response = await fetch(song.mp3_url);
        blob = await response.blob();
      } else {
        const response = await fetch(song.mp3_url);
        if (!response.ok) throw new Error("Could not fetch audio file — it may not be in storage yet.");
        blob = await response.blob();
      }
      const fileName = `${song.title.replace(/[^a-z0-9]/gi, "_")}.mp3`;
      const file = new File([blob], fileName, { type: "audio/mpeg" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", song.title);
      formData.append("artist", song.artist);
      formData.append("existingId", song.id);
      const res = await fetch("/api/music/upload", { method: "POST", body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Upload failed");
      setSongsList((prev) => {
        const updated = prev.map((s) => (s.id === song.id ? result.song || s : s));
        onSongsChange?.(updated);
        return updated;
      });
      setCloudSongIds((prev) => new Set([...prev, result.song?.id || song.id]));
      toast.success(`"${song.title}" is now saved to cloud!`);
    } catch (err: any) {
      toast.error(err.message || "Failed syncing to cloud.");
    }
  };

  const handleCopyToken = (token: string) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const { data: responses = [], isLoading, refetch: fetchResponses } = useQuery<MonthsaryResponse[]>({
    queryKey: ["adminResponses"],
    queryFn: getAdminResponses,
  });

  const totalSubmissions = responses.length;
  const totalClaimed = responses.filter((r: MonthsaryResponse) => r.ticket_claimed).length;
  const totalKissing = responses.filter((r: MonthsaryResponse) => r.kissing_photo_url).length;
  const totalPhotos = responses.reduce(
    (acc: number, r: MonthsaryResponse) => acc + (r.image_urls?.length || 0),
    0
  );

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

  const deleteMutation = useMutation({
    mutationFn: (idToDelete: string) => deleteAdminResponse(idToDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminResponses"] });
      toast.success("Response deleted successfully");
      setDeleteModalTarget(null);
    },
    onError: () => toast.error("Failed to delete response"),
  });

  const handleConfirmDelete = () => {
    if (!deleteModalTarget) return;
    deleteMutation.mutate(deleteModalTarget.id);
  };

  return (
    <div className="w-full text-left">
      {/* Sub-header per tab */}
      <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-5">
        <div>
          {activeTab === "responses" ? (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Angel's Received Responses</span>
                <Heart size={18} className="fill-rose-400 text-rose-400 shrink-0" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">Submissions overview &amp; pamper ticket management</p>
            </>
          ) : (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Music Library &amp; Converter</span>
                <Music size={18} className="text-indigo-400 shrink-0" />
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Convert YouTube audio &amp; upload authorized MP3 tracks to your playlist
              </p>
            </>
          )}
        </div>
        <button
          onClick={() =>
            activeTab === "responses"
              ? fetchResponses()
              : fetchSongs().then(setSongsList)
          }
          className="p-2.5 rounded-full bg-slate-800 text-indigo-300 hover:bg-slate-700 border border-slate-700 min-h-[40px] min-w-[40px] flex items-center justify-center"
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoading || isLoadingSongs ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Sub-tab nav */}
      <div className="flex items-center gap-2 mb-6 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/60">
        <button
          onClick={() => setActiveTab("responses")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "responses"
              ? "bg-slate-900 text-indigo-300 shadow border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Heart size={15} />
          <span>Responses ({responses.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("music")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === "music"
              ? "bg-slate-900 text-indigo-300 shadow border border-slate-700"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Music size={15} />
          <span>Music ({songsList.length})</span>
        </button>
      </div>

      {activeTab === "music" ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* YouTube converter */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/60 flex flex-col justify-between h-full">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1.5">
                    <Youtube className="text-red-400 shrink-0" size={20} />
                    <span>YouTube to MP3 Converter</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Extract authorized YouTube audio, convert to MP3, and save to Supabase Storage.
                  </p>
                </div>
                <form onSubmit={handleStartConversion} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        YouTube Video URL
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 h-[42px]"
                        disabled={
                          conversionState !== "idle" &&
                          conversionState !== "Completed" &&
                          conversionState !== "Failed"
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Auto Metadata Extraction
                      </label>
                      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700 text-[11px] text-slate-300 h-[42px]">
                        <Sparkles size={16} className="text-indigo-400 shrink-0" />
                        <span className="truncate">Title, artist, duration &amp; artwork auto-fetched</span>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900/40 p-3 rounded-xl border border-slate-700 min-h-[54px]">
                      <input
                        type="checkbox"
                        checked={youtubePermission}
                        onChange={(e) => setYoutubePermission(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800 text-indigo-500"
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
                      (conversionState !== "idle" &&
                        conversionState !== "Completed" &&
                        conversionState !== "Failed")
                    }
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-sky-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                  >
                    {conversionState !== "idle" &&
                    conversionState !== "Completed" &&
                    conversionState !== "Failed" ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Youtube size={16} />
                        <span>Convert &amp; Save to Library</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {conversionState !== "idle" && (
                <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-700 space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Conversion Progress</span>
                    <span className="text-[10px] text-indigo-400 font-mono">{conversionState}</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {[
                      "Checking link",
                      "Downloading authorized audio",
                      "Converting to MP3",
                      "Uploading",
                      "Completed",
                    ].map((step, idx) => {
                      const order = [
                        "Checking link",
                        "Downloading authorized audio",
                        "Converting to MP3",
                        "Uploading",
                        "Completed",
                      ];
                      const currentIdx = order.indexOf(conversionState);
                      const isDone = currentIdx > idx || conversionState === "Completed";
                      const isCurrent = conversionState === step;
                      const isFailed = conversionState === "Failed";
                      return (
                        <div key={step} className="flex items-center gap-2">
                          {isDone ? (
                            <CheckCircle2 size={16} className="text-emerald-400" />
                          ) : isCurrent ? (
                            <Loader2 size={16} className="text-indigo-400 animate-spin" />
                          ) : isFailed && idx === currentIdx ? (
                            <AlertCircle size={16} className="text-red-400" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[9px] text-slate-500">
                              {idx + 1}
                            </div>
                          )}
                          <span
                            className={`text-xs ${
                              isDone
                                ? "text-emerald-300 line-through opacity-80"
                                : isCurrent
                                ? "text-indigo-300 font-bold"
                                : "text-slate-500"
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-700 font-mono">
                    {conversionMessage}
                  </p>
                </div>
              )}
            </div>

            {/* Direct MP3 upload */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/60 flex flex-col justify-between h-full">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1.5">
                    <Upload className="text-indigo-400 shrink-0" size={20} />
                    <span>Direct MP3 Upload</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">Upload an authorized MP3 file directly (Max 15MB).</p>
                </div>
                <form onSubmit={handleDirectUpload} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
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
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 hover:bg-slate-800 cursor-pointer text-xs h-[42px]"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Music size={15} className="text-indigo-400 shrink-0" />
                            <span className="truncate text-slate-300 text-xs">
                              {directFile ? directFile.name : "Click to select MP3 file"}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-indigo-300 rounded-lg font-bold text-[11px] shrink-0">
                            {directFile ? `${(directFile.size / (1024 * 1024)).toFixed(2)} MB` : "Browse MP3"}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Song Title
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Golden Hour"
                          value={directTitle}
                          onChange={(e) => setDirectTitle(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 h-[42px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Artist Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. JVKE"
                          value={directArtist}
                          onChange={(e) => setDirectArtist(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 h-[42px]"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900/40 p-3 rounded-xl border border-slate-700 min-h-[54px]">
                      <input
                        type="checkbox"
                        checked={directPermission}
                        onChange={(e) => setDirectPermission(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-800 text-indigo-500"
                      />
                      <span className="text-[11px] leading-tight">
                        I confirm that I own this audio file or have permission to upload and use it.
                      </span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={!directFile || !directPermission || isUploadingMp3}
                    className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
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

          {/* Song library */}
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/60 p-6">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Music className="text-indigo-400 shrink-0" size={20} />
              <span>Available Music Library ({songsList.length})</span>
            </h3>
            {isLoadingSongs ? (
              <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="animate-spin text-indigo-400" size={18} /> Loading songs...
              </div>
            ) : songsList.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs">
                No songs in library yet. Add one using the converter or direct MP3 upload above!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Song Title</th>
                      <th className="py-3 px-4">Artist</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {songsList.map((song) => (
                      <tr key={song.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-100 flex items-center gap-3">
                          {song.thumbnail_url ? (
                            <img src={song.thumbnail_url} alt={song.title} className="w-9 h-9 rounded-lg object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-700 text-indigo-300 flex items-center justify-center">
                              <Music size={18} />
                            </div>
                          )}
                          <span>{song.title}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{song.artist}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, "0")}
                        </td>
                        <td className="py-3 px-4">
                          {song.youtube_url ? (
                            <a
                              href={song.youtube_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/15 text-red-300 border border-red-500/30 font-medium hover:underline"
                            >
                              <Youtube size={12} /> YouTube
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-medium">
                              <Upload size={12} /> MP3 Upload
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!cloudSongIds.has(song.id) && (
                              <button
                                onClick={() => handleSyncToCloud(song)}
                                className="p-2 text-sky-400 hover:bg-slate-800 rounded-lg"
                                title="Sync to Supabase cloud storage"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                                  <path d="M12 12v9" />
                                  <path d="m8 17 4-5 4 5" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSongItem(song.id, song.title)}
                              className="p-2 text-red-400 hover:bg-slate-800 rounded-lg"
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
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <Heart size={20} className="fill-white" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-rose-300 uppercase tracking-wider block">Submissions</span>
                <span className="text-xl font-black text-slate-100">{totalSubmissions}</span>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <Ticket size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">Claimed Tickets</span>
                <span className="text-xl font-black text-slate-100">{totalClaimed}</span>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0">
                <Camera size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-pink-300 uppercase tracking-wider block">Kiss Selfies</span>
                <span className="text-xl font-black text-slate-100">{totalKissing}</span>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <ImageIcon size={20} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-300 uppercase tracking-wider block">Reaction Photos</span>
                <span className="text-xl font-black text-slate-100">{totalPhotos}</span>
              </div>
            </div>
          </div>

          {/* Search/filter */}
          <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60 mb-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by submitter name, message text, or device..."
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 pl-10 pr-10 py-2.5 text-xs text-slate-200 focus:outline-none min-h-[42px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-2 rounded-2xl border border-slate-700 text-xs font-bold text-slate-300 min-h-[42px]">
                  <ArrowUpDown size={14} className="text-indigo-400 shrink-0" />
                  <span>Sort:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
                    className="bg-transparent text-indigo-300 font-extrabold focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0 mr-1">
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
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-700"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-14 text-slate-400 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
              <Heart size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-300">No submissions received yet</p>
              <p className="text-xs text-slate-500 mt-1">Share the link with Angel to receive her reply!</p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="text-center py-14 text-slate-400 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
              <Search size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-300">No matching submissions found</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="mt-4 px-4 py-2 rounded-full bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResponses.map((item: MonthsaryResponse) => (
                <div
                  key={item.id || item.response_token}
                  className="rounded-2xl bg-slate-800/40 p-5 border border-slate-700/60 relative group hover:border-slate-600"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <CheckCircle size={16} className="text-emerald-400" />
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
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
                            className="flex items-center gap-1 text-[10px] font-mono font-bold bg-slate-900/60 text-indigo-300 hover:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700"
                            title="Copy response token ID"
                          >
                            {copiedToken === item.response_token ? (
                              <>
                                <Check size={10} className="text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
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
                          className="p-2 rounded-full text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Delete response"
                        >
                          <Trash2 size={18} />
                        </button>
                      );
                    })()}
                  </div>

                  <div className="mb-4 bg-gradient-to-r from-slate-900 to-slate-800/60 p-3.5 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Ticket size={16} />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                          Nail Care Pamper Voucher
                        </span>
                        <span className={`text-xs font-black ${item.ticket_claimed ? "text-emerald-400" : "text-amber-400"}`}>
                          {item.ticket_claimed ? "CLAIMED & RESERVED" : "UNCLAIMED VOUCHER"}
                        </span>
                      </div>
                    </div>
                    {item.ticket_claimed && item.ticket_claimed_at && (
                      <div className="text-right">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block tracking-wider">Claimed Date &amp; Time</span>
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <Calendar size={12} className="text-indigo-400" />
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

                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-700 mb-4">
                    <p className="text-sm sm:text-base text-slate-200 italic whitespace-pre-wrap">"{item.message}"</p>
                  </div>

                  {item.kissing_photo_url && (
                    <div className="mb-4">
                      <span className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1">
                        <Heart size={13} className="fill-rose-400 text-rose-400" />
                        <span>Ticket Claim / Kissing Photo</span>
                      </span>
                      <div
                        onClick={() => setSelectedImageModal(item.kissing_photo_url!)}
                        className="relative w-40 aspect-square rounded-2xl overflow-hidden border-2 border-slate-600 cursor-pointer group"
                      >
                        <img src={item.kissing_photo_url} alt="Kissing Claim Selfie" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 size={18} />
                        </div>
                      </div>
                    </div>
                  )}

                  {item.image_urls && item.image_urls.length > 0 && (
                    <div>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                        Uploaded Reaction Photos ({item.image_urls.length})
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {item.image_urls.map((imgUrl: string, imgIdx: number) => (
                          <div
                            key={imgIdx}
                            onClick={() => setSelectedImageModal(imgUrl)}
                            className="aspect-square rounded-xl overflow-hidden border border-slate-700 relative group cursor-pointer"
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

      {/* Image lightbox */}
      <AnimatePresence>
        {selectedImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImageModal(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          >
            <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl p-4 flex flex-col items-center">
              <button
                onClick={() => setSelectedImageModal(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-800 p-2 text-slate-300"
              >
                <X size={20} />
              </button>
              <img src={selectedImageModal} alt="Expanded" className="max-h-[75vh] w-auto object-contain rounded-2xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModalTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="relative w-full max-w-md bg-slate-900 border border-slate-700 p-6 sm:p-7 rounded-3xl shadow-2xl text-center text-slate-100"
            >
              <button
                onClick={() => !deleteMutation.isPending && setDeleteModalTarget(null)}
                className="absolute top-4 right-4 rounded-full bg-slate-800 p-2 text-slate-400"
                disabled={deleteMutation.isPending}
              >
                <X size={18} />
              </button>
              <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center text-red-400 mb-4 mx-auto">
                <Trash2 size={28} className="animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold mb-2">Delete Response?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">
                Are you sure you want to delete the submission from{" "}
                <strong className="text-slate-100">{deleteModalTarget.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end gap-3 w-full">
                <button
                  onClick={() => setDeleteModalTarget(null)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 min-h-[44px] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm min-h-[44px] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}