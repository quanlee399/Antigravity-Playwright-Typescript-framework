const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getXrayCloudToken, buildXrayHeaders } = require('./xray_auth');
const { loadEnv, log } = require('./utils');

// Khởi tạo env
loadEnv();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL.replace(/\/+$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'SCRUM';
const XRAY_GRAPHQL_URL = 'https://xray.cloud.getxray.app/api/v2/graphql';

const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Issue Type IDs
const TEST_SET_TYPE_ID = '10014';
const TEST_EXECUTION_TYPE_ID = '10015';

// Hàm parse CSV đơn giản
function parseCSV(csvText) {
  const result = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        row.push(cell);
        result.push(row);
        row = [];
        cell = '';
        if (char === '\r') i++;
      } else {
        cell += char;
      }
    }
  }
  if (cell || row.length > 0) {
    row.push(cell);
    result.push(row);
  }
  return result;
}

// Đọc danh sách TC IDs từ các file CSV
function getTcIdsFromCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    log('WARN', `File không tồn tại: ${filePath}`);
    return [];
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  // Bỏ qua header
  const dataRows = rows.slice(1).filter(row => row.length >= 9 && row[0].trim() !== '');
  return dataRows.map(row => row[0].trim());
}

// Lấy tất cả Test Issues từ Jira
async function getJiraTestIssues() {
  let allIssues = [];
  let nextPageToken = null;
  let isLast = false;

  log('LOG', `Đang tìm kiếm các issue type 'Test' thuộc project '${JIRA_PROJECT_KEY}'...`);

  while (!isLast) {
    const jql = `project = "${JIRA_PROJECT_KEY}" AND issuetype = "Test"`;
    const url = `${JIRA_BASE_URL}/rest/api/3/search/jql`;
    
    const payload = {
      jql: jql,
      maxResults: 100,
      fields: ['summary']
    };
    if (nextPageToken) {
      payload.nextPageToken = nextPageToken;
    }

    try {
      const res = await axios.post(url, payload, {
        headers: {
          'Authorization': `Basic ${jiraAuth}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const issues = res.data.issues || [];
      allIssues = allIssues.concat(issues);
      
      nextPageToken = res.data.nextPageToken;
      isLast = res.data.isLast;
      if (!nextPageToken) {
        isLast = true;
      }
    } catch (err) {
      log('ERROR', `Lỗi khi gọi JQL search: ${err.message}`);
      throw err;
    }
  }

  log('LOG', `Tìm thấy tổng cộng ${allIssues.length} issues type 'Test'.`);
  return allIssues;
}

// Tạo một Jira Issue mới
async function createJiraIssue(summary, issueTypeId) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issue`;
  try {
    const res = await axios.post(url, {
      fields: {
        summary: summary,
        project: { key: JIRA_PROJECT_KEY },
        issuetype: { id: issueTypeId }
      }
    }, {
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return {
      id: res.data.id,
      key: res.data.key
    };
  } catch (err) {
    log('ERROR', `Lỗi khi tạo issue type ${issueTypeId}: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `Chi tiết: ${JSON.stringify(err.response.data.errors || err.response.data)}`);
    }
    throw err;
  }
}

// Link hai Jira Issues (Relates)
async function linkJiraIssues(storyKey, targetKey) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issueLink`;
  try {
    await axios.post(url, {
      type: {
        name: 'Relates'
      },
      inwardIssue: {
        key: storyKey
      },
      outwardIssue: {
        key: targetKey
      }
    }, {
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    log('LOG', `Đã liên kết thành công ${targetKey} với User Story ${storyKey}`);
    return true;
  } catch (err) {
    log('ERROR', `Lỗi khi tạo liên kết giữa ${storyKey} và ${targetKey}: ${err.message}`);
    return false;
  }
}

// Gọi Xray GraphQL API
async function callXrayGraphQL(query, variables, token) {
  try {
    const response = await axios.post(
      XRAY_GRAPHQL_URL,
      { query, variables },
      {
        headers: buildXrayHeaders('cloud', token)
      }
    );
    if (response.data.errors) {
      log('ERROR', `GraphQL Errors: ${JSON.stringify(response.data.errors)}`);
      return null;
    }
    return response.data.data;
  } catch (err) {
    log('ERROR', `GraphQL Request failed: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `GraphQL Response Data: ${JSON.stringify(err.response.data)}`);
    }
    return null;
  }
}

// Add Tests to Test Set
async function addTestsToTestSet(testSetId, testIssueIds, token) {
  const mutation = `
    mutation AddTestsToTestSet($issueId: String!, $testIssueIds: [String]!) {
      addTestsToTestSet(issueId: $issueId, testIssueIds: $testIssueIds) {
        addedTests
        warning
      }
    }
  `;
  const data = await callXrayGraphQL(mutation, { issueId: testSetId, testIssueIds }, token);
  if (data && data.addTestsToTestSet) {
    const added = data.addTestsToTestSet.addedTests || [];
    log('LOG', `Đã thêm thành công ${added.length} test cases vào Test Set (ID: ${testSetId}).`);
    return added;
  }
  return [];
}

// Add Tests to Test Execution
async function addTestsToTestExecution(testExecutionId, testIssueIds, token) {
  const mutation = `
    mutation AddTestsToTestExecution($issueId: String!, $testIssueIds: [String]!) {
      addTestsToTestExecution(issueId: $issueId, testIssueIds: $testIssueIds) {
        addedTests
        warning
      }
    }
  `;
  const data = await callXrayGraphQL(mutation, { issueId: testExecutionId, testIssueIds }, token);
  if (data && data.addTestsToTestExecution) {
    const added = data.addTestsToTestExecution.addedTests || [];
    log('LOG', `Đã thêm thành công ${added.length} test cases vào Test Execution (ID: ${testExecutionId}).`);
    return added;
  }
  return [];
}

async function main() {
  // 1. Xác thực Xray
  const xrayToken = await getXrayCloudToken();
  if (!xrayToken) {
    log('ERROR', 'Không lấy được Xray Cloud Token.');
    process.exit(1);
  }

  // 2. Đọc TC IDs của từng bộ từ CSV
  log('LOG', 'Đang đọc danh sách TC IDs từ CSV...');
  const csvFiles = {
    'SCRUM-10': 'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_list.csv',
    'SCRUM-11': 'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_view_edit.csv',
    'SCRUM-12': 'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_delete.csv'
  };

  const storyTcsMap = {};
  for (const [storyKey, filePath] of Object.entries(csvFiles)) {
    const tcIds = getTcIdsFromCsv(filePath);
    storyTcsMap[storyKey] = new Set(tcIds);
    log('LOG', `- Bộ ${storyKey} chứa ${tcIds.length} TC IDs.`);
  }

  // 3. Lấy tất cả Test Issues hiện có trên Jira
  const testIssues = await getJiraTestIssues();
  
  // Phân loại Test Issue IDs (database ID của Jira, e.g. "10014") theo Story
  const storyJiraIdsMap = {
    'SCRUM-10': [],
    'SCRUM-11': [],
    'SCRUM-12': []
  };

  for (const issue of testIssues) {
    const summary = issue.fields.summary || '';
    // Tìm TC ID trong Summary [SCRUM_CUSTOMER_TC_XXX]
    const match = summary.match(/\[(SCRUM_[A-Z0-9_]+)\]/);
    if (match) {
      const tcId = match[1];
      // Kiểm tra xem TC ID này thuộc bộ nào
      for (const [storyKey, tcSet] of Object.entries(storyTcsMap)) {
        if (tcSet.has(tcId)) {
          storyJiraIdsMap[storyKey].push(issue.id);
          break;
        }
      }
    }
  }

  for (const [storyKey, ids] of Object.entries(storyJiraIdsMap)) {
    log('LOG', `- Tìm thấy ${ids.length} Jira Test Issues tương ứng cho bộ ${storyKey}`);
  }

  // 4. Tạo Test Set & Test Execution cho từng Story
  const stories = ['SCRUM-10', 'SCRUM-11', 'SCRUM-12'];

  for (const storyKey of stories) {
    log('LOG', `\n=== BẮT ĐẦU XỬ LÝ BỘ TEST CASE CHO USER STORY: ${storyKey} ===`);
    const testIssueIds = storyJiraIdsMap[storyKey];
    
    if (testIssueIds.length === 0) {
      log('WARN', `Không tìm thấy Test Case nào trên Jira cho User Story ${storyKey}. Bỏ qua.`);
      continue;
    }

    // A. Tạo Test Set
    const testSetName = `${storyKey.replace('-', ' - ')}`; // ví dụ "SCRUM - 10"
    log('LOG', `Đang tạo Test Set: "${testSetName}"...`);
    const testSet = await createJiraIssue(testSetName, TEST_SET_TYPE_ID);
    log('LOG', `Đã tạo thành công Test Set: Key = ${testSet.key} (ID: ${testSet.id})`);

    // B. Tạo Test Execution
    const testExecName = `${storyKey.replace('-', ' - ')}`; // ví dụ "SCRUM - 10"
    log('LOG', `Đang tạo Test Execution: "${testExecName}"...`);
    const testExec = await createJiraIssue(testExecName, TEST_EXECUTION_TYPE_ID);
    log('LOG', `Đã tạo thành công Test Execution: Key = ${testExec.key} (ID: ${testExec.id})`);

    // C. Liên kết Link vào User Story tương ứng
    log('LOG', `Đang liên kết Test Set & Test Execution vào User Story ${storyKey}...`);
    await linkJiraIssues(storyKey, testSet.key);
    await linkJiraIssues(storyKey, testExec.key);

    // D. Thêm các Test Cases vào Test Set qua Xray GraphQL
    log('LOG', `Đang thêm các Test Cases vào Test Set ${testSet.key}...`);
    await addTestsToTestSet(testSet.id, testIssueIds, xrayToken);

    // E. Thêm các Test Cases vào Test Execution qua Xray GraphQL
    log('LOG', `Đang thêm các Test Cases vào Test Execution ${testExec.key}...`);
    await addTestsToTestExecution(testExec.id, testIssueIds, xrayToken);

    log('LOG', `=== HOÀN THÀNH XỬ LÝ CHO USER STORY ${storyKey}! ===`);
  }

  log('LOG', '\nHOÀN THÀNH TẤT CẢ TÁC VỤ TẠO TEST SET VÀ TEST EXECUTION!');
}

main().catch(err => {
  log('ERROR', `Lỗi ngoài ý muốn: ${err.message}`);
  process.exit(1);
});
