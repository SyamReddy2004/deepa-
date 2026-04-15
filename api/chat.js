// ─── AgroMind Local Rule-Based Engine (No API Key Required) ───────────────────
// This runs entirely on Vercel with no external API calls

function soilAnalysis({ soilColor, texture, region, season, rainfall }) {
  const typeMap = {
    "black": "Black Cotton Soil (Regur)",
    "dark-brown": "Dark Brown Loamy Soil",
    "red-brown": "Red Laterite Soil",
    "light-gray": "Gray Sandy Loam",
    "yellow": "Yellow Sandy Soil",
    "sandy": "Sandy Alluvial Soil",
  };
  const phMap = { "black": "6.5–8.0", "dark-brown": "6.0–7.0", "red-brown": "5.5–6.5", "light-gray": "6.0–7.5", "yellow": "5.5–6.5", "sandy": "6.0–7.5" };
  const cropsByTexture = {
    "loamy":       ["Wheat","Maize","Rice","Sugarcane","Vegetables"],
    "clay":        ["Rice","Sugarcane","Cotton","Jute","Soybean"],
    "sandy":       ["Groundnut","Jowar","Bajra","Watermelon","Sesame"],
    "black cotton":["Cotton","Soybean","Sunflower","Jowar","Wheat"],
    "red laterite":["Groundnut","Ragi","Cashew","Tapioca","Mango"],
    "silt":        ["Rice","Wheat","Maize","Potato","Onion"],
  };
  const soilType = typeMap[soilColor] || "Mixed Alluvial Soil";
  const pH = phMap[soilColor] || "6.0–7.5";
  const topCrops = cropsByTexture[texture] || ["Wheat","Rice","Maize","Jowar","Bajra"];
  const rating = texture === "loamy" ? 8 : texture === "clay" ? 7 : texture === "silt" ? 8 : 6;
  const moisture = rainfall === "high" ? "High" : rainfall === "medium" ? "Medium" : "Low";
  return {
    soilType, pH,
    moisture,
    organicMatter: texture === "black cotton" ? "High (3–5%)" : texture === "loamy" ? "Moderate (2–3%)" : "Low (0.5–1.5%)",
    npk: { N: texture === "clay" ? "Medium" : "Low–Medium", P: "Medium", K: texture === "black cotton" ? "High" : "Medium" },
    topCrops,
    improvements: [
      "Add organic compost (2–3 tons/acre) before sowing to improve structure.",
      "Test soil pH every season and apply lime if below 6.0.",
      "Practice crop rotation to naturally replenish nitrogen.",
    ],
    fertilizers: ["NPK 10:26:26 (basal dose)", "Urea top-dressing at tillering stage"],
    rating,
    waterRetention: texture === "clay" ? "High" : texture === "loamy" ? "Medium" : "Low",
    summary: `Your ${soilType} in ${region} is suitable for ${season} cultivation. With proper amendments, you can significantly improve yield.`,
  };
}

