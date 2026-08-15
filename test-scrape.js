import * as cheerio from "cheerio";
async function main() {
    const url = "https://www.linkedin.com/jobs/entrepreneurship-jobs-dhaka/?currentJobId=4374888151&trk=homepage-jobseeker_suggested-search";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept-Language": "en-US,en;q=0.5"
            },
            signal: controller.signal
        });
        clearTimeout(timeout);
        const html = await res.text();
        const $ = cheerio.load(html);
        
        let jobs = [];
        // Look for LinkedIn specific list format
        $('ul.jobs-search__results-list > li, .base-search-card').each((_, element) => {
            const title = $(element).find('.base-search-card__title').text().trim() || $(element).find('.job-search-card__title').text().trim();
            const company = $(element).find('.base-search-card__subtitle').text().trim() || $(element).find('.job-search-card__subtitle').text().trim();
            const link = $(element).find('a.base-card__full-link, a.job-search-card__listdate').attr('href') || $(element).find('a').attr('href');
            
            if (title && link) {
                jobs.push({ title: company ? `${title} at ${company}` : title, link });
            }
        });
        
        console.log("LinkedIn specific found:", jobs.slice(0, 3));
    } catch (e) {
        console.log("Error:", e.message);
    }
}
main();
