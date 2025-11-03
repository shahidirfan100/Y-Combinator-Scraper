// Y Combinator companies scraper - Advanced implementation with stealth features
import { Actor, log } from 'apify';
import { gotScraping } from 'got-scraping';
import { load as loadHtml } from 'cheerio';

// Single-entrypoint main
await Actor.init();

async function main() {
    try {
        const input = (await Actor.getInput()) || {};
        const {
            url,
            scrape_all_companies = false,
            scrape_founders = true,
            scrape_open_jobs = true,
            results_wanted: RESULTS_WANTED_RAW = 100,
            max_pages: MAX_PAGES_RAW = 20,
            proxyConfiguration,
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : Number.MAX_SAFE_INTEGER;
        const MAX_PAGES = Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 999;

        log.info('Y Combinator Scraper started...');
        log.info(`Target: ${url || 'https://www.ycombinator.com/companies'}`);
        const targetResults = scrape_all_companies ? Number.MAX_SAFE_INTEGER : RESULTS_WANTED;
        const targetResultsLabel = scrape_all_companies ? 'all available' : targetResults;

        log.info(`Results wanted: ${targetResultsLabel}, Max pages: ${MAX_PAGES}`);
        log.info(`Detail scraping -> founders: ${scrape_founders}, open jobs: ${scrape_open_jobs}`);

        const toAbs = (href, base = 'https://www.ycombinator.com') => {
            try { return new URL(href, base).href; } catch { return null; }
        };

        // Human-like delay function with jitter
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 1000));

        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        let saved = 0;

        // Algolia API configuration
        const ALGOLIA_APP_ID = '45BWZJ1SGC';
        const ALGOLIA_API_KEY = 'MjBjYjRiMzY0NzdhZWY0NjExY2NhZjYxMGIxYjc2MTAwNWFkNTkwNTc4NjgxYjU0YzFhYTY2ZGQ5OGY5NDMxZnJlc3RyaWN0SW5kaWNlcz0lNUIlMjJZQ0NvbXBhbnlfcHJvZHVjdGlvbiUyMiUyQyUyMllDQ29tcGFueV9CeV9MYXVuY2hfRGF0ZV9wcm9kdWN0aW9uJTIyJTVEJnRhZ0ZpbHRlcnM9JTVCJTIyeWNkY19wdWJsaWMlMjIlNUQmYW5hbHl0aWNzVGFncz0lNUIlMjJ5Y2RjJTIyJTVE';
        const ALGOLIA_INDEX = 'YCCompany_production';

        async function fetchCompaniesFromAPI(page = 0, batchFilter = null, retries = 3) {
            const apiUrl = `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`;

            const requestPayload = {
                query: '',
                hitsPerPage: 100,
                page,
                tagFilters: [['ycdc_public']],
                attributesToRetrieve: ['*'],
                analyticsTags: ['ycdc'],
                restrictIndices: [
                    'YCCompany_production',
                    'YCCompany_By_Launch_Date_production',
                ],
            };

            if (batchFilter) {
                requestPayload.filters = `batch:"${batchFilter.replace(/"/g, '\\"')}"`;
            }

            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    // Human-like delay before request
                    await delay(1000 + attempt * 500);

                    const proxyUrl = proxyConf ? await proxyConf.newUrl() : undefined;

                    const response = await gotScraping({
                        url: apiUrl,
                        method: 'POST',
                        json: requestPayload,
                        proxyUrl,
                        headers: {
                            'x-algolia-application-id': ALGOLIA_APP_ID,
                            'x-algolia-api-key': ALGOLIA_API_KEY,
                            'x-algolia-agent': 'Apify/YCCompanyScraper; got-scraping (Node.js)',
                            'content-type': 'application/json; charset=UTF-8',
                            'accept': 'application/json',
                            'accept-language': 'en-US,en;q=0.9',
                            'origin': 'https://www.ycombinator.com',
                            'referer': 'https://www.ycombinator.com/companies',
                            'sec-fetch-dest': 'empty',
                            'sec-fetch-mode': 'cors',
                            'sec-fetch-site': 'cross-site',
                        },
                        responseType: 'json',
                        throwHttpErrors: false,
                    });

                    if (response.statusCode === 200 && response.body) {
                        return response.body;
                    } else {
                        const bodyPreview = typeof response.body === 'string'
                            ? response.body.slice(0, 200)
                            : JSON.stringify(response.body);
                        log.warning(`API returned status ${response.statusCode}: ${bodyPreview}`);
                        if (attempt < retries - 1) {
                            const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
                            log.info(`Retrying in ${backoff}ms...`);
                            await delay(backoff);
                        }
                    }
                } catch (error) {
                    log.error(`API request attempt ${attempt + 1} failed: ${error.message}`);
                    if (attempt < retries - 1) {
                        const backoff = Math.min(1000 * Math.pow(2, attempt), 10000);
                        log.info(`Retrying in ${backoff}ms...`);
                        await delay(backoff);
                    } else {
                        throw error;
                    }
                }
            }

            throw new Error('All retry attempts failed');
        }

        const detailCache = new Map();

        const htmlEntities = {
            '&quot;': '"',
            '&#x27;': '\'',
            '&#39;': '\'',
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&#x2F;': '/',
        };

        const decodeEntities = (str = '') => str.replace(/(&quot;|&#x27;|&#39;|&amp;|&lt;|&gt;|&#x2F;)/g, (match) => htmlEntities[match] ?? match);

        async function fetchCompanyDetails(slug, retries = 3) {
            if (!slug) return null;
            if (detailCache.has(slug)) return detailCache.get(slug);

            const detailUrl = toAbs(`/companies/${slug}`);

            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    await delay(800 + attempt * 500);

                    const proxyUrl = proxyConf ? await proxyConf.newUrl() : undefined;

                    const response = await gotScraping({
                        url: detailUrl,
                        method: 'GET',
                        proxyUrl,
                        responseType: 'text',
                        headers: {
                            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
                            'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                            'accept-language': 'en-US,en;q=0.9',
                            'cache-control': 'no-cache',
                            'pragma': 'no-cache',
                            'referer': 'https://www.ycombinator.com/companies',
                        },
                        throwHttpErrors: false,
                    });

                    if (response.statusCode === 404) {
                        log.warning(`Company page not found for slug ${slug}`);
                        detailCache.set(slug, null);
                        return null;
                    }

                    if (response.statusCode !== 200 || !response.body) {
                        throw new Error(`Unexpected status ${response.statusCode}`);
                    }

                    const $ = loadHtml(response.body);
                    const dataAttr = $('div[data-page][id*="Companies/ShowPage"]').first().attr('data-page');

                    if (!dataAttr) throw new Error('Detail payload not embedded on page');

                    let parsed;
                    try {
                        parsed = JSON.parse(decodeEntities(dataAttr));
                    } catch (err) {
                        throw new Error(`Failed to parse detail JSON: ${err.message}`);
                    }

                    const company = parsed?.props?.company;
                    if (!company) throw new Error('Missing company payload in detail JSON');

                    const normalized = {
                        primary_partner: company.primary_group_partner?.name || company.primary_group_partner?.title || null,
                        founders: Array.isArray(company.founders)
                            ? company.founders.map((founder) => ({
                                id: founder.user_id ? String(founder.user_id) : null,
                                name: founder.full_name || null,
                                title: founder.title || null,
                                linkedin: founder.linkedin_url || null,
                                x: founder.twitter_url || null,
                                bio: founder.founder_bio || null,
                            })).filter((founder) => Object.values(founder).some((value) => value))
                            : [],
                        open_jobs: Array.isArray(company.job_openings)
                            ? company.job_openings.map((job) => ({
                                id: job.id ? String(job.id) : null,
                                title: job.title || null,
                                description_url: job.absolute_url || job.url || null,
                                description: job.description || null,
                                location: job.location || null,
                                salary: job.salary || null,
                                years_experience: job.years_experience || null,
                            }))
                            : [],
                    };

                    detailCache.set(slug, normalized);
                    return normalized;
                } catch (error) {
                    log.warning(`Detail fetch attempt ${attempt + 1} for ${slug} failed: ${error.message}`);
                    if (attempt < retries - 1) {
                        const backoff = Math.min(1500 * (attempt + 1), 10000);
                        log.debug(`Retrying company detail in ${backoff}ms...`);
                        await delay(backoff);
                    } else {
                        detailCache.set(slug, null);
                        return null;
                    }
                }
            }

            return null;
        }

        function mapHitToData(hit, detail = null) {
            return {
                company_image: hit.logo_url || hit.small_logo_url || null,
                company_id: hit.id || hit.objectID || null,
                company_name: hit.name || null,
                url: hit.slug ? toAbs(`/companies/${hit.slug}`) : null,
                short_description: hit.one_liner || null,
                long_description: hit.long_description || null,
                batch: hit.batch || null,
                status: hit.ycdc_status || hit.status || null,
                tags: hit.tags || [],
                company_location: hit.location || null,
                year_founded: hit.year_founded ? String(hit.year_founded) : null,
                team_size: hit.team_size ? String(hit.team_size) : null,
                primary_partner: detail?.primary_partner || null,
                website: hit.website || null,
                company_linkedin: hit.linkedin_url || detail?.founders?.[0]?.linkedin || null,
                company_x: hit.twitter_url || null,
                founders: detail?.founders && Array.isArray(detail.founders) ? detail.founders : [],
                open_jobs: detail?.open_jobs && Array.isArray(detail.open_jobs) ? detail.open_jobs : [],
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

        log.info('Starting to fetch companies from Algolia API...');

        while (hasMore && saved < targetResults && currentPage < MAX_PAGES) {
            log.info(`Fetching page ${currentPage}...`);

            try {
                const result = await fetchCompaniesFromAPI(currentPage, batchFilter);
                
                if (!result || !result.hits) {
                    log.error(`Invalid API response: ${JSON.stringify(result)}`);
                    break;
                }

                const hits = result.hits || [];

                log.info(`Page ${currentPage}: Found ${hits.length} companies (total: ${result.nbHits || 0})`);

                if (hits.length === 0) {
                    log.info('No more companies found');
                    break;
                }

                for (const hit of hits) {
                    if (saved >= targetResults) break;

                    let detail = null;
                    if ((scrape_founders || scrape_open_jobs) && hit.slug) {
                        detail = await fetchCompanyDetails(hit.slug);

                        if (detail && !scrape_founders) {
                            detail.founders = [];
                        }
                        if (detail && !scrape_open_jobs) {
                            detail.open_jobs = [];
                        }
                    }

                    const data = mapHitToData(hit, detail);

                    await Actor.pushData(data);
                    saved++;

                    if (saved % 10 === 0) {
                        log.info(`Progress: ${saved}/${targetResultsLabel} companies saved`);
                    }
                }

                // Check if there are more pages
                const currentIndex = Number.isFinite(result.page) ? result.page : currentPage;
                const totalPages = Number.isFinite(result.nbPages) ? result.nbPages : (Number.isFinite(result.nbHits) && Number.isFinite(result.hitsPerPage) && result.hitsPerPage > 0
                    ? Math.ceil(result.nbHits / result.hitsPerPage)
                    : Infinity);
                hasMore = currentIndex < totalPages - 1 && hits.length > 0;
                currentPage++;

                // Human-like delay between pages
                if (hasMore && saved < targetResults) {
                    await delay(2000);
                }

            } catch (error) {
                log.error(`Failed to fetch page ${currentPage}: ${error.message}`);
                log.error(`Error stack: ${error.stack}`);
                break;
            }
        }

        log.info(`Finished! Saved ${saved} companies (target: ${targetResultsLabel})`);
    } catch (error) {
        log.error(`Main error: ${error.message}`);
        log.error(`Stack: ${error.stack}`);
        throw error;
    } finally {
        await Actor.exit();
    }
}

main().catch(err => { 
    console.error('Fatal error:', err); 
    process.exit(1); 
});
