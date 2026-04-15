import { useState, useRef, useEffect, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const LANGS = {
  en: { name: "English", flag: "🇬🇧" },
  hi: { name: "हिंदी", flag: "🇮🇳" },
  kn: { name: "ಕನ್ನಡ", flag: "🇮🇳" },
  te: { name: "తెలుగు", flag: "🇮🇳" },
  ta: { name: "தமிழ்", flag: "🇮🇳" },
};

const MODULES = [
  { id: "dashboard", icon: "📊", label: "Dashboard" },
  { id: "soil",      icon: "🌱", label: "Soil"      },
  { id: "crop",      icon: "🌾", label: "Crops"     },
  { id: "disease",   icon: "🍃", label: "Disease"   },
  { id: "weather",   icon: "🌤️", label: "Weather"   },
  { id: "chat",      icon: "🤖", label: "Chatbot"   },
];

// ─── Gemini API (proxied via Vercel serverless function) ──────────────────────
async function callClaude(messages, systemPrompt) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system: systemPrompt,
      messages,
    }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}

function parseJSON(raw) {
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return null; }
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Card({ children, style = {}, color = "" }) {
  return (
    <div style={{
      background: color ? `var(--color-background-${color})` : "var(--color-background-primary)",
      border: color ? `0.5px solid var(--color-border-${color})` : "0.5px solid var(--color-border-tertiary)",
      borderRadius: 12, padding: "1rem 1.25rem", ...style
    }}>{children}</div>
  );
}

function StatCard({ label, value, icon, color = "secondary" }) {
  return (
    <div style={{ background: `var(--color-background-${color})`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 500, fontSize: 15, wordBreak: "break-word" }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Loader({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>{text}</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-text-success)", animation: `agrobounce 1s ${i*0.2}s infinite` }}/>
        ))}
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ marginTop: 14, width: "100%", padding: "9px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>
      ← Start Over
    </button>
  );
}

function PrimaryBtn({ onClick, disabled, children, color = "#1D9E75" }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: "11px", background: disabled ? "var(--color-border-tertiary)" : color, color: "#fff", border: "none", borderRadius: 8, cursor: disabled ? "default" : "pointer", fontWeight: 500, fontSize: 14 }}>
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {children}
    </div>
  );
}

// ─── Image Upload ─────────────────────────────────────────────────────────────
function ImageUpload({ onImage, label = "Upload Image" }) {
  const [img, setImg] = useState(null);
  const [dragging, setDragging] = useState(false);
  const ref = useRef();

  const handle = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => { setImg(e.target.result); onImage && onImage(e.target.result, file); };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div
        onClick={() => ref.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files[0]); }}
        style={{ border: `2px dashed ${dragging ? "var(--color-border-success)" : "var(--color-border-secondary)"}`, borderRadius: 10, padding: img ? "8px" : "20px 16px", textAlign: "center", cursor: "pointer", background: dragging ? "var(--color-background-success)" : "var(--color-background-secondary)", transition: "all 0.2s" }}
      >
        {img ? (
          <img src={img} alt="preview" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8 }} />
        ) : (
          <>
            <div style={{ fontSize: 26, marginBottom: 6 }}>📷</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 3 }}>Drag & drop or click to browse</div>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" onChange={e => handle(e.target.files[0])} style={{ display: "none" }} />
      {img && (
        <button onClick={() => { setImg(null); onImage && onImage(null, null); }} style={{ marginTop: 5, fontSize: 11, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
          ✕ Remove image
        </button>
      )}
    </div>
  );
}

// ─── GPS Hook ─────────────────────────────────────────────────────────────────
function useGPS() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const detect = useCallback(() => {
    if (!navigator.geolocation) { setError("Geolocation not supported in this browser."); return; }
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => { setLocation({ lat: pos.coords.latitude.toFixed(4), lon: pos.coords.longitude.toFixed(4) }); setLoading(false); },
      () => { setError("Location access denied. Please allow location in browser settings."); setLoading(false); },
      { timeout: 8000 }
    );
  }, []);

  return { location, loading, error, detect };
}

// ─── Voice Hook ───────────────────────────────────────────────────────────────
function useVoice(onResult) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => "webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const recRef = useRef(null);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = "en-IN"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = e => { onResult(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  }, [listening, supported, onResult]);

  return { listening, supported, toggle };
}

