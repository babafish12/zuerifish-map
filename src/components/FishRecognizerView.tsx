import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Camera, Fish, ImageUp, LoaderCircle, ScanSearch, Server, X } from "lucide-react";
import { FishRecognitionError, recognizeFishImage, validateFishImageFile } from "../lib/fishRecognition";
import type { FishRecognitionObject, FishRecognitionResult } from "../lib/fishRecognition";

type RecognitionStatus = "idle" | "ready" | "running" | "done" | "error";

export function FishRecognizerView() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const recognitionRequestIdRef = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);
  const [status, setStatus] = useState<RecognitionStatus>("idle");
  const [recognitionResult, setRecognitionResult] = useState<FishRecognitionResult | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;

    if (!file) {
      return;
    }

    const validationError = validateFishImageFile(file);

    if (validationError) {
      recognitionRequestIdRef.current += 1;
      event.currentTarget.value = "";
      setInputError(validationError);
      setSelectedFile(null);
      setRecognitionResult(null);
      setStatus("error");
      clearPreviewUrl();
      return;
    }

    recognitionRequestIdRef.current += 1;
    setSelectedFile(file);
    setInputError(null);
    setRecognitionResult(null);
    setStatus("ready");

    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null;
    });
  }

  function clearImage() {
    recognitionRequestIdRef.current += 1;
    clearPreviewUrl();
    setSelectedFile(null);
    setInputError(null);
    setRecognitionResult(null);
    setStatus("idle");

    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }

    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  }

  async function recognizeSelectedImage() {
    if (!selectedFile) {
      setInputError("Bitte zuerst ein Fischfoto auswählen.");
      setStatus("error");
      return;
    }

    setInputError(null);
    setRecognitionResult(null);
    setStatus("running");
    const requestId = recognitionRequestIdRef.current + 1;
    recognitionRequestIdRef.current = requestId;

    try {
      const result = await recognizeFishImage(selectedFile);
      if (recognitionRequestIdRef.current !== requestId) {
        return;
      }

      setRecognitionResult(result);
      setStatus("done");
    } catch (error) {
      if (recognitionRequestIdRef.current !== requestId) {
        return;
      }

      const message =
        error instanceof FishRecognitionError || error instanceof Error ? error.message : "Die Online-Erkennung ist fehlgeschlagen.";
      setInputError(message);
      setStatus("error");
    }
  }

  const isRecognizing = status === "running";
  const selectedFileSize = selectedFile ? formatFileSize(selectedFile.size) : null;

  function clearPreviewUrl() {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return null;
    });
  }

  return (
    <main className="app-page recognizer-page" aria-labelledby="fish-recognizer-title">
      <header className="page-heading recognizer-heading">
        <div>
          <h2 id="fish-recognizer-title">Fischerkenner</h2>
          <p>Kamera oder Foto auswählen und online bestimmen lassen.</p>
        </div>
        <span className="recognizer-model-pill">Online-API, kein Modell-Download</span>
      </header>

      <section className="recognizer-shell" aria-label="Online-Fischerkennung">
        <div className="recognizer-toolbar">
          <div className="recognizer-provider">
            <span aria-hidden="true">
              <Server size={20} />
            </span>
            <div>
              <strong>Fishial API Wrapper</strong>
              <small>Server-Proxy /api/fish-recognition</small>
            </div>
          </div>

          <div className="recognizer-modes" aria-label="Eingabearten wählen">
            <button type="button" onClick={() => cameraInputRef.current?.click()}>
              <Camera size={16} aria-hidden="true" />
              <span>Kamera</span>
            </button>
            <button type="button" onClick={() => uploadInputRef.current?.click()}>
              <ImageUp size={16} aria-hidden="true" />
              <span>Foto</span>
            </button>
          </div>
        </div>

        <input
          ref={cameraInputRef}
          className="recognizer-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Fischfoto mit Kamera aufnehmen"
          onChange={chooseImage}
        />
        <input
          ref={uploadInputRef}
          className="recognizer-file-input"
          type="file"
          accept="image/*"
          aria-label="Fischfoto für Vorschau auswählen"
          onChange={chooseImage}
        />

        <div className="recognizer-workspace">
          <div className="recognizer-preview" aria-live="polite">
            {previewUrl ? <img src={previewUrl} alt={selectedFile ? `Vorschau ${selectedFile.name}` : "Fischfoto Vorschau"} /> : null}
            {!previewUrl ? (
              <div className="recognizer-empty">
                <ImageUp size={42} aria-hidden="true" />
                <strong>Bild bereitstellen</strong>
                <span>Kamera starten oder Foto auswählen.</span>
              </div>
            ) : null}
          </div>

          <div className="recognizer-action-panel">
            <h3>Online-Erkennung</h3>
            <p>Das Foto wird an den lokalen Server-Wrapper gesendet. API-Credentials bleiben serverseitig in der Umgebung.</p>
            {selectedFile ? (
              <div className="recognizer-selected-file">
                <span>
                  {selectedFile.name}
                  {selectedFileSize ? ` · ${selectedFileSize}` : ""}
                </span>
                <button type="button" aria-label="Ausgewähltes Bild entfernen" onClick={clearImage}>
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}
            {inputError ? <p className="recognizer-error">{inputError}</p> : null}
            <button
              className="recognizer-primary-button"
              type="button"
              disabled={!selectedFile || isRecognizing}
              aria-busy={isRecognizing}
              onClick={recognizeSelectedImage}
            >
              {isRecognizing ? <LoaderCircle size={17} aria-hidden="true" /> : <ScanSearch size={17} aria-hidden="true" />}
              <span>{isRecognizing ? "Erkenne online" : "Online erkennen"}</span>
            </button>

            {recognitionResult ? <RecognitionResults result={recognitionResult} /> : null}
          </div>
        </div>
      </section>

      <p className="recognizer-disclaimer">
        Ergebnis nur als Bestimmungshilfe verwenden; Fangregeln und Schonzeiten bleiben die massgebliche Kontrolle in der App.
      </p>
    </main>
  );
}

