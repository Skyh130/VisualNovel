/**
 * 📋 기획 범위 계약서 — 앱스스크립트 Code.gs
 * =========================================================================
 * 이 파일은 "계약서용 구글 스프레드시트"에만 넣습니다.
 * 일지용 스프레드시트에는 넣지 마세요. (두 파일은 서로 상관없습니다)
 *
 * [넣는 방법]
 *   1. 계약서를 받을 구글 스프레드시트를 엽니다.
 *   2. [확장 프로그램] > [Apps Script]
 *      ※ 반드시 스프레드시트에서 여세요. Apps Script 사이트에서 따로 만든
 *        프로젝트는 스프레드시트에 붙어 있지 않아 저장에 실패합니다.
 *   3. 안에 있던 내용을 모두 지우고 이 파일 전체를 붙여넣습니다.
 *   4. [배포] > [새 배포] > 유형 '웹 앱'
 *        - 실행 사용자      : 나
 *        - 액세스 권한      : 모든 사용자      ← 반드시!
 *   5. 나온 URL을 복사해서 assets/config.js 의
 *        const GAS_URL_CONTRACT = "여기"
 *      에 붙여넣습니다.
 *
 * ⚠️ 액세스 권한을 학교 도메인으로 제한하면 CORS로 막혀 학생 전원이 실패합니다.
 * =========================================================================
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return saveContract(data);
  } catch (err) {
    return jsonOut({ status: "error", message: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveContract(d) {
  // 20~30명이 거의 동시에 제출하면 '읽기 → 삭제 → 추가'가 뒤엉켜
  // 다른 학생의 행이 지워질 수 있습니다. 한 번에 한 명씩 처리되도록 잠급니다.
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {
    return jsonOut({ status: "error",
                     message: "다른 학생의 제출을 처리하는 중입니다. 잠시 후 다시 눌러주세요." });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const before = ss.getActiveSheet();   // 새 시트를 만들면 활성 시트가 바뀌므로 기억

    let sh = ss.getSheetByName("계약서");
    if (!sh) {
      sh = ss.insertSheet("계약서");
      sh.appendRow(["제출시각","번호","이름","작품제목","장르","로그라인",
                    "선택하는것","바뀌는것","나의질문",
                    "씬","엔딩","배경","캐릭터","분",
                    "캐릭터목록","엔딩목록","동의"]);
      sh.setFrozenRows(1);
      ss.setActiveSheet(before);
    }

    // 같은 번호가 이미 냈으면 그 행을 지우고 새로 넣습니다 (재제출 허용)
    const vals = sh.getDataRange().getValues();
    for (let i = vals.length - 1; i >= 1; i--) {
      if (String(vals[i][1]) === String(d.studentNumber)) sh.deleteRow(i + 1);
    }

    sh.appendRow([
      new Date(), d.studentNumber, d.studentName, d.title, d.genre, d.logline,
      d.qChoose, d.qChange, d.myQuestion,
      d.scope.scenes, d.scope.endings, d.scope.backgrounds,
      d.scope.characters, d.scope.minutes,
      d.characters.map(c => `${c.name}|${c.role}|${c.personality}`).join("\n"),
      d.endings.map(x => `${x.label}|${x.name}|${x.condition}`).join("\n"),
      d.agreed ? "O" : "X"
    ]);

    SpreadsheetApp.flush();
    return jsonOut({ status: "success" });

  } finally {
    lock.releaseLock();
  }
}
