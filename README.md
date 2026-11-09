# Finance One-Stop

A personal, real-time market explorer. It runs as one small Node server that collects public data, and an installable web app (PWA) that works on your PC and your phone. Both devices talk to the same server, so your watchlist, saved reports and AI research stay in sync.

| Area | What you get | Live source |
| --- | --- | --- |
| **Dashboard** | Market snapshot (one-line headline + summary of the day, pre/open/post status), Fear & Greed index (computed from six market signals, with 1-week/1-month comparison), valuation gauge (Shiller CAPE percentile since 1881), VIX/SPY/Bitcoin tiles, top-story summary; upcoming events (notable, earnings by day with logos, US economic calendar with forecasts); mid- and long-term market trends; index pulse and watchlist | Yahoo Finance, multpl.com, ForexFactory calendar, Nasdaq earnings calendar, SEC 13F, House PTRs |
| **Explore → Super-Investors** | 21 well-known funds (Berkshire, Duquesne, Pershing, Appaloosa, Coatue…), top conviction plays (New / Added / Reduced / Exited), largest funds, latest notable trades, 8-quarter sector concentration chart plus per-fund mix, fund detail pages | SEC EDGAR 13F-HR filings, OpenFIGI for CUSIP→ticker |
| **Explore → Congress** | Committee-conflict ("suspicious") trades, who beats the S&P 500, what Congress is buying (30d/90d/1y), sector flow treemap, first-time buys, latest disclosures, member pages with photos | House Clerk periodic transaction reports (PDFs parsed on the server), unitedstates/congress-legislators |
| **Explore → Socials** | StockTwits trending with "why it's trending" and bull/bear sentiment; Reddit fastest risers and mention leaderboard per subreddit | StockTwits public API, ApeWisdom |
| **Explore → Insider** | Cluster buys, buy-the-dip trades (≥15% under the 90-day peak), filterable recent Form 4 trades (buys/sells, CEO/CFO/director, $ size) | SEC EDGAR Form 4 (live feed plus a 10-day backfill) |
| **Ideas** | Ask for a research report on any topic or ticker; Claude writes it from the app's live data plus web search. Save, read and delete across devices | Anthropic API (optional) |
| **Headlines** | For You (includes your watchlist), US, China, Japan, Europe, Crypto; filter by Markets / Economy / Earnings / Company / Deals / Policy / Commodities / Crypto, plus Watchlist / Important; each story tagged with the companies it mentions and their live price | MarketWatch, Google News, Yahoo Finance RSS |
| **Ticker pages** | Price chart (5D–5Y), social sentiment and posts, insider and Congress trades, tracked-fund holders, news, one-tap AI "full analysis" | all of the above |

### How "real time" works
* The server refreshes in the background: insider filings every 5 min, social and news every 5 min, Congress every hour, 13F every 6 h.
* While the app is open, prices are pushed every 15 seconds over Server-Sent Events (the green dot next to the search icon shows the live connection), and any section that gets new data re-renders itself.
* When you switch back to the app (unlock your phone, switch tabs) it reconnects and refreshes immediately.

## Run it on your PC

Requires Node.js 22 or newer.

**Windows, first time only:** install Node.js, then **close and reopen PowerShell** so it can find `npm`:

```powershell
winget install OpenJS.NodeJS.LTS
# (or download the LTS installer from https://nodejs.org)
node -v        # should print v22 or higher
```

If PowerShell then says *"running scripts is disabled on this system"*, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Edit your settings with `notepad .env` (on Windows `cp` works in PowerShell; in Command Prompt use `copy .env.example .env`).

```bash
git clone https://github.com/eternalfreedom/Finance-one-stop.git
cd Finance-one-stop
npm install
cp .env.example .env      # set SEC_USER_AGENT to "FinanceOneStop/1.0 you@example.com"
npm start                 # http://localhost:8080
```

The first load of each tab takes a little longer while the server fetches filings (13F ≈ 40 s, Congress PDFs ≈ 1 min). After that, results are cached on disk in `./data`. The insider tab backfills the last ~10 days of Form 4 filings in batches of ~400 every 5 minutes.

## Use it on your phone too

Pick one:

1. **Same Wi-Fi:** open `http://<your-PC's-LAN-IP>:8080` on the phone.
2. **Anywhere, private:** install [Tailscale](https://tailscale.com) on the PC and phone, then open `http://<pc-name>:8080`.
3. **Anywhere, hosted:** deploy the server (always on, nothing to keep running at home):
   * **Render:** New → Blueprint → select this repo (`render.yaml` is included). Set `SEC_USER_AGENT`, `APP_PASSCODE`, and optionally `ANTHROPIC_API_KEY`.
   * **Docker / Fly.io / Railway / any VPS:** `docker build -t fos . && docker run -p 8080:8080 -v fos-data:/data --env-file .env fos`

**Set `APP_PASSCODE` whenever the app is reachable from the internet.** Each device asks for it once and then remembers it.

Then on the phone: Safari → Share → *Add to Home Screen* (iOS) or Chrome → *Install app* (Android). It opens full-screen like a native app. On the PC, Chrome/Edge show an install icon in the address bar.

## Optional connectors

| Variable | Enables |
| --- | --- |
| `ANTHROPIC_API_KEY` | AI research reports and "Full analysis" (Claude Opus 5.5 with web search; refusals fall back automatically). Each report costs a few cents of API usage. |
| `FINNHUB_API_KEY` | Fallback stock quotes if Yahoo rate-limits your server. |
| `OPENFIGI_API_KEY` | Faster CUSIP→ticker mapping for 13F holdings. |
| `CONGRESS_MAX_FILINGS` | How many recent House PTR filings to parse (default 120). |

## Notes and limits
* Congress coverage is the House of Representatives (electronic filings). Senate eFD has no open feed, and paper/scanned filings can't be parsed.
* "Suspicious trades" are trades in a sector overseen by one of the member's committees. Sector comes from the company's SEC SIC code, so it is approximate. It is a prompt to look closer, not an accusation.
* 13F filings lag by up to 45 days after quarter end and cover only US long positions. Congress disclosures lag up to 45 days. Form 4s lag 2 business days.
* Sentiment is from author-tagged StockTwits posts; Reddit counts come from ApeWisdom.
* This is a personal research tool, **not investment advice**.

## Development

```
server/index.js            HTTP server, API routes, SSE live updates, refresh scheduler
server/lib/net.js          fetch with polite per-host rate limits + caching
server/lib/quotes.js       prices and history
server/lib/superinvestors.js  13F engine
server/lib/congress.js     House PTR engine (PDF parsing, committees, returns)
server/lib/insider.js      Form 4 engine
server/lib/social.js       StockTwits + Reddit
server/lib/news.js         RSS headlines
server/lib/ai.js           Claude research reports
server/lib/store.js        synced user state (watchlist, saved, reports)
public/                    the web app (no build step)
```

`npm run check` runs the offline parser tests.
