// Y Combinator companies scraper - CheerioCrawler implementation
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';
import { gotScraping } from 'got-scraping';
import { load as cheerioLoad } from 'cheerio';

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

        const toAbs = (href, base = 'https://www.ycombinator.com') => {
            try { return new URL(href, base).href; } catch { return null; }
        };

        const cleanText = (html) => {
            if (!html) return '';
            const $ = cheerioLoad(html);
            $('script, style, noscript, iframe').remove();
            return $.root().text().replace(/\s+/g, ' ').trim();
        };

        const initial = [];
        if (url) initial.push(url);
        else initial.push('https://www.ycombinator.com/companies');

        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        const dataset = await Dataset.open('ycombinator-companies');

        let saved = 0;

        function extractCompanyData($company) {
            const name = $company.find('h2').first().text().trim() || $company.find('a').first().text().trim() || null;
            const image = $company.find('img').first().attr('src') || null;
            const shortDesc = $company.find('p').first().text().trim() || null;
            const relUrl = $company.find('a').first().attr('href') || null;
            const companyUrl = relUrl ? toAbs(relUrl) : null;

            // Placeholder for other fields - adjust selectors as needed
            const batch = $company.find('[data-batch]').text().trim() || $company.find('.batch').text().trim() || null;
            const status = $company.find('.status').text().trim() || null;
            const tags = $company.find('.tag').map((_, el) => $(el).text().trim()).get() || [];
            const location = $company.find('.location').text().trim() || null;
            const yearFounded = $company.find('.year-founded').text().trim() || null;
            const teamSize = $company.find('.team-size').text().trim() || null;
            const primaryPartner = $company.find('.primary-partner').text().trim() || null;
            const website = $company.find('.website').attr('href') || null;
            const linkedin = $company.find('.linkedin').attr('href') || null;
            const x = $company.find('.x').attr('href') || null;

            return {
                company_image: image,
                company_id: null, // Extract from URL or data attribute if available
                company_name: name,
                url: companyUrl,
                short_description: shortDesc,
                long_description: null, // Scrape from detail page if needed
                batch: batch,
                status: status,
                tags: tags,
                company_location: location,
                year_founded: yearFounded,
                team_size: teamSize,
                primary_partner: primaryPartner,
                website: website,
                company_linkedin: linkedin,
                company_x: x,
                founders: [],
                open_jobs: []
            };
        }

        function extractAlgoliaOpts($) {
            const scripts = $('script').filter((_, el) => $(el).html().includes('window.AlgoliaOpts'));
            if (scripts.length) {
                const scriptText = scripts.first().html();
                const match = scriptText.match(/window\.AlgoliaOpts\s*=\s*({[^}]+})/);
                if (match) {
                    try {
                        return JSON.parse(match[1]);
                    } catch (e) { /* ignore */ }
                }
            }
            return null;
        }

        function mapHitToData(hit) {
            return {
                company_image: hit.logo_url || null,
                company_id: hit.id || hit.objectID || null,
                company_name: hit.name || null,
                url: hit.url ? toAbs(hit.url) : null,
                short_description: hit.one_liner || hit.description || null,
                long_description: hit.description || null,
                batch: hit.batch || null,
                status: hit.status || null,
                tags: hit.tags || [],
                company_location: hit.location || null,
                year_founded: hit.year_founded || null,
                team_size: hit.team_size || null,
                primary_partner: hit.primary_partner || null,
                website: hit.website ? toAbs(hit.website) : null,
                company_linkedin: hit.linkedin_url ? toAbs(hit.linkedin_url) : null,
                company_x: hit.twitter_url ? toAbs(hit.twitter_url) : null,
                founders: [], // Will be filled in DETAIL
                open_jobs: [] // Will be filled in DETAIL
            };
        }

        const crawler = new CheerioCrawler({
            proxyConfiguration: proxyConf,
            maxRequestRetries: 3,
            useSessionPool: true,
            maxConcurrency: 10,
            requestHandlerTimeoutSecs: 60,
            async requestHandler({ request, $, enqueueLinks, log: crawlerLog }) {
                const label = request.userData?.label || 'LIST';
                const pageNo = request.userData?.pageNo || 1;

                if (label === 'API_LIST') {
                    const apiData = request.userData.apiData;
                    const batch = request.userData.batch;
                    const pageNo = request.userData.pageNo;
                    try {
                        const response = await gotScraping.post(apiData.url, {
                            json: apiData.body,
                            headers: {
                                'x-algolia-application-id': apiData.params.get('x-algolia-application-id'),
                                'x-algolia-api-key': apiData.params.get('x-algolia-api-key'),
                            },
                            proxyUrl: proxyConf ? proxyConf.newUrl() : undefined, // Use proxy if available
                        });
                        const json = JSON.parse(response.body);
                        const hits = json.hits || [];
                        crawlerLog.info(`API_LIST page ${pageNo} -> found ${hits.length} companies`);

                        const remaining = RESULTS_WANTED - saved;
                        const toProcess = hits.slice(0, Math.max(0, remaining));
                        for (const hit of toProcess) {
                            const data = mapHitToData(hit);
                            if (data.url && (scrape_founders || scrape_open_jobs)) {
                                await enqueueLinks({ urls: [data.url], userData: { label: 'DETAIL', companyData: data } });
                            } else {
                                await dataset.pushData(data);
                                saved++;
                            }
                        }

                        if (saved < RESULTS_WANTED && json.nbPages > pageNo + 1 && pageNo + 1 < MAX_PAGES) {
                            const nextApiData = { ...apiData };
                            nextApiData.body = { ...nextApiData.body, page: pageNo + 1 };
                            await enqueueLinks({ urls: [nextApiData.url], userData: { label: 'API_LIST', pageNo: pageNo + 1, apiData: nextApiData, batch } });
                        }
                    } catch (e) {
                        crawlerLog.error(`API_LIST page ${pageNo} -> failed: ${e.message}`);
                    }
                    return;
                }

                if (label === 'DETAIL') {
                    if (saved >= RESULTS_WANTED) return;
                    const companyData = request.userData.companyData || {};
                    try {
                        // Scrape founders
                        if (scrape_founders) {
                            const founders = [];
                            $('div.founder').each((_, el) => { // Adjust selector
                                const $f = $(el);
                                const name = $f.find('.name').text().trim() || null;
                                const linkedin = $f.find('a.linkedin').attr('href') || null;
                                const x = $f.find('a.x').attr('href') || null;
                                const id = null; // Extract if available
                                founders.push({ id, name, linkedin, x });
                            });
                            companyData.founders = founders;
                        }

                        // Scrape jobs
                        if (scrape_open_jobs) {
                            const jobs = [];
                            $('div.job').each((_, el) => { // Adjust selector
                                const $j = $(el);
                                const title = $j.find('.title').text().trim() || null;
                                const description_url = $j.find('a').attr('href') ? toAbs($j.find('a').attr('href')) : null;
                                const description = $j.find('.description').text().trim() || null;
                                const location = $j.find('.location').text().trim() || null;
                                const salary = $j.find('.salary').text().trim() || null;
                                const years_experience = $j.find('.experience').text().trim() || null;
                                const id = null;
                                jobs.push({ id, title, description_url, description, location, salary, years_experience });
                            });
                            companyData.open_jobs = jobs;
                        }

                        await dataset.pushData(companyData);
                        saved++;
                    } catch (err) { crawlerLog.error(`DETAIL ${request.url} failed: ${err.message}`); }
                }
            }
        });

        await crawler.run(initial.map(u => ({ url: u, userData: { label: 'LIST', pageNo: 1 } })));
        log.info(`Finished. Saved ${saved} items`);
    } finally {
        await Actor.exit();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
