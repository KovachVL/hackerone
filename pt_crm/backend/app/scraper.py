import json
import time
import random
import logging
from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def scrape_h1_hacktivity(limit=50):
    """
    Продвинутый скрапер с защитой от обнаружения (Anti-Detect).
    Использует Playwright + ручные Stealth-скрипты для обхода Cloudflare и WAF.
    """
    logger.info("Starting Stealth Scraper for HackerOne...")
    
    collected_reports = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-position=0,0",
                "--ignore-certifcate-errors",
                "--ignore-certifcate-errors-spki-list",
                "--disable-accelerated-2d-canvas",
                "--disable-gpu",
            ]
        )
        
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York",
            permissions=["geolocation"]
        )
        
        page = context.new_page()
        
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        def route_intercept(route):
            if route.request.resource_type in ["image", "media", "font", "stylesheet"]:
                route.abort()
            else:
                route.continue_()
        
        page.route("**/*", route_intercept)

        def handle_response(response):
            try:
                if "graphql" in response.url and response.status == 200:
                    json_data = response.json()
                    if "data" in json_data and "search" in json_data["data"]:
                        edges = json_data["data"]["search"].get("edges", [])
                        if edges:
                            logger.info(f"⚡ Intercepted {len(edges)} reports from live traffic!")
                            for edge in edges:
                                node = edge.get("node", {})
                                if node:
                                    collected_reports.append(node)
            except Exception:
                pass 

        page.on("response", handle_response)
        
        logger.info("Navigating to HackerOne Hacktivity...")
        try:
            page.goto("https://hackerone.com/hacktivity?querystring=disclosed%3Atrue", timeout=60000)
            
            page.mouse.move(random.randint(100, 500), random.randint(100, 500))
            time.sleep(random.uniform(1, 3))
            
            try:
                page.wait_for_selector("div.hacktivity-item", timeout=15000)
            except:
                logger.warning("Main content not found immediately. Possible Cloudflare challenge. Waiting longer...")
                time.sleep(5)
            
            logger.info("Scrolling feed...")
            for _ in range(3):
                scroll_y = random.randint(3000, 5000)
                page.mouse.wheel(0, scroll_y)
                time.sleep(random.uniform(2.0, 3.0))
                
        except Exception as e:
            logger.error(f"Navigation error: {e}")
            
        browser.close()

    unique_reports = {r['id']: r for r in collected_reports}.values()
    logger.info(f"Scraping finished. Total unique reports: {len(unique_reports)}")
    
    return process_raw_data(list(unique_reports))

def process_raw_data(raw_reports):
    hunters_map = {}
    
    for report in raw_reports:
        reporter = report.get("reporter", {})
        if not reporter: continue
        
        username = reporter.get("username", "unknown")
        
        if username not in hunters_map:
            hunters_map[username] = {
                "id": reporter.get("id"),
                "username": username,
                "avatar": reporter.get("profile_picture", {}).get("medium") or f"https://api.dicebear.com/7.x/avataaars/svg?seed={username}",
                "rank": reporter.get("rank", 0),
                "signal": reporter.get("signal", 0),
                "impact": reporter.get("impact", 0),
                "total_bounty": 0,
                "reports": [],
                "programs": set()
            }
            
        bounty = report.get("bounty_amount") or 0
        program = report.get("team", {}).get("name", "Unknown")
        
        hunters_map[username]["total_bounty"] += bounty
        hunters_map[username]["programs"].add(program)
        
        hunters_map[username]["reports"].append({
            "severity": report.get("severity_rating"),
            "cwe": report.get("weakness", {}).get("name") if report.get("weakness") else "Unknown"
        })

    result = []
    for h in hunters_map.values():
        cwes = [r["cwe"] for r in h["reports"] if r["cwe"] != "Unknown"]
        top_cwe = max(set(cwes), key=cwes.count) if cwes else "Generalist"
        
        base_score = (h["signal"] or 0) * 8 + (h["impact"] or 0)
        if h["total_bounty"] > 10000: base_score += 10
        
        score = int(base_score)
        if score > 99: score = 99
        if score < 10: score = 10
        
        h["top_cwe"] = top_cwe
        h["pt_fit_score"] = score
        h["programs"] = list(h["programs"])[:3]
        h["last_active"] = "Live Feed"
        
        del h["reports"]
        result.append(h)
        
    return sorted(result, key=lambda x: x["pt_fit_score"], reverse=True)

if __name__ == "__main__":
    data = scrape_h1_hacktivity()
    print(json.dumps(data, indent=2))