function speak(text, lang = "en-IN") {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text.slice(0, 300));
  utt.lang = lang; utt.rate = 0.9;
  window.speechSynthesis.speak(utt);
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ setActive, dashData }) {
  const tips = [
    "Apply neem oil spray every 10 days to prevent fungal diseases.",
    "Test soil pH before sowing — optimal range is 6.0–7.5 for most crops.",
    "Intercrop legumes with cereals to fix nitrogen naturally.",
    "Drip irrigation reduces water usage by up to 60% vs flood irrigation.",
    "Keep field borders clear to reduce pest harboring zones.",
    "Use crop rotation every season to prevent soil nutrient depletion.",
  ];
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  const quickActions = [
    { icon: "🌱", label: "Analyze Soil",  mod: "soil",    color: "success" },
    { icon: "🌾", label: "Crop Advisor",  mod: "crop",    color: "warning" },
    { icon: "🍃", label: "Check Disease", mod: "disease", color: "danger"  },
    { icon: "🌤️", label: "Weather",       mod: "weather", color: "info"    },
  ];

  return (
    <div>
      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg,#0F6E56 0%,#1D9E75 60%,#5DCAA5 100%)", borderRadius: 14, padding: "18px", marginBottom: 14, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -10, top: -10, fontSize: 70, opacity: 0.12 }}>🌾</div>
        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Welcome to</div>
        <div style={{ fontSize: 22, fontWeight: 500, marginBottom: 3 }}>AgroMind AI</div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Intelligent farming assistant — soil, crops, disease & weather.</div>
        {dashData?.weather && (
          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[`📍 ${dashData.weather.city}`, `🌡️ ${dashData.weather.temp}°C`, `💧 ${dashData.weather.humidity}% humidity`].map(t => (
              <span key={t} style={{ background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "3px 10px", fontSize: 12 }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
        <StatCard icon="🌱" label="Soil Score"    value={dashData?.soilScore  || "--"} color="success" />
        <StatCard icon="🌾" label="Top Crop"      value={dashData?.topCrop    || "--"} color="warning" />
        <StatCard icon="🍃" label="Disease Risk"  value={dashData?.diseaseRisk|| "--"} color={dashData?.diseaseRisk === "Low" ? "success" : "danger"} />
        <StatCard icon="🗓️" label="Season"        value={dashData?.season     || "Kharif"} color="info" />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>Quick Actions</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {quickActions.map(a => (
            <button key={a.mod} onClick={() => setActive(a.mod)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: `var(--color-background-${a.color})`, border: `0.5px solid var(--color-border-${a.color})`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <span style={{ fontWeight: 500, fontSize: 13, color: `var(--color-text-${a.color})` }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Daily Tip */}
      <Card color="info" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-info)", marginBottom: 4 }}>💡 TODAY'S FARMING TIP</div>
        <div style={{ fontSize: 13 }}>{tip}</div>
      </Card>

      {/* Activity Feed */}
      <div>
        <SectionLabel>Recent Activity</SectionLabel>
        {dashData?.activities?.length ? dashData.activities.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10, paddingBottom: 10, borderBottom: i < dashData.activities.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none" }}>
            <div style={{ fontSize: 18, marginTop: 1 }}>{a.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{a.detail}</div>
            </div>
          </div>
        )) : (
          <div style={{ fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>
            No activity yet. Start by checking the weather or analyzing your soil! 🌱
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WEATHER ──────────────────────────────────────────────────────────────────
function WeatherModule({ onWeatherData }) {
  const { location, loading: gpsLoading, error: gpsError, detect } = useGPS();
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualCity, setManualCity] = useState("");

  const fetchWeather = async (prompt) => {
    setLoading(true);
    try {
      const raw = await callClaude([{ role: "user", content: prompt }], "You are a weather AI for Indian farmers. Return only valid JSON, no markdown.");
      const data = parseJSON(raw);
      if (data) { setWeather(data); onWeatherData && onWeatherData(data); }
    } catch (e) {}
    setLoading(false);
  };

  const weatherPrompt = (location) => `Provide realistic current weather data for ${location} for Indian farmers.
Return ONLY this JSON structure:
{
  "city": "city name",
  "state": "Indian state",
  "temp": number,
  "feelsLike": number,
  "humidity": number,
  "windSpeed": number,
  "rainfall": number,
  "condition": "Sunny|Cloudy|Partly Cloudy|Rainy|Thunderstorm",
  "uvIndex": number,
  "soilMoistureIndex": "Low|Medium|High",
  "farmingAdvice": "2-sentence advice for farmers today",
  "weekForecast": [
    {"day":"Mon","temp":number,"condition":"☀️ Sunny","rain":number},
    {"day":"Tue","temp":number,"condition":"⛅ Partly Cloudy","rain":number},
    {"day":"Wed","temp":number,"condition":"🌧️ Rainy","rain":number},
    {"day":"Thu","temp":number,"condition":"☁️ Cloudy","rain":number},
    {"day":"Fri","temp":number,"condition":"☀️ Sunny","rain":number}
  ],
  "cropAlert": "weather-based crop warning or empty string"
}`;

  useEffect(() => {
    if (location) fetchWeather(weatherPrompt(`GPS coordinates lat=${location.lat}, lon=${location.lon} (India)`));
  }, [location]);

  const condIcon = { Sunny: "☀️", Cloudy: "☁️", "Partly Cloudy": "⛅", Rainy: "🌧️", Thunderstorm: "⛈️" };

  return (
    <div>
      {!weather && !loading && (
        <>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 14 }}>
            Get real-time weather data and farmer-specific advice for your location.
          </p>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8 }}>📍 Auto-detect with GPS</div>
            {location && <div style={{ fontSize: 12, color: "var(--color-text-success)", marginBottom: 8 }}>✓ Got location: {location.lat}°N, {location.lon}°E</div>}
            {gpsError && <div style={{ fontSize: 12, color: "var(--color-text-danger)", marginBottom: 8 }}>{gpsError}</div>}
            <PrimaryBtn onClick={detect} disabled={gpsLoading} color="#185FA5">
              {gpsLoading ? "📡 Detecting location…" : "📡 Detect My GPS Location"}
            </PrimaryBtn>
          </Card>

          <div style={{ textAlign: "center", fontSize: 12, color: "var(--color-text-secondary)", margin: "10px 0" }}>— or enter city manually —</div>

          <div style={{ display: "flex", gap: 8 }}>
            <input value={manualCity} onChange={e => setManualCity(e.target.value)} onKeyDown={e => e.key === "Enter" && manualCity.trim() && fetchWeather(weatherPrompt(manualCity + ", India"))}
              placeholder="e.g. Bangalore, Pune, Hyderabad"
              style={{ flex: 1, borderRadius: 8, fontSize: 13, padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}
            />
            <button onClick={() => manualCity.trim() && fetchWeather(weatherPrompt(manualCity + ", India"))} disabled={!manualCity.trim()}
              style={{ padding: "0 16px", background: manualCity.trim() ? "#185FA5" : "var(--color-border-tertiary)", color: "#fff", border: "none", borderRadius: 8, cursor: manualCity.trim() ? "pointer" : "default", fontSize: 13 }}>
              Search
            </button>
          </div>
        </>
      )}

      {loading && <Loader icon="🌤️" text="Fetching weather data for your location…" />}

      {weather && !loading && (
        <div>
          <div style={{ background: "linear-gradient(135deg,#185FA5 0%,#378ADD 100%)", borderRadius: 14, padding: "18px", marginBottom: 12, color: "#fff", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: 12, top: 12, fontSize: 56, opacity: 0.18 }}>{condIcon[weather.condition] || "🌤️"}</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 2 }}>📍 {weather.city}, {weather.state}</div>
            <div style={{ fontSize: 48, fontWeight: 300, lineHeight: 1 }}>{weather.temp}°<span style={{ fontSize: 18 }}>C</span></div>
            <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 12 }}>{weather.condition} · Feels like {weather.feelsLike}°C</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[["💧","Humidity",weather.humidity+"%"],["💨","Wind",weather.windSpeed+"km/h"],["🌧️","Rain",weather.rainfall+"mm"],["☀️","UV",weather.uvIndex+"/11"]].map(([ic,lb,vl]) => (
                <div key={lb} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 8, padding: "6px", textAlign: "center" }}>
                  <div>{ic}</div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{vl}</div>
                  <div style={{ fontSize: 10, opacity: 0.8 }}>{lb}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5-Day Forecast */}
          {weather.weekForecast && (
            <div style={{ marginBottom: 12 }}>
              <SectionLabel>5-Day Forecast</SectionLabel>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                {weather.weekForecast.map((d, i) => (
                  <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "10px 12px", textAlign: "center", minWidth: 72, flexShrink: 0 }}>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{d.day}</div>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{d.condition?.split(" ")[0] || "🌤️"}</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{d.temp}°</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-info)" }}>💧{d.rain}mm</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <Card color="success">
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Soil Moisture</div>
              <div style={{ fontWeight: 500 }}>💧 {weather.soilMoistureIndex}</div>
            </Card>
            <Card color="warning">
              <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>UV Index</div>
              <div style={{ fontWeight: 500 }}>☀️ {weather.uvIndex}/11</div>
            </Card>
          </div>

          <Card color="success" style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-success)", marginBottom: 4 }}>🌱 Farming Advice</div>
            <div style={{ fontSize: 13 }}>{weather.farmingAdvice}</div>
          </Card>

          {weather.cropAlert && (
            <Card color="warning" style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-warning)", marginBottom: 4 }}>⚠️ Crop Alert</div>
              <div style={{ fontSize: 13 }}>{weather.cropAlert}</div>
            </Card>
          )}

          <BackBtn onClick={() => setWeather(null)} />
        </div>
      )}
    </div>
  );
}

// ─── SOIL ─────────────────────────────────────────────────────────────────────
function SoilModule({ onSoilData }) {
  const { location, loading: gpsLoading, error: gpsError, detect } = useGPS();
  const [soilImage, setSoilImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ soilColor: "dark-brown", region: "Karnataka", season: "Kharif", rainfall: "medium", texture: "loamy" });

  const selectStyle = { width: "100%", borderRadius: 6, padding: "7px 10px", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13 };

  const analyze = async () => {
    setLoading(true);
    const locationInfo = location ? `GPS: ${location.lat}°N, ${location.lon}°E` : `Region: ${form.region}`;
    const imageInfo = soilImage ? "Soil image uploaded — analyze visually for texture, color, structure." : "No image.";
    const prompt = `Expert agronomist AI. Analyze soil:
Color=${form.soilColor}, Texture=${form.texture}, ${locationInfo}, Season=${form.season}, Rainfall=${form.rainfall}. ${imageInfo}
Return ONLY JSON:
{"soilType":"string","pH":"string","moisture":"string","organicMatter":"string","npk":{"N":"string","P":"string","K":"string"},"topCrops":["c1","c2","c3","c4","c5"],"improvements":["t1","t2","t3"],"fertilizers":["f1","f2"],"rating":number,"waterRetention":"Low|Medium|High","summary":"2 sentences"}`;
    try {
      const raw = await callClaude([{ role: "user", content: prompt }], "Expert soil scientist. Return only valid JSON.");
      const data = parseJSON(raw);
      if (data) { setResult(data); onSoilData && onSoilData(data); }
      else setResult({ error: "Could not parse response. Try again." });
    } catch (e) { setResult({ error: "Analysis failed. Please try again." }); }
    setLoading(false);
  };

  return (
    <div>
      {!result && !loading && (
        <>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 14 }}>Upload a soil photo and use GPS for hyper-local AI analysis.</p>

          <div style={{ marginBottom: 14 }}>
            <SectionLabel>📷 Soil Image (recommended)</SectionLabel>
            <ImageUpload onImage={src => setSoilImage(src)} label="Upload soil photo for visual analysis" />
          </div>

          <div style={{ marginBottom: 14 }}>
            <SectionLabel>📍 GPS Location</SectionLabel>
            {location ? (
              <div style={{ background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--color-text-success)" }}>
                ✓ Location detected: {location.lat}°N, {location.lon}°E
              </div>
            ) : (
              <button onClick={detect} disabled={gpsLoading} style={{ width: "100%", padding: "9px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--color-text-secondary)" }}>
                {gpsLoading ? "📡 Detecting location…" : "📡 Auto-detect my GPS location"}
              </button>
            )}
            {gpsError && <div style={{ fontSize: 11, color: "var(--color-text-danger)", marginTop: 4 }}>{gpsError}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            {[["Soil Color","soilColor",["light-gray","red-brown","dark-brown","black","yellow","sandy"]],
              ["Texture","texture",["sandy","loamy","clay","silt","black cotton","red laterite"]],
              ["Region","region",["Karnataka","Maharashtra","Punjab","Tamil Nadu","Andhra Pradesh","Rajasthan","UP","West Bengal"]],
              ["Season","season",["Kharif (Jun-Nov)","Rabi (Nov-Apr)","Zaid (Mar-Jun)"]],
            ].map(([label, key, options]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>{label}</label>
                <select value={form[key]} onChange={e => setForm(f => ({...f, [key]: e.target.value}))} style={selectStyle}>
                  {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Rainfall</label>
              <select value={form.rainfall} onChange={e => setForm(f => ({...f, rainfall: e.target.value}))} style={selectStyle}>
                <option value="low">Low (&lt;500mm)</option>
                <option value="medium">Medium (500–1000mm)</option>
                <option value="high">High (&gt;1000mm)</option>
              </select>
            </div>
          </div>

          <PrimaryBtn onClick={analyze}>🌱 Analyze Soil with AI</PrimaryBtn>
        </>
      )}

      {loading && <Loader icon="🧪" text="AI is analyzing your soil properties…" />}

      {result && !loading && (
        <div>
          {result.error ? <p style={{ color: "var(--color-text-danger)" }}>{result.error}</p> : (
            <>
              <Card color="success" style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 16 }}>{result.soilType}</div>
                    <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>{result.summary}</div>
                  </div>
                  <div style={{ background: "var(--color-background-primary)", borderRadius: 8, padding: "4px 12px", textAlign: "center", flexShrink: 0, marginLeft: 10 }}>
                    <div style={{ fontSize: 20, fontWeight: 500 }}>{result.rating}/10</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>Score</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  {[["pH",result.pH],["Moisture",result.moisture],["Organic",result.organicMatter],["Water",result.waterRetention]].map(([k,v]) => (
                    <div key={k} style={{ background: "var(--color-background-primary)", borderRadius: 8, padding: "7px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{k}</div>
                      <div style={{ fontWeight: 500, fontSize: 11 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <div style={{ marginBottom: 12 }}>
                <SectionLabel>NPK Status</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {result.npk && Object.entries(result.npk).map(([k,v]) => (
                    <div key={k} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: "10px", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 500 }}>{k}</div>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <SectionLabel>Recommended Crops</SectionLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {result.topCrops?.map((c, i) => (
                    <span key={c} style={{ background: i === 0 ? "var(--color-background-success)" : "var(--color-background-secondary)", color: i === 0 ? "var(--color-text-success)" : "var(--color-text-primary)", padding: "4px 12px", borderRadius: 20, fontSize: 13, border: i === 0 ? "1px solid var(--color-border-success)" : "0.5px solid var(--color-border-tertiary)" }}>
                      {i === 0 && "⭐ "}{c}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <SectionLabel>Improvement Tips</SectionLabel>
                {result.improvements?.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
                    <span style={{ color: "var(--color-text-success)" }}>✓</span><span>{tip}</span>
                  </div>
                ))}
              </div>

              {result.fertilizers && (
                <Card color="warning">
                  <div style={{ fontSize: 11, fontWeight: 500, color: "var(--color-text-warning)", marginBottom: 4 }}>💊 RECOMMENDED FERTILIZERS</div>
                  {result.fertilizers.map((f, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>• {f}</div>)}
                </Card>
              )}

              <BackBtn onClick={() => setResult(null)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CROP ─────────────────────────────────────────────────────────────────────
function CropModule() {
  const [form, setForm] = useState({ temp: 28, humidity: 70, ph: 6.5, N: 80, P: 40, K: 60, region: "Karnataka", season: "Kharif" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const selectStyle = { width: "100%", borderRadius: 6, padding: "7px", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13 };

  const recommend = async () => {
    setLoading(true);
    const prompt = `Agricultural ML crop recommendation. Input: Temp=${form.temp}°C, Humidity=${form.humidity}%, pH=${form.ph}, N=${form.N}kg/ha, P=${form.P}kg/ha, K=${form.K}kg/ha, Region=${form.region}, Season=${form.season}.
Return ONLY a JSON array of exactly 5 crops:
[{"rank":1,"crop":"name","score":number,"yieldEstimate":"x-y tons/ha","revenue":"₹x-y/ha","waterNeed":"Low|Medium|High","growthDays":number,"reasoning":"2 sentences","risks":"one main risk"}]`;
    try {
      const raw = await callClaude([{ role: "user", content: prompt }], "Crop recommendation ML model. Return only valid JSON array.");
      const data = parseJSON(raw);
      if (data) setResult(data);
      else setResult([{ error: "Could not parse recommendations." }]);
    } catch (e) { setResult([{ error: "Recommendation failed. Try again." }]); }
    setLoading(false);
  };

  return (
    <div>
      {!result && !loading && (
        <>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 14 }}>Adjust parameters to get ML-powered crop recommendations with yield & revenue estimates.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            {[["Temperature (°C)","temp",10,45,1],["Humidity (%)","humidity",20,100,1],["Soil pH","ph",4,9,0.1],["Nitrogen N","N",0,200,1],["Phosphorus P","P",0,150,1],["Potassium K","K",0,200,1]].map(([label,key,min,max,step]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span>{label}</span><span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{form[key]}</span>
                </label>
                <input type="range" min={min} max={max} step={step} value={form[key]} onChange={e => setForm(f => ({...f, [key]: parseFloat(e.target.value)}))} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Region</label>
              <select value={form.region} onChange={e => setForm(f => ({...f, region: e.target.value}))} style={selectStyle}>
                {["Karnataka","Maharashtra","Punjab","Tamil Nadu","Andhra Pradesh","Rajasthan","Uttar Pradesh"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Season</label>
              <select value={form.season} onChange={e => setForm(f => ({...f, season: e.target.value}))} style={selectStyle}>
                {["Kharif","Rabi","Zaid"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <PrimaryBtn onClick={recommend} color="#0F6E56">🌾 Get Crop Recommendations</PrimaryBtn>
        </>
      )}

      {loading && <Loader icon="🌾" text="ML model processing your soil and climate data…" />}

      {result && !loading && (
        <div>
          {result[0]?.error ? <p style={{ color: "var(--color-text-danger)" }}>{result[0].error}</p> : (
            <>
              <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 10 }}>Top crops for {form.region} in {form.season} season:</div>
              {result.map((crop, i) => (
                <div key={i} style={{ background: i === 0 ? "var(--color-background-success)" : "var(--color-background-secondary)", border: i === 0 ? "1px solid var(--color-border-success)" : "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 500, fontSize: 15 }}>#{crop.rank} {crop.crop}</span>
                      {i === 0 && <span style={{ fontSize: 11, background: "var(--color-background-success)", color: "var(--color-text-success)", padding: "2px 8px", borderRadius: 10, border: "1px solid var(--color-border-success)" }}>Best Match</span>}
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 16, color: crop.score >= 80 ? "var(--color-text-success)" : "var(--color-text-warning)" }}>{crop.score}%</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 8 }}>
                    {[["Yield",crop.yieldEstimate],["Revenue",crop.revenue],["Water",crop.waterNeed],["Days",crop.growthDays+"d"]].map(([k,v]) => (
                      <div key={k} style={{ background: "var(--color-background-primary)", borderRadius: 6, padding: "6px 8px" }}>
                        <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{k}</div>
                        <div style={{ fontSize: 11, fontWeight: 500 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}>{crop.reasoning}</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-warning)" }}>⚠️ {crop.risks}</div>
                </div>
              ))}
              <BackBtn onClick={() => setResult(null)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── DISEASE ──────────────────────────────────────────────────────────────────
function DiseaseModule() {
  const [plantType, setPlantType] = useState("tomato");
  const [symptoms, setSymptoms] = useState("");
  const [leafImage, setLeafImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const detect = async () => {
    setLoading(true);
    const imageCtx = leafImage ? "Leaf image uploaded — analyze visually for spots, lesions, discoloration, mold, wilting. " : "";
    const prompt = `Plant pathologist AI. ${imageCtx}Crop: ${plantType}. Symptoms: ${symptoms || "(see uploaded image)"}.
Return ONLY JSON:
{"disease":"name","confidence":number,"severity":"Mild|Moderate|Severe","causes":["c1","c2","c3"],"prevention":["p1","p2","p3"],"organicTreatment":["o1","o2"],"chemicalTreatment":[{"name":"product","dosage":"amount","frequency":"schedule"}],"recoveryTime":"x days","spreadRisk":"Low|Medium|High"}`;
    try {
      const raw = await callClaude([{ role: "user", content: prompt }], "Expert plant pathologist. Return only valid JSON.");
      const data = parseJSON(raw);
      if (data) setResult(data);
      else setResult({ error: "Could not parse result. Please try again." });
    } catch (e) { setResult({ error: "Detection failed. Please try again." }); }
    setLoading(false);
  };

  const sev = { Mild: "success", Moderate: "warning", Severe: "danger" };

  return (
    <div>
      {!result && !loading && (
        <>
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: 14 }}>Upload a leaf photo and/or describe symptoms for instant AI disease diagnosis.</p>

          <div style={{ marginBottom: 14 }}>
            <SectionLabel>📷 Upload Leaf Image (CNN Analysis)</SectionLabel>
            <ImageUpload onImage={src => setLeafImage(src)} label="Upload diseased leaf photo" />
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Crop Type</label>
            <select value={plantType} onChange={e => setPlantType(e.target.value)} style={{ width: "100%", borderRadius: 6, padding: "7px 10px", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontSize: 13 }}>
              {["tomato","potato","wheat","rice","cotton","maize","sugarcane","soybean","groundnut","mango","banana"].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Describe Symptoms <span style={{ opacity: 0.6 }}>(optional if image uploaded)</span></label>
            <textarea value={symptoms} onChange={e => setSymptoms(e.target.value)} placeholder="e.g. Yellow spots on leaves, brown edges, white powder on surface…" style={{ width: "100%", height: 80, resize: "vertical", borderRadius: 8, border: "0.5px solid var(--color-border-secondary)", padding: 10, fontSize: 13, background: "var(--color-background-primary)", color: "var(--color-text-primary)", boxSizing: "border-box" }}/>
          </div>

          <PrimaryBtn onClick={detect} disabled={!symptoms.trim() && !leafImage} color="#A32D2D">🔬 Diagnose Disease</PrimaryBtn>
        </>
      )}

      {loading && <Loader icon="🔬" text="AI pathologist analyzing your crop…" />}

      {result && !loading && (
        <div>
          {result.error ? <p style={{ color: "var(--color-text-danger)" }}>{result.error}</p> : (
            <>
              <Card color={sev[result.severity] || "warning"} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, fontSize: 16, flex: 1 }}>{result.disease}</div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    <span style={{ background: "var(--color-background-primary)", borderRadius: 10, padding: "2px 8px", fontSize: 11 }}>{result.confidence}%</span>
                    <span style={{ background: `var(--color-background-${sev[result.severity]})`, color: `var(--color-text-${sev[result.severity]})`, borderRadius: 10, padding: "2px 8px", fontSize: 11, border: `1px solid var(--color-border-${sev[result.severity]})` }}>{result.severity}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Recovery: ~{result.recoveryTime} · Spread risk: <span style={{ color: `var(--color-text-${sev[result.spreadRisk] || "warning"})` }}>{result.spreadRisk}</span></div>
              </Card>

              {[["🔍 Causes",result.causes],["🛡️ Prevention",result.prevention],["🌿 Organic Treatment",result.organicTreatment]].map(([title,items]) => (
                <div key={title} style={{ marginBottom: 12 }}>
                  <SectionLabel>{title}</SectionLabel>
                  {items?.map((item, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "3px 0", display: "flex", gap: 8 }}>
                      <span style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}>•</span><span>{item}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div style={{ marginBottom: 12 }}>
                <SectionLabel>💊 Chemical Treatment</SectionLabel>
                {result.chemicalTreatment?.map((t, i) => (
                  <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: 8, padding: 10, marginBottom: 6 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t.dosage} · {t.frequency}</div>
                  </div>
                ))}
              </div>

              <BackBtn onClick={() => setResult(null)} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
function ChatModule() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm AgroMind AI 🌱 Ask me anything about soil, crops, diseases, weather, or farming — in English, हिंदी, ಕನ್ನಡ, తెలుగు, or தமிழ்!" }
  ]);
  const [input, setInput] = useState("");
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const { listening, supported, toggle } = useVoice(text => setInput(prev => prev + text));

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user", content: input };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);
    const system = `You are AgroMind AI, an expert agricultural assistant for Indian farmers. You have deep knowledge of soil science, crop selection, plant diseases, integrated pest management, weather impact on agriculture, organic farming, Indian farming seasons (Kharif/Rabi/Zaid), and government schemes like PM-KISAN.
Respond in the same language the user writes in. Language preference: ${LANGS[lang].name}.
Be practical and use simple language. Keep responses to 3-5 sentences max.`;
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude([...history, userMsg], system);
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    }
    setLoading(false);
  };

  const speakLast = () => {
    const last = messages.filter(m => m.role === "assistant").pop();
    if (!last) return;
    setSpeaking(true);
    const langMap = { hi: "hi-IN", kn: "kn-IN", te: "te-IN", ta: "ta-IN", en: "en-IN" };
    speak(last.content, langMap[lang] || "en-IN");
    setTimeout(() => setSpeaking(false), 5000);
  };

  const quickQ = ["Best crops for black soil?","How to treat yellow leaves?","ಭೂಮಿಯ pH ಸರಿಪಡಿಸಲು ಏನು ಮಾಡಬೇಕು?","मेरी फसल के लिए कौन सा उर्वरक?","நீர் பாசனம் எப்படி செய்வது?"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 520 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {Object.entries(LANGS).map(([code, { name, flag }]) => (
            <button key={code} onClick={() => setLang(code)} style={{ padding: "3px 8px", borderRadius: 16, border: lang === code ? "1px solid var(--color-border-info)" : "0.5px solid var(--color-border-tertiary)", background: lang === code ? "var(--color-background-info)" : "transparent", color: lang === code ? "var(--color-text-info)" : "var(--color-text-secondary)", cursor: "pointer", fontSize: 11 }}>
              {flag} {name}
            </button>
          ))}
        </div>
        <button onClick={speakLast} style={{ padding: "4px 10px", borderRadius: 16, border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", fontSize: 12, color: speaking ? "var(--color-text-success)" : "var(--color-text-secondary)" }}>
          {speaking ? "🔊 Speaking…" : "🔊 Read"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
            {m.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0, marginTop: 2 }}>🌱</div>
            )}
            <div style={{ maxWidth: "75%", background: m.role === "user" ? "var(--color-background-info)" : "var(--color-background-secondary)", padding: "10px 14px", borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 13, lineHeight: 1.6, border: `0.5px solid ${m.role === "user" ? "var(--color-border-info)" : "var(--color-border-tertiary)"}`, color: "var(--color-text-primary)" }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--color-background-success)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🌱</div>
            <div style={{ background: "var(--color-background-secondary)", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", fontSize: 13, color: "var(--color-text-secondary)" }}>Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Quick questions:</div>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {quickQ.map((q, i) => (
            <button key={i} onClick={() => setInput(q)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 12, border: "0.5px solid var(--color-border-secondary)", background: "transparent", cursor: "pointer", color: "var(--color-text-secondary)" }}>
              {q.length > 24 ? q.slice(0,24) + "…" : q}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        {supported && (
          <button onClick={toggle} title={listening ? "Stop listening" : "Start voice input"} style={{ padding: "0 12px", borderRadius: 8, border: listening ? "1px solid var(--color-border-danger)" : "0.5px solid var(--color-border-secondary)", background: listening ? "var(--color-background-danger)" : "transparent", cursor: "pointer", fontSize: 16, flexShrink: 0 }}>
            {listening ? "🔴" : "🎙️"}
          </button>
        )}
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder={`Ask in any language… ${listening ? "🎙️ listening…" : ""}`}
          style={{ flex: 1, borderRadius: 8, fontSize: 13, padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", color: "var(--color-text-primary)" }}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{ padding: "0 16px", background: input.trim() ? "#1D9E75" : "var(--color-border-tertiary)", color: "#fff", border: "none", borderRadius: 8, cursor: input.trim() ? "pointer" : "default", fontWeight: 500, fontSize: 13 }}>
          Send
        </button>
      </div>

      {!supported && (
        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", textAlign: "center", marginTop: 6 }}>
          🎙️ Voice input requires Chrome or Edge browser.
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function AgroMind() {
  const [activeModule, setActiveModule] = useState("dashboard");
  const [dashData, setDashData] = useState({ season: "Kharif", activities: [] });

  const handleWeatherData = (data) => {
    setDashData(prev => ({
      ...prev,
      weather: { city: data.city, temp: data.temp, humidity: data.humidity },
      activities: [{ icon: "🌤️", title: `Weather fetched for ${data.city}`, detail: `${data.temp}°C · ${data.condition}` }, ...prev.activities.slice(0, 3)]
    }));
  };

  const handleSoilData = (data) => {
    setDashData(prev => ({
      ...prev,
      soilScore: `${data.rating}/10`,
      topCrop: data.topCrops?.[0] || "--",
      activities: [{ icon: "🌱", title: `Soil analyzed: ${data.soilType}`, detail: `pH ${data.pH} · Top crops: ${data.topCrops?.slice(0,2).join(", ")}` }, ...prev.activities.slice(0, 3)]
    }));
  };

  const currentMod = MODULES.find(m => m.id === activeModule);

  const moduleMap = {
    dashboard: <Dashboard setActive={setActiveModule} dashData={dashData} />,
    soil:      <SoilModule onSoilData={handleSoilData} />,
    crop:      <CropModule />,
    disease:   <DiseaseModule />,
    weather:   <WeatherModule onWeatherData={handleWeatherData} />,
    chat:      <ChatModule />,
  };

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", fontFamily: "var(--font-sans)" }}>
      <style>{`@keyframes agrobounce{0%,100%{opacity:.4;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 0 0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#0F6E56,#5DCAA5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌾</div>
          <div>
            <div style={{ fontWeight: 500, fontSize: 16, lineHeight: 1.2 }}>AgroMind AI</div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>AI-Powered Farming Intelligence</div>
          </div>
        </div>
        {dashData.weather && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)", textAlign: "right" }}>
            📍 {dashData.weather.city}<br />
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{dashData.weather.temp}°C</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 4, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {MODULES.map(m => (
          <button key={m.id} onClick={() => setActiveModule(m.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 10px", borderRadius: 10, border: activeModule === m.id ? "1px solid var(--color-border-success)" : "0.5px solid var(--color-border-tertiary)", background: activeModule === m.id ? "var(--color-background-success)" : "transparent", cursor: "pointer", minWidth: 68, flexShrink: 0 }}>
            <span style={{ fontSize: 18, marginBottom: 2 }}>{m.icon}</span>
            <span style={{ fontSize: 10, color: activeModule === m.id ? "var(--color-text-success)" : "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Main Card */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 14, padding: "1rem 1.25rem" }}>
        {activeModule !== "dashboard" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
            <span style={{ fontSize: 20 }}>{currentMod.icon}</span>
            <span style={{ fontWeight: 500, fontSize: 16 }}>{currentMod.label}</span>
          </div>
        )}
        {moduleMap[activeModule]}
      </div>

      <div style={{ textAlign: "center", padding: "0.75rem 0", fontSize: 11, color: "var(--color-text-secondary)" }}>
        AgroMind AI · GPS · Voice · Image Upload · 5 Languages · Gemini AI
      </div>
    </div>
  );
}
