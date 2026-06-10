const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { getXrayCloudToken, buildXrayHeaders } = require('./xray_auth');
const { loadEnv, log, buildJiraHeaders } = require('./utils');

// Khởi tạo env
loadEnv();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL.replace(/\/+$/, '');
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'SCRUM';
const XRAY_CLOUD_BASE = 'https://xray.cloud.getxray.app/api/v2';
const TEST_EXECUTION_KEY = 'SCRUM-86'; // Test Execution cố định của SCRUM-10
const STORY_KEY = 'SCRUM-10'; // User Story SCRUM-10

// Đọc và parse file CSV Test Cases
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

function loadCsvTestCases(filePath) {
  if (!fs.existsSync(filePath)) {
    log('ERROR', `File CSV không tồn tại: ${filePath}`);
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCSV(content);
  const tcMap = {};
  
  // Bỏ qua header
  const dataRows = rows.slice(1).filter(row => row.length >= 9 && row[0].trim() !== '');
  for (const row of dataRows) {
    const tcId = row[0].trim();
    tcMap[tcId] = {
      tcId: tcId,
      module: row[1]?.trim() || '',
      riskLevel: row[2]?.trim() || '',
      scenario: row[3]?.trim() || '',
      preCondition: row[4]?.trim() || '',
      steps: row[5]?.trim() || '',
      testData: row[6]?.trim() || '',
      expectedResult: row[7]?.trim() || '',
      priority: row[8]?.trim() || ''
    };
  }
  return tcMap;
}

// Xây dựng nội dung Description dạng ADF (Atlassian Document Format) cho Jira Cloud Bug
function buildAdfDescription(tc, actualError) {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '1. Thông tin chung (General Info)' }]
      },
      {
        type: 'bulletList',
        content: [
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [
                { type: 'text', text: 'User Story liên kết: ', marks: [{ type: 'strong' }] },
                { type: 'text', text: STORY_KEY }
              ]
            }]
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Test Case ID: ', marks: [{ type: 'strong' }] },
                { type: 'text', text: tc.tcId }
              ]
            }]
          },
          {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Scenario: ', marks: [{ type: 'strong' }] },
                { type: 'text', text: tc.scenario }
              ]
            }]
          }
        ]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '2. Các bước thực hiện (Steps to Reproduce)' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: tc.steps }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '3. Kết quả mong muốn (Expected Result)' }]
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: tc.expectedResult }]
      },
      {
        type: 'heading',
        attrs: { level: 3 },
        content: [{ type: 'text', text: '4. Kết quả thực tế & Lỗi gặp phải (Actual Result)' }]
      },
      {
        type: 'codeBlock',
        attrs: { language: 'text' },
        content: [{ type: 'text', text: actualError || 'Test failed without explicit error log.' }]
      }
    ]
  };
}

// Tạo Bug trên Jira
async function createJiraBug(tc, actualError) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issue`;
  const headers = buildJiraHeaders();
  
  const bugPayload = {
    fields: {
      summary: `[BUG] [${STORY_KEY}] [${tc.tcId}] ${tc.scenario.substring(0, 100)}`,
      project: { key: JIRA_PROJECT_KEY },
      issuetype: { name: 'Bug' },
      description: buildAdfDescription(tc, actualError)
    }
  };

  try {
    log('LOG', `Đang tạo Bug Jira cho ${tc.tcId}...`);
    const res = await axios.post(url, bugPayload, { headers });
    log('LOG', `Đã tạo Bug thành công: Key = ${res.data.key}`);
    return res.data.key;
  } catch (err) {
    log('ERROR', `Lỗi khi tạo Bug Jira cho ${tc.tcId}: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `Chi tiết: ${JSON.stringify(err.response.data)}`);
    }
    return null;
  }
}

