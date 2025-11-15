# Y Combinator Companies Scraper

[![Apify Actor](https://img.shields.io/badge/Apify-Actor-blue)](https://apify.com/shahidirfan100/ycombinator-companies-scraper)
[![Scrape YC Companies](https://img.shields.io/badge/Scrape-YC%20Companies-green)](https://apify.com/shahidirfan100/ycombinator-companies-scraper)

## Overview

Discover and extract comprehensive data from the Y Combinator companies directory with this powerful scraper. Whether you're conducting market research, analyzing startup trends, or scouting talent, this tool provides structured access to YC-funded companies, their founders, and open job opportunities. Perfect for investors, recruiters, and analysts seeking insights into the startup ecosystem.

**Keywords:** Y Combinator scraper, YC companies scraper, startup directory scraper, scrape Y Combinator companies, YC batch scraper, founder data extraction, job listings scraper.

## Features

- **Complete Company Profiles**: Extract detailed information about Y Combinator-backed startups, including company names, descriptions, locations, funding batches, and status.
- **Founder Insights**: Optionally scrape founder details with names and social media links for deeper analysis.
- **Job Market Intelligence**: Access open positions at YC companies, including job titles, descriptions, locations, and salary ranges.
- **Batch-Specific Scraping**: Target specific Y Combinator batches (e.g., Summer 2025, Winter 2024) or scrape the entire directory.
- **Flexible Data Collection**: Customize what data to collect based on your research needs.
- **Reliable Extraction**: Built-in mechanisms to handle dynamic content and ensure comprehensive data retrieval.
- **Structured JSON Output**: Clean, consistent data format ready for analysis or integration.

## How It Works

This scraper navigates the Y Combinator companies directory, systematically collecting data from company profiles. It handles pagination automatically and can visit individual company pages for additional details like founders and jobs. The process is optimized for efficiency while respecting website guidelines.

## Input Parameters

Configure the scraper using the following parameters:

<table>
  <thead>
    <tr>
      <th>Parameter</th>
      <th>Type</th>
      <th>Description</th>
      <th>Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>url</code></td>
      <td>string</td>
      <td>Specific Y Combinator directory URL to start scraping (e.g., <code>https://www.ycombinator.com/companies?batch=Summer%202025</code>). Overrides default if provided.</td>
      <td>-</td>
    </tr>
    <tr>
      <td><code>scrape_all_companies</code></td>
      <td>boolean</td>
      <td>Scrape companies from the entire directory if <code>true</code>, or use provided URL/default page if <code>false</code>.</td>
      <td><code>false</code></td>
    </tr>
    <tr>
      <td><code>scrape_founders</code></td>
      <td>boolean</td>
      <td>Extract founder information from individual company pages.</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>scrape_open_jobs</code></td>
      <td>boolean</td>
      <td>Extract open job listings from company pages.</td>
      <td><code>true</code></td>
    </tr>
    <tr>
      <td><code>results_wanted</code></td>
      <td>integer</td>
      <td>Maximum number of companies to collect. Use high number for all available.</td>
      <td><code>100</code></td>
    </tr>
    <tr>
      <td><code>max_pages</code></td>
      <td>integer</td>
      <td>Maximum directory pages to visit as a safety limit.</td>
      <td><code>20</code></td>
    </tr>
    <tr>
      <td><code>proxyConfiguration</code></td>
      <td>object</td>
      <td>Proxy settings for reliable scraping. Use Apify Proxy for best results.</td>
      <td><code>{"useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"]}</code></td>
    </tr>
  </tbody>
</table>

## Output Data

The scraper outputs structured JSON records to an Apify dataset. Each record represents a company with the following fields:

### Core Company Fields
- <code>company_image</code>: Company logo URL
- <code>company_id</code>: Unique company identifier
- <code>company_name</code>: Official company name
- <code>url</code>: Y Combinator profile URL
- <code>short_description</code>: Brief company overview
- <code>long_description</code>: Detailed company description
- <code>batch</code>: YC batch (e.g., "S25", "W24")
- <code>status</code>: Company status (Active, Acquired, etc.)
- <code>tags</code>: Industry/technology tags array
- <code>company_location</code>: Geographic location
- <code>year_founded</code>: Founding year
- <code>team_size</code>: Number of team members
- <code>primary_partner</code>: Associated YC partner
- <code>website</code>: Official website URL
- <code>company_linkedin</code>: LinkedIn profile
- <code>company_x</code>: X (Twitter) profile

### Founders Data (when enabled)
- <code>founders</code>: Array of founder objects with <code>id</code>, <code>name</code>, <code>linkedin</code>, <code>x</code>

### Jobs Data (when enabled)
- <code>open_jobs</code>: Array of job objects with <code>id</code>, <code>title</code>, <code>description_url</code>, <code>description</code>, <code>location</code>, <code>salary</code>, <code>years_experience</code>

### Sample Output Record

```json
{
  "company_image": "https://example.com/logo.png",
  "company_id": "company-123",
  "company_name": "Example Startup",
  "url": "https://www.ycombinator.com/companies/example-startup",
  "short_description": "Building the future of AI",
  "long_description": "Example Startup is revolutionizing artificial intelligence with cutting-edge machine learning solutions.",
  "batch": "S25",
  "status": "Active",
  "tags": ["AI", "Machine Learning", "SaaS"],
  "company_location": "San Francisco, CA",
  "year_founded": "2023",
  "team_size": "15",
  "primary_partner": "John Doe",
  "website": "https://examplestartup.com",
  "company_linkedin": "https://linkedin.com/company/example-startup",
  "company_x": "https://x.com/example_startup",
  "founders": [
    {
      "id": "founder-1",
      "name": "Jane Smith",
      "linkedin": "https://linkedin.com/in/jane-smith",
      "x": "https://x.com/janesmith"
    }
  ],
  "open_jobs": [
    {
      "id": "job-456",
      "title": "Senior Software Engineer",
      "description_url": "https://www.ycombinator.com/companies/example-startup/jobs/senior-software-engineer",
      "description": "We are looking for a talented software engineer to join our growing team...",
      "location": "Remote",
      "salary": "$150k - $200k",
      "years_experience": "5+"
    }
  ]
}
```

## Usage

### Running on Apify Platform

1. Navigate to the [Y Combinator Companies Scraper](https://apify.com/shahidirfan100/ycombinator-companies-scraper) on Apify.
2. Click "Run" to start the actor.
3. Configure input parameters in the form.
4. Monitor progress and view results in the dataset.

### API Usage

Use the Apify API to run the scraper programmatically:

```bash
curl -X POST "https://api.apify.com/v2/acts/shahidirfan100~ycombinator-companies-scraper/runs?token=YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scrape_all_companies": true,
    "scrape_founders": true,
    "results_wanted": 500
  }'
```

### Configuration Examples

<details>
<summary><strong>Scrape Specific Batch with Founders</strong></summary>

```json
{
  "url": "https://www.ycombinator.com/companies?batch=Summer%202025",
  "scrape_founders": true,
  "scrape_open_jobs": false,
  "results_wanted": 50
}
```
</details>

<details>
<summary><strong>Comprehensive Directory Scan</strong></summary>

```json
{
  "scrape_all_companies": true,
  "scrape_founders": true,
  "scrape_open_jobs": true,
  "results_wanted": 1000,
  "max_pages": 50
}
```
</details>

<details>
<summary><strong>Quick Company Overview</strong></summary>

```json
{
  "scrape_founders": false,
  "scrape_open_jobs": false,
  "results_wanted": 100
}
```
</details>

## Cost and Performance

- **Compute Units**: Approximately 0.01-0.05 CU per company depending on data depth.
- **Estimated Cost**: $0.001-$0.005 per company (based on Apify pricing).
- **Performance**: Processes 10-50 companies per minute, depending on configuration and proxy settings.

## Limitations and Best Practices

- Respects Y Combinator's terms of service with appropriate request delays.
- Some data may be incomplete if not publicly available.
- Founder and job data requires additional page visits, increasing processing time.
- Results reflect the current state of the directory and may not include the most recent additions.
- For large-scale scraping, use residential proxies and monitor rate limits.

## Support and Resources

- **Documentation**: Refer to [Apify Docs](https://docs.apify.com/) for platform guidance.
- **Issues**: Report bugs or request features via the actor page.
- **Updates**: Check changelog for new features and improvements.

## Changelog

- **v1.0.0**: Initial release with comprehensive Y Combinator directory scraping capabilities, including company profiles, founders, and job listings.

---

**Discover more YC insights with this scraper. Start extracting valuable startup data today!**