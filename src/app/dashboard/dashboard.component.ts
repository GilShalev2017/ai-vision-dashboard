import { Component, AfterViewInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { VisionService } from '../services/vision.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'], // Link to the new SCSS file
  standalone: false
})
export class DashboardComponent implements AfterViewInit {
  streams = ['Stream 1', 'Stream 2', 'Stream 3', 'Stream 4'];

  readonly bestBoys: string[] = ['Samoyed', 'Akita Inu', 'Alaskan Malamute', 'Siberian Husky'];
  
  @ViewChildren('cameraVideoPlayer') cameraVideoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  @ViewChildren('videoFilePlayer') videoFilePlayers!: QueryList<ElementRef<HTMLVideoElement>>;

  laptopCameraDeviceId: string | null = null;
  smartphoneCameraDeviceId: string | null = null;

  private activeLaptopCameraStreamId: string | null = null;
  private activeSmartphoneCameraStreamId: string | null = null;

  // New property to track the maximized card
  maximizedCardIndex: number | null = null;

  // Store dynamic clip names (e.g., from file selection)
  clipNames: Record<string, string> = {
    'Stream 1': 'Laptop Webcam',
    'Stream 2': 'Smartphone Camera',
    'Stream 3': 'Clip 1',
    'Stream 4': 'Clip 2'
  };

  constructor(public visionService: VisionService) {
    // Initialize input source based on new rules
    this.streams.forEach(stream => {
      if (stream === 'Stream 1') {
        this.visionService.inputSource[stream] = 'laptop-camera'; // Default for Stream 1
      } else if (stream === 'Stream 2') {
        this.visionService.inputSource[stream] = 'smartphone-camera'; // Default for Stream 2
      } else {
        this.visionService.inputSource[stream] = 'file'; // Default for other streams
      }
    });
  }

  ngAfterViewInit(): void {
    this.setupCameraDevices().then(() => {
      this.cameraVideoPlayers.changes.subscribe(() => {
        this.initializeCameraStreams();
      });
      this.initializeCameraStreams();
    });
  }

  private async setupCameraDevices(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach(track => track.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      for (const device of videoDevices) {
        if (!this.laptopCameraDeviceId && !device.label.toLowerCase().includes('environment') && !device.label.toLowerCase().includes('back')) {
          this.laptopCameraDeviceId = device.deviceId;
          console.log('Identified Laptop Camera:', device.label, device.deviceId);
        } else if (!this.smartphoneCameraDeviceId && (device.label.toLowerCase().includes('environment') || device.label.toLowerCase().includes('back'))) {
          this.smartphoneCameraDeviceId = device.deviceId;
          console.log('Identified Smartphone Camera:', device.label, device.deviceId);
        }
        if (this.laptopCameraDeviceId && this.smartphoneCameraDeviceId) break;
      }
    } catch (error) {
      console.error('Error setting up camera devices:', error);
      console.warn('Camera access denied or no camera found. Some features may not work.');
      this.laptopCameraDeviceId = null;
      this.smartphoneCameraDeviceId = null;
    }
  }

  private initializeCameraStreams(): void {
    if (this.visionService.inputSource['Stream 1'] === 'laptop-camera' && this.laptopCameraDeviceId && this.activeLaptopCameraStreamId === null) {
      const videoElement = this.cameraVideoPlayers.get(this.streams.indexOf('Stream 1'))?.nativeElement;
      if (videoElement) {
        this.startCameraStream(videoElement, 'Stream 1', this.laptopCameraDeviceId, 'laptop');
      }
    }

    if (this.visionService.inputSource['Stream 2'] === 'smartphone-camera' && this.smartphoneCameraDeviceId && this.activeSmartphoneCameraStreamId === null) {
      const videoElement = this.cameraVideoPlayers.get(this.streams.indexOf('Stream 2'))?.nativeElement;
      if (videoElement) {
        this.startCameraStream(videoElement, 'Stream 2', this.smartphoneCameraDeviceId, 'smartphone');
      }
    }
  }