function RecognitionResults({ result }: { result: FishRecognitionResult }) {
  if (result.objects.length === 0) {
    return (
      <div className="recognizer-empty-result" role="status">
        <Fish size={18} aria-hidden="true" />
        <span>Kein Fisch sicher erkannt. Probiere ein helleres, näher aufgenommenes Foto.</span>
      </div>
    );
  }

  return (
    <div className="recognizer-results" aria-label="Erkennungsergebnisse">
      <p className="recognizer-result-summary">
        {result.objects.length === 1 ? "1 erkannter Fisch" : `${result.objects.length} erkannte Fische`}
      </p>
      {result.objects.map((object, index) => (
        <RecognizedFishObject key={`${index}-${object.bbox?.join("-") ?? "fish"}`} object={object} index={index} />
      ))}
    </div>
  );
}

function RecognizedFishObject({ object, index }: { object: FishRecognitionObject; index: number }) {
  const candidates = object.species.slice(0, 3);
  const bestCandidate = candidates[0];

  return (
    <article className="recognizer-result">
      <div className="recognizer-result-header">
        <div>
          <strong>{bestCandidate?.commonName ?? `Fisch ${index + 1}`}</strong>
          <span>{bestCandidate?.scientificName ?? "Keine Art-Kandidaten zurückgegeben"}</span>
        </div>
        {bestCandidate?.imageUrl ? <img src={bestCandidate.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" /> : null}
      </div>

      {candidates.length > 0 ? (
        <div className="recognizer-candidates">
          {candidates.map((candidate) => {
            const percent = Math.round(candidate.certainty * 100);

            return (
              <div key={candidate.id} className="recognizer-confidence" aria-label={`${candidate.commonName} ${percent} Prozent`}>
                <span>{percent}%</span>
                <div>
                  <i style={{ width: `${Math.min(percent, 100)}%` }} />
                </div>
                <small>{candidate.commonName}</small>
              </div>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

function formatFileSize(size: number): string {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
