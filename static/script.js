let mediaRecorder;
let audioChunks = [];
const startButton = document.getElementById('startRecording');
const stopButton = document.getElementById('stopRecording');
const status = document.getElementById('status');
const notesContainer = document.getElementById('notes');

startButton.addEventListener('click', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio_file', audioBlob, 'audio.webm');

        const response = await fetch('/transcribe', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.transcription) {
            const newNote = document.createElement('li');
            newNote.style.backgroundColor = 'white';
            newNote.textContent = result.transcription;

            const highlightLink = document.createElement('a');
            highlightLink.href = `/highlight/${result.note_id}`;
            highlightLink.textContent = 'Highlight';
            newNote.appendChild(highlightLink);

            notesContainer.appendChild(newNote);
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
    mediaRecorder.stop();
    status.textContent = 'Recording stopped.';
    startButton.disabled = false;
    stopButton.disabled = true;
});
