// ═══ 星光事務所 · 小手機載入器 v2.14.0 ═══
// 掛載範式對齊已驗證卡（梁清暉小手機同步橋）：
//   卡內 data.extensions.sgx_phone.hud_html → 以 template 解析 → 掛到宿主 body →
//   內層 <script> 抽出後以宿主 <script> 標籤注入執行 → 取得 root.__sgxSetOpen/__sgxRender。
// 本腳本本身留在酒館助手腳本域，負責：入口綁定、MVU 讀取、triggerSlash 送出、事件轉發。
// v2.14.0：v0.46 架構層改版（視覺零變更）——HUD_HTML 拆為 來源/scripts/phone/ 真檔，構建組裝＋機器轉義烘回；
//         新增遠端 HUD 通道（hybrid 預設開）：boot 即嘗試 import gcore jsdelivr 釘 tag 模組，成功掛遠端展示層
//         （頭部標記 REMOTE @tag），失敗／5s 逾時大聲降級跑卡內烘焙版（標記 BAKED）；來源判定每 boot 一次、
//         遲到結果丟棄、判定未決先開＝先烘焙不重掛；遠端模組只承載 HUD_VERSION＋HUD_HTML 兩字串；
//         diag() 補 hudOrigin／hudRemoteVersion／hudRemoteTag／hudRemoteMs／hudRemoteError；內層刪死碼 isNarrow()。
// v2.13.0：跳過廢棄鏈 2.12.x——新聞頁 8/11 欄（普通/突發）、rows() 依記錄欄數分流相容舊存檔、新聞列顯示 MM-DD~MM-DD、320px 紅線不溢出。
// v2.11.0：趨勢自由化——活躍趨勢 7 欄→9 欄（追加 name、rel）；新聞頁趨勢列 title 改 '趨勢 ' + (o.name || o.id)。
// v2.10.1：打工解鎖改註冊表制（GIG_UNLOCKS 由構建自 來源/data/gig_unlocks.json 注入）；解鎖 DSL 補 company_funds_max 與 對象路徑 <idol_id> 佔位代入；課程／打工下拉共用 checkUnlock(registry)。
// v2.9.0：新增「月曆」頁（介面契約 §3.11 落地）：唯讀派生視圖，週一起始、今天高亮、已執行／未執行視覺區分；
//         標記來自 日程.已確認排程／每日結果、活躍邀約／進行中工作／待定案作品期限、合約到期／續約預警、養病鎖定、
//         阻塞節點、主綫截止與頒獎固定日曆；不寫入任何 MVU 變量、不顯示疲勞／成功率／門檻數值。
// v2.7.0：新增「新聞」頁（介面契約 §3.6 落地）：唯讀顯示 娛樂圈新聞 四葉——普通新聞／突發新聞（含回應狀態）／
//         活躍趨勢，解析既有豎線分隔字串，不生成、不重抽、不建第二份新聞庫；任務頁「進行中事務」區新增
//         news_* 前綴（新聞後續）事務標籤（v0.37 任務種子路由）。
// v2.6.0：任務系統 v1 進卡——新增「任務」頁：主線鏈（TASKS 註冊表×任務.任務日誌 投影，未解鎖佔位不劇透）＋
//         「進行中事務」區（公司.company_player.活躍任務 與 與玩家戀愛.<idol_id>.活躍任務 六欄字串唯讀投影）；
//         預設分頁改為行程頁（對齊介面契約 §3.2「行程頁是預設主頁」）；版本戳三處統一 2.6.0（修 v0.33 遺留的 2.4.0/2.5.0 標示不一致）。
// v2.0.8：修自動連排閉包錯誤——change listener 原本閉包共用 for 迴圈的 var date（觸發時恒為週日，連排永不生效），
//         改由格子自身的 key 推導日期；休整下拉標示補 $（對齊介面契約 名稱（N天・$費用））。
// v2.0.9：課程解鎖檔制落地——HUD 內建課程解鎖條件評估（能力門檻、知名度、粉絲數、公司資金、日期區間、
//         已完成課程、NPC 好感度等），課程下拉依當前偶像狀態動態過濾。
// v2.2.0：行程類型六型化（正式工作、課程、打工、宣傳、休息、外出），原「私人行程／自由行動」併為「外出」；
//         外出承載地圖跑點、偶遇與拜訪洽談。
// v2.3.0：小手機內建開局表單校驗補齊四閘——互斥雙向檢查、負面 tag ≤3 個、返點合計 ≤6 點、
//         點數口徑改為「正面費用總和 ≤ 難度預算＋返點總和」；
//         宣傳企劃下拉依玩家「企劃製作」有效值過濾未達門檻項目。
// v2.4.0：戀愛加濃包批二（L3 呈現層）——偶像頁新增「兩人」區塊（關係狀態、足跡、體諒徽章）；
//         新增「訊息」頁，消費 與玩家戀愛.<idol_id>.待送訊息.佇列 v1 字串（訊息_id@類型@產生日期@唯一事件_id@已讀日期），
//         提供已讀寫回、回覆輕互動、主動邀約接受/婉拒入口；呈現層零數字，不顯示戀愛數值。
// v2.5.0：成就系統 v1 進卡——新增「成就」頁，讀取 成就.已解鎖 與 ACHIEVEMENTS 註冊表，
//         分偶像／公司／全局三區只讀展示，零數字，依可見性分公開／提示／隱藏三級。
// v2.1.0：宣傳五型與打工十四型目錄落地；打工下拉依偶像對應專業能力解鎖條件動態過濾；專業能力上限 0–999。
// v2.0.7：休息改為休整配置目錄制（RESTS 由構建自 來源/data/rests.json 注入）：下拉選 rest_home／rest_onsen／
//         rest_trip，多日配置自動連排；自動連排遇到已排其他行程或不同休整配置的格子即停止，不覆寫。
// v2.0.6：頒獎禮註冊表改為構建自 來源/data/awards.json 注入；出席選項只出現在「該格日期＝頒獎日當天」
//         的可編輯格（修復 v0.19 整頒獎週都出現的問題，對齊 L1《年度事件與頒獎》§7）。
// v2.0.5：真機顯示彈窗會出現但幾何算錯（面板在垂直中線被截斷）——定位原本依賴根節點容器盒
//         （inset:0 + % + transform 置中），該容器盒在此環境算出來不對。改為面板與背幕各自
//         position:fixed，寬高與座標由腳本以視窗像素直接寫死，不再用 inset/%/vh/transform。
// v2.0.3：版面由底部抽屜改為置中彈窗＋半透明背幕（使用者實測懷疑抽屜）。
//         可見性檢查升級為「命中測試」：用 elementFromPoint 打面板中心，確認點到的真的是面板，
//         並檢查 computed display/visibility/opacity；被蓋住或畫在看不見的位置都會被抓到並回報。
//         被蓋住時先自動補救（重新掛到 body 末尾、拉高 z-index）再複驗，仍失敗才提示。
//         保底懸浮鈕改為「驗證真的看得見」才移除；長按 0.6 秒可叫出診斷。
// v2.0.2：真機診斷顯示面板已彈出（80ms 自測有真實尺寸），卻在 140ms 內被關掉。
//         → 加「剛開就關」保護：開啟後 600ms 內的關閉請求一律視為同一次點擊的重複訊號並忽略；
//           另加入口動作追蹤（trace），失敗提示會附上完整時間軸。
// v2.0.1：HUD 內嵌於本腳本，不再依賴把角色卡讀回來取 extensions.sgx_phone.hud_html。
//         （Termux 實測：按鈕能畫出來＝腳本一定有載入，所以把 UI 綁在腳本上是最可靠的來源。）
//         另補「可見的失敗回報」：開啟後若面板量到 0 尺寸或掛載在非主頁面，直接彈提示，不再靜默無反應。
// v2.0.0：改用覆蓋層＋panel.hidden 顯示範式（修手機端「有反應但不彈窗」）。
//         保留 v1.3.3 的入口硬化：訊號來源去重、宿主特徵判定、長重試、寬鬆標籤比對、後備懸浮鈕。

