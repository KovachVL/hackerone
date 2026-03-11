import axios from 'axios';

const H1_GRAPHQL_URL = process.env.H1_GRAPHQL_URL || "https://hackerone.com/graphql";

const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  "X-Product-Area": "leaderboard",
  "X-Product-Feature": "details",
};

export const LEADERBOARDS = [
  { key: "HIGHEST_REPUTATION_BY_ENGAGEMENT_TYPE", label: "Top Reputation" },
  { key: "HIGH_CRIT_REPUTATION_BY_ENGAGEMENT_TYPE", label: "Critical Master" },
  { key: "OWASP_TOP_10_BY_ENGAGEMENT_TYPE", label: "OWASP A01 (Access Control)", filter: "a1" },
  { key: "OWASP_TOP_10_BY_ENGAGEMENT_TYPE", label: "OWASP A03 (Injection)", filter: "a3" }
];

const QUERY_LEADERBOARD = `
query LeaderboardQuery($year: Int!, $quarter: Int, $first: Int, $after: String, $engagement_type: String, $user_type: String, $key: LeaderboardKeyEnum!, $filter: String) {
  leaderboard_entries(
    key: $key
    year: $year
    quarter: $quarter
    first: $first
    after: $after
    filter: $filter
    user_type: $user_type
    engagement_type: $engagement_type
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      node {
        ...LeaderboardFragment
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment SharedLeaderboardFragment on LeaderboardEntryInterface {
  id
  rank
  user {
    id
    username
    profile_picture(size: medium)
    __typename
  }
  __typename
}

fragment LeaderboardFragment on HighestReputationByEngagementTypeLeaderboardEntry {
  ...SharedLeaderboardFragment
  reputation
  signal
  impact
  __typename
}
`;

const QUERY_HIGH_CRIT = `
query HighCritReputationByEngagementTypeLeaderboardCard($year: Int!, $quarter: Int, $first: Int, $after: String, $engagement_type: String, $user_type: String, $key: LeaderboardKeyEnum!, $filter: String) {
  leaderboard_entries(
    key: $key
    year: $year
    quarter: $quarter
    first: $first
    after: $after
    filter: $filter
    user_type: $user_type
    engagement_type: $engagement_type
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      node {
        ...SharedLeaderboardFragment
        ...HighCritReputationByEngagementTypeLeaderboardFragment
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment SharedLeaderboardFragment on LeaderboardEntryInterface {
  id
  rank
  previous_rank
  user {
    id
    username
    profile_picture(size: medium)
    __typename
  }
  __typename
}

fragment HighCritReputationByEngagementTypeLeaderboardFragment on HighCritReputationByEngagementTypeLeaderboardEntry {
  reputation
  signal
  impact
  __typename
}
`;

const QUERY_COLLECTIVES = `
query CollectivesQuery {
  users(where: {mark_as_company_on_leaderboards: {_eq: true}}) {
    edges {
      node {
        id
        username
        profile_picture(size: medium)
        mark_as_company_on_leaderboards
        signal
        impact
        __typename
      }
      __typename
    }
    __typename
  }
}
`;

const QUERY_OWASP = `
query OwaspTopTenByEngagementTypeLeaderboardCard($year: Int!, $quarter: Int, $first: Int, $after: String, $engagement_type: String, $user_type: String, $key: LeaderboardKeyEnum!, $filter: String) {
  leaderboard_entries(
    key: $key
    year: $year
    quarter: $quarter
    first: $first
    after: $after
    filter: $filter
    user_type: $user_type
    engagement_type: $engagement_type
  ) {
    pageInfo {
      endCursor
      hasNextPage
    }
    edges {
      node {
        ...SharedLeaderboardFragment
        ...OwaspTopTenByEngagementTypeLeaderboardFragment
        __typename
      }
      __typename
    }
    __typename
  }
}

fragment SharedLeaderboardFragment on LeaderboardEntryInterface {
  id
  rank
  previous_rank
  user {
    id
    username
    profile_picture(size: medium)
    __typename
  }
  __typename
}

fragment OwaspTopTenByEngagementTypeLeaderboardFragment on OwaspTopTenByEngagementTypeLeaderboardEntry {
  reputation
  signal
  impact
  __typename
}
`;
const QUERY_HACKTIVITY = `
query HacktivitySearchQuery($queryString: String!, $from: Int, $size: Int, $sort: SortInput!) {
  search(
    index: CompleteHacktivityReportIndex
    query_string: $queryString
    from: $from
    size: $size
    sort: $sort
  ) {
    total_count
    nodes {
      ... on HacktivityDocument {
        id
        _id
        reporter {
          id
          username
          __typename
        }
        cve_ids
        cwe
        severity_rating
        public
        report {
          id
          databaseId: _id
          title
          url
          disclosed_at
          report_generated_content {
            hacktivity_summary
            __typename
          }
          __typename
        }
        team {
          handle
          name
          currency
          __typename
        }
        total_awarded_amount
        submitted_at
        __typename
      }
      __typename
    }
    __typename
  }
}
`;

