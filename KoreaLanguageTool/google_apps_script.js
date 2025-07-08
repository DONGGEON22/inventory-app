const SPREADSHEET_ID   = '1MpcjcNpuSpboYnLyqYNaUtsurB3jB1nN-ESj3EJ2U1Q';
const SHEET_NAME       = '시트1';
const SHEET_NAME_2     = '시트2';
const PARENT_FOLDER_ID = '1HxzHvN_sKZbaCCeoB3_ehPYlDP_nCQW4';

// 김재우 폴더 ID들
const KIM_JAE_WOO_FOLDERS = {
  '결성': '19DO-hpdKlVYhpItUMyiEeTjXeiy5G3gL',
  '고유번호증': '1NBNxJ27lOOlS6qQARa9yYuTBlTuO7nJr',
  '계좌개설': '15sMQxcenC18rx0cX_rCb_0zZE3B54ngo',
  '등록': '1fey9N6QJzKVtBGzkGSTSN84Xr4KaCdEx'
};

// 금종석 폴더 ID들
const KIM_JONG_SEOK_FOLDERS = {
  '결성': '1Q8TFiwuWpJqyoXmSHoWKCsTE8mfuelKQ',
  '고유번호증': '1WyQ4ri8p4rajxxXIRByowXPCLhDio3BC',
  '계좌개설': '1I4XRghqGE-xcfSb1iWetnDqWefaE3wf6',
  '등록': '18BrMZc81Nkd8BV2f5mGhm3ND541Wzzrl'
};

/**
 * 치환 맵 생성 (시트1용)
 */
function getReplacements(sheet) {
  return {
    '{{기업명}}': sheet.getRange('B1').getDisplayValue(),
    '{{사업장주소}}': sheet.getRange('B2').getDisplayValue(),
    '{{전사납입일}}': sheet.getRange('B3').getDisplayValue(),
    '{{법인번호}}': sheet.getRange('B4').getDisplayValue(),
    '{{만기일}}': sheet.getRange('B5').getDisplayValue(),
    '{{주총소집}}': sheet.getRange('B6').getDisplayValue(),
    '{{소집통지일자}}': sheet.getRange('B7').getDisplayValue(),
    '{{대표님성함}}': sheet.getRange('B8').getDisplayValue(),
    '{{대표님주민번호앞자리}}': sheet.getRange('B9').getDisplayValue(),
    '{{대표님전화번호}}': sheet.getRange('B10').getDisplayValue(),
    '{{대표님개인자택주소}}': sheet.getRange('B11').getDisplayValue(),
    '{{조합호수}}': sheet.getRange('B12').getDisplayValue(),
    '{{기업자본금}}': sheet.getRange('B13').getDisplayValue(),
    '{{기업자본금보다많이}}': sheet.getRange('B14').getDisplayValue(),
    '{{GP주소}}': sheet.getRange('B15').getDisplayValue(),
    '{{GP성함}}': sheet.getRange('B16').getDisplayValue(),
    '{{GP연락처}}': sheet.getRange('B17').getDisplayValue(),
    '{{대표/사내}}': sheet.getRange('B18').getDisplayValue(),
    '{{주식액면가}}': sheet.getRange('B19').getDisplayValue(),
    '{{100원의 보통주식}}': sheet.getRange('B20').getDisplayValue(),
    '{{주주총수}}': sheet.getRange('B21').getDisplayValue(),
    '{{출석주주}}': sheet.getRange('B22').getDisplayValue(),
    '{{주식총수}}': sheet.getRange('B23').getDisplayValue(),
    '{{출석주식수}}': sheet.getRange('B24').getDisplayValue(),
    '{{공증하는사람이름}}': sheet.getRange('B25').getDisplayValue(),
    '{{공증하는사람주소}}': sheet.getRange('B26').getDisplayValue(),
    '{{공증하는사람생년월일}}': sheet.getRange('B27').getDisplayValue(),
    '{{공증하는사람연락처}}': sheet.getRange('B28').getDisplayValue(),
    '{{이행일}}': sheet.getRange('B29').getDisplayValue(),
    '{{오늘날짜}}': sheet.getRange('B30').getDisplayValue(),
  };
}

/**
 * 치환 맵 생성 (시트2용)
 */
