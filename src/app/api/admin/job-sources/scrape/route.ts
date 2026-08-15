import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuth } from "@clerk/nextjs/server";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

interface ScrapedJob {
    title: string;
    link: string;
    description: string;
    company?: string;
    location?: string;
}

// LinkedIn-specific scraper: uses their search API HTML
async function scrapeLinkedIn(sourceUrl: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    // LinkedIn's main /jobs/ page only shows categories not actual jobs.
    // We need to hit their search results page to get real job cards.
    // If the admin added "https://www.linkedin.com/jobs/" we convert it
    // to a proper search URL. If they already gave a search URL, use it.
    let searchUrl = sourceUrl;
    if (!sourceUrl.includes("/jobs/search")) {
        // Default: fetch latest jobs (no keyword filter = all jobs)
        searchUrl = "https://www.linkedin.com/jobs/search/?location=Bangladesh&sortBy=DD";
    }

    try {
        const response = await fetch(searchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            },
            signal: AbortSignal.timeout(20000),
        });

        if (!response.ok) {
            console.error(`[LinkedIn] Failed to fetch: ${response.statusText}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // LinkedIn renders job cards inside .base-search-card elements
        $(".base-search-card").each((_, element) => {
            const title = $(element).find(".base-search-card__title").text().trim();
            const company = $(element).find(".base-search-card__subtitle").text().trim();
            const location = $(element).find(".job-search-card__location").text().trim();
            const link = $(element).find("a.base-card__full-link").attr("href") || $(element).find("a").first().attr("href");

            if (title && link) {
                jobs.push({
                    title,
                    company: company || "LinkedIn",
                    location: location || "Bangladesh",
                    link,
                    description: company
                        ? `${title} position at ${company}${location ? ` in ${location}` : ""}. View full details on LinkedIn.`
                        : "View full details on LinkedIn.",
                });
            }
        });

        console.log(`[LinkedIn] Found ${jobs.length} job cards from ${searchUrl}`);
    } catch (error: any) {
        console.error(`[LinkedIn] Scrape error:`, error.message);
    }

    return jobs;
}

// Generic scraper for non-LinkedIn sites
async function scrapeGeneric(url: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];
    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            },
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
            console.error(`Failed to fetch ${url}: ${response.statusText}`);
            return [];
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const baseUrl = new URL(url).origin;

        $("a").each((_, element) => {
            const href = $(element).attr("href");
            const text = $(element).text().trim().replace(/\s+/g, " ");

            if (!href || text.length < 5) return;

            const lowerHref = href.toLowerCase();
            const lowerText = text.toLowerCase();

            // Exclude common non-job links
            const excludePattern = /sign in|log in|login|forgot password|join now|register|subscribe|cookie|privacy|policy|terms|about us|contact/i;
            if (excludePattern.test(lowerText) || excludePattern.test(lowerHref)) return;

            const isJobKeywordInHref = /job|career|position|role|opening|vacancy/i.test(lowerHref);
            const isJobTitlePattern = /engineer|developer|designer|manager|specialist|analyst|associate|director|lead|senior|executive/i.test(lowerText);

            if ((isJobKeywordInHref && href.split("/").length > 2) || (isJobTitlePattern && text.split(" ").length <= 8)) {
                let fullUrl = href;
                if (href.startsWith("/")) {
                    fullUrl = `${baseUrl}${href}`;
                } else if (!href.startsWith("http")) {
                    const basePath = url.endsWith("/") ? url.slice(0, -1) : url;
                    fullUrl = `${basePath}/${href}`;
                }

                jobs.push({
                    title: text,
                    link: fullUrl,
                    description: "View details on company site.",
                });
            }
        });
    } catch (error: any) {
        console.error(`Error scraping ${url}:`, error.message);
    }

    // Deduplicate by URL
    const uniqueJobs = Array.from(new Map(jobs.map((j) => [j.link, j])).values());
    return uniqueJobs.slice(0, 25);
}

// Route the scraper to the right platform-specific handler
async function scrapeJobsFromUrl(url: string): Promise<ScrapedJob[]> {
    if (url.includes("linkedin.com")) {
        return scrapeLinkedIn(url);
    }
    return scrapeGeneric(url);
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = getAuth(req);
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify admin
        const user = await prisma.user.findUnique({
            where: { clerkId: userId },
            select: { role: true, id: true, name: true, email: true },
        });

        if (!user || user.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const { sourceId } = body;

        // Fetch sources to scrape
        const sources = await prisma.jobSource.findMany({
            where: sourceId ? { id: sourceId } : { isActive: true },
        });

        if (sources.length === 0) {
            return NextResponse.json({ message: "No active job sources found." }, { status: 404 });
        }

        let totalScraped = 0;
        let totalAdded = 0;

        for (const source of sources) {
            const scrapedJobs = await scrapeJobsFromUrl(source.url);

            if (scrapedJobs.length > 0) {
                // Get existing external URLs for this source to avoid duplicates
                const existingJobs = await prisma.job.findMany({
                    where: { sourceId: source.id },
                    select: { externalUrl: true },
                });

                const existingUrls = new Set(existingJobs.map((j) => j.externalUrl));
                const newJobs = scrapedJobs.filter((job) => !existingUrls.has(job.link));

                totalScraped += scrapedJobs.length;

                // Add new jobs to database
                for (const newJob of newJobs) {
                    // Infer missing info from title
                    const lowerTitle = newJob.title.toLowerCase();

                    let workMode = "On-site";
                    if (lowerTitle.includes("remote")) workMode = "Remote";
                    else if (lowerTitle.includes("hybrid")) workMode = "Hybrid";

                    let jobType = "Full-time";
                    if (lowerTitle.includes("part-time") || lowerTitle.includes("part time")) jobType = "Part-time";
                    else if (lowerTitle.includes("intern") || lowerTitle.includes("internship")) jobType = "Internship";
                    else if (lowerTitle.includes("contract")) jobType = "Contract";

                    await prisma.job.create({
                        data: {
                            title: newJob.title,
                            description: newJob.description,
                            company: newJob.company || source.name,
                            location: newJob.location || "Multiple Locations / Global",
                            jobType,
                            workMode,
                            salary: "Negotiable",
                            requirements: ["Communication", "Problem Solving", "Teamwork"],
                            recruiterId: user.id,
                            isExternal: true,
                            externalUrl: newJob.link,
                            sourceId: source.id,
                            applicationMethod: "EXTERNAL_LINK",
                        },
                    });
                    totalAdded++;
                }
            }

            // Update last scraped time
            await prisma.jobSource.update({
                where: { id: source.id },
                data: { lastScrapedAt: new Date() },
            });
        }

        return NextResponse.json({
            message: `Scraping complete. Found ${totalScraped} jobs, added ${totalAdded} new jobs.`,
            scraped: totalScraped,
            added: totalAdded,
        });
    } catch (error: any) {
        console.error("[SCRAPE_JOBS]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
