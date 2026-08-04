import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Music, Play, Pause, Check, X, Disc3 } from "lucide-react";
import { Song } from "../lib/supabase";
import { Howl } from "howler";

interface MusicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  selectedSongId: string | null;
  onSelectSong: (song: Song) => void;
}

export function MusicSelectorModal({
  isOpen,
  onClose,
  songs,
  selectedSongId,
  onSelectSong,
}: MusicSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const [previewHowl, setPreviewHowl] = useState<Howl | null>(null);

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePreview = (song: Song) => {
    if (previewingSongId === song.id && previewHowl) {
      previewHowl.unload();
      setPreviewingSongId(null);
      setPreviewHowl(null);
      return;
    }

    if (previewHowl) {
      previewHowl.unload();
    }

    const sound = new Howl({
      src: [song.mp3_url],
      html5: true,
      volume: 0.7,
      onend: () => {
        setPreviewingSongId(null);
        sound.unload();
      },
    });
    sound.play();
    setPreviewHowl(sound);
    setPreviewingSongId(song.id);
  };

  const handleClose = () => {
    if (previewHowl) {
      previewHowl.unload();
      setPreviewHowl(null);
      setPreviewingSongId(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[85vh]"
        >
          {/* Modal Header */}
          <div className="p-5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-md">
                <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold font-display">Select Background Music</h2>
                <p className="text-xs text-rose-100">Pick your favorite romantic soundtrack</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="p-4 bg-rose-50/50 border-b border-rose-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input
                type="text"
                placeholder="Search by song title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 transition"
              />
            </div>
          </div>

          {/* Song Card List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {filteredSongs.length === 0 ? (
              <div className="text-center py-10">
                <Music className="w-10 h-10 text-rose-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-600">No songs found</p>
                <p className="text-xs text-gray-400 mt-1">Try searching with a different song title or artist name.</p>
              </div>
            ) : (
              filteredSongs.map((song) => {
                const isSelected = selectedSongId === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-rose-50/90 border-rose-400 ring-2 ring-rose-400/30 shadow-md"
                        : "bg-white border-gray-100 hover:border-rose-200 hover:bg-rose-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      {song.thumbnail_url ? (
                        <img
                          src={song.thumbnail_url}
                          alt={song.title}
                          className="w-12 h-12 rounded-xl object-cover shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 truncate text-sm flex items-center gap-2">
                          <span>{song.title}</span>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-[10px] font-extrabold text-white uppercase tracking-wider">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Preview Button */}
                      <button
                        onClick={() => handleTogglePreview(song)}
                        className={`p-2.5 rounded-full border transition-all ${
                          previewingSongId === song.id
                            ? "bg-rose-500 text-white border-rose-500 shadow-md"
                            : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-rose-100 hover:text-rose-600"
                        }`}
                        title={previewingSongId === song.id ? "Pause preview" : "Preview song snippet"}
                      >
                        {previewingSongId === song.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      {/* Select Button */}
                      <button
                        onClick={() => {
                          if (previewHowl) previewHowl.stop();
                          onSelectSong(song);
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                          isSelected
                            ? "bg-rose-600 text-white shadow-rose-200"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4" /> Selected
                          </>
                        ) : (
                          "Select"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
