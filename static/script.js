const { createFFmpeg, fetchFile } = FFmpeg;
const ffmpeg = createFFmpeg({ log: true });

async function convertAudio(inputBlob) {
    console.log('Loading ffmpeg...');
    await ffmpeg.load();
    console.log('Writing input file to ffmpeg...');
    ffmpeg.FS('writeFile', 'input.webm', await fetchFile(inputBlob));
    console.log('Running ffmpeg...');
    await ffmpeg.run('-i', 'input.webm', 'output.wav');
    console.log('Reading output file from ffmpeg...');
    const data = ffmpeg.FS('readFile', 'output.wav');
    console.log('Converting output to Blob...');
    const audioFile = new Blob([data.buffer], { type: 'audio/wav' });
    return audioFile;
}

let mediaRecorder;
let audioChunks = [];
const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const status = document.getElementById('status');

startButton.addEventListener('click', async () => {
    console.log('Start button clicked');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = event => {
        console.log('Data available:', event.data);
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        console.log('Media recorder stopped');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('Audio Blob:', audioBlob);

        // Convert audioBlob to WAV using ffmpeg
        const audioFile = await convertAudio(audioBlob);
        console.log('Converted audio file:', audioFile);

        const formData = new FormData();
        formData.append('audio_file', audioFile, 'audio.wav');

        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.transcription) {
            alert(`Transcription: ${result.transcription}`);
        } else {
            alert(`Error: ${result.error}`);
        }

        audioChunks = [];
    };

    mediaRecorder.start();
    status.textContent = 'Recording...';
    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener('click', () => {
    console.log('Stop button clicked');
    mediaRecorder.stop();
    status.textContent = 'Recording stopped.';
    startButton.disabled = false;
    stopButton.disabled = true;
});
