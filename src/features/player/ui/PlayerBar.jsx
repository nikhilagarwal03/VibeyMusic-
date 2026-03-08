import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	Download,
	Heart,
	ListPlus,
	Pause,
	Play,
	Repeat,
	Repeat1,
	SkipBack,
	SkipForward,
	Volume2,
	Shuffle,
	FileText,
} from 'lucide-react';
import { usePlayerStore } from '../../../store/usePlayerStore';
import { getSongMetadataById, removeTitlePrefixFromArtist, sanitizeDisplayText } from '../../../lib/api';
import vibeyLogo from '../../../assets/img1.png';
import { Button, Modal } from '../../../shared/ui';

const formatTime = (time) => {
	if (!time || Number.isNaN(time)) return '0:00';
	const minutes = Math.floor(time / 60);
	const seconds = Math.floor(time % 60);
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const PlayerBar = () => {
	const isPlaying = usePlayerStore((state) => state.isPlaying);
	const togglePlay = usePlayerStore((state) => state.togglePlay);
	const currentTrack = usePlayerStore((state) => state.currentTrack);
	const progress = usePlayerStore((state) => state.progress);
	const duration = usePlayerStore((state) => state.duration);
	const volume = usePlayerStore((state) => state.volume);
	const setVolume = usePlayerStore((state) => state.setVolume);
	const setMobilePlayerOpen = usePlayerStore((state) => state.setMobilePlayerOpen);
	const likedSongs = usePlayerStore((state) => state.likedSongs);
	const toggleLike = usePlayerStore((state) => state.toggleLike);
	const requestSeek = usePlayerStore((state) => state.requestSeek);
	const playPreviousTrack = usePlayerStore((state) => state.playPreviousTrack);
	const playNextTrack = usePlayerStore((state) => state.playNextTrack);
	const repeatMode = usePlayerStore((state) => state.repeatMode);
	const shuffleEnabled = usePlayerStore((state) => state.shuffleEnabled);
	const toggleRepeatMode = usePlayerStore((state) => state.toggleRepeatMode);
	const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
	const downloadTrack = usePlayerStore((state) => state.downloadTrack);
	const customPlaylists = usePlayerStore((state) => state.customPlaylists);
	const addTrackToPlaylist = usePlayerStore((state) => state.addTrackToPlaylist);

	const [lyricsOpen, setLyricsOpen] = useState(false);
	const [lyricsState, setLyricsState] = useState({ loading: false, data: null, error: '' });

	const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
	const isLiked = currentTrack ? likedSongs.some((track) => track.id === currentTrack.id) : false;
	const progressBarRef = useRef(null);
	const cleanTrackTitle = currentTrack ? sanitizeDisplayText(currentTrack.title) : 'No Track';
	const cleanTrackArtist = currentTrack
		? removeTitlePrefixFromArtist(cleanTrackTitle, currentTrack.artist)
		: 'Unknown';

	const repeatLabel = useMemo(() => {
		if (repeatMode === 'one') return 'Repeat one';
		if (repeatMode === 'all') return 'Repeat all';
		return 'Repeat off';
	}, [repeatMode]);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.code === 'Space' && event.target === document.body) {
				event.preventDefault();
				togglePlay();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [togglePlay]);

	const handleProgressClick = (event) => {
		if (!progressBarRef.current || duration === 0) return;
		const rect = progressBarRef.current.getBoundingClientRect();
		const percent = (event.clientX - rect.left) / rect.width;
		requestSeek(Math.max(0, Math.min(duration * percent, duration)));
	};

	const openPlayer = () => {
		if (currentTrack) {
			setMobilePlayerOpen(true);
		}
	};

	const openLyrics = async (event) => {
		event.stopPropagation();
		if (!currentTrack?.id) return;

		setLyricsOpen(true);
		setLyricsState({ loading: true, data: null, error: '' });

		try {
			const metadata = await getSongMetadataById(currentTrack.id);
			setLyricsState({ loading: false, data: metadata, error: '' });
		} catch (error) {
			setLyricsState({
				loading: false,
				data: null,
				error: error?.message || 'Failed to load lyrics metadata',
			});
		}
	};

	const saveToDownloads = (event) => {
		event.stopPropagation();
		if (!currentTrack) return;
		downloadTrack(currentTrack);
	};

	const saveToPlaylist = (event) => {
		event.stopPropagation();
		if (!currentTrack || customPlaylists.length === 0) return;
		addTrackToPlaylist(customPlaylists[0].id, currentTrack);
	};

	return (
		<>
			<div
				onClick={openPlayer}
				className="h-[65px] md:h-[90px] w-full bg-black/30 backdrop-blur-xl border-t border-white/5 fixed bottom-[65px] md:bottom-0 left-0 flex items-center justify-between px-4 md:px-7 z-40 cursor-pointer"
			>
				<div className="flex items-center gap-3 md:gap-4 w-1/2 md:w-1/4 pr-3 min-w-0">
					<div className="w-10 h-10 md:w-14 md:h-14 panel-card rounded-lg overflow-hidden shrink-0">
						{currentTrack?.image && (
							<img
								src={currentTrack.image}
								alt={currentTrack?.title || 'Album cover'}
								onError={(event) => {
									event.currentTarget.onerror = null;
									event.currentTarget.src = vibeyLogo;
								}}
								className="w-full h-full object-cover"
							/>
						)}
					</div>

					<div className="overflow-hidden flex-1">
						<h4 className="type-body font-semibold text-white line-clamp-1">{cleanTrackTitle}</h4>
						<p className="type-body text-gray-300 line-clamp-1">{cleanTrackArtist}</p>
					</div>
				</div>

				<div className="flex flex-col items-end md:items-center justify-center w-1/2 md:w-2/4">
					<div className="flex items-center gap-2 md:gap-3">
						<button
							onClick={(event) => {
								event.stopPropagation();
								toggleShuffle();
							}}
							aria-label="Toggle shuffle"
							title={shuffleEnabled ? 'Shuffle on' : 'Shuffle off'}
							className={`hidden sm:flex p-2 rounded motion-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${shuffleEnabled ? 'text-blue-300' : 'text-gray-300 hover:text-white'}`}
						>
							<Shuffle className="w-4 h-4" />
						</button>

						<button
							onClick={(event) => {
								event.stopPropagation();
								playPreviousTrack();
							}}
							aria-label="Previous track"
							className="hidden sm:flex p-2 rounded motion-base hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<SkipBack className="w-5 h-5 text-gray-300 hover:text-white motion-base" />
						</button>

						<button
							onClick={(event) => {
								event.stopPropagation();
								togglePlay();
							}}
							aria-label={isPlaying ? 'Pause' : 'Play'}
							className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white rounded-full hover:bg-slate-100 active:scale-95 motion-base shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
						>
							{isPlaying ? (
								<Pause className="w-5 h-5 text-black fill-black" />
							) : (
								<Play className="w-5 h-5 text-black fill-black ml-0.5" />
							)}
						</button>

						<button
							onClick={(event) => {
								event.stopPropagation();
								playNextTrack();
							}}
							aria-label="Next track"
							className="hidden sm:flex p-2 rounded motion-base hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<SkipForward className="w-5 h-5 text-gray-300 hover:text-white motion-base" />
						</button>

						<button
							onClick={(event) => {
								event.stopPropagation();
								toggleRepeatMode();
							}}
							aria-label="Toggle repeat mode"
							title={repeatLabel}
							className={`hidden sm:flex p-2 rounded motion-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${repeatMode === 'off' ? 'text-gray-300 hover:text-white' : 'text-blue-300'}`}
						>
							{repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
						</button>
					</div>

					<div className="hidden md:flex mt-2 items-center gap-3.5 w-full max-w-md">
						<span className="text-xs text-gray-400 w-8 text-right tabular-nums">{formatTime(progress)}</span>
						<div
							ref={progressBarRef}
							onClick={(event) => {
								event.stopPropagation();
								handleProgressClick(event);
							}}
							className="flex-1 h-1.5 bg-white/10 rounded-full flex items-center overflow-hidden cursor-pointer hover:h-2 motion-base group"
						>
							<div
								className="h-full bg-blue-400 rounded-full motion-quick"
								style={{ width: `${progressPercent}%` }}
							>
								<div className="w-3 h-3 bg-white rounded-full ml-auto -mr-1.5 opacity-0 group-hover:opacity-100 motion-base" />
							</div>
						</div>
						<span className="text-xs text-gray-400 w-8 tabular-nums">{formatTime(duration)}</span>
					</div>
				</div>

				<div className="hidden md:flex items-center justify-end w-1/4 gap-2">
					<button
						onClick={(event) => {
							event.stopPropagation();
							currentTrack && toggleLike(currentTrack);
						}}
						aria-label={isLiked ? 'Remove from favorites' : 'Add to favorites'}
						className="inline-flex p-2 rounded-lg btn-ghost motion-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
					>
						<Heart
							className={`w-5 h-5 motion-base ${
								isLiked ? 'text-blue-300 fill-blue-300' : 'text-gray-300 hover:text-blue-400'
							}`}
						/>
					</button>

					<button
						onClick={saveToDownloads}
						aria-label="Save to downloads"
						className="inline-flex p-2 rounded-lg btn-ghost motion-base"
					>
						<Download className="w-5 h-5 text-gray-300 hover:text-white" />
					</button>

					<button
						onClick={saveToPlaylist}
						aria-label="Save to playlist"
						className="inline-flex p-2 rounded-lg btn-ghost motion-base"
					>
						<ListPlus className="w-5 h-5 text-gray-300 hover:text-white" />
					</button>

					<button
						onClick={openLyrics}
						aria-label="Show lyrics status"
						className="inline-flex p-2 rounded-lg btn-ghost motion-base"
					>
						<FileText className="w-5 h-5 text-gray-300 hover:text-white" />
					</button>

					<Volume2 className="w-5 h-5 text-gray-300 ml-2" />
					<input
						type="range"
						min="0"
						max="1"
						step="0.01"
						value={volume}
						onClick={(event) => event.stopPropagation()}
						onChange={(event) => setVolume(parseFloat(event.target.value))}
						aria-label="Volume"
						className="w-24 h-1.5 accent-blue-400 bg-white/10 rounded-full cursor-pointer appearance-none hover:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>
			</div>

			<Modal
				open={lyricsOpen}
				onClose={() => setLyricsOpen(false)}
				title="Lyrics Availability"
				size="sm"
			>
				{lyricsState.loading ? (
					<p className="type-body text-gray-300">Checking lyrics availability...</p>
				) : lyricsState.error ? (
					<p className="type-body text-red-300">{lyricsState.error}</p>
				) : (
					<div className="space-y-2">
						<p className="type-body text-white">Track: {sanitizeDisplayText(lyricsState.data?.title || cleanTrackTitle)}</p>
						<p className="type-body text-gray-300">Language: {lyricsState.data?.language || 'Unknown'}</p>
						<p className="type-body text-gray-300">
							Lyrics: {lyricsState.data?.hasLyrics ? 'Available from upstream source' : 'Not available for this track'}
						</p>
						<p className="type-caption text-gray-400">Lyrics ID: {lyricsState.data?.lyricsId || 'N/A'}</p>
						<div className="pt-2">
							<Button variant="panel" size="sm" onClick={() => setLyricsOpen(false)}>
								Close
							</Button>
						</div>
					</div>
				)}
			</Modal>
		</>
	);
};

export default PlayerBar;
