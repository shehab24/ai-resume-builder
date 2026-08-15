import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const response = await fetch(`https://www.adzuna.com/what_suggest?where_c=${encodeURIComponent(q)}`);
    if (!response.ok) {
        throw new Error(`External API responded with status ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in job suggestions proxy:", error);
    return NextResponse.json({ error: "Failed to fetch suggestions from external API" }, { status: 500 });
  }
}
