// Y Combinator companies scraper - CheerioCrawler implementation
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { gotScraping } from 'got-scraping';

// Single-entrypoint main
await Actor.init();

async function main() {
    try {
        const input = (await Actor.getInput()) || {};
        const {
            url, scrape_all_companies = false, scrape_founders = true, scrape_open_jobs = true,
            results_wanted: RESULTS_WANTED_RAW = 100,
            max_pages: MAX_PAGES_RAW = 999, proxyConfiguration,
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : Number.MAX_SAFE_INTEGER;
        const MAX_PAGES = Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 999;

        log.info('Y Combinator Scraper started...');
        log.info(`Target: ${url || 'https://www.ycombinator.com/companies'}`);
        log.info(`Results wanted: ${RESULTS_WANTED}, Max pages: ${MAX_PAGES}`);

        const toAbs = (href, base = 'https://www.ycombinator.com') => {
            try { return new URL(href, base).href; } catch { return null; }
        };

        const initial = [];
        if (url) initial.push(url);
        else initial.push('https://www.ycombinator.com/companies');

        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        const dataset = await Dataset.open('ycombinator-companies');

        let saved = 0;

        // Algolia API configuration
        const ALGOLIA_APP_ID = '45BWZJ1SGC';
        const ALGOLIA_API_KEY = 'MjBjYjRiMzY0NzdhZWY0NjExY2NhZjYxMGIxYjc2MTAwNWFkNTkwNTc4NjgxYjU0YzFhYTY2ZGQ5OGY5NDMxZnJlc3RyaWN0SW5kaWNlcz0lNUIlMjJZQ0NvbXBhbnlfcHJvZHVjdGlvbiUyMiUyQyUyMllDQ29tcGFueV9CeV9MYXVuY2hfRGF0ZV9wcm9kdWN0aW9uJTIyJTVEJnRhZ0ZpbHRlcnM9JTVCJTIyeWNkY19wdWJsaWMlMjIlNUQmYW5hbHl0aWNzVGFncz0lNUIlMjJ5Y2RjJTIyJTVE';
        const ALGOLIA_INDEX = 'YCCompany_production';

        async function fetchCompaniesFromAPI(page = 0, batchFilter = null) {
            const apiUrl = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;
            
            const body = {
                query: '',
                hitsPerPage: 100,
                page: page,
                tagFilters: [['ycdc_public']]
            };

            if (batchFilter) {
                body.filters = `batch:"${batchFilter}"`;
            }

            try {
                const response = await gotScraping.post(apiUrl, {
                    json: body,
                    headers: {
                        'x-algolia-application-id': ALGOLIA_APP_ID,
                        'x-algolia-api-key': ALGOLIA_API_KEY,
                        'content-type': 'application/json',
                    },
                    responseType: 'json',
                });

                return response.body;
            } catch (error) {
                log.error(`API request failed: ${error.message}`);
                throw error;
            }
        }

        function mapHitToData(hit) {
            return {
                company_image: hit.logo_url || hit.small_logo_url || null,
                company_id: hit.id || hit.objectID || null,
                company_name: hit.name || null,
                url: hit.url ? toAbs(`/companies/${hit.slug}`) : null,
                short_description: hit.one_liner || null,
                long_description: hit.long_description || null,
                batch: hit.batch || null,
                status: hit.ycdc_status || hit.status || null,
                tags: hit.tags || [],
                company_location: hit.location || null,
                year_founded: hit.year_founded ? String(hit.year_founded) : null,
                team_size: hit.team_size ? String(hit.team_size) : null,
                primary_partner: null,
                website: hit.website || null,
                company_linkedin: hit.linkedin_url || null,
                company_x: hit.twitter_url || null,
                founders: [],
                open_jobs: []
            };
        }

        // Parse batch filter from URL if present
        let batchFilter = null;
        if (url) {
            try {
                const urlObj = new URL(url);
                batchFilter = urlObj.searchParams.get('batch');
            } catch (e) { /* ignore */ }
        }

        // Fetch companies from API
        let currentPage = 0;
        let hasMore = true;

        while (hasMore && saved < RESULTS_WANTED && currentPage < MAX_PAGES) {
            log.info(`Fetching page ${currentPage}...`);
            
            try {
                const result = await fetchCompaniesFromAPI(currentPage, batchFilter);
                const hits = result.hits || [];
                
                log.info(`Page ${currentPage}: Found ${hits.length} companies`);

                for (const hit of hits) {
                    if (saved >= RESULTS_WANTED) break;

                    const data = mapHitToData(hit);
                    
                    // For now, just save basic data without detail scraping
                    // Detail scraping can be added later if needed
                    await dataset.pushData(data);
                    saved++;
                    
                    if (saved % 10 === 0) {
                        log.info(`Progress: ${saved}/${RESULTS_WANTED} companies saved`);
                    }
                }

                // Check if there are more pages
                hasMore = result.page < result.nbPages - 1 && hits.length > 0;
                currentPage++;

            } catch (error) {
                log.error(`Failed to fetch page ${currentPage}: ${error.message}`);
                break;
            }
        }

        log.info(`Finished! Saved ${saved} companies`);
    } finally {
        await Actor.exit();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
