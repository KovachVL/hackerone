import axios from 'axios';
import * as cheerio from 'cheerio';
import { saveJson, getJson, OSINT_BUCKET } from './s3.js';

const H1_GRAPHQL_URL = process.env.H1_GRAPHQL_URL || "https://hackerone.com/graphql";

const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  "X-Product-Area": "other",
  "X-Product-Feature": "other",
};

const QUERY_USER_PROFILE = `
query UserProfilePageQuery($resourceIdentifier: String!) {
  user(username: $resourceIdentifier) {
    id
    username
    name
    bio
    website
    location
    profile_picture(size: large)
    bugcrowd_handle
    hack_the_box_handle
    github_handle
    gitlab_handle
    linkedin_handle
    twitter_handle
    __typename
  }
}
`;

const ACTIVE_CHECKS = [
  { name: 'GitHub', url: 'https://github.com/', checkStatus: 200, extractName: true },
  { name: 'GitLab', url: 'https://gitlab.com/', checkStatus: 200, extractName: true },
  { name: 'Reddit', url: 'https://www.reddit.com/user/', checkStatus: 200 },
  { name: 'Docker Hub', url: 'https://hub.docker.com/u/', checkStatus: 200 },
  { name: 'Medium', url: 'https://medium.com/@', checkStatus: 200 }
];

async function fetchH1Profile(username) {
    try {
        const response = await axios.post(H1_GRAPHQL_URL, {
            operationName: "UserProfilePageQuery",
            variables: { resourceIdentifier: username, product_area: "other", product_feature: "other" },
            query: QUERY_USER_PROFILE
        }, { headers: HEADERS });
        return response.data?.data?.user;
    } catch (e) { return null; }
}

export async function checkUsername(username) {
    const filename = `${username}.json`;
    
    // 1. Проверяем S3
    const cached = await getJson(OSINT_BUCKET, filename);
    if (cached) {
        // console.log(`[Sherlock] Loaded ${username} from S3.`);
        return cached;
    }

    const results = [];
    const h1Profile = await fetchH1Profile(username);
  
    if (h1Profile) {
        if (h1Profile.github_handle) results.push({ name: 'GitHub', url: `https://github.com/${h1Profile.github_handle}`, found: true, isVerified: true });
        if (h1Profile.gitlab_handle) results.push({ name: 'GitLab', url: `https://gitlab.com/${h1Profile.gitlab_handle}`, found: true, isVerified: true });
        if (h1Profile.twitter_handle) results.push({ name: 'Twitter', url: `https://twitter.com/${h1Profile.twitter_handle}`, found: true, isVerified: true });
        if (h1Profile.linkedin_handle) results.push({ name: 'LinkedIn', url: `https://linkedin.com/in/${h1Profile.linkedin_handle}`, found: true, isVerified: true });
        if (h1Profile.bugcrowd_handle) results.push({ name: 'Bugcrowd', url: `https://bugcrowd.com/${h1Profile.bugcrowd_handle}`, found: true, isVerified: true });
        if (h1Profile.hack_the_box_handle) results.push({ name: 'HackTheBox', url: `https://app.hackthebox.com/users/${h1Profile.hack_the_box_handle}`, found: true, isVerified: true });
        if (h1Profile.website) results.push({ name: 'Website', url: h1Profile.website, found: true, isVerified: true });
    }

    const checks = ACTIVE_CHECKS.map(async (site) => {
        if (results.find(r => r.name === site.name && r.found)) return null;
        try {
            const targetUrl = `${site.url}${username}`;
            const response = await axios.get(targetUrl, { validateStatus: () => true, timeout: 4000, headers: { 'User-Agent': HEADERS['User-Agent'] } });
            if (response.status === site.checkStatus) {
                let realName = null;
                if (site.extractName) {
                    const $ = cheerio.load(response.data);
                    if (site.name === 'GitHub') realName = $('span.p-name').text().trim() || $('span[itemprop="name"]').text().trim();
                    else if (site.name === 'GitLab') { const t = $('title').text(); if(t) realName = t.split('·')[0].split('(@')[0].trim(); }
                }
                return { name: site.name, url: targetUrl, found: true, realName };
            }
        } catch (e) {}
        return { name: site.name, url: `${site.url}${username}`, found: false };
    });

    const activeResults = (await Promise.all(checks)).filter(r => r !== null);
    results.push(...activeResults);

    const linkedInFound = results.find(r => r.name === 'LinkedIn');
    if (!linkedInFound) {
        const profileWithRealName = activeResults.find(r => r.found && r.realName && r.realName !== username);
        const searchName = profileWithRealName ? profileWithRealName.realName : (h1Profile?.name || username);
        results.push({
            name: `LinkedIn Search (${searchName})`,
            url: `https://www.google.com/search?q=site:linkedin.com/in/ "${searchName}"`,
            found: true,
            isSearch: true
        });
    }

    await saveJson(OSINT_BUCKET, filename, results);
    // console.log(`[Sherlock] Saved ${username} to S3.`);
    
    return results;
}

export async function runBatchSherlock(hunters) {
    console.log(`[Sherlock] Starting batch processing for ${hunters.length} hunters...`);
    const CHUNK_SIZE = 5;
    for (let i = 0; i < hunters.length; i += CHUNK_SIZE) {
        const chunk = hunters.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(h => checkUsername(h.username)));
        await new Promise(r => setTimeout(r, 500));
    }
    console.log(`[Sherlock] Batch processing complete.`);
}
