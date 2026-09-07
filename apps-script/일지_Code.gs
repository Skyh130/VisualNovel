/**
 * 📝 AI 활용 일지 — 앱스스크립트 Code.gs
 * =========================================================================
 * 이 파일은 "일지용 구글 스프레드시트"에만 넣습니다.
 * 계약서용 스프레드시트에는 넣지 마세요. (두 파일은 서로 상관없습니다)
 *
 * 이 파일은 이럴 때 씁니다.
 *   - 제출하면 "ReferenceError: saveJournal is not defined" 가 뜰 때
 *   - 일지용 스프레드시트를 새로 만들 때
 *   - 기존 스크립트가 망가져 처음부터 다시 만들 때
 *
 * ✅ 기존 기록은 안전합니다
 *   이미 "일지" 시트가 있고 열 이름이 아래와 다르면, 기존 시트는 그대로 두고
 *   "일지(새 양식)" 시트를 따로 만들어 거기에 저장합니다.
 *   열이 어긋난 채로 덮어쓰는 일은 없습니다.
 *
 * [넣는 방법]
 *   1. 일지를 받을 구글 스프레드시트를 엽니다.
 *   2. [확장 프로그램] > [Apps Script]
 *      ※ 반드시 스프레드시트에서 여세요.
 *   3. 안에 있던 내용을 모두 지우고 이 파일 전체를 붙여넣습니다.
 *   4. [배포] > [새 배포] > 유형 '웹 앱'
 *        - 실행 사용자      : 나
 *        - 액세스 권한      : 모든 사용자      ← 반드시!
 *   5. 나온 URL을 복사해서 assets/config.js 의
 *        const GAS_URL_JOURNAL = "여기"
 *      에 붙여넣습니다.
 *   6. 이 파일 아래쪽 CLASS_CODE 에 반 암호를 적습니다. (필수)
 *
 * [저장되는 모양]
 *   기록 한 줄이 시트 한 행이 됩니다. 한 번 제출에 여러 행이 들어갑니다.
 *   제출시각 | 회차 | 날짜 | 번호 | 이름 |
 *   사용목적 | 내가 입력한 프롬프트 | AI가 준 결과 | 내가 고친 부분과 그 이유
 *
 *   계약서와 달리 일지는 매 회차 기록이 쌓여야 하므로 지우지 않고 계속 추가합니다.
 * =========================================================================
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const bad = checkClassCode_(data);      // 반 암호 확인
    if (bad) return bad;
    return saveJournal(data);
  } catch (err) {
    return jsonOut({ status: "error", message: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveJournal(d) {
  // 여러 학생이 동시에 제출해도 행이 겹치지 않도록 한 번에 한 명씩 처리합니다.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return jsonOut({ status: "error",
                     message: "다른 학생의 제출을 처리하는 중입니다. 잠시 후 다시 눌러주세요." });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const before = ss.getActiveSheet();

    const sh = getJournalSheet_(ss);
    ss.setActiveSheet(before);   // 시트를 새로 만들었을 수 있으므로 되돌립니다

    const records = d.records || [];
    if (records.length === 0) {
      return jsonOut({ status: "error", message: "기록이 비어 있습니다." });
    }

    const now = new Date();
    const rows = records.map(function (r) {
      return [now, d.round, d.date, d.studentNumber, d.studentName,
              r.purpose, r.prompt, r.result, r.modification];
    });
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);

    SpreadsheetApp.flush();
    return jsonOut({ status: "success" });

  } finally {
    lock.releaseLock();
  }
}

/** 이 스크립트가 쓸 시트를 찾아 돌려줍니다.
 *  이미 있는 "일지" 시트의 열 이름이 다르면, 그 시트는 건드리지 않고
 *  "일지(새 양식)" 시트를 따로 만들어 씁니다. (기존 기록 보호) */
function getJournalSheet_(ss) {
  const HEADER = ["제출시각","회차","날짜","번호","이름",
                  "사용목적","내가 입력한 프롬프트","AI가 준 결과","내가 고친 부분과 그 이유"];

  function makeSheet(name) {
    const sh = ss.insertSheet(name);
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
    return sh;
  }
  function headerMatches(sh) {
    if (sh.getLastRow() === 0) { sh.appendRow(HEADER); sh.setFrozenRows(1); return true; }
    const head = sh.getRange(1, 1, 1, HEADER.length).getValues()[0].map(function (v) { return String(v).trim(); });
    return head.join("|") === HEADER.join("|");
  }

  const main = ss.getSheetByName("일지");
  if (!main) return makeSheet("일지");
  if (headerMatches(main)) return main;

  // 열 구성이 다릅니다. 기존 "일지" 시트는 그대로 두고 별도 시트를 씁니다.
  const alt = ss.getSheetByName("일지(새 양식)");
  if (alt) return headerMatches(alt) ? alt : alt;
  return makeSheet("일지(새 양식)");
}

/* =========================================================================
 * 🔑 반 암호 — 여기에만 적습니다
 * -------------------------------------------------------------------------
 * 아래 따옴표 안의 여기에_반_암호 를 실제 암호로 바꿔주세요.
 * 학생에게는 수업 시간에 말로 알려주면 됩니다.
 *
 * ⚠️ 이 줄은 앱스스크립트 안에만 있고, 웹페이지에는 들어가지 않습니다.
 *    (웹페이지에 넣으면 '페이지 소스 보기'로 누구나 볼 수 있습니다)
 *    깃허브 저장소에도 실제 암호를 올리지 마세요.
 *
 * 암호를 바꾸고 싶으면 이 줄만 고치고 [배포] > [배포 관리] > 새 버전으로
 * 다시 배포하면 됩니다. 웹페이지는 고치지 않아도 됩니다.
 * ========================================================================= */
const CLASS_CODE = "여기에_반_암호";

/* 반 암호가 맞는지 확인합니다. 맞으면 빈 값, 틀리면 오류 응답을 돌려줍니다. */
function checkClassCode_(d) {
  if (CLASS_CODE === "여기에_반_암호") {
    return jsonOut({ status: "error",
                     message: "반 암호가 아직 설정되지 않았습니다. 선생님께 알려주세요." });
  }
  const given = String((d && d.classCode) || "").trim();
  if (given === "") {
    return jsonOut({ status: "error", message: "반 암호를 입력해 주세요." });
  }
  if (given !== CLASS_CODE) {
    return jsonOut({ status: "error", message: "반 암호가 맞지 않습니다. 다시 확인해 주세요." });
  }
  return null;   // 통과
}