function getReplacementsFromSheet2(sheet) {
  const replacements = {};
  const lastRow = sheet.getLastRow();
  
  // A열은 플레이스홀더, B열은 치환값
  for (let i = 1; i <= lastRow; i++) {
    const placeholder = sheet.getRange(`A${i}`).getDisplayValue();
    const value = sheet.getRange(`B${i}`).getDisplayValue();
    
    if (placeholder) {
      replacements[`{{${placeholder}}}`] = value;
    }
  }
  
  return replacements;
}

/**
 * 폴더 가져오기 또는 생성
 */
function getOrCreateCompanyFolder(companyName) {
  const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
  const folders = parentFolder.getFoldersByName(companyName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(companyName);
}

/**
 * 조합서류 준비 (김재우/금종석 조건에 따른 처리) - 시트1과 완전 분리
 */
function prepareCombinationDocuments() {
  const sheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME_2);
  
  // 시트2에서만 데이터 읽기
  const combinationNumber = sheet2.getRange('B1').getDisplayValue(); // 조합호수
  const gpName = sheet2.getRange('B12').getDisplayValue(); // GP이름 (B12로 수정)
  
  const replacements = getReplacementsFromSheet2(sheet2);
  const combinationFolder = getOrCreateCombinationFolder(combinationNumber);
  const ui = SpreadsheetApp.getUi();

  // 디버깅 정보 표시
  const debugInfo = `디버깅 정보:
  - 조합호수: ${combinationNumber}
  - GP이름: "${gpName}"
  - 치환 데이터 개수: ${Object.keys(replacements).length}`;
  
  console.log(debugInfo);
  
  // 조건 확인 (공백 제거)
  const cleanGpName = gpName.trim();
  
  // 김재우 조건 처리 (정확히 일치하거나 포함하는 경우)
  if (cleanGpName === '김재우' || cleanGpName.includes('김재우')) {
    ui.alert(`김재우 조건으로 조합서류를 준비합니다.\n\n${debugInfo}`);
    
    for (const [folderName, folderId] of Object.entries(KIM_JAE_WOO_FOLDERS)) {
      const subFolder = combinationFolder.createFolder(folderName);
      copyAndReplaceFolderContentsWithCustomNames(folderId, subFolder, replacements, combinationNumber);
    }
    
    ui.alert(`✅ 김재우 조건의 조합서류가 성공적으로 생성되었습니다.`);
  }
  // 금종석 조건 처리 (정확히 일치하거나 포함하는 경우)
  else if (cleanGpName === '금종석' || cleanGpName.includes('금종석')) {
    ui.alert(`금종석 조건으로 조합서류를 준비합니다.\n\n${debugInfo}`);
    
    for (const [folderName, folderId] of Object.entries(KIM_JONG_SEOK_FOLDERS)) {
      const subFolder = combinationFolder.createFolder(folderName);
      copyAndReplaceFolderContentsWithCustomNames(folderId, subFolder, replacements, combinationNumber);
    }
    
    ui.alert(`✅ 금종석 조건의 조합서류가 성공적으로 생성되었습니다.`);
  }
  else {
    ui.alert(`⚠️ 김재우 또는 금종석 조건이 아닙니다.\n\n${debugInfo}\n\n조건을 확인해주세요.`);
  }
}

/**
 * 조합호수 기반 폴더 생성 (깔끔한 이름)
 */
function getOrCreateCombinationFolder(combinationNumber) {
  const parentFolder = DriveApp.getFolderById(PARENT_FOLDER_ID);
  
  // "조합13호" -> "13호"로 변환
  let cleanNumber = combinationNumber;
  if (combinationNumber.startsWith('조합')) {
    cleanNumber = combinationNumber.substring(2); // "조합" 제거
  }
  
  const folderName = cleanNumber; // "13호" 형태로 생성
  const folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext() ? folders.next() : parentFolder.createFolder(folderName);
}

/**
 * 폴더 내 모든 파일 복사 및 치환 (서류명에 조합호수 적용)
 */
