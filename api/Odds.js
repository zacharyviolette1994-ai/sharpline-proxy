export const config = { runtime: "edge" };

const ALLOWED_SPORTS = ["basketball_nba", "baseball_mlb"];

export default async function handler(req) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport");
  const endpoint = searchParams.get("endpoint") || "odds";

  if (!sport || !ALLOWED_SPORTS.includes(sport)) {
    return new Response(
      JSON.stringify({ error: "Invalid or missing sport param. Use basketball_nba or baseball_mlb." }),
      { status: 400, headers: corsHeaders("application/json") }
    );
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "API key not configured." }),
      { status: 500, headers: corsHeaders("application/json") }
    );
  }

  // Build Odds API URL
  let oddsUrl;
  if (endpoint === "scores") {
    oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/scores/?apiKey=${apiKey}&daysFrom=1`;
  } else {
    const markets = searchParams.get("markets") || "h2h,spreads,totals";
    const regions = searchParams.get("regions") || "us";
    oddsUrl = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${apiKey}&regions=${regions}&markets=${markets}&oddsFormat=american`;
  }

  try {
    const response = await fetch(oddsUrl);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: corsHeaders("application/json"),
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch from Odds API.", detail: err.message }),
      { status: 502, headers: corsHeaders("application/json") }
    );
  }
}

function corsHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
