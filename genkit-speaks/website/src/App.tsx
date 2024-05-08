import { useState } from "react";
import { PlayIcon, StopIcon } from "@heroicons/react/24/solid";

const ENDPOINT = "/transcribe";

function App() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleAudioDataAvailable =
    (audioChunks: Blob[]) => (event: BlobEvent) => {
      audioChunks.push(event.data);
    };

  const handleRecordingStop = (audioChunks: Blob[]) => () => {
    const audio = new Blob(audioChunks, { type: "audio/webm" });
    setIsRecording(false);
    uploadAudio(audio);
  };

  const startRecording = async () => {
    if (isPlaying) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);

      const audioChunks: Blob[] = [];
      recorder.ondataavailable = handleAudioDataAvailable(audioChunks);
      recorder.onstop = handleRecordingStop(audioChunks);

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Failed to access microphone!");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    mediaRecorder?.stream.getTracks().forEach((track) => track.stop());
  };

  const uploadAudio = async (audio: Blob) => {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        body: audio,
        headers: { "Content-Type": "audio/webm" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const responseData = await response.json();
      const arrayBuffer = new Uint8Array(responseData.synthesized.data).buffer;
      const audioBuffer = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(audioBuffer);
      setAudioUrl(url);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed! " + error);
    }
  };

  return (
    <div className="App bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-gray-700 mb-8">Genkit Speaks</h1>
      {isRecording ? (
        <button
          onClick={stopRecording}
          className="bg-red-500 rounded-full p-4 hover:bg-red-700 text-white font-bold focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center"
        >
          <StopIcon className="h-6 w-6" />
        </button>
      ) : (
        <button
          onClick={startRecording}
          disabled={isPlaying}
          className={`bg-green-500 rounded-full p-4 text-white font-bold focus:outline-none focus:shadow-outline transition duration-150 ease-in-out flex items-center justify-center ${
            !isPlaying ? "hover:bg-green-700" : ""
          }`}
        >
          <PlayIcon className="h-6 w-6" />
        </button>
      )}
      <div className="mt-8">
        {audioUrl && (
          <audio
            controls
            src={audioUrl}
            onPlay={() => setIsPlaying(true)}
            onEnded={() => setIsPlaying(false)}
            autoPlay
            className="w-full max-w-lg"
          />
        )}
      </div>
    </div>
  );
}

export default App;