function copyAndReplaceFolderContentsWithCustomNames(sourceFolderId, targetFolder, replacements, combinationNumber) {
  const sourceFolder = DriveApp.getFolderById(sourceFolderId);
  const files = sourceFolder.getFiles();
  
  // combinationNumber에서 '조합' 접두사 제거
  let cleanNumber = combinationNumber;
  if (combinationNumber.startsWith('조합')) {
    cleanNumber = combinationNumber.substring(2); // '조합' 제거
  }
  
  while (files.hasNext()) {
    const file = files.next();
    let newFileName = file.getName();
    
    // 파일명에 있는 모든 {{조합호수}}를 cleanNumber로 치환
    newFileName = newFileName.replaceAll('{{조합호수}}', cleanNumber);
    
    const newFile = file.makeCopy(newFileName, targetFolder);
    
    // 문서 파일인 경우 치환 처리
    if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
      const doc = DocumentApp.openById(newFile.getId());
      const body = doc.getBody();

      for (const key in replacements) {
        let found = body.findText(key);
        while (found) {
          const textElem = found.getElement().asText();
          const start = found.getStartOffset();
          const end = found.getEndOffsetInclusive();
          textElem.deleteText(start, end);
          const value = replacements[key] || '';
          
          // 공란인 경우 플레이스홀더만 삭제
          if (value.trim() !== '') {
            textElem.insertText(start, value);
            textElem.setForegroundColor(start, start + value.length - 1, '#000000');
          }
          
          found = body.findText(key);
        }
      }

      doc.saveAndClose();
    }
  }
}

/**
 * 템플릿 복사 및 치환 (공란 처리 포함)
 */
function makeReplacedCopy(templateId, fileName, targetFolder, replacements) {
  const templateFile = DriveApp.getFileById(templateId);
  const newFile = templateFile.makeCopy(fileName, targetFolder);
  const doc = DocumentApp.openById(newFile.getId());
  const body = doc.getBody();

  for (const key in replacements) {
    let found = body.findText(key);
    while (found) {
      const textElem = found.getElement().asText();
      const start = found.getStartOffset();
      const end = found.getEndOffsetInclusive();
      textElem.deleteText(start, end);
      const value = replacements[key] || '';
      
      // 공란인 경우 플레이스홀더만 삭제하고 아무것도 삽입하지 않음
      if (value.trim() !== '') {
        textElem.insertText(start, value);
        textElem.setForegroundColor(start, start + value.length - 1, '#000000');
      }
      
      found = body.findText(key);
    }
  }

  doc.saveAndClose();
}

/**
 * 전체 문서 자동 생성 (1~4)
 */
function generateAllDocuments() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const companyName = sheet.getRange('B1').getDisplayValue();
  const companyFolder = getOrCreateCompanyFolder(companyName);
  const replacements = getReplacements(sheet);
  const ui = SpreadsheetApp.getUi();

  // 1️⃣ 폴더 생성
  ui.alert(`${companyName} 폴더가 준비되었습니다.`);

  // 2️⃣ 전환사채 서류
  makeReplacedCopy(
    '1oTzJi9xl0kxaRdL2lxSvlQWj1p5dZPQw2_5LJ2joi78',
    `${companyName}_전환사채서류`,
    companyFolder,
    replacements
  );

  // 3️⃣ 이행각서
  makeReplacedCopy(
    '15qcfNWp_j-FNZPhLLmyv_qbQXHrmr-oECPforZWnYVU',
    `${companyName}_이행각서`,
    companyFolder,
    replacements
  );

  // 4️⃣ 각종 일자 및 기본정보
  makeReplacedCopy(
    '1LDJY_75qRjvYZQEX-s5l-R-EbVNcUZHyiWVWWKsNYb0',
    `${companyName}_각종일자및기본정보`,
    companyFolder,
    replacements
  );

  ui.alert(`✅ ${companyName}의 전 서류가 성공적으로 생성되었습니다.`);
}

/**
 * 메뉴 구성
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  // 문서 생성 메뉴
  ui.createMenu('문서 생성')
    .addItem('📄 전체 문서 자동 생성', 'generateAllDocuments')
    .addToUi();
    
  // 조합서류준비 메뉴 (고도화된 서브메뉴)
  ui.createMenu('조합서류준비')
    .addItem('📋 전체 조합서류 준비', 'prepareCombinationDocuments')
    .addSeparator()
    .addItem('📁 1. 폴더 만들기', 'createCombinationFolders')
    .addItem('📄 2. 결성서류 준비', 'prepareFormationDocuments')
    .addItem('📄 3. 등록서류 준비', 'prepareRegistrationDocuments')
    .addToUi();
}

/**
 * 수동으로 메뉴 생성 (문제 해결용)
 */