async function fetchSingleLeaderboard(keyConfig) {
  let allEdges = [];
  let hasNextPage = true;
  let endCursor = null;
  let pages = 0;
  const MAX_PAGES = 3;

  console.log(`[Scraper] Fetching ${keyConfig.label}...`);

  while (hasNextPage && pages < MAX_PAGES) {
    const variables = {
      "year": 2026,
      "quarter": 1,
      "first": 100,
      "after": endCursor,
      "engagement_type": "bbp",
      "user_type": "individual",
      "key": keyConfig.key,
      "product_area": "leaderboard",
      "product_feature": "details"
    };

    let query = QUERY_LEADERBOARD;
    if (keyConfig.key === "HIGH_CRIT_REPUTATION_BY_ENGAGEMENT_TYPE") {
        query = QUERY_HIGH_CRIT;
    } else if (keyConfig.key === "OWASP_TOP_10_BY_ENGAGEMENT_TYPE") {
        query = QUERY_OWASP;
        variables.filter = keyConfig.filter;
    }

    try {
      const response = await axios.post(H1_GRAPHQL_URL, {
        query: query,
        variables: variables
      }, { headers: HEADERS });

      const data = response.data?.data?.leaderboard_entries;
      if (!data) break;

      const edgesWithTag = data.edges.map(edge => ({
          ...edge,
          source_category: keyConfig.label,
          category_rank: edge.node.rank,
          category_reputation: edge.node.reputation
      }));

      allEdges = [...allEdges, ...edgesWithTag];
      
      hasNextPage = data.pageInfo.hasNextPage;
      endCursor = data.pageInfo.endCursor;
      pages++;
      
      await new Promise(r => setTimeout(r, 300));

    } catch (error) {
      console.error(`Error fetching ${keyConfig.label}:`, error.message);
      break;
    }
  }
  return allEdges;
}

async function fetchCollectives() {
    console.log(`[Scraper] Fetching Collectives...`);
    try {
        const response = await axios.post(H1_GRAPHQL_URL, {
            operationName: "CollectivesQuery",
            variables: { product_area: "leaderboard", product_feature: "details" },
            query: QUERY_COLLECTIVES
        }, { headers: HEADERS });

        const edges = response.data?.data?.users?.edges || [];
        
        return edges.map((edge, index) => ({
            node: {
                rank: index + 1,
                reputation: 0,
                signal: edge.node.signal,
                impact: edge.node.impact,
                user: {
                    id: edge.node.id,
                    username: edge.node.username,
                    profile_picture: edge.node.profile_picture
                }
            },
            source_category: "Collectives",
            category_rank: index + 1,
            category_reputation: 0
        }));

    } catch (error) {
        console.error("Error fetching Collectives:", error.message);
        return [];
    }
}

export async function fetchAllLeaderboards() {
    const results = await Promise.all([
        ...LEADERBOARDS.map(lb => fetchSingleLeaderboard(lb)),
        fetchCollectives()
    ]);
    return results.flat();
}

export async function fetchUserHacktivity(username) {
    let allReports = [];
    let from = 0;
    const size = 25;
    
    const SAFETY_LIMIT = 2000; 

    // console.log(`[Hacktivity] Fetching reports for ${username}...`);

    while (true) {
        const variables = {
            queryString: `reporter:("${username}")`,
            from: from,
            size: size,
            sort: { field: "latest_disclosable_activity_at", direction: "DESC" }
        };

        try {
            const response = await axios.post(H1_GRAPHQL_URL, {
                operationName: "HacktivitySearchQuery",
                query: QUERY_HACKTIVITY,
                variables: variables
            }, { headers: HEADERS });

            const nodes = response.data?.data?.search?.nodes || [];
            if (nodes.length === 0) break;

            allReports = [...allReports, ...nodes];
            from += size;
            
            if (nodes.length < size) break;
            
            if (allReports.length >= SAFETY_LIMIT) {
                console.log(`[Hacktivity] Reached safety limit of ${SAFETY_LIMIT} reports for ${username}`);
                break;
            }

            await new Promise(r => setTimeout(r, 200));

        } catch (error) {
            console.error(`[Hacktivity] Error fetching for ${username}:`, error.message);
            break;
        }
    }
    return allReports;
}
