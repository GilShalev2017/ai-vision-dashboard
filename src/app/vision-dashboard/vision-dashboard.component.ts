import { Component } from '@angular/core';

@Component({
  selector: 'app-vision-dashboard',
  templateUrl: './vision-dashboard.component.html',
  styleUrl: './vision-dashboard.component.scss',
  standalone: false
})
export class VisionDashboardComponent {
  cards = [
    {
      title: 'Laptop Webcam',
      id: 'Stream 1',
      icon: 'videocam',
      allowCamera: true,
      inputSource: 'file',
      videoSrc: 'assets/video1.mp4'
    },
    {
      title: 'Smartphone Camera',
      id: 'Stream 2',
      icon: 'stay_current_portrait',
      allowCamera: true,
      inputSource: 'file',
      videoSrc: 'assets/video2.mp4'
    },
    {
      title: 'Clip 1',
      id: 'Stream 3',
      icon: 'directions_car',
      allowCamera: false,
      inputSource: 'file',
      videoSrc: 'assets/video3.mp4'
    },
    {
      title: 'Clip 2',
      id: 'Stream 4',
      icon: 'school',
      allowCamera: false,
      inputSource: 'file',
      videoSrc: 'assets/video4.mp4'
    }
  ];

  features = ['Transcription', 'Translation', 'Face Detection', 'OCR', 'License Plate Detection'];

  onInputSourceChange(stream: any, value: string) {
    stream.inputSource = value;
  }
}
