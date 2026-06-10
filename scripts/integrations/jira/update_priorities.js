const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { loadEnv, log } = require('./utils');

// Khởi tạo env
loadEnv();

const JIRA_BASE_URL = process.env.JIRA_BASE_URL.replace(/\/+$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'SCRUM';

const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');

// Map các giá trị priority từ CSV sang Jira Priority ID
const PRIORITY_MAP = {
  'critical': '1', // Highest
  'high': '2',     // High
  'medium': '3',   // Medium
  'low': '4',      // Low
  'lowest': '5'    // Lowest
};

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

// Đọc và thu thập priority từ các file CSV
function getPriorityMapFromCsvs() {
  const csvFiles = [
    'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_list.csv',
    'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_view_edit.csv',
    'e:\\Kun\\Antigravity-Playwright-Typescript-framework\\testcases_customer_delete.csv'
  ];

  const tcPriorityMap = {};

  for (const file of csvFiles) {
    if (!fs.existsSync(file)) {
      log('WARN', `File không tồn tại: ${file}`);
      continue;
    }
    log('LOG', `Đang đọc file CSV: ${file}...`);
    const content = fs.readFileSync(file, 'utf8');
    const rows = parseCSV(content);
    
    // Bỏ qua header ở dòng đầu tiên
    const dataRows = rows.slice(1).filter(row => row.length >= 9 && row[0].trim() !== '');
    
    for (const row of dataRows) {
      const tcId = row[0].trim();
      const priorityVal = row[8].trim().toLowerCase();
      
      const jiraPriorityId = PRIORITY_MAP[priorityVal] || '3'; // Default là Medium (3)
      tcPriorityMap[tcId] = {
        csvPriority: row[8].trim(),
        jiraPriorityId: jiraPriorityId
      };
    }
  }

  return tcPriorityMap;
}

// Tìm tất cả issues của dự án có loại là Test
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
      fields: ['summary', 'priority']
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

// Cập nhật priority cho một issue trên Jira
async function updateIssuePriority(issueKey, priorityId) {
  const url = `${JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`;
  try {
    await axios.put(url, {
      fields: {
        priority: {
          id: priorityId
        }
      }
    }, {
      headers: {
        'Authorization': `Basic ${jiraAuth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (err) {
    log('ERROR', `Lỗi khi cập nhật issue ${issueKey}: ${err.message}`);
    if (err.response && err.response.data) {
      log('ERROR', `Chi tiết lỗi: ${JSON.stringify(err.response.data)}`);
    }
    return false;
  }
}

async function main() {
  const tcPriorityMap = getPriorityMapFromCsvs();
  const totalMapped = Object.keys(tcPriorityMap).length;
  log('LOG', `Đã load ${totalMapped} TC priorities từ CSV.`);

  if (totalMapped === 0) {
    log('ERROR', 'Không tìm thấy test cases nào trong các file CSV.');
    return;
  }

  const issues = await getJiraTestIssues();
  
  let updateCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const issue of issues) {
    const summary = issue.fields.summary || '';
    const issueKey = issue.key;
    const currentPriority = issue.fields.priority ? issue.fields.priority.name : 'Unknown';
    const currentPriorityId = issue.fields.priority ? issue.fields.priority.id : 'Unknown';

    // Trích xuất TC ID từ summary (ví dụ: [SCRUM_CUSTOMER_TC_001] hoặc [SCRUM_CUST_VIEW_EDIT_TC_001])
    const tcIdMatch = summary.match(/\[(SCRUM_[A-Z0-9_]+)\]/);
    if (!tcIdMatch) {
      log('WARN', `Không tìm thấy TC ID trong summary: "${summary}" (Issue: ${issueKey}). Bỏ qua.`);
      skipCount++;
      continue;
    }

    const tcId = tcIdMatch[1];
    const targetInfo = tcPriorityMap[tcId];

    if (!targetInfo) {
      log('WARN', `Không tìm thấy thông tin priority cho TC ID: ${tcId} (Issue: ${issueKey}). Bỏ qua.`);
      skipCount++;
      continue;
    }

    const targetPriorityId = targetInfo.jiraPriorityId;

    if (currentPriorityId === targetPriorityId) {
      log('LOG', `Issue ${issueKey} (${tcId}) đã có đúng priority: ${currentPriority} (ID: ${currentPriorityId}). Bỏ qua.`);
      skipCount++;
      continue;
    }

    log('LOG', `Đang cập nhật issue ${issueKey} (${tcId}): ${currentPriority} (ID: ${currentPriorityId}) -> ${targetInfo.csvPriority} (ID: ${targetPriorityId})...`);
    
    const success = await updateIssuePriority(issueKey, targetPriorityId);
    if (success) {
      updateCount++;
      log('LOG', `Đã cập nhật thành công issue ${issueKey}.`);
    } else {
      failCount++;
    }

    // Delay nhỏ tránh rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  log('LOG', `=== KẾT QUẢ CẬP NHẬT PRIORITY ===`);
  log('LOG', `- Tổng số issues kiểm tra: ${issues.length}`);
  log('LOG', `- Số issues cập nhật thành công: ${updateCount}`);
  log('LOG', `- Số issues bị lỗi: ${failCount}`);
  log('LOG', `- Số issues giữ nguyên/bỏ qua: ${skipCount}`);
}

main().catch(err => {
  log('ERROR', `Lỗi ngoài ý muốn: ${err.message}`);
});
