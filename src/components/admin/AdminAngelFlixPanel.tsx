import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Film,
  Upload,
  Play,
  Trash2,
  Edit2,
  Star,
  RefreshCw,
  Video,
  Image as ImageIcon,
  X,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAngelFlixMedia,
  uploadAngelFlixMedia,
  updateAngelFlixMedia,
  deleteAngelFlixMedia,
  AngelFlixMediaRecord,
} from "../../lib/angelflixApi";
import AngelFlixNativeAdmin from "../../angelflix/pages/Admin";

const CATEGORIES = [
  "Our Videos",
  "Recent Memories",
  "Chapters of Us",
  "Our Favorites",
  "Special Dates",
];

export function AdminAngelFlixPanel() {
  const [studioMode, setStudioMode] = useState<"cloudinary" | "figma">("cloudinary");
  const [mediaList, setMediaList] = useState<AngelFlixMediaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState("Our Videos");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Edit modal state
  const [previewItem, setPreviewItem] = useState<AngelFlixMediaRecord | null>(null);
  const [editingItem, setEditingItem] = useState<AngelFlixMediaRecord | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const list = await fetchAngelFlixMedia();
      setMediaList(list);
    } catch {
      toast.error("Failed to load AngelFlix media.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a video or image file to upload.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please provide a title.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const newMedia = await uploadAngelFlixMedia(
        selectedFile,
        {
          title: title.trim(),
          subtitle: subtitle.trim(),
          category,
          description: description.trim(),
          tags,
          isFavorite,
        },
        (percent) => {
          setUploadProgress(percent);
        }
      );

      toast.success(`"${newMedia.title}" uploaded to Cloudinary successfully!`);
      // Reset form
      setSelectedFile(null);
      setTitle("");
      setSubtitle("");
      setDescription("");
      setTagsInput("");
      setIsFavorite(false);
      if (fileInputRef.current) fileInputRef.current.value = "";

      loadMedia();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload to Cloudinary.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (item: AngelFlixMediaRecord) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;

    try {
      await deleteAngelFlixMedia(item.id);
      toast.success(`"${item.title}" deleted.`);
      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item.");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const updated = await updateAngelFlixMedia(editingItem.id, {
        title: editingItem.title,
        subtitle: editingItem.subtitle,
        category: editingItem.category,
        description: editingItem.description,
        isFavorite: editingItem.isFavorite,
      });
      toast.success("Memory updated successfully.");
      setMediaList((prev) =>
        prev.map((m) => (m.id === updated.id ? updated : m))
      );
      setEditingItem(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update item.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2 text-white font-display">
            <Film size={22} className="text-rose-500" />
            <span>AngelFlix Studio</span>
          </h1>
          <p className="text-xs text-slate-400">
            Upload &amp; manage romantic videos and memories powered by Cloudinary &amp; Figma Studio
          </p>
        </div>

        {/* Studio Sub-tabs */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-2xl border border-slate-800">
          <button
            onClick={() => setStudioMode("cloudinary")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              studioMode === "cloudinary"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Cloudinary Manager
          </button>
          <button
            onClick={() => setStudioMode("figma")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              studioMode === "figma"
                ? "bg-rose-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Figma AngelFlix Studio
          </button>
          {studioMode === "cloudinary" && (
            <button
              onClick={loadMedia}
              disabled={loading}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 flex items-center gap-1 text-xs font-bold"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
          )}
        </div>
      </div>

      {/* Render Figma Native Studio */}
      {studioMode === "figma" && (
        <div className="rounded-3xl overflow-hidden border border-slate-800 bg-[#09090b]">
          <AngelFlixNativeAdmin />
        </div>
      )}

      {/* Render Cloudinary Manager */}
      {studioMode === "cloudinary" && (
        <>
      {/* Upload Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Upload size={18} className="text-rose-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Upload Video or Photo Memory
          </h2>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* File Picker Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-rose-500/60 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-950 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="video/*,image/*"
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
                {selectedFile?.type.startsWith("video/") ? (
                  <Video size={24} />
                ) : selectedFile ? (
                  <ImageIcon size={24} />
                ) : (
                  <Upload size={24} />
                )}
              </div>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to change
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    Drag &amp; drop or click to choose video/photo
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports MP4, MOV, WebM videos, and JPG/PNG photos (Cloudinary auto-optimized)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sunset Road Trip with Angel"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Singing along to our favorite songs"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Romance, RoadTrip, Laughter"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Description / Love Story Note
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a sweet note about this video memory..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors resize-none"
            />
          </div>

          {/* Favorite switch */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fav-check"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              className="rounded border-slate-700 text-rose-500 focus:ring-rose-400 bg-slate-950 h-4 w-4"
            />
            <label htmlFor="fav-check" className="text-xs font-bold text-slate-300 cursor-pointer flex items-center gap-1">
              <Star size={13} className={isFavorite ? "fill-amber-400 text-amber-400" : "text-slate-400"} />
              Mark as Favorite (Shows in "Our Favorites")
            </label>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-bold text-rose-400">
                <span>Uploading to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-sm transition-all shadow-lg hover:shadow-rose-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Uploading to Cloudinary...</span>
              </>
            ) : (
              <>
                <Upload size={16} />
                <span>Upload Memory</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Media Library */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2 font-display">
            <span>Media Library</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-sans">
              {mediaList.length} Items
            </span>
          </h2>
        </div>

        {mediaList.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
            <Film size={40} className="mx-auto mb-2 text-slate-600" />
            <p className="font-bold text-sm">No AngelFlix videos uploaded yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload your first video clip or romantic memory above!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mediaList.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col group"
              >
                {/* Video / Photo Poster */}
                <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

                  {/* Play Button Trigger */}
                  <button
                    onClick={() => setPreviewItem(item)}
                    className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:scale-110 hover:bg-rose-600 transition-all shadow-md"
                    aria-label="Preview video"
                  >
                    <Play size={16} className="fill-white translate-x-0.5" />
                  </button>

                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-rose-300 border border-rose-500/30">
                      {item.category}
                    </span>
                    {item.duration && (
                      <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-bold text-slate-300 flex items-center gap-1">
                        <Clock size={10} />
                        {item.duration}s
                      </span>
                    )}
                  </div>

                  {item.isFavorite && (
                    <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 backdrop-blur-md text-amber-400">
                      <Star size={12} className="fill-amber-400" />
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-sm truncate">
                      {item.title}
                    </h3>
                    {item.subtitle && (
                      <p className="text-xs text-rose-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">{item.date}</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                        title="Edit metadata"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/60 text-slate-300 hover:text-red-300 transition-all"
                        title="Delete memory"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 relative text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold font-display">{previewItem.title}</h3>
                  <p className="text-xs text-rose-400">{previewItem.category}</p>
                </div>
                <button
                  onClick={() => setPreviewItem(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Video or Image Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-black max-h-[60vh] flex items-center justify-center">
                {previewItem.videoUrl ? (
                  <video
                    src={previewItem.videoUrl}
                    controls
                    autoPlay
                    poster={previewItem.imageUrl}
                    className="w-full max-h-[55vh] object-contain"
                  />
                ) : (
                  <img
                    src={previewItem.imageUrl}
                    alt={previewItem.title}
                    className="w-full max-h-[55vh] object-contain"
                  />
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {previewItem.description}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 relative text-white"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold font-display">Edit Memory</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingItem.title}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, title: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editingItem.subtitle || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, subtitle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, category: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                  <textarea
                    value={editingItem.description || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, description: e.target.value })
                    }
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-fav"
                    checked={Boolean(editingItem.isFavorite)}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, isFavorite: e.target.checked })
                    }
                    className="rounded border-slate-700 text-rose-500 bg-slate-950 h-4 w-4"
                  />
                  <label htmlFor="edit-fav" className="text-xs font-bold text-slate-300">
                    Favorite
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}
    </div>
  );
}