function createMenus() {
  const ui = SpreadsheetApp.getUi();
  
  // 기존 메뉴 제거 (선택사항)
  try {
    ui.createMenu('문서 생성')
      .addItem('📄 전체 문서 자동 생성', 'generateAllDocuments')
      .addToUi();
  } catch (e) {
    console.log('문서 생성 메뉴 생성 중 오류:', e);
  }
  
  try {
    ui.createMenu('조합서류준비')
      .addItem('📋 조합서류 준비', 'prepareCombinationDocuments')
      .addToUi();
  } catch (e) {
    console.log('조합서류준비 메뉴 생성 중 오류:', e);
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast('메뉴가 생성되었습니다!', '완료');
}

/**
 * 테스트 함수 - 메뉴가 작동하는지 확인
 */
function testMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.alert('메뉴가 정상적으로 작동합니다!');
}

/**
 * 1. 폴더 만들기 - 조합 관련 폴더 생성
 */
function createCombinationFolders() {
  const sheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME_2);
  const combinationNumber = sheet2.getRange('B1').getDisplayValue(); // 조합호수
  const gpName = sheet2.getRange('B12').getDisplayValue(); // GP이름 (B12)
  const ui = SpreadsheetApp.getUi();
  
  const combinationFolder = getOrCreateCombinationFolder(combinationNumber);
  const cleanGpName = gpName.trim();
  
  // 조건에 따라 고유번호증, 계좌개설 폴더만 생성
  const allowedFolders = ['고유번호증', '계좌개설'];
  if (cleanGpName === '김재우' || cleanGpName.includes('김재우')) {
    for (const [folderName, folderId] of Object.entries(KIM_JAE_WOO_FOLDERS)) {
      if (allowedFolders.includes(folderName)) {
        combinationFolder.createFolder(folderName);
      }
    }
    ui.alert(`✅ 김재우 조건의 조합 폴더가 생성되었습니다.\n\n조합호수: ${combinationNumber}\n생성된 폴더: 고유번호증, 계좌개설`);
  }
  else if (cleanGpName === '금종석' || cleanGpName.includes('금종석')) {
    for (const [folderName, folderId] of Object.entries(KIM_JONG_SEOK_FOLDERS)) {
      if (allowedFolders.includes(folderName)) {
        combinationFolder.createFolder(folderName);
      }
    }
    ui.alert(`✅ 금종석 조건의 조합 폴더가 생성되었습니다.\n\n조합호수: ${combinationNumber}\n생성된 폴더: 고유번호증, 계좌개설`);
  }
  else {
    ui.alert(`⚠️ 김재우 또는 금종석 조건이 아닙니다.\n\nGP이름: "${gpName}"\n조합호수: ${combinationNumber}`);
  }
}

/**
 * 결성서류 템플릿 분석 - 실제 플레이스홀더 확인
 */
function analyzeFormationDocumentPlaceholders() {
  const ui = SpreadsheetApp.getUi();
  
  // 김재우와 금종석의 결성서류 템플릿 분석
  const kimJaeWooFormationId = KIM_JAE_WOO_FOLDERS['결성'];
  const kimJongSeokFormationId = KIM_JONG_SEOK_FOLDERS['결성'];
  
  let allPlaceholders = new Set();
  
  // 김재우 결성서류 분석
  try {
    const kimJaeWooFolder = DriveApp.getFolderById(kimJaeWooFormationId);
    const files = kimJaeWooFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
        const doc = DocumentApp.openById(file.getId());
        const body = doc.getBody();
        const text = body.getText();
        
        // {{}} 형태의 플레이스홀더 찾기
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        let match;
        while ((match = placeholderRegex.exec(text)) !== null) {
          allPlaceholders.add(match[1]);
        }
        doc.saveAndClose();
      }
    }
  } catch (e) {
    console.log('김재우 결성서류 분석 중 오류:', e);
  }
  
  // 금종석 결성서류 분석
  try {
    const kimJongSeokFolder = DriveApp.getFolderById(kimJongSeokFormationId);
    const files = kimJongSeokFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
        const doc = DocumentApp.openById(file.getId());
        const body = doc.getBody();
        const text = body.getText();
        
        // {{}} 형태의 플레이스홀더 찾기
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        let match;
        while ((match = placeholderRegex.exec(text)) !== null) {
          allPlaceholders.add(match[1]);
        }
        doc.saveAndClose();
      }
    }
  } catch (e) {
    console.log('금종석 결성서류 분석 중 오류:', e);
  }
  
  // 결과 표시
  const placeholdersList = Array.from(allPlaceholders).sort();
  const analysisResult = `📋 결성서류에 필요한 치환 데이터 분석 결과:

🔍 발견된 플레이스홀더들:
${placeholdersList.map(p => `- {{${p}}}`).join('\n')}

📊 총 ${placeholdersList.length}개의 플레이스홀더가 발견되었습니다.

💡 시트2에서 이 플레이스홀더들을 치환하려면:
- A열에 플레이스홀더명 입력 (예: "GP이름")
- B열에 치환값 입력 (예: "금종석")

현재 시트2의 치환 데이터와 비교해보시겠습니까?`;

  const response = ui.alert('결성서류 플레이스홀더 분석', analysisResult, ui.ButtonSet.YES_NO);
  
  if (response === ui.Button.YES) {
    compareWithSheet2Data(placeholdersList);
  }
}

