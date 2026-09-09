import type { TranscriptTrack } from './domain';

export function selectTranscriptTrack(
  tracks: readonly TranscriptTrack[],
  requestedTrackId: string | null = null,
  preference: 'en' | 'original' = 'en',
): TranscriptTrack | undefined {
  const explicit = tracks.find((track) => track.id === requestedTrackId);
  if (explicit) return explicit;
  if (preference === 'original')
    return tracks.find((track) => !track.isTranslated) ?? tracks[0];
  const rank = (track: TranscriptTrack) =>
    track.isTranslated ? 2 : track.isAutomatic ? 1 : 0;
  return (
    tracks
      .filter((track) => /^en(?:-|$)/i.test(track.languageCode))
      .sort((left, right) => rank(left) - rank(right))[0] ?? tracks[0]
  );
}