// Liên kết issue (relates/blocks)
async function linkJiraIssues(sourceKey, targetKey) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issueLink`;
  const headers = buildJiraHeaders();
  
  try {
    await axios.post(url, {
      type: { name: 'Relates' },
      inwardIssue: { key: sourceKey },
      outwardIssue: { key: targetKey }
    }, { headers });
    log('LOG', `Đã tạo link liên kết: ${targetKey} Relates ${sourceKey}`);
    return true;
  } catch (err) {
    log('ERROR', `Lỗi khi liên kết ${sourceKey} và ${targetKey}: ${err.message}`);
    return false;
  }
}

// Upload file đính kèm (Screenshot) lên Jira Issue
async function uploadAttachment(issueKey, filePath) {
  if (!fs.existsSync(filePath)) {
    log('WARN', `File đính kèm không tồn tại để upload: ${filePath}`);
    return false;
  }
  
  const url = `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/attachments`;
  const baseHeaders = buildJiraHeaders();
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  
  const headers = {
    ...baseHeaders,
    ...form.getHeaders(),
    'X-Atlassian-Token': 'no-check'
  };

  try {
    log('LOG', `Đang upload screenshot (${path.basename(filePath)}) lên Bug ${issueKey}...`);
    await axios.post(url, form, { headers });
    log('LOG', `Upload screenshot thành công!`);
    return true;
  } catch (err) {
    log('ERROR', `Lỗi khi upload screenshot lên ${issueKey}: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `Chi tiết: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

// Import kết quả test trực tiếp lên Test Execution có sẵn trên Xray Cloud
async function importResultsToXray(testsPayload) {
  const xrayToken = await getXrayCloudToken();
  if (!xrayToken) {
    log('ERROR', 'Không lấy được token Xray Cloud.');
    return null;
  }

  const payload = {
    testExecutionKey: TEST_EXECUTION_KEY,
    tests: testsPayload
  };

  log('LOG', `Đang import ${testsPayload.length} kết quả test vào Test Execution ${TEST_EXECUTION_KEY}...`);

  try {
    const res = await axios.post(`${XRAY_CLOUD_BASE}/import/execution`, payload, {
      headers: buildXrayHeaders('cloud', xrayToken)
    });
    log('LOG', `Đã cập nhật Test Execution thành công! Key: ${res.data.key || res.data.id}`);
    return res.data;
  } catch (err) {
    log('ERROR', `Lỗi khi import kết quả lên Xray: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `Chi tiết: ${JSON.stringify(err.response.data)}`);
    }
    return null;
  }
}

/**
 * Chuyển status của một Jira issue sang transition tương ứng
 * Ví dụ: 'In Progress', 'Done', 'To Do'
 * @param {string} issueKey - Key của Jira issue (vd: SCRUM-86)
 * @param {string} transitionName - Tên transition mong muốn (vd: 'In Progress')
 */