/**
 * 시트2 데이터와 플레이스홀더 비교
 */
function compareWithSheet2Data(placeholders) {
  const sheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME_2);
  const ui = SpreadsheetApp.getUi();
  
  const replacements = getReplacementsFromSheet2(sheet2);
  const availablePlaceholders = Object.keys(replacements).map(k => k.replace(/[{}]/g, ''));
  
  const missingPlaceholders = placeholders.filter(p => !availablePlaceholders.includes(p));
  const availablePlaceholdersInTemplate = placeholders.filter(p => availablePlaceholders.includes(p));
  
  const comparisonResult = `📊 시트2 데이터와 결성서류 플레이스홀더 비교:

✅ 시트2에 있는 플레이스홀더 (${availablePlaceholdersInTemplate.length}개):
${availablePlaceholdersInTemplate.map(p => `- {{${p}}} → ${replacements[`{{${p}}}`] || '(빈 값)'}`).join('\n')}

❌ 시트2에 없는 플레이스홀더 (${missingPlaceholders.length}개):
${missingPlaceholders.map(p => `- {{${p}}}`).join('\n')}

💡 결성서류 준비를 위해서는:
1. 시트2의 A열에 누락된 플레이스홀더명을 추가
2. B열에 해당하는 치환값을 입력
3. 다시 결성서류 준비를 실행하세요.`;

  ui.alert('데이터 비교 결과', comparisonResult, ui.ButtonSet.OK);
}

/**
 * 2. 결성서류 준비 - 결성서류만 처리 (개선된 버전)
 */
function prepareFormationDocuments() {
  const sheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME_2);
  const combinationNumber = sheet2.getRange('B1').getDisplayValue(); // 조합호수
  const gpName = sheet2.getRange('B12').getDisplayValue(); // GP이름 (B12로 수정)
  const ui = SpreadsheetApp.getUi();
  
  // 먼저 결성서류 템플릿 분석
  analyzeFormationDocumentPlaceholders();
  
  // 사용자가 계속 진행할지 확인
  const response = ui.alert('결성서류 준비', 
    '결성서류 템플릿 분석이 완료되었습니다.\n\n실제 치환 작업을 진행하시겠습니까?', 
    ui.ButtonSet.YES_NO);
  
  if (response === ui.Button.YES) {
    const replacements = getReplacementsFromSheet2(sheet2);
    const combinationFolder = getOrCreateCombinationFolder(combinationNumber);
    const cleanGpName = gpName.trim();
    
    if (cleanGpName === '김재우' || cleanGpName.includes('김재우')) {
      const formationFolder = combinationFolder.createFolder('결성');
      copyAndReplaceFolderContentsWithCustomNames(KIM_JAE_WOO_FOLDERS['결성'], formationFolder, replacements, combinationNumber);
      ui.alert(`✅ 김재우 조건의 결성서류가 성공적으로 생성되었습니다.`);
    }
    else if (cleanGpName === '금종석' || cleanGpName.includes('금종석')) {
      const formationFolder = combinationFolder.createFolder('결성');
      copyAndReplaceFolderContentsWithCustomNames(KIM_JONG_SEOK_FOLDERS['결성'], formationFolder, replacements, combinationNumber);
      ui.alert(`✅ 금종석 조건의 결성서류가 성공적으로 생성되었습니다.`);
    }
    else {
      ui.alert(`⚠️ 김재우 또는 금종석 조건이 아닙니다.\n\nGP이름: "${gpName}"`);
    }
  }
}

/**
 * 등록서류 템플릿 분석 - 실제 플레이스홀더 확인
 */
