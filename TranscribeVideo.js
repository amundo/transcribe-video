class TranscribeVideo extends HTMLElement {
  constructor() {
    super();
    this.videoElement = document.createElement('video');
    this.textareaElement = document.createElement('textarea');
    this.downloadButton = document.createElement('button');

    this.videoElement.controls = true;
    this.downloadButton.textContent = 'Download WebVTT';

    this.appendChild(this.videoElement);
    this.appendChild(this.textareaElement);
    this.appendChild(this.downloadButton);

    this.textareaElement.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.downloadButton.addEventListener('click', () => this.downloadWebVTT());
  }

  connectedCallback() {
    this.style.display = 'flex';
    this.style.flexDirection = 'column';
    this.textareaElement.style.marginTop = '10px';
    this.textareaElement.style.height = '150px';
  }

  handleKeydown(e) {
    // Handle spacebar for play/pause while focused on textarea
    if (e.code === 'Escape') {
      e.preventDefault();
      if (this.videoElement.paused) {
        this.videoElement.play();
      } else {
        this.videoElement.pause();
      }
    }
  }

  downloadWebVTT() {
    const content = this.textareaElement.value;
    const blob = new Blob([`WEBVTT\n\n${content}`], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcription.vtt';
    a.click();
    URL.revokeObjectURL(url);
  }

  set video(blob) {
    this.videoElement.src = URL.createObjectURL(blob);
  }

  set src(url) {
    this.videoElement.src = url;
  }

  get video() {
    return this.videoElement.src;
  }
}

customElements.define('transcribe-video', TranscribeVideo);


export {TranscribeVideo}