async function transitionJiraIssue(issueKey, transitionName) {
  const headers = buildJiraHeaders();

  try {
    // Lấy danh sách transitions khả dụng
    const transitionsRes = await axios.get(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
      { headers }
    );

    const transitions = transitionsRes.data.transitions || [];
    const target = transitions.find(
      (t) => t.name.toLowerCase() === transitionName.toLowerCase()
    );

    if (!target) {
      const available = transitions.map((t) => t.name).join(', ');
      log('WARN', `Transition "${transitionName}" không tồn tại cho ${issueKey}. Các transition khả dụng: ${available}`);
      return false;
    }

    // Thực hiện chuyển status
    await axios.post(
      `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}/transitions`,
      { transition: { id: target.id } },
      { headers }
    );

    log('LOG', `Đã chuyển status của ${issueKey} sang "${transitionName}" thành công!`);
    return true;
  } catch (err) {
    log('ERROR', `Lỗi khi chuyển status của ${issueKey}: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `Chi tiết: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

// Trích xuất thông tin test cases từ report Playwright
function extractPlaywrightResults(reportPath) {
  if (!fs.existsSync(reportPath)) {
    log('ERROR', `File report Playwright không tồn tại: ${reportPath}`);
    return [];
  }
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const results = [];

  function processSuite(suite) {
    if (suite.specs) {
      suite.specs.forEach((spec) => {
        // Tìm test key từ spec title (ví dụ: [SCRUM-13])
        const keyMatch = spec.title.match(/\[(SCRUM-\d+)\]/);
        // Tìm TC ID từ spec title (ví dụ: SCRUM_CUSTOMER_TC_001)
        const tcIdMatch = spec.title.match(/(SCRUM_[A-Z0-9_]+)/);
        
        if (keyMatch) {
          const testKey = keyMatch[1];
          const tcId = tcIdMatch ? tcIdMatch[1] : null;
          
          spec.tests.forEach((test) => {
            const lastResult = test.results[test.results.length - 1];
            const rawStatus = lastResult?.status || 'skipped';
            
            // Map status
            let xrayStatus = 'TODO';
            if (rawStatus === 'passed' || rawStatus === 'expected') {
              xrayStatus = 'PASSED';
            } else if (rawStatus === 'failed' || rawStatus === 'unexpected' || rawStatus === 'timedOut') {
              xrayStatus = 'FAILED';
            }
            
            // Lấy screenshot đính kèm nếu có
            let screenshotPath = null;
            if (lastResult?.attachments) {
              const screenshotAtt = lastResult.attachments.find(
                (att) => att.name === 'screenshot' || att.contentType === 'image/png'
              );
              if (screenshotAtt && screenshotAtt.path) {
                screenshotPath = screenshotAtt.path;
              }
            }

            // Lấy log lỗi
            let errorMessage = '';
            if (lastResult?.errors && lastResult.errors.length > 0) {
              errorMessage = lastResult.errors.map(e => e.message).join('\n');
            }

            results.push({
              testKey,
              tcId,
              status: xrayStatus,
              errorMessage,
              screenshotPath,
              title: spec.title,
              file: spec.file
            });
          });
        }
      });
    }
    if (suite.suites) {
      suite.suites.forEach(processSuite);
    }
  }

  if (report.suites) {
    report.suites.forEach(processSuite);
  }
  return results;
}

async function main() {
  const reportPath = path.resolve(__dirname, '../../../test-results.json');
  const csvPath = path.resolve(__dirname, '../../../testcases_customer_list.csv');

  console.log(`
============================================================
       JIRA & XRAY RESULTS IMPORTER AND AUTOMATED BUG REPORT
============================================================
Jira Base URL:   ${JIRA_BASE_URL}
Project Key:     ${JIRA_PROJECT_KEY}
User Story:      ${STORY_KEY}
Test Execution:  ${TEST_EXECUTION_KEY}
============================================================
`);

  // 1. Chuyển Test Execution sang "In Progress" trước khi bắt đầu
  log('LOG', `Đang chuyển Test Execution ${TEST_EXECUTION_KEY} sang "In Progress"...`);
  await transitionJiraIssue(TEST_EXECUTION_KEY, 'In Progress');

  // 2. Đọc test cases từ CSV
  log('LOG', 'Đang tải thông tin test cases từ file CSV...');
  const tcMap = loadCsvTestCases(csvPath);
  log('LOG', `Đã tải thành công ${Object.keys(tcMap).length} test cases từ CSV.`);

  // 3. Trích xuất kết quả test từ report Playwright
  log('LOG', 'Đang đọc kết quả từ test-results.json...');
  const testResults = extractPlaywrightResults(reportPath);
  
  // Lọc chỉ giữ lại các test case thuộc SCRUM-10 (SCRUM-13 đến SCRUM-30)
  const scrum10Results = testResults.filter(r => {
    const keyNum = parseInt(r.testKey.split('-')[1]);
    return keyNum >= 13 && keyNum <= 30;
  });

  log('LOG', `Tìm thấy ${scrum10Results.length} kết quả test thuộc bộ SCRUM-10.`);

  if (scrum10Results.length === 0) {
    log('WARN', 'Không tìm thấy kết quả test nào thuộc bộ SCRUM-10 để cập nhật.');
    await transitionJiraIssue(TEST_EXECUTION_KEY, 'Done');
    return;
  }

  const xrayTestsPayload = [];

  // 3. Xử lý từng kết quả
  for (const result of scrum10Results) {
    console.log(`\n------------------------------------------------------------`);
    log('LOG', `Xử lý test case: ${result.testKey} (${result.tcId || 'N/A'}) - Trạng thái: ${result.status}`);
    
    let comment = `Test executed automatically via Playwright.\nTitle: ${result.title}\nFile: ${result.file}`;
    let xrayEvidences = [];

    // Nếu test failed, thực hiện tạo bug trên Jira và upload screenshot
    if (result.status === 'FAILED' && result.tcId && tcMap[result.tcId]) {
      const tc = tcMap[result.tcId];
      
      // A. Tạo ticket Bug trên Jira
      const bugKey = await createJiraBug(tc, result.errorMessage);
      
      if (bugKey) {
        // B. Liên kết Bug với User Story SCRUM-10
        await linkJiraIssues(STORY_KEY, bugKey);
        
        // C. Liên kết Bug với Test Case tương ứng (ví dụ SCRUM-13)
        await linkJiraIssues(result.testKey, bugKey);

        comment += `\n[AUTOMATED BUG CREATED] Created Bug ticket: ${bugKey}`;

        // D. Upload screenshot lên Bug
        if (result.screenshotPath && fs.existsSync(result.screenshotPath)) {
          await uploadAttachment(bugKey, result.screenshotPath);
          
          // Đọc screenshot dạng base64 để đính kèm vào Xray evidence
          const screenshotBase64 = fs.readFileSync(result.screenshotPath, { encoding: 'base64' });
          xrayEvidences.push({
            data: screenshotBase64,
            filename: path.basename(result.screenshotPath),
            contentType: 'image/png'
          });
        }
      }
    }

    xrayTestsPayload.push({
      testKey: result.testKey,
      status: result.status,
      comment: comment,
      evidences: xrayEvidences.length > 0 ? xrayEvidences : undefined
    });
  }

  // 4. Import toàn bộ kết quả lên Xray Test Execution SCRUM-86
  console.log(`\n============================================================`);
  await importResultsToXray(xrayTestsPayload);
  console.log(`============================================================\n`);

  // 5. Chuyển Test Execution sang "Done" sau khi hoàn tất
  log('LOG', `Đang chuyển Test Execution ${TEST_EXECUTION_KEY} sang "Done"...`);
  await transitionJiraIssue(TEST_EXECUTION_KEY, 'Done');
  log('LOG', 'Toàn bộ luồng thực thi hoàn tất!');
}

main().catch((err) => {
  log('ERROR', `Lỗi ngoài ý muốn trong hàm main: ${err.message}`);
  process.exit(1);
});
