/* =========================================================
   config.js — 선생님이 직접 수정하는 유일한 파일입니다.
   HTML을 몰라도 됩니다. 아래 " " 따옴표 안의 글자만 고치세요.
   따옴표( " )와 쉼표( , )는 지우면 안 됩니다.
   ========================================================= */

/* ---------------------------------------------------------
   1) 구글 앱스스크립트 배포 URL — 두 개입니다

   일지와 계약서는 서로 다른 구글 스프레드시트 파일에 저장됩니다.
   그래서 받는 주소도 각각 따로입니다. 헷갈리지 않게 이름을 나눠 두었습니다.

   - 앱스스크립트를 '새 버전으로 배포'하면 주소가 바뀝니다.
     그때 바뀐 쪽 주소만 아래에서 고치면 됩니다.

   ⚠️ 배포할 때 두 개 모두 '액세스 권한: 모든 사용자'여야 합니다.
      학교 도메인으로 제한하면 학생 전원이 제출에 실패합니다.

   ⚠️ 각 주소는 "한 줄만" 살아 있어야 합니다.
      같은 이름이 두 줄이면 사이트 전체가 멈춥니다.
   --------------------------------------------------------- */

// ┌────────────────────────────────────────────────────────────────┐
// │ 📝 일지용 배포 URL                                              │
// │    apps-script/일지_Code.gs 를 넣고 배포한 뒤,                   │
// │    나온 주소를 아래 따옴표 " " 안에 붙여넣으세요.                 │
// └────────────────────────────────────────────────────────────────┘
const GAS_URL_JOURNAL  = "https://script.google.com/macros/s/AKfycbxgQ-4cU6ymMd6MLDPKmV5VTpBzT1YTaSp3wUFMXvfLEn_TWcoyMeK3B5yU_IAiRXRY/exec";

// ┌────────────────────────────────────────────────────────────────┐
// │ 📋 계약서용 배포 URL                                            │
// │    apps-script/계약서_Code.gs 를 넣고 배포한 뒤,                 │
// │    나온 주소를 아래 따옴표 " " 안에 붙여넣으세요.                 │
// └────────────────────────────────────────────────────────────────┘
const GAS_URL_CONTRACT = "https://script.google.com/macros/s/AKfycbxxAqauAhgJv7Q1vG_lDP22zQ33KwpxfsGhqrmPZhk8xG6Nlw0Gjbdh1kvNM1J0QM6dVg/exec";


/* ---------------------------------------------------------
   2) 패들렛 주소
   - 아직 만들지 않았으면 "" (빈 따옴표) 그대로 두세요.
   - 비어 있으면 홈페이지의 버튼이 '준비 중'으로 흐리게 표시되고
     눌리지 않습니다. 주소를 넣으면 자동으로 살아납니다.
   --------------------------------------------------------- */
const LINKS = {
  padletMid:   "https://padlet.com/ds3cyz1/2026-2-d5q9x1tnxb97rjdd",   // 4회차 중간발표
  padletTest:  "https://padlet.com/ds3cyz1/2026-2-d5q9x1tnxb97rjdd",   // 9회차 플레이테스트
  padletFinal: "https://padlet.com/ds3cyz1/2026-2-d5q9x1tnxb97rjdd",   // 11회차 최종 전시
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
   4) 학급 이름 — 계약서·일지 상단 뱃지에 표시됩니다.
   --------------------------------------------------------- */
const CLASS_NAME = "융합소프트웨어과 2학년 1반";

/* ---------------------------------------------------------
   5) 사이트 제목 — 모든 페이지 맨 위에 똑같이 표시됩니다.
      여기만 고치면 7개 페이지에 한꺼번에 반영됩니다.
   --------------------------------------------------------- */
const SITE_TITLE    = "2026 응용 프로그래밍 개발";
const SITE_SUBTITLE = "Ren'Py를 활용한 비쥬얼 노벨 게임 제작 프로젝트";

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

/* 오늘이 속한 "주"(월요일~일요일)에 들어 있는 회차 번호를 돌려줍니다.
   수업이 화요일이라, 월요일에 보아도 그 주의 수업이 '이번 주'로 나옵니다.
   수업이 끝난 수요일~일요일에도 같은 회차가 계속 '이번 주'로 남습니다.

   - 1회차가 있는 주가 되기 전이면 0        (= 아직 시작 전)
   - 마지막 회차가 있는 주를 지나면 길이+1  (= 프로젝트 종료)
   - 이번 주에 수업이 없으면 다음에 올 회차를 돌려줍니다.
   - 그 외에는 1 ~ 11                                          */
