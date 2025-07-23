//Non econimcal
// class PCMProcessor extends AudioWorkletProcessor {
//   constructor() {
//     super();
//   }

//   process(inputs) {
//     const input = inputs[0];
//     if (!input || input.length === 0 || !input[0]) {
//       return true;
//     }

//     const channelData = input[0];
//     const buffer = new ArrayBuffer(channelData.length * 2);
//     const view = new DataView(buffer);

//     for (let i = 0; i < channelData.length; i++) {
//       let sample = Math.max(-1, Math.min(1, channelData[i]));
//       sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
//       view.setInt16(i * 2, sample, true); // little endian
//     }

//     this.port.postMessage(new Uint8Array(buffer));
//     return true;
//   }
// }

// registerProcessor('pcm-processor', PCMProcessor);


// Voice Activity Detection (VAD)
// class PCMProcessor extends AudioWorkletProcessor {
//   constructor() {
//     super();
//     this.silenceCounter = 0;
//     this.voiceCounter = 0;
//     this.frameThreshold = 0.01; // Energy threshold
//     this.minVoiceFrames = 3; // Must exceed this to start sending
//     this.minSilenceFrames = 6; // Must exceed this to pause
//     this.isSpeaking = false;
//   }

//   _computeRMS(frame) {
//     let sumSquares = 0;
//     for (let i = 0; i < frame.length; i++) {
//       sumSquares += frame[i] * frame[i];
//     }
//     return Math.sqrt(sumSquares / frame.length);
//   }

//   process(inputs) {
//     const input = inputs[0];
//     if (!input || input.length === 0 || !input[0]) return true;

//     const channelData = input[0]; // mono channel
//     const rms = this._computeRMS(channelData);

//     if (rms > this.frameThreshold) {
//       this.voiceCounter++;
//       this.silenceCounter = 0;
//     } else {
//       this.silenceCounter++;
//       this.voiceCounter = 0;
//     }

//     if (!this.isSpeaking && this.voiceCounter >= this.minVoiceFrames) {
//       this.isSpeaking = true;
//       // Start streaming
//     } else if (this.isSpeaking && this.silenceCounter >= this.minSilenceFrames) {
//       this.isSpeaking = false;
//       // Pause streaming
//     }

//     if (this.isSpeaking) {
//       const buffer = new ArrayBuffer(channelData.length * 2); // 16-bit
//       const view = new DataView(buffer);
//       for (let i = 0; i < channelData.length; i++) {
//         let sample = Math.max(-1, Math.min(1, channelData[i]));
//         sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
//         view.setInt16(i * 2, sample, true); // little endian
//       }
//       this.port.postMessage(new Uint8Array(buffer));
//     }

//     return true;
//   }
// }

// registerProcessor('pcm-processor', PCMProcessor);

// Voice Activity Detection (VAD) - With Tail as to not cut the last words
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.silenceCounter = 0;
    this.voiceCounter = 0;
    this.frameThreshold = 0.01;
    this.minVoiceFrames = 3;
    this.minSilenceFrames = 6;
    this.isSpeaking = false;
    this.tailFramesToSend = 10; // Send 10 more frames (~200ms) after silence
    this.remainingTailFrames = 0;
  }

  _computeRMS(frame) {
    let sumSquares = 0;
    for (let i = 0; i < frame.length; i++) {
      sumSquares += frame[i] * frame[i];
    }
    return Math.sqrt(sumSquares / frame.length);
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) return true;

    const channelData = input[0];
    const rms = this._computeRMS(channelData);

    if (rms > this.frameThreshold) {
      this.voiceCounter++;
      this.silenceCounter = 0;
    } else {
      this.silenceCounter++;
      this.voiceCounter = 0;
    }

    if (!this.isSpeaking && this.voiceCounter >= this.minVoiceFrames) {
      this.isSpeaking = true;
      this.remainingTailFrames = this.tailFramesToSend;
    } else if (this.isSpeaking && this.silenceCounter >= this.minSilenceFrames) {
      this.remainingTailFrames = this.tailFramesToSend;
      this.isSpeaking = false;
    }

    const shouldSend = this.isSpeaking || this.remainingTailFrames > 0;

    if (shouldSend) {
      if (!this.isSpeaking) {
        this.remainingTailFrames--;
      }

      const buffer = new ArrayBuffer(channelData.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < channelData.length; i++) {
        let sample = Math.max(-1, Math.min(1, channelData[i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(i * 2, sample, true);
      }
      this.port.postMessage(new Uint8Array(buffer));
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
