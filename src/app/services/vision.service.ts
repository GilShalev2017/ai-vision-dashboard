import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { allLanguages } from '../dashboard/allLanguages';

interface HTMLMediaElement {
  captureStream?: () => MediaStream;
}

@Injectable({
  providedIn: 'root'
})
export class VisionService {
  private overlays: { [key: string]: any[] } = {};
  private captions: { [key: string]: string } = {};
  private sttSockets: { [key: string]: WebSocket } = {};
  private mediaStreams: { [key: string]: MediaStream } = {}; // To store the active camera/video file MediaStream
  public inputSource: Record<string, 'laptop-camera' | 'smartphone-camera' | 'file'> = {};
  public recorders: Record<string, MediaRecorder | AudioWorkletNode> = {};
  private currentOperations: { [key: string]: Set<'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr'> } = {};
  recognitionLanguages: { [stream: string]: string } = {};
  public selectedLanguages: { [stream: string]: string } = {};
  private audioContexts: Record<string, AudioContext> = {};
  private alprSockets: Record<string, WebSocket> = {};
  private alprIntervals: Record<string, any> = {};

  constructor(private http: HttpClient) {}

  setLanguageForStream(stream: string, isocode: string) {
    this.selectedLanguages[stream] = isocode;
  }

  getLanguageForStream(stream: string): string {
    const isocode = this.selectedLanguages[stream];
    const match = allLanguages.find(lang => lang.isocode === isocode || lang.azureLocaleCode === isocode);
    return match?.azureLocaleCode || 'en-US';
  }

  /**
   * Stores the MediaStream associated with a given stream ID.
   * This stream can come from a camera or a video file.
   */
  setMediaStream(stream: string, mediaStream: MediaStream): void {
    console.log(`[VisionService] Setting MediaStream for ${stream}:`, mediaStream);
    this.mediaStreams[stream] = mediaStream;
  }

  /**
   * Retrieves the MediaStream for a given stream ID.
   */
  getMediaStream(stream: string): MediaStream | undefined {
    const streamToReturn = this.mediaStreams[stream];
    console.log(`[VisionService] Getting MediaStream for ${stream}:`, streamToReturn);
    return streamToReturn;
  }

  /**
   * Get the current operations for a stream
   */
  getCurrentOperations(stream: string): Set<'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr'> {
    const operations = this.currentOperations[stream] || new Set();
    console.log(`[VisionService] Current operations for ${stream}:`, Array.from(operations));
    return operations;
  }

  /**
   * Add an operation to a stream
   */
  addOperation(stream: string, operation: 'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr'): void {
    if (!this.currentOperations[stream]) {
      this.currentOperations[stream] = new Set();
    }
    this.currentOperations[stream].add(operation);
    console.log(`[VisionService] Added operation '${operation}' to stream '${stream}'. Current operations:`, Array.from(this.currentOperations[stream]));
  }

  /**
   * Remove an operation from a stream
   */
  removeOperation(stream: string, operation: 'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr'): void {
    if (this.currentOperations[stream]) {
      this.currentOperations[stream].delete(operation);
      console.log(`[VisionService] Removed operation '${operation}' from stream '${stream}'. Current operations:`, Array.from(this.currentOperations[stream]));
      // Clean up empty sets
      if (this.currentOperations[stream].size === 0) {
        delete this.currentOperations[stream];
        console.log(`[VisionService] No operations left for stream '${stream}', clearing.`);
      }
    }
  }

  /**
   * Clear all operations for a stream
   */
  clearOperations(stream: string): void {
    console.log(`[VisionService] Clearing all operation flags for stream '${stream}'.`);
    delete this.currentOperations[stream];
  }

  /**
   * Check if a stream has a specific operation active
   */
  hasOperation(stream: string, operation: 'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr' ): boolean {
    const operations = this.currentOperations[stream];
    const hasOp = operations ? operations.has(operation) : false;
    return hasOp;
  }

