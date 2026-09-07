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
 *   ★ 붙여넣은 뒤 맨 위의 CLASS_CODE 를 실제 반 암호로 바꿔야 합니다. (필수)
 *      바꾸지 않으면 "반 암호가 아직 설정되지 않았습니다"가 뜹니다.
 *
 * ⚠️ 액세스 권한을 학교 도메인으로 제한하면 CORS로 막혀 학생 전원이 실패합니다.
 * =========================================================================
 */

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

/* 배포가 반영됐는지 확인하는 표시입니다. 고치지 않아도 됩니다. */
const DEPLOY_TAG = "contract-2026-09-07";

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

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const bad = checkClassCode_(data);      // 반 암호 확인
    if (bad) return bad;
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

/* 브라우저에서 이 배포 URL을 그냥 열면(주소창에 붙여넣고 엔터) 상태를 보여줍니다.
   지금 그 URL이 "어느 코드"를 돌리고 있는지 확인하는 용도입니다.
   ※ 암호 값 자체는 절대 보여주지 않습니다. 설정 여부만 알려줍니다. */
function doGet() {
  const set = (CLASS_CODE !== "여기에_반_암호" && String(CLASS_CODE).trim() !== "");
  const lines = [
    "[계약서 수신 스크립트]",
    "",
    "배포 확인 코드 : " + DEPLOY_TAG,
    "반 암호        : " + (set ? "설정됨 ✅" : "설정 안 됨 ❌"),
    "",
    set
      ? "정상입니다. 학생들이 제출할 수 있습니다."
      : [
          "아직 CLASS_CODE를 바꾸지 않은 코드가 배포되어 있습니다.",
          "",
          "1) 이 스크립트 맨 위 CLASS_CODE 를 실제 암호로 바꾸고 저장(Ctrl+S)",
          "2) [배포] > [배포 관리] > 연필(수정) > 버전 '새 버전' > [배포]",
          "   ※ [새 배포]를 누르면 URL이 새로 생겨 예전 주소가 계속 옛 코드를",
          "     돌립니다. 반드시 [배포 관리] > 수정 > 새 버전으로 하세요.",
          "3) 이 페이지를 새로고침해서 '설정됨'으로 바뀌는지 확인"
        ].join("\n")
  ];
  return ContentService.createTextOutput(lines.join("\n"))
    .setMimeType(ContentService.MimeType.TEXT);
}
