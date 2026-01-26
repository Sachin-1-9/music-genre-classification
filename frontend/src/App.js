import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:5000/predict";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 2)} ${units[i]}`;
}

function isVideoFile(file) {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return [".mp4", ".mov", ".mkv", ".avi", ".webm"].some((x) => name.endsWith(x));
}

export default function App() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");

  const inputRef = useRef(null);

  const supportedText = useMemo(
    () => "Supported: mp3, wav, flac, ogg, m4a, au, aiff + mp4, mov, mkv, avi, webm",
    []
  );

  useEffect(() => {
    // cleanup old preview URL
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChoose = (e) => {
    const f = e.target.files?.[0];
    setErr("");
    setResult(null);
    setProgress(0);

    if (!f) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
  };

  const resetAll = () => {
    setFile(null);
    setPreviewUrl("");
    setBusy(false);
    setProgress(0);
    setResult(null);
    setErr("");
    if (inputRef.current) inputRef.current.value = "";
  };

  // Upload with progress using XHR
  const predict = () => {
    if (!file) {
      setErr("Please choose an audio/video file first.");
      return;
    }

    setBusy(true);
    setErr("");
    setResult(null);
    setProgress(0);

    const fd = new FormData();
    fd.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const p = Math.round((e.loaded / e.total) * 100);
        setProgress(p);
      }
    };

    xhr.onload = () => {
      setBusy(false);
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          setResult(data);
          setProgress(100);
        } else {
          setErr(data?.error || `Request failed (${xhr.status})`);
        }
      } catch {
        setErr("Invalid JSON response from backend.");
      }
    };

    xhr.onerror = () => {
      setBusy(false);
      setErr("Network error. Backend not reachable.");
    };

    xhr.send(fd);
  };

  return (
    <div className="page">
      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <div className="brandIcon" />
          <div className="brandText">
            <div className="brandTitle">Music Genre Classification</div>
            <div className="brandSub">Upload audio/video → predict genre</div>
          </div>
        </div>

        <div className="pill">React UI</div>
      </header>

      {/* Layout */}
      <main className={`layout ${previewUrl ? "hasPreview" : ""}`}>
        {/* Left: Upload */}
        <section className="panel">
          <h2 className="h2">Upload & Predict</h2>
          <p className="muted">{supportedText}</p>

          <div className="glassBox">
            <div className="row">
              <div className="k">Selected file</div>
              <div className="v">{file ? file.name : "-"}</div>
            </div>
            <div className="row">
              <div className="k">File size</div>
              <div className="v">{file ? formatBytes(file.size) : "-"}</div>
            </div>
            {/* <div className="row">
              <div className="k">Backend URL</div>
              <div className="v mono">{API_URL}</div>
            </div> */}

            <div className="btnRow">
              <label className="btn outline">
                Choose file
                <input
                  ref={inputRef}
                  type="file"
                  onChange={onChoose}
                  accept=".mp3,.wav,.flac,.ogg,.m4a,.au,.aiff,.aif,.mp4,.mov,.mkv,.avi,.webm"
                  hidden
                />
              </label>

              <button className="btn primary" onClick={predict} disabled={!file || busy}>
                {busy ? "Predicting..." : "Predict Genre"}
              </button>

              <button className="btn ghost" onClick={resetAll} disabled={busy}>
                Reset
              </button>
            </div>

            {(busy || progress > 0) && (
              <div className="progressWrap">
                <div className="progressLabel">
                  <span>Upload progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="progressBar">
                  <div className="progressFill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {result && (
              <div className="resultCard">
                <div className="resultTitle">Prediction</div>
                <div className="genreGlow">{String(result.genre || "").toLowerCase()}</div>
                <div className="resultMeta">
                  Source: {result.source || "-"} • Features: {result.features_used ?? "-"}
                </div>
              </div>
            )}

            {err && (
              <div className="errorCard">
                <div className="errorTitle">⚠️ Error</div>
                <div className="errorMsg">{err}</div>
              </div>
            )}
          </div>
        </section>

        {/* Right: Preview (ONLY AFTER UPLOAD) */}
        {previewUrl && (
          <section className="panel previewPanel">
            <h2 className="h2">Preview</h2>
            <p className="muted">Preview fits screen on laptop. On mobile, scrolling is enabled.</p>

            <div className="previewShell">
              {isVideoFile(file) ? (
                <video className="media" controls src={previewUrl} />
              ) : (
                <audio className="media audio" controls src={previewUrl} />
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">Developed by Sachin D</footer>
    </div>
  );
}
