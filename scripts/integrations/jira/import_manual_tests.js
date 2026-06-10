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
          i++; // skip next quote
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
        if (char === '\r') i++; // skip \n
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

// Gọi API Jira để lấy projectId
async function getJiraProjectId() {
  const url = `${JIRA_BASE_URL}/rest/api/3/project/${JIRA_PROJECT_KEY}`;
  log('LOG', `Đang lấy Project ID cho project key: ${JIRA_PROJECT_KEY}...`);
  try {
    const res = await axios.get(url, {
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Accept': 'application/json'
      }
    });
    log('LOG', `Đã lấy Project ID: ${res.data.id}`);
    return res.data.id;
  } catch (err) {
    log('ERROR', `Không lấy được Project ID: ${err.message}`);
    throw err;
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
      log('ERROR', `Response Data: ${JSON.stringify(err.response.data)}`);
    }
    return null;
  }
}

// Tạo thư mục trong Test Repository
async function createTestRepositoryFolder(projectId, folderPath, token) {
  const mutation = `
    mutation CreateFolder($projectId: String!, $path: String!) {
      createFolder(projectId: $projectId, path: $path) {
        folder {
          name
          path
        }
        warnings
      }
    }
  `;
  log('LOG', `Đang tạo thư mục: ${folderPath}...`);
  const data = await callXrayGraphQL(mutation, { projectId, path: folderPath }, token);
  if (data && data.createFolder) {
    log('LOG', `Đã tạo thư mục thành công hoặc đã tồn tại: ${folderPath}`);
    return true;
  }
  return false;
}

// Tạo Test Case mới và gán folder qua Xray GraphQL createTest
async function createTestCase(projectId, projectKey, folderPath, testCaseData, token) {
  const mutation = `
    mutation CreateTest($testType: UpdateTestTypeInput!, $steps: [CreateStepInput], $folderPath: String, $jira: JSON!) {
      createTest(testType: $testType, steps: $steps, folderPath: $folderPath, jira: $jira) {
        test {
          issueId
          jira(fields: ["key"])
        }
        warnings
      }
    }
  `;

  // map các cột từ CSV row:
  // TC ID, Module, Risk Level, Test Scenario, Pre-Condition, Test Steps, Test Data, Expected Result, Priority
  const [tcId, moduleName, riskLevel, scenario, preCondition, stepsText, testDataText, expectedText, priority] = testCaseData;

  const summary = `[${tcId}] ${scenario}`;
  const description = `* **Module:** ${moduleName}\n* **Risk Level:** ${riskLevel}\n* **Priority:** ${priority}\n* **Pre-Condition:**\n${preCondition}`;

  const variables = {
    testType: { name: 'Manual' },
    steps: [
      {
        action: stepsText || 'N/A',
        data: testDataText || 'N/A',
        result: expectedText || 'N/A'
      }
    ],
    folderPath: folderPath,
    jira: {
      fields: {
        summary: summary,
        description: description,
        project: { key: projectKey }
      }
    }
  };

  log('LOG', `Đang tạo Test Case: ${tcId} - ${scenario.substring(0, 40)}...`);
  const data = await callXrayGraphQL(mutation, variables, token);
  if (data && data.createTest && data.createTest.test) {
    const testInfo = data.createTest.test;
    log('LOG', `Tạo Test Case thành công: ${testInfo.jira.key} (ID: ${testInfo.issueId}) và gán vào ${folderPath}`);
    return testInfo.issueId;
  }
  return null;
}

// Xử lý import một bộ test case từ CSV
async function importCsvSuite(projectId, projectKey, csvFilePath, folderPath, token) {
  log('LOG', `=== ĐẦU IN TIẾN TRÌNH IMPORT CSV: ${csvFilePath} ===`);
  if (!fs.existsSync(csvFilePath)) {
    log('WARN', `File không tồn tại: ${csvFilePath}`);
    return;
  }

  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  const rows = parseCSV(csvContent);
  
  // Lấy data rows (bỏ qua header)
  const dataRows = rows.slice(1).filter(row => row.length >= 9 && row[0].trim() !== '');

  log('LOG', `Tìm thấy ${dataRows.length} test cases cần import.`);

  // Tạo folder trước
  await createTestRepositoryFolder(projectId, folderPath, token);

  let successCount = 0;
  for (const row of dataRows) {
    const issueId = await createTestCase(projectId, projectKey, folderPath, row, token);
    if (issueId) {
      successCount++;
    }
    // Delay nhỏ tránh rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  log('LOG', `=== HOÀN THÀNH IMPORT CSV: ${csvFilePath} (Thành công: ${successCount}/${dataRows.length}) ===\n`);
}

async function main() {
  const xrayToken = await getXrayCloudToken();
  if (!xrayToken) {
    log('ERROR', 'Không lấy được Xray Cloud Token.');
    process.exit(1);
  }

  const projectId = await getJiraProjectId();
  
  // Tạo thư mục tổng "Customer Management"
  await createTestRepositoryFolder(projectId, '/Customer Management', xrayToken);

  // Định nghĩa các bộ test case cần import
  const suites = [
    {
      csvPath: 'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_list.csv',
      folderPath: '/Customer Management/SCRUM-10 - View Customer List'
    },
    {
      csvPath: 'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_view_edit.csv',
      folderPath: '/Customer Management/SCRUM-11 - View and Edit Customer from List'
    },
    {
      csvPath: 'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_delete.csv',
      folderPath: '/Customer Management/SCRUM-12 - Delete Customer from List'
    }
  ];

  for (const suite of suites) {
    await importCsvSuite(projectId, JIRA_PROJECT_KEY, suite.csvPath, suite.folderPath, xrayToken);
  }

  log('LOG', 'HOÀN THÀNH TẤT CẢ CÁC BỘ TEST CASES!');
}

main().catch(err => {
  log('ERROR', `Lỗi ngoài ý muốn: ${err.message}`);
  process.exit(1);
});
