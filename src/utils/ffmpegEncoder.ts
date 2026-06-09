import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async (onProgress: any) => {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  ffmpeg.on('progress', onProgress);

  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
  });

  return ffmpeg;
};

export const muxAudioVideo = async (
  videoBlob: Blob,
  audioUrl: string | null,
  onProgress: any
) => {
  const ff = await loadFFmpeg(onProgress);
  
  await ff.writeFile('video.mp4', await fetchFile(videoBlob));

  if (audioUrl) {
    await ff.writeFile('audio.mp3', await fetchFile(audioUrl));
    // Muxing and looping audio to match video duration
    // -stream_loop -1 loops the audio. -shortest stops encoding when the shortest stream (video) ends
    await ff.exec([
      '-i', 'video.mp4',
      '-stream_loop', '-1',
      '-i', 'audio.mp3',
      '-c:v', 'copy',
      '-c:a', 'aac',
      '-map', '0:v:0',
      '-map', '1:a:0',
      '-shortest',
      'output.mp4'
    ]);
  } else {
    // Just copy
    await ff.exec(['-i', 'video.mp4', '-c', 'copy', 'output.mp4']);
  }

  const data = await ff.readFile('output.mp4');
  return new Blob([data as any], { type: 'video/mp4' });
};