function getCurrentRound(todayStr) {
  const today = todayStr || new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
  const week = getWeekRange(today);

  // ① 이번 주 안에 수업이 있으면 그 회차
  for (let i = 0; i < ROUND_DATES.length; i++) {
    if (ROUND_DATES[i] >= week.monday && ROUND_DATES[i] <= week.sunday) return i + 1;
  }
  // ② 첫 회차가 있는 주보다 앞이면 '아직 시작 전'
  if (week.sunday < ROUND_DATES[0]) return 0;
  // ③ 마지막 회차가 있는 주보다 뒤면 '프로젝트 종료'
  if (week.monday > ROUND_DATES[ROUND_DATES.length - 1]) return ROUND_DATES.length + 1;
  // ④ 중간에 수업 없는 주(시험 주 등) — 다음에 올 회차를 보여줍니다
  for (let i = 0; i < ROUND_DATES.length; i++) {
    if (ROUND_DATES[i] > week.sunday) return i + 1;
  }
  return ROUND_DATES.length;
}

/* 어떤 날짜가 속한 주의 월요일과 일요일을 YYYY-MM-DD로 돌려줍니다. */
function getWeekRange(todayStr) {
  const p = todayStr.split("-").map(Number);
  const d = new Date(p[0], p[1] - 1, p[2]);
  const dow = d.getDay();                       // 0=일요일, 1=월요일 …
  const toMonday = (dow === 0) ? -6 : 1 - dow;  // 일요일은 그 주의 마지막 날로 봅니다
  const mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + toMonday);
  const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  const fmt = function (x) {
    return x.getFullYear() + "-" +
           String(x.getMonth() + 1).padStart(2, "0") + "-" +
           String(x.getDate()).padStart(2, "0");
  };
  return { monday: fmt(mon), sunday: fmt(sun) };
}

/* 이번 주에 실제로 수업이 있는지 (index/schedule의 안내 문구용) */
function hasClassThisWeek(todayStr) {
  const today = todayStr || new Date().toLocaleDateString("sv-SE");
  const week = getWeekRange(today);
  return ROUND_DATES.some(function (d) { return d >= week.monday && d <= week.sunday; });
}

/* 사이트 제목과 공통 내비게이션을 함께 그려줍니다.
   각 페이지는 <body> 안에 <div id="siteTop" data-page="contract"></div> 만 두면 됩니다.
   (제목이 위, 메뉴가 그 아래에 가운데 정렬로 들어갑니다) */
const NAV_ITEMS = [
  { key: "index",      href: "./index.html",      label: "🏠 홈" },
  { key: "schedule",   href: "./schedule.html",   label: "📅 일정" },
  { key: "topics",     href: "./topics.html",     label: "🎬 주제" },
  { key: "contract",   href: "./contract.html",   label: "📋 계약서" },
  { key: "cheatsheet", href: "./cheatsheet.html", label: "📖 치트시트" },
  { key: "journal",    href: "./journal.html",    label: "📝 일지" },
  { key: "rules",      href: "./rules.html",      label: "⚖️ 규칙" },
];

function renderSiteTop() {
  const host = document.getElementById("siteTop");
  if (!host) return;
  const current = host.dataset.page || "";

  const chips = NAV_ITEMS.map(function (it) {
    const on = it.key === current;
    return '<a class="nav-chip' + (on ? " is-current" : "") + '" href="' + it.href + '"' +
           (on ? ' aria-current="page"' : "") + ">" + it.label + "</a>";
  }).join("");

  host.innerHTML =
    '<header class="site-header">' +
      "<h1>" + SITE_TITLE + "</h1>" +
      '<p class="sub-title">' + SITE_SUBTITLE + "</p>" +
    "</header>" +
    '<nav class="site-nav" aria-label="페이지 이동">' +
      '<div class="nav-chips">' + chips + "</div>" +
    "</nav>";

  // 좁은 화면에서 메뉴가 가로로 넘칠 때, 지금 보고 있는 페이지 칩이
  // 화면 밖에 있지 않도록 메뉴 줄만 살짝 밀어 둡니다. (페이지는 움직이지 않습니다)
  const nav = host.querySelector(".site-nav");
  const cur = host.querySelector(".nav-chip.is-current");
  if (nav && cur && nav.scrollWidth > nav.clientWidth) {
    nav.scrollLeft = Math.max(0, cur.offsetLeft - (nav.clientWidth - cur.offsetWidth) / 2);
  }
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

document.addEventListener("DOMContentLoaded", renderSiteTop);