  onInputSourceChange(stream: string, newSource: 'laptop-camera' | 'smartphone-camera' | 'file'): void {
    const streamIndex = this.streams.indexOf(stream);
    if (streamIndex === -1) {
      console.warn(`Stream ${stream} not found.`);
      return;
    }

    this.visionService.stopOperation(stream);

    const cameraVideoElement = this.cameraVideoPlayers.get(streamIndex)?.nativeElement;
    const videoFileElement = this.videoFilePlayers.get(streamIndex)?.nativeElement;

    // Reset current stream's video elements
    if (cameraVideoElement) { cameraVideoElement.srcObject = null; cameraVideoElement.pause(); cameraVideoElement.load(); }
    if (videoFileElement) { videoFileElement.srcObject = null; videoFileElement.pause(); videoFileElement.load(); }


    if (newSource === 'laptop-camera') {
      if (stream !== 'Stream 1') {
        console.warn('Laptop Camera can only be selected for Stream 1. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
        return;
      }
      if (this.laptopCameraDeviceId) {
        if (this.activeLaptopCameraStreamId && this.activeLaptopCameraStreamId !== stream) {
          const oldStreamIndex = this.streams.indexOf(this.activeLaptopCameraStreamId);
          const oldCameraVideoElement = this.cameraVideoPlayers.get(oldStreamIndex)?.nativeElement;
          if (oldCameraVideoElement) this.stopCameraFeed(oldCameraVideoElement);
        }
        this.startCameraStream(cameraVideoElement!, stream, this.laptopCameraDeviceId, 'laptop');
      } else {
        console.error('Laptop camera device not found. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
      }
    } else if (newSource === 'smartphone-camera') {
      if (stream !== 'Stream 2') {
        console.warn('Smartphone Camera can only be selected for Stream 2. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
        return;
      }
      if (this.smartphoneCameraDeviceId) {
        if (this.activeSmartphoneCameraStreamId && this.activeSmartphoneCameraStreamId !== stream) {
          const oldStreamIndex = this.streams.indexOf(this.activeSmartphoneCameraStreamId);
          const oldCameraVideoElement = this.cameraVideoPlayers.get(oldStreamIndex)?.nativeElement;
          if (oldCameraVideoElement) this.stopCameraFeed(oldCameraVideoElement);
        }
        this.startCameraStream(cameraVideoElement!, stream, this.smartphoneCameraDeviceId, 'smartphone');
      } else {
        console.error('Smartphone camera device not found. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
      }
    } else if (newSource === 'file') {
      if (stream === 'Stream 1' && this.activeLaptopCameraStreamId === stream) {
        if (cameraVideoElement) this.stopCameraFeed(cameraVideoElement);
        this.activeLaptopCameraStreamId = null;
      } else if (stream === 'Stream 2' && this.activeSmartphoneCameraStreamId === stream) {
        if (cameraVideoElement) this.stopCameraFeed(cameraVideoElement);
        this.activeSmartphoneCameraStreamId = null;
      }
      // No need to explicitly handle file loading here, the (change) event on input type="file" does it
    } else {
      console.warn(`Invalid input source selected for ${stream}: ${newSource}. Defaulting to file.`);
      this.visionService.inputSource[stream] = 'file';
    }
  }

  private startCameraStream(videoElement: HTMLVideoElement, stream: string, deviceId: string, cameraType: 'laptop' | 'smartphone'): void {
    if (videoElement.srcObject instanceof MediaStream) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: true })
      .then(mediaStream => {
        videoElement.srcObject = mediaStream;
        this.visionService.setMediaStream(stream, mediaStream);
        if (cameraType === 'laptop') {
          this.activeLaptopCameraStreamId = stream;
        } else {
          this.activeSmartphoneCameraStreamId = stream;
        }
        console.log(`${cameraType} camera started for stream: ${stream}`);
      })
      .catch(error => {
        console.error(`Error accessing ${cameraType} camera for stream ${stream}:`, error);
        if (cameraType === 'laptop' && this.activeLaptopCameraStreamId === stream) {
          this.activeLaptopCameraStreamId = null;
        } else if (cameraType === 'smartphone' && this.activeSmartphoneCameraStreamId === stream) {
          this.activeSmartphoneCameraStreamId = null;
        }
        this.visionService.inputSource[stream] = 'file';
        videoElement.srcObject = null;
        videoElement.pause();
        videoElement.load();
      });
  }

  private stopCameraFeed(videoElement: HTMLVideoElement): void {
    if (videoElement.srcObject instanceof MediaStream) {
      videoElement.srcObject.getTracks().forEach(track => track.stop());
      videoElement.srcObject = null;
      console.log(`Stopped camera feed for video element: ${videoElement.id}`);
    }
  }

  startOperation(stream: string, operation: string): void {
    const streamIndex = this.streams.indexOf(stream);
    let activeVideoElement: HTMLVideoElement | null = null;

    if (this.visionService.inputSource[stream] === 'laptop-camera' || this.visionService.inputSource[stream] === 'smartphone-camera') {
      activeVideoElement = this.cameraVideoPlayers.get(streamIndex)?.nativeElement || null;
    } else if (this.visionService.inputSource[stream] === 'file') {
      activeVideoElement = this.videoFilePlayers.get(streamIndex)?.nativeElement || null;
    }

    // Add the operation to the stream
    this.visionService.addOperation(stream, operation as 'stt' | 'stt-openai' | 'translate' | 'faces' | 'ocr');
    this.visionService.invokeOperation(stream, operation, activeVideoElement);
  }

  stopOperation(stream: string, operation: string): void {
    this.visionService.removeOperation(stream, operation as 'stt' | 'stt-openai' | 'translate' | 'faces' | 'ocr');
    // You might want to add logic here to stop the actual operation if needed
  }

  getOverlay(stream: string) {
    return this.visionService.getOverlay(stream);
  }

  // New method to get the dynamic title for each stream
  getStreamTitle(stream: string): string {
    const inputSourceType = this.visionService.inputSource[stream];
    if (inputSourceType === 'laptop-camera') {
      return 'Laptop Webcam';
    } else if (inputSourceType === 'smartphone-camera') {
      return 'Smartphone Camera';
    } else {
      // For file input, use the stored clip name, or a default
      return this.clipNames[stream] || stream; // Fallback to stream name if no clip name
    }
  }

  // New method to get the icon class for each stream
  getStreamIcon(stream: string): string {
    const inputSourceType = this.visionService.inputSource[stream];
    if (inputSourceType === 'laptop-camera') {
      return 'fas fa-laptop'; // Laptop icon
    } else if (inputSourceType === 'smartphone-camera') {
      return 'fas fa-mobile-alt'; // Mobile icon
    } else {
      return 'fas fa-video'; // Generic video/clip icon
    }

    // videocam
  }

  // Modified to handle two lines of captions or other dynamic text
  getCaptions(stream: string): string {
    // This will be the first line of the caption
    return this.visionService.getCaptions(stream);
  }

  getCaptionLine2(stream: string): string {
    // This will be the second line of the caption.
    // You can customize this based on your data structure.
    // For example, if your visionService.captions[stream] is an object with more data.
    // For now, let's just use a placeholder or a secondary piece of info.
    const currentInputSource = this.visionService.inputSource[stream];
    if (currentInputSource === 'file') {
      // Example: show file name or some other metadata
      return `File: ${this.clipNames[stream] || 'Unknown Clip'}`;
    } else if (currentInputSource === 'laptop-camera' || currentInputSource === 'smartphone-camera') {
      return 'Live Feed';
    }
    return '';
  }

  // New method for maximize/minimize functionality
  toggleMaximize(index: number): void {
    if (this.maximizedCardIndex === index) {
      this.maximizedCardIndex = null; // Minimize if already maximized
    } else {
      this.maximizedCardIndex = index; // Maximize the clicked card
    }
  }

  loadVideoFile(event: Event, stream: string, videoPlayer: ElementRef<HTMLVideoElement>): void {
    const videoElement = videoPlayer.nativeElement;
    // Now use videoElement which is of type HTMLVideoElement
    // Rest of your video loading logic here
  }
  
  triggerFileInput(fileInput: HTMLInputElement, stream: string) {
    // First, set the input source to 'file'
    this.visionService.inputSource[stream] = 'file';
    // Then, programmatically click the hidden file input
    fileInput.click();
  }
}