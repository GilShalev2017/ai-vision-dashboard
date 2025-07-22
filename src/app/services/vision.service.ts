import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs'; // Keep if you use Observable.of elsewhere, else remove

// Add type declaration for HTMLMediaElement to include captureStream
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
  // FIX: Updated inputSource type to include 'laptop-camera' and 'smartphone-camera'
  public inputSource: Record<string, 'laptop-camera' | 'smartphone-camera' | 'file'> = {};
  public recorders: Record<string, MediaRecorder> = {};

  constructor(private http: HttpClient) { }

  /**
   * Stores the MediaStream associated with a given stream ID.
   * This stream can come from a camera or a video file.
   */
  setMediaStream(stream: string, mediaStream: MediaStream): void {
    this.mediaStreams[stream] = mediaStream;
  }

  /**
   * Retrieves the MediaStream for a given stream ID.
   */
  getMediaStream(stream: string): MediaStream | undefined {
    return this.mediaStreams[stream];
  }

  /**
   * Stops all ongoing operations and media tracks for a specific stream.
   * This is crucial when changing input sources or stopping an active operation.
   */
  stopOperation(stream: string): void {
    // Stop any ongoing STT WebSocket operations
    if (this.sttSockets[stream] && this.sttSockets[stream].readyState === WebSocket.OPEN) {
      this.sttSockets[stream].close();
      delete this.sttSockets[stream];
      console.log(`WebSocket for ${stream} closed.`);
    }

    // Stop any ongoing MediaRecorder operations
    if (this.recorders[stream] && this.recorders[stream].state !== 'inactive') {
      this.recorders[stream].stop();
      delete this.recorders[stream];
      console.log(`MediaRecorder for ${stream} stopped.`);
    }

    // Stop camera/video file media tracks (e.g., webcam light off)
    if (this.mediaStreams[stream]) {
      this.mediaStreams[stream].getTracks().forEach(track => track.stop());
      delete this.mediaStreams[stream];
      console.log(`MediaStream tracks for ${stream} stopped.`);
    }
    console.log(`Stopped all related operations and media for ${stream}.`);
  }

  /**
   * Invokes a specific operation (STT, Translate, Faces, OCR) for a given stream.
   * It intelligently determines the audio source based on the selected input type.
   */
  invokeOperation(stream: string, operation: string, activeVideoElement: HTMLVideoElement | null): void {
    const currentInputSource = this.inputSource[stream];
    let audioMediaStream: MediaStream | null = null;

    // FIX: Check for the new camera input types ('laptop-camera' or 'smartphone-camera')
    if (currentInputSource === 'laptop-camera' || currentInputSource === 'smartphone-camera') {
      // For camera, use the stored MediaStream which includes audio
      audioMediaStream = this.getMediaStream(stream) || null;
    } else if (currentInputSource === 'file' && activeVideoElement) {
      // For file, capture audio from the video element playing the file
      // FIX: Explicitly cast to HTMLMediaElement, as captureStream is defined on it.
      const mediaElement = activeVideoElement as HTMLMediaElement;
      // Check for 'captureStream' property existence and that it's a function
      if (mediaElement && typeof mediaElement.captureStream === 'function') {
        audioMediaStream = mediaElement.captureStream();
      } else {
        console.warn('activeVideoElement.captureStream() is not supported or not a function in this browser for stream:', stream);
        // Fallback or error handling if captureStream is not available
      }
    }

    if (operation === 'stt') {
      // Azure RT STT via WebSocket
      if (audioMediaStream) {
        this.startRealtimeSTT(stream, audioMediaStream);
      } else {
        console.error('No audio source available for Azure STT for stream:', stream);
      }
      return;
    }

    if (operation === 'stt-openai') {
      // OpenAI STT via chunked file upload (HTTP POST)
      if (audioMediaStream) {
        this.startRealtimeOpenAiSTT(stream, audioMediaStream);
      } else {
        console.error('No audio source available for OpenAI STT for stream:', stream);
      }
      return;
    }

    // For other operations (faces, translate, ocr) that might not need the audio stream directly
    // You might pass the video stream for visual operations if your backend supports it
    this.http.post(`/api/vision/${operation}`, { stream })
      .subscribe((response: any) => {
        if (operation === 'faces') {
          this.overlays[stream] = response.overlays;
        }
        // Add more logic here for translate, ocr responses if needed
      }, error => {
        console.error(`Error invoking ${operation} for ${stream}:`, error);
      });
  }

  /**
   * Starts real-time Speech-to-Text using Azure, streaming audio via WebSocket.
   */
  startRealtimeSTT(stream: string, audioStream: MediaStream): void {
    this.stopOperation(stream); // Ensure previous ops are stopped before starting new STT

    const socket = new WebSocket(`ws://localhost:5254/ws/stt?stream=${encodeURIComponent(stream)}`); // Use ws:// for HTTP
    this.sttSockets[stream] = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.transcript) {
        this.captions[stream] = data.transcript;
      }
    };

    socket.onopen = () => {
      console.log(`WebSocket for Azure STT opened for ${stream}. Starting MediaRecorder.`);
      const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' }); // webm is commonly supported
      this.recorders[stream] = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
          socket.send(e.data); // Send raw audio blob
        }
      };
      mediaRecorder.start(500); // Send audio chunks every 500ms
    };

    socket.onerror = (error) => {
      console.error('WebSocket error for Azure STT:', error);
      this.stopOperation(stream); // Clean up on error
    };

    socket.onclose = () => {
      console.log(`WebSocket for Azure STT closed for ${stream}.`);
      this.stopOperation(stream); // Clean up on close
    };
  }

  /**
   * Starts real-time Speech-to-Text using OpenAI, sending audio in chunks via HTTP POST.
   */
  startRealtimeOpenAiSTT(stream: string, audioStream: MediaStream): void {
    this.stopOperation(stream); // Ensure previous ops are stopped before starting new STT

    const mediaRecorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' }); // Use webm for broader browser support
    this.recorders[stream] = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        const blob = e.data;
        const formData = new FormData();
        formData.append("audio", blob, "clip.wav"); // Send as WAV for OpenAI

        this.http.post<any>(`/api/vision/stt-openai?stream=${stream}`, formData).subscribe(resp => {
          if (resp.transcript) {
            this.captions[stream] = resp.transcript;
          }
        }, error => {
          console.error('Error sending audio to OpenAI STT:', error);
          // Optionally, stop the recorder on continuous errors
        });
      }
    };

    mediaRecorder.onstop = () => {
      console.log(`OpenAI STT recorder stopped for ${stream}.`);
    };

    mediaRecorder.start(3000); // Collect 3-second chunks for OpenAI (adjust as needed)
    console.log(`OpenAI STT recorder started for ${stream}.`);
  }


  /**
   * Loads a video file into the given HTMLVideoElement and captures its audio stream.
   */
  loadVideoFile(event: Event, stream: string, videoElement: HTMLVideoElement): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      console.warn('No file selected for stream:', stream);
      return;
    }

    // Stop any current operations or media streams for this stream before loading new file
    this.stopOperation(stream);

    // Set the video source to the selected file
    videoElement.srcObject = null; // Clear any previous camera stream
    videoElement.src = URL.createObjectURL(file);
    videoElement.load(); // Load the new video file
    videoElement.play().catch(e => console.error("Error playing video:", e));

    // Capture the audio stream from the video element
    // FIX: Explicitly cast to HTMLMediaElement, as captureStream is defined on it.
    const mediaElement = videoElement as HTMLMediaElement;
    if (mediaElement && typeof mediaElement.captureStream === 'function') {
      this.setMediaStream(stream, mediaElement.captureStream());
      console.log(`Audio stream captured from video file for ${stream}.`);
    } else {
      console.warn('HTMLMediaElement.captureStream() is not supported or not a function in this browser. Cannot capture audio from video file for stream:', stream);
      // Implement a fallback here if captureStream is critical and not supported:
      // E.g., using Web Audio API to process audio from the video, or instructing the user.
    }
  }

  getOverlay(stream: string) {
    return this.overlays[stream] || [];
  }

  getCaptions(stream: string) {
    return this.captions[stream] || '';
  }

  // This function is no longer needed as invokeOperation routes to startRealtimeOpenAiSTT
  // private convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
  //   const l = buffer.length;
  //   const buf = new Int16Array(l);
  //   for (let i = 0; i < l; i++) {
  //     buf[i] = Math.min(1, buffer[i]) * 0x7fff;
  //   }
  //   return buf.buffer;
  // }
}