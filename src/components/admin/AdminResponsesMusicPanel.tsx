import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Howl } from "howler";
import { toast } from "sonner";
import {
  Trash2,
  CheckCircle,
  Play,
  Pause,
  Pencil,
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
  Cloud,
  CloudOff,
} from "lucide-react";
import {
  getAdminResponses,
  deleteAdminResponse,
  MonthsaryResponse,
  Song,
  fetchSongs,
  deleteSong,
  notifySongsChanged,
  updateSong,
  uploadMusicFile,
  validateMusicFile,
  MAX_MUSIC_FILE_SIZE_BYTES,
} from "../../lib/supabase";
import { isAdmin } from "../../lib/auth";

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

  // Direct cloud upload
  const [directFile, setDirectFile] = useState<File | null>(null);
  const [directTitle, setDirectTitle] = useState("");
  const [directArtist, setDirectArtist] = useState("");
  const [directPermission, setDirectPermission] = useState(false);
  const [isUploadingMp3, setIsUploadingMp3] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");

  // Playback and editing state
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const [previewHowl, setPreviewHowl] = useState<Howl | null>(null);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editArtist, setEditArtist] = useState("");
  const [canManageMusic, setCanManageMusic] = useState(false);
  const [syncingSongId, setSyncingSongId] = useState<string | null>(null);
  const uploadSectionRef = useRef<HTMLDivElement | null>(null);

  const [songsList, setSongsList] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  useEffect(() => {
    if (!canManageMusic) {
      return;
    }

    let active = true;
    setIsLoadingSongs(true);
    fetchSongs()
      .then((songs) => {
        if (!active) return;
        setSongsList(songs);
        if (editingSong) {
          const refreshed = songs.find((song) => song.id === editingSong.id);
          if (refreshed) {
            setEditingSong(refreshed);
            setEditTitle(refreshed.title);
            setEditArtist(refreshed.artist);
          }
        }
      })
      .finally(() => {
        if (active) setIsLoadingSongs(false);
      });

    const refreshFromEvent = () => {
      fetchSongs().then((songs) => {
        if (!active) return;
        setSongsList(songs);
        onSongsChange?.(songs);
      });
    };

    window.addEventListener("monthsary:songs-changed", refreshFromEvent);
    return () => {
      active = false;
      window.removeEventListener("monthsary:songs-changed", refreshFromEvent);
    };
  }, [activeTab, canManageMusic, editingSong, onSongsChange]);

  useEffect(() => {
    let active = true;
    isAdmin().then((admin) => {
      if (active) setCanManageMusic(admin);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      previewHowl?.unload();
    };
  }, [previewHowl]);

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
              notifySongsChanged();
              return updated;
            });
          } else {
            fetchSongs().then((updated) => {
              setSongsList(updated);
              onSongsChange?.(updated);
              notifySongsChanged();
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
      toast.error("Please select an audio file to upload.");
      return;
    }
    if (!directPermission) {
      toast.error("You must confirm you have permission to use this audio file.");
      return;
    }

    const fileError = validateMusicFile(directFile);
    if (fileError) {
      toast.error(fileError);
      return;
    }

    setIsUploadingMp3(true);
    setUploadProgress(0);
    setUploadMessage("Preparing upload...");
    try {
      const uploadedSong = await uploadMusicFile(
        directFile,
        { title: directTitle, artist: directArtist },
        (progress) => {
          setUploadProgress(progress);
          setUploadMessage(progress < 100 ? `Uploading to cloud storage (${progress}%)...` : "Saving song record...");
        }
      );
      toast.success(`"${uploadedSong.title}" uploaded to the library.`);
      setSongsList((prev) => {
        const updated = [uploadedSong, ...prev.filter((song) => song.id !== uploadedSong.id)];
        onSongsChange?.(updated);
        notifySongsChanged();
        return updated;
      });
      setDirectFile(null);
      setDirectTitle("");
      setDirectArtist("");
      setDirectPermission(false);
      setUploadMessage("Upload complete.");
    } catch (err: unknown) {
      console.error("Direct upload error:", err);
      const message = err instanceof Error ? err.message : "Failed uploading audio file.";
      toast.error(message);
      setUploadMessage(message || "Upload failed.");
    } finally {
      setIsUploadingMp3(false);
      window.setTimeout(() => setUploadProgress(0), 1200);
    }
  };

  const handlePreviewSong = (song: Song) => {
    if (previewingSongId === song.id && previewHowl) {
      previewHowl.pause();
      setPreviewingSongId(null);
      return;
    }

    previewHowl?.unload();
    const source = song.cloud_file_url || song.mp3_url;
    const sound = new Howl({
      src: [source],
      html5: true,
      volume: 0.75,
      onend: () => setPreviewingSongId(null),
    });

    sound.play();
    setPreviewHowl(sound);
    setPreviewingSongId(song.id);
  };

  const handleOpenEditSong = (song: Song) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
  };

  const isCloudBackedSong = (song: Song) =>
    Boolean(
      song.cloud_file_url ||
        song.storage_path ||
        song.mp3_url.includes("/storage/v1/object/public/songs/")
    );

  const handleSyncSongToCloud = async (song: Song) => {
    if (!canManageMusic || isCloudBackedSong(song) || syncingSongId) return;

    setSyncingSongId(song.id);
    setUploadProgress(0);
    setUploadMessage(`Preparing "${song.title}" for cloud upload...`);

    try {
      const sourceUrl = song.mp3_url || song.cloud_file_url;
      if (!sourceUrl) {
        throw new Error("This song does not have a source audio URL to upload.");
      }
      const response = await fetch(sourceUrl);
      if (!response.ok) {
        throw new Error("Could not fetch the song audio from its current source.");
      }

      const blob = await response.blob();
      const guessedType = blob.type || song.mime_type || "audio/mpeg";
      const inferredExtension =
        guessedType.includes("wav") ? "wav" : guessedType.includes("mp4") || guessedType.includes("aac") ? "m4a" : "mp3";
      const sanitizedTitle = song.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "song";
      const fileName = song.file_name || `${sanitizedTitle}.${inferredExtension}`;
      const file = new File([blob], fileName, { type: guessedType });

      const uploadedSong = await uploadMusicFile(
        file,
        { title: song.title, artist: song.artist, existingId: song.id },
        (progress) => {
          setUploadProgress(progress);
          setUploadMessage(progress < 100 ? `Uploading "${song.title}" (${progress}%)...` : "Saving song record...");
        }
      );

      setSongsList((prev) => {
        const updated = prev.map((current) => (current.id === uploadedSong.id ? uploadedSong : current));
        onSongsChange?.(updated);
        return updated;
      });
      notifySongsChanged();
      toast.success(`"${song.title}" uploaded to cloud storage.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed uploading song to cloud.";
      toast.error(message);
      setUploadMessage(message);
    } finally {
      setSyncingSongId(null);
      window.setTimeout(() => setUploadProgress(0), 1200);
    }
  };

  const handleOpenUploadMusic = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSaveSongEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong) return;

    try {
      const updatedSong = await updateSong(editingSong.id, {
        title: editTitle,
        artist: editArtist,
      });
      setSongsList((prev) => {
        const updated = prev.map((song) => (song.id === updatedSong.id ? updatedSong : song));
        onSongsChange?.(updated);
        return updated;
      });
      notifySongsChanged();
      toast.success(`Updated "${updatedSong.title}".`);
      setEditingSong(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed updating song.");
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
      notifySongsChanged();
      toast.success(`Deleted "${title}"`);
    } catch {
      toast.error("Failed deleting song.");
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
                : fetchSongs().then((songs) => {
                    setSongsList(songs);
                    onSongsChange?.(songs);
                  })
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
            <div ref={uploadSectionRef} className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/60 flex flex-col justify-between h-full">
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

            {/* Cloud audio upload */}
            <div className="bg-slate-800/40 p-6 rounded-3xl border border-slate-700/60 flex flex-col justify-between h-full">
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1.5">
                    <Upload className="text-indigo-400 shrink-0" size={20} />
                    <span>Upload Music to Cloud</span>
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">
                    Upload MP3, WAV, or M4A files directly to Supabase Storage. Max {Math.round(MAX_MUSIC_FILE_SIZE_BYTES / (1024 * 1024))}MB.
                  </p>
                </div>
                <form onSubmit={handleDirectUpload} className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Select Audio File
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          id="admin-music-input"
                          accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/aac"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && validateMusicFile(file)) {
                              toast.error(validateMusicFile(file) || "Invalid audio file.");
                              e.target.value = "";
                              setDirectFile(null);
                              return;
                            }
                            setDirectFile(file);
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor="admin-music-input"
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl border border-dashed border-slate-600 bg-slate-900/40 hover:bg-slate-800 cursor-pointer text-xs h-[42px]"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <Music size={15} className="text-indigo-400 shrink-0" />
                            <span className="truncate text-slate-300 text-xs">
                              {directFile ? directFile.name : "Click to select audio file"}
                            </span>
                          </div>
                          <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-indigo-300 rounded-lg font-bold text-[11px] shrink-0">
                            {directFile ? `${(directFile.size / (1024 * 1024)).toFixed(2)} MB` : "Browse"}
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
                  <div className="space-y-3">
                    {(isUploadingMp3 || uploadMessage) && (
                      <div className="space-y-2 rounded-2xl border border-slate-700 bg-slate-900/60 p-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>{uploadMessage || "Uploading..."}</span>
                          <span className="font-mono text-indigo-300">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={!directFile || !directPermission || isUploadingMp3 || !canManageMusic}
                      className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
                    >
                      {isUploadingMp3 ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          <span>Uploading to Cloud...</span>
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Upload Music</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Song library */}
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/60 p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Music className="text-indigo-400 shrink-0" size={20} />
                <span>Available Music Library ({songsList.length})</span>
              </h3>
              {canManageMusic && (
                <button
                  type="button"
                  onClick={handleOpenUploadMusic}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                >
                  <Upload size={15} />
                  Upload Music
                </button>
              )}
            </div>
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
                      <th className="py-3 px-4">File</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {songsList.map((song) => (
                      <tr key={song.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-100">
                          <div className="flex items-center gap-3">
                            {song.thumbnail_url ? (
                              <img src={song.thumbnail_url} alt={song.title} className="w-9 h-9 rounded-lg object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-700 text-indigo-300 flex items-center justify-center">
                                <Music size={18} />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate">{song.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {song.file_name || song.storage_path || song.mp3_url}
                              </p>
                              {isCloudBackedSong(song) ? (
                                <span
                                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30"
                                  title="This song is stored in Supabase cloud storage and available to all devices."
                                >
                                  <Cloud size={10} /> Uploaded to cloud
                                </span>
                              ) : (
                                <span
                                  className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30"
                                  title="This song is only available on this device. Upload it to cloud to make it available everywhere."
                                >
                                  <CloudOff size={10} /> Local only — not uploaded
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{song.artist}</td>
                        <td className="py-3 px-4 text-slate-400">
                          <div className="flex flex-col gap-1">
                            <span className="text-slate-200 text-[11px] font-semibold">
                              {song.file_name || "-"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {song.mime_type || (song.youtube_url ? "YouTube" : "Cloud audio")}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {song.file_size_bytes ? `${(song.file_size_bytes / (1024 * 1024)).toFixed(2)} MB` : "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {Math.floor((song.audio_duration_seconds ?? song.duration) / 60)}:{String((song.audio_duration_seconds ?? song.duration) % 60).padStart(2, "0")}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {song.upload_date || song.created_at ? new Date(song.upload_date || song.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handlePreviewSong(song)}
                              className="p-2 text-emerald-400 hover:bg-slate-800 rounded-lg"
                              title={previewingSongId === song.id ? "Pause preview" : "Play preview"}
                            >
                              {previewingSongId === song.id ? <Pause size={16} /> : <Play size={16} />}
                            </button>
                            {canManageMusic && (
                              <button
                                onClick={() => handleSyncSongToCloud(song)}
                                className={`flex items-center gap-1 rounded-lg px-2.5 py-2 transition-colors ${
                                  isCloudBackedSong(song) || syncingSongId === song.id
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                    : "bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
                                }`}
                                title={
                                  isCloudBackedSong(song)
                                    ? "Already uploaded to cloud"
                                    : syncingSongId === song.id
                                    ? "Uploading to cloud..."
                                    : "Upload this song to cloud"
                                }
                                disabled={isCloudBackedSong(song) || syncingSongId === song.id}
                              >
                                <Upload size={15} />
                                <span className="hidden xl:inline text-[11px] font-bold">
                                  {isCloudBackedSong(song) ? "Cloud" : syncingSongId === song.id ? "Uploading" : "Upload to Cloud"}
                                </span>
                              </button>
                            )}
                            {canManageMusic && (
                              <button
                                onClick={() => handleOpenEditSong(song)}
                                className="p-2 text-sky-400 hover:bg-slate-800 rounded-lg"
                                title="Edit song"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSongItem(song.id, song.title)}
                              className="p-2 text-red-400 hover:bg-slate-800 rounded-lg disabled:opacity-40"
                              title="Delete song"
                              disabled={!canManageMusic}
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
          <AnimatePresence>
            {editingSong && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                <motion.div
                  initial={{ scale: 0.96, y: 12 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.96, y: 12 }}
                  className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-100">Edit Song Details</h3>
                      <p className="text-xs text-slate-400">Update the song title and artist name.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSong(null)}
                      className="rounded-full border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveSongEdit} className="space-y-4">
                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Song Title
                      </label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="Song title"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Artist Name
                      </label>
                      <input
                        value={editArtist}
                        onChange={(e) => setEditArtist(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/70 px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        placeholder="Artist name"
                      />
                    </div>

                    <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 text-xs text-slate-400">
                      <p className="font-semibold text-slate-200">File name</p>
                      <p className="mt-1 break-all">{editingSong.file_name || editingSong.storage_path || editingSong.mp3_url}</p>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingSong(null)}
                        className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
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