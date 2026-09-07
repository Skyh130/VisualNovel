/* =========================================================
   config.js — 선생님이 직접 수정하는 유일한 파일입니다.
   HTML을 몰라도 됩니다. 아래 " " 따옴표 안의 글자만 고치세요.
   따옴표( " )와 쉼표( , )는 지우면 안 됩니다.
   ========================================================= */

/* ---------------------------------------------------------
   1) 구글 앱스스크립트 배포 URL
   - 일지(journal.html)와 계약서(contract.html)가 함께 사용합니다.
   - 앱스스크립트를 '새 버전으로 배포'하면 URL이 바뀔 수 있습니다.
     그때는 아래 주소만 새 주소로 바꿔주세요.
   - ⚠️ 배포할 때 '액세스 권한: 모든 사용자'로 배포해야 합니다.
        학교 도메인으로 제한하면 학생 전원이 제출에 실패합니다.
   --------------------------------------------------------- */
const GAS_URL = "https://script.google.com/macros/s/AKfycbyUmxJmI9pb5CkEg2hRAsaLA4CjoM6bkqRcTvD1uXk9qB3sNF5XNMiRzUtjNUY-GmhRqg/exec";

/* ---------------------------------------------------------
   2) 패들렛 주소
   - 아직 만들지 않았으면 "" (빈 따옴표) 그대로 두세요.
   - 비어 있으면 홈페이지의 버튼이 '준비 중'으로 흐리게 표시되고
     눌리지 않습니다. 주소를 넣으면 자동으로 살아납니다.
   --------------------------------------------------------- */
const LINKS = {
  padletMid:   "",   // 4회차 중간발표
  padletTest:  "",   // 9회차 플레이테스트
  padletFinal: "",   // 11회차 최종 전시
};

/* ---------------------------------------------------------
   3) 회차별 수업 날짜 (YYYY-MM-DD)
   - 학사일정이 바뀌면 여기 날짜만 고치면 됩니다.
     홈·일정 페이지의 '현재 회차'가 자동으로 따라 바뀝니다.
   - 순서대로 1회차, 2회차, ... 11회차입니다.
   --------------------------------------------------------- */
const ROUND_DATES = [
  "2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22",
  "2026-09-29", "2026-10-06", "2026-10-13", "2026-10-20",
  "2026-10-27", "2026-11-03", "2026-11-10"
];

/* ---------------------------------------------------------
   4) 학급 이름 — 페이지 상단 뱃지에 표시됩니다.
   --------------------------------------------------------- */
const CLASS_NAME = "융합소프트웨어과 2학년 1반";

/* ---------------------------------------------------------
   5) 제작 범위 상한 (최대 기준)
   - contract.html의 제출 검증에 그대로 사용됩니다.
   - 씬 수와 엔딩 수는 누구도 늘릴 수 없습니다.
   --------------------------------------------------------- */
const SCOPE_LIMITS = {
  scenes:      { label: "씬(label) 수",   max: 15, unit: "개" },
  endings:     { label: "엔딩 수",        max: 3,  unit: "개" },
  backgrounds: { label: "배경 이미지",    max: 7,  unit: "장" },
  characters:  { label: "캐릭터",         max: 5,  unit: "명" },
  minutes:     { label: "예상 플레이타임", max: 10, unit: "분" },
};

/* ===== 아래부터는 고치지 않아도 됩니다 =====================
   (여러 페이지가 함께 쓰는 작은 도구 함수들입니다)
   ========================================================= */

/* 오늘 기준 현재 회차 번호를 돌려줍니다.
   - 1회차 시작 전이면 0
   - 마지막 회차 날짜를 지나면 ROUND_DATES.length (= 종료)
   - 그 외에는 1 ~ 11                                        */
function getCurrentRound(todayStr) {
  const today = todayStr || new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  if (today < ROUND_DATES[0]) return 0;                          // 아직 시작 전
  if (today > ROUND_DATES[ROUND_DATES.length - 1]) {             // 마지막 회차도 지남
    return ROUND_DATES.length + 1;                               // = 프로젝트 종료
  }
  let idx = 0;
  ROUND_DATES.forEach((d, i) => { if (today >= d) idx = i; });
  return idx + 1;
}

/* 공통 내비게이션을 그려줍니다.
   각 페이지는 <body> 안에 <nav id="siteNav" data-page="contract"></nav> 만 두면 됩니다. */
const NAV_ITEMS = [
  { key: "index",      href: "./index.html",      label: "🏠 홈" },
  { key: "schedule",   href: "./schedule.html",   label: "📅 일정" },
  { key: "topics",     href: "./topics.html",     label: "🎬 주제" },
  { key: "contract",   href: "./contract.html",   label: "📋 계약서" },
  { key: "cheatsheet", href: "./cheatsheet.html", label: "📖 치트시트" },
  { key: "journal",    href: "./journal.html",    label: "📝 일지" },
  { key: "rules",      href: "./rules.html",      label: "⚖️ 규칙" },
];

function renderNav() {
  const nav = document.getElementById("siteNav");
  if (!nav) return;
  const current = nav.dataset.page || "";
  nav.setAttribute("aria-label", "페이지 이동");
  nav.innerHTML =
    '<div class="nav-chips">' +
    NAV_ITEMS.map(function (it) {
      const on = it.key === current;
      return '<a class="nav-chip' + (on ? " is-current" : "") + '" href="' + it.href + '"' +
             (on ? ' aria-current="page"' : "") + ">" + it.label + "</a>";
    }).join("") +
    "</div>";
}

/* 링크가 비어 있으면 '준비 중'으로 비활성 표시합니다. */
function applyLinkButton(el, url, readyLabel) {
  if (!el) return;
  if (url && url.trim() !== "") {
    el.href = url;
    el.target = "_blank";
    el.rel = "noopener";
    el.classList.remove("is-disabled");
    el.removeAttribute("aria-disabled");
    el.textContent = readyLabel;
  } else {
    el.removeAttribute("href");
    el.classList.add("is-disabled");
    el.setAttribute("aria-disabled", "true");
    el.textContent = readyLabel + " (준비 중)";
  }
}

document.addEventListener("DOMContentLoaded", renderNav);