(function () {
  'use strict';

  var VERSION = '2.14.0';
  var ROOT_ID = 'sgx-phone-root';
  var PHONE_BUTTON_NAME = '📱 小手機';
  var RUNTIME_KEY = '__sgxPhoneRuntime';
  var BRIDGE_KEY = '__sgxPhoneBridge';

  // 遠端 HUD 通道工程常數（v2.14.0；唯一住所＝本檔，對齊 v0.46-規格-小手機架構層.md §2.2）
  var REMOTE_TAG = 'v0.46';
  var REMOTE_HUD_URL = 'https://gcore.jsdelivr.net/gh/meowings20000/sgx-phone-hud@' + REMOTE_TAG + '/dist/hud.js';
  var REMOTE_TIMEOUT_MS = 5000;

  // HUD 原始碼由構建自 來源/scripts/phone/ 真檔（loader.js／hud.css／hud-skeleton.html／hud-inner.js）
  // 組裝後注入本模板字面量（機器轉義，人不得手寫轉義；注入點＝下方 HUD_SRC 佔位）。
  // 字串中的結束標籤以 <\/script> 轉義，避免宿主以 HTML 解析腳本內容時被提前截斷。
  var HUD_HTML = `<div id=\"sgx-phone-root\" data-sgx-phone-version=\"2.14.0\">\n  <style>\n    #sgx-phone-root, #sgx-phone-root * { box-sizing: border-box; }\n    #sgx-phone-root {\n      position: fixed; inset: 0; z-index: 2147482800; pointer-events: none;\n      color: #e8e4da; font-size: 14px; line-height: 1.55;\n      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, \"Segoe UI\",\n        \"PingFang TC\", \"Microsoft JhengHei\", sans-serif;\n    }\n    #sgx-phone-root [hidden] { display: none !important; }\n    #sgx-phone-root button, #sgx-phone-root select, #sgx-phone-root input { font: inherit; }\n    #sgx-phone-root button { -webkit-tap-highlight-color: transparent; }\n\n    #sgx-phone-root [data-sgx-modal] { position: static; }\n    #sgx-phone-root [data-sgx-backdrop] {\n      position: fixed; left: 0; top: 0; right: 0; bottom: 0;\n      width: 100%; height: 100%;\n      pointer-events: auto;\n      background: rgba(0, 0, 0, 0.62);\n    }\n    /* 幾何由腳本以像素寫死（見 layout()）；這裡只是拿不到腳本時的保底值。 */\n    #sgx-phone-root [data-sgx-panel] {\n      position: fixed; left: 8px; top: 8px;\n      width: 360px; height: 560px;\n      pointer-events: auto;\n      display: flex; flex-direction: column; overflow: hidden;\n      background: #17161d; border: 1px solid #4a4358; color: #e8e4da;\n      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.7);\n      overscroll-behavior: contain; isolation: isolate;\n      border-radius: 14px;\n    }\n\n    #sgx-phone-root .sgx-ph-ver { font-size: 10px; color: #6f6982; margin-right: 8px; }\n    #sgx-phone-root .sgx-ph-head { flex: none; display: flex; align-items: center; gap: 4px; padding: 8px 10px; background: #100f15; border-bottom: 1px solid #363143; user-select: none; }\n    #sgx-phone-root .sgx-ph-title { font-weight: 700; color: #e6c37a; margin-right: auto; font-size: 14px; }\n    #sgx-phone-root .sgx-ph-close { flex: none; width: 36px; height: 36px; border: none; border-radius: 8px; background: transparent; color: #a9a3b8; font-size: 18px; cursor: pointer; }\n    #sgx-phone-root .sgx-ph-tabs { flex: none; display: flex; border-bottom: 1px solid #363143; background: #100f15; }\n    #sgx-phone-root .sgx-ph-tab { flex: 1; min-width: 0; padding: 8px 4px; border: none; background: transparent; color: #a9a3b8; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; min-height: 44px; }\n    #sgx-phone-root .sgx-ph-tab[aria-selected=\"true\"] { color: #e6c37a; border-bottom-color: #e6c37a; font-weight: 700; }\n    #sgx-phone-root .sgx-ph-body { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 12px; -webkit-overflow-scrolling: touch; }\n    #sgx-phone-root .sgx-ph-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 6px 0; }\n    #sgx-phone-root .sgx-ph-chip { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #221d16; border: 1px solid #4a4358; font-size: 12px; color: #e6c37a; }\n    #sgx-phone-root .sgx-ph-chip.sgx-warn { color: #e08a8a; border-color: #7a4a4a; background: #231619; }\n    #sgx-phone-root .sgx-ph-sec { margin: 12px 0 4px; font-size: 12px; color: #8f89a3; }\n    #sgx-phone-root .sgx-ph-card { background: #100f15; border: 1px solid #363143; border-radius: 10px; padding: 10px; margin: 8px 0; }\n    #sgx-phone-root .sgx-ph-kv { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; padding: 2px 0; }\n    #sgx-phone-root .sgx-ph-kv span:first-child { color: #a9a3b8; }\n    #sgx-phone-root .sgx-ph-btn { padding: 10px 14px; min-height: 44px; border: none; border-radius: 10px; background: #e6c37a; color: #1c1710; font-weight: 700; cursor: pointer; touch-action: manipulation; }\n    #sgx-phone-root .sgx-ph-btn:disabled { background: #4a4358; color: #8f89a3; cursor: not-allowed; }\n    #sgx-phone-root .sgx-ph-btn.sgx-ghost { background: #221d16; color: #e6c37a; border: 1px solid #4a4358; }\n    #sgx-phone-root .sgx-ph-btn[aria-pressed=\"true\"] { outline: 2px solid #e6c37a; background: #30291c; }\n    #sgx-phone-root .sgx-ph-open-list { display: grid; gap: 8px; margin-top: 8px; }\n    #sgx-phone-root .sgx-ph-open-option { display: grid; gap: 4px; padding: 8px; border: 1px solid #26222f; border-radius: 9px; background: #17161d; }\n    #sgx-phone-root .sgx-ph-open-option .sgx-ph-btn { width: 100%; text-align: left; }\n    #sgx-phone-root .sgx-ph-open-preview { white-space: pre-wrap; overflow-wrap: anywhere; color: #e8e4da; }\n    #sgx-phone-root .sgx-ph-day { background: #100f15; border: 1px solid #363143; border-radius: 10px; padding: 8px 10px; margin: 8px 0; }\n    #sgx-phone-root .sgx-ph-dayhead { font-weight: 700; font-size: 13px; margin-bottom: 6px; }\n    #sgx-phone-root .sgx-ph-dayhead span { color: #8f89a3; font-weight: 400; font-size: 12px; margin-left: 6px; }\n    #sgx-phone-root .sgx-ph-cell { display: flex; align-items: center; gap: 6px; padding: 6px 0; border-top: 1px dashed #26222f; }\n    #sgx-phone-root .sgx-ph-cellname { flex: none; width: 64px; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n    #sgx-phone-root .sgx-ph-cell select { flex: 1; min-width: 0; padding: 8px 6px; min-height: 40px; background: #17161d; color: #e8e4da; border: 1px solid #363143; border-radius: 8px; font-size: 13px; }\n    #sgx-phone-root .sgx-ph-cell select:disabled { background: #100f15; color: #6f6982; }\n    #sgx-phone-root .sgx-ph-readonly { font-size: 12px; color: #8f89a3; }\n    #sgx-phone-root .sgx-ph-note { font-size: 12px; color: #8f89a3; margin: 8px 0; }\n    #sgx-phone-root .sgx-ph-error { font-size: 12px; color: #e08a8a; margin: 6px 0; }\n    #sgx-phone-root .sgx-ph-bar { display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; color: #a9a3b8; }\n    #sgx-phone-root .sgx-ph-baritem { background: #17161d; border: 1px solid #26222f; border-radius: 6px; padding: 3px 6px; }\n    #sgx-phone-root .sgx-ph-msglist { display: grid; gap: 8px; margin-top: 8px; }\n    #sgx-phone-root .sgx-ph-msgrow { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid #26222f; border-radius: 9px; background: #17161d; cursor: pointer; }\n    #sgx-phone-root .sgx-ph-msgrow:hover { border-color: #4a4358; }\n    #sgx-phone-root .sgx-ph-msgname { font-weight: 700; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n    #sgx-phone-root .sgx-ph-msgmeta { font-size: 12px; color: #8f89a3; white-space: nowrap; }\n    #sgx-phone-root .sgx-ph-msgbadge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #7a4a4a; color: #e08a8a; font-size: 11px; font-weight: 700; }\n    #sgx-phone-root .sgx-ph-thread { display: grid; gap: 8px; margin-top: 8px; }\n    #sgx-phone-root .sgx-ph-msgbubble { padding: 8px; border-radius: 9px; background: #17161d; border: 1px solid #26222f; }\n    #sgx-phone-root .sgx-ph-msgbubble.unread { border-color: #7a4a4a; }\n    #sgx-phone-root .sgx-ph-msgtype { font-size: 12px; color: #e6c37a; }\n    #sgx-phone-root .sgx-ph-msgdate { font-size: 11px; color: #8f89a3; }\n    #sgx-phone-root .sgx-ph-back { margin-bottom: 8px; }\n    #sgx-phone-root .sgx-ph-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; margin-top: 8px; }\n    #sgx-phone-root .sgx-ph-cal-weekday { text-align: center; font-size: 11px; color: #8f89a3; padding: 4px 0; }\n    #sgx-phone-root .sgx-ph-cal-day { min-width: 0; min-height: 64px; background: #100f15; border: 1px solid #363143; border-radius: 8px; padding: 4px; display: flex; flex-direction: column; gap: 2px; }\n    #sgx-phone-root .sgx-ph-cal-day.sgx-ph-cal-out { opacity: 0.45; }\n    #sgx-phone-root .sgx-ph-cal-day.sgx-ph-cal-today { border-color: #e6c37a; background: #221d16; }\n    #sgx-phone-root .sgx-ph-cal-day.sgx-ph-cal-pending { border-left: 3px solid #8f89a3; }\n    #sgx-phone-root .sgx-ph-cal-day.sgx-ph-cal-done { border-left: 3px solid #5a8a5a; }\n    #sgx-phone-root .sgx-ph-cal-daynum { font-size: 12px; font-weight: 700; color: #e8e4da; }\n    #sgx-phone-root .sgx-ph-cal-marks { display: flex; flex-direction: column; gap: 1px; overflow: hidden; }\n    #sgx-phone-root .sgx-ph-cal-mark { font-size: 9px; color: #e8e4da; background: #26222f; border-radius: 3px; padding: 1px 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n    #sgx-phone-root .sgx-ph-cal-mark.sgx-ph-cal-award-award { background: #4a3d1c; color: #e6c37a; }\n    #sgx-phone-root .sgx-ph-cal-mark.sgx-ph-cal-award-nom { background: #1c2b3d; color: #8ab4e0; }\n    #sgx-phone-root .sgx-ph-cal-mark.sgx-ph-cal-block { background: #4a1c1c; color: #e08a8a; }\n    #sgx-phone-root .sgx-ph-cal-mark.sgx-ph-cal-sick { background: #3d2b1c; color: #e0b48a; }\n    #sgx-phone-root .sgx-ph-cal-more { font-size: 9px; color: #8f89a3; text-align: center; }\n  </style>\n  <div data-sgx-modal hidden>\n    <div data-sgx-backdrop></div>\n    <section data-sgx-panel aria-label=\"小手機\" role=\"dialog\"></section>\n  </div>\n  <script>\n// ═══ 星光事務所 · 小手機 HUD v2.14.0 ═══\n// 掛載範式對齊已驗證卡（梁清暉小手機）：本腳本由載入器注入宿主頁面執行，\n// 根節點是 pointer-events:none 的全屏覆蓋層，實際面板為內層 [data-sgx-panel]，\n// 開關一律走 panel.hidden，不再對 fixed 元素做 inline display/visibility 切換。\n// 資料與送出經由 window.__sgxPhoneBridge 回呼酒館助手腳本域。\n(function () {\n  'use strict';\n\n  var root = document.getElementById('sgx-phone-root');\n  if (!root || root.__sgxInit) return;\n  root.__sgxInit = true;\n\n  var VERSION = '2.14.0';\n  var modal = root.querySelector('[data-sgx-modal]');\n  var panel = root.querySelector('[data-sgx-panel]');\n  var backdrop = root.querySelector('[data-sgx-backdrop]');\n  var DRAFT_PREFIX = 'sgx-phone-draft:';\n  var stops = [];\n\n  function bridge() { return window.__sgxPhoneBridge || null; }\n\n  function log() {\n    try { console.log.apply(console, ['[星光事務所·小手機HUD]'].concat([].slice.call(arguments))); } catch (e) { }\n  }\n\n  var runtime = {\n    destroyed: false,\n    tab: 'schedule',\n    calendarMonth: null,\n    stat: null,\n    draft: null,\n    draftKey: null,\n    openingState: null,\n    messageThreadId: null,\n    readSentForThread: null,\n    stops: stops,\n    timers: Object.create(null)\n  };\n\n  function onDestroyedGuard() { return runtime.destroyed; }\n\n  var SCHEDULE_TYPES = ['正式工作', '課程', '打工', '宣傳', '休息', '外出'];\n  var UNSET = '未安排';\n  var WEEKDAY_CN = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];\n  var ID_RE = /^(idol|job|offer|work|course|contract)_\\w+$/;\n\n  // 地點註冊表（顯示常數，敘事真值以「世界設定-公司與地點」為準；作者改人設或地點時同步）\n  var MAP_LOCS = [\n    { id: 'loc_gym', name: '健身房', desc: '維持體態與練習的日常去處，環境安靜、器械齊全', idols: ['idol_01'] },\n    { id: 'loc_cafe', name: '咖啡廳', desc: '跑通告前的集合點，也是寫歌、躲人的安靜角落', idols: ['idol_03', 'idol_04'] },\n    { id: 'loc_shopping', name: '商業街', desc: '人來人往的繁華地段，熟人最多、最自在', idols: ['idol_03'] },\n    { id: 'loc_park', name: '公園', desc: '安靜、可以一個人待著的地方，也是深夜散步找靈感的地方', idols: ['idol_02', 'idol_04'] }\n  ];\n  var MAP_AGENCIES = [\n    { id: 'loc_agency_a', name: '曜星娛樂', desc: '大型綜合娛樂公司，歌舞偶像培養線強（溫敘白）' },\n    { id: 'loc_agency_b', name: '青嵐影業', desc: '影視導向中型公司（秦灼）' },\n    { id: 'loc_agency_c', name: '淺川傳媒', desc: '瀕臨倒閉的小型公司（聞緒）' }\n  ];\n  // 製作與合作方（拜訪洽談工作；規則以「核心規則-地圖偶遇」§九為準，每家公司 14 天冷卻）\n  var MAP_PRODUCERS = [\n    { id: 'loc_record', name: '唱片公司', desc: '音樂製作與發行；單曲／專輯／OST 邀約來源' },\n    { id: 'loc_filmco', name: '影視製作公司', desc: '電影／電視劇／網劇製作方' },\n    { id: 'loc_theater', name: '劇場', desc: '舞台劇／音樂劇演出與製作' },\n    { id: 'loc_radio', name: '廣播電台', desc: '電台訪談、廣播劇與聲音內容' },\n    { id: 'loc_adco', name: '廣告公司', desc: '廣告拍攝、品牌合作與平面企劃' }\n  ];\n\n    // 標籤註冊表由構建自 來源/data/tags.json 注入（與手寫條目「核心規則-玩家標籤」同步維護）\n  var TAGS = {\n  \"1\": { \"名稱\": \"天生伯樂\", \"類型\": \"永久天賦\", \"費用\": 4, \"直接修正\": { \"洞察判斷\": 10 }, \"互斥\": [ 6, 16, 23, 26, 29 ], \"特殊流程\": null },\n  \"2\": { \"名稱\": \"不善交際\", \"類型\": \"創建負面\", \"費用\": -3, \"直接修正\": { \"公關應對\": -10, \"溝通共情\": -5 }, \"互斥\": [ 5, 8, 9, 12, 14, 18, 21, 23, 25, 27 ], \"特殊流程\": null },\n  \"3\": { \"名稱\": \"商業手腕\", \"類型\": \"永久天賦\", \"費用\": 5, \"直接修正\": { \"商務談判\": 10 }, \"互斥\": [ 7, 14, 17, 24, 28 ], \"特殊流程\": null },\n  \"4\": { \"名稱\": \"行程達人\", \"類型\": \"永久天賦\", \"費用\": 4, \"直接修正\": { \"行程管理\": 10 }, \"互斥\": [ 10, 19, 22, 24 ], \"特殊流程\": null },\n  \"5\": { \"名稱\": \"老練公關\", \"類型\": \"永久天賦\", \"費用\": 4, \"直接修正\": { \"公關應對\": 10 }, \"互斥\": [ 2, 9, 14, 18, 21, 23, 25 ], \"特殊流程\": null },\n  \"6\": { \"名稱\": \"眼光獨到\", \"類型\": \"永久天賦\", \"費用\": 2, \"直接修正\": { \"洞察判斷\": 5 }, \"互斥\": [ 1, 16, 23, 26, 29 ], \"特殊流程\": null },\n  \"7\": { \"名稱\": \"能言善道\", \"類型\": \"永久天賦\", \"費用\": 2, \"直接修正\": { \"商務談判\": 5 }, \"互斥\": [ 3, 14, 17, 24, 28 ], \"特殊流程\": null },\n  \"8\": { \"名稱\": \"同理心強\", \"類型\": \"永久天賦\", \"費用\": 2, \"直接修正\": { \"溝通共情\": 5 }, \"互斥\": [ 2, 12, 18, 25, 27 ], \"特殊流程\": null },\n  \"9\": { \"名稱\": \"圓滑應對\", \"類型\": \"永久天賦\", \"費用\": 2, \"直接修正\": { \"公關應對\": 5 }, \"互斥\": [ 2, 5, 14, 18, 21, 23, 25 ], \"特殊流程\": null },\n  \"10\": { \"名稱\": \"條理分明\", \"類型\": \"永久天賦\", \"費用\": 2, \"直接修正\": { \"行程管理\": 5 }, \"互斥\": [ 4, 19, 22, 24 ], \"特殊流程\": null },\n  \"11\": { \"名稱\": \"靈感豐富\", \"類型\": \"永久天賦\", \"費用\": 2, \"直接修正\": { \"企劃製作\": 5 }, \"互斥\": [ 13, 20, 26, 30 ], \"特殊流程\": null },\n  \"12\": { \"名稱\": \"溝通達人\", \"類型\": \"永久天賦\", \"費用\": 4, \"直接修正\": { \"溝通共情\": 10 }, \"互斥\": [ 2, 8, 18, 25, 27 ], \"特殊流程\": null },\n  \"13\": { \"名稱\": \"企劃鬼才\", \"類型\": \"永久天賦\", \"費用\": 4, \"直接修正\": { \"企劃製作\": 10 }, \"互斥\": [ 11, 20, 26, 30 ], \"特殊流程\": null },\n  \"14\": { \"名稱\": \"業界人脈\", \"類型\": \"背景風味\", \"費用\": 3, \"直接修正\": { \"商務談判\": 5, \"公關應對\": 5 }, \"互斥\": [ 2, 3, 5, 7, 9, 17, 18, 21, 23, 24, 25, 28 ], \"特殊流程\": \"每月邀約批次刷新附帶 1 份直接邀請額外邀約（不佔 5–7 配額；防重綁 月邀約批次_id；規則見 核心規則-工作與作品結算 月刷新節）\" },\n  \"15\": { \"名稱\": \"啟動資金\", \"類型\": \"背景風味\", \"費用\": 6, \"直接修正\": {  }, \"互斥\": [  ], \"特殊流程\": \"開局確認後經「核心規則-公司財務」一次性資金流程入帳 +50000（來源事件_id＝玩家標籤.啟動資金，冪等防重），不計入本月確認收入\" },\n  \"16\": { \"名稱\": \"有眼無珠\", \"類型\": \"創建負面\", \"費用\": -4, \"直接修正\": { \"洞察判斷\": -10 }, \"互斥\": [ 1, 6, 23, 26, 29 ], \"特殊流程\": null },\n  \"17\": { \"名稱\": \"談判苦手\", \"類型\": \"創建負面\", \"費用\": -4, \"直接修正\": { \"商務談判\": -10 }, \"互斥\": [ 3, 7, 14, 24, 28 ], \"特殊流程\": null },\n  \"18\": { \"名稱\": \"口無遮攔\", \"類型\": \"創建負面\", \"費用\": -3, \"直接修正\": { \"溝通共情\": -10, \"公關應對\": -5 }, \"互斥\": [ 2, 5, 8, 9, 12, 14, 21, 23, 25, 27 ], \"特殊流程\": null },\n  \"19\": { \"名稱\": \"丟三落四\", \"類型\": \"創建負面\", \"費用\": -4, \"直接修正\": { \"行程管理\": -10 }, \"互斥\": [ 4, 10, 22, 24 ], \"特殊流程\": null },\n  \"20\": { \"名稱\": \"江郎才盡\", \"類型\": \"創建負面\", \"費用\": -4, \"直接修正\": { \"企劃製作\": -10 }, \"互斥\": [ 11, 13, 26, 30 ], \"特殊流程\": null },\n  \"21\": { \"名稱\": \"輕度社恐\", \"類型\": \"創建負面\", \"費用\": -2, \"直接修正\": { \"公關應對\": -5 }, \"互斥\": [ 2, 5, 9, 14, 18, 23, 25 ], \"特殊流程\": null },\n  \"22\": { \"名稱\": \"粗心大意\", \"類型\": \"創建負面\", \"費用\": -2, \"直接修正\": { \"行程管理\": -5 }, \"互斥\": [ 4, 10, 19, 24 ], \"特殊流程\": null },\n  \"23\": { \"名稱\": \"危機直覺\", \"類型\": \"背景風味\", \"費用\": 3, \"直接修正\": { \"公關應對\": 5, \"洞察判斷\": 5 }, \"互斥\": [ 1, 2, 5, 6, 9, 14, 16, 18, 21, 25, 26, 29 ], \"特殊流程\": null },\n  \"24\": { \"名稱\": \"精打細算\", \"類型\": \"背景風味\", \"費用\": 3, \"直接修正\": { \"商務談判\": 5, \"行程管理\": 5 }, \"互斥\": [ 3, 4, 7, 10, 14, 17, 19, 22, 28 ], \"特殊流程\": null },\n  \"25\": { \"名稱\": \"以人為本\", \"類型\": \"背景風味\", \"費用\": 3, \"直接修正\": { \"溝通共情\": 5, \"公關應對\": 5 }, \"互斥\": [ 2, 5, 8, 9, 12, 14, 18, 21, 23, 27 ], \"特殊流程\": null },\n  \"26\": { \"名稱\": \"創意製腦\", \"類型\": \"背景風味\", \"費用\": 3, \"直接修正\": { \"企劃製作\": 5, \"洞察判斷\": 5 }, \"互斥\": [ 1, 6, 11, 13, 16, 20, 23, 29, 30 ], \"特殊流程\": null },\n  \"27\": { \"名稱\": \"臉盲\", \"類型\": \"創建負面\", \"費用\": -2, \"直接修正\": { \"溝通共情\": -5 }, \"互斥\": [ 2, 8, 12, 18, 25 ], \"特殊流程\": null },\n  \"28\": { \"名稱\": \"商業冷感\", \"類型\": \"創建負面\", \"費用\": -2, \"直接修正\": { \"商務談判\": -5 }, \"互斥\": [ 3, 7, 14, 17, 24 ], \"特殊流程\": null },\n  \"29\": { \"名稱\": \"直覺遲鈍\", \"類型\": \"創建負面\", \"費用\": -2, \"直接修正\": { \"洞察判斷\": -5 }, \"互斥\": [ 1, 6, 16, 23, 26 ], \"特殊流程\": null },\n  \"30\": { \"名稱\": \"半途而廢\", \"類型\": \"創建負面\", \"費用\": -2, \"直接修正\": { \"企劃製作\": -5 }, \"互斥\": [ 11, 13, 20, 26 ], \"特殊流程\": null }\n};\n\n  // COURSES 目錄由構建自 來源/data/courses.json 注入（作者側 世界書-實例/課程世界書.md 同步維護）\n  var COURSES = {\n  \"course_01\": {\n    \"名稱\": \"聲樂訓練・初階\",\n    \"能力\": \"歌唱\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 2000,\n    \"基礎成功率_pct\": 85,\n    \"成長量\": 20,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_02\": {\n    \"名稱\": \"舞蹈訓練・初階\",\n    \"能力\": \"舞蹈\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 2000,\n    \"基礎成功率_pct\": 85,\n    \"成長量\": 20,\n    \"疲勞增量\": 12,\n    \"壓力增量\": 4,\n    \"體力型\": true,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_03\": {\n    \"名稱\": \"表演工作坊・初階\",\n    \"能力\": \"演技\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 2400,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 20,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_04\": {\n    \"名稱\": \"舞台表現訓練・初階\",\n    \"能力\": \"舞台表現\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 2400,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 20,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_05\": {\n    \"名稱\": \"鏡頭感訓練・初階\",\n    \"能力\": \"鏡頭感\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 2400,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 20,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_06\": {\n    \"名稱\": \"綜藝口才班・初階\",\n    \"能力\": \"綜藝口才\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 2000,\n    \"基礎成功率_pct\": 85,\n    \"成長量\": 20,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_07\": {\n    \"名稱\": \"創作工作坊・初階\",\n    \"能力\": \"創作\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 2000,\n    \"基礎成功率_pct\": 85,\n    \"成長量\": 20,\n    \"疲勞增量\": 4,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_08\": {\n    \"名稱\": \"形象管理諮詢・初階\",\n    \"能力\": \"形象管理\",\n    \"地點_id\": \"loc_shopping\",\n    \"費用每日\": 2000,\n    \"基礎成功率_pct\": 90,\n    \"成長量\": 20,\n    \"疲勞增量\": 4,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_09\": {\n    \"名稱\": \"體能訓練・初階\",\n    \"能力\": \"體能\",\n    \"地點_id\": \"loc_gym\",\n    \"費用每日\": 1800,\n    \"基礎成功率_pct\": 90,\n    \"成長量\": 20,\n    \"疲勞增量\": 15,\n    \"壓力增量\": 2,\n    \"體力型\": true,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_10\": {\n    \"名稱\": \"職業素養研修・初階\",\n    \"能力\": \"專業素養\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 2000,\n    \"基礎成功率_pct\": 90,\n    \"成長量\": 20,\n    \"疲勞增量\": 4,\n    \"壓力增量\": 3,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"course_11\": {\n    \"名稱\": \"聲樂訓練・進階\",\n    \"能力\": \"歌唱\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 4000,\n    \"基礎成功率_pct\": 78,\n    \"成長量\": 30,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"歌唱\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_01\"\n  },\n  \"course_12\": {\n    \"名稱\": \"舞蹈訓練・進階\",\n    \"能力\": \"舞蹈\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 4000,\n    \"基礎成功率_pct\": 78,\n    \"成長量\": 30,\n    \"疲勞增量\": 14,\n    \"壓力增量\": 6,\n    \"體力型\": true,\n    \"前置能力門檻\": {\n      \"能力\": \"舞蹈\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_02\"\n  },\n  \"course_13\": {\n    \"名稱\": \"表演工作坊・進階\",\n    \"能力\": \"演技\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 4800,\n    \"基礎成功率_pct\": 73,\n    \"成長量\": 30,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"演技\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_03\"\n  },\n  \"course_14\": {\n    \"名稱\": \"舞台表現訓練・進階\",\n    \"能力\": \"舞台表現\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 4800,\n    \"基礎成功率_pct\": 73,\n    \"成長量\": 30,\n    \"疲勞增量\": 12,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"舞台表現\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_04\"\n  },\n  \"course_15\": {\n    \"名稱\": \"鏡頭感訓練・進階\",\n    \"能力\": \"鏡頭感\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 4800,\n    \"基礎成功率_pct\": 73,\n    \"成長量\": 30,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"鏡頭感\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_05\"\n  },\n  \"course_16\": {\n    \"名稱\": \"綜藝口才班・進階\",\n    \"能力\": \"綜藝口才\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 4000,\n    \"基礎成功率_pct\": 78,\n    \"成長量\": 30,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"綜藝口才\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_06\"\n  },\n  \"course_17\": {\n    \"名稱\": \"創作工作坊・進階\",\n    \"能力\": \"創作\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 4000,\n    \"基礎成功率_pct\": 78,\n    \"成長量\": 30,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"創作\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_07\"\n  },\n  \"course_18\": {\n    \"名稱\": \"形象管理諮詢・進階\",\n    \"能力\": \"形象管理\",\n    \"地點_id\": \"loc_shopping\",\n    \"費用每日\": 4000,\n    \"基礎成功率_pct\": 83,\n    \"成長量\": 30,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"形象管理\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_08\"\n  },\n  \"course_19\": {\n    \"名稱\": \"體能訓練・進階\",\n    \"能力\": \"體能\",\n    \"地點_id\": \"loc_gym\",\n    \"費用每日\": 3600,\n    \"基礎成功率_pct\": 83,\n    \"成長量\": 30,\n    \"疲勞增量\": 17,\n    \"壓力增量\": 4,\n    \"體力型\": true,\n    \"前置能力門檻\": {\n      \"能力\": \"體能\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_09\"\n  },\n  \"course_20\": {\n    \"名稱\": \"職業素養研修・進階\",\n    \"能力\": \"專業素養\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 4000,\n    \"基礎成功率_pct\": 83,\n    \"成長量\": 30,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"專業素養\",\n      \"門檻\": 400\n    },\n    \"解鎖條件_id\": \"unlock_adv_10\"\n  },\n  \"course_21\": {\n    \"名稱\": \"聲樂訓練・高階\",\n    \"能力\": \"歌唱\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 70,\n    \"成長量\": 40,\n    \"疲勞增量\": 12,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"歌唱\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_01\"\n  },\n  \"course_22\": {\n    \"名稱\": \"舞蹈訓練・高階\",\n    \"能力\": \"舞蹈\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 70,\n    \"成長量\": 40,\n    \"疲勞增量\": 16,\n    \"壓力增量\": 7,\n    \"體力型\": true,\n    \"前置能力門檻\": {\n      \"能力\": \"舞蹈\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_02\"\n  },\n  \"course_23\": {\n    \"名稱\": \"表演工作坊・高階\",\n    \"能力\": \"演技\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 7200,\n    \"基礎成功率_pct\": 65,\n    \"成長量\": 40,\n    \"疲勞增量\": 12,\n    \"壓力增量\": 9,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"演技\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_03\"\n  },\n  \"course_24\": {\n    \"名稱\": \"舞台表現訓練・高階\",\n    \"能力\": \"舞台表現\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 7200,\n    \"基礎成功率_pct\": 65,\n    \"成長量\": 40,\n    \"疲勞增量\": 14,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"舞台表現\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_04\"\n  },\n  \"course_25\": {\n    \"名稱\": \"鏡頭感訓練・高階\",\n    \"能力\": \"鏡頭感\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 7200,\n    \"基礎成功率_pct\": 65,\n    \"成長量\": 40,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"鏡頭感\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_05\"\n  },\n  \"course_26\": {\n    \"名稱\": \"綜藝口才班・高階\",\n    \"能力\": \"綜藝口才\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 70,\n    \"成長量\": 40,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"綜藝口才\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_06\"\n  },\n  \"course_27\": {\n    \"名稱\": \"創作工作坊・高階\",\n    \"能力\": \"創作\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 70,\n    \"成長量\": 40,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 9,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"創作\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_07\"\n  },\n  \"course_28\": {\n    \"名稱\": \"形象管理諮詢・高階\",\n    \"能力\": \"形象管理\",\n    \"地點_id\": \"loc_shopping\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 75,\n    \"成長量\": 40,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"形象管理\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_08\"\n  },\n  \"course_29\": {\n    \"名稱\": \"體能訓練・高階\",\n    \"能力\": \"體能\",\n    \"地點_id\": \"loc_gym\",\n    \"費用每日\": 5400,\n    \"基礎成功率_pct\": 75,\n    \"成長量\": 40,\n    \"疲勞增量\": 19,\n    \"壓力增量\": 5,\n    \"體力型\": true,\n    \"前置能力門檻\": {\n      \"能力\": \"體能\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_09\"\n  },\n  \"course_30\": {\n    \"名稱\": \"職業素養研修・高階\",\n    \"能力\": \"專業素養\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 75,\n    \"成長量\": 40,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": {\n      \"能力\": \"專業素養\",\n      \"門檻\": 700\n    },\n    \"解鎖條件_id\": \"unlock_hi_10\"\n  },\n  \"course_901\": {\n    \"名稱\": \"大師聲樂私教\",\n    \"能力\": \"歌唱\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 14000,\n    \"基礎成功率_pct\": 75,\n    \"成長量\": 60,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_vocal_master\"\n  },\n  \"course_902\": {\n    \"名稱\": \"金幕表演大師班\",\n    \"能力\": \"演技\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 15000,\n    \"基礎成功率_pct\": 72,\n    \"成長量\": 60,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_acting_master\"\n  },\n  \"course_903\": {\n    \"名稱\": \"王牌綜藝製作人講堂\",\n    \"能力\": \"綜藝口才\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 12000,\n    \"基礎成功率_pct\": 75,\n    \"成長量\": 55,\n    \"疲勞增量\": 9,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_variety_ace\"\n  },\n  \"course_904\": {\n    \"名稱\": \"頂級形象顧問私訓\",\n    \"能力\": \"形象管理\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 11000,\n    \"基礎成功率_pct\": 78,\n    \"成長量\": 50,\n    \"疲勞增量\": 7,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_charm_advanced\"\n  },\n  \"course_905\": {\n    \"名稱\": \"世界巡演編舞集訓\",\n    \"能力\": \"舞蹈\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 13000,\n    \"基礎成功率_pct\": 74,\n    \"成長量\": 55,\n    \"疲勞增量\": 16,\n    \"壓力增量\": 6,\n    \"體力型\": true,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_dance_advanced\"\n  },\n  \"course_906\": {\n    \"名稱\": \"名導鏡頭一對一\",\n    \"能力\": \"鏡頭感\",\n    \"地點_id\": \"loc_filmco\",\n    \"費用每日\": 14500,\n    \"基礎成功率_pct\": 73,\n    \"成長量\": 55,\n    \"疲勞增量\": 9,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_camera_director\"\n  },\n  \"course_907\": {\n    \"名稱\": \"危機公關實戰班\",\n    \"能力\": \"專業素養\",\n    \"地點_id\": \"loc_adco\",\n    \"費用每日\": 10000,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 45,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_pr_crisis\"\n  },\n  \"course_908\": {\n    \"名稱\": \"聲線復健療程\",\n    \"能力\": \"歌唱\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 3500,\n    \"基礎成功率_pct\": 88,\n    \"成長量\": 25,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 2,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_voice_rehab\"\n  },\n  \"course_909\": {\n    \"名稱\": \"雙人特訓（戀人陪練）\",\n    \"能力\": \"舞台表現\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 2800,\n    \"基礎成功率_pct\": 85,\n    \"成長量\": 35,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 2,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_partner_duo\"\n  },\n  \"course_911\": {\n    \"名稱\": \"暑期舞台特訓營\",\n    \"能力\": \"舞台表現\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 5600,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 40,\n    \"疲勞增量\": 12,\n    \"壓力增量\": 5,\n    \"體力型\": true,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_summer_stage\"\n  },\n  \"course_912\": {\n    \"名稱\": \"頒獎季衝刺班\",\n    \"能力\": \"專業素養\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 6200,\n    \"基礎成功率_pct\": 82,\n    \"成長量\": 40,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_award_rush\"\n  },\n  \"course_913\": {\n    \"名稱\": \"跨年公演集訓\",\n    \"能力\": \"舞台表現\",\n    \"地點_id\": \"loc_theater\",\n    \"費用每日\": 7000,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 45,\n    \"疲勞增量\": 14,\n    \"壓力增量\": 6,\n    \"體力型\": true,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_newyear_gala\"\n  },\n  \"course_914\": {\n    \"名稱\": \"春季新人選拔特訓\",\n    \"能力\": \"演技\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 5600,\n    \"基礎成功率_pct\": 82,\n    \"成長量\": 40,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_spring_audition\"\n  },\n  \"course_915\": {\n    \"名稱\": \"夏日音樂節集訓\",\n    \"能力\": \"歌唱\",\n    \"地點_id\": \"loc_studio\",\n    \"費用每日\": 6000,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 40,\n    \"疲勞增量\": 12,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_summer_music\"\n  },\n  \"course_916\": {\n    \"名稱\": \"秋冬時裝週造型特訓\",\n    \"能力\": \"形象管理\",\n    \"地點_id\": \"loc_shopping\",\n    \"費用每日\": 5600,\n    \"基礎成功率_pct\": 82,\n    \"成長量\": 40,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_fashion_week\"\n  },\n  \"course_917\": {\n    \"名稱\": \"年末創作閉關營\",\n    \"能力\": \"創作\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 5000,\n    \"基礎成功率_pct\": 85,\n    \"成長量\": 40,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_year_end_writing\"\n  },\n  \"course_918\": {\n    \"名稱\": \"開年綜藝新棚特訓\",\n    \"能力\": \"綜藝口才\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 5600,\n    \"基礎成功率_pct\": 82,\n    \"成長量\": 40,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_newyear_variety\"\n  },\n  \"course_919\": {\n    \"名稱\": \"梅雨季鏡頭工作坊\",\n    \"能力\": \"鏡頭感\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 5200,\n    \"基礎成功率_pct\": 83,\n    \"成長量\": 40,\n    \"疲勞增量\": 7,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_rainy_camera\"\n  },\n  \"course_921\": {\n    \"名稱\": \"金曲製作人閉關工作坊\",\n    \"能力\": \"創作\",\n    \"地點_id\": \"loc_cafe\",\n    \"費用每日\": 12500,\n    \"基礎成功率_pct\": 76,\n    \"成長量\": 55,\n    \"疲勞增量\": 6,\n    \"壓力增量\": 9,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_creator_master\"\n  },\n  \"course_922\": {\n    \"名稱\": \"動作特技集訓\",\n    \"能力\": \"體能\",\n    \"地點_id\": \"loc_gym\",\n    \"費用每日\": 10500,\n    \"基礎成功率_pct\": 74,\n    \"成長量\": 55,\n    \"疲勞增量\": 18,\n    \"壓力增量\": 5,\n    \"體力型\": true,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_stunt_camp\"\n  },\n  \"course_923\": {\n    \"名稱\": \"深夜電台主持實習\",\n    \"能力\": \"綜藝口才\",\n    \"地點_id\": \"loc_tv_station\",\n    \"費用每日\": 8500,\n    \"基礎成功率_pct\": 80,\n    \"成長量\": 45,\n    \"疲勞增量\": 8,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_radio_night\"\n  },\n  \"course_924\": {\n    \"名稱\": \"國際合拍表演營\",\n    \"能力\": \"演技\",\n    \"地點_id\": \"loc_filmco\",\n    \"費用每日\": 14500,\n    \"基礎成功率_pct\": 72,\n    \"成長量\": 55,\n    \"疲勞增量\": 10,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"前置能力門檻\": null,\n    \"解鎖條件_id\": \"unlock_intl_acting\"\n  }\n};\n\n  // PROMS 目錄由構建自 來源/data/promos.json 注入（作者側 世界書-實例/宣傳企劃世界書.md 同步維護）\n  var PROMS = {\n  \"promo_01\": { \"基礎成功率\": 90, \"名稱\": \"網路曝光企劃\", \"費用每日\": 8000, \"效果\": { \"知名度\": 3, \"熱度\": 2 }, \"疲勞增量\": 4, \"壓力增量\": 3 },\n  \"promo_02\": { \"基礎成功率\": 90, \"名稱\": \"粉絲互動活動\", \"費用每日\": 12000, \"效果\": { \"粉絲數\": 500, \"熱度\": 1 }, \"疲勞增量\": 4, \"壓力增量\": 3 },\n  \"promo_03\": { \"基礎成功率\": 90, \"名稱\": \"公關形象維護\", \"費用每日\": 10000, \"效果\": { \"公眾評價\": 2, \"爭議熱度\": -2 }, \"疲勞增量\": 4, \"壓力增量\": 3 },\n  \"promo_04\": { \"基礎成功率\": 90, \"名稱\": \"媒體專訪企劃\", \"費用每日\": 15000, \"效果\": { \"知名度\": 4, \"公眾評價\": 1 }, \"疲勞增量\": 5, \"壓力增量\": 4 },\n  \"promo_05\": { \"基礎成功率\": 90, \"名稱\": \"話題行銷企劃\", \"費用每日\": 6000, \"效果\": { \"熱度\": 4, \"爭議熱度\": 1 }, \"疲勞增量\": 5, \"壓力增量\": 5 },\n  \"promo_06\": { \"基礎成功率\": 85, \"名稱\": \"專題企劃\", \"費用每日\": 18000, \"效果\": { \"知名度\": 5, \"熱度\": 3, \"公眾評價\": 1 }, \"疲勞增量\": 5, \"壓力增量\": 4, \"企劃門檻\": 35 },\n  \"promo_07\": { \"基礎成功率\": 80, \"名稱\": \"大型跨界企劃\", \"費用每日\": 30000, \"效果\": { \"知名度\": 8, \"熱度\": 5, \"粉絲數\": 800 }, \"疲勞增量\": 6, \"壓力增量\": 5, \"企劃門檻\": 40 }\n};\n\n  // GIGS 目錄由構建自 來源/data/gigs.json 注入（作者側 世界書-實例/打工世界書.md 同步維護）\n  var GIGS = {\n  \"gig_01\": {\n    \"名稱\": \"臨時演員（群演）\",\n    \"日結報酬\": 1800,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"演技\",\n    \"疲勞增量\": 10,\n    \"壓力增量\": 3,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_02\": {\n    \"名稱\": \"伴舞\",\n    \"日結報酬\": 2200,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"舞蹈\",\n    \"疲勞增量\": 12,\n    \"壓力增量\": 3,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_03\": {\n    \"名稱\": \"商演站台（活動出席）\",\n    \"日結報酬\": 3000,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"舞台表現\",\n    \"疲勞增量\": 8,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_04\": {\n    \"名稱\": \"平面拍攝（網拍／型錄）\",\n    \"日結報酬\": 2500,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"鏡頭感\",\n    \"疲勞增量\": 6,\n    \"壓力增量\": 3,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_05\": {\n    \"名稱\": \"活動主持助理\",\n    \"日結報酬\": 2800,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"綜藝口才\",\n    \"疲勞增量\": 8,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_06\": {\n    \"名稱\": \"錄音室和聲\",\n    \"日結報酬\": 2600,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"歌唱\",\n    \"疲勞增量\": 6,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_07\": {\n    \"名稱\": \"夜場駐唱\",\n    \"日結報酬\": 4000,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"歌唱\",\n    \"疲勞增量\": 10,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"副作用\": {\n      \"爭議熱度\": 2\n    },\n    \"道德變化\": -1,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_08\": {\n    \"名稱\": \"執事咖啡廳服務生\",\n    \"日結報酬\": 3600,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"綜藝口才\",\n    \"疲勞增量\": 10,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"副作用\": {\n      \"爭議熱度\": 1\n    },\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_08\"\n  },\n  \"gig_09\": {\n    \"名稱\": \"有台詞的特約演員\",\n    \"日結報酬\": 3500,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"演技\",\n    \"疲勞增量\": 12,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_09\"\n  },\n  \"gig_10\": {\n    \"名稱\": \"大秀走秀模特兒\",\n    \"日結報酬\": 5200,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"舞台表現\",\n    \"疲勞增量\": 12,\n    \"壓力增量\": 5,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_10\"\n  },\n  \"gig_11\": {\n    \"名稱\": \"電視購物台主持\",\n    \"日結報酬\": 5000,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"綜藝口才\",\n    \"疲勞增量\": 9,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_11\"\n  },\n  \"gig_12\": {\n    \"名稱\": \"專輯配唱\",\n    \"日結報酬\": 4800,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"歌唱\",\n    \"疲勞增量\": 7,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_12\"\n  },\n  \"gig_13\": {\n    \"名稱\": \"編舞助理\",\n    \"日結報酬\": 4500,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"舞蹈\",\n    \"疲勞增量\": 14,\n    \"壓力增量\": 4,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_13\"\n  },\n  \"gig_14\": {\n    \"名稱\": \"品牌平面代言\",\n    \"日結報酬\": 4600,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"鏡頭感\",\n    \"疲勞增量\": 7,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_14\"\n  },\n  \"gig_15\": {\n    \"名稱\": \"廣播電台嘉賓\",\n    \"日結報酬\": 3200,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"綜藝口才\",\n    \"疲勞增量\": 6,\n    \"壓力增量\": 3,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_radio\"\n  },\n  \"gig_16\": {\n    \"名稱\": \"粉絲見面會助陣\",\n    \"日結報酬\": 4200,\n    \"基礎成功率\": 82,\n    \"成長能力\": \"舞台表現\",\n    \"疲勞增量\": 10,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_fanmeet\"\n  },\n  \"gig_17\": {\n    \"名稱\": \"電競賽事開場表演\",\n    \"日結報酬\": 4400,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"舞台表現\",\n    \"疲勞增量\": 12,\n    \"壓力增量\": 5,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_esports\"\n  },\n  \"gig_18\": {\n    \"名稱\": \"跨年倒數晚會演出\",\n    \"日結報酬\": 6000,\n    \"基礎成功率\": 78,\n    \"成長能力\": \"舞台表現\",\n    \"疲勞增量\": 14,\n    \"壓力增量\": 6,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_nye\"\n  },\n  \"gig_19\": {\n    \"名稱\": \"酒局應酬陪席\",\n    \"日結報酬\": 5500,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"綜藝口才\",\n    \"疲勞增量\": 11,\n    \"壓力增量\": 8,\n    \"體力型\": false,\n    \"副作用\": { \"爭議熱度\": 3 },\n    \"道德變化\": -2,\n    \"解鎖條件_id\": \"unlock_gig_banquet\"\n  },\n  \"gig_20\": {\n    \"名稱\": \"幕後歌詞代寫\",\n    \"日結報酬\": 2800,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"創作\",\n    \"疲勞增量\": 5,\n    \"壓力增量\": 6,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_21\": {\n    \"名稱\": \"動作戲替身\",\n    \"日結報酬\": 3800,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"體能\",\n    \"疲勞增量\": 16,\n    \"壓力增量\": 4,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_22\": {\n    \"名稱\": \"服裝品牌試裝模特\",\n    \"日結報酬\": 3200,\n    \"基礎成功率\": 85,\n    \"成長能力\": \"形象管理\",\n    \"疲勞增量\": 7,\n    \"壓力增量\": 3,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_23\": {\n    \"名稱\": \"影展活動場務\",\n    \"日結報酬\": 2400,\n    \"基礎成功率\": 88,\n    \"成長能力\": \"專業素養\",\n    \"疲勞增量\": 9,\n    \"壓力增量\": 3,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_always\"\n  },\n  \"gig_24\": {\n    \"名稱\": \"編曲外包急件\",\n    \"日結報酬\": 4500,\n    \"基礎成功率\": 78,\n    \"成長能力\": \"創作\",\n    \"疲勞增量\": 6,\n    \"壓力增量\": 7,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_arrange\"\n  },\n  \"gig_25\": {\n    \"名稱\": \"特技隊動作指導助理\",\n    \"日結報酬\": 5600,\n    \"基礎成功率\": 75,\n    \"成長能力\": \"體能\",\n    \"疲勞增量\": 18,\n    \"壓力增量\": 6,\n    \"體力型\": true,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_stuntlead\"\n  },\n  \"gig_26\": {\n    \"名稱\": \"高訂秀場試裝顧問\",\n    \"日結報酬\": 5000,\n    \"基礎成功率\": 80,\n    \"成長能力\": \"形象管理\",\n    \"疲勞增量\": 8,\n    \"壓力增量\": 4,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_fitting\"\n  },\n  \"gig_27\": {\n    \"名稱\": \"頒獎季紅毯接待\",\n    \"日結報酬\": 4200,\n    \"基礎成功率\": 82,\n    \"成長能力\": \"專業素養\",\n    \"疲勞增量\": 9,\n    \"壓力增量\": 5,\n    \"體力型\": false,\n    \"副作用\": null,\n    \"道德變化\": 0,\n    \"解鎖條件_id\": \"unlock_gig_redcarpet\"\n  }\n};\n\n  // AWARDS 註冊表由構建自 來源/data/awards.json 注入（與「核心規則-年度頒獎」日曆同步維護）\n  var AWARDS = [\n  { \"id\": \"award_music\", \"name\": \"金弦獎\", \"領域\": \"音樂\", \"提名日\": \"04-01\", \"頒獎日\": \"04-15\" },\n  { \"id\": \"award_tv\", \"name\": \"金屏獎\", \"領域\": \"電視\", \"提名日\": \"08-01\", \"頒獎日\": \"08-15\" },\n  { \"id\": \"award_film\", \"name\": \"金幕獎\", \"領域\": \"電影\", \"提名日\": \"12-01\", \"頒獎日\": \"12-15\" }\n];\n\n  // 休整配置目錄由構建自 來源/data/rests.json 注入（作者側 世界書-實例/休整世界書.md 同步維護）\n  var RESTS = {\n  \"rest_home\": { \"名稱\": \"在家休息\", \"連排天數\": 1, \"一次性費用\": 0, \"每日效果\": { \"疲勞\": -25, \"壓力\": -8 }, \"全程完成獎勵\": null },\n  \"rest_onsen\": { \"名稱\": \"溫泉小旅行\", \"連排天數\": 3, \"一次性費用\": 12000, \"每日效果\": { \"疲勞\": -40, \"壓力\": -15 }, \"全程完成獎勵\": { \"疲勞\": 0, \"壓力\": -10 } },\n  \"rest_trip\": { \"名稱\": \"海外旅遊\", \"連排天數\": 5, \"一次性費用\": 30000, \"每日效果\": { \"疲勞\": -50, \"壓力\": -20 }, \"全程完成獎勵\": { \"疲勞\": -10, \"壓力\": -15 } }\n};\n\n  // 課程解鎖檔由構建自 來源/data/course_unlocks.json 注入（作者側 世界書-實例/課程世界書.md 同步維護）\n  var UNLOCKS = {\n  \"unlock_always\": {\n    \"說明\": \"無條件解鎖\",\n    \"條件\": {\n      \"類型\": \"always\"\n    }\n  },\n  \"unlock_vocal_master\": {\n    \"說明\": \"大師聲樂私教：歌唱≥600\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"歌唱\",\n      \"門檻\": 600\n    }\n  },\n  \"unlock_acting_master\": {\n    \"說明\": \"金幕表演大師班：演技≥600\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"演技\",\n      \"門檻\": 600\n    }\n  },\n  \"unlock_summer_stage\": {\n    \"說明\": \"暑期舞台特訓營：7/1～8/31 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"07-01\",\n      \"結束月日\": \"08-31\"\n    }\n  },\n  \"unlock_award_rush\": {\n    \"說明\": \"頒獎季衝刺班：11/1～12/31 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"11-01\",\n      \"結束月日\": \"12-31\"\n    }\n  },\n  \"unlock_charm_advanced\": {\n    \"說明\": \"頂級形象顧問私訓：形象管理≥400 且 已修形象管理諮詢・初階\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"形象管理\",\n          \"門檻\": 400\n        },\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_08\"\n        }\n      ]\n    }\n  },\n  \"unlock_dance_advanced\": {\n    \"說明\": \"巡演編舞集訓：舞蹈≥400 且 已修舞蹈訓練・初階\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"舞蹈\",\n          \"門檻\": 400\n        },\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_02\"\n        }\n      ]\n    }\n  },\n  \"unlock_adv_01\": {\n    \"說明\": \"歌唱・進階：修過聲樂訓練・初階且歌唱≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_01\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"歌唱\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_01\": {\n    \"說明\": \"歌唱・高階：修過聲樂訓練・進階且歌唱≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_11\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"歌唱\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_02\": {\n    \"說明\": \"舞蹈・進階：修過舞蹈訓練・初階且舞蹈≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_02\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"舞蹈\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_02\": {\n    \"說明\": \"舞蹈・高階：修過舞蹈訓練・進階且舞蹈≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_12\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"舞蹈\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_03\": {\n    \"說明\": \"演技・進階：修過表演工作坊・初階且演技≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_03\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"演技\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_03\": {\n    \"說明\": \"演技・高階：修過表演工作坊・進階且演技≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_13\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"演技\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_04\": {\n    \"說明\": \"舞台表現・進階：修過舞台表現訓練・初階且舞台表現≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_04\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"舞台表現\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_04\": {\n    \"說明\": \"舞台表現・高階：修過舞台表現訓練・進階且舞台表現≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_14\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"舞台表現\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_05\": {\n    \"說明\": \"鏡頭感・進階：修過鏡頭感訓練・初階且鏡頭感≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_05\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"鏡頭感\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_05\": {\n    \"說明\": \"鏡頭感・高階：修過鏡頭感訓練・進階且鏡頭感≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_15\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"鏡頭感\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_06\": {\n    \"說明\": \"綜藝口才・進階：修過綜藝口才班・初階且綜藝口才≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_06\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"綜藝口才\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_06\": {\n    \"說明\": \"綜藝口才・高階：修過綜藝口才班・進階且綜藝口才≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_16\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"綜藝口才\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_07\": {\n    \"說明\": \"創作・進階：修過創作工作坊・初階且創作≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_07\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"創作\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_07\": {\n    \"說明\": \"創作・高階：修過創作工作坊・進階且創作≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_17\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"創作\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_08\": {\n    \"說明\": \"形象管理・進階：修過形象管理諮詢・初階且形象管理≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_08\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"形象管理\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_08\": {\n    \"說明\": \"形象管理・高階：修過形象管理諮詢・進階且形象管理≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_18\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"形象管理\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_09\": {\n    \"說明\": \"體能・進階：修過體能訓練・初階且體能≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_09\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"體能\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_09\": {\n    \"說明\": \"體能・高階：修過體能訓練・進階且體能≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_19\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"體能\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_adv_10\": {\n    \"說明\": \"專業素養・進階：修過職業素養研修・初階且專業素養≥300\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_10\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"專業素養\",\n          \"門檻\": 300\n        }\n      ]\n    }\n  },\n  \"unlock_hi_10\": {\n    \"說明\": \"專業素養・高階：修過職業素養研修・進階且專業素養≥600\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_20\"\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"專業素養\",\n          \"門檻\": 600\n        }\n      ]\n    }\n  },\n  \"unlock_variety_ace\": {\n    \"說明\": \"王牌綜藝製作人講堂：知名度≥40 且 綜藝口才≥500\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"fame_min\",\n          \"門檻\": 40\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"綜藝口才\",\n          \"門檻\": 500\n        }\n      ]\n    }\n  },\n  \"unlock_camera_director\": {\n    \"說明\": \"名導鏡頭一對一：粉絲數≥50000 且 鏡頭感≥500\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"fans_min\",\n          \"門檻\": 50000\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"鏡頭感\",\n          \"門檻\": 500\n        }\n      ]\n    }\n  },\n  \"unlock_pr_crisis\": {\n    \"說明\": \"危機公關實戰班：公司資金≥300000 且 專業素養≥400\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"company_funds_min\",\n          \"門檻\": 300000\n        },\n        {\n          \"類型\": \"ability_min\",\n          \"能力\": \"專業素養\",\n          \"門檻\": 400\n        }\n      ]\n    }\n  },\n  \"unlock_voice_rehab\": {\n    \"說明\": \"聲線復健療程：修過聲樂初階且歌唱≤350（低能力補救課）\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        {\n          \"類型\": \"course_unlocked\",\n          \"course_id\": \"course_01\"\n        },\n        {\n          \"類型\": \"ability_max\",\n          \"能力\": \"歌唱\",\n          \"門檻\": 350\n        }\n      ]\n    }\n  },\n  \"unlock_partner_duo\": {\n    \"說明\": \"雙人特訓（戀人陪練）：該偶像對玩家好感度≥60\",\n    \"條件\": {\n      \"類型\": \"affinity_min\",\n      \"對象路徑\": \"與玩家戀愛.<idol_id>.戀愛數值.好感度\",\n      \"門檻\": 60\n    }\n  },\n  \"unlock_newyear_gala\": {\n    \"說明\": \"跨年公演集訓：12/15～1/5 限時（跨年窗口）\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"12-15\",\n      \"結束月日\": \"01-05\"\n    }\n  },\n  \"unlock_spring_audition\": {\n    \"說明\": \"春季新人選拔特訓：3/1～3/31 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"03-01\",\n      \"結束月日\": \"03-31\"\n    }\n  },\n  \"unlock_creator_master\": {\n    \"說明\": \"金曲製作人閉關工作坊：創作≥500 且 已修創作工作坊・初階\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        { \"類型\": \"ability_min\", \"能力\": \"創作\", \"門檻\": 500 },\n        { \"類型\": \"course_unlocked\", \"course_id\": \"course_07\" }\n      ]\n    }\n  },\n  \"unlock_stunt_camp\": {\n    \"說明\": \"動作特技集訓：體能≥450 且 已修體能訓練・初階\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        { \"類型\": \"ability_min\", \"能力\": \"體能\", \"門檻\": 450 },\n        { \"類型\": \"course_unlocked\", \"course_id\": \"course_09\" }\n      ]\n    }\n  },\n  \"unlock_radio_night\": {\n    \"說明\": \"深夜電台主持實習：知名度≥30 且 綜藝口才≥450\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        { \"類型\": \"fame_min\", \"門檻\": 30 },\n        { \"類型\": \"ability_min\", \"能力\": \"綜藝口才\", \"門檻\": 450 }\n      ]\n    }\n  },\n  \"unlock_intl_acting\": {\n    \"說明\": \"國際合拍表演營：粉絲數≥80000 且 演技≥550\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        { \"類型\": \"fans_min\", \"門檻\": 80000 },\n        { \"類型\": \"ability_min\", \"能力\": \"演技\", \"門檻\": 550 }\n      ]\n    }\n  },\n  \"unlock_summer_music\": {\n    \"說明\": \"夏日音樂節集訓：6/15～7/31 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"06-15\",\n      \"結束月日\": \"07-31\"\n    }\n  },\n  \"unlock_fashion_week\": {\n    \"說明\": \"秋冬時裝週造型特訓：9/1～10/15 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"09-01\",\n      \"結束月日\": \"10-15\"\n    }\n  },\n  \"unlock_year_end_writing\": {\n    \"說明\": \"年末創作閉關營：12/1～12/31 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"12-01\",\n      \"結束月日\": \"12-31\"\n    }\n  },\n  \"unlock_newyear_variety\": {\n    \"說明\": \"開年綜藝新棚特訓：12/26～1/31 限時（跨年窗口）\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"12-26\",\n      \"結束月日\": \"01-31\"\n    }\n  },\n  \"unlock_rainy_camera\": {\n    \"說明\": \"梅雨季鏡頭工作坊：5/1～6/15 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"05-01\",\n      \"結束月日\": \"06-15\"\n    }\n  }\n};\n\n  // 打工解鎖檔由構建自 來源/data/gig_unlocks.json 注入（v0.41；作者側 世界書-實例/打工世界書.md 同步維護）\n  var GIG_UNLOCKS = {\n  \"unlock_always\": {\n    \"說明\": \"無條件解鎖\",\n    \"條件\": {\n      \"類型\": \"always\"\n    }\n  },\n  \"unlock_gig_08\": {\n    \"說明\": \"執事咖啡廳服務生：形象管理≥300\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"形象管理\",\n      \"門檻\": 300\n    }\n  },\n  \"unlock_gig_09\": {\n    \"說明\": \"有台詞的特約演員：演技≥400\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"演技\",\n      \"門檻\": 400\n    }\n  },\n  \"unlock_gig_10\": {\n    \"說明\": \"大秀走秀模特兒：形象管理≥500\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"形象管理\",\n      \"門檻\": 500\n    }\n  },\n  \"unlock_gig_11\": {\n    \"說明\": \"電視購物台主持：綜藝口才≥500\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"綜藝口才\",\n      \"門檻\": 500\n    }\n  },\n  \"unlock_gig_12\": {\n    \"說明\": \"專輯配唱：歌唱≥500\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"歌唱\",\n      \"門檻\": 500\n    }\n  },\n  \"unlock_gig_13\": {\n    \"說明\": \"編舞助理：舞蹈≥500\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"舞蹈\",\n      \"門檻\": 500\n    }\n  },\n  \"unlock_gig_14\": {\n    \"說明\": \"品牌平面代言：鏡頭感≥400\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"鏡頭感\",\n      \"門檻\": 400\n    }\n  },\n  \"unlock_gig_radio\": {\n    \"說明\": \"廣播電台嘉賓：知名度≥25\",\n    \"條件\": {\n      \"類型\": \"fame_min\",\n      \"門檻\": 25\n    }\n  },\n  \"unlock_gig_fanmeet\": {\n    \"說明\": \"粉絲見面會助陣：粉絲數≥20000\",\n    \"條件\": {\n      \"類型\": \"fans_min\",\n      \"門檻\": 20000\n    }\n  },\n  \"unlock_gig_esports\": {\n    \"說明\": \"電競賽事開場表演：舞台表現≥450 且 已修舞台表現訓練・初階\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        { \"類型\": \"ability_min\", \"能力\": \"舞台表現\", \"門檻\": 450 },\n        { \"類型\": \"course_unlocked\", \"course_id\": \"course_04\" }\n      ]\n    }\n  },\n  \"unlock_gig_nye\": {\n    \"說明\": \"跨年倒數晚會演出：12/25～1/2 限時（跨年窗口）\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"12-25\",\n      \"結束月日\": \"01-02\"\n    }\n  },\n  \"unlock_gig_banquet\": {\n    \"說明\": \"酒局應酬陪席：綜藝口才≥350 且 公司資金＜100000（週轉不靈才會接的灰色外快）\",\n    \"條件\": {\n      \"類型\": \"and\",\n      \"子條件\": [\n        { \"類型\": \"ability_min\", \"能力\": \"綜藝口才\", \"門檻\": 350 },\n        { \"類型\": \"company_funds_max\", \"門檻\": 100000 }\n      ]\n    }\n  },\n  \"unlock_gig_arrange\": {\n    \"說明\": \"編曲外包急件：創作≥450\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"創作\",\n      \"門檻\": 450\n    }\n  },\n  \"unlock_gig_stuntlead\": {\n    \"說明\": \"特技隊動作指導助理：體能≥500\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"體能\",\n      \"門檻\": 500\n    }\n  },\n  \"unlock_gig_fitting\": {\n    \"說明\": \"高訂秀場試裝顧問：形象管理≥450\",\n    \"條件\": {\n      \"類型\": \"ability_min\",\n      \"能力\": \"形象管理\",\n      \"門檻\": 450\n    }\n  },\n  \"unlock_gig_redcarpet\": {\n    \"說明\": \"頒獎季紅毯接待：11/1～12/31 限時\",\n    \"條件\": {\n      \"類型\": \"date_range\",\n      \"起始月日\": \"11-01\",\n      \"結束月日\": \"12-31\"\n    }\n  }\n};\n\n  // 成就註冊表由構建自 來源/data/achievements.json 注入（作者側 世界書-實例/稱號與成就世界書.md §15–§16 同步維護）\n  var ACHIEVEMENTS = {\n  \"achievement.idol.first_work\": {\n    \"名稱\": \"初啼之聲\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"生涯\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.任一領域.完成作品數\", \"運算\": \"大於等於\", \"目標值\": 1 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.career_10\": {\n    \"名稱\": \"十全十美\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"生涯\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.三領域.完成作品數合計\", \"運算\": \"大於等於\", \"目標值\": 10 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.career_50\": {\n    \"名稱\": \"百煉成鋼\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"生涯\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.三領域.完成作品數合計\", \"運算\": \"大於等於\", \"目標值\": 50 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.fans_million\": {\n    \"名稱\": \"百萬粉絲\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"人氣\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"偶像狀態\", \"路徑\": \"偶像.<idol_id>.公眾反響.粉絲數\", \"運算\": \"大於等於\", \"目標值\": 1000000 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [ { \"reward_id\": \"cash_200k\", \"類型\": \"一次性資金\", \"數值\": 200000 } ],\n    \"啟用\": true\n  },\n  \"achievement.idol.grand_slam\": {\n    \"名稱\": \"大滿貫\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"獎項\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"獎項結算\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.歌.最高獎項級別\", \"運算\": \"等於\", \"目標值\": \"專業獎\" },\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.影.最高獎項級別\", \"運算\": \"等於\", \"目標值\": \"專業獎\" },\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.視.最高獎項級別\", \"運算\": \"等於\", \"目標值\": \"專業獎\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.first_date\": {\n    \"名稱\": \"初次約會\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"關係\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"關係節點完成\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.重要節點\", \"運算\": \"包含\", \"目標值\": \"初次約會\" }\n      ]\n    },\n    \"追溯策略\": \"禁止\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.wedding\": {\n    \"名稱\": \"白首之約\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"關係\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"關係節點完成\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.重要節點\", \"運算\": \"包含\", \"目標值\": \"結婚\" }\n      ]\n    },\n    \"追溯策略\": \"禁止\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.longterm\": {\n    \"名稱\": \"長期專一\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"關係\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"關係節點完成\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.關係狀態\", \"運算\": \"包含\", \"目標值\": \"交往中|訂婚|已婚\" },\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.重要節點.交往確認.日期\", \"運算\": \"存在\", \"目標值\": null },\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.重要節點.交往確認.日期\", \"運算\": \"日期差月數 大於等於\", \"目標值\": 6 },\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.戀愛數值.承諾度\", \"運算\": \"大於等於\", \"目標值\": 80 }\n      ]\n    },\n    \"追溯策略\": \"禁止\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.egg_hunter\": {\n    \"名稱\": \"彩蛋收藏家\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"收集\",\n    \"等級標籤\": null,\n    \"可見性\": \"隱藏\",\n    \"可展示\": false,\n    \"檢查點\": [\"稀有彩蛋收束\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.彩蛋段.special_career_legend_collab\", \"運算\": \"等於\", \"目標值\": \"抽中\" },\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.彩蛋段.special_career_intl_stage\", \"運算\": \"等於\", \"目標值\": \"抽中\" },\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.彩蛋段.special_collab_dream_co\", \"運算\": \"等於\", \"目標值\": \"抽中\" },\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.彩蛋段.special_swan_copyright\", \"運算\": \"等於\", \"目標值\": \"抽中\" },\n        { \"來源\": \"職涯統計\", \"路徑\": \"<idol_id>.彩蛋段.special_swan_brand_scandal\", \"運算\": \"等於\", \"目標值\": \"抽中\" },\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.重要節點.未發表的歌\", \"運算\": \"存在\", \"目標值\": null },\n        { \"來源\": \"關係狀態\", \"路徑\": \"與玩家戀愛.<idol_id>.重要節點.婚訊公開\", \"運算\": \"存在\", \"目標值\": null }\n      ]\n    },\n    \"追溯策略\": \"禁止\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.tag_first_抒情\": {\n    \"名稱\": \"抒情首作\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"作品標籤\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"當次結算\", \"路徑\": \"當次結算.作品tag\", \"運算\": \"包含\", \"目標值\": \"抒情\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.tag_first_偶像劇\": {\n    \"名稱\": \"偶像劇初體驗\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"作品標籤\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"當次結算\", \"路徑\": \"當次結算.作品tag\", \"運算\": \"包含\", \"目標值\": \"偶像劇\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.tag_first_古裝\": {\n    \"名稱\": \"古裝初登場\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"作品標籤\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"當次結算\", \"路徑\": \"當次結算.作品tag\", \"運算\": \"包含\", \"目標值\": \"古裝\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.tag_first_競技綜藝\": {\n    \"名稱\": \"競技首秀\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"作品標籤\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"當次結算\", \"路徑\": \"當次結算.作品tag\", \"運算\": \"包含\", \"目標值\": \"競技綜藝\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.idol.tag_multi_4\": {\n    \"名稱\": \"四面開花\",\n    \"作用域\": \"偶像\",\n    \"分組\": \"作品標籤\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"作品市場定案\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"代表作封存\", \"路徑\": \"代表作封存.<work_id>.作品tag\", \"運算\": \"包含\", \"目標值\": \"抒情\" },\n        { \"來源\": \"代表作封存\", \"路徑\": \"代表作封存.<work_id>.作品tag\", \"運算\": \"包含\", \"目標值\": \"偶像劇\" },\n        { \"來源\": \"代表作封存\", \"路徑\": \"代表作封存.<work_id>.作品tag\", \"運算\": \"包含\", \"目標值\": \"古裝\" },\n        { \"來源\": \"代表作封存\", \"路徑\": \"代表作封存.<work_id>.作品tag\", \"運算\": \"包含\", \"目標值\": \"競技綜藝\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.company.full_roster\": {\n    \"名稱\": \"滿編出道\",\n    \"作用域\": \"公司\",\n    \"分組\": \"經營\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"公司月結\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"公司狀態\", \"路徑\": \"公司.company_player.有效藝人合約.筆數\", \"運算\": \"大於等於\", \"目標值\": 4 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.company.credit_80\": {\n    \"名稱\": \"業界信譽榜\",\n    \"作用域\": \"公司\",\n    \"分組\": \"經營\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"公司月結\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"公司狀態\", \"路徑\": \"公司.company_player.公司信譽派生值\", \"運算\": \"大於等於\", \"目標值\": 80 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [ { \"reward_id\": \"cap_plus1\", \"類型\": \"簽約容量\", \"數值\": 1 } ],\n    \"啟用\": true\n  },\n  \"achievement.company.collab_20\": {\n    \"名稱\": \"合作夥伴\",\n    \"作用域\": \"公司\",\n    \"分組\": \"經營\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"公司月結\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"公司狀態\", \"路徑\": \"公司.company_player.信譽統計.合作評分次數\", \"運算\": \"大於等於\", \"目標值\": 20 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.company.month_500k\": {\n    \"名稱\": \"月入金榜\",\n    \"作用域\": \"公司\",\n    \"分組\": \"經營\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"公司月結\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"公司狀態\", \"路徑\": \"公司.company_player.本月收支.通告收入\", \"運算\": \"大於等於\", \"目標值\": 500000 }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [ { \"reward_id\": \"cash_100k\", \"類型\": \"一次性資金\", \"數值\": 100000 } ],\n    \"啟用\": true\n  },\n  \"achievement.global.end_empire\": {\n    \"名稱\": \"娛樂帝國\",\n    \"作用域\": \"全局\",\n    \"分組\": \"結局\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"主線結局結算\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"主綫狀態\", \"路徑\": \"主綫.結局_id\", \"運算\": \"等於\", \"目標值\": \"end_empire\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.global.end_love\": {\n    \"名稱\": \"執子之手\",\n    \"作用域\": \"全局\",\n    \"分組\": \"結局\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"主線結局結算\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"主綫狀態\", \"路徑\": \"主綫.結局_id\", \"運算\": \"等於\", \"目標值\": \"end_love\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  },\n  \"achievement.global.observe_five\": {\n    \"名稱\": \"星光五年\",\n    \"作用域\": \"全局\",\n    \"分組\": \"結局\",\n    \"等級標籤\": null,\n    \"可見性\": \"公開\",\n    \"可展示\": false,\n    \"檢查點\": [\"主線結局結算\"],\n    \"前置條目_ids\": [],\n    \"條件\": {\n      \"模式\": \"全部\",\n      \"項目\": [\n        { \"來源\": \"主綫狀態\", \"路徑\": \"主綫.狀態\", \"運算\": \"等於\", \"目標值\": \"已結局\" }\n      ]\n    },\n    \"追溯策略\": \"允許\",\n    \"獎勵\": [],\n    \"啟用\": true\n  }\n};\n\n  // 任務註冊表由構建自 來源/data/tasks.json 注入（作者側 世界書-實例/任務世界書.md §13–§14 同步維護）\n  var TASKS = {\n  \"quest.main.debut\": {\n    \"類型\": \"主線\",\n    \"顯示名稱\": \"破殼而出\",\n    \"簡介\": \"簽下首位偶像，帶他完成首次作品推出、正式出道。\",\n    \"前置任務_ids\": [],\n    \"目標列表\": [\n      { \"來源\": \"偶像狀態\", \"路徑\": \"任一旗下偶像.公開身份.事業狀態\", \"運算\": \"等於\", \"目標值\": \"已出道\" }\n    ],\n    \"獎勵\": [],\n    \"可見性\": \"公開\",\n    \"檢查點\": [\"首作推出\"],\n    \"啟用\": true\n  },\n  \"quest.main.first_work\": {\n    \"類型\": \"主線\",\n    \"顯示名稱\": \"初試啼聲\",\n    \"簡介\": \"旗下偶像的首份作品完成市場定案。\",\n    \"前置任務_ids\": [\"quest.main.debut\"],\n    \"目標列表\": [\n      { \"來源\": \"職涯統計\", \"路徑\": \"任一旗下偶像.三領域.完成作品數合計\", \"運算\": \"大於等於\", \"目標值\": 1 }\n    ],\n    \"獎勵\": [],\n    \"可見性\": \"公開\",\n    \"檢查點\": [\"作品市場定案\"],\n    \"啟用\": true\n  },\n  \"quest.main.first_grade_a\": {\n    \"類型\": \"主線\",\n    \"顯示名稱\": \"品質保證\",\n    \"簡介\": \"做出第一部品質 A 級以上的作品。\",\n    \"前置任務_ids\": [\"quest.main.first_work\"],\n    \"目標列表\": [\n      { \"來源\": \"職涯統計\", \"路徑\": \"任一旗下偶像.任一領域.品質A以上數\", \"運算\": \"大於等於\", \"目標值\": 1 }\n    ],\n    \"獎勵\": [],\n    \"可見性\": \"公開\",\n    \"檢查點\": [\"作品市場定案\"],\n    \"啟用\": true\n  },\n  \"quest.main.first_nomination\": {\n    \"類型\": \"主線\",\n    \"顯示名稱\": \"名單之上\",\n    \"簡介\": \"旗下偶像的作品首次入圍年度頒獎。\",\n    \"前置任務_ids\": [\"quest.main.first_grade_a\"],\n    \"目標列表\": [\n      { \"來源\": \"職涯統計\", \"路徑\": \"任一旗下偶像.任一領域.獎項數\", \"運算\": \"大於等於\", \"目標值\": 1 }\n    ],\n    \"獎勵\": [],\n    \"可見性\": \"公開\",\n    \"檢查點\": [\"獎項結算\"],\n    \"啟用\": true\n  },\n  \"quest.main.first_award\": {\n    \"類型\": \"主線\",\n    \"顯示名稱\": \"領獎台\",\n    \"簡介\": \"旗下偶像首次在年度頒獎禮上得獎。\",\n    \"前置任務_ids\": [\"quest.main.first_nomination\"],\n    \"目標列表\": [\n      {\n        \"子組\": {\n          \"模式\": \"任一\",\n          \"項目\": [\n            { \"來源\": \"職涯統計\", \"路徑\": \"任一旗下偶像.任一領域.最高獎項級別\", \"運算\": \"等於\", \"目標值\": \"人氣獎\" },\n            { \"來源\": \"職涯統計\", \"路徑\": \"任一旗下偶像.任一領域.最高獎項級別\", \"運算\": \"等於\", \"目標值\": \"專業獎\" }\n          ]\n        }\n      }\n    ],\n    \"獎勵\": [],\n    \"可見性\": \"公開\",\n    \"檢查點\": [\"獎項結算\"],\n    \"啟用\": true\n  },\n  \"quest.main.top_tier\": {\n    \"類型\": \"主線\",\n    \"顯示名稱\": \"一線之名\",\n    \"簡介\": \"把旗下偶像推上一線——讓他的名字無人不曉。\",\n    \"前置任務_ids\": [\"quest.main.first_award\"],\n    \"目標列表\": [\n      { \"來源\": \"偶像狀態\", \"路徑\": \"任一旗下偶像.公眾反響.知名度\", \"運算\": \"大於等於\", \"目標值\": 80 }\n    ],\n    \"獎勵\": [],\n    \"可見性\": \"公開\",\n    \"檢查點\": [\"作品市場定案\", \"獎項結算\"],\n    \"啟用\": true\n  }\n};\n\n  function annualEventRecords(stat) {\n    return parseRecords(stat && stat.年度事件);\n  }\n\n  function awardNomineesForIdol(stat, awardId, idolId) {\n    var recs = annualEventRecords(stat);\n    var rec = null;\n    for (var i = 0; i < recs.length; i += 1) {\n      if (recs[i][1] === awardId) { rec = recs[i]; break; }\n    }\n    if (!rec) return false;\n    var snap = rec[3] || '';\n    return snap.split(',').some(function (t) { return t.indexOf(':' + idolId) !== -1; });\n  }\n\n  function isAwardDate(dateStr, award) {\n    if (!dateStr || !award) return false;\n    var md = dateStr.slice(5);\n    return md === award.頒獎日;\n  }function elIn(doc, tag, cls, text) {\n    var n = doc.createElement(tag);\n    if (cls) n.className = cls;\n    if (text != null) n.textContent = text;\n    return n;\n  }\n\n  function el(tag, cls, text) {\n    return elIn(document, tag, cls, text);\n  }\n\n  function listen(target, type, fn, opts) {\n    target.addEventListener(type, fn, opts);\n    runtime.stops.push(function () { target.removeEventListener(type, fn, opts); });\n  }\n\n  // 渲染範圍內的節點隨 render() 重建即被回收，不需追蹤清理\n  function listenEl(target, type, fn, opts) {\n    target.addEventListener(type, fn, opts);\n  }\n\n  function debounce(key, fn, ms) {\n    return function () {\n      var args = arguments;\n      clearTimeout(runtime.timers[key]);\n      runtime.timers[key] = setTimeout(function () { if (!onDestroyedGuard()) fn.apply(null, args); }, ms);\n    };\n  }\n\n  function schedule(key, fn, ms) {\n    clearTimeout(runtime.timers[key]);\n    runtime.timers[key] = setTimeout(function () {\n      if (!onDestroyedGuard()) fn();\n    }, ms);\n  }\n\n  function parseDate(dateStr) {\n    var m = /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(String(dateStr || '').trim());\n    if (!m) return null;\n    var dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));\n    return Number.isNaN(dt.getTime()) ? null : dt;\n  }\n\n  function fmtDate(dt) {\n    var m = String(dt.getMonth() + 1), d = String(dt.getDate());\n    return dt.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (d.length < 2 ? '0' + d : d);\n  }\n\n  function addDays(dateStr, n) {\n    var dt = parseDate(dateStr);\n    if (!dt) return '';\n    dt.setDate(dt.getDate() + n);\n    return fmtDate(dt);\n  }\n\n  function daysBetween(fromStr, toStr) {\n    var a = parseDate(fromStr), b = parseDate(toStr);\n    if (!a || !b) return 0;\n    return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));\n  }\n\n  function mondayOf(dateStr) {\n    var dt = parseDate(dateStr);\n    if (!dt) return '';\n    var day = (dt.getDay() + 6) % 7;\n    dt.setDate(dt.getDate() - day);\n    return fmtDate(dt);\n  }\n\n  function weekdayCn(dateStr) {\n    var dt = parseDate(dateStr);\n    if (!dt) return '';\n    return WEEKDAY_CN[(dt.getDay() + 6) % 7];\n  }\n\n  function chatKey() {\n    try {\n      var ctx = window.SillyTavern && window.SillyTavern.getContext ? window.SillyTavern.getContext() : null;\n      var id = ctx && (ctx.chatId || (ctx.chat && ctx.chat.id));\n      return id ? String(id) : null;\n    } catch (e) { return null; }\n  }\n\n  function signedIdols(stat) {\n    var out = [];\n    var idols = (stat && stat.偶像) || {};\n    var company = (stat && stat.公司) || {};\n    var contracts = String((company.company_player && company.company_player.有效藝人合約) || '');\n    Object.keys(idols).forEach(function (id) {\n      var pub = (idols[id] && idols[id].公開身份) || {};\n      if (pub.所屬公司_id === 'company_player' || contracts.indexOf(id) !== -1) {\n        out.push({ id: id, name: pub.藝名 || id, data: idols[id] });\n      }\n    });\n    return out;\n  }\n\n  // 分號分隔記錄、| 分隔欄位\n  function parseRecords(str) {\n    var out = [];\n    String(str || '').split(/[;；]/).forEach(function (rec) {\n      rec = rec.trim();\n      if (!rec) return;\n      out.push(rec.split('|').map(function (f) { return f.trim(); }));\n    });\n    return out;\n  }\n\n  function scheduleEntries(str) {\n    // 日期|人物_id|行程類型|目標_id\n    return parseRecords(str).map(function (f) {\n      return { date: f[0] || '', person: f[1] || '', type: f[2] || '', target: f[3] || '' };\n    }).filter(function (e) { return e.date && e.person; });\n  }\n\n  function resultEntries(str) {\n    // 日期|排程版本|人物_id:終態,…\n    return parseRecords(str).map(function (f) {\n      return { date: f[0] || '', version: f[1] || '', summary: f.slice(2).join('|') };\n    }).filter(function (e) { return e.date; });\n  }\n\n  // 進行中工作記錄解析：新格式 job_id｜名稱｜來源offer｜偶像｜所需工作日｜已完成工作日｜…（v0.15.1 起）；\n  // 舊格式（無 名稱 欄）相容：f[1] 為 offer_ 開頭即舊格式\n  function jobFields(f) {\n    var named = !/^offer_/.test(f[1] || '');\n    return {\n      id: f[0],\n      name: named ? (f[1] || '') : '',\n      idol: named ? f[3] : f[2],\n      need: named ? f[4] : f[3],\n      done: named ? f[5] : f[4]\n    };\n  }\n\n  // 活躍邀約記錄解析（依欄位數辨三代格式）：13＝v0.15 前（無名稱無進入方式）、14＝v0.15.1（加名稱）、\n  // 15＝v0.16（再加進入方式）：offer_id｜名稱｜公司｜類別｜子類型｜進入方式｜目標偶像｜報酬｜押金｜違約金｜所需工作日｜最短工期｜最遲完成日期｜接受截止｜狀態\n  function offerFields(f) {\n    var hasName = f.length >= 14;\n    var hasEntry = f.length >= 15;\n    function at(iNew, i14, i13) { return f[hasEntry ? iNew : (hasName ? i14 : i13)] || ''; }\n    return {\n      id: f[0] || '',\n      name: hasName ? (f[1] || '') : '',\n      company: at(2, 2, 1),\n      cat: at(3, 3, 2),\n      sub: at(4, 4, 3),\n      entry: hasEntry ? (f[5] || '') : '',\n      idol: at(6, 5, 4),\n      pay: at(7, 6, 5),\n      deposit: at(8, 7, 6),\n      days: at(10, 9, 8),\n      minDays: at(11, 10, 9),\n      deadline: at(12, 11, 10),\n      acceptBy: at(13, 12, 11),\n      status: at(14, 13, 12) || '待決定'\n    };\n  }\n\n  function jobOptions(stat, idolId, date) {\n    var out = [];\n    parseRecords(stat && stat.進行中工作).forEach(function (f) {\n      var j = jobFields(f);\n      if (!j.id || !ID_RE.test(j.id)) return;\n      if (idolId && j.idol && j.idol !== idolId) return;\n      out.push({ id: j.id, label: (j.name || j.id) + '（' + (j.done || '0') + '/' + (j.need || '?') + ' 工作日）' });\n    });\n    // 試鏡中邀約（目標為 offer_id；v0.16 起）\n    parseRecords(stat && stat.活躍邀約).forEach(function (f) {\n      var o = offerFields(f);\n      if (!/^offer_\\w+/.test(o.id) || o.status !== '試鏡中') return;\n      if (idolId && o.idol && o.idol !== idolId) return;\n      out.push({ id: o.id, label: (o.name || o.id) + '（試鏡）' });\n    });\n\n    // 出席頒獎選項：只在該格日期等於頒獎日當天出現（v0.19.1）\n    AWARDS.forEach(function (a) {\n      if (!isAwardDate(date, a)) return;\n      if (idolId && awardNomineesForIdol(stat, a.id, idolId)) {\n        out.push({ id: a.id, label: '出席' + a.name });\n      }\n    });\n    return out;\n  }\n\n  function getPath(obj, path) {\n    var parts = String(path || '').split('.');\n    var cur = obj;\n    for (var i = 0; i < parts.length; i += 1) {\n      if (cur == null) return undefined;\n      cur = cur[parts[i]];\n    }\n    return cur;\n  }\n\n  function mdToNum(md) {\n    var m = /^(\\d{2})-(\\d{2})$/.exec(String(md || ''));\n    return m ? Number(m[1]) * 100 + Number(m[2]) : 0;\n  }\n\n  function evalCondition(stat, idolId, cond) {\n    if (!cond || cond.類型 === 'always') return true;\n    var type = cond.類型;\n    if (type === 'ability_min' || type === 'ability_max') {\n      var val = Number(getPath(stat, '偶像.' + idolId + '.專業能力.' + cond.能力)) || 0;\n      return type === 'ability_min' ? val >= Number(cond.門檻) : val <= Number(cond.門檻);\n    }\n    if (type === 'fame_min') {\n      var val = Number(getPath(stat, '偶像.' + idolId + '.公眾反響.知名度')) || 0;\n      return val >= Number(cond.門檻);\n    }\n    if (type === 'fans_min') {\n      var val = Number(getPath(stat, '偶像.' + idolId + '.公眾反響.粉絲數')) || 0;\n      return val >= Number(cond.門檻);\n    }\n    if (type === 'company_funds_min' || type === 'company_funds_max') {\n      var val = Number(getPath(stat, '公司.company_player.資金')) || 0;\n      return type === 'company_funds_min' ? val >= Number(cond.門檻) : val < Number(cond.門檻);\n    }\n    if (type === 'date_range') {\n      var md = String(getPath(stat, '時間.當前日期') || '').slice(5);\n      var cur = mdToNum(md);\n      var start = mdToNum(cond.起始月日);\n      var end = mdToNum(cond.結束月日);\n      if (start <= end) return cur >= start && cur <= end;\n      return cur >= start || cur <= end;\n    }\n    if (type === 'course_unlocked') {\n      var ids = String(getPath(stat, '偶像.' + idolId + '.已解鎖課程') || '').split(',').map(function (x) { return x.trim(); });\n      return ids.indexOf(cond.course_id) !== -1;\n    }\n    if (type === 'affinity_min') {\n      // v0.41：對象路徑支援 <idol_id> 佔位，判定時以當前目標偶像代入\n      var path = String(cond.對象路徑 || '').split('<idol_id>').join(idolId);\n      var val = Number(getPath(stat, path)) || 0;\n      return val >= Number(cond.門檻);\n    }\n    if (type === 'and' && cond.子條件) {\n      for (var i = 0; i < cond.子條件.length; i += 1) {\n        if (!evalCondition(stat, idolId, cond.子條件[i])) return false;\n      }\n      return true;\n    }\n    if (type === 'or' && cond.子條件) {\n      for (var i = 0; i < cond.子條件.length; i += 1) {\n        if (evalCondition(stat, idolId, cond.子條件[i])) return true;\n      }\n      return false;\n    }\n    return false;\n  }\n\n  function checkUnlock(stat, idolId, unlockId, registry) {\n    var table = registry || UNLOCKS;\n    var unlock = table[unlockId];\n    if (!unlock) return false;\n    return evalCondition(stat, idolId, unlock.條件);\n  }\n\n  function courseOptions(stat, idolId) {\n    // 課程目錄（COURSES 由構建注入）：下拉顯示 名稱（能力・$費用/日），依解鎖條件過濾\n    return Object.keys(COURSES).filter(function (id) {\n      var cid = COURSES[id].解鎖條件_id || 'unlock_always';\n      return checkUnlock(stat, idolId, cid);\n    }).map(function (id) {\n      var c = COURSES[id];\n      return { id: id, label: c.名稱 + '（' + c.能力 + '・$' + fmtInt(c.費用每日) + '/日）' };\n    });\n  }\n\n  function promoOptions(stat) {\n    // 宣傳企劃目錄（PROMS 由構建注入）：下拉顯示 名稱（$費用/日）。\n    // 有企劃門檻者需玩家「企劃製作」有效值達標才顯示（L2《宣傳企劃世界書》§4 硬閘）。\n    var eff = playerEffectiveAbility(stat, '企劃製作');\n    return Object.keys(PROMS).filter(function (id) {\n      var threshold = PROMS[id].企劃門檻;\n      return !threshold || eff >= Number(threshold);\n    }).map(function (id) {\n      var c = PROMS[id];\n      return { id: id, label: c.名稱 + '（$' + fmtInt(c.費用每日) + '/日）' };\n    });\n  }\n\n  function gigOptions(stat, idolId) {\n    // 外快目錄（GIGS 由構建注入）：下拉顯示 名稱（能力・$報酬/日），依解鎖條件過濾\n    return Object.keys(GIGS).filter(function (id) {\n      var gid = GIGS[id].解鎖條件_id || 'unlock_always';\n      return checkUnlock(stat, idolId, gid, GIG_UNLOCKS);\n    }).map(function (id) {\n      var c = GIGS[id];\n      return { id: id, label: c.名稱 + '（' + c.成長能力 + '・$' + fmtInt(c.日結報酬) + '/日）' };\n    });\n  }\n\n  function restOptions() {\n    // 休整配置目錄（RESTS 由構建注入）：下拉顯示 名稱（N天・$一次性費用）\n    return Object.keys(RESTS).map(function (id) {\n      var r = RESTS[id];\n      return { id: id, label: r.名稱 + '（' + r.連排天數 + '天・$' + fmtInt(r.一次性費用) + '）' };\n    });\n  }\n\n  function targetLabel(type, target, stat) {\n    if (type === '休息' && RESTS[target]) return RESTS[target].名稱;\n    if (type === '課程' && COURSES[target]) return COURSES[target].名稱;\n    if (type === '打工' && GIGS[target]) return GIGS[target].名稱;\n    if (type === '正式工作') {\n      var jobs = parseRecords(stat && stat.進行中工作);\n      for (var i = 0; i < jobs.length; i += 1) {\n        if (jobs[i][0] === target) { var jn = jobFields(jobs[i]).name; if (jn) return jn; }\n      }\n      var ofs = parseRecords(stat && stat.活躍邀約);\n      for (var k = 0; k < ofs.length; k += 1) {\n        if (ofs[k][0] === target) { var on = offerFields(ofs[k]).name; if (on) return on + '（試鏡）'; }\n      }\n      var award = null;\n      for (var ai = 0; ai < AWARDS.length; ai += 1) { if (AWARDS[ai].id === target) { award = AWARDS[ai]; break; } }\n      if (award) return '出席' + award.name;\n      return target;\n    }\n    if (type === '宣傳') {\n      // 宣傳目標格式 promo_id@idol_id（v1.1.0 起排玩家列，對象為已簽約偶像）\n      var parts = String(target || '').split('@');\n      var name = PROMS[parts[0]] ? PROMS[parts[0]].名稱 : (parts[0] || '');\n      return parts[1] ? name + '（對象：' + personLabel(stat, parts[1]) + '）' : name;\n    }\n    return target;\n  }\n\n  function countTargetMissing(stat) {\n    // 未執行的未來日期中，課程／打工未選 course_id／gig_id、宣傳未選齊 promo_id@idol_id 的格數（提交前攔截）\n    var draft = runtime.draft;\n    if (!draft) return 0;\n    var today = (stat.時間 && stat.時間.當前日期) || '';\n    var executed = {};\n    resultEntries(stat.日程 && stat.日程.每日結果).forEach(function (r) { executed[r.date] = true; });\n    var n = 0;\n    for (var i = 0; i < 7; i += 1) {\n      var date = addDays(draft.weekStart, i);\n      if (executed[date] || (today && date < today)) continue;\n      Object.keys(draft.cells).forEach(function (key) {\n        if (key.split('|')[0] !== date) return;\n        var cell = draft.cells[key];\n        if ((cell.type === '課程' || cell.type === '打工') && !cell.target) n += 1;\n        if (cell.type === '宣傳' && !/^promo_\\w+@idol_\\w+$/.test(cell.target || '')) n += 1;\n      });\n    }\n    return n;\n  }\n  function loadDraft(stat) {\n    var key = DRAFT_PREFIX + (chatKey() || 'default');\n    runtime.draftKey = key;\n    var weekStart = mondayOf(stat.時間 && stat.時間.當前日期);\n    var draft = null;\n    try {\n      var raw = sessionStorage.getItem(key);\n      if (raw) draft = JSON.parse(raw);\n    } catch (e) { }\n    if (!draft || draft.weekStart !== weekStart || !draft.cells) {\n      draft = { weekStart: weekStart, cells: {} };\n      scheduleEntries(stat.日程 && stat.日程.已確認排程).forEach(function (e) {\n        draft.cells[e.date + '|' + e.person] = { type: e.type, target: e.target };\n      });\n    }\n    runtime.draft = draft;\n  }\n\n  function saveDraft() {\n    if (!runtime.draftKey || !runtime.draft) return;\n    try { sessionStorage.setItem(runtime.draftKey, JSON.stringify(runtime.draft)); } catch (e) { }\n  }\n\n  function dropDraft() {\n    if (runtime.draftKey) { try { sessionStorage.removeItem(runtime.draftKey); } catch (e) { } }\n    if (runtime.stat) loadDraft(runtime.stat);\n  }\n  var OPEN_MODES = [\n    { id: '故事', desc: '有期限與最終目標：5 年內公司資金達 500 萬，期滿評價結局（暫定）' },\n    { id: '自由', desc: '無期限、無主綫的完整沙盒' }\n  ];\n  var OPEN_DIFFS = [\n    { id: '簡單', points: 18, funds: '200,000', bg: '娛樂圈大佬的獨女，資金人脈俱全' },\n    { id: '普通', points: 14, funds: '100,000', bg: '前執行經紀自立門戶' },\n    { id: '困難', points: 10, funds: '50,000', bg: '白手起家，無背景無人脈' }\n  ];\n\n  function openingStateKey() {\n    var key = chatKey();\n    return key ? 'sgx-phone-opening:' + key : null;\n  }\n\n  function loadOpeningState() {\n    if (runtime.openingState) return runtime.openingState;\n    var state = { mode: null, diff: null, tags: {} };\n    var key = openingStateKey();\n    if (key) {\n      try {\n        var raw = sessionStorage.getItem(key);\n        if (raw) {\n          var saved = JSON.parse(raw);\n          if (saved && saved.mode) state.mode = saved.mode;\n          if (saved && saved.diff) state.diff = saved.diff;\n          if (saved && Array.isArray(saved.tags)) saved.tags.forEach(function (id) { state.tags[String(id)] = true; });\n        }\n      } catch (e) { }\n    }\n    runtime.openingState = state;\n    return state;\n  }\n\n  function saveOpeningState() {\n    var key = openingStateKey();\n    var state = runtime.openingState;\n    if (!key || !state) return;\n    try {\n      sessionStorage.setItem(key, JSON.stringify({\n        mode: state.mode,\n        diff: state.diff,\n        tags: Object.keys(state.tags).filter(function (id) { return state.tags[id]; })\n      }));\n    } catch (e) { }\n  }\n\n  function clearOpeningState() {\n    var key = openingStateKey();\n    if (key) { try { sessionStorage.removeItem(key); } catch (e) { } }\n    runtime.openingState = null;\n  }\n\n  function openingPoints(diffId) {\n    for (var i = 0; i < OPEN_DIFFS.length; i += 1) {\n      if (OPEN_DIFFS[i].id === diffId) return OPEN_DIFFS[i].points;\n    }\n    return 0;\n  }\n\n  function openingPositiveCost(state) {\n    var total = 0;\n    Object.keys(state.tags).forEach(function (id) {\n      var tag = TAGS[id];\n      if (state.tags[id] && tag && Number(tag.費用) > 0) total += Number(tag.費用);\n    });\n    return total;\n  }\n\n  function openingRebate(state) {\n    var total = 0;\n    Object.keys(state.tags).forEach(function (id) {\n      var tag = TAGS[id];\n      if (state.tags[id] && tag && Number(tag.費用) < 0) total += -Number(tag.費用);\n    });\n    return total;\n  }\n\n  function openingNegCount(state) {\n    var n = 0;\n    Object.keys(state.tags).forEach(function (id) {\n      var tag = TAGS[id];\n      if (state.tags[id] && tag && Number(tag.費用) < 0) n += 1;\n    });\n    return n;\n  }\n\n  function openingValidate(state) {\n    var pos = openingPositiveCost(state);\n    var reb = openingRebate(state);\n    var cap = openingPoints(state.diff);\n    var avail = cap + reb;\n    var neg = openingNegCount(state);\n    if (pos > avail) return { ok: false, msg: \"正面 tag 費用 \" + pos + \" 點超過可用點數 \" + avail + \" 點（預算 \" + cap + \" + 返點 \" + reb + \"），請調整。\" };\n    if (neg > 3) return { ok: false, msg: \"負面 tag 最多選 3 個（目前 \" + neg + \" 個），請調整。\" };\n    if (reb > 6) return { ok: false, msg: \"返點合計最多 6 點（目前 \" + reb + \" 點），請調整。\" };\n    var ids = Object.keys(state.tags).filter(function (id) { return state.tags[id]; }).map(Number).sort(function (a, b) { return a - b; });\n    for (var i = 0; i < ids.length; i += 1) {\n      for (var j = i + 1; j < ids.length; j += 1) {\n        var a = TAGS[ids[i]], b = TAGS[ids[j]];\n        if (!a || !b) continue;\n        var ma = a.互斥 || [], mb = b.互斥 || [];\n        if (ma.indexOf(ids[j]) !== -1 || mb.indexOf(ids[i]) !== -1) {\n          return { ok: false, msg: \"選中的 tag 存在互斥（ID \" + ids[i] + \" 與 ID \" + ids[j] + \"），請參照互斥表調整。\" };\n        }\n      }\n    }\n    return { ok: true, msg: \"\" };\n  }\n\n  function composeOpeningMessage(state) {\n    var ids = Object.keys(state.tags).filter(function (id) { return state.tags[id]; })\n      .sort(function (a, b) { return Number(a) - Number(b); });\n    return '模式：' + state.mode + '\\n難度：' + state.diff + '\\n' +\n      (ids.length ? '購買標籤：' + ids.join(', ') : '不購買標籤');\n  }\n\n  function openingOption(doc, label, description, pressed, onClick) {\n    var wrap = elIn(doc, 'div', 'sgx-ph-open-option');\n    var button = elIn(doc, 'button', 'sgx-ph-btn sgx-ghost', label);\n    button.type = 'button';\n    button.setAttribute('aria-pressed', pressed ? 'true' : 'false');\n    listenEl(button, 'click', onClick);\n    wrap.appendChild(button);\n    wrap.appendChild(elIn(doc, 'div', 'sgx-ph-note', description));\n    return wrap;\n  }\n\n  function renderOpening(body, stat, rerender) {\n    var doc = body.ownerDocument || document;\n    var repaint = typeof rerender === 'function' ? rerender : render;\n    var state = loadOpeningState();\n    body.appendChild(elIn(doc, 'div', 'sgx-ph-sec', '開局設置'));\n    body.appendChild(elIn(doc, 'p', 'sgx-ph-note', stat\n      ? '先選模式與難度，再決定是否購入開局標籤。點數是上限，不必花完。'\n      : '遊戲狀態仍在載入；你可以先完成選擇，確認後由系統建立開局。'));\n\n    var modeCard = elIn(doc, 'div', 'sgx-ph-card');\n    modeCard.appendChild(elIn(doc, 'div', 'sgx-ph-sec', '第 1 步：模式'));\n    var modeList = elIn(doc, 'div', 'sgx-ph-open-list');\n    OPEN_MODES.forEach(function (mode) {\n      modeList.appendChild(openingOption(doc, mode.id, mode.desc, state.mode === mode.id, function () {\n        state.mode = mode.id;\n        saveOpeningState();\n        repaint();\n      }));\n    });\n    modeCard.appendChild(modeList);\n    body.appendChild(modeCard);\n\n    var diffCard = elIn(doc, 'div', 'sgx-ph-card');\n    diffCard.appendChild(elIn(doc, 'div', 'sgx-ph-sec', '第 2 步：難度'));\n    var diffList = elIn(doc, 'div', 'sgx-ph-open-list');\n    OPEN_DIFFS.forEach(function (diff) {\n      diffList.appendChild(openingOption(\n        doc,\n        diff.id,\n        '創建點數 ' + diff.points + '・資金 ' + diff.funds + '・' + diff.bg,\n        state.diff === diff.id,\n        function () {\n          state.diff = diff.id;\n          saveOpeningState();\n          repaint();\n        }\n      ));\n    });\n    diffCard.appendChild(diffList);\n    body.appendChild(diffCard);\n\n    var tagCard = elIn(doc, 'div', 'sgx-ph-card');\n    tagCard.appendChild(elIn(doc, 'div', 'sgx-ph-sec', '第 3 步：開局標籤（可不購買）'));\n    var tagList = elIn(doc, 'div', 'sgx-ph-open-list');\n    Object.keys(TAGS).sort(function (a, b) { return Number(a) - Number(b); }).forEach(function (id) {\n      var tag = TAGS[id];\n      var effects = Object.keys(tag.直接修正 || {}).map(function (key) {\n        var value = Number(tag.直接修正[key]) || 0;\n        return key + (value >= 0 ? '+' : '') + value;\n      }).join('、');\n      tagList.appendChild(openingOption(\n        doc,\n        'ID ' + id + '「' + tag.名稱 + '」・' + tag.費用 + ' 點',\n        tag.類型 + (effects ? '・' + effects : ''),\n        !!state.tags[id],\n        function () {\n          if (state.tags[id]) delete state.tags[id]; else state.tags[id] = true;\n          saveOpeningState();\n          repaint();\n        }\n      ));\n    });\n    tagCard.appendChild(tagList);\n    if (state.diff) {\n      var used = openingPositiveCost(state);\n      var reb = openingRebate(state);\n      var cap = openingPoints(state.diff);\n      var vld = openingValidate(state);\n      tagCard.appendChild(elIn(doc, 'div', vld.ok ? 'sgx-ph-note' : 'sgx-ph-error',\n        '正面 tag 費用 ' + used + ' / 可用 ' + (cap + reb) + ' 點（預算 ' + cap + ' + 返點 ' + reb + '）' + (vld.ok ? '' : '——' + vld.msg)));\n    }\n    body.appendChild(tagCard);\n\n    var preview = elIn(doc, 'div', 'sgx-ph-card');\n    preview.appendChild(elIn(doc, 'div', 'sgx-ph-sec', '確認後將發送'));\n    preview.appendChild(elIn(doc, 'div', 'sgx-ph-open-preview', state.mode && state.diff\n      ? composeOpeningMessage(state)\n      : '（請先選擇模式與難度）'));\n    body.appendChild(preview);\n\n    var error = elIn(doc, 'div', 'sgx-ph-error');\n    error.style.display = 'none';\n    body.appendChild(error);\n    var submit = elIn(doc, 'button', 'sgx-ph-btn', '確認開局');\n    submit.type = 'button';\n    submit.disabled = !state.mode || !state.diff || !openingValidate(state).ok;\n    listenEl(submit, 'click', function () {\n      var vld2 = openingValidate(state);\n      if (!vld2.ok) {\n        error.textContent = vld2.msg;\n        error.style.display = 'block';\n        return;\n      }\n      if (sendCommand(composeOpeningMessage(state), submit, error)) clearOpeningState();\n    });\n    body.appendChild(submit);\n  }\n\n  var OPENING_BRIDGE_CSS = [\n    '.sgx-opening .sgx-ph-sec{font-size:14px;font-weight:800;color:#f0d99a;margin:4px 0 8px}',\n    '.sgx-opening .sgx-ph-note{font-size:12px;line-height:1.6;color:#a9a3b8;margin:7px 0}',\n    '.sgx-opening .sgx-ph-card{margin:10px 0;padding:10px;border:1px solid #3a3447;border-radius:12px;background:#121118}',\n    '.sgx-opening .sgx-ph-open-list{display:grid;gap:8px;margin-top:8px}',\n    '.sgx-opening .sgx-ph-open-option{display:grid;gap:4px;padding:8px;border:1px solid #2d2937;border-radius:9px;background:#19171f}',\n    '.sgx-opening .sgx-ph-btn{width:100%;min-height:44px;padding:10px 12px;border:0;border-radius:9px;background:#8d6a29;color:#fff;font:inherit;font-weight:700;text-align:left;touch-action:manipulation;cursor:pointer}',\n    '.sgx-opening .sgx-ph-btn.sgx-ghost{background:#25202b;color:#ead28e;border:1px solid #50475f}',\n    '.sgx-opening .sgx-ph-btn[aria-pressed=\"true\"]{outline:2px solid #e6c37a;background:#392f20}',\n    '.sgx-opening .sgx-ph-btn:disabled{background:#4a4358;color:#a39dad;cursor:not-allowed}',\n    '.sgx-opening .sgx-ph-error{font-size:12px;line-height:1.5;color:#ef9c9c;margin:7px 0}',\n    '.sgx-opening .sgx-ph-open-preview{white-space:pre-wrap;overflow-wrap:anywhere;color:#eee9df;line-height:1.6}',\n    '@media(max-width:520px){.sgx-opening .sgx-ph-card{padding:9px}.sgx-opening .sgx-ph-btn{font-size:15px}}'\n  ].join('\\n');\n\n  function renderOpeningInFrame(root) {\n    var doc = root && root.ownerDocument;\n    if (!doc) return false;\n    var view = root.querySelector('.sgx-view');\n    var nojs = root.querySelector('.sgx-nojs');\n    if (!view) return false;\n\n    // 訊息內原腳本已成功時保持原介面；只接管停在 no-js 後備畫面的 iframe。\n    if (root.dataset.sgxInit === '1' && root.dataset.sgxInitSource !== 'phone-bridge' &&\n      nojs && nojs.style.display === 'none' && view.children.length) return false;\n\n    root.dataset.sgxInit = '1';\n    root.dataset.sgxInitSource = 'phone-bridge';\n    if (nojs) nojs.style.display = 'none';\n    if (!root.querySelector('style[data-sgx-opening-bridge-style]')) {\n      var style = elIn(doc, 'style');\n      style.setAttribute('data-sgx-opening-bridge-style', '1');\n      style.textContent = OPENING_BRIDGE_CSS;\n      root.insertBefore(style, view);\n    }\n\n    function repaint() {\n      if (!view.isConnected || runtime.destroyed) return;\n      view.textContent = '';\n      var player = runtime.stat && runtime.stat.玩家;\n      if (player && player.難度) {\n        view.appendChild(elIn(doc, 'div', 'sgx-ph-card', '開局已完成：' +\n          (player.遊戲模式 ? player.遊戲模式 + '模式・' : '') + player.難度 + '難度'));\n        return;\n      }\n      renderOpening(view, runtime.stat, repaint);\n    }\n\n    repaint();\n    return true;\n  }\n\n  function bridgeOpeningFrames() {\n    var frames = document.querySelectorAll('iframe[id^=\"TH-message--\"]');\n    for (var i = 0; i < frames.length; i += 1) {\n      try {\n        var doc = frames[i].contentDocument;\n        if (!doc) continue;\n        var roots = doc.querySelectorAll('.sgx-opening');\n        for (var j = 0; j < roots.length; j += 1) renderOpeningInFrame(roots[j]);\n      } catch (e) { }\n    }\n  }\n  function renderHome(body, stat) {\n    var time = stat.時間 || {};\n    var date = time.當前日期 || '';\n    var row = el('div', 'sgx-ph-row');\n    row.appendChild(el('span', 'sgx-ph-chip', date + ' ' + weekdayCn(date) + (time.當前時刻 ? ' ' + time.當前時刻 : '')));\n    row.appendChild(el('span', 'sgx-ph-chip', '階段：' + (time.當日階段 || '—')));\n    var mode = String((stat.玩家 && stat.玩家.遊戲模式) || '');\n    if (mode) row.appendChild(el('span', 'sgx-ph-chip', '模式：' + mode));\n    var story = stat.主綫 || {};\n    if (mode === '故事' && story.狀態 === '進行中') {\n      row.appendChild(el('span', 'sgx-ph-chip', '主綫：剩 ' + daysBetween(time.當前日期, story.截止日期) + ' 天'));\n    }\n    var block = String(time.當前阻塞節點 || '');\n    if (block) {\n      var parts = block.split('|');\n      row.appendChild(el('span', 'sgx-ph-chip sgx-warn', '阻塞：' + (parts[4] || parts[0] || '節點處理中')));\n    }\n    body.appendChild(row);\n\n    var company = (stat.公司 && stat.公司.company_player) || {};\n    var kv = el('div', 'sgx-ph-card');\n    kv.appendChild(el('div', 'sgx-ph-sec', '公司'));\n    kv.appendChild(kvRow('資金', fmtInt(company.資金)));\n    kv.appendChild(kvRow('簽約容量', String(company.簽約容量 != null ? company.簽約容量 : '—')));\n    body.appendChild(kv);\n\n    if (mode === '故事' && story.狀態 !== '未啟用') {\n      var sc = el('div', 'sgx-ph-card');\n      sc.appendChild(el('div', 'sgx-ph-sec', '主綫目標'));\n      sc.appendChild(kvRow('目標', String(story.目標描述 || '—')));\n      var funds = Number(company.資金) || 0;\n      var target = Number(story.目標值) || 0;\n      sc.appendChild(kvRow('進度', target > 0 ? (fmtInt(funds) + ' / ' + fmtInt(target)) : '—'));\n      sc.appendChild(kvRow('狀態', story.狀態 === '已結局' ? ('已結局：' + (story.結局_id || '')) : ('剩餘 ' + daysBetween(time.當前日期, story.截止日期) + ' 天（' + (story.截止日期 || '') + ' 期滿）')));\n      body.appendChild(sc);\n    }\n\n    // 今日行程\n    var todayCard = el('div', 'sgx-ph-card');\n    todayCard.appendChild(el('div', 'sgx-ph-sec', '今日行程'));\n    var todayEntries = scheduleEntries(stat.日程 && stat.日程.已確認排程)\n      .filter(function (e) { return e.date === date; });\n    if (!todayEntries.length) {\n      todayCard.appendChild(el('div', 'sgx-ph-note', '今日無已確認排程。'));\n    } else {\n      todayEntries.forEach(function (e) {\n        todayCard.appendChild(kvRow(personLabel(stat, e.person), e.type + (e.target ? '・' + targetLabel(e.type, e.target, stat) : '')));\n      });\n    }\n    body.appendChild(todayCard);\n\n    // 身心簡表\n    var hp = el('div', 'sgx-ph-card');\n    hp.appendChild(el('div', 'sgx-ph-sec', '身心'));\n    var player = stat.玩家 || {};\n    hp.appendChild(kvRow('玩家', '疲勞 ' + num(player.疲勞) + '・壓力 ' + num(player.壓力) + '・' + (player.健康狀態 || '正常')));\n    signedIdols(stat).forEach(function (s) {\n      var mind = (s.data && s.data.身心狀態) || {};\n      hp.appendChild(kvRow(s.name, '疲勞 ' + num(mind.疲勞) + '・壓力 ' + num(mind.壓力) + '・動力 ' + num(mind.動力) + '・' + (mind.健康狀態 || '健康')));\n    });\n    body.appendChild(hp);\n\n    // 標籤與有效能力\n    var tagCard = el('div', 'sgx-ph-card');\n    tagCard.appendChild(el('div', 'sgx-ph-sec', '標籤與有效能力'));\n    var baseA = player.基礎能力 || {};\n    var ownedIds = String(player.標籤 || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);\n    if (!ownedIds.length) {\n      tagCard.appendChild(el('div', 'sgx-ph-note', '未持有標籤。'));\n    } else {\n      var chips = el('div', 'sgx-ph-row');\n      ownedIds.forEach(function (id) {\n        var t = TAGS[id];\n        var label = t ? ('ID ' + id + ' ' + t.名稱) : ('ID ' + id);\n        var mods = t ? Object.keys(t.直接修正).map(function (k) { return k + (t.直接修正[k] >= 0 ? '+' : '') + t.直接修正[k]; }).join('、') : '';\n        chips.appendChild(el('span', 'sgx-ph-chip', label + (mods ? '（' + mods + '）' : '')));\n      });\n      tagCard.appendChild(chips);\n    }\n    var eff = {};\n    Object.keys(baseA).forEach(function (k) {\n      var v = Number(baseA[k]) || 0;\n      ownedIds.forEach(function (id) {\n        var m = TAGS[id] && TAGS[id].直接修正;\n        if (m && m[k]) v += m[k];\n      });\n      eff[k] = Math.min(60, Math.max(0, v));\n    });\n    Object.keys(eff).forEach(function (k) {\n      tagCard.appendChild(kvRow(k, baseA[k] + ' → ' + eff[k]));\n    });\n    body.appendChild(tagCard);\n\n    // 執行控制\n    var ctl = el('div', 'sgx-ph-card');\n    ctl.appendChild(el('div', 'sgx-ph-sec', '執行控制'));\n    var btnRow = el('div', 'sgx-ph-row');\n    [['執行今天', '執行今天'], ['執行至阻塞點', '執行至阻塞點'], ['執行本週', '執行本週']].forEach(function (c) {\n      var b = el('button', 'sgx-ph-btn sgx-ghost', c[1]);\n      b.type = 'button';\n      listenEl(b, 'click', function () { sendCommand(c[0], b); });\n      btnRow.appendChild(b);\n    });\n    ctl.appendChild(btnRow);\n    ctl.appendChild(el('div', 'sgx-ph-note', '「執行至阻塞點／執行本週」會武裝自動續跑，遇阻塞或你插話即停。'));\n    body.appendChild(ctl);\n  }\n\n  function kvRow(k, v) {\n    var row = el('div', 'sgx-ph-kv');\n    row.appendChild(el('span', null, k));\n    row.appendChild(el('span', null, v));\n    return row;\n  }\n\n  function num(v) { return String(v != null ? v : 0); }\n  function fmtInt(v) {\n    var n = Number(v);\n    if (!isFinite(n)) return String(v != null ? v : '—');\n    return n.toLocaleString('en-US');\n  }\n\n  function playerEffectiveAbility(stat, key) {\n    var player = (stat && stat.玩家) || {};\n    var base = Number((player.基礎能力 || {})[key]) || 0;\n    var ids = String(player.標籤 || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);\n    var bonus = 0;\n    ids.forEach(function (id) {\n      var m = TAGS[id] && TAGS[id].直接修正;\n      if (m && m[key]) bonus += m[key];\n    });\n    return Math.min(60, Math.max(0, base + bonus));\n  }\n\n  function personLabel(stat, personId) {\n    if (personId === 'player') return '玩家';\n    var idol = stat.偶像 && stat.偶像[personId];\n    return (idol && idol.公開身份 && idol.公開身份.藝名) || personId;\n  }\n\n  // ─────────────── 渲染：行程 ───────────────\n\n  function renderSchedule(body, stat) {\n    var time = stat.時間 || {};\n    var today = time.當前日期 || '';\n    if (!runtime.draft) loadDraft(stat);\n    var draft = runtime.draft;\n    var weekStart = draft.weekStart;\n\n    var people = [{ id: 'player', name: '玩家' }].concat(signedIdols(stat).map(function (s) {\n      return { id: s.id, name: s.name };\n    }));\n    if (people.length === 1) {\n      body.appendChild(el('p', 'sgx-ph-note', '尚未簽約任何偶像。先到地圖偶遇並說服簽約，才能為偶像排程。'));\n    }\n\n    var executed = {};\n    resultEntries(stat.日程 && stat.日程.每日結果).forEach(function (r) {\n      var m = {};\n      String(r.summary || '').split(/[,，]/).forEach(function (pair) {\n        var kv = pair.split(/[:：]/);\n        if (kv.length >= 2 && kv[0].trim()) m[kv[0].trim()] = kv.slice(1).join(':').trim();\n      });\n      executed[r.date] = m;\n    });\n\n    var invalid = 0;\n    for (var i = 0; i < 7; i += 1) {\n      var date = addDays(weekStart, i);\n      var day = el('div', 'sgx-ph-day');\n      var head = el('div', 'sgx-ph-dayhead', weekdayCn(date));\n      head.appendChild(el('span', null, date + (date === today ? '・今天' : '')));\n      day.appendChild(head);\n      var readOnly = !!executed[date] || (today && date < today);\n      people.forEach(function (p) {\n        var cell = el('div', 'sgx-ph-cell');\n        cell.appendChild(el('span', 'sgx-ph-cellname', p.name));\n        var key = date + '|' + p.id;\n        var cur = draft.cells[key] || { type: UNSET, target: '' };\n        if (readOnly) {\n          var stTxt = executed[date] && executed[date][p.id];\n          var base = cur.type && cur.type !== UNSET ? cur.type + (cur.target ? '・' + targetLabel(cur.type, cur.target, stat) : '') : '';\n          var label = (base ? base + '・' : '') + (stTxt || '—');\n          cell.appendChild(el('span', 'sgx-ph-readonly', label + '（已執行）'));\n        } else {\n          var sel = el('select');\n          [UNSET].concat(SCHEDULE_TYPES).forEach(function (t) {\n            if ((t === '課程' || t === '打工') && p.id === 'player') return; // 課程／打工只服務已簽約偶像\n            if (t === '宣傳' && p.id !== 'player') return; // 宣傳是玩家的工作（v1.1.0 起）\n            var opt = el('option', null, t);\n            opt.value = t;\n            if (cur.type === t) opt.selected = true;\n            sel.appendChild(opt);\n          });\n          sel.value = cur.type || UNSET;\n          cell.appendChild(sel);\n          var jobSel = null;\n          var courseSel = null;\n          var promoSel = null;\n          var promoIdolSel = null;\n          var gigSel = null;\n          var restSel = null;\n          if (sel.value === '正式工作') {\n            jobSel = buildJobSelect(stat, p.id, cur.target, date);\n            cell.appendChild(jobSel);\n          } else if (sel.value === '課程') {\n            courseSel = buildCourseSelect(stat, p.id, cur.target);\n            cell.appendChild(courseSel);\n          } else if (sel.value === '宣傳') {\n            var tp = String(cur.target || '').split('@');\n            promoSel = buildPromoSelect(stat, tp[0] || '');\n            cell.appendChild(promoSel);\n            promoIdolSel = buildPromoIdolSelect(stat, tp[1] || '');\n            cell.appendChild(promoIdolSel);\n          } else if (sel.value === '打工') {\n            gigSel = buildGigSelect(stat, p.id, cur.target);\n            cell.appendChild(gigSel);\n          } else if (sel.value === '休息') {\n            restSel = buildRestSelect(cur.target || 'rest_home');\n            cell.appendChild(restSel);\n          }\n          listenEl(sel, 'change', function () {\n            var target = '';\n            if (sel.value === '正式工作') target = (jobSel && jobSel.value) || '';\n            else if (sel.value === '課程') target = (courseSel && courseSel.value) || '';\n            else if (sel.value === '宣傳') target = ((promoSel && promoSel.value) || '') + '@' + ((promoIdolSel && promoIdolSel.value) || '');\n            else if (sel.value === '打工') target = (gigSel && gigSel.value) || '';\n            else if (sel.value === '休息') target = (restSel && restSel.value) || 'rest_home';\n            draft.cells[key] = { type: sel.value, target: target };\n            saveDraft();\n            render();\n          });\n          if (jobSel) {\n            listenEl(jobSel, 'change', function () {\n              draft.cells[key] = { type: '正式工作', target: jobSel.value };\n              saveDraft();\n            });\n          }\n          if (courseSel) {\n            listenEl(courseSel, 'change', function () {\n              draft.cells[key] = { type: '課程', target: courseSel.value };\n              saveDraft();\n            });\n          }\n          if (promoSel) {\n            listenEl(promoSel, 'change', function () {\n              draft.cells[key] = { type: '宣傳', target: (promoSel.value || '') + '@' + ((promoIdolSel && promoIdolSel.value) || '') };\n              saveDraft();\n            });\n          }\n          if (promoIdolSel) {\n            listenEl(promoIdolSel, 'change', function () {\n              draft.cells[key] = { type: '宣傳', target: ((promoSel && promoSel.value) || '') + '@' + (promoIdolSel.value || '') };\n              saveDraft();\n            });\n          }\n          if (gigSel) {\n            listenEl(gigSel, 'change', function () {\n              draft.cells[key] = { type: '打工', target: gigSel.value };\n              saveDraft();\n            });\n          }\n          if (restSel) {\n            listenEl(restSel, 'change', function () {\n              var restId = restSel.value || 'rest_home';\n              draft.cells[key] = { type: '休息', target: restId };\n              var cfg = RESTS[restId];\n              if (cfg && cfg.連排天數 > 1) {\n                for (var d = 1; d < cfg.連排天數; d += 1) {\n                  var nextDate = addDays(key.split('|')[0], d);\n                  if (!nextDate) break;\n                  if (nextDate > addDays(weekStart, 6)) break;\n                  if (executed[nextDate] || (today && nextDate < today)) break;\n                  var nextKey = nextDate + '|' + p.id;\n                  var already = draft.cells[nextKey];\n                  if (already && already.type && already.type !== UNSET && (already.type !== '休息' || already.target !== restId)) break;\n                  draft.cells[nextKey] = { type: '休息', target: restId };\n                }\n              }\n              saveDraft();\n              render();\n            });\n          }\n          if (sel.value === UNSET) invalid += 1;\n        }\n        day.appendChild(cell);\n      });\n      body.appendChild(day);\n    }\n\n    var err = el('div', 'sgx-ph-error');\n    err.style.display = 'none';\n    body.appendChild(err);\n\n    var actions = el('div', 'sgx-ph-row');\n    var submit = el('button', 'sgx-ph-btn', '提交本週排程');\n    submit.type = 'button';\n    listenEl(submit, 'click', function () {\n      if (invalid > 0) {\n        err.textContent = '還有 ' + invalid + ' 格「未安排」，請先處理（休息也是有效安排）。';\n        err.style.display = 'block';\n        return;\n      }\n      var targetMissing = countTargetMissing(stat);\n      if (targetMissing > 0) {\n        err.textContent = '還有 ' + targetMissing + ' 格課程／打工／宣傳未選擇項目。';\n        err.style.display = 'block';\n        return;\n      }\n      submitSchedule(stat, submit, err);\n    });\n    var cancel = el('button', 'sgx-ph-btn sgx-ghost', '取消變更');\n    cancel.type = 'button';\n    listenEl(cancel, 'click', function () { dropDraft(); render(); });\n    actions.appendChild(submit);\n    actions.appendChild(cancel);\n    body.appendChild(actions);\n    body.appendChild(el('div', 'sgx-ph-note', '排程以週為單位；已執行日期唯讀。提交後由系統驗證並寫入正式排程（排程版本 +1）。'));\n  }\n\n  function buildJobSelect(stat, idolId, currentTarget, date) {\n    var sel = el('select');\n    var opts = jobOptions(stat, idolId === 'player' ? null : idolId, date);\n    var empty = el('option', null, '（選擇工作）');\n    empty.value = '';\n    sel.appendChild(empty);\n    opts.forEach(function (o) {\n      var opt = el('option', null, o.label);\n      opt.value = o.id;\n      if (currentTarget === o.id) opt.selected = true;\n      sel.appendChild(opt);\n    });\n    sel.value = currentTarget || '';\n    return sel;\n  }\n\n  function buildCourseSelect(stat, idolId, currentTarget) {\n    var sel = el('select');\n    var empty = el('option', null, '（選擇課程）');\n    empty.value = '';\n    sel.appendChild(empty);\n    courseOptions(stat, idolId).forEach(function (o) {\n      var opt = el('option', null, o.label);\n      opt.value = o.id;\n      if (currentTarget === o.id) opt.selected = true;\n      sel.appendChild(opt);\n    });\n    sel.value = currentTarget || '';\n    return sel;\n  }\n\n  function buildPromoSelect(stat, currentTarget) {\n    var sel = el('select');\n    var empty = el('option', null, '（選擇宣傳企劃）');\n    empty.value = '';\n    sel.appendChild(empty);\n    promoOptions(stat).forEach(function (o) {\n      var opt = el('option', null, o.label);\n      opt.value = o.id;\n      if (currentTarget === o.id) opt.selected = true;\n      sel.appendChild(opt);\n    });\n    sel.value = currentTarget || '';\n    return sel;\n  }\n\n  function buildGigSelect(stat, idolId, currentTarget) {\n    var sel = el('select');\n    var empty = el('option', null, '（選擇外快）');\n    empty.value = '';\n    sel.appendChild(empty);\n    gigOptions(stat, idolId).forEach(function (o) {\n      var opt = el('option', null, o.label);\n      opt.value = o.id;\n      if (currentTarget === o.id) opt.selected = true;\n      sel.appendChild(opt);\n    });\n    sel.value = currentTarget || '';\n    return sel;\n  }\n\n  function buildRestSelect(currentTarget) {\n    // 休整配置下拉：顯示 名稱（N天・$一次性費用），預設選 rest_home\n    var sel = el('select');\n    var empty = el('option', null, '（選擇休整）');\n    empty.value = '';\n    sel.appendChild(empty);\n    restOptions().forEach(function (o) {\n      var opt = el('option', null, o.label);\n      opt.value = o.id;\n      if (currentTarget === o.id) opt.selected = true;\n      sel.appendChild(opt);\n    });\n    sel.value = currentTarget || '';\n    return sel;\n  }\n\n  // 宣傳對象偶像下拉（宣傳是玩家的工作，對象限已簽約偶像；v1.1.0 起）\n  function buildPromoIdolSelect(stat, currentIdol) {\n    var sel = el('select');\n    var empty = el('option', null, '（選擇對象偶像）');\n    empty.value = '';\n    sel.appendChild(empty);\n    signedIdols(stat).forEach(function (s) {\n      var opt = el('option', null, s.name);\n      opt.value = s.id;\n      if (currentIdol === s.id) opt.selected = true;\n      sel.appendChild(opt);\n    });\n    sel.value = currentIdol || '';\n    return sel;\n  }\n\n  function submitSchedule(stat, btn, err) {\n    var draft = runtime.draft;\n    if (!draft) return;\n    var today = (stat.時間 && stat.時間.當前日期) || '';\n    var executed = {};\n    resultEntries(stat.日程 && stat.日程.每日結果).forEach(function (r) { executed[r.date] = true; });\n    // 驗證多日休整連排：每個多日休整配置的後續連排天數必須為同人物同 rest_id 且在本週內\n    var restErrors = [];\n    Object.keys(draft.cells).forEach(function (key) {\n      var parts = key.split('|');\n      var date = parts[0], person = parts[1];\n      var cell = draft.cells[key];\n      if (cell.type !== '休息' || !cell.target) return;\n      var cfg = RESTS[cell.target];\n      if (!cfg || cfg.連排天數 <= 1) return;\n      for (var d = 1; d < cfg.連排天數; d += 1) {\n        var nextDate = addDays(date, d);\n        if (!nextDate || nextDate > addDays(draft.weekStart, 6)) {\n          restErrors.push(weekdayCn(date) + ' ' + person + ' 的 ' + cfg.名稱 + ' 需要連續 ' + cfg.連排天數 + ' 天且須完整落在本週');\n          break;\n        }\n        if (executed[nextDate] || (today && nextDate < today)) {\n          restErrors.push(weekdayCn(date) + ' ' + person + ' 的 ' + cfg.名稱 + ' 後續日期已執行或不可回寫');\n          break;\n        }\n        var nextCell = draft.cells[nextDate + '|' + person];\n        if (!nextCell || nextCell.type !== '休息' || nextCell.target !== cell.target) {\n          restErrors.push(weekdayCn(date) + ' ' + person + ' 的 ' + cfg.名稱 + ' 連排中斷，請補滿後續 ' + (cfg.連排天數 - 1) + ' 天');\n          break;\n        }\n      }\n    });\n    if (restErrors.length) {\n      err.textContent = restErrors.join('；');\n      err.style.display = 'block';\n      return;\n    }\n    var lines = ['提交週排程：'];\n    for (var i = 0; i < 7; i += 1) {\n      var date = addDays(draft.weekStart, i);\n      if (executed[date] || (today && date < today)) continue; // 已執行日期不提交、不可回寫\n      var cn = weekdayCn(date);\n      Object.keys(draft.cells).forEach(function (key) {\n        var parts = key.split('|');\n        if (parts[0] !== date) return;\n        var cell = draft.cells[key];\n        if (!cell.type || cell.type === UNSET) return;\n        lines.push(cn + '排程：' + parts[1] + ' ' + cell.type + ((cell.type === '正式工作' || cell.type === '課程' || cell.type === '宣傳' || cell.type === '打工' || cell.type === '休息') && cell.target ? ' ' + cell.target : ''));\n      });\n    }\n    if (lines.length === 1) {\n      err.textContent = '本週沒有任何安排可提交。';\n      err.style.display = 'block';\n      return;\n    }\n    sendCommand(lines.join('\\n'), btn, err);\n  }\n\n  // ─────────────── 渲染：邀約 ───────────────\n\n  function renderOffers(body, stat) {\n    var offers = parseRecords(stat && stat.活躍邀約)\n      .map(offerFields)\n      .filter(function (o) { return /^offer_\\w+/.test(o.id); });\n    body.appendChild(el('p', 'sgx-ph-note', '每月初刷新 5–7 份新通告；接受截止過期即失效。接受／拒絕以你的名義發送指令，由系統結算。'));\n    if (!offers.length) {\n      body.appendChild(el('p', 'sgx-ph-note', '目前沒有活躍邀約。'));\n      return;\n    }\n    offers.forEach(function (o) {\n      var card = el('div', 'sgx-ph-card');\n      card.appendChild(el('div', 'sgx-ph-sec', (o.name || o.id) + (o.entry ? '・' + o.entry : '')));\n      card.appendChild(kvRow('公司／類別', (o.company || '—') + '・' + (o.cat || '—') + (o.sub ? '・' + o.sub : '')));\n      card.appendChild(kvRow('目標偶像', personLabel(stat, o.idol)));\n      card.appendChild(kvRow('報酬／押金', '$' + fmtInt(o.pay) + '／押 $' + fmtInt(o.deposit)));\n      card.appendChild(kvRow('工作日／工期', (o.days || '?') + ' 天／最短 ' + (o.minDays || '?') + ' 天'));\n      card.appendChild(kvRow('最遲完成', o.deadline || '—'));\n      card.appendChild(kvRow('接受截止', o.acceptBy || '—'));\n      card.appendChild(kvRow('狀態', o.status));\n      if (o.status === '待決定') {\n        var row = el('div', 'sgx-ph-row');\n        var isAudition = (o.entry === '試鏡' || o.entry === '公開甄選');\n        var acc = el('button', 'sgx-ph-btn', isAudition ? '接受試鏡' : '接受');\n        acc.type = 'button';\n        listenEl(acc, 'click', function () { sendCommand('接受邀約 ' + o.id, acc); });\n        var rej = el('button', 'sgx-ph-btn sgx-ghost', '拒絕');\n        rej.type = 'button';\n        listenEl(rej, 'click', function () { sendCommand('拒絕邀約 ' + o.id, rej); });\n        row.appendChild(acc);\n        row.appendChild(rej);\n        card.appendChild(row);\n        if (isAudition) {\n          card.appendChild(el('div', 'sgx-ph-note', '試鏡型邀約：接受後到行程頁為該偶像排「正式工作」試鏡日（目標選本邀約）。'));\n        }\n      }\n      body.appendChild(card);\n    });\n  }\n\n  // ─────────────── 戀愛呈現層輔助（v0.32.1 批二） ───────────────\n\n  var NODE_KEY_WHITELIST = ['初遇','得知本名','初次約會','告白成功','交往確認','求婚','結婚','婚訊公開','未發表的歌','紀念日'];\n\n  function parseNodeString(str) {\n    var out = [];\n    String(str || '').split(/[,，]/).forEach(function (seg) {\n      seg = seg.trim();\n      if (!seg) return;\n      var p = seg.split('@');\n      if (p.length < 2) return;\n      out.push({ key: p[0].trim(), date: p[1].trim(), eventId: (p[2] || '').trim() });\n    });\n    return out;\n  }\n\n  function parseMessageQueue(str) {\n    var out = [];\n    String(str || '').split(/[,，]/).forEach(function (seg) {\n      seg = seg.trim();\n      if (!seg) return;\n      var p = seg.split('@');\n      if (p.length < 4) return;\n      out.push({\n        msgId: p[0].trim(),\n        type: p[1].trim(),\n        date: p[2].trim(),\n        eventId: p[3].trim(),\n        readDate: (p[4] || '').trim()\n      });\n    });\n    return out;\n  }\n\n  function romanceFor(stat, idolId) {\n    return (stat && stat.與玩家戀愛 && stat.與玩家戀愛[idolId]) || {};\n  }\n\n  function idolNameForRomance(stat, idolId) {\n    var idol = stat && stat.偶像 && stat.偶像[idolId];\n    return (idol && idol.公開身份 && idol.公開身份.藝名) || idolId;\n  }\n\n  function renderRomanceSection(card, stat, idolId) {\n    var r = romanceFor(stat, idolId);\n    card.appendChild(el('div', 'sgx-ph-sec', '兩人'));\n    card.appendChild(kvRow('關係狀態', r.關係狀態 || '普通關係'));\n    if (r.體諒狀態 && Number(r.體諒狀態.剩餘天數) > 0) {\n      card.appendChild(el('span', 'sgx-ph-chip', '體諒中'));\n    }\n    var nodes = parseNodeString(r.重要節點).filter(function (n) {\n      return NODE_KEY_WHITELIST.indexOf(n.key) !== -1;\n    }).sort(function (a, b) { return a.date.localeCompare(b.date); });\n    if (nodes.length) {\n      card.appendChild(el('div', 'sgx-ph-note', '足跡'));\n      nodes.forEach(function (n) {\n        card.appendChild(kvRow(n.date, n.key));\n      });\n    } else {\n      card.appendChild(el('div', 'sgx-ph-note', '還沒有留下足跡。'));\n    }\n  }\n\n  // ─────────────── 渲染：訊息 ───────────────\n\n  function renderMessages(body, stat) {\n    var romance = (stat && stat.與玩家戀愛) || {};\n    var threads = [];\n    Object.keys(romance).forEach(function (idolId) {\n      var queue = parseMessageQueue(romance[idolId] && romance[idolId].待送訊息 && romance[idolId].待送訊息.佇列);\n      var unread = 0, latest = '';\n      queue.forEach(function (m) {\n        if (!m.readDate || m.readDate === '-') unread += 1;\n        if (!latest || m.date.localeCompare(latest) > 0) latest = m.date;\n      });\n      threads.push({ id: idolId, name: idolNameForRomance(stat, idolId), queue: queue, unread: unread, latest: latest });\n    });\n    threads.sort(function (a, b) {\n      if (a.latest && b.latest) return b.latest.localeCompare(a.latest);\n      return a.latest ? -1 : (b.latest ? 1 : a.name.localeCompare(b.name));\n    });\n    if (!threads.length) {\n      body.appendChild(el('p', 'sgx-ph-note', '沒有可顯示的訊息對象。'));\n      return;\n    }\n    var threadId = runtime.messageThreadId || null;\n    if (threadId) {\n      for (var i = 0; i < threads.length; i += 1) {\n        if (threads[i].id === threadId) { renderMessageThread(body, stat, threads[i]); return; }\n      }\n    }\n    body.appendChild(el('p', 'sgx-ph-note', '點擊對話串可查看並標記已讀；回覆會提交輕互動請求，由戀愛所有者結算。'));\n    var list = el('div', 'sgx-ph-msglist');\n    threads.forEach(function (t) {\n      var row = el('div', 'sgx-ph-msgrow');\n      row.appendChild(el('span', 'sgx-ph-msgname', t.name));\n      var meta = t.latest ? (t.latest + (t.queue.length ? '・' + t.queue[t.queue.length - 1].type : '')) : '尚無訊息';\n      row.appendChild(el('span', 'sgx-ph-msgmeta', meta));\n      if (t.unread > 0) row.appendChild(el('span', 'sgx-ph-msgbadge', String(t.unread)));\n      listenEl(row, 'click', function () { runtime.messageThreadId = t.id; render(); });\n      list.appendChild(row);\n    });\n    body.appendChild(list);\n  }\n\n  function renderMessageThread(body, stat, t) {\n    var r = romanceFor(stat, t.id);\n    var back = el('button', 'sgx-ph-btn sgx-ghost sgx-ph-back', '← 返回訊息列表');\n    back.type = 'button';\n    listenEl(back, 'click', function () { runtime.messageThreadId = null; render(); });\n    body.appendChild(back);\n    body.appendChild(el('div', 'sgx-ph-sec', t.name));\n    body.appendChild(kvRow('關係狀態', r.關係狀態 || '普通關係'));\n    var queue = parseMessageQueue(r.待送訊息 && r.待送訊息.佇列);\n    if (!queue.length) {\n      body.appendChild(el('div', 'sgx-ph-note', '目前沒有訊息。'));\n      return;\n    }\n    var unreadIds = [];\n    var thread = el('div', 'sgx-ph-thread');\n    queue.forEach(function (m) {\n      var isUnread = !m.readDate || m.readDate === '-';\n      if (isUnread) unreadIds.push(m.msgId);\n      var bubble = el('div', 'sgx-ph-msgbubble' + (isUnread ? ' unread' : ''));\n      bubble.appendChild(el('div', 'sgx-ph-msgtype', m.type));\n      bubble.appendChild(el('div', 'sgx-ph-msgdate', m.date + (isUnread ? '・未讀' : '・已讀 ' + m.readDate)));\n      var actions = el('div', 'sgx-ph-row');\n      if (m.type === '主動邀約') {\n        var accept = el('button', 'sgx-ph-btn', '接受約會');\n        accept.type = 'button';\n        listenEl(accept, 'click', function () { sendCommand('接受約會 ' + t.id + ':' + m.msgId, accept); });\n        var decline = el('button', 'sgx-ph-btn sgx-ghost', '婉拒');\n        decline.type = 'button';\n        listenEl(decline, 'click', function () { sendCommand('婉拒約會 ' + t.id + ':' + m.msgId, decline); });\n        actions.appendChild(accept);\n        actions.appendChild(decline);\n      } else {\n        var reply = el('button', 'sgx-ph-btn', '回覆');\n        reply.type = 'button';\n        listenEl(reply, 'click', function () { sendCommand('回覆訊息 ' + t.id + ':' + m.msgId, reply); });\n        actions.appendChild(reply);\n      }\n      bubble.appendChild(actions);\n      thread.appendChild(bubble);\n    });\n    body.appendChild(thread);\n    var unreadSig = t.id + ':' + unreadIds.join(',');\n    if (unreadIds.length > 0 && runtime.readSentForThread !== unreadSig) {\n      runtime.readSentForThread = unreadSig;\n      sendCommand('已讀訊息 ' + t.id + ':' + unreadIds.join(','));\n      body.appendChild(el('div', 'sgx-ph-note', '已提交 ' + unreadIds.length + ' 則已讀請求。'));\n    }\n  }\n\n  // ─────────────── 渲染：新聞 ───────────────\n\n  function renderNewsPage(body, stat) {\n    var news = (stat || {}).娛樂圈新聞 || {};\n    body.appendChild(el('p', 'sgx-ph-note', '新聞頁只讀顯示已固定批次與趨勢；不生成、不重抽。批次：' + (String(news.最近週新聞批次_id || '') || '尚未生成')));\n    // v2.10.1：批次尚未固定時給一個補請求鈕（介面只送請求，不寫 MVU；生成仍由規則於日初執行）。v0.44 施工一度遺失，reviewer+夾具 T5 抓回。\n    if (!String(news.最近週新聞批次_id || '')) {\n      var fixRow = el('div', 'sgx-ph-row');\n      var fixBtn = el('button', 'sgx-ph-btn sgx-ghost', '請結算本週新聞批次');\n      fixBtn.type = 'button';\n      listenEl(fixBtn, 'click', function () { sendCommand('結算本週新聞批次', fixBtn); });\n      fixRow.appendChild(fixBtn);\n      body.appendChild(fixRow);\n      body.appendChild(el('div', 'sgx-ph-note', '本週批次尚未固定。正常情況下會在日初自動固定；長時間仍為空時可按上鈕補請求一次。'));\n    }\n    var normalNewsFields = ['id','from','to','cat','title','sum','kind','trend'];\n    var breakingNewsFields = ['id','from','to','src','cat','title','sum','kind','trend','mod','resp'];\n    function newsRowMap(fields, rec) {\n      var p = String(rec || '').split('|');\n      var o = {};\n      fields.forEach(function(f, i) { o[f] = (p[i] || '').trim(); });\n      return o;\n    }\n    function dateRangeText(o) {\n      var a = (o.from || '').trim();\n      var b = (o.to || '').trim();\n      if (!a && !b) return '';\n      if (a && b && a !== b) return a.slice(5) + '~' + b.slice(5);\n      if (a) return a.slice(5);\n      if (b) return b.slice(5);\n      return '';\n    }\n    function rows(raw, fields, title, fmt) {\n      var sec = el('div', 'sgx-ph-card');\n      sec.appendChild(el('div', 'sgx-ph-sec', title));\n      var items = String(raw || '').split(';').map(function (t) { return t.trim(); }).filter(Boolean);\n      if (!items.length) { sec.appendChild(el('p', 'sgx-ph-note', '（無）')); body.appendChild(sec); return; }\n      items.forEach(function (rec) {\n        var p = String(rec || '').split('|');\n        var fieldsToUse = fields;\n        if (p.length === 6 && fields === normalNewsFields) fieldsToUse = ['id','cat','title','sum','kind','trend'];\n        if (p.length === 9 && fields === breakingNewsFields) fieldsToUse = ['id','src','cat','title','sum','kind','trend','mod','resp'];\n        var o = newsRowMap(fieldsToUse, rec);\n        var row = el('div', 'sgx-ph-day');\n        var range = dateRangeText(o);\n        var r = fmt(o, range);\n        row.appendChild(el('div', 'sgx-ph-dayhead', r[0]));\n        row.appendChild(el('div', 'sgx-ph-note', r[1]));\n        sec.appendChild(row);\n      });\n      body.appendChild(sec);\n    }\n    rows(news.當週突發新聞, breakingNewsFields, '突發新聞', function (o, range) {\n      var extra = (o.resp && o.resp !== '-' ? '已回應：' + o.resp : '未回應');\n      var head = (o.cat ? '【' + o.cat + '】' : '') + o.title;\n      var sub = [o.sum, extra, range].filter(Boolean).join('・');\n      return [head, sub];\n    });\n    rows(news.當週普通新聞, normalNewsFields, '本週新聞', function (o, range) {\n      var head = (o.cat ? '【' + o.cat + '】' : '') + o.title;\n      var sub = [o.sum, range].filter(Boolean).join('・');\n      return [head, sub];\n    });\n    rows(news.活躍趨勢, ['id', 'src', 'from', 'to', 'offer', 'market', 'promo', 'name', 'rel'], '生效趨勢', function (o) {\n      return ['趨勢 ' + (o.name || o.id), (o.from || '?') + ' ～ ' + (o.to || '?') + '・詳見系統結算'];\n    });\n  }\n\n  // ─────────────── 渲染：任務 ───────────────\n\n  function questLogRecords(stat) {\n    var raw = String(((stat || {}).任務 || {}).任務日誌 || '');\n    var map = {};\n    raw.split(',').forEach(function (rec) {\n      rec = rec.trim();\n      if (!rec) return;\n      var p = rec.split('@');\n      if (p.length < 2) return;\n      map[p[0].trim()] = { state: (p[1] || '').trim(), doneDate: (p[4] || '').trim() };\n    });\n    return map;\n  }\n\n  function renderTasks(body, stat) {\n    var tasks = TASKS || {};\n    var log = questLogRecords(stat);\n    body.appendChild(el('p', 'sgx-ph-note', '任務頁只讀顯示；解鎖與完成由「核心規則-任務」檢查點交易處理，本頁不寫入任何變量。'));\n\n    var main = el('div', 'sgx-ph-card');\n    main.appendChild(el('div', 'sgx-ph-sec', '主線'));\n    var ids = Object.keys(tasks).filter(function (k) { return tasks[k] && tasks[k].類型 === '主線' && tasks[k].啟用 !== false; });\n    var byPre = {};\n    ids.forEach(function (k) { byPre[(tasks[k].前置任務_ids || [])[0] || ''] = k; });\n    var ordered = [];\n    var cur = byPre[''];\n    var guard = 0;\n    while (cur && guard < 50) { ordered.push(cur); cur = byPre[cur]; guard += 1; }\n    if (ordered.length !== ids.length) ordered = ids.sort();\n    ordered.forEach(function (k) {\n      var t = tasks[k];\n      var rec = log[k];\n      var row = el('div', 'sgx-ph-day');\n      if (rec && rec.state === '已完成') {\n        row.appendChild(el('div', 'sgx-ph-dayhead', t.顯示名稱 || k));\n        row.appendChild(el('div', 'sgx-ph-note', '已完成' + (rec.doneDate && rec.doneDate !== '-' ? '・' + rec.doneDate : '')));\n      } else if (rec && rec.state === '進行中') {\n        row.appendChild(el('div', 'sgx-ph-dayhead', t.顯示名稱 || k));\n        row.appendChild(el('div', 'sgx-ph-note', '進行中・' + (t.簡介 || '')));\n      } else if (rec && rec.state === '已失敗') {\n        row.appendChild(el('div', 'sgx-ph-dayhead', t.顯示名稱 || k));\n        row.appendChild(el('div', 'sgx-ph-note', '已失敗'));\n      } else {\n        row.appendChild(el('div', 'sgx-ph-dayhead', '???'));\n        row.appendChild(el('div', 'sgx-ph-note', '後續階段（前置未完成，內容保密）'));\n      }\n      main.appendChild(row);\n    });\n    body.appendChild(main);\n\n    var biz = el('div', 'sgx-ph-card');\n    biz.appendChild(el('div', 'sgx-ph-sec', '進行中事務'));\n    var items = [];\n    var compRaw = String((((stat || {}).公司 || {}).company_player || {}).活躍任務 || '');\n    compRaw.split(';').forEach(function (rec) {\n      rec = rec.trim();\n      if (!rec) return;\n      var p = rec.split('@');\n      if (p.length < 2) return;\n      var id = (p[0] || '').trim();\n      var kind = id.indexOf('debut_prep_') === 0 ? '出道準備' : id.indexOf('transfer_') === 0 ? '轉會協商' : id.indexOf('renew_') === 0 ? '續約預警' : id.indexOf('news_') === 0 ? '新聞後續' : '公司事務';\n      items.push({ label: kind, state: (p[1] || '').trim(), next: (p[3] || '').trim(), needInput: (p[5] || '').trim() });\n    });\n    var rom = (stat || {}).與玩家戀愛 || {};\n    Object.keys(rom).forEach(function (iid) {\n      var raw = String((rom[iid] || {}).活躍任務 || '').trim();\n      if (!raw) return;\n      var p = raw.split('@');\n      if (p.length < 2) return;\n      items.push({ label: '關係・' + personLabel(stat, iid), state: (p[1] || '').trim(), next: (p[3] || '').trim(), needInput: (p[5] || '').trim() });\n    });\n    if (!items.length) {\n      biz.appendChild(el('p', 'sgx-ph-note', '目前沒有進行中的事務。'));\n    } else {\n      items.forEach(function (it) {\n        var row = el('div', 'sgx-ph-day');\n        row.appendChild(el('div', 'sgx-ph-dayhead', it.label));\n        var note = (it.state || '進行中') + (it.next && it.next !== '-' ? '・下一步：' + it.next : '') + (it.needInput && it.needInput !== '-' && it.needInput !== '否' ? '・需要你的決定' : '');\n        row.appendChild(el('div', 'sgx-ph-note', note));\n        biz.appendChild(row);\n      });\n    }\n    body.appendChild(biz);\n  }\n\n  // ─────────────── 渲染：成就 ───────────────\n\n  function renderAchievements(body, stat) {\n    var achRoot = (stat && stat.成就) || {};\n    var unlockedRaw = String(achRoot.已解鎖 || '');\n    var unlockedSet = {};\n    unlockedRaw.split(',').forEach(function (rec) {\n      rec = rec.trim();\n      if (!rec) return;\n      var p = rec.split('@');\n      if (p.length < 2) return;\n      unlockedSet[(p[0].trim() + '@' + p[1].trim())] = true;\n    });\n    var achievements = ACHIEVEMENTS || {};\n    var keys = Object.keys(achievements).sort();\n    if (!keys.length) {\n      body.appendChild(el('p', 'sgx-ph-note', '成就目錄尚未載入。'));\n      return;\n    }\n    body.appendChild(el('p', 'sgx-ph-note', '成就頁只讀顯示，不觸發解鎖或獎勵；解鎖由「核心規則-成就」檢查點交易處理。'));\n    var groupTitles = { 偶像: '偶像成就', 公司: '公司成就', 全局: '全局成就' };\n    ['偶像', '公司', '全局'].forEach(function (scopeKey) {\n      var scopeKeys = keys.filter(function (k) { return achievements[k].作用域 === scopeKey; });\n      if (!scopeKeys.length) return;\n      var sec = el('div', 'sgx-ph-card');\n      sec.appendChild(el('div', 'sgx-ph-sec', groupTitles[scopeKey]));\n      scopeKeys.forEach(function (k) {\n        var a = achievements[k];\n        var visibility = a.可見性 || '公開';\n        var isUnlocked = false;\n        var unlockLabel = '';\n        if (scopeKey === '偶像') {\n          var allIdols = (stat && stat.偶像) || {};\n          Object.keys(allIdols).forEach(function (id) {\n            if (unlockedSet[k + '@' + id]) {\n              isUnlocked = true;\n              unlockLabel = (allIdols[id] && allIdols[id].公開身份 && allIdols[id].公開身份.藝名) || id;\n            }\n          });\n        } else if (scopeKey === '公司') {\n          if (unlockedSet[k + '@company_player']) { isUnlocked = true; unlockLabel = '玩家公司'; }\n        } else {\n          if (unlockedSet[k + '@global']) { isUnlocked = true; unlockLabel = '全局'; }\n        }\n        var name, note;\n        if (isUnlocked) {\n          name = a.名稱 || k;\n          note = (unlockLabel ? '由 ' + unlockLabel + ' 解鎖' : '已解鎖');\n        } else if (visibility === '公開') {\n          name = a.名稱 || k;\n          note = '尚未解鎖';\n        } else if (visibility === '提示') {\n          name = a.名稱 || k;\n          note = '條件待發掘';\n        } else {\n          name = '???';\n          note = '隱藏成就';\n        }\n        var row = el('div', 'sgx-ph-day');\n        row.appendChild(el('div', 'sgx-ph-dayhead', name));\n        row.appendChild(el('div', 'sgx-ph-note', (a.分組 || '其他') + '・' + note));\n        sec.appendChild(row);\n      });\n      body.appendChild(sec);\n    });\n  }\n  // ─────────────── 渲染：偶像 ───────────────\n\n  function renderIdols(body, stat) {\n    var idols = signedIdols(stat);\n    if (!idols.length) {\n      body.appendChild(el('p', 'sgx-ph-note', '尚未簽約任何偶像。'));\n      return;\n    }\n    idols.forEach(function (s) {\n      var card = el('div', 'sgx-ph-card');\n      card.appendChild(el('div', 'sgx-ph-sec', s.name + '（' + s.id + '）'));\n      var pub = s.data.公開身份 || {};\n      var mind = s.data.身心狀態 || {};\n      var skill = s.data.專業能力 || {};\n      card.appendChild(kvRow('狀態', (pub.事業狀態 || '未出道') + '・' + (mind.健康狀態 || '健康') + (num(mind.養病剩餘天數) !== '0' ? '・養病剩 ' + num(mind.養病剩餘天數) + ' 天' : '')));\n      card.appendChild(kvRow('身心', '疲勞 ' + num(mind.疲勞) + '・壓力 ' + num(mind.壓力) + '・動力 ' + num(mind.動力) + '・體質 ' + num(mind.體質)));\n      var bar = el('div', 'sgx-ph-bar');\n      ['歌唱', '舞蹈', '演技', '舞台表現', '鏡頭感', '綜藝口才', '創作', '形象管理', '體能', '專業素養'].forEach(function (k) {\n        bar.appendChild(el('span', 'sgx-ph-baritem', k + ' ' + num(skill[k])));\n      });\n      card.appendChild(bar);\n      renderRomanceSection(card, stat, s.id);\n      body.appendChild(card);\n    });\n  }\n\n  // ─────────────── 渲染：地圖 ───────────────\n\n  function renderMap(body, stat) {\n    body.appendChild(el('p', 'sgx-ph-note', '外部偶像工作日不可偶遇（在所屬公司或工作現場）；休息日在其常駐公共場所可偶遇。實際在場以系統推導為準。'));\n    var locSec = el('div', 'sgx-ph-card');\n    locSec.appendChild(el('div', 'sgx-ph-sec', '公共場所'));\n    MAP_LOCS.forEach(function (loc) {\n      var card = el('div', 'sgx-ph-day');\n      card.appendChild(el('div', 'sgx-ph-dayhead', loc.name));\n      card.appendChild(el('div', 'sgx-ph-note', loc.desc));\n      var hint = loc.idols.map(function (id) { return personLabel(stat, id); }).join('、');\n      card.appendChild(el('div', 'sgx-ph-readonly', '休息日常駐：' + hint));\n      var row = el('div', 'sgx-ph-row');\n      var go = el('button', 'sgx-ph-btn sgx-ghost', '前往' + loc.name);\n      go.type = 'button';\n      listenEl(go, 'click', function () { sendCommand('前往 ' + loc.id + '（' + loc.name + '）', go); });\n      row.appendChild(go);\n      card.appendChild(row);\n      locSec.appendChild(card);\n    });\n    body.appendChild(locSec);\n\n    var agSec = el('div', 'sgx-ph-card');\n    agSec.appendChild(el('div', 'sgx-ph-sec', '外部公司（拜訪需正當理由）'));\n    MAP_AGENCIES.forEach(function (ag) {\n      var card = el('div', 'sgx-ph-day');\n      card.appendChild(el('div', 'sgx-ph-dayhead', ag.name));\n      card.appendChild(el('div', 'sgx-ph-note', ag.desc));\n      var row = el('div', 'sgx-ph-row');\n      var go = el('button', 'sgx-ph-btn sgx-ghost', '拜訪' + ag.name);\n      go.type = 'button';\n      listenEl(go, 'click', function () { sendCommand('拜訪 ' + ag.id + '（' + ag.name + '）', go); });\n      row.appendChild(go);\n      card.appendChild(row);\n      agSec.appendChild(card);\n    });\n    body.appendChild(agSec);\n\n    var prodSec = el('div', 'sgx-ph-card');\n    prodSec.appendChild(el('div', 'sgx-ph-sec', '製作與合作方（拜訪洽談工作，每家 14 天冷卻）'));\n    MAP_PRODUCERS.forEach(function (ag) {\n      var card = el('div', 'sgx-ph-day');\n      card.appendChild(el('div', 'sgx-ph-dayhead', ag.name));\n      card.appendChild(el('div', 'sgx-ph-note', ag.desc));\n      var row = el('div', 'sgx-ph-row');\n      var go = el('button', 'sgx-ph-btn sgx-ghost', '拜訪' + ag.name + '洽談');\n      go.type = 'button';\n      listenEl(go, 'click', function () { sendCommand('拜訪 ' + ag.id + '（' + ag.name + '）洽談工作', go); });\n      row.appendChild(go);\n      card.appendChild(row);\n      prodSec.appendChild(card);\n    });\n    body.appendChild(prodSec);\n  }\n\n  // ─────────────── 送出（bridge → triggerSlash 主路徑，宿主發送框退回） ───────────────\n\n  function sendCommand(text, btn, err) {\n    if (btn) btn.disabled = true;\n    var sent = false;\n    var b = bridge();\n    if (b && typeof b.send === 'function') {\n      try { sent = !!b.send(text); } catch (e) { sent = false; }\n    }\n    if (!sent) {\n      var ta = document.getElementById('send_textarea');\n      var sendBtn = document.getElementById('send_but');\n      if (ta && sendBtn) {\n        if (ta.value && ta.value.trim() !== '') {\n          if (err) { err.textContent = '輸入框已有內容，請先清空（或手動送出）後再操作。'; err.style.display = 'block'; }\n          if (btn) btn.disabled = false;\n          return false;\n        }\n        ta.value = text;\n        try { ta.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { }\n        try { sendBtn.click(); sent = true; } catch (e) { }\n      }\n    }\n    if (!sent) {\n      if (btn) btn.disabled = false;\n      if (err) { err.textContent = '自動發送不可用，請手動輸入：' + text; err.style.display = 'block'; }\n      return false;\n    }\n    if (btn) { var bb = btn; setTimeout(function () { if (!onDestroyedGuard()) bb.disabled = false; }, 800); }\n    return true;\n  }\n\n\n  // ─────────────── 外殼：開關與渲染 ───────────────\n\n  function isOpen() { return modal.hidden !== true; }\n\n  // 視窗尺寸：優先用 visualViewport（鍵盤彈出時才準），退回 innerWidth/Height，再退回 documentElement。\n  function viewport() {\n    var w = 0, h = 0, ox = 0, oy = 0;\n    try {\n      var vv = window.visualViewport;\n      if (vv && vv.width > 0 && vv.height > 0) {\n        w = vv.width; h = vv.height;\n        ox = vv.offsetLeft || 0; oy = vv.offsetTop || 0;\n      }\n    } catch (e) { }\n    if (!w || !h) { w = window.innerWidth || 0; h = window.innerHeight || 0; }\n    if (!w || !h) {\n      var de = document.documentElement;\n      w = (de && de.clientWidth) || 360;\n      h = (de && de.clientHeight) || 640;\n    }\n    return { w: Math.round(w), h: Math.round(h), ox: Math.round(ox), oy: Math.round(oy) };\n  }\n\n  // 幾何全部以像素寫死：不依賴 inset / % / vh / transform，避免任一項在宿主環境算錯就整個歪掉。\n  function layout() {\n    var v = viewport();\n    var margin = v.w < 420 ? 8 : 16;\n    var w = Math.max(240, Math.min(420, v.w - margin * 2));\n    var h = Math.max(240, Math.min(680, v.h - margin * 2));\n    var left = v.ox + Math.max(0, Math.round((v.w - w) / 2));\n    var top = v.oy + Math.max(0, Math.round((v.h - h) / 2));\n    panel.style.setProperty('position', 'fixed', 'important');\n    panel.style.setProperty('transform', 'none', 'important');\n    panel.style.setProperty('max-width', 'none', 'important');\n    panel.style.setProperty('max-height', 'none', 'important');\n    panel.style.setProperty('right', 'auto', 'important');\n    panel.style.setProperty('bottom', 'auto', 'important');\n    panel.style.setProperty('left', left + 'px', 'important');\n    panel.style.setProperty('top', top + 'px', 'important');\n    panel.style.setProperty('width', w + 'px', 'important');\n    panel.style.setProperty('height', h + 'px', 'important');\n    backdrop.style.setProperty('position', 'fixed', 'important');\n    backdrop.style.setProperty('left', v.ox + 'px', 'important');\n    backdrop.style.setProperty('top', v.oy + 'px', 'important');\n    backdrop.style.setProperty('width', v.w + 'px', 'important');\n    backdrop.style.setProperty('height', v.h + 'px', 'important');\n    return panel.getBoundingClientRect();\n  }\n\n  function ensurePanelSize() { return layout(); }\n\n  var lastOpenAt = 0;\n\n  function setOpen(open) {\n    if (runtime.destroyed) return;\n    var next = !!open;\n    // 與載入器同一道保護：剛打開就被要求關閉，視為重複訊號而非使用者意圖。\n    if (!next && (Date.now() - lastOpenAt) < 500) {\n      var bg = bridge();\n      if (bg && typeof bg.reportDupClose === 'function') { try { bg.reportDupClose(); } catch (e) { } }\n      return;\n    }\n    if (next) lastOpenAt = Date.now();\n    modal.hidden = !next;\n    root.setAttribute('data-sgx-open', next ? 'true' : 'false');\n    try { window.dispatchEvent(new CustomEvent('sgx-phone-open-changed', { detail: { open: next } })); } catch (e) { }\n    if (next) {\n      layout();\n      setTimeout(function () { if (!runtime.destroyed && isOpen()) layout(); }, 150);\n      refresh();\n      // 自我量測：面板若打開後仍是 0 尺寸，代表掛載位置或樣式被環境擋掉，\n      // 立刻回報載入器由它做可見的錯誤提示，而不是靜默無反應。\n      setTimeout(function () {\n        if (runtime.destroyed || !isOpen()) return;\n        var r = ensurePanelSize();\n        if (r.width < 2 || r.height < 2) {\n          var b = bridge();\n          if (b && typeof b.reportInvisible === 'function') {\n            try { b.reportInvisible('面板尺寸為 0（寬' + Math.round(r.width) + '×高' + Math.round(r.height) + '）'); } catch (e) { }\n          }\n        } else {\n          var b2 = bridge();\n          if (b2 && typeof b2.reportVisible === 'function') { try { b2.reportVisible(); } catch (e) { } }\n        }\n      }, 80);\n    }\n  }\n\n  function render() {\n    if (runtime.destroyed || !panel) return;\n    var stat = runtime.stat;\n    panel.textContent = '';\n\n    var head = el('div', 'sgx-ph-head');\n    head.appendChild(el('span', 'sgx-ph-title', '小手機'));\n    // v2.14.0 §2.3：版本戳同格附來源標記（每次 render 現讀現組，不進快取）——\n    // remote 成功 v<VER> REMOTE @<tag>（tag 缺失降為 v<VER> REMOTE）；降級／烘焙 v<VER> BAKED；屬性不存在維持 v<VER>\n    var hudOriginAttr = root.getAttribute('data-sgx-hud-origin');\n    var verText = 'v' + VERSION;\n    if (hudOriginAttr === 'remote') {\n      var hudTagAttr = root.getAttribute('data-sgx-hud-tag');\n      verText += hudTagAttr ? ' REMOTE @' + hudTagAttr : ' REMOTE';\n    } else if (hudOriginAttr === 'baked') {\n      verText += ' BAKED';\n    }\n    head.appendChild(el('span', 'sgx-ph-ver', verText));\n    var closeBtn = el('button', 'sgx-ph-close', '✕');\n    closeBtn.type = 'button';\n    closeBtn.setAttribute('aria-label', '關閉小手機');\n    listenEl(closeBtn, 'click', function (ev) { ev.stopPropagation(); setOpen(false); });\n    head.appendChild(closeBtn);\n    panel.appendChild(head);\n\n    if (!stat || !stat.玩家 || !stat.玩家.難度) {\n      var body1 = el('div', 'sgx-ph-body');\n      renderOpening(body1, stat);\n      panel.appendChild(body1);\n      return;\n    }\n\n    var tabs = el('div', 'sgx-ph-tabs');\n    [['home', '首頁'], ['schedule', '行程'], ['calendar', '月曆'], ['offers', '邀約'], ['map', '地圖'], ['tasks', '任務'], ['news', '新聞'], ['messages', '訊息'], ['achievements', '成就'], ['idols', '偶像']].forEach(function (t) {\n      var b = el('button', 'sgx-ph-tab', t[1]);\n      b.type = 'button';\n      b.setAttribute('aria-selected', runtime.tab === t[0] ? 'true' : 'false');\n      listenEl(b, 'click', function () { runtime.tab = t[0]; render(); });\n      tabs.appendChild(b);\n    });\n    panel.appendChild(tabs);\n\n    var body = el('div', 'sgx-ph-body');\n    panel.appendChild(body);\n    if (runtime.tab === 'home') renderHome(body, stat);\n    else if (runtime.tab === 'schedule') renderSchedule(body, stat);\n    else if (runtime.tab === 'calendar') renderCalendar(body, stat);\n    else if (runtime.tab === 'offers') renderOffers(body, stat);\n    else if (runtime.tab === 'map') renderMap(body, stat);\n    else if (runtime.tab === 'tasks') renderTasks(body, stat);\n    else if (runtime.tab === 'news') renderNewsPage(body, stat);\n    else if (runtime.tab === 'messages') renderMessages(body, stat);\n    else if (runtime.tab === 'achievements') renderAchievements(body, stat);\n    else renderIdols(body, stat);\n  }\n\n  \n  // ─────────────── 渲染：月曆 ───────────────\n\n  function renderCalendar(body, stat) {\n    var time = stat.時間 || {};\n    var today = time.當前日期 || '';\n    var company = (stat.公司 && stat.公司.company_player) || {};\n    var idols = stat.偶像 || {};\n    var storyDeadline = (stat.主綫 || {}).截止日期 || '';\n    var blockNode = time.當前阻塞節點 || '';\n    var contracts = String(company.有效藝人合約 || '');\n    var activeTasks = String(company.活躍任務 || '');\n    var confirmed = String((stat.日程 || {}).已確認排程 || '');\n    var results = String((stat.日程 || {}).每日結果 || '');\n    var offers = String(stat.活躍邀約 || '');\n    var jobs = String(stat.進行中工作 || '');\n    var pending = String(stat.待定案作品 || '');\n\n    var marks = {};\n    function addMark(date, type, label) {\n      if (!date || !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) return;\n      if (!marks[date]) marks[date] = [];\n      marks[date].push({ type: type, label: label });\n    }\n    function addDays(base, offset) {\n      var b = new Date(base + 'T00:00:00');\n      b.setDate(b.getDate() + offset);\n      var yy = b.getFullYear();\n      var mm = b.getMonth() + 1;\n      var dd = b.getDate();\n      return yy + '-' + (mm < 10 ? '0' + mm : mm) + '-' + (dd < 10 ? '0' + dd : dd);\n    }\n\n    confirmed.split(/[;；]/).forEach(function (rec) {\n      var p = rec.split('|');\n      if (p.length < 4) return;\n      addMark(p[0].trim(), 'schedule', personLabel(stat, p[1].trim()) + '·' + p[2].trim());\n    });\n    results.split(/[;；]/).forEach(function (rec) {\n      var p = rec.split('|');\n      if (p.length < 2) return;\n      addMark(p[0].trim(), 'result', '已執行');\n    });\n    offers.split(/[;；]/).forEach(function (rec) {\n      var p = rec.split('|');\n      if (p.length < 15) return;\n      addMark(p[12].trim(), 'offer', '邀約最遲完成');\n      addMark(p[13].trim(), 'offer', '邀約截止');\n    });\n    jobs.split(/[;；]/).forEach(function (rec) {\n      var p = rec.split('|');\n      if (p.length < 10) return;\n      addMark(p[7].trim(), 'job-start', '開工');\n      addMark(p[8].trim(), 'job-deadline', '工作截止');\n    });\n    pending.split(/[;；]/).forEach(function (rec) {\n      var p = rec.split('|');\n      if (p.length < 8) return;\n      addMark(p[6].trim(), 'work', '市場結算');\n    });\n    contracts.split(/[;；]/).forEach(function (rec) {\n      rec = rec.trim();\n      if (!rec) return;\n      var colon = rec.indexOf(':');\n      if (colon === -1) return;\n      var idolId = rec.slice(0, colon).trim();\n      var fields = rec.slice(colon + 1).split('|');\n      if (fields.length < 4) return;\n      addMark(fields[3].trim(), 'contract', personLabel(stat, idolId) + '合約到期');\n    });\n    activeTasks.split(/[;；]/).forEach(function (rec) {\n      var p = rec.split('@');\n      if (p.length < 2) return;\n      var tid = p[0].trim();\n      var m = /^renew_(idol_\\d+)_(\\d{4}-\\d{2}-\\d{2})$/.exec(tid);\n      if (m) addMark(m[2], 'renew', personLabel(stat, m[1]) + '續約預警');\n    });\n    Object.keys(idols).forEach(function (idolId) {\n      var days = Number((idols[idolId].身心狀態 || {}).養病剩餘天數);\n      if (days > 0 && today) {\n        for (var i = 0; i < days; i += 1) addMark(addDays(today, i), 'sick', personLabel(stat, idolId) + '養病');\n      }\n    });\n    if (blockNode) {\n      var bp = blockNode.split('|');\n      if (bp.length >= 4) addMark(bp[3].trim(), 'block', '阻塞');\n    }\n    if (storyDeadline) addMark(storyDeadline, 'story', '主綫截止');\n    var curYear = today ? Number(today.slice(0, 4)) : new Date().getFullYear();\n    if (!curYear || isNaN(curYear)) curYear = 2026;\n    (AWARDS || []).forEach(function (a) {\n      addMark(curYear + '-' + a.提名日, 'award-nom', a.name + '提名');\n      addMark(curYear + '-' + a.頒獎日, 'award-award', a.name + '頒獎');\n    });\n\n    var viewedMonth = runtime.calendarMonth || today.slice(0, 7);\n    if (!/^\\d{4}-\\d{2}$/.test(viewedMonth)) viewedMonth = today.slice(0, 7) || '2026-03';\n    var y = Number(viewedMonth.slice(0, 4));\n    var mo = Number(viewedMonth.slice(5, 7));\n    var monthFirst = new Date(y, mo - 1, 1);\n    var mondayOffset = (monthFirst.getDay() + 6) % 7;\n    var gridStart = new Date(y, mo - 1, 1 - mondayOffset);\n\n    var header = el('div', 'sgx-ph-row');\n    var prevBtn = el('button', 'sgx-ph-btn sgx-ghost', '◀');\n    prevBtn.type = 'button';\n    var title = el('span', 'sgx-ph-title', y + '年' + mo + '月');\n    var nextBtn = el('button', 'sgx-ph-btn sgx-ghost', '▶');\n    nextBtn.type = 'button';\n    listenEl(prevBtn, 'click', function () {\n      var nm = mo - 1, ny = y;\n      if (nm < 1) { nm = 12; ny -= 1; }\n      runtime.calendarMonth = String(ny) + '-' + (nm < 10 ? '0' + nm : nm);\n      render();\n    });\n    listenEl(nextBtn, 'click', function () {\n      var nm = mo + 1, ny = y;\n      if (nm > 12) { nm = 1; ny += 1; }\n      runtime.calendarMonth = String(ny) + '-' + (nm < 10 ? '0' + nm : nm);\n      render();\n    });\n    header.appendChild(prevBtn);\n    header.appendChild(title);\n    header.appendChild(nextBtn);\n    body.appendChild(header);\n\n    body.appendChild(el('p', 'sgx-ph-note', '月曆只讀顯示；標記來自已確認排程、每日結果、期限、合約、任務、養病、阻塞節點與固定日曆，無資料則留白。'));\n\n    var grid = el('div', 'sgx-ph-cal-grid');\n    ['週一', '週二', '週三', '週四', '週五', '週六', '週日'].forEach(function (wd) {\n      grid.appendChild(el('div', 'sgx-ph-cal-weekday', wd));\n    });\n    function fmtDate(d) {\n      var yy = d.getFullYear();\n      var mm = d.getMonth() + 1;\n      var dd = d.getDate();\n      return yy + '-' + (mm < 10 ? '0' + mm : mm) + '-' + (dd < 10 ? '0' + dd : dd);\n    }\n    for (var i = 0; i < 42; i += 1) {\n      var d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);\n      var ds = fmtDate(d);\n      var cell = el('div', 'sgx-ph-cal-day');\n      if (ds.slice(0, 7) !== viewedMonth) cell.classList.add('sgx-ph-cal-out');\n      if (ds === today) cell.classList.add('sgx-ph-cal-today');\n      cell.appendChild(el('div', 'sgx-ph-cal-daynum', String(d.getDate())));\n      var hasSchedule = marks[ds] && marks[ds].some(function (m) { return m.type === 'schedule'; });\n      var hasResult = marks[ds] && marks[ds].some(function (m) { return m.type === 'result'; });\n      if (hasSchedule && !hasResult) cell.classList.add('sgx-ph-cal-pending');\n      else if (hasResult) cell.classList.add('sgx-ph-cal-done');\n      var list = el('div', 'sgx-ph-cal-marks');\n      var dayMarks = marks[ds] || [];\n      dayMarks.slice(0, 4).forEach(function (m) {\n        list.appendChild(el('span', 'sgx-ph-cal-mark sgx-ph-cal-' + m.type, m.label));\n      });\n      if (dayMarks.length > 4) list.appendChild(el('span', 'sgx-ph-cal-more', '+' + (dayMarks.length - 4)));\n      cell.appendChild(list);\n      grid.appendChild(cell);\n    }\n    body.appendChild(grid);\n  }\n\n  function readStat() {\n    var b = bridge();\n    if (!b || typeof b.getStat !== 'function') return null;\n    try { return b.getStat(); } catch (e) { return null; }\n  }\n\n  var doRefresh = debounce('refresh', function () {\n    if (runtime.destroyed) return;\n    runtime.stat = readStat();\n    if (runtime.stat && !runtime.draft) loadDraft(runtime.stat);\n    render();\n    bridgeOpeningFrames();\n  }, 250);\n\n  function refresh() { doRefresh(); }\n\n  // ─────────────── 對外介面（由載入器呼叫） ───────────────\n\n  root.__sgxRender = function () { refresh(); };\n  root.__sgxBridgeFrames = function () { try { bridgeOpeningFrames(); } catch (e) { } };\n  root.__sgxIsOpen = isOpen;\n  root.__sgxSetOpen = function (open) {\n    if (open === undefined || open === null) setOpen(!isOpen());\n    else setOpen(open);\n  };\n  root.__sgxDestroy = function () {\n    runtime.destroyed = true;\n    Object.keys(runtime.timers).forEach(function (k) { clearTimeout(runtime.timers[k]); });\n    stops.splice(0).forEach(function (fn) { try { fn(); } catch (e) { } });\n    try { delete root.__sgxSetOpen; } catch (e) { }\n    root.__sgxInit = false;\n  };\n\n  (function bindBackdrop() {\n    backdrop.addEventListener('click', function () { setOpen(false); });\n  })();\n\n  (function bindViewport() {\n    var onResize = debounce('vp', function () { if (isOpen()) { layout(); render(); } }, 180);\n    window.addEventListener('resize', onResize);\n    stops.push(function () { window.removeEventListener('resize', onResize); });\n    window.addEventListener('orientationchange', onResize);\n    stops.push(function () { window.removeEventListener('orientationchange', onResize); });\n    try {\n      var vv = window.visualViewport;\n      if (vv) {\n        var onVV = debounce('vv', function () { if (isOpen()) layout(); }, 120);\n        vv.addEventListener('resize', onVV);\n        vv.addEventListener('scroll', onVV);\n        stops.push(function () { vv.removeEventListener('resize', onVV); vv.removeEventListener('scroll', onVV); });\n      }\n    } catch (e) { }\n    var onKey = function (ev) { if (ev.key === 'Escape' && isOpen()) setOpen(false); };\n    document.addEventListener('keydown', onKey);\n    stops.push(function () { document.removeEventListener('keydown', onKey); });\n  })();\n\n  runtime.stat = readStat();\n  if (runtime.stat) loadDraft(runtime.stat);\n  render();\n  bridgeOpeningFrames();\n  log('HUD v' + VERSION + ' 就緒');\n})();\n\n  <\/script>\n</div>\n`;

  var helperWindow = window;

  function looksLikeTavernWindow(w) {
    try {
      if (!w || !w.document || !w.document.body) return false;
      if (w.SillyTavern || w.TavernHelper) return true;
      if (w.document.getElementById('send_textarea')) return true;
      if (w.document.getElementById('chat')) return true;
    } catch (e) { }
    return false;
  }

  // 取「看起來像酒館主頁面」的最外層 window，而非盲取最上層。
  function resolveHostWindow() {
    var chain = [];
    var current = window;
    try {
      for (var i = 0; i < 8; i += 1) {
        chain.push(current);
        if (!current.parent || current.parent === current) break;
        void current.parent.document.body;
        current = current.parent;
      }
    } catch (e) { }
    try {
      if (window.top && chain.indexOf(window.top) === -1) {
        void window.top.document.body;
        chain.push(window.top);
      }
    } catch (e) { }
    for (var j = chain.length - 1; j >= 0; j -= 1) {
      if (looksLikeTavernWindow(chain[j])) return chain[j];
    }
    return chain.length ? chain[chain.length - 1] : window;
  }

  var hostWindow = resolveHostWindow();
  var hostDocument = hostWindow.document;

  function log() {
    try { console.log.apply(console, ['[星光事務所·小手機]'].concat([].slice.call(arguments))); } catch (e) { }
  }

  function getTavernHelper() {
    try { if (typeof TavernHelper !== 'undefined' && TavernHelper) return TavernHelper; } catch (e) { }
    try { if (hostWindow.TavernHelper) return hostWindow.TavernHelper; } catch (e) { }
    return null;
  }

  function getEventOnBinding() {
    try { if (typeof eventOn === 'function') return { fn: eventOn, owner: helperWindow }; } catch (e) { }
    try { if (typeof hostWindow.eventOn === 'function') return { fn: hostWindow.eventOn, owner: hostWindow }; } catch (e) { }
    return null;
  }

  function getButtonEventType(buttonName) {
    try { if (typeof getButtonEvent === 'function') return getButtonEvent(buttonName); } catch (e) { }
    try { if (typeof hostWindow.getButtonEvent === 'function') return hostWindow.getButtonEvent.call(hostWindow, buttonName); } catch (e) { }
    return '';
  }

  // ─────────────── 單例 runtime ───────────────

  var previous = helperWindow[RUNTIME_KEY] || hostWindow[RUNTIME_KEY];
  if (previous && typeof previous.destroy === 'function') {
    try { previous.destroy('replace'); } catch (e) { }
  }

  var runtime = {
    version: VERSION,
    destroyed: false,
    root: null,
    sourceKey: '',
    eventKeys: Object.create(null),
    scriptButtonBound: false,
    openingFrameEventBound: false,
    domEntrypointsBound: false,
    boundDocs: [],
    lastToggleAt: 0,
    gestureStartAt: 0,
    gestureSources: Object.create(null),
    pendingTarget: null,
    qrEntryWorked: false,
    openSucceeded: false,
    reportedFailure: false,
    lastOpenAt: 0,
    verifiedVisible: false,
    lastHit: '',
    t0: Date.now(),
    trace: [],
    hudSource: '',
    hudOrigin: null,
    hudDecided: false,
    hudRemoteReason: null,
    hudRemoteVersion: null,
    remoteHud: null,
    hudRemoteMs: null,
    hudSourceLocked: false,
    fab: null,
    lastStatus: '',
    stops: [],
    timers: Object.create(null),
    destroy: destroy
  };
  helperWindow[RUNTIME_KEY] = runtime;
  hostWindow[RUNTIME_KEY] = runtime;

  function schedule(key, fn, ms) {
    clearTimeout(runtime.timers[key]);
    runtime.timers[key] = setTimeout(function () { if (!runtime.destroyed) fn(); }, ms);
  }

  // 入口動作追蹤：失敗時把完整時間軸一起顯示，才看得出是誰把面板關掉的。
  function trace(action, detail) {
    var open = null;
    try { open = isOpen(); } catch (e) { }
    runtime.trace.push((Date.now() - runtime.t0) + 'ms ' + action +
      (detail ? '(' + detail + ')' : '') + ' open=' + open);
    if (runtime.trace.length > 24) runtime.trace.shift();
  }

  function destroyRoot() {
    if (runtime.root) trace('destroyRoot');
    var root = runtime.root;
    runtime.root = null;
    runtime.sourceKey = '';
    // v2.14.0 §8.5：來源鎖隨根銷毀清除（remount／來源變更重置為清除鎖的唯二途徑之二）
    runtime.hudSourceLocked = false;
    if (!root) return;
    try { if (typeof root.__sgxDestroy === 'function') root.__sgxDestroy(); } catch (e) { }
    try { root.remove(); } catch (e) {
      try { if (root.parentNode) root.parentNode.removeChild(root); } catch (e2) { }
    }
  }

  function destroy(reason) {
    if (runtime.destroyed) return;
    runtime.destroyed = true;
    Object.keys(runtime.timers).forEach(function (k) { clearTimeout(runtime.timers[k]); });
    runtime.stops.splice(0).forEach(function (fn) { try { fn(); } catch (e) { } });
    if (runtime.fab && runtime.fab.parentNode) runtime.fab.parentNode.removeChild(runtime.fab);
    destroyRoot();
    try { if (hostWindow[BRIDGE_KEY] && hostWindow[BRIDGE_KEY].owner === runtime) delete hostWindow[BRIDGE_KEY]; } catch (e) { }
    if (helperWindow[RUNTIME_KEY] === runtime) helperWindow[RUNTIME_KEY] = null;
    if (hostWindow[RUNTIME_KEY] === runtime) hostWindow[RUNTIME_KEY] = null;
    log('已卸載（' + (reason || 'unknown') + '）');
  }

  // ─────────────── 資料層（唯讀）與送出 ───────────────

  function readStat() {
    try {
      var mvu = null;
      try { if (typeof Mvu !== 'undefined' && Mvu) mvu = Mvu; } catch (e) { }
      if (!mvu) { try { if (hostWindow.Mvu) mvu = hostWindow.Mvu; } catch (e) { } }
      if (mvu && typeof mvu.getMvuData === 'function') {
        var data = mvu.getMvuData({ type: 'message', message_id: 'latest' });
        var stat = data && (data.stat_data || data);
        if (stat && typeof stat === 'object') return stat;
      }
    } catch (e) { }
    try {
      var th = getTavernHelper();
      if (!th || typeof th.getVariables !== 'function') return null;
      var v = null;
      try { v = th.getVariables({ type: 'message', message_id: 'latest' }); } catch (e) { }
      if (!v) { try { v = th.getVariables({ type: 'message' }); } catch (e) { } }
      return (v && v.stat_data) || null;
    } catch (e) { return null; }
  }

  // STScript 轉義（對齊已驗證卡橋 escapePipe）：| 轉義、換行轉 {{newline}}
  function escapeSlash(text) {
    return String(text == null ? '' : text).replace(/\|/g, '\\|').replace(/\r?\n/g, '{{newline}}');
  }

  function sendText(text) {
    var runner = null;
    var helper = getTavernHelper();
    if (helper && typeof helper.triggerSlash === 'function') runner = function (c) { return helper.triggerSlash(c); };
    if (!runner) {
      try { if (typeof triggerSlash === 'function') runner = function (c) { return triggerSlash(c); }; } catch (e) { }
    }
    if (!runner) return false;
    try {
      var p = runner('/send ' + escapeSlash(text) + ' | /trigger');
      if (p && typeof p.catch === 'function') p.catch(function (e) { log('triggerSlash 發送失敗', e); });
      return true;
    } catch (e) { return false; }
  }

  function exposeBridge() {
    try {
      hostWindow[BRIDGE_KEY] = {
        owner: runtime,
        version: VERSION,
        getStat: readStat,
        send: sendText,
        reportInvisible: function (detail) { reportFailure(detail); },
        reportVisible: function () { trace('hud-self-check-ok'); },
        reportDupClose: function () { trace('hud-dup-close-ignored'); }
      };
    } catch (e) { }
  }

  // ─────────────── HUD 來源與掛載 ───────────────

  function getContext() {
    try {
      var st = hostWindow.SillyTavern;
      if (st && typeof st.getContext === 'function') return st.getContext() || {};
    } catch (e) { }
    return {};
  }

  function currentCard() {
    try { if (typeof getCharData === 'function') return getCharData('current'); } catch (e) { }
    try {
      var helper = getTavernHelper();
      if (helper && typeof helper.getCharData === 'function') return helper.getCharData('current');
    } catch (e) { }
    try {
      var ctx = getContext();
      if (ctx.characters && ctx.characterId >= 0) return ctx.characters[ctx.characterId];
    } catch (e) { }
    return null;
  }

  function phoneHtml() {
    // v2.14.0 §8.3：來源判定 remote 且遠端字串在手 → 直接回遠端展示層（hudSource='remote'）。
    if (runtime.hudOrigin === 'remote' && runtime.remoteHud) {
      runtime.hudSource = 'remote';
      return runtime.remoteHud;
    }
    // 覆寫來源（作者調試用）：腳本變量 > 卡內 extensions > 內嵌。
    try {
      var helper = getTavernHelper();
      var reader = helper && helper.getVariables;
      if (typeof reader !== 'function') {
        try { if (typeof getVariables === 'function') reader = getVariables; } catch (e) { }
      }
      if (typeof reader === 'function') {
        var scriptData = reader.call(helper || null, { type: 'script' });
        var embedded = scriptData && scriptData.sgx_phone_hud_html;
        if (typeof embedded === 'string' && embedded.trim()) { runtime.hudSource = 'script-var'; return embedded; }
      }
    } catch (e) { }
    try {
      var card = currentCard();
      var ext = card && card.data && card.data.extensions;
      var value = ext && ext.sgx_phone && ext.sgx_phone.hud_html;
      if (typeof value === 'string' && value.trim()) { runtime.hudSource = 'card-ext'; return value; }
    } catch (e) { }
    runtime.hudSource = 'inline';
    return HUD_HTML;
  }

  function hashText(value) {
    value = String(value || '');
    var hash = 2166136261;
    for (var i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(36);
  }

  function sourceKey(value) {
    value = String(value || '');
    return value.length + ':' + hashText(value);
  }

  function mount(source, key) {
    if (runtime.destroyed || !hostDocument || !hostDocument.body) return false;
    var node = null;
    try {
      var template = hostDocument.createElement('template');
      template.innerHTML = String(source || '').trim();
      node = template.content.querySelector('#' + ROOT_ID);
      if (!node) throw new Error('手機根節點缺失');
      var script = node.querySelector('script');
      if (!script) throw new Error('手機腳本缺失');
      var scriptText = script.textContent || '';
      script.remove();

      var stale = hostDocument.getElementById(ROOT_ID);
      if (stale && stale !== node) {
        try { if (typeof stale.__sgxDestroy === 'function') stale.__sgxDestroy(); } catch (e) { }
        try { stale.remove(); } catch (e) { }
      }

      hostDocument.body.appendChild(node);
      // v2.14.0 §2.3／§8.4：來源標記——每次 mount 寫實際掛載來源；遠端另寫 tag 並以遠端版本覆寫 root 版本戳
      var mountedOrigin = (runtime.hudSource === 'remote') ? 'remote' : 'baked';
      node.setAttribute('data-sgx-hud-origin', mountedOrigin);
      if (mountedOrigin === 'remote') {
        node.setAttribute('data-sgx-hud-tag', REMOTE_TAG);
        node.setAttribute('data-sgx-phone-version', runtime.hudRemoteVersion || '');
      }
      runtime.root = node;
      runtime.sourceKey = key;
      node.__sgxSourceKey = key;
      exposeBridge();

      var bootstrap = hostDocument.createElement('script');
      bootstrap.type = 'text/javascript';
      bootstrap.setAttribute('data-sgx-ui-bootstrap', '');
      bootstrap.textContent = scriptText + '\n//# sourceURL=sgx-phone-hud-host.js';
      (hostDocument.head || hostDocument.body).appendChild(bootstrap);
      bootstrap.remove();
      if (!node.__sgxInit || typeof node.__sgxSetOpen !== 'function') throw new Error('手機初始化未完成');
      // §8.7 大聲降級：烘焙路徑帶原因，不靜默
      runtime.lastStatus = '已掛載' +
        (mountedOrigin === 'baked' && runtime.hudRemoteReason ? '（BAKED：' + runtime.hudRemoteReason + '）' : '');
      return true;
    } catch (error) {
      runtime.lastStatus = (error && error.message) || '手機掛載失敗';
      try { console.warn('[星光事務所·小手機] 掛載失敗', error); } catch (e) { }
      if (node === runtime.root) { runtime.root = null; runtime.sourceKey = ''; }
      try { if (node) node.remove(); } catch (e) { }
      return false;
    }
  }

  function ensureMounted(attempt, urgent) {
    if (runtime.destroyed) return;
    attempt = Math.max(0, Number(attempt) || 0);
    if (!urgent) {
      // v2.14.0 §8.2：來源判定未決期間，boot 階段的自動掛載一律延後到定案（常態首掛即 REMOTE）
      if (runtime.hudOrigin == null) return;
      // v2.14.0 §8.5：來源鎖定期間不再換源（已掛載的 HUD 不得因遠端遲到被原地替換）
      if (runtime.hudSourceLocked) return;
    } else if (runtime.hudOrigin == null) {
      // §8.5 edge rule：判定未決時的使用者開啟 → 立即以烘焙版掛載並鎖定來源
      runtime.hudSourceLocked = true;
      log('HUD 來源判定未決：先以烘焙版掛載並鎖定來源（遠端可用亦不重掛）');
    } else if (runtime.hudSourceLocked) {
      return;
    }
    var source = phoneHtml();
    if (!source) {
      runtime.lastStatus = '尚未取得 HUD 來源（卡內 extensions.sgx_phone.hud_html）';
      if (attempt < 24) schedule('mount', function () { ensureMounted(attempt + 1); }, 250);
      return;
    }
    var key = sourceKey(source);
    if (runtime.root && runtime.root.isConnected !== false && runtime.root.__sgxSourceKey === key) return;
    destroyRoot();
    if (!mount(source, key) && attempt < 24) {
      schedule('mount', function () { ensureMounted(attempt + 1); }, 250);
    }
  }

  // ─────────────── 開關 ───────────────

  function applyOpen(target) {
    ensureMounted(0, true);
    var root = runtime.root;
    if (!root || typeof root.__sgxSetOpen !== 'function') {
      if (target !== false) schedule('verify-open', function () { reportFailure(null); }, 400);
      return false;
    }
    try {
      root.__sgxSetOpen(target);
      if (target) runtime.lastOpenAt = Date.now();
      trace('applyOpen', String(target));
      if (isOpen()) schedule('verify-open', function () { verifyOpened(0); }, 300);
      return true;
    } catch (e) {
      runtime.lastStatus = (e && e.message) || '切換失敗';
      return false;
    }
  }

  // ─────────────── 可見的失敗回報（不需要 console） ───────────────

  function inspectVisibility() {
    var problems = [];
    var root = runtime.root;
    if (!root) { problems.push('HUD 未掛載：' + (runtime.lastStatus || '原因不明')); return problems; }
    if (root.isConnected === false) problems.push('根節點已脫離文件');
    if (!root.__sgxInit) problems.push('HUD 腳本未執行（宿主可能封鎖了注入的 script）');
    var doc = root.ownerDocument;
    var view = doc && doc.defaultView;
    try { if (view && view.frameElement) problems.push('掛載在 iframe 內而非主頁面'); } catch (e) { }
    var panel = root.querySelector('[data-sgx-panel]');
    if (!panel) { problems.push('面板節點缺失'); return problems; }

    var r = panel.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) {
      problems.push('面板尺寸為 0（寬' + Math.round(r.width) + '×高' + Math.round(r.height) + '）');
      return problems;
    }

    // 計算樣式：display/visibility/opacity 任何一項把它藏起來都算失敗。
    try {
      if (view && view.getComputedStyle) {
        var cs = view.getComputedStyle(panel);
        if (cs.display === 'none') problems.push('面板 display 為 none');
        if (cs.visibility === 'hidden' || cs.visibility === 'collapse') problems.push('面板 visibility 為 ' + cs.visibility);
        if (Number(cs.opacity) === 0) problems.push('面板 opacity 為 0');
      }
    } catch (e) { }

    // 是否落在可視範圍內
    var vw = (view && view.innerWidth) || 0;
    var vh = (view && view.innerHeight) || 0;
    if (vw && vh && (r.right <= 0 || r.bottom <= 0 || r.left >= vw || r.top >= vh)) {
      problems.push('面板位於畫面外（left' + Math.round(r.left) + ' top' + Math.round(r.top) +
        ' / 視窗' + vw + '×' + vh + '）');
      return problems;
    }

    // 命中測試：真正用座標去點面板中心，確認最上層就是它——這才抓得到「被別的元素蓋住」。
    try {
      if (doc.elementFromPoint) {
        var cx = Math.round(Math.min(Math.max(r.left + r.width / 2, 1), (vw || r.right) - 1));
        var cy = Math.round(Math.min(Math.max(r.top + r.height / 2, 1), (vh || r.bottom) - 1));
        var hit = doc.elementFromPoint(cx, cy);
        runtime.lastHit = hit ? (hit.tagName + (hit.id ? '#' + hit.id : '') +
          (hit.className && typeof hit.className === 'string' ? '.' + hit.className.split(/\s+/)[0] : '')) : 'null';
        if (!hit) problems.push('命中測試取不到元素');
        else if (!panel.contains(hit) && hit !== panel) {
          problems.push('面板被其他元素蓋住（該座標最上層是 ' + runtime.lastHit + '）');
        }
      }
    } catch (e) { }

    return problems;
  }

  // 被蓋住時的自動補救：重新掛到 body 末尾並拉高層級。
  function raiseRoot() {
    var root = runtime.root;
    if (!root || !hostDocument.body) return false;
    try {
      hostDocument.body.appendChild(root);
      root.style.setProperty('z-index', '2147483646', 'important');
      root.style.setProperty('position', 'fixed', 'important');
      trace('raiseRoot');
      return true;
    } catch (e) { return false; }
  }

  function reportFailure(extra) {
    if (runtime.reportedFailure) return;
    runtime.reportedFailure = true;
    var problems = inspectVisibility();
    if (extra) problems.push(extra);
    var d = {};
    try { d = hostWindow.__sgxPhone ? hostWindow.__sgxPhone.diag() : {}; } catch (e) { }
    var text = '【星光事務所·小手機 v' + VERSION + '】開啟失敗\n\n' +
      problems.map(function (p, i) { return (i + 1) + '. ' + p; }).join('\n') +
      '\n\n動作時間軸：\n' + runtime.trace.join('\n') +
      '\n\n診斷：\n' + JSON.stringify(d, null, 1);
    log(text);
    try { hostWindow.alert(text); } catch (e) {
      try { alert(text); } catch (e2) { }
    }
    ensureFallbackEntry();
  }

  function verifyOpened(attempt) {
    if (runtime.destroyed) return;
    var problems = inspectVisibility();
    if (problems.length === 0) {
      runtime.openSucceeded = true;
      runtime.verifiedVisible = true;
      trace('verify-ok', runtime.lastHit);
      ensureFallbackEntry();
      return;
    }
    // 先自動補救＋複驗，避免動畫或版面尚未穩定時誤報。
    if (!attempt) {
      trace('verify-retry', problems[0]);
      raiseRoot();
      schedule('verify-open', function () { verifyOpened(1); }, 900);
      return;
    }
    trace('verify-fail', problems[0]);
    reportFailure(null);
  }

  function isOpen() {
    var root = runtime.root;
    try { return !!(root && typeof root.__sgxIsOpen === 'function' && root.__sgxIsOpen()); } catch (e) { return false; }
  }

  // 同一次點擊常被「酒館助手按鈕事件」與「DOM 後備」同時收到。
  // 來源不同＝同一手勢的重複訊號，冪等套用同一目標；來源重覆＝真的又點了一下。
  function togglePhoneOpen(source) {
    if (runtime.destroyed) return;
    var now = Date.now();
    var src = source || 'unknown';
    if (src.indexOf('qr') === 0) {
      runtime.qrEntryWorked = true;
      ensureFallbackEntry();
    }
    if (runtime.root) runtime.root.setAttribute('data-sgx-last-entry', src);
    runtime.lastToggleAt = now;
    // 一次點擊可能產生多個訊號（助手按鈕事件、DOM 後備，且事件本身在部分環境會重覆派發）。
    // 不再以「來源不同」判斷重複——真機證實同一來源也會連發——改為純時間窗：
    // 手勢開始 700ms 內的所有訊號一律套用同一個已決定的目標。
    var inWindow = runtime.pendingTarget !== null && (now - runtime.gestureStartAt) < 700;
    if (inWindow) {
      runtime.gestureSources[src] = true;
      trace('coalesced', src);
      applyOpen(runtime.pendingTarget);
      return;
    }
    var wantOpen = !isOpen();
    // 保護：面板剛打開就收到關閉請求，實務上必然是同一次點擊的另一路訊號晚到，
    // 而不是使用者真的想關（人手做不到 600ms 內開了又關）。一律當重複訊號忽略。
    if (!wantOpen && (now - runtime.lastOpenAt) < 400) {
      trace('dup-close-ignored', src);
      runtime.gestureStartAt = now;
      runtime.gestureSources = Object.create(null);
      runtime.gestureSources[src] = true;
      runtime.pendingTarget = true;
      applyOpen(true);
      return;
    }
    runtime.gestureStartAt = now;
    runtime.gestureSources = Object.create(null);
    runtime.gestureSources[src] = true;
    runtime.pendingTarget = wantOpen;
    trace('toggle', src);
    applyOpen(runtime.pendingTarget);
    schedule('toggle-window', function () { runtime.pendingTarget = null; }, 700);
  }

  // ─────────────── 入口 ───────────────

  function normalizeLabel(text) {
    return String(text == null ? '' : text)
      .replace(/[\uFE0E\uFE0F\u200B\u200C\u200D]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var PHONE_BUTTON_LABEL = normalizeLabel(PHONE_BUTTON_NAME);
  var PHONE_BUTTON_KEY = '小手機';

  function isPhoneEntryControl(node) {
    if (!node || node.nodeType !== 1) return false;
    if (runtime.root && typeof runtime.root.contains === 'function' && runtime.root.contains(node)) return false;
    if (node.id === 'sgx-phone-fab') return false;
    var candidates = [node.textContent];
    try {
      if (typeof node.getAttribute === 'function') {
        candidates.push(node.getAttribute('title'));
        candidates.push(node.getAttribute('aria-label'));
        candidates.push(node.getAttribute('data-name'));
      }
    } catch (e) { }
    for (var i = 0; i < candidates.length; i += 1) {
      var label = normalizeLabel(candidates[i]);
      if (!label || label.length > 24) continue;
      if (label === PHONE_BUTTON_LABEL) return true;
      if (label.indexOf(PHONE_BUTTON_KEY) !== -1) return true;
    }
    return false;
  }

  function syncQrExpanded() {
    if (!hostDocument || typeof hostDocument.querySelectorAll !== 'function') return;
    var controls = hostDocument.querySelectorAll('.qr--button, button, [role="button"]');
    var open = isOpen();
    for (var i = 0; i < controls.length; i += 1) {
      if (isPhoneEntryControl(controls[i])) controls[i].setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  }

  function bindEvent(type, key, handler) {
    if (!type || runtime.eventKeys[key]) return !!runtime.eventKeys[key];
    try {
      var listener = eventOn(type, function () {
        if (!runtime.destroyed) handler.apply(null, arguments);
      });
      runtime.eventKeys[key] = true;
      if (listener && typeof listener.stop === 'function') runtime.stops.push(function () { listener.stop(); });
      return true;
    } catch (e) { }
    var binding = getEventOnBinding();
    if (!binding) return false;
    try {
      var fallback = binding.fn.call(binding.owner, type, function () {
        if (!runtime.destroyed) handler.apply(null, arguments);
      });
      runtime.eventKeys[key] = true;
      if (fallback && typeof fallback.stop === 'function') runtime.stops.push(function () { fallback.stop(); });
      return true;
    } catch (e) { return false; }
  }

  function bindScriptButton() {
    if (runtime.scriptButtonBound) return true;
    var eventType = getButtonEventType(PHONE_BUTTON_NAME);
    if (eventType) {
      var bound = bindEvent(eventType, 'script-button-toggle', function () { togglePhoneOpen('qr-event'); });
      runtime.scriptButtonBound = runtime.scriptButtonBound || bound;
      if (bound && runtime.root) runtime.root.setAttribute('data-sgx-button-api', 'getButtonEvent+eventOn');
      if (bound) return true;
    }
    try {
      if (typeof eventOnButton === 'function') {
        var listener = eventOnButton(PHONE_BUTTON_NAME, function () { togglePhoneOpen('qr-eventOnButton'); });
        if (listener && typeof listener.stop === 'function') runtime.stops.push(function () { listener.stop(); });
        runtime.scriptButtonBound = true;
        if (runtime.root) runtime.root.setAttribute('data-sgx-button-api', 'eventOnButton');
        return true;
      }
    } catch (e) { }
    if (runtime.root) runtime.root.setAttribute('data-sgx-button-api', 'dom-fallback');
    return false;
  }

  function bindDomEntrypointsOn(doc) {
    if (!doc || typeof doc.addEventListener !== 'function') return false;
    if (runtime.boundDocs.indexOf(doc) !== -1) return false;
    var onHostClick = function (event) {
      if (runtime.destroyed || !event || !event.target) return;
      var target = event.target;
      var control = null;
      try {
        control = typeof target.closest === 'function'
          ? target.closest('.qr--button, button, [role="button"], .menu_button')
          : null;
      } catch (e) { control = null; }
      if (!control) control = target.nodeType === 1 ? target : null;
      if (!control || !isPhoneEntryControl(control)) return;
      togglePhoneOpen('qr-dom');
    };
    doc.addEventListener('click', onHostClick, true);
    runtime.boundDocs.push(doc);
    runtime.stops.push(function () {
      try { doc.removeEventListener('click', onHostClick, true); } catch (e) { }
    });
    return true;
  }

  function bindDomEntrypoints() {
    var ok = false;
    if (bindDomEntrypointsOn(hostDocument)) ok = true;
    try { if (helperWindow.document !== hostDocument && bindDomEntrypointsOn(helperWindow.document)) ok = true; } catch (e) { }
    try {
      if (window.top && window.top.document !== hostDocument) {
        void window.top.document.body;
        if (bindDomEntrypointsOn(window.top.document)) ok = true;
      }
    } catch (e) { }
    runtime.domEntrypointsBound = runtime.domEntrypointsBound || ok;
    return runtime.domEntrypointsBound;
  }

  // 保底入口：QR 若在這台裝置上完全接不到，至少留一顆懸浮鈕。
  function ensureFallbackEntry() {
    if (runtime.destroyed || !hostDocument || !hostDocument.body) return;
    // 條件是「面板真的成功顯示過」，而不是「入口事件觸發過」——
    // 後者會在入口有反應但畫面沒東西時把保底入口誤刪。
    if (runtime.qrEntryWorked && runtime.verifiedVisible) {
      if (runtime.fab && runtime.fab.parentNode) runtime.fab.parentNode.removeChild(runtime.fab);
      runtime.fab = null;
      return;
    }
    if (runtime.fab && runtime.fab.isConnected) return;
    var fab = hostDocument.createElement('button');
    fab.id = 'sgx-phone-fab';
    fab.type = 'button';
    fab.textContent = '📱';
    fab.setAttribute('aria-label', '開啟小手機（後備入口）');
    fab.title = '開啟小手機（後備入口）';
    fab.style.cssText = 'position:fixed;right:12px;bottom:96px;z-index:2147482700;width:46px;height:46px;' +
      'padding:0;border-radius:50%;border:1px solid #4a4358;background:#17161d;color:#e6c37a;font-size:20px;' +
      'line-height:1;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.45);' +
      'cursor:pointer;touch-action:manipulation';
    var pressTimer = null;
    var longPressed = false;
    function startPress() {
      longPressed = false;
      clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        longPressed = true;
        runtime.reportedFailure = false;   // 長按＝主動要診斷，允許再顯示一次
        reportFailure('（使用者長按後備入口主動叫出診斷）');
      }, 600);
    }
    function endPress() { clearTimeout(pressTimer); }
    fab.addEventListener('touchstart', startPress, { passive: true });
    fab.addEventListener('touchend', endPress);
    fab.addEventListener('touchcancel', endPress);
    fab.addEventListener('mousedown', startPress);
    fab.addEventListener('mouseup', endPress);
    fab.addEventListener('mouseleave', endPress);
    fab.addEventListener('click', function (ev) {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (e) { }
      endPress();
      if (longPressed) { longPressed = false; return; }
      togglePhoneOpen('fab');
    });
    hostDocument.body.appendChild(fab);
    runtime.fab = fab;
    log('QR 入口未確認可用，已補上後備懸浮鈕');
  }

  function watchFallbackEntry(attempt) {
    if (runtime.destroyed) return;
    ensureFallbackEntry();
    if (!(runtime.qrEntryWorked && runtime.verifiedVisible) && attempt < 20) {
      schedule('fab-watch', function () { watchFallbackEntry(attempt + 1); }, 5000);
    }
  }

  // ─────────────── 事件 ───────────────

  function requestRender() {
    var root = runtime.root;
    if (root && typeof root.__sgxRender === 'function') {
      try { root.__sgxRender(); } catch (e) { }
    }
  }

  function bridgeFrames() {
    var root = runtime.root;
    if (root && typeof root.__sgxBridgeFrames === 'function') {
      try { root.__sgxBridgeFrames(); } catch (e) { }
    }
  }

  function bindOpeningFrameEvent() {
    if (runtime.openingFrameEventBound) return true;
    var events = null;
    try { if (typeof iframe_events !== 'undefined' && iframe_events) events = iframe_events; } catch (e) { }
    if (!events) { try { events = hostWindow.iframe_events || null; } catch (e) { } }
    if (!events || !events.MESSAGE_IFRAME_RENDER_ENDED) return false;
    runtime.openingFrameEventBound = bindEvent(
      events.MESSAGE_IFRAME_RENDER_ENDED, 'opening-frame-rendered', bridgeFrames);
    return runtime.openingFrameEventBound;
  }

  function bindTavernEvents() {
    var bound = false;
    if (typeof tavern_events !== 'undefined' && tavern_events) {
      if (tavern_events.MESSAGE_SENT) {
        bound = bindEvent(tavern_events.MESSAGE_SENT, 'message-sent', function () { requestRender(); }) || bound;
      }
      if (tavern_events.MESSAGE_RECEIVED) {
        bound = bindEvent(tavern_events.MESSAGE_RECEIVED, 'message-received', function () { requestRender(); }) || bound;
      }
      if (tavern_events.CHAT_CHANGED) {
        bound = bindEvent(tavern_events.CHAT_CHANGED, 'chat-changed', function () {
          ensureMounted(0); requestRender();
        }) || bound;
      }
    }
    return bound;
  }

  function bindMvuEvents() {
    var mvu = null;
    try { if (typeof Mvu !== 'undefined' && Mvu) mvu = Mvu; } catch (e) { }
    if (!mvu) { try { mvu = hostWindow.Mvu || null; } catch (e) { } }
    if (!mvu || !mvu.events || !mvu.events.VARIABLE_UPDATE_ENDED) return false;
    return bindEvent(mvu.events.VARIABLE_UPDATE_ENDED, 'mvu-update-ended', function () { requestRender(); });
  }

  // 手機端酒館助手 API 常較晚注入；長時間退避重試，而非只在啟動綁一次。
  function awaitBindings(attempt) {
    if (runtime.destroyed) return;
    bindScriptButton();
    bindDomEntrypoints();
    bindOpeningFrameEvent();
    bindTavernEvents();
    bindMvuEvents();
    ensureMounted(0);
    syncQrExpanded();
    if ((!runtime.scriptButtonBound || !runtime.openingFrameEventBound) && attempt < 600) {
      var delay = attempt < 40 ? 250 : (attempt < 120 ? 1000 : 3000);
      schedule('await-bindings', function () { awaitBindings(attempt + 1); }, delay);
    }
  }

  // ─────────────── HUD 遠端來源判定（v2.14.0；每 boot 一次，race 5s） ───────────────

  function decideHudOrigin(origin, reason, mod, ms) {
    if (runtime.hudDecided) return;
    runtime.hudDecided = true;
    runtime.hudOrigin = origin;
    runtime.hudRemoteReason = reason || null;
    runtime.hudRemoteMs = ms;
    if (origin === 'remote' && mod) {
      runtime.remoteHud = mod.HUD_HTML;
      runtime.hudRemoteVersion = mod.HUD_VERSION;
    }
    log('HUD 來源判定：' + origin + (reason ? '（' + reason + '）' : '') + ' 耗時 ' + ms + 'ms');
    if (runtime.hudSourceLocked) {
      if (origin === 'remote') log('REMOTE 可用，下次重掛生效');
      return;
    }
    // §8.2：boot 階段的掛載延後到判定完成——定案回呼內才做首掛（遠端勝出即首掛即遠端）
    ensureMounted(0);
  }

  function startHudSourceDecision() {
    var startedAt = Date.now();
    var timer = null;
    function settle(origin, reason, mod) {
      var ms = Date.now() - startedAt;
      if (runtime.hudDecided) { log('遠端結果遲到已丟棄（' + origin + '）'); return; }
      clearTimeout(timer);
      decideHudOrigin(origin, reason, mod, ms);
    }
    timer = setTimeout(function () {
      settle('baked', 'timeout（' + REMOTE_TIMEOUT_MS + 'ms 逾時）', null);
    }, REMOTE_TIMEOUT_MS);
    try {
      // §8.8：import 於本載入器執行所在 realm 發起；該 realm 的 CSP 若擋遠端即走降級路徑
      import(REMOTE_HUD_URL).then(function (mod) {
        var ok = mod && typeof mod.HUD_HTML === 'string' && mod.HUD_HTML.trim() &&
          /^\d+\.\d+\.\d+$/.test(String(mod.HUD_VERSION || ''));
        if (ok) settle('remote', null, mod);
        else settle('baked', '遠端模組驗證失敗（HUD_VERSION／HUD_HTML 不符）', null);
      }, function (err) {
        settle('baked', '遠端載入失敗：' + ((err && err.message) || err), null);
      });
    } catch (e) {
      settle('baked', '遠端載入被阻擋（CSP 等）：' + ((e && e.message) || e), null);
    }
  }

  // ─────────────── 啟動 ───────────────

  function boot() {
    if (runtime.destroyed) return;
    exposeBridge();
    startHudSourceDecision();
    bindDomEntrypoints();
    awaitBindings(0);
    schedule('fab-watch', function () { watchFallbackEntry(0); }, 6000);

    try {
      hostWindow.addEventListener('sgx-phone-open-changed', function (ev) {
        trace('hud-open-changed', ev && ev.detail ? String(ev.detail.open) : '');
        syncQrExpanded();
      });
    } catch (e) { }

    [120, 600, 1600].forEach(function (delay) {
      runtime.timers['bridge' + delay] = setTimeout(function () {
        if (!runtime.destroyed) { bridgeFrames(); requestRender(); }
      }, delay);
    });

    if (typeof waitGlobalInitialized === 'function') {
      try {
        Promise.resolve(waitGlobalInitialized('Mvu')).then(function () {
          if (!runtime.destroyed) { bindMvuEvents(); requestRender(); }
        }).catch(function () { });
      } catch (e) { }
    }

    try {
      hostWindow.__sgxPhone = {
        version: VERSION,
        toggle: function () { togglePhoneOpen('manual'); },
        open: function () { applyOpen(true); },
        close: function () { applyOpen(false); },
        remount: function () { destroyRoot(); ensureMounted(0); return !!runtime.root; },
        diag: function () {
          return {
            version: VERSION,
            hudVersion: runtime.root ? runtime.root.getAttribute('data-sgx-phone-version') : null,
            host: hostWindow === window ? 'self(iframe)' : 'parent',
            hostLooksLikeTavern: looksLikeTavernWindow(hostWindow),
            hudSource: runtime.hudSource || 'unknown',
            hudOrigin: runtime.hudOrigin,
            hudRemoteVersion: runtime.hudRemoteVersion,
            hudRemoteTag: REMOTE_TAG,
            hudRemoteMs: runtime.hudRemoteMs,
            hudRemoteError: runtime.hudRemoteReason,
            hostIsTopFrame: (function () {
              try { return !(hostDocument.defaultView && hostDocument.defaultView.frameElement); } catch (e) { return null; }
            })(),
            panelRect: (function () {
              try {
                var pnl = runtime.root && runtime.root.querySelector('[data-sgx-panel]');
                if (!pnl) return null;
                var r = pnl.getBoundingClientRect();
                return Math.round(r.width) + 'x' + Math.round(r.height);
              } catch (e) { return null; }
            })(),
            openSucceeded: runtime.openSucceeded,
            verifiedVisible: runtime.verifiedVisible,
            centerHit: runtime.lastHit,
            viewport: (function () {
              try {
                var vv = hostWindow.visualViewport;
                return hostWindow.innerWidth + 'x' + hostWindow.innerHeight +
                  (vv ? ' vv=' + Math.round(vv.width) + 'x' + Math.round(vv.height) : '');
              } catch (e) { return null; }
            })(),
            panelBox: (function () {
              try {
                var pnl = runtime.root && runtime.root.querySelector('[data-sgx-panel]');
                if (!pnl) return null;
                var r = pnl.getBoundingClientRect();
                return 'l' + Math.round(r.left) + ' t' + Math.round(r.top) +
                  ' ' + Math.round(r.width) + 'x' + Math.round(r.height);
              } catch (e) { return null; }
            })(),
            trace: runtime.trace.slice(-12),
            rootMounted: !!(runtime.root && runtime.root.isConnected !== false),
            hudInit: !!(runtime.root && runtime.root.__sgxInit),
            open: isOpen(),
            scriptButtonBound: runtime.scriptButtonBound,
            domEntrypointsBound: runtime.domEntrypointsBound,
            boundDocs: runtime.boundDocs.length,
            qrEntryWorked: runtime.qrEntryWorked,
            buttonApi: runtime.root ? runtime.root.getAttribute('data-sgx-button-api') : null,
            lastEntry: runtime.root ? runtime.root.getAttribute('data-sgx-last-entry') : null,
            statLoaded: !!readStat(),
            lastStatus: runtime.lastStatus
          };
        }
      };
    } catch (e) { }

    try {
      helperWindow.addEventListener('pagehide', function () { destroy('pagehide'); });
    } catch (e) { }

    log('載入器 v' + VERSION + ' 已啟動');
  }

  if (typeof $ === 'function') {
    $(function () { try { boot(); } catch (e) { log('啟動失敗', e); } });
  } else {
    boot();
  }
})();