  /**
   * Stops active MediaRecorder and WebSocket operations for a specific stream.
   * This does NOT stop the underlying MediaStream tracks (camera/video playback).
   */
  stopOperation(stream: string): void {
    console.log(`[VisionService] Attempting to stop *processing operations* for ${stream}...`);
    this.clearOperations(stream); // Clear associated operations flags

    // Stop any ongoing STT WebSocket operations
    if (this.sttSockets[stream] && this.sttSockets[stream].readyState === WebSocket.OPEN) {
      this.sttSockets[stream].close();
      delete this.sttSockets[stream];
      console.log(`[VisionService] WebSocket for ${stream} closed.`);
    } else if (this.sttSockets[stream]) {
      console.log(`[VisionService] WebSocket for ${stream} not open or already closed, state: ${this.sttSockets[stream].readyState}`);
    }

    // Stop any ongoing MediaRecorder operations
    if (this.recorders[stream]) {
      const recorder = this.recorders[stream];
      if (recorder instanceof MediaRecorder) {
        if (recorder.state !== 'inactive') {
          recorder.stop();
          console.log(`[VisionService] MediaRecorder for ${stream} stopped.`);
        } else {
          console.log(`[VisionService] MediaRecorder for ${stream} already inactive.`);
        }
      } else if (recorder instanceof AudioWorkletNode) {
        // Disconnect worklet node
        recorder.disconnect();
        console.log(`[VisionService] AudioWorkletNode for ${stream} disconnected.`);
      }
      delete this.recorders[stream];
    } else {
      console.log(`[VisionService] MediaRecorder for ${stream} not found.`);
    }

    if (this.audioContexts[stream]) {
      this.audioContexts[stream].close();
      delete this.audioContexts[stream];
    }

    console.log(`[VisionService] Finished stopping existing recorders and sockets for ${stream}.`);
  }

  /**
   * Stops all MediaStream tracks (e.g., turns off camera, stops video file playback)
   * and clears the stored MediaStream for a given stream ID.
   * This should be called when the input source is being changed or explicitly released.
   */
  releaseMediaStream(stream: string): void {
    console.log(`[VisionService] Releasing MediaStream and stopping tracks for ${stream}.`);
    // First, stop any operations that might be using this stream
    this.stopOperation(stream);

    if (this.mediaStreams[stream]) {
      this.mediaStreams[stream].getTracks().forEach(track => {
        if (track.readyState === 'live') { // Only stop if it's actually active
          track.stop();
          console.log(`[VisionService] Stopped MediaStream track: ${track.kind} (${track.id}) for ${stream}.`);
        } else {
          console.log(`[VisionService] MediaStream track: ${track.kind} (${track.id}) for ${stream} already stopped/inactive.`);
        }
      });
      // Important: Also revoke the Object URL if it was created for a video file
      if (this.inputSource[stream] === 'file' && this.mediaStreams[stream].id) {
        // Find the video element associated with this stream ID if possible
        // For simplicity, we assume the videoElement.srcObject will be cleaned up
        // when a new file is loaded or src is set to null/empty string.
        // If a direct URL.revokeObjectURL is needed, the URL itself would need to be stored.
      }
      delete this.mediaStreams[stream];
      delete this.inputSource[stream]; // Clear the input source type
      console.log(`[VisionService] MediaStream for ${stream} cleared from service.`);
    } else {
      console.log(`[VisionService] No active MediaStream to release for ${stream}.`);
    }
  }

