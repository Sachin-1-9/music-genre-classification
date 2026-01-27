import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_BASE = "https://music-genre-classification-yiwe.onrender.com";
const API_URL = `${API_BASE}/predict`;

// Alternative: Try a different endpoint or method
const HEALTH_URL = `${API_BASE}/`;

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

  // Test connection first
  const testConnection = async () => {
    try {
      console.log("Testing connection to:", HEALTH_URL);
      const response = await fetch(HEALTH_URL, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        headers: {
          'Cache-Control': 'no-cache',
        }
      });
      console.log("Connection test response:", response.status, response.statusText);
      return response.ok;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  };

  // Manual connection test for debugging
  const handleTestConnection = async () => {
    setBusy(true);
    setErr("");
    const connected = await testConnection();
    if (connected) {
      setResult({message: "Connection successful!", genre: "test"});
      setProgress(100);
    } else {
      setErr("Connection failed - check console for details");
    }
    setBusy(false);
  };

  // Upload with progress using XHR (with fetch fallback)
  const predict = async () => {
    if (!file) {
      setErr("Please choose an audio/video file first.");
      return;
    }

    setBusy(true);
    setErr("");
    setResult(null);
    setProgress(0);

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      setErr("Cannot connect to backend. Please check your internet connection and try again.");
      setBusy(false);
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    try {
      // Try a simpler approach - no timestamp, just basic fetch
      const response = await fetch(API_URL, {
        method: 'POST',
        body: fd,
        mode: 'cors',
        credentials: 'omit',
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        setProgress(100);
      } else {
        setErr(data?.error || `Request failed (${response.status})`);
      }
    } catch (fetchError) {
      // Fallback to XHR if fetch fails
      console.log("Fetch failed, trying XHR:", fetchError);
      predictWithXHR(fd);
    } finally {
      setBusy(false);
    }
  };

  // XHR fallback method
  const predictWithXHR = (fd) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", API_URL, true);
    
    // Minimal headers to avoid issues
    xhr.setRequestHeader("Accept", "application/json");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const p = Math.round((e.loaded / e.total) * 100);
        setProgress(p);
      }
    };

    xhr.onload = () => {
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
      console.error("Network error details:", {
        status: xhr.status,
        statusText: xhr.statusText,
        response: xhr.responseText,
        readyState: xhr.readyState
      });
      setErr(`Network error. Backend not reachable. Status: ${xhr.status}`);
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

        <div className="pill">🎧</div>
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

              <button className="btn outline" onClick={handleTestConnection} disabled={busy}>
                {busy ? "Testing..." : "Test Connection"}
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