function cropRecommendation({ temp, humidity, ph, N, P, K, region, season }) {
  const allCrops = [
    { crop: "Rice",      minT: 20, maxT: 40, minH: 70, phMin: 5.5, phMax: 7.0, minN: 60, waterNeed: "High",   days: 120, yieldLow: 4, yieldHigh: 6,  revLow: 60000, revHigh: 90000  },
    { crop: "Wheat",     minT: 10, maxT: 25, minH: 40, phMin: 6.0, phMax: 7.5, minN: 80, waterNeed: "Medium", days: 110, yieldLow: 3, yieldHigh: 5,  revLow: 60000, revHigh: 100000 },
    { crop: "Maize",     minT: 18, maxT: 35, minH: 50, phMin: 5.8, phMax: 7.5, minN: 80, waterNeed: "Medium", days: 90,  yieldLow: 5, yieldHigh: 8,  revLow: 50000, revHigh: 80000  },
    { crop: "Cotton",    minT: 22, maxT: 42, minH: 50, phMin: 6.0, phMax: 8.0, minN: 60, waterNeed: "Medium", days: 160, yieldLow: 2, yieldHigh: 4,  revLow: 80000, revHigh: 160000 },
    { crop: "Soybean",   minT: 20, maxT: 35, minH: 55, phMin: 6.0, phMax: 7.5, minN: 20, waterNeed: "Medium", days: 100, yieldLow: 2, yieldHigh: 3,  revLow: 50000, revHigh: 75000  },
    { crop: "Groundnut", minT: 24, maxT: 42, minH: 50, phMin: 5.5, phMax: 7.0, minN: 20, waterNeed: "Low",    days: 110, yieldLow: 2, yieldHigh: 4,  revLow: 60000, revHigh: 120000 },
    { crop: "Sugarcane", minT: 21, maxT: 40, minH: 65, phMin: 6.0, phMax: 8.0, minN: 100,waterNeed: "High",   days: 330, yieldLow: 40,yieldHigh: 80, revLow: 100000,revHigh: 200000 },
    { crop: "Tomato",    minT: 18, maxT: 32, minH: 55, phMin: 6.0, phMax: 7.0, minN: 80, waterNeed: "Medium", days: 70,  yieldLow: 15,yieldHigh: 30, revLow: 75000, revHigh: 150000 },
    { crop: "Potato",    minT: 10, maxT: 25, minH: 70, phMin: 5.5, phMax: 7.0, minN: 90, waterNeed: "Medium", days: 80,  yieldLow: 15,yieldHigh: 25, revLow: 60000, revHigh: 100000 },
    { crop: "Onion",     minT: 13, maxT: 35, minH: 50, phMin: 6.0, phMax: 7.5, minN: 60, waterNeed: "Medium", days: 120, yieldLow: 10,yieldHigh: 25, revLow: 50000, revHigh: 125000 },
  ];
  const scored = allCrops.map(c => {
    let score = 100;
    if (temp < c.minT || temp > c.maxT) score -= 30;
    if (humidity < c.minH) score -= 15;
    if (ph < c.phMin || ph > c.phMax) score -= 20;
    if (N < c.minN) score -= 10;
    score = Math.max(30, score);
    return { ...c, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((c, i) => ({
    rank: i + 1,
    crop: c.crop,
    score: c.score,
    yieldEstimate: `${c.yieldLow}–${c.yieldHigh} tons/ha`,
    revenue: `₹${(c.revLow/1000).toFixed(0)}k–₹${(c.revHigh/1000).toFixed(0)}k/ha`,
    waterNeed: c.waterNeed,
    growthDays: c.days,
    reasoning: `${c.crop} thrives at ${temp}°C with ${humidity}% humidity and pH ${ph}. Suitable for ${season} season in ${region}.`,
    risks: c.waterNeed === "High" ? "High water demand — ensure irrigation availability." : "Monitor for common pests and nutrient deficiencies.",
  }));
}

function diseaseDetection({ plantType, symptoms }) {
  const symptomLower = (symptoms || "").toLowerCase();
  const diseaseDb = {
    tomato: [
      { disease: "Early Blight", keywords: ["yellow","spot","brown","circle"], severity: "Moderate" },
      { disease: "Late Blight", keywords: ["dark","water","soaked","wilting"], severity: "Severe" },
      { disease: "Leaf Curl Virus", keywords: ["curl","wrinkle","distort","small"], severity: "Moderate" },
      { disease: "Powdery Mildew", keywords: ["white","powder","dust","mold"], severity: "Mild" },
    ],
    potato: [
      { disease: "Late Blight", keywords: ["dark","brown","wet","decay"], severity: "Severe" },
      { disease: "Common Scab", keywords: ["scab","rough","lesion","cork"], severity: "Mild" },
      { disease: "Blackleg", keywords: ["black","stem","rot","wilting"], severity: "Moderate" },
    ],
    wheat: [
      { disease: "Yellow Rust", keywords: ["yellow","stripe","orange","rust"], severity: "Severe" },
      { disease: "Powdery Mildew", keywords: ["white","powder","mold","gray"], severity: "Moderate" },
      { disease: "Loose Smut", keywords: ["black","smut","ear","head"], severity: "Severe" },
    ],
    rice: [
      { disease: "Blast Disease", keywords: ["lesion","gray","diamond","neck"], severity: "Severe" },
      { disease: "Brown Spot", keywords: ["brown","spot","oval","small"], severity: "Moderate" },
      { disease: "Bacterial Blight", keywords: ["yellow","edge","wilt","stripe"], severity: "Severe" },
    ],
    default: [
      { disease: "Fungal Leaf Spot", keywords: ["spot","brown","yellow","ring"], severity: "Moderate" },
      { disease: "Powdery Mildew", keywords: ["white","powder","gray","mold"], severity: "Mild" },
      { disease: "Bacterial Blight", keywords: ["wilt","yellow","edge","water"], severity: "Severe" },
    ],
  };
  const list = diseaseDb[plantType] || diseaseDb.default;
  let best = list[0], bestScore = 0;
  for (const d of list) {
    const score = d.keywords.filter(k => symptomLower.includes(k)).length;
    if (score > bestScore) { best = d; bestScore = score; }
  }
  const sevMap = { Mild: "success", Moderate: "warning", Severe: "danger" };
  return {
    disease: best.disease,
    confidence: bestScore > 1 ? 85 + bestScore * 3 : 72,
    severity: best.severity,
    causes: ["Fungal/bacterial spore spread through wind and rain", "Humid conditions above 80% favor infection", "Poor air circulation in dense crop stands"],
    prevention: ["Remove and destroy infected plant parts immediately", "Ensure proper spacing between plants for air circulation", "Apply preventive fungicide spray before monsoon onset"],
    organicTreatment: ["Neem oil spray (5ml/L water) every 10 days", "Trichoderma-based biocontrol application to soil"],
    chemicalTreatment: [{ name: "Mancozeb 75% WP", dosage: "2.5g/L water", frequency: "Every 7–10 days" }],
    recoveryTime: "14–21 days",
    spreadRisk: best.severity === "Severe" ? "High" : "Medium",
  };
}

function weatherData({ city }) {
  const cityMap = {
    bangalore: { temp: 28, humidity: 65, condition: "Partly Cloudy", state: "Karnataka" },
    hyderabad: { temp: 32, humidity: 55, condition: "Sunny", state: "Telangana" },
    mumbai:    { temp: 30, humidity: 80, condition: "Cloudy", state: "Maharashtra" },
    delhi:     { temp: 35, humidity: 45, condition: "Sunny", state: "Delhi" },
    chennai:   { temp: 33, humidity: 75, condition: "Partly Cloudy", state: "Tamil Nadu" },
    pune:      { temp: 29, humidity: 60, condition: "Partly Cloudy", state: "Maharashtra" },
    nagpur:    { temp: 36, humidity: 40, condition: "Sunny", state: "Maharashtra" },
    jaipur:    { temp: 38, humidity: 30, condition: "Sunny", state: "Rajasthan" },
    lucknow:   { temp: 34, humidity: 55, condition: "Partly Cloudy", state: "Uttar Pradesh" },
    kolkata:   { temp: 31, humidity: 75, condition: "Cloudy", state: "West Bengal" },
  };
  const key = city.toLowerCase().trim();
  const match = Object.keys(cityMap).find(k => key.includes(k));
  const base = match ? cityMap[match] : { temp: 30, humidity: 60, condition: "Partly Cloudy", state: "India" };
  const days = ["Mon","Tue","Wed","Thu","Fri"];
  return {
    city: match ? match.charAt(0).toUpperCase() + match.slice(1) : city,
    state: base.state,
    temp: base.temp,
    feelsLike: base.temp + 2,
    humidity: base.humidity,
    windSpeed: 12,
    rainfall: base.condition === "Rainy" ? 8 : 0,
    condition: base.condition,
    uvIndex: base.temp > 35 ? 9 : 7,
    soilMoistureIndex: base.humidity > 70 ? "High" : base.humidity > 50 ? "Medium" : "Low",
    farmingAdvice: `Current conditions in ${city} are ${base.condition.toLowerCase()}. ${base.humidity > 70 ? "Good moisture levels — ideal for transplanting seedlings." : "Ensure adequate irrigation due to dry conditions."}`,
    weekForecast: days.map((d, i) => ({
      day: d,
      temp: base.temp + (i % 2 === 0 ? 1 : -1),
      condition: i === 2 ? "🌧️ Rainy" : i === 4 ? "⛅ Partly Cloudy" : "☀️ Sunny",
      rain: i === 2 ? 12 : 0,
    })),
    cropAlert: base.temp > 36 ? "High temperature alert — protect crops with shade nets and increase irrigation frequency." : "",
  };
}

function chatResponse({ messages, system }) {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const responses = [
    { keywords: ["soil","ph","acid"], reply: "For acidic soil (pH below 6), apply agricultural lime at 2–4 bags per acre. Retest after 30 days. Ideal pH for most crops is 6.0–7.5." },
    { keywords: ["fertilizer","npk","urea"], reply: "For general crops, apply NPK 10:26:26 as basal dose at sowing, then top-dress with Urea (45kg/acre) at 30 and 60 days after sowing." },
    { keywords: ["disease","yellow","leaf","spot"], reply: "Yellow spots on leaves often indicate fungal infection. Spray Mancozeb 2.5g/L or neem oil 5ml/L every 10 days. Improve air circulation by proper spacing." },
    { keywords: ["water","irrigation","drip"], reply: "Drip irrigation saves 40–60% water vs flood irrigation. For most vegetables, irrigate every 2–3 days. For cereals, critical stages are tillering and grain filling." },
    { keywords: ["crop","best","grow","plant"], reply: "The best crop depends on your soil type, water availability, and market demand. Use the Crop Advisor module in this app to get AI-powered personalized recommendations." },
    { keywords: ["weather","rain","monsoon","season"], reply: "Kharif (June–November) is ideal for rice, cotton, maize. Rabi (Nov–April) suits wheat, mustard, gram. Check the Weather module for your local forecast." },
    { keywords: ["pest","insect","bug"], reply: "For pest management, use integrated pest management (IPM): sticky traps, neem oil spray, and as last resort, approved pesticides like Chlorpyrifos at labeled doses." },
    { keywords: ["organic","compost","natural"], reply: "Organic farming improves soil health long-term. Add 2–3 tons of farmyard manure per acre, use green manure crops like Dhaincha, and apply Trichoderma for disease control." },
    { keywords: ["government","scheme","subsidy","pm-kisan"], reply: "PM-KISAN provides ₹6,000/year to farmers. Pradhan Mantri Fasal Bima Yojana covers crop insurance. Contact your local Krishi Vigyan Kendra for scheme applications." },
  ];
  for (const r of responses) {
    if (r.keywords.some(k => lastMsg.includes(k))) return r.reply;
  }
  return "I'm AgroMind AI 🌱 I can help with soil health, crop selection, disease identification, irrigation, and government farming schemes. Please ask a specific farming question!";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { system, messages, _type } = req.body;

    // Route based on system prompt content
    const sys = (system || "").toLowerCase();
    let text = "";

    if (sys.includes("soil scientist") || sys.includes("soil")) {
      const userContent = messages[messages.length - 1]?.content || "";
      const colorMatch = userContent.match(/Color=([^,]+)/);
      const textureMatch = userContent.match(/Texture=([^,]+)/);
      const regionMatch = userContent.match(/Region:\s*([^,\n.]+)/);
      const seasonMatch = userContent.match(/Season=([^,]+)/);
      const rainfallMatch = userContent.match(/Rainfall=([^,\n.]+)/);
      const result = soilAnalysis({
        soilColor: colorMatch?.[1] || "dark-brown",
        texture: textureMatch?.[1] || "loamy",
        region: regionMatch?.[1] || "Karnataka",
        season: seasonMatch?.[1] || "Kharif",
        rainfall: rainfallMatch?.[1] || "medium",
      });
      text = JSON.stringify(result);
    } else if (sys.includes("crop recommendation") || sys.includes("crop")) {
      const userContent = messages[messages.length - 1]?.content || "";
      const tempMatch = userContent.match(/Temp=(\d+)/);
      const humMatch = userContent.match(/Humidity=(\d+)/);
      const phMatch = userContent.match(/pH=([\d.]+)/);
      const nMatch = userContent.match(/N=(\d+)/);
      const pMatch = userContent.match(/P=(\d+)/);
      const kMatch = userContent.match(/K=(\d+)/);
      const regionMatch = userContent.match(/Region=([^,]+)/);
      const seasonMatch = userContent.match(/Season=([^,\n.]+)/);
      const result = cropRecommendation({
        temp: Number(tempMatch?.[1] || 28),
        humidity: Number(humMatch?.[1] || 70),
        ph: Number(phMatch?.[1] || 6.5),
        N: Number(nMatch?.[1] || 80),
        P: Number(pMatch?.[1] || 40),
        K: Number(kMatch?.[1] || 60),
        region: regionMatch?.[1] || "Karnataka",
        season: seasonMatch?.[1] || "Kharif",
      });
      text = JSON.stringify(result);
    } else if (sys.includes("pathologist") || sys.includes("disease")) {
      const userContent = messages[messages.length - 1]?.content || "";
      const cropMatch = userContent.match(/Crop:\s*([^.\n]+)/);
      const symMatch = userContent.match(/Symptoms:\s*([^.\n]+)/);
      const result = diseaseDetection({
        plantType: (cropMatch?.[1] || "tomato").toLowerCase().trim(),
        symptoms: symMatch?.[1] || userContent,
      });
      text = JSON.stringify(result);
    } else if (sys.includes("weather")) {
      const userContent = messages[messages.length - 1]?.content || "";
      const cityMatch = userContent.match(/for\s+([A-Za-z\s]+?)(?:,|\s+for|$)/i);
      const city = cityMatch?.[1]?.trim() || "Bangalore";
      const result = weatherData({ city });
      text = JSON.stringify(result);
    } else {
      // Chatbot
      text = chatResponse({ messages, system });
    }

    return res.status(200).json({ text });
  } catch (error) {
    console.error("AgroMind engine error:", error);
    return res.status(500).json({ error: "Processing failed. Please try again." });
  }
}
