import { Component, AfterViewInit, QueryList, ViewChildren, ElementRef, OnInit } from '@angular/core';
import { VisionService } from '../services/vision.service';
import { FormControl } from '@angular/forms';
import { Observable, startWith, map } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { HttpClient } from '@angular/common/http';
import { allLanguages } from './allLanguages';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements AfterViewInit, OnInit {
  streams = ['Stream 1', 'Stream 2', 'Stream 3', 'Stream 4'];

  @ViewChildren('cameraVideoPlayer') cameraVideoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  @ViewChildren('videoFilePlayer') videoFilePlayers!: QueryList<ElementRef<HTMLVideoElement>>;

  laptopCameraDeviceId: string | null = null;
  smartphoneCameraDeviceId: string | null = null;

  private activeLaptopCameraStreamId: string | null = null;
  private activeSmartphoneCameraStreamId: string | null = null;

  maximizedCardIndex: number | null = null;//track the maximized card

  languageControls: { [stream: string]: FormControl } = {};
  filteredLanguages: { [stream: string]: Observable<any[]> } = {};
  allLanguages: any[] = [];

  streamTitles: Record<string, string> = {
    'Stream 1': 'Laptop Webcam',
    'Stream 2': 'Smartphone Camera',
    'Stream 3': 'Clip 1',
    'Stream 4': 'Clip 2'
  };


  clipNames: Record<string, string> = {
    'Stream 1': 'Laptop Webcam',
    'Stream 2': 'Smartphone Camera',
    'Stream 3': 'Clip 1',
    'Stream 4': 'Clip 2'
  };

  constructor(private http: HttpClient, public visionService: VisionService) {
    // Initialize input sources to default to file for all streams
    this.streams.forEach(stream => {
      this.visionService.inputSource[stream] = 'file'; // Default to file input for all streams
    });
  }

  ngOnInit() {
    // Initialize languages from allLanguages.ts
    this.allLanguages = allLanguages;

    this.streams.forEach(stream => {
      this.languageControls[stream] = new FormControl('');
      this.filteredLanguages[stream] = this.languageControls[stream].valueChanges.pipe(
        startWith(''),
        map(value => this.filterLanguages(value || ''))
      );
    });
  }

  private filterLanguages(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.allLanguages.filter(lang =>
      lang.displayName.toLowerCase().includes(filterValue) ||
      lang.isocode.toLowerCase().includes(filterValue)
    );
  }

  onLanguageSelected(event: MatAutocompleteSelectedEvent, stream: string) {
    const selected = this.allLanguages.find(l =>
      `${l.englishName} (${l.azureLocaleCode})` === event.option.value ||
      l.englishName === event.option.value
    );

    if (selected) {
      this.visionService.setLanguageForStream(stream, selected.azureLocaleCode); // 🔁 Use azureLocaleCode
      this.languageControls[stream].setValue(`${selected.englishName} (${selected.azureLocaleCode})`, { emitEvent: false });
    }
  }

  getSelectedLanguageDisplay(stream: string): string {
    const code = this.visionService.selectedLanguages[stream];
    const lang = this.allLanguages.find(l => l.isocode === code || l.azureLocaleCode === code);
    return lang ? `${lang.englishName} (${lang.azureLocaleCode})` : '';
  }

  ngAfterViewInit(): void {
    console.log('DashboardComponent: Starting initialization...');

    // First, set up camera devices
    this.setupCameraDevices().then(() => {
      console.log('DashboardComponent: Camera devices setup completed');

      // Wait a moment to ensure devices are fully initialized
      setTimeout(() => {
        // Initialize camera streams if devices are available
        this.initializeCameraStreams();

        // Subscribe to changes in cameraVideoPlayers
        this.cameraVideoPlayers.changes.subscribe(() => {
          console.log('DashboardComponent: Camera video players changed');
          this.initializeCameraStreams();
        });
      }, 1000);
    }).catch(error => {
      console.error('DashboardComponent: Error during initialization:', error);
    });
  }

  private async setupCameraDevices(): Promise<void> {
    try {
      console.log('DashboardComponent: Starting camera device setup...');

      // Get available camera devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('DashboardComponent: Found devices:', devices);

      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('DashboardComponent: Found video devices:', videoDevices.length);

      // Try to get laptop camera device
      for (const device of videoDevices) {
        const label = device.label.toLowerCase();
        if (label.includes('laptop') ||
          label.includes('webcam') ||
          label.includes('front') ||
          label.includes('internal')) {
          this.laptopCameraDeviceId = device.deviceId;
          console.log('DashboardComponent: Found laptop camera:', device.label);
          break;
        }
      }

      // Try to get smartphone camera device
      for (const device of videoDevices) {
        const label = device.label.toLowerCase();
        if (label.includes('mobile') ||
          label.includes('phone') ||
          label.includes('back') ||
          label.includes('external')) {
          this.smartphoneCameraDeviceId = device.deviceId;
          console.log('DashboardComponent: Found smartphone camera:', device.label);
          break;
        }
      }

      // If no specific devices were found, try to get any available video device
      if (!this.laptopCameraDeviceId && videoDevices.length > 0) {
        this.laptopCameraDeviceId = videoDevices[0].deviceId;
        console.log('DashboardComponent: Using first available camera as laptop camera');
      }

      if (!this.smartphoneCameraDeviceId && videoDevices.length > 1) {
        this.smartphoneCameraDeviceId = videoDevices[1].deviceId;
        console.log('DashboardComponent: Using second available camera as smartphone camera');
      }

      console.log('DashboardComponent: Camera devices initialized:', {
        laptopCameraDeviceId: this.laptopCameraDeviceId,
        smartphoneCameraDeviceId: this.smartphoneCameraDeviceId,
        videoDevicesCount: videoDevices.length
      });

      // Wait a moment to ensure devices are properly initialized
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error('DashboardComponent: Error setting up camera devices:', error);
      this.laptopCameraDeviceId = null;
      this.smartphoneCameraDeviceId = null;
    }
  }

  private initializeCameraStreams(): void {
    console.log('DashboardComponent: Initializing camera streams...');

    // First check if we have camera device IDs
    if (!this.laptopCameraDeviceId || !this.smartphoneCameraDeviceId) {
      console.log('DashboardComponent: No camera devices available, skipping initialization');
      return;
    }

    // Initialize Stream 1 with laptop camera if selected
    if (this.visionService.inputSource['Stream 1'] === 'laptop-camera' &&
      this.laptopCameraDeviceId &&
      this.activeLaptopCameraStreamId === null) {
      console.log('DashboardComponent: Starting laptop camera for Stream 1');
      const videoElement = this.cameraVideoPlayers.get(0)?.nativeElement;
      if (videoElement) {
        this.startCameraStreamWithRetry(videoElement, 'Stream 1', this.laptopCameraDeviceId, 'laptop');
      }
    }

    // Initialize Stream 2 with smartphone camera if selected
    if (this.visionService.inputSource['Stream 2'] === 'smartphone-camera' &&
      this.smartphoneCameraDeviceId &&
      this.activeSmartphoneCameraStreamId === null) {
      console.log('DashboardComponent: Starting smartphone camera for Stream 2');
      const videoElement = this.cameraVideoPlayers.get(1)?.nativeElement;
      if (videoElement) {
        this.startCameraStreamWithRetry(videoElement, 'Stream 2', this.smartphoneCameraDeviceId, 'smartphone');
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
  
    // Get video elements
    const cameraVideoElement = this.cameraVideoPlayers.get(streamIndex)?.nativeElement;
    const videoFileElement = this.videoFilePlayers.get(streamIndex)?.nativeElement;
  
    // Reset video elements
    if (cameraVideoElement) {
      cameraVideoElement.srcObject = null;
      cameraVideoElement.pause();
      cameraVideoElement.load();
    }
    if (videoFileElement) {
      videoFileElement.srcObject = null;
      videoFileElement.pause();
      videoFileElement.load();
    }
  
    // Update input source
    this.visionService.inputSource[stream] = newSource;
  
    // Set input name accordingly
    if (newSource === 'file') {
      this.visionService.inputNames[stream] = 'No file selected';
    } else {
      this.visionService.inputNames[stream] = 'Live Feed';
    }
  
    // Start camera stream if needed
    if (newSource === 'laptop-camera') {
      if (stream !== 'Stream 1') {
        console.warn('Laptop Camera can only be selected for Stream 1. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
        this.visionService.inputNames[stream] = 'No file selected';
        return;
      }
      if (this.laptopCameraDeviceId) {
        this.startCameraStreamWithRetry(cameraVideoElement!, stream, this.laptopCameraDeviceId, 'laptop');
      } else {
        console.error('Laptop camera device not found. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
        this.visionService.inputNames[stream] = 'No file selected';
      }
    } else if (newSource === 'smartphone-camera') {
      if (stream !== 'Stream 2') {
        console.warn('Smartphone Camera can only be selected for Stream 2. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
        this.visionService.inputNames[stream] = 'No file selected';
        return;
      }
      if (this.smartphoneCameraDeviceId) {
        this.startCameraStreamWithRetry(cameraVideoElement!, stream, this.smartphoneCameraDeviceId, 'smartphone');
      } else {
        console.error('Smartphone camera device not found. Reverting to file.');
        this.visionService.inputSource[stream] = 'file';
        this.visionService.inputNames[stream] = 'No file selected';
      }
    }
  }
  

  private startCameraStreamWithRetry(
    videoElement: HTMLVideoElement,
    stream: string,
    deviceId: string,
    cameraType: 'laptop' | 'smartphone',
    retries = 3
  ): void {
    if (!videoElement) {
      if (retries > 0) {
        console.log(`DashboardComponent: Video element not found for stream ${stream}, retrying... (${retries} attempts left)`);
        setTimeout(() => {
          const streamIndex = this.streams.indexOf(stream);
          const videoEl = this.cameraVideoPlayers.get(streamIndex)?.nativeElement;
          this.startCameraStreamWithRetry(videoEl!, stream, deviceId, cameraType, retries - 1);
        }, 300);
      } else {
        console.error(`DashboardComponent: Failed to find video element for stream ${stream} after retries.`);
      }
      return;
    }

    navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId } },
      audio: true
    })
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
        console.error(`DashboardComponent: Error accessing ${cameraType} camera for stream ${stream}:`, error);
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

  startOperation(stream: string, operation: string): void {
    const streamIndex = this.streams.indexOf(stream);
    let activeVideoElement: HTMLVideoElement | null = null;

    if (this.visionService.inputSource[stream] === 'laptop-camera' || this.visionService.inputSource[stream] === 'smartphone-camera') {
      activeVideoElement = this.cameraVideoPlayers.get(streamIndex)?.nativeElement || null;
    } else if (this.visionService.inputSource[stream] === 'file') {
      activeVideoElement = this.videoFilePlayers.get(streamIndex)?.nativeElement || null;
    }

    // Add the operation to the stream
    this.visionService.addOperation(stream, operation as 'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr');
    this.visionService.invokeOperation(stream, operation, activeVideoElement);
  }

  stopOperation(stream: string, operation: string): void {
    this.visionService.removeOperation(stream, operation as 'stt-azure' | 'stt-openai' | 'translate' | 'faces' | 'ocr' | 'alpr');
    // You might want to add logic here to stop the actual operation if needed
  }

  getOverlay(stream: string) {
    return this.visionService.getOverlay(stream);
  }

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

  getCaptions(stream: string): string {
    // This will be the first line of the caption
    return this.visionService.getCaptions(stream);
  }

  getInputName(stream: string): string {
    const currentInputSource = this.visionService.inputSource[stream];

    if (currentInputSource === 'file') {
      return this.clipNames[stream] || 'No file selected';
    } else if (
      currentInputSource === 'laptop-camera' ||
      currentInputSource === 'smartphone-camera'
    ) {
      return 'Live Feed';
    }

    return '';
  }

  toggleMaximize(index: number): void {
    if (this.maximizedCardIndex === index) {
      this.maximizedCardIndex = null; // Minimize if already maximized
    } else {
      this.maximizedCardIndex = index; // Maximize the clicked card
    }
  }

  triggerFileInput(fileInput: HTMLInputElement, stream: string) {
    // First, set the input source to 'file'
    this.visionService.inputSource[stream] = 'file';
    // Then, programmatically click the hidden file input
    fileInput.click();
  }
}


  // loadVideoFile(event: Event, stream: string, videoPlayer: ElementRef<HTMLVideoElement>): void {
  //   const fileInput = event.target as HTMLInputElement;
  //   const file = fileInput.files?.[0];
  //   if (!file) return;

  //   const videoElement = videoPlayer.nativeElement;
  //   const fileUrl = URL.createObjectURL(file);

  //   videoElement.src = fileUrl;
  //   videoElement.load();
  //   videoElement.play();

  //   // Update the input name for this stream
  //   this.inputNames[stream] = file.name;

  //   fileInput.value = '';
  // }