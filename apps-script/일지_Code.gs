/**
 * 📝 AI 활용 일지 — 앱스스크립트 Code.gs
 * =========================================================================
 * 이 파일은 "일지용 구글 스프레드시트"에만 넣습니다.
 * 계약서용 스프레드시트에는 넣지 마세요. (두 파일은 서로 상관없습니다)
 *
 * ⚠️ 먼저 확인하세요
 *   지금 일지가 잘 저장되고 있다면 이 파일을 붙여넣을 필요가 없습니다.
 *   쓰던 것을 그대로 두세요. 붙여넣으면 열 구성이 아래와 같이 바뀌므로,
 *   이미 쌓인 기록과 열이 어긋날 수 있습니다.
 *
 *   이 파일은 이럴 때 씁니다.
 *     - 일지용 스프레드시트를 새로 만들 때
 *     - 기존 스크립트가 망가져 처음부터 다시 만들 때
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

    let sh = ss.getSheetByName("일지");
    if (!sh) {
      sh = ss.insertSheet("일지");
      sh.appendRow(["제출시각","회차","날짜","번호","이름",
                    "사용목적","내가 입력한 프롬프트","AI가 준 결과","내가 고친 부분과 그 이유"]);
      sh.setFrozenRows(1);
      ss.setActiveSheet(before);
    }

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
