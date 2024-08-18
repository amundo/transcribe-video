// voiceActivityDetector.js

alert`wtf`
export async function detectVoiceActivity(mediaBlob) {
  const audioContext = new AudioContext()

  // Create an HTMLMediaElement to handle both audio and video files
  const mediaElement = document.createElement('video'); // Use 'audio' if you know it's audio-only
  mediaElement.src = URL.createObjectURL(mediaBlob);

  // Wait for the media element to be fully loaded
  await new Promise((resolve) => {
      mediaElement.addEventListener('loadedmetadata', resolve, { once: true });
  });

  const source = audioContext.createMediaElementSource(mediaElement);
  const analyser = audioContext.createAnalyser();
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  // Play the media (muted) so the Web Audio API can process it
  mediaElement.muted = true;
  mediaElement.play();

  // Analyze the audio track
  const channelData = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(channelData);

  // Estimate threshold by analyzing amplitude distribution
  const absData = channelData.map(Math.abs);
  const sortedData = [...absData].sort((a, b) => a - b);

  // Use a percentile to determine a threshold (e.g., 95th percentile as noise floor)
  const noiseFloor = sortedData[Math.floor(sortedData.length * 0.95)];
  const peak = sortedData[sortedData.length - 1];
  const threshold = noiseFloor + (peak - noiseFloor) * 0.1; // Adjust factor as needed

  const sampleRate = audioContext.sampleRate;
  const minSilenceDuration = 0.3; // Minimum duration (in seconds) to consider it silence
  const minVoiceDuration = 0.1; // Minimum duration (in seconds) to consider it as voice activity

  let isSilent = true;
  let silenceStart = 0;
  let voiceStart = null;
  const voiceActivityIntervals = [];

  for (let i = 0; i < channelData.length; i++) {
      const amplitude = Math.abs(channelData[i]);

      if (amplitude > threshold) {
          // Detected voice activity
          if (isSilent && voiceStart === null) {
              // Transition from silence to voice
              const currentTime = i / sampleRate;
              if (currentTime - silenceStart > minSilenceDuration) {
                  voiceStart = currentTime;
              }
              isSilent = false;
          }
      } else {
          // Detected silence
          if (!isSilent) {
              // Transition from voice to silence
              const currentTime = i / sampleRate;
              if (voiceStart !== null && currentTime - voiceStart > minVoiceDuration) {
                  voiceActivityIntervals.push([voiceStart, currentTime]);
              }
              silenceStart = currentTime;
              voiceStart = null;
              isSilent = true;
          }
      }
  }

  // Handle the case where voice activity extends to the end of the audio
  if (voiceStart !== null) {
      voiceActivityIntervals.push([voiceStart, channelData.length / sampleRate]);
  }

  return voiceActivityIntervals;
}