  /**
   * Invokes a specific operation (STT, Translate, Faces, OCR, ALPR) for a given stream.
   * It intelligently determines the audio source based on the selected input type.
   */
  invokeOperation(stream: string, operation: string, activeVideoElement: HTMLVideoElement | null): void {
    console.log(`[VisionService] Invoking operation '${operation}' for stream '${stream}'.`);
    const currentInputSource = this.inputSource[stream];
    let audioMediaStream: MediaStream | null = null;

    console.log(`[VisionService] Current input source for ${stream}: ${currentInputSource}`);

    // --- CRITICAL CHANGE HERE ---
    // Always try to get the already stored MediaStream.
    // This prevents re-capturing the stream multiple times which can lead to issues.
    audioMediaStream = this.getMediaStream(stream) || null;
    console.log(`[VisionService] Retrieved MediaStream from service for ${stream}:`, audioMediaStream);

    // If the input source is a file AND no stream was previously captured/set,
    // then attempt to capture it NOW. This should ideally only happen once.
    if (!audioMediaStream && currentInputSource === 'file' && activeVideoElement) {
      const mediaElement = activeVideoElement as HTMLMediaElement;
      if (mediaElement && typeof mediaElement.captureStream === 'function') {
        const newlyCapturedStream = mediaElement.captureStream();
        if (newlyCapturedStream) {
          console.log(`[VisionService] No stored MediaStream, so newly capturing from video element for ${stream}.`);
          newlyCapturedStream.getTracks().forEach(track => {
            console.log(`[VisionService]   Newly captured stream track: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}, id=${track.id}`);
          });
          if (newlyCapturedStream.getAudioTracks().length > 0) {
            this.setMediaStream(stream, newlyCapturedStream); // Store it for future reuse
            audioMediaStream = newlyCapturedStream;
            console.log(`[VisionService] Newly captured audio stream successfully set for ${stream}.`);
          } else {
            console.warn(`[VisionService] Newly captured MediaStream from video file has no audio tracks for ${stream}. STT operations will not work.`);
          }
        } else {
          console.error(`[VisionService] newly captured captureStream() returned null or undefined for ${stream}.`);
        }
      } else {
        console.warn(`[VisionService] activeVideoElement.captureStream() is not supported or not a function in this browser for stream: ${stream}. Cannot capture audio from video file.`);
      }
    } else if (!audioMediaStream) {
      console.warn(`[VisionService] No active video element or unknown input source for stream: ${stream}, and no MediaStream stored.`);
    }

    if (operation === 'stt-azure') {
      // Azure RT STT via WebSocket
      if (audioMediaStream) {
        this.startRealtimeAzureSTTViaScriptProcessor(stream, audioMediaStream);
      } else {
        console.error(`[VisionService] No audio source available for Azure STT for stream: ${stream}. Cannot start STT.`);
      }
      return;
    }

    if (operation === 'stt-openai') {
      // OpenAI STT via chunked file upload (HTTP POST)
      if (audioMediaStream) {
        this.startRealtimeOpenAiSTT(stream, audioMediaStream);
      } else {
        console.error(`[VisionService] No audio source available for OpenAI STT for stream: ${stream}. Cannot start STT.`);
      }
      return;
    }

    if (operation === 'alpr') {
      if (activeVideoElement) {
        this.startAlprSocket(stream, activeVideoElement);
      }
    }
  }

  convertBlobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]); // remove data:image/jpeg;base64,...
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  
  startAlprSocket(stream: string, video: HTMLVideoElement): void {
    // 🛑 Stop any existing socket or interval for this stream before starting a new one
    this.stopAlprSocket(stream);
  
    const socket = new WebSocket(`ws://localhost:5254/ws/alpr?stream=${encodeURIComponent(stream)}`);
    this.alprSockets[stream] = socket;
  
    socket.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      this.handleAlprResult(stream, video, data);
      // const result = JSON.parse(msg.data);
      // this.overlays[stream] = result.overlays || [];
      //console.log(`[ALPR] Result for ${stream}:`, result);
    };
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const FPS = 3;
  
    const sendFrame = async () => {
      if (
        socket.readyState !== WebSocket.OPEN ||
        video.paused ||
        video.ended ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) return;
  
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      canvas.toBlob(async (blob) => {
        if (blob) {
          const base64Data = await this.convertBlobToBase64(blob);
          const message = {
            stream,
            data: base64Data
          };
          socket.send(JSON.stringify(message));
        }
      }, 'image/jpeg', 0.85);
    };
  
    socket.onopen = () => {
      console.log(`[ALPR] Socket opened for ${stream}.`);
      this.alprIntervals[stream] = setInterval(sendFrame, 1000 / FPS);
    };
  
    socket.onclose = () => {
      console.log(`[ALPR] Socket closed for ${stream}.`);
      this.stopAlprSocket(stream);
    };
  
    socket.onerror = (err) => {
      console.error(`[ALPR] WebSocket error for ${stream}:`, err);
      this.stopAlprSocket(stream);
    };
  }
  
  stopAlprSocket(stream: string): void {
    const socket = this.alprSockets[stream];
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    if (this.alprIntervals[stream]) {
      clearInterval(this.alprIntervals[stream]);
      delete this.alprIntervals[stream];
    }
    delete this.alprSockets[stream];
  }

  
  startRealtimeAzureSTTViaScriptProcessor(stream: string, audioStream: MediaStream): void {

    console.log(`[VisionService] Starting Azure STT (raw PCM) for ${stream} via AudioWorklet.`);

    this.stopOperation(stream);

    const azureLocaleCode = this.getLanguageForStream(stream);

    const socket = new WebSocket(`ws://localhost:5254/ws/azureStt?stream=${encodeURIComponent(stream)}&lang=${encodeURIComponent(azureLocaleCode)}`);

    this.sttSockets[stream] = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.transcript) {
        this.captions[stream] = data.transcript;
        console.log(`[VisionService] Azure STT Transcript for ${stream}: ${data.transcript}`);
      }
    };

    socket.onopen = async () => {
      try {
        const audioContext = new AudioContext({ sampleRate: 16000 });

        this.audioContexts[stream] = audioContext;

        console.log('Actual AudioContext sampleRate:', audioContext.sampleRate);

        await audioContext.audioWorklet.addModule('/audio-processor.js');

        const source = audioContext.createMediaStreamSource(audioStream);

        const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');

        this.recorders[stream] = workletNode;

        workletNode.port.onmessage = (event) => {

          const pcmChunk: Uint8Array = event.data;

          console.log(`[VisionService] Sending PCM chunk: ${pcmChunk.length} bytes`);

          if (socket.readyState === WebSocket.OPEN) {

            socket.send(pcmChunk);

          }
        };

        source.connect(workletNode).connect(audioContext.destination);

        console.log(`[VisionService] AudioWorkletNode started.`);
      } catch (error) {

        console.error(`[VisionService] Failed to initialize AudioWorklet for ${stream}:`, error);

        this.stopOperation(stream);
      }
    };

    socket.onerror = (err) => {
      console.error(`[VisionService] WebSocket error for Azure STT (raw PCM):`, err);
      this.stopOperation(stream);
    };

    socket.onclose = () => {
      console.log(`[VisionService] WebSocket closed for Azure STT (raw PCM).`);
      this.stopOperation(stream);
    };
  }


  /**
   * Starts real-time Speech-to-Text using OpenAI, sending audio in chunks via HTTP POST.
   */
  startRealtimeOpenAiSTT(stream: string, audioStream: MediaStream): void {
    console.log(`[VisionService] Starting OpenAI STT for ${stream}.`);
    this.stopOperation(stream);

    if (!audioStream || audioStream.getAudioTracks().length === 0) {
      console.error(`[VisionService] No audio tracks found for ${stream}.`);
      return;
    }

    const onlyAudioStream = new MediaStream(audioStream.getAudioTracks());
    const mimeType = 'audio/webm;codecs=opus';

    const mediaRecorder = MediaRecorder.isTypeSupported(mimeType)
      ? new MediaRecorder(onlyAudioStream, { mimeType })
      : new MediaRecorder(onlyAudioStream); // fallback

    this.recorders[stream] = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 1000) {
        const finalizedBlob = new Blob([e.data], { type: 'audio/webm' });

        console.log(`[VisionService] Blob type: ${finalizedBlob.type}, size: ${finalizedBlob.size}`);

        const formData = new FormData();
        formData.append("file", finalizedBlob, "clip.webm");

        this.http.post<any>(
          `http://localhost:5254/api/vision/openAiStt?stream=${encodeURIComponent(stream)}`,
          formData
        ).subscribe(resp => {
          if (resp.transcript) {
            this.captions[stream] = resp.transcript;
            console.log(`[VisionService] Transcript for ${stream}: ${resp.transcript}`);
          } else {
            console.warn(`[VisionService] No transcript in response:`, resp);
          }
        }, error => {
          console.error(`[VisionService] Error posting to STT:`, error);
        });
      } else {
        console.warn(`[VisionService] Empty blob for ${stream}.`);
      }
    };

    mediaRecorder.start(3000); // every 3 seconds
    console.log(`[VisionService] Recorder started for ${stream}.`);
  }

  /**
   * Loads a video file into the given HTMLVideoElement and captures its audio stream.
   */
  loadVideoFile(event: Event, stream: string, videoElement: HTMLVideoElement): void {
    console.log(`[VisionService] Attempting to load video file for stream: ${stream}.`);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      console.warn(`[VisionService] No file selected for stream: ${stream}. Aborting loadVideoFile.`);
      return;
    }
    console.log(`[VisionService] File selected: ${file.name} (${file.type}, ${file.size} bytes) for stream: ${stream}.`);

    // **IMPORTANT CHANGE:** Call releaseMediaStream to stop any previous video/camera stream
    // associated with this stream ID before loading a new one.
    this.releaseMediaStream(stream);
    this.inputSource[stream] = 'file'; // Set the input source type immediately

    // Set the video source to the selected file
    videoElement.srcObject = null; // Clear any previous camera stream
    videoElement.src = URL.createObjectURL(file);
    videoElement.load(); // Load the new video file
    videoElement.muted = false; // Ensure it's not muted, as captureStream might be affected by it
    console.log(`[VisionService] Video element src set to object URL for ${stream}.`);

    videoElement.onloadedmetadata = () => {
      console.log(`[VisionService] Video loaded metadata for ${stream}. Dimensions: ${videoElement.videoWidth}x${videoElement.videoHeight}, Duration: ${videoElement.duration}s.`);
      videoElement.play().catch(e => console.error(`[VisionService] Error playing video for ${stream}:`, e));
    };

    videoElement.onplay = () => {
      console.log(`[VisionService] Video started playing for ${stream}.`);
      // Capture the audio stream from the video element AFTER it starts playing
      const mediaElement = videoElement as HTMLMediaElement;
      if (mediaElement && typeof mediaElement.captureStream === 'function') {
        const capturedStream = mediaElement.captureStream();
        if (capturedStream) {
          console.log(`[VisionService] Successfully captured MediaStream from video element for ${stream}.`);
          capturedStream.getTracks().forEach(track => {
            console.log(`[VisionService]   Captured stream track: kind=${track.kind}, enabled=${track.enabled}, readyState=${track.readyState}, id=${track.id}`);
          });
          if (capturedStream.getAudioTracks().length > 0) {
            this.setMediaStream(stream, capturedStream);
            console.log(`[VisionService] Audio stream successfully captured and set for ${stream}.`);
          } else {
            console.warn(`[VisionService] Captured stream from video file for ${stream} has no audio tracks. STT operations will not work.`);
            // You might want to provide user feedback here
          }
        } else {
          console.error(`[VisionService] captureStream() returned null or undefined for ${stream}.`);
        }
      } else {
        console.warn(`[VisionService] HTMLMediaElement.captureStream() is not supported or not a function in this browser for stream: ${stream}. Cannot capture audio from video file.`);
        // Implement a fallback here if captureStream is critical and not supported:
        // E.g., using Web Audio API to process audio from the video, or instructing the user.
      }
    };

    videoElement.onerror = (e) => {
      console.error(`[VisionService] Error loading or playing video for ${stream}:`, e);
      // Access more specific error info if available, e.g., videoElement.error
      if (videoElement.error) {
        console.error(`[VisionService] HTMLMediaElement error object for ${stream}: code=${videoElement.error.code}, message=${videoElement.error.message}`);
      }
    };
  }

  getOverlay(stream: string) {
    return this.overlays[stream] || [];
  }

  private handleAlprResult(stream: string, videoElement: HTMLVideoElement, data: any) {
    const originalWidth = data.originalWidth;
    const originalHeight = data.originalHeight;
    const overlays = data.overlays || [];
  
    if (!originalWidth || !originalHeight) {
      console.warn('[ALPR] Missing original video dimensions.');
      return;
    }
  
    const rect = videoElement.getBoundingClientRect(); // visible size in layout
    const renderedWidth = rect.width;
    const renderedHeight = rect.height;
  
    if (!renderedWidth || !renderedHeight) {
      console.warn('[ALPR] Could not determine rendered video size.');
      return;
    }
  
    const scaleX = renderedWidth / originalWidth;
    const scaleY = renderedHeight / originalHeight;
  
    const scaledOverlays = overlays.map((overlay: any) => ({
      label: overlay.label,
      x: overlay.x * scaleX,
      y: overlay.y * scaleY,
      w: overlay.w * scaleX,
      h: overlay.h * scaleY
    }));
  
    this.overlays[stream] = scaledOverlays;
  }
 
  
  getCaptions(stream: string) {
    return this.captions[stream] || '';
  }

  setRecognitionLanguage(stream: string, langCode: string) {
    this.recognitionLanguages[stream] = langCode;
  }
}
