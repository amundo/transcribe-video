// voice-activity-detection-worker.js


self.onmessage = function(event) {
  console.log(event.data)
  const { channelDataBuffer, sampleRate } = event.data;

  // Create a Float32Array view of the SharedArrayBuffer
  const channelData = new Float32Array(channelDataBuffer);

  const absData = channelData.map(Math.abs);
  const sortedData = [...absData].sort((a, b) => a - b);

  const noiseFloor = sortedData[Math.floor(sortedData.length * 0.95)];
  const peak = sortedData[sortedData.length - 1];
  const threshold = noiseFloor + (peak - noiseFloor) * 0.1;

  const minSilenceDuration = 0.3;
  const minVoiceDuration = 0.1;

  let isSilent = true;
  let silenceStart = 0;
  let voiceStart = null;
  const voiceActivityIntervals = [];

  for (let i = 0; i < channelData.length; i++) {
      const amplitude = Math.abs(channelData[i]);

      if (amplitude > threshold) {
          if (isSilent && voiceStart === null) {
              const currentTime = i / sampleRate;
              if (currentTime - silenceStart > minSilenceDuration) {
                  voiceStart = currentTime;
              }
              isSilent = false;
          }
      } else {
          if (!isSilent) {
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

  if (voiceStart !== null) {
      voiceActivityIntervals.push([voiceStart, channelData.length / sampleRate]);
  }

  self.postMessage(voiceActivityIntervals);
};