function analyzeRegistrationDocumentPlaceholders() {
  const ui = SpreadsheetApp.getUi();
  
  // 김재우와 금종석의 등록서류 템플릿 분석
  const kimJaeWooRegistrationId = KIM_JAE_WOO_FOLDERS['등록'];
  const kimJongSeokRegistrationId = KIM_JONG_SEOK_FOLDERS['등록'];
  
  let allPlaceholders = new Set();
  
  // 김재우 등록서류 분석
  try {
    const kimJaeWooFolder = DriveApp.getFolderById(kimJaeWooRegistrationId);
    const files = kimJaeWooFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
        const doc = DocumentApp.openById(file.getId());
        const body = doc.getBody();
        const text = body.getText();
        
        // {{}} 형태의 플레이스홀더 찾기
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        let match;
        while ((match = placeholderRegex.exec(text)) !== null) {
          allPlaceholders.add(match[1]);
        }
        doc.saveAndClose();
      }
    }
  } catch (e) {
    console.log('김재우 등록서류 분석 중 오류:', e);
  }
  
  // 금종석 등록서류 분석
  try {
    const kimJongSeokFolder = DriveApp.getFolderById(kimJongSeokRegistrationId);
    const files = kimJongSeokFolder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getMimeType() === MimeType.GOOGLE_DOCS) {
        const doc = DocumentApp.openById(file.getId());
        const body = doc.getBody();
        const text = body.getText();
        
        // {{}} 형태의 플레이스홀더 찾기
        const placeholderRegex = /\{\{([^}]+)\}\}/g;
        let match;
        while ((match = placeholderRegex.exec(text)) !== null) {
          allPlaceholders.add(match[1]);
        }
        doc.saveAndClose();
      }
    }
  } catch (e) {
    console.log('금종석 등록서류 분석 중 오류:', e);
  }
  
  // 결과 표시
  const placeholdersList = Array.from(allPlaceholders).sort();
  const analysisResult = `📋 등록서류에 필요한 치환 데이터 분석 결과:

🔍 발견된 플레이스홀더들:
${placeholdersList.map(p => `- {{${p}}}`).join('\n')}

📊 총 ${placeholdersList.length}개의 플레이스홀더가 발견되었습니다.

💡 시트2에서 이 플레이스홀더들을 치환하려면:
- A열에 플레이스홀더명 입력 (예: "GP이름")
- B열에 치환값 입력 (예: "금종석")

현재 시트2의 치환 데이터와 비교해보시겠습니까?`;

  const response = ui.alert('등록서류 플레이스홀더 분석', analysisResult, ui.ButtonSet.YES_NO);
  
  if (response === ui.Button.YES) {
    compareWithSheet2Data(placeholdersList);
  }
}

/**
 * 3. 등록서류 준비 - 등록서류만 처리 (개선된 버전)
 */
function prepareRegistrationDocuments() {
  const sheet2 = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME_2);
  const combinationNumber = sheet2.getRange('B1').getDisplayValue(); // 조합호수
  const gpName = sheet2.getRange('B12').getDisplayValue(); // GP이름 (B12로 수정)
  const ui = SpreadsheetApp.getUi();
  
  // 먼저 등록서류 템플릿 분석
  analyzeRegistrationDocumentPlaceholders();
  
  // 사용자가 계속 진행할지 확인
  const response = ui.alert('등록서류 준비', 
    '등록서류 템플릿 분석이 완료되었습니다.\n\n실제 치환 작업을 진행하시겠습니까?', 
    ui.ButtonSet.YES_NO);
  
  if (response === ui.Button.YES) {
    const replacements = getReplacementsFromSheet2(sheet2);
    const combinationFolder = getOrCreateCombinationFolder(combinationNumber);
    const cleanGpName = gpName.trim();
    
    if (cleanGpName === '김재우' || cleanGpName.includes('김재우')) {
      const registrationFolder = combinationFolder.createFolder('등록');
      copyAndReplaceFolderContentsWithCustomNames(KIM_JAE_WOO_FOLDERS['등록'], registrationFolder, replacements, combinationNumber);
      ui.alert(`✅ 김재우 조건의 등록서류가 성공적으로 생성되었습니다.`);
    }
    else if (cleanGpName === '금종석' || cleanGpName.includes('금종석')) {
      const registrationFolder = combinationFolder.createFolder('등록');
      copyAndReplaceFolderContentsWithCustomNames(KIM_JONG_SEOK_FOLDERS['등록'], registrationFolder, replacements, combinationNumber);
      ui.alert(`✅ 금종석 조건의 등록서류가 성공적으로 생성되었습니다.`);
    }
    else {
      ui.alert(`⚠️ 김재우 또는 금종석 조건이 아닙니다.\n\nGP이름: "${gpName}"`);
    }
  }
} 