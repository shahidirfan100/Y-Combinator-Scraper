# Y Combinator Companies Scraper

## Overview

This Apify actor efficiently scrapes company listings from the Y Combinator directory. It provides comprehensive data on YC-funded startups, including basic company information, founders, and open job opportunities. Perfect for market research, investment analysis, and talent scouting.

## Features

- **Comprehensive Company Data**: Extracts detailed information about Y Combinator companies, including names, descriptions, locations, and funding details.
- **Flexible Scraping Options**: Choose to scrape all companies or focus on specific batches via custom URLs.
- **Founder Information**: Optionally retrieve founder details including names and social media profiles.
- **Job Opportunities**: Discover open positions at YC companies with full job descriptions.
- **Pagination Handling**: Automatically navigates through directory pages to collect the desired number of results.
- **Proxy Support**: Built-in proxy configuration for reliable data extraction.
- **Structured Output**: Saves all data in a clean, consistent JSON format to an Apify dataset.

## Input Parameters

The actor accepts the following input parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `url` | string | Specific Y Combinator directory URL to start scraping from (e.g., `https://www.ycombinator.com/companies?batch=Summer%202025`). If provided, overrides the default directory URL. | - |
| `scrape_all_companies` | boolean | If `true`, scrape companies from the entire directory. If `false`, use the provided `url` or default to the main directory page. | `false` |
| `scrape_founders` | boolean | If `true`, visit individual company pages to extract founder information. | `true` |
| `scrape_open_jobs` | boolean | If `true`, visit individual company pages to extract open job listings. | `true` |
| `results_wanted` | integer | Maximum number of companies to collect. Set to a high number or leave empty to collect all available. | `100` |
| `max_pages` | integer | Maximum number of directory pages to visit as a safety limit. | `20` |
| `proxyConfiguration` | object | Proxy settings for the scraper. Recommended to use Apify Proxy for best results. | `{"useApifyProxy": true, "apifyProxyGroups": ["RESIDENTIAL"]}` |

## Output Data

The actor outputs structured data for each company to an Apify dataset. Each record contains:

### Basic Company Information
- `company_image`: URL of the company's logo
- `company_id`: Unique identifier for the company
- `company_name`: Official company name
- `url`: Link to the company's Y Combinator profile page
- `short_description`: Brief company description
- `long_description`: Detailed company description
- `batch`: Y Combinator batch (e.g., "S25", "W24")
- `status`: Current company status (e.g., "Active", "Acquired")
- `tags`: Array of industry or technology tags
- `company_location`: Geographic location of the company
- `year_founded`: Year the company was founded
- `team_size`: Number of team members
- `primary_partner`: Main Y Combinator partner associated with the company
- `website`: Company's official website URL
- `company_linkedin`: LinkedIn profile URL
- `company_x`: X (formerly Twitter) profile URL

### Founders (when `scrape_founders` is enabled)
- `founders`: Array of founder objects, each containing:
  - `id`: Founder identifier
  - `name`: Founder's full name
  - `linkedin`: LinkedIn profile URL
  - `x`: X profile URL

### Open Jobs (when `scrape_open_jobs` is enabled)
- `open_jobs`: Array of job objects, each containing:
  - `id`: Job posting identifier
  - `title`: Job title
  - `description_url`: URL to the full job description
  - `description`: Job description text
  - `location`: Job location
  - `salary`: Salary information
  - `years_experience`: Required years of experience

### Example Output Record

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

### Basic Usage

1. **Run the Actor**: Start the actor from the Apify platform or via API.
2. **Configure Inputs**: Set your desired parameters in the input form.
3. **Monitor Progress**: Track scraping progress in real-time.
4. **Access Results**: Download the dataset in JSON, CSV, or other formats.

### Advanced Configuration

- **Target Specific Batches**: Use the `url` parameter to focus on particular Y Combinator batches (e.g., Summer 2025, Winter 2024).
- **Large-Scale Scraping**: Increase `results_wanted` and `max_pages` for comprehensive data collection.
- **Performance Optimization**: Adjust proxy settings based on your Apify plan for faster, more reliable scraping.

## Configuration Examples

### Scrape Summer 2025 Batch Companies with Founders

```json
{
  "url": "https://www.ycombinator.com/companies?batch=Summer%202025",
  "scrape_founders": true,
  "scrape_open_jobs": false,
  "results_wanted": 50
}
```

### Scrape All Companies with Full Details

```json
{
  "scrape_all_companies": true,
  "scrape_founders": true,
  "scrape_open_jobs": true,
  "results_wanted": 1000,
  "max_pages": 50
}
```

### Quick Company Overview

```json
{
  "scrape_founders": false,
  "scrape_open_jobs": false,
  "results_wanted": 100
}
```

## Limitations

- The actor respects Y Combinator's website terms of service and implements appropriate delays between requests.
- Some company data may be incomplete if not publicly available on the directory.
- Job and founder information requires additional page visits, which may increase scraping time.
- Results are limited by the current state of the Y Combinator directory and may not include the most recently added companies.

## Support

For issues, feature requests, or questions about this actor:

- Check the [Apify documentation](https://docs.apify.com/) for general guidance.
- Review the actor's source code for implementation details.
- Contact the actor maintainer through the Apify platform.

## Changelog

- **v1.0.0**: Initial release with full Y Combinator directory scraping capabilities.