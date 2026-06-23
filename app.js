// ===== 그림으로 말해요 — 자폐 아동용 AAC (단일 상징 터치 → 음성 출력) =====

const ARASAAC_SEARCH = 'https://api.arasaac.org/api/pictograms/ko/search/';
const ARASAAC_IMAGE = (id) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;

// 일부 잠금형 태블릿 브라우저(WebView)는 음성 합성을 아예 지원하지 않는다.
// 이때도 부모 녹음 재생·그림 표시는 동작해야 하므로 기계 음성 호출을 모두 건너뛴다.
const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

// Fitzgerald key 색상: 카테고리별 고정 색으로 위치·색 일관성 유지
const BOARD_COLORS = [
    '#f2a7c3', '#f5d76e', '#f5a96e', '#8ec1f0', '#9fd9a0',
    '#c8a8e9', '#f29b9b', '#7fd6cf', '#b6c77f', '#e0b48f', '#a9b6f0', '#f0a8d0',
];

// 색 동그라미는 글자가 없어 보조기술(스크린리더·스위치)에서 그냥 '버튼'으로만 읽힌다.
// 색 이름을 붙여 어떤 색을 고르는지 알 수 있게 한다.
const BOARD_COLOR_NAMES = {
    '#f2a7c3': '분홍', '#f5d76e': '노랑', '#f5a96e': '주황', '#8ec1f0': '하늘',
    '#9fd9a0': '연두', '#c8a8e9': '보라', '#f29b9b': '산호', '#7fd6cf': '청록',
    '#b6c77f': '올리브', '#e0b48f': '베이지', '#a9b6f0': '라벤더', '#f0a8d0': '진분홍',
};

const DEFAULT_BOARDS = [
    { id: 'favorites', name: '즐겨찾기', color: '#5b9bd5', order: -1, emoji: '⭐', readonly: true },
    { id: 'core',   name: '핵심',  color: '#f2a7c3', order: 0, emoji: '🌟' },
    { id: 'people', name: '사람',  color: '#f5d76e', order: 1, emoji: '👥' },
    { id: 'food',   name: '음식',  color: '#f5a96e', order: 2, emoji: '🍎' },
    { id: 'feel',   name: '느낌',  color: '#8ec1f0', order: 3, emoji: '😊' },
    { id: 'act',    name: '활동',  color: '#9fd9a0', order: 4, emoji: '🏃' },
    { id: 'place',  name: '장소',  color: '#c8a8e9', order: 5, emoji: '📍' },
    { id: 'body',   name: '몸',    color: '#f29b9b', order: 6, emoji: '🧍' },
];

const DEFAULT_CELLS = [
    // 핵심어휘 (core vocabulary)
    { boardId: 'core', label: '주세요', emoji: '🙏' },
    { boardId: 'core', label: '더', emoji: '➕' },
    { boardId: 'core', label: '그만', emoji: '✋' },
    { boardId: 'core', label: '싫어요', emoji: '🙅' },
    { boardId: 'core', label: '좋아요', emoji: '👍' },
    { boardId: 'core', label: '네', emoji: '⭕' },
    { boardId: 'core', label: '아니요', emoji: '❌' },
    { boardId: 'core', label: '도와주세요', emoji: '🆘' },
    { boardId: 'core', label: '안돼요', emoji: '🚫' },
    { boardId: 'core', label: '끝났어요', emoji: '🏁' },
    { boardId: 'core', label: '같이해요', emoji: '🤝' },
    { boardId: 'core', label: '또 해요', emoji: '🔁' },
    { boardId: 'core', label: '기다려요', emoji: '⏳' },
    { boardId: 'core', label: '이거', emoji: '👉' },
    { boardId: 'core', label: '저거', emoji: '👈' },
    // 사람 (people)
    { boardId: 'people', label: '엄마', emoji: '👩' },
    { boardId: 'people', label: '아빠', emoji: '👨' },
    { boardId: 'people', label: '할머니', emoji: '👵' },
    { boardId: 'people', label: '할아버지', emoji: '👴' },
    { boardId: 'people', label: '누나/형', emoji: '🧑' },
    { boardId: 'people', label: '동생', emoji: '👶' },
    { boardId: 'people', label: '선생님', emoji: '🧑‍🏫' },
    { boardId: 'people', label: '친구', emoji: '🧒' },
    { boardId: 'people', label: '의사 선생님', emoji: '🧑‍⚕️' },
    { boardId: 'people', label: '나', emoji: '🙋' },
    // 음식 (food)
    { boardId: 'food', label: '물', emoji: '💧' },
    { boardId: 'food', label: '우유', emoji: '🥛' },
    { boardId: 'food', label: '밥', emoji: '🍚' },
    { boardId: 'food', label: '빵', emoji: '🍞' },
    { boardId: 'food', label: '과자', emoji: '🍪' },
    { boardId: 'food', label: '과일', emoji: '🍎' },
    { boardId: 'food', label: '바나나', emoji: '🍌' },
    { boardId: 'food', label: '딸기', emoji: '🍓' },
    { boardId: 'food', label: '주스', emoji: '🧃' },
    { boardId: 'food', label: '김밥', emoji: '🍙' },
    { boardId: 'food', label: '라면', emoji: '🍜' },
    { boardId: 'food', label: '아이스크림', emoji: '🍦' },
    { boardId: 'food', label: '사탕', emoji: '🍬' },
    { boardId: 'food', label: '계란', emoji: '🥚' },
    { boardId: 'food', label: '고기', emoji: '🍗' },
    { boardId: 'food', label: '피자', emoji: '🍕' },
    // 느낌 (feelings)
    { boardId: 'feel', label: '행복해요', emoji: '😊' },
    { boardId: 'feel', label: '슬퍼요', emoji: '😢' },
    { boardId: 'feel', label: '화나요', emoji: '😠' },
    { boardId: 'feel', label: '무서워요', emoji: '😨' },
    { boardId: 'feel', label: '아파요', emoji: '🤕' },
    { boardId: 'feel', label: '졸려요', emoji: '😴' },
    { boardId: 'feel', label: '배고파요', emoji: '🍽️' },
    { boardId: 'feel', label: '목말라요', emoji: '🥤' },
    { boardId: 'feel', label: '더워요', emoji: '🥵' },
    { boardId: 'feel', label: '추워요', emoji: '🥶' },
    { boardId: 'feel', label: '심심해요', emoji: '😑' },
    // 활동 (activities)
    { boardId: 'act', label: '화장실', emoji: '🚽' },
    { boardId: 'act', label: '놀아요', emoji: '🧸' },
    { boardId: 'act', label: '자요', emoji: '🛏️' },
    { boardId: 'act', label: '씻어요', emoji: '🛁' },
    { boardId: 'act', label: '양치해요', emoji: '🪥' },
    { boardId: 'act', label: '옷 입어요', emoji: '👕' },
    { boardId: 'act', label: '밖에 가요', emoji: '🌳' },
    { boardId: 'act', label: '안아주세요', emoji: '🤗' },
    { boardId: 'act', label: '음악 들어요', emoji: '🎵' },
    { boardId: 'act', label: 'TV 봐요', emoji: '📺' },
    { boardId: 'act', label: '책 읽어요', emoji: '📚' },
    { boardId: 'act', label: '그림 그려요', emoji: '🎨' },
    { boardId: 'act', label: '공놀이', emoji: '⚽' },
    // 장소 (places)
    { boardId: 'place', label: '집', emoji: '🏠' },
    { boardId: 'place', label: '학교', emoji: '🏫' },
    { boardId: 'place', label: '방', emoji: '🚪' },
    { boardId: 'place', label: '밖', emoji: '🌳' },
    { boardId: 'place', label: '마트', emoji: '🛒' },
    { boardId: 'place', label: '병원', emoji: '🏥' },
    { boardId: 'place', label: '놀이터', emoji: '🛝' },
    { boardId: 'place', label: '차', emoji: '🚗' },
    { boardId: 'place', label: '식당', emoji: '🍴' },
    // 몸 (body)
    { boardId: 'body', label: '머리', emoji: '👤' },
    { boardId: 'body', label: '배', emoji: '🫃' },
    { boardId: 'body', label: '손', emoji: '✋' },
    { boardId: 'body', label: '발', emoji: '🦶' },
    { boardId: 'body', label: '눈', emoji: '👁️' },
    { boardId: 'body', label: '코', emoji: '👃' },
    { boardId: 'body', label: '입', emoji: '👄' },
    { boardId: 'body', label: '귀', emoji: '👂' },
    { boardId: 'body', label: '이', emoji: '🦷' },
];

const EMOJI_CHOICES = [
    '🙏','➕','🙅','👍','👎','🆘','✋','⭕','❌','🚫','🏁','🤝','🔁','⏳','👉','👈',
    '👩','👨','👵','👴','🧑‍🏫','🧒','👶','🧑','🙋','🧑‍⚕️',
    '💧','🥛','🍚','🍞','🍪','🍎','🍌','🍓','🧃','🍙','🍜','🍦','🍬','🥚','🍗','🍕','🍜','🥤',
    '😊','😢','😠','😨','🤕','😴','🍽️','🥵','🥶','😑','😋','🤒','😍',
    '🚽','🧸','🛏️','🛁','🪥','👕','🌳','🤗','🎵','📺','📚','🎨','⚽','🚶','🧩',
    '🏠','🏫','🚪','🛒','🏥','🛝','🚗','🍴',
    '👤','🫃','🦶','👁️','👃','👄','👂','🦷','🐶','🐱','☀️','🌙',
];

// ===== IndexedDB =====
let db;

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('aac-db', 2);
        req.onupgradeneeded = () => {
            const d = req.result;
            // 기존 데이터 보존: 없는 스토어만 새로 만든다 (v1 → v2 업그레이드 시 logs만 추가)
            if (!d.objectStoreNames.contains('boards')) d.createObjectStore('boards', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('cells')) d.createObjectStore('cells', { keyPath: 'id' });
            if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings', { keyPath: 'key' });
            if (!d.objectStoreNames.contains('logs')) d.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

function tx(store, mode, fn) {
    return new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        const result = fn(s);
        t.oncomplete = () => resolve(result && result.result !== undefined ? result.result : undefined);
        t.onerror = () => reject(t.error);
    });
}

const dbGetAll = (store) => tx(store, 'readonly', s => s.getAll()).then(r => r ?? []);
const dbPut = (store, value) => tx(store, 'readwrite', s => s.put(value));
const dbDelete = (store, key) => tx(store, 'readwrite', s => s.delete(key));
const dbClear = (store) => tx(store, 'readwrite', s => s.clear());

// ===== App state =====
let boards = [];
let cells = [];
let settings = { voice: 'tts', ttsRate: 0.9, cardScale: 1, labelSize: 'medium', animations: false, rewardSound: false, cancelOnTouch: true, dragToHide: false, inCardDragAsClick: true, arasaacRecent: [], lastBackupAt: 0 };

const LABEL_SCALES = { small: 0.85, medium: 1, large: 1.25 };
let activeBoardId = 'core';
let editMode = false;
let homeMode = false;
let hidingMode = false;
let currentAudio = null;

async function loadSettings() {
    const rows = await dbGetAll('settings');
    rows.forEach(r => { settings[r.key] = r.value; });
}

const saveSetting = (key, value) => { settings[key] = value; return dbPut('settings', { key, value }); };

async function seedIfEmpty() {
    boards = await dbGetAll('boards');
    if (boards.length === 0) {
        for (const b of DEFAULT_BOARDS) await dbPut('boards', b);
        let order = 0;
        for (const c of DEFAULT_CELLS) {
            await dbPut('cells', {
                id: crypto.randomUUID(), boardId: c.boardId, label: c.label,
                emoji: c.emoji, image: null, audio: { mom: null, dad: null }, order: order++,
            });
        }
        boards = await dbGetAll('boards');
    }
    cells = await dbGetAll('cells');
}

// 기존에 만들어진 기본 폴더(핵심/사람/음식 등)에 이모지가 없으면 채워준다
async function backfillBoardEmojis() {
    let changed = false;
    for (const b of boards) {
        if (!b.emoji) {
            const def = DEFAULT_BOARDS.find(d => d.id === b.id);
            if (def) { b.emoji = def.emoji; await dbPut('boards', b); changed = true; }
        }
    }
    if (changed) boards = await dbGetAll('boards');
}

// 즐겨찾기 폴더가 없는 기존 사용자에게 추가, 색상도 최신값으로 유지
async function backfillFavoritesBoard() {
    const existing = boards.find(b => b.id === 'favorites');
    if (!existing) {
        await dbPut('boards', { id: 'favorites', name: '즐겨찾기', color: '#5b9bd5', order: -1, emoji: '⭐', readonly: true });
        boards = await dbGetAll('boards');
    } else if (existing.color === '#ffd700') {
        existing.color = '#5b9bd5';
        await dbPut('boards', existing);
        boards = await dbGetAll('boards');
    }
}

// ===== Rendering =====
const $ = (id) => document.getElementById(id);

function boardColor(boardId) {
    const b = boards.find(b => b.id === boardId);
    return b ? b.color : '#ddd';
}

function boardIconHtml(board, container) {
    cellImageHtml({ image: board.image, emoji: board.emoji || '📁' }, container);
}

function renderTabs() {
    const nav = $('board-tabs');
    nav.innerHTML = '';
    [...boards].sort((a, b) => a.order - b.order).forEach(b => {
        const btn = document.createElement('button');
        const isActive = b.id === activeBoardId;
        btn.className = 'board-tab' + (isActive ? ' active' : '');
        btn.style.background = b.color;
        // 스크린리더·스위치 사용자에게 지금 선택된 폴더를 알려준다
        if (isActive) btn.setAttribute('aria-current', 'true');

        const icon = document.createElement('div');
        icon.className = 'board-tab-icon';
        boardIconHtml(b, icon);

        const label = document.createElement('div');
        label.className = 'board-tab-label';
        label.textContent = b.name;

        btn.append(icon, label);

        btn.addEventListener('click', () => {
            activeBoardId = b.id;
            renderTabs();
            renderGrid();
            // 폴더를 바꾸면 항상 맨 위부터 보여준다 — 이전 폴더에서 아래로 스크롤해 둔 채
            // 새 폴더로 넘어가면 위쪽 카드가 가려져 아이가 찾기 어렵다.
            $('grid').scrollTop = 0;
        });
        nav.appendChild(btn);
    });
}

function emojiSpan(cell) {
    const span = document.createElement('span');
    span.className = 'emoji';
    span.textContent = cell.emoji || '🔲';
    span.setAttribute('aria-hidden', 'true');
    return span;
}

function cellImageHtml(cell, container) {
    container.innerHTML = '';
    if (cell.image) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(cell.image);
        img.onload = () => URL.revokeObjectURL(img.src);
        // 그림을 못 불러오면 깨진 아이콘 대신 차분히 이모지로 대체하고 URL도 정리한다
        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            img.replaceWith(emojiSpan(cell));
        };
        // 카드의 aria-label이 의미를 전하므로 그림은 보조기기에서 장식으로 처리(중복 안내 방지)
        img.alt = '';
        container.appendChild(img);
    } else {
        container.appendChild(emojiSpan(cell));
    }
}

function onActivate(el, fn) {
    // Enter/Space로도 카드를 누를 수 있게 (외부 키보드·스위치 접근)
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            fn();
        }
    });
}

function renderGrid() {
    const grid = $('grid');
    grid.innerHTML = '';
    grid.classList.toggle('hiding-mode-active', hidingMode);
    const isFavorites = activeBoardId === 'favorites';
    const list = isFavorites
        ? cells.filter(c => !!c.favorite).sort((a, b) => (a.favoriteOrder ?? 0) - (b.favoriteOrder ?? 0))
        : cells.filter(c => c.boardId === activeBoardId).sort((a, b) => a.order - b.order);

    list.forEach((cell, idx) => {
        const div = document.createElement('div');
        const isHidden = !!cell.hidden;

        if (!hidingMode && isHidden) {
            // 일반 모드: 가려진 카드는 회색 빈 칸
            div.className = 'cell cell-hidden';
            div.setAttribute('aria-hidden', 'true');
            const imgBox = document.createElement('div');
            imgBox.className = 'cell-image';
            const label = document.createElement('div');
            label.className = 'cell-label';
            label.textContent = cell.label;
            div.append(imgBox, label);
            grid.appendChild(div);
            return;
        }

        div.className = 'cell' + (hidingMode && isHidden ? ' hiding-marked' : '');
        div.style.setProperty('--cell-color', boardColor(cell.boardId));

        const imgBox = document.createElement('div');
        imgBox.className = 'cell-image';
        cellImageHtml(cell, imgBox);

        const label = document.createElement('div');
        label.className = 'cell-label';
        label.textContent = cell.label;

        div.appendChild(imgBox);
        div.appendChild(label);

        div.setAttribute('role', 'button');
        div.tabIndex = 0;

        if (editMode) {
            const badge = document.createElement('div');
            badge.className = 'edit-badge';
            badge.textContent = '✏️';
            div.appendChild(badge);

            if (!isFavorites) {
                const orderCtl = document.createElement('div');
                orderCtl.className = 'cell-order';
                const up = document.createElement('button');
                up.className = 'ord-btn';
                up.textContent = '↑';
                up.setAttribute('aria-label', '앞으로 이동');
                up.disabled = idx === 0;
                up.addEventListener('click', (e) => { e.stopPropagation(); moveCell(cell, -1); });
                const down = document.createElement('button');
                down.className = 'ord-btn';
                down.textContent = '↓';
                down.setAttribute('aria-label', '뒤로 이동');
                down.disabled = idx === list.length - 1;
                down.addEventListener('click', (e) => { e.stopPropagation(); moveCell(cell, 1); });
                orderCtl.append(up, down);
                div.appendChild(orderCtl);
            }

            if (isFavorites) {
                const orderCtl = document.createElement('div');
                orderCtl.className = 'cell-order';
                const up = document.createElement('button');
                up.className = 'ord-btn';
                up.textContent = '↑';
                up.setAttribute('aria-label', '앞으로 이동');
                up.disabled = idx === 0;
                up.addEventListener('click', (e) => { e.stopPropagation(); moveFavoriteCell(cell, -1); });
                const down = document.createElement('button');
                down.className = 'ord-btn';
                down.textContent = '↓';
                down.setAttribute('aria-label', '뒤로 이동');
                down.disabled = idx === list.length - 1;
                down.addEventListener('click', (e) => { e.stopPropagation(); moveFavoriteCell(cell, 1); });
                orderCtl.append(up, down);
                div.appendChild(orderCtl);
            }

            const starBtn = document.createElement('button');
            starBtn.className = 'fav-btn';
            starBtn.textContent = cell.favorite ? '⭐' : '☆';
            starBtn.setAttribute('aria-label', cell.favorite ? '즐겨찾기 해제' : '즐겨찾기에 추가');
            starBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                cell.favorite = !cell.favorite;
                if (cell.favorite) {
                    const maxOrd = Math.max(-1, ...cells.filter(c => c.favorite && c.id !== cell.id).map(c => c.favoriteOrder ?? 0));
                    cell.favoriteOrder = maxOrd + 1;
                }
                await dbPut('cells', cell);
                cells = await dbGetAll('cells');
                renderGrid();
            });
            div.appendChild(starBtn);

            div.setAttribute('aria-label', `${cell.label} 카드 편집`);
            const edit = () => openEditor(cell);
            div.addEventListener('click', edit);
            onActivate(div, edit);
        } else if (hidingMode) {
            div.setAttribute('aria-label', `${cell.label} ${isHidden ? '(숨김 해제)' : '(숨기기)'}`);
            const toggle = async () => {
                cell.hidden = !cell.hidden;
                await dbPut('cells', cell);
                cells = await dbGetAll('cells');
                renderGrid();
            };
            div.addEventListener('click', toggle);
            onActivate(div, toggle);
        } else {
            div.setAttribute('aria-label', cell.label);
            const speak = () => speakCell(cell, div);
            let startX, startY, dragHideTimer = null, dragHideActive = false;

            div.addEventListener('pointerdown', (e) => {
                startX = e.clientX;
                startY = e.clientY;
                dragHideActive = false;
                if (settings.dragToHide) {
                    const pointerId = e.pointerId;
                    dragHideTimer = setTimeout(() => {
                        dragHideActive = true;
                        try { div.setPointerCapture(pointerId); } catch {}
                        div.style.touchAction = 'none';
                        div.classList.add('drag-to-hide-lift');
                        $('btn-hiding').classList.add('drag-target');
                    }, 2000);
                }
            });

            const overTrash = (x, y) => {
                const r = $('btn-hiding').getBoundingClientRect();
                return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
            };
            const dropOnTrash = () => {
                cell.hidden = true;
                dbPut('cells', cell).then(() => dbGetAll('cells')).then(c => { cells = c; renderGrid(); });
            };
            const endDragVisuals = () => {
                div.style.touchAction = '';
                div.classList.remove('drag-to-hide-lift');
                $('btn-hiding').classList.remove('drag-target', 'drag-over');
            };

            div.addEventListener('pointermove', (e) => {
                if (dragHideTimer && !dragHideActive) {
                    const d = Math.sqrt((e.clientX - startX) ** 2 + (e.clientY - startY) ** 2);
                    if (d > 15) {
                        clearTimeout(dragHideTimer);
                        dragHideTimer = null;
                    }
                }
                if (dragHideActive) {
                    $('btn-hiding').classList.toggle('drag-over', overTrash(e.clientX, e.clientY));
                }
            });

            // 터치 스크롤을 실제로 막는 유일한 방법: non-passive touchmove + preventDefault.
            // (pointermove의 preventDefault나 도중에 바꾸는 touch-action은 진행 중인 제스처를 막지 못함)
            // 터치 이벤트는 시작 요소(div)에 자동으로 고정되므로 손가락이 휴지통으로 가도 계속 발생한다.
            div.addEventListener('touchmove', (e) => {
                if (dragHideTimer && !dragHideActive && e.touches[0]) {
                    const t = e.touches[0];
                    const d = Math.sqrt((t.clientX - startX) ** 2 + (t.clientY - startY) ** 2);
                    if (d > 15) { clearTimeout(dragHideTimer); dragHideTimer = null; }
                }
                if (dragHideActive) {
                    e.preventDefault(); // 스크롤 차단 → pointercancel 방지
                    const t = e.touches[0];
                    if (t) $('btn-hiding').classList.toggle('drag-over', overTrash(t.clientX, t.clientY));
                }
            }, { passive: false });

            // 터치 드롭 처리 (pointerup보다 신뢰성 높음 — 터치 고정 덕분)
            div.addEventListener('touchend', (e) => {
                if (!dragHideActive) return;
                dragHideActive = false;
                clearTimeout(dragHideTimer);
                dragHideTimer = null;
                const t = e.changedTouches[0];
                const onTrash = t && overTrash(t.clientX, t.clientY);
                endDragVisuals();
                if (onTrash) { e.preventDefault(); dropOnTrash(); }
            });

            div.addEventListener('pointerup', (e) => {
                clearTimeout(dragHideTimer);
                dragHideTimer = null;
                if (dragHideActive) {
                    // 마우스 등 비터치 입력의 드롭 처리 (터치는 touchend가 담당)
                    dragHideActive = false;
                    const onTrash = overTrash(e.clientX, e.clientY);
                    endDragVisuals();
                    if (onTrash) dropOnTrash();
                    return;
                }
                endDragVisuals();
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 120) { speak(); return; }
                if (settings.inCardDragAsClick) {
                    const rect = div.getBoundingClientRect();
                    if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) speak();
                }
            });

            div.addEventListener('pointercancel', () => {
                clearTimeout(dragHideTimer);
                dragHideTimer = null;
                // 터치 드래그 중 pointercancel이 와도 dragHideActive는 유지 — touchend가 드롭을 처리한다.
                if (!dragHideActive) endDragVisuals();
            });

            onActivate(div, speak);
        }
        grid.appendChild(div);
    });

    if (list.length === 0 && !editMode && !hidingMode) {
        const empty = document.createElement('div');
        empty.className = 'grid-empty';
        empty.textContent = isFavorites
            ? '즐겨찾기한 카드가 없어요. 편집 모드에서 카드의 ☆을 눌러 추가해 보세요.'
            : '이 폴더에는 아직 카드가 없어요. 톱니바퀴를 길게 눌러 편집 모드에서 카드를 추가해 주세요.';
        grid.appendChild(empty);
    }

    if (editMode && !isFavorites) {
        const add = document.createElement('div');
        add.className = 'cell add-cell';
        add.textContent = '+';
        add.setAttribute('role', 'button');
        add.setAttribute('aria-label', '카드 추가');
        add.tabIndex = 0;
        const addCard = () => openEditor(null);
        add.addEventListener('click', addCard);
        onActivate(add, addCard);
        grid.appendChild(add);
    }
    requestAnimationFrame(applyEmojiSize);
}

// ===== Home screen (카테고리만 보이는 화면) =====
function renderHomeGrid() {
    const grid = $('home-grid');
    grid.innerHTML = '';
    [...boards].sort((a, b) => a.order - b.order).forEach(b => {
        const div = document.createElement('div');
        div.className = 'cell';
        div.style.setProperty('--cell-color', b.color);

        const imgBox = document.createElement('div');
        imgBox.className = 'cell-image';
        boardIconHtml(b, imgBox);

        const label = document.createElement('div');
        label.className = 'cell-label';
        label.textContent = b.name;

        div.append(imgBox, label);
        div.setAttribute('role', 'button');
        div.tabIndex = 0;
        div.setAttribute('aria-label', b.name);

        // 홈 화면에서 카테고리를 눌러 들어갈 때는 카드처럼 음성을 내지 않는다
        const enter = () => {
            activeBoardId = b.id;
            setHomeMode(false);
        };
        div.addEventListener('click', enter);
        onActivate(div, enter);
        grid.appendChild(div);
    });
    requestAnimationFrame(applyEmojiSize);
}

function setHomeMode(on) {
    homeMode = on;
    if (on && hidingMode) exitHidingMode();
    $('board-tabs').style.display = on ? 'none' : '';
    $('grid').style.display = on ? 'none' : '';
    $('home-grid').style.display = on ? 'grid' : 'none';
    $('edit-banner').style.display = (!on && editMode) ? 'flex' : 'none';
    $('hiding-banner').style.display = (!on && hidingMode) ? 'flex' : 'none';
    $('btn-home-toggle').textContent = on ? '↩️' : '🏠';
    $('btn-home-toggle').setAttribute('aria-label', on ? '카드 화면으로 돌아가기' : '홈 화면(카테고리만 보기)');
    if (on) {
        renderHomeGrid();
    } else {
        renderTabs();
        renderGrid();
    }
}

function setupHomeToggle() {
    $('btn-home-toggle').addEventListener('click', () => setHomeMode(!homeMode));
}

function updateVoiceIndicator() {
    const names = { mom: '엄마 목소리', dad: '아빠 목소리', tts: '기계 음성' };
    $('voice-indicator').textContent = names[settings.voice] || '';
}

function applyEmojiSize() {
    // 카드 너비를 기준으로 이모지 크기를 정한다. 너비는 grid 1fr로 항상 배율에 따라
    // 커지므로, aspect-ratio/flex 높이가 불안정한 기기에서도 이모지가 확실히 함께 커진다.
    const cell = document.querySelector(homeMode ? '#home-grid .cell' : '#grid .cell');
    if (!cell) return;
    const w = cell.getBoundingClientRect().width;
    if (w > 0) document.documentElement.style.setProperty('--emoji-size', `${Math.round(w * 0.55)}px`);
}

function applyCardScale() {
    document.documentElement.style.setProperty('--cell-scale', settings.cardScale || 1);
    requestAnimationFrame(applyEmojiSize);
}

function applyLabelSize() {
    const scale = LABEL_SCALES[settings.labelSize] || 1;
    document.documentElement.style.setProperty('--label-scale', scale);
}

function renderLabelSizeButtons() {
    document.querySelectorAll('#label-size button').forEach(b => {
        const on = b.dataset.size === (settings.labelSize || 'medium');
        b.classList.toggle('selected', on);
        // 선택된 글자 크기를 보조기술(스크린리더·스위치)에도 알린다
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
}

function applyAnimSetting() {
    // 기본 OFF: 애니메이션을 끄면 reduce-motion 클래스로 카드/오버레이 움직임을 제거
    document.documentElement.classList.toggle('reduce-motion', !settings.animations);
}

// 보상 효과음: 말하기 후 짧고 부드러운 2음 차임 (설정으로 켤 때만)
let audioCtx = null;
function playChime() {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        [523.25, 659.25].forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const t = now + i * 0.12;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.07, t + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
            osc.connect(gain).connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + 0.45);
        });
    } catch {}
}

async function moveCell(cell, dir) {
    const list = cells.filter(c => c.boardId === cell.boardId).sort((a, b) => a.order - b.order);
    const i = list.findIndex(c => c.id === cell.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    const tmp = a.order; a.order = b.order; b.order = tmp;
    await dbPut('cells', a);
    await dbPut('cells', b);
    cells = await dbGetAll('cells');
    renderGrid();
}

async function moveFavoriteCell(cell, dir) {
    const list = cells.filter(c => !!c.favorite).sort((a, b) => (a.favoriteOrder ?? 0) - (b.favoriteOrder ?? 0));
    const i = list.findIndex(c => c.id === cell.id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    const tmp = a.favoriteOrder ?? 0; a.favoriteOrder = b.favoriteOrder ?? 0; b.favoriteOrder = tmp;
    await dbPut('cells', a);
    await dbPut('cells', b);
    cells = await dbGetAll('cells');
    renderGrid();
}

// ===== Speech =====
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    if (ttsSupported) speechSynthesis.cancel();
}

function playBlob(blob) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudio = audio;
        // onpause는 stopCurrentAudio()로 중단됐을 때 약속을 풀어준다.
        // (이게 없으면 빠르게 연속으로 누를 때 이전 카드가 멈춘 채로 남음)
        // ok=false면 재생 실패(깨진 녹음 등) — 호출 측에서 기계 음성으로 대신 읽는다.
        const done = (ok) => { URL.revokeObjectURL(url); resolve(ok); };
        audio.onended = audio.onpause = () => done(true);
        audio.onerror = () => done(false);
        audio.play().catch(() => done(false));
    });
}

let activeUtterance = null; // 일부 브라우저가 발화 객체를 가비지 컬렉션해 onend가 안 오는 것 방지

function speakTts(text) {
    return new Promise((resolve) => {
        if (!ttsSupported) { resolve(); return; }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ko-KR';
        u.rate = settings.ttsRate;
        const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ko'));
        if (voice) u.voice = voice;
        activeUtterance = u;
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            clearTimeout(watchdog);
            if (activeUtterance === u) activeUtterance = null;
            resolve();
        };
        u.onend = u.onerror = finish;
        // 일부 안드로이드 태블릿 브라우저는 onend/onerror가 끝내 오지 않아
        // 약속이 영영 안 풀린다(말풍선·강조가 멈춘 채로 남음). 글자 수에 맞춰
        // 넉넉히 기다린 뒤 강제로 마무리해 화면 상태가 항상 회복되게 한다.
        const watchdog = setTimeout(finish, 3000 + text.length * 600);
        speechSynthesis.speak(u);
    });
}

const LOG_CAP = 4000; // 사용 기록은 최근 분량만 보관 (저장공간 보호 + 통계 속도)
let logsSincePrune = 0;

async function pruneLogs() {
    try {
        const all = await dbGetAll('logs');
        if (all.length <= LOG_CAP) return;
        all.sort((a, b) => a.id - b.id); // 오래된 것(작은 id)부터
        for (let i = 0; i < all.length - LOG_CAP; i++) await dbDelete('logs', all[i].id);
    } catch {}
}

function logUsage(cell) {
    // 기기 내에만 저장(개인정보) — 실패해도 말하기는 막지 않는다
    dbPut('logs', { cellId: cell.id, label: cell.label, ts: Date.now() }).catch(() => {});
    // 가끔씩만 정리해 탭마다 부담을 주지 않는다
    if (++logsSincePrune >= 100) { logsSincePrune = 0; pruneLogs(); }
}

let speakSeq = 0;

async function speakCell(cell, cellEl) {
    stopCurrentAudio();
    const mySeq = ++speakSeq;
    logUsage(cell);
    // 빠르게 다른 카드를 누르면 이전 카드가 줄어든 채로 남지 않도록 정리
    document.querySelectorAll('.cell.speaking').forEach(c => c.classList.remove('speaking'));
    if (cellEl) cellEl.classList.add('speaking');
    showSpeakOverlay(cell);

    const pref = settings.voice;
    let blob = null;
    if (pref === 'mom') blob = cell.audio?.mom || cell.audio?.dad;
    else if (pref === 'dad') blob = cell.audio?.dad || cell.audio?.mom;

    if (blob) {
        const ok = await playBlob(blob);
        // 부모 녹음이 깨져 재생되지 않으면 기계 음성으로라도 읽어준다(무음 방지)
        if (!ok && mySeq === speakSeq) await speakTts(cell.speech || cell.label);
    } else {
        await speakTts(cell.speech || cell.label);
    }

    // 말하는 도중 다른 카드를 눌렀다면(최신 호출이 아니면) 마무리는 그쪽에 맡긴다
    if (mySeq !== speakSeq) return;
    if (cellEl) cellEl.classList.remove('speaking');
    hideSpeakOverlay();
    if (settings.rewardSound) playChime();
}

let overlayTimer = null;

function showSpeakOverlay(cell) {
    clearTimeout(overlayTimer);
    cellImageHtml(cell, $('speak-overlay-image'));
    $('speak-overlay-label').textContent = cell.label;
    $('speak-overlay').style.display = 'flex';
}

function hideSpeakOverlay() {
    overlayTimer = setTimeout(() => { $('speak-overlay').style.display = 'none'; }, 250);
}

function setupSpeakOverlay() {
    // pointerup을 쓰면 카드 탭(pointerup → 오버레이 표시)의 합성 click이
    // 오버레이를 곧바로 닫는 문제를 딜레이 없이 해결할 수 있다.
    $('speak-overlay').addEventListener('pointerup', () => {
        if (!settings.cancelOnTouch) return;
        speakSeq++;
        stopCurrentAudio();
        document.querySelectorAll('.cell.speaking').forEach(c => c.classList.remove('speaking'));
        clearTimeout(overlayTimer);
        $('speak-overlay').style.display = 'none';
    });
}

// ===== Caregiver gate (3초 길게 누르기 + 산수 문제) =====
let holdTimer = null;
let gateCallback = null;

function setupGate() {
    const gear = $('btn-settings');
    const start = (e) => {
        e.preventDefault();
        gear.classList.add('holding');
        holdTimer = setTimeout(() => {
            gear.classList.remove('holding');
            openGate(() => openSettings());
        }, 3000);
    };
    const cancel = () => {
        gear.classList.remove('holding');
        clearTimeout(holdTimer);
    };
    gear.addEventListener('pointerdown', start);
    gear.addEventListener('pointerup', cancel);
    gear.addEventListener('pointerleave', cancel);
    // 태블릿에서 OS가 제스처를 가로채면(시스템 스와이프·손바닥 인식 등) pointercancel이 온다.
    // 이때 타이머를 정리하지 않으면 길게 누르기가 잘못 열리거나 진행 표시가 남는다.
    gear.addEventListener('pointercancel', cancel);

    $('gate-cancel').addEventListener('click', () => { $('gate-modal').style.display = 'none'; });
    $('gate-ok').addEventListener('click', checkGate);
    $('gate-answer').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkGate(); });
}

let gateExpected = 0;

function openGate(callback) {
    gateCallback = callback;
    const a = 3 + Math.floor(Math.random() * 6);
    const b = 4 + Math.floor(Math.random() * 6);
    gateExpected = a * b;
    $('gate-question').textContent = `${a} × ${b} = ?`;
    $('gate-answer').value = '';
    // 지난번 오답으로 바뀐 안내 문구가 남아 새로 열 때도 '다시 입력' 처럼 보이던 문제를 막는다
    $('gate-answer').placeholder = '정답 입력';
    $('gate-modal').style.display = 'flex';
    setTimeout(() => $('gate-answer').focus(), 100);
}

function checkGate() {
    if (parseInt($('gate-answer').value, 10) === gateExpected) {
        $('gate-modal').style.display = 'none';
        if (gateCallback) gateCallback();
    } else {
        $('gate-answer').value = '';
        $('gate-answer').placeholder = '다시 입력해 주세요';
        $('gate-answer').focus();
    }
}

// ===== 숨김 모드 =====
let hidingHoldTimer = null;

function setupHidingMode() {
    const btn = $('btn-hiding');
    const ring = $('hiding-hold-ring');

    const start = (e) => {
        e.preventDefault();
        btn.classList.add('holding');
        hidingHoldTimer = setTimeout(() => {
            btn.classList.remove('holding');
            openGate(() => enterHidingMode());
        }, 3000);
    };
    const cancel = () => {
        btn.classList.remove('holding');
        clearTimeout(hidingHoldTimer);
    };
    btn.addEventListener('pointerdown', start);
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);

    $('btn-exit-hiding').addEventListener('click', exitHidingMode);

    $('btn-unhide-all').addEventListener('click', async () => {
        if (!confirm('가려진 카드를 모두 해제할까요?')) return;
        for (const c of cells) {
            if (c.hidden) { c.hidden = false; await dbPut('cells', c); }
        }
        cells = await dbGetAll('cells');
        renderGrid();
    });
}

function enterHidingMode() {
    hidingMode = true;
    $('hiding-banner').style.display = 'flex';
    renderGrid();
}

function exitHidingMode() {
    hidingMode = false;
    $('hiding-banner').style.display = 'none';
    renderGrid();
}

// ===== Settings =====
function openSettings() {
    document.querySelectorAll('input[name="voice"]').forEach(r => {
        r.checked = r.value === settings.voice;
    });
    $('tts-rate').value = settings.ttsRate;
    $('tts-rate-value').textContent = `${settings.ttsRate}배`;
    $('tts-rate').setAttribute('aria-valuetext', `${settings.ttsRate}배`);
    $('card-scale').value = settings.cardScale || 1;
    $('card-scale-value').textContent = `${Number(settings.cardScale || 1).toFixed(2)}배`;
    $('card-scale').setAttribute('aria-valuetext', `${Number(settings.cardScale || 1).toFixed(2)}배`);
    $('opt-animations').checked = !!settings.animations;
    $('opt-reward-sound').checked = !!settings.rewardSound;
    $('opt-cancel-on-touch').checked = settings.cancelOnTouch !== false;
    $('opt-drag-to-hide').checked = !!settings.dragToHide;
    $('opt-in-card-drag').checked = settings.inCardDragAsClick !== false;
    renderLabelSizeButtons();
    renderBoardManager();
    renderUsageStats();
    checkKoreanVoice();
    renderBackupStatus();
    const modal = $('settings-modal');
    modal.style.display = 'flex';
    // 설정을 열 때마다 항상 첫 항목(목소리 선택)부터 보이게 한다 — 지난번에 아래로
    // 스크롤해 두면 다시 열었을 때 중간부터 보여 보호자가 헷갈린다.
    modal.querySelector('.modal-box').scrollTop = 0;
}

function checkKoreanVoice() {
    const warn = $('tts-no-voice');
    if (!warn) return;
    const hasKorean = ttsSupported && speechSynthesis.getVoices().some(v => v.lang && v.lang.startsWith('ko'));
    warn.style.display = hasKorean ? 'none' : 'block';
}

async function renderUsageStats() {
    const wrap = $('usage-stats');
    if (!wrap) return;
    const logs = await dbGetAll('logs');
    $('usage-total').textContent = `총 ${logs.length}번 눌렀어요`;
    if (logs.length === 0) {
        wrap.innerHTML = '<p class="hint">아직 사용 기록이 없어요. 아이가 카드를 누르면 여기에 쌓여요.</p>';
        return;
    }
    const counts = {};
    logs.forEach(l => { counts[l.label] = (counts[l.label] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = sorted[0][1];
    // 많이 쓴 단어가 한눈에 들어오도록 상위 20개만 보여준다(목록이 길면 정작 중요한 정보가 묻힌다)
    const TOP_N = 20;
    const shown = sorted.slice(0, TOP_N);
    wrap.innerHTML = '';
    shown.forEach(([label, n]) => {
        const row = document.createElement('div');
        row.className = 'usage-row';
        const name = document.createElement('span');
        name.className = 'usage-label';
        name.textContent = label;
        const track = document.createElement('span');
        track.className = 'usage-track';
        const bar = document.createElement('span');
        bar.className = 'usage-bar';
        bar.style.width = `${Math.round((n / max) * 100)}%`;
        track.appendChild(bar);
        const num = document.createElement('span');
        num.className = 'usage-count';
        num.textContent = `${n}번`;
        row.append(name, track, num);
        wrap.appendChild(row);
    });
    if (sorted.length > TOP_N) {
        const more = document.createElement('p');
        more.className = 'hint';
        more.textContent = `그 외 ${sorted.length - TOP_N}개 단어가 더 있어요`;
        wrap.appendChild(more);
    }
}

function setupSettings() {
    $('settings-close').addEventListener('click', () => { $('settings-modal').style.display = 'none'; });

    document.querySelectorAll('input[name="voice"]').forEach(r => {
        r.addEventListener('change', () => {
            saveSetting('voice', r.value);
            updateVoiceIndicator();
        });
    });

    $('tts-rate').addEventListener('input', () => {
        const v = parseFloat($('tts-rate').value);
        saveSetting('ttsRate', v);
        $('tts-rate-value').textContent = `${v}배`;
        $('tts-rate').setAttribute('aria-valuetext', `${v}배`);
    });
    $('btn-tts-test').addEventListener('click', () => speakTts('안녕하세요, 반가워요'));

    $('card-scale').addEventListener('input', () => {
        const v = parseFloat($('card-scale').value);
        saveSetting('cardScale', v);
        $('card-scale-value').textContent = `${v.toFixed(2)}배`;
        $('card-scale').setAttribute('aria-valuetext', `${v.toFixed(2)}배`);
        applyCardScale();
    });

    document.querySelectorAll('#label-size button').forEach(b => {
        b.addEventListener('click', () => {
            saveSetting('labelSize', b.dataset.size);
            applyLabelSize();
            renderLabelSizeButtons();
        });
    });

    $('opt-animations').addEventListener('change', (e) => {
        saveSetting('animations', e.target.checked);
        applyAnimSetting();
    });
    $('opt-reward-sound').addEventListener('change', (e) => {
        saveSetting('rewardSound', e.target.checked);
        if (e.target.checked) playChime(); // 켤 때 미리 들려주기
    });
    $('opt-cancel-on-touch').addEventListener('change', (e) => {
        saveSetting('cancelOnTouch', e.target.checked);
    });
    $('opt-drag-to-hide').addEventListener('change', (e) => {
        saveSetting('dragToHide', e.target.checked);
    });
    $('opt-in-card-drag').addEventListener('change', (e) => {
        saveSetting('inCardDragAsClick', e.target.checked);
    });

    $('btn-add-board').addEventListener('click', () => openBoardEditor(null));
    $('btn-load-starter').addEventListener('click', loadStarterPack);

    $('btn-clear-logs').addEventListener('click', async () => {
        if (!confirm('사용 기록을 모두 지울까요? 카드와 녹음은 그대로 둡니다.')) return;
        await dbClear('logs');
        renderUsageStats();
    });

    $('btn-enter-edit').addEventListener('click', () => {
        editMode = true;
        $('settings-modal').style.display = 'none';
        $('edit-banner').style.display = 'flex';
        renderGrid();
    });
    $('btn-exit-edit').addEventListener('click', () => {
        editMode = false;
        $('edit-banner').style.display = 'none';
        renderGrid();
    });

    $('btn-batch-mom').addEventListener('click', () => startBatch('mom'));
    $('btn-batch-dad').addEventListener('click', () => startBatch('dad'));

    $('btn-export').addEventListener('click', exportData);
    $('btn-import').addEventListener('click', () => $('import-input').click());
    $('import-input').addEventListener('change', importData);

    $('btn-fullscreen').addEventListener('click', () => {
        if (document.fullscreenElement) {
            document.exitFullscreen?.();
            return;
        }
        const el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => {});
        } else {
            // 아이폰 사파리 등은 전체화면 API가 없어 그냥 눌러도 아무 일이 없었다.
            // 죽은 버튼처럼 보이지 않게 대신 방법을 안내한다.
            alert('이 브라우저는 전체 화면을 지원하지 않아요. 홈 화면에 추가해서 열면 전체 화면으로 실행됩니다.');
        }
    });
}

// ===== Board (folder) management =====
let editingBoard = null;       // null이면 새 폴더
let pendingBoardColor = BOARD_COLORS[0];
let pendingBoardImage = undefined; // undefined = 변경 없음, null = 제거, Blob = 새 이미지
let pendingBoardEmoji = undefined;
// 사진/이모지/그림검색 모달은 카드 편집과 폴더 편집이 함께 쓴다 — 지금 어느 쪽을 위해
// 골랐는지 표시해서 선택 결과를 올바른 곳(카드 vs 폴더 아이콘)에 반영한다.
let pickerTarget = 'cell';

function currentBoardIconImage() {
    if (pendingBoardImage !== undefined) return pendingBoardImage;
    return editingBoard ? editingBoard.image : null;
}

function currentBoardIconEmoji() {
    if (pendingBoardEmoji !== undefined) return pendingBoardEmoji;
    return editingBoard ? editingBoard.emoji : null;
}

function updateBoardIconPreview() {
    boardIconHtml({ image: currentBoardIconImage(), emoji: currentBoardIconEmoji() }, $('board-icon-preview'));
}

function renderBoardManager() {
    const wrap = $('board-manager');
    wrap.innerHTML = '';
    const sorted = [...boards].sort((a, b) => a.order - b.order);
    sorted.forEach((b, idx) => {
        const row = document.createElement('div');
        row.className = 'board-row';

        const dot = document.createElement('span');
        dot.className = 'dot';
        dot.style.background = b.color;

        const name = document.createElement('span');
        name.className = 'bname';
        const count = b.id === 'favorites'
            ? cells.filter(c => !!c.favorite).length
            : cells.filter(c => c.boardId === b.id).length;
        name.textContent = `${b.name} (${count})`;

        row.append(dot, name);

        if (!b.readonly) {
            const up = document.createElement('button');
            up.className = 'iconbtn';
            up.textContent = '↑';
            up.disabled = idx === 0;
            up.addEventListener('click', () => moveBoard(b, -1));

            const down = document.createElement('button');
            down.className = 'iconbtn';
            down.textContent = '↓';
            down.disabled = idx === sorted.length - 1;
            down.addEventListener('click', () => moveBoard(b, 1));

            const edit = document.createElement('button');
            edit.className = 'iconbtn';
            edit.textContent = '✏️';
            edit.addEventListener('click', () => openBoardEditor(b));

            row.append(up, down, edit);
        }
        wrap.appendChild(row);
    });
}

async function moveBoard(board, dir) {
    const sorted = [...boards].sort((a, b) => a.order - b.order);
    const i = sorted.findIndex(b => b.id === board.id);
    const j = i + dir;
    if (j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    const tmp = a.order; a.order = b.order; b.order = tmp;
    await dbPut('boards', a);
    await dbPut('boards', b);
    boards = await dbGetAll('boards');
    renderBoardManager();
    renderTabs();
    renderGrid();
}

function openBoardEditor(board) {
    if (board && board.readonly) return;
    editingBoard = board;
    pickerTarget = 'board';
    pendingBoardColor = board ? board.color : BOARD_COLORS[0];
    pendingBoardImage = undefined;
    pendingBoardEmoji = undefined;
    $('board-modal-title').textContent = board ? '폴더 편집' : '새 폴더 만들기';
    $('board-name').value = board ? board.name : '';
    $('board-delete').style.display = board ? 'block' : 'none';
    updateBoardIconPreview();

    const pal = $('color-palette');
    pal.innerHTML = '';
    BOARD_COLORS.forEach(c => {
        const b = document.createElement('button');
        b.type = 'button';
        b.style.background = c;
        b.setAttribute('aria-label', (BOARD_COLOR_NAMES[c] || '색') + ' 색');
        const selected = c === pendingBoardColor;
        if (selected) b.classList.add('selected');
        b.setAttribute('aria-pressed', selected ? 'true' : 'false');
        b.addEventListener('click', () => {
            pendingBoardColor = c;
            pal.querySelectorAll('button').forEach(x => {
                x.classList.remove('selected');
                x.setAttribute('aria-pressed', 'false');
            });
            b.classList.add('selected');
            b.setAttribute('aria-pressed', 'true');
        });
        pal.appendChild(b);
    });
    $('board-modal').style.display = 'flex';
}

function setupBoardEditor() {
    $('board-cancel').addEventListener('click', () => { $('board-modal').style.display = 'none'; });

    $('btn-board-pick-photo').addEventListener('click', () => { pickerTarget = 'board'; $('photo-input').click(); });
    $('btn-board-pick-emoji').addEventListener('click', () => { pickerTarget = 'board'; openEmojiPicker(); });
    $('btn-board-pick-arasaac').addEventListener('click', () => {
        pickerTarget = 'board';
        $('arasaac-query').value = $('board-name').value.trim();
        $('arasaac-results').innerHTML = '';
        renderArasaacRecent();
        $('arasaac-modal').style.display = 'flex';
    });

    $('board-save').addEventListener('click', async () => {
        const name = $('board-name').value.trim();
        if (!name) { $('board-name').placeholder = '폴더 이름을 입력해 주세요'; return; }
        if (editingBoard) {
            editingBoard.name = name;
            editingBoard.color = pendingBoardColor;
            if (pendingBoardImage !== undefined) editingBoard.image = pendingBoardImage;
            if (pendingBoardEmoji !== undefined) editingBoard.emoji = pendingBoardEmoji;
            await dbPut('boards', editingBoard);
        } else {
            const order = Math.max(-1, ...boards.map(b => b.order)) + 1;
            await dbPut('boards', {
                id: crypto.randomUUID(), name, color: pendingBoardColor, order,
                image: pendingBoardImage ?? null,
                emoji: pendingBoardEmoji ?? null,
            });
        }
        boards = await dbGetAll('boards');
        $('board-modal').style.display = 'none';
        renderBoardManager();
        renderTabs();
        renderGrid();
    });

    $('board-delete').addEventListener('click', async () => {
        if (!editingBoard) return;
        if (boards.length <= 1) { alert('폴더는 최소 1개는 있어야 해요.'); return; }
        const inBoard = cells.filter(c => c.boardId === editingBoard.id);
        const msg = inBoard.length > 0
            ? `'${editingBoard.name}' 폴더와 그 안의 카드 ${inBoard.length}개를 모두 삭제할까요?`
            : `'${editingBoard.name}' 폴더를 삭제할까요?`;
        if (!confirm(msg)) return;
        for (const c of inBoard) await dbDelete('cells', c.id);
        await dbDelete('boards', editingBoard.id);
        boards = await dbGetAll('boards');
        cells = await dbGetAll('cells');
        if (activeBoardId === editingBoard.id) {
            activeBoardId = [...boards].sort((a, b) => a.order - b.order)[0]?.id || 'core';
        }
        $('board-modal').style.display = 'none';
        renderBoardManager();
        renderTabs();
        renderGrid();
    });
}

// 기존 사용자에게 기본(추천) 카드를 추가 — 이미 있는 단어는 건너뜀
async function loadStarterPack() {
    const existingBoardIds = new Set(boards.map(b => b.id));
    let maxBoardOrder = Math.max(-1, ...boards.map(b => b.order));
    for (const b of DEFAULT_BOARDS) {
        if (!existingBoardIds.has(b.id)) {
            await dbPut('boards', { ...b, order: ++maxBoardOrder });
        }
    }
    boards = await dbGetAll('boards');

    const existing = new Set(cells.map(c => `${c.boardId}|${c.label}`));
    let order = Math.max(0, ...cells.map(c => c.order));
    let added = 0;
    for (const c of DEFAULT_CELLS) {
        const key = `${c.boardId}|${c.label}`;
        if (existing.has(key)) continue;
        await dbPut('cells', {
            id: crypto.randomUUID(), boardId: c.boardId, label: c.label,
            emoji: c.emoji, image: null, audio: { mom: null, dad: null }, order: order++,
        });
        existing.add(key);
        added++;
    }
    cells = await dbGetAll('cells');
    renderBoardManager();
    renderTabs();
    renderGrid();
    alert(added > 0 ? `추천 카드 ${added}개를 추가했어요.` : '추가할 새 카드가 없어요. 이미 다 있어요.');
}

// ===== Cell editor =====
let editingCell = null;       // null이면 새 카드
let pendingImage = undefined; // undefined = 변경 없음, null = 제거, Blob = 새 이미지
let pendingEmoji = undefined;
let pendingAudio = { mom: undefined, dad: undefined };

function openEditor(cell) {
    editingCell = cell;
    pickerTarget = 'cell';
    pendingImage = undefined;
    pendingEmoji = undefined;
    pendingAudio = { mom: undefined, dad: undefined };

    $('editor-title').textContent = cell ? '카드 편집' : '새 카드 만들기';
    // 지난번 빈 칸 저장 시도로 바뀐 경고 문구가 남아 새로 열 때도 보이던 문제를 막는다
    $('editor-label').placeholder = '예: 물';
    $('editor-label').value = cell ? cell.label : '';
    $('editor-speech').value = cell ? (cell.speech || '') : '';
    $('editor-delete').style.display = cell ? 'block' : 'none';

    const sel = $('editor-board');
    sel.innerHTML = '';
    [...boards].sort((a, b) => a.order - b.order).forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.id;
        opt.textContent = b.name;
        sel.appendChild(opt);
    });
    sel.value = cell ? cell.boardId : activeBoardId;

    updateEditorPreview();
    updateRecRows();
    $('editor-modal').style.display = 'flex';
}

function currentEditorImage() {
    if (pendingImage !== undefined) return pendingImage;
    return editingCell ? editingCell.image : null;
}

function currentEditorEmoji() {
    if (pendingEmoji !== undefined) return pendingEmoji;
    return editingCell ? editingCell.emoji : null;
}

function updateEditorPreview() {
    cellImageHtml({ image: currentEditorImage(), emoji: currentEditorEmoji() }, $('editor-preview'));
}

function currentEditorAudio(profile) {
    if (pendingAudio[profile] !== undefined) return pendingAudio[profile];
    return editingCell ? editingCell.audio?.[profile] : null;
}

function updateRecRows() {
    ['mom', 'dad'].forEach(p => {
        const has = !!currentEditorAudio(p);
        document.querySelector(`.rec-play[data-profile="${p}"]`).disabled = !has;
        document.querySelector(`.rec-del[data-profile="${p}"]`).disabled = !has;
    });
}

function setupEditor() {
    $('editor-cancel').addEventListener('click', () => { cancelRecording(); $('editor-modal').style.display = 'none'; });

    $('editor-save').addEventListener('click', async () => {
        const label = $('editor-label').value.trim();
        if (!label) { $('editor-label').placeholder = '단어를 입력해 주세요'; $('editor-label').focus(); return; }
        cancelRecording();

        const cell = editingCell || {
            id: crypto.randomUUID(),
            audio: { mom: null, dad: null },
            image: null, emoji: null,
            order: Math.max(0, ...cells.map(c => c.order)) + 1,
        };
        cell.label = label;
        cell.speech = $('editor-speech').value.trim() || null;
        cell.boardId = $('editor-board').value;
        if (pendingImage !== undefined) cell.image = pendingImage;
        if (pendingEmoji !== undefined) cell.emoji = pendingEmoji;
        if (pendingAudio.mom !== undefined) cell.audio.mom = pendingAudio.mom;
        if (pendingAudio.dad !== undefined) cell.audio.dad = pendingAudio.dad;

        try {
            await dbPut('cells', cell);
        } catch {
            // 저장 공간 부족 등으로 저장이 실패하면 창을 닫지 않고 알려준다(입력 내용 보존)
            alert('카드를 저장하지 못했어요. 저장 공간이 부족할 수 있어요. 사진을 빼거나 오래된 카드를 정리한 뒤 다시 시도해 주세요.');
            return;
        }
        cells = await dbGetAll('cells');
        $('editor-modal').style.display = 'none';
        renderGrid();
    });

    $('editor-delete').addEventListener('click', async () => {
        if (!editingCell) return;
        if (!confirm(`'${editingCell.label}' 카드를 삭제할까요?`)) return;
        await dbDelete('cells', editingCell.id);
        cells = await dbGetAll('cells');
        $('editor-modal').style.display = 'none';
        renderGrid();
    });

    // 사진/파일 업로드 → 긴 변 512px로 축소 저장
    $('btn-pick-photo').addEventListener('click', () => $('photo-input').click());
    $('photo-input').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;
        try {
            // 브라우저가 못 읽는 사진(HEIC·손상 파일 등)이면 createImageBitmap이 실패한다
            const blob = await resizeImage(file, 512);
            if (!blob) throw new Error('no blob');
            if (pickerTarget === 'board') {
                pendingBoardImage = blob;
                pendingBoardEmoji = null;
                updateBoardIconPreview();
            } else {
                pendingImage = blob;
                pendingEmoji = null;
                updateEditorPreview();
            }
        } catch {
            alert('이 사진을 사용할 수 없어요. 다른 사진(JPG·PNG)으로 시도해 주세요.');
        }
    });

    // 이모지 선택
    $('btn-pick-emoji').addEventListener('click', () => { pickerTarget = 'cell'; openEmojiPicker(); });

    // ARASAAC 검색
    $('btn-pick-arasaac').addEventListener('click', () => {
        pickerTarget = 'cell';
        $('arasaac-query').value = $('editor-label').value.trim();
        $('arasaac-results').innerHTML = '';
        renderArasaacRecent();
        $('arasaac-modal').style.display = 'flex';
    });

    // 녹음 버튼들
    document.querySelectorAll('.rec-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleRecord(btn, btn.dataset.profile));
    });
    document.querySelectorAll('.rec-play').forEach(btn => {
        btn.addEventListener('click', () => {
            const blob = currentEditorAudio(btn.dataset.profile);
            if (blob) playBlob(blob);
        });
    });
    document.querySelectorAll('.rec-del').forEach(btn => {
        btn.addEventListener('click', () => {
            pendingAudio[btn.dataset.profile] = null;
            updateRecRows();
        });
    });
}

async function resizeImage(file, maxSize) {
    // 카메라로 찍은 세로 사진이 옆으로 눕지 않도록 EXIF 회전 정보를 반영한다
    // (지원하지 않는 옛 브라우저는 이 옵션을 무시한다)
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

// ===== Recording =====
let mediaRecorder = null;
let recordedChunks = [];
let recordTimer = null;
const MAX_RECORD_MS = 30000; // 녹음을 켜둔 채 잊어버려도 30초면 자동 정지(배터리·저장공간 보호)

async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
    mediaRecorder.start();
}

function stopRecording() {
    return new Promise((resolve) => {
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType });
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
            mediaRecorder = null;
            resolve(blob);
        };
        mediaRecorder.stop();
    });
}

// 녹음 중 편집 모달을 닫을 때: 마이크를 즉시 끄고 진행 중 녹음을 버린다(개인정보·배터리)
function cancelRecording() {
    clearTimeout(recordTimer);
    if (mediaRecorder) {
        try {
            mediaRecorder.onstop = null;
            if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(t => t.stop());
        } catch {}
        mediaRecorder = null;
        recordedChunks = [];
    }
    document.querySelectorAll('.rec-btn').forEach(b => {
        b.classList.remove('recording');
        b.textContent = '● 녹음';
        b.disabled = false;
    });
}

async function finishRecording(profile) {
    clearTimeout(recordTimer);
    const blob = await stopRecording();
    document.querySelectorAll('.rec-btn').forEach(b => {
        b.classList.remove('recording');
        b.textContent = '● 녹음';
        b.disabled = false;
    });
    pendingAudio[profile] = blob;
    updateRecRows();
}

async function toggleRecord(btn, profile) {
    if (mediaRecorder) {
        await finishRecording(profile);
        return;
    }
    try {
        await startRecording();
    } catch {
        alert('마이크를 사용할 수 없습니다. 마이크 권한을 허용해 주세요.');
        return;
    }
    document.querySelectorAll('.rec-btn').forEach(b => { if (b !== btn) b.disabled = true; });
    btn.classList.add('recording');
    // 자동 정지(30초)가 있다는 걸 보호자가 알 수 있게 버튼에 표시해 갑작스러운 멈춤을 막는다
    btn.textContent = '■ 정지 (최대 30초)';
    // 깜빡 잊고 녹음을 켜둬도 일정 시간 뒤 자동으로 멈춰 저장한다
    recordTimer = setTimeout(() => { if (mediaRecorder) finishRecording(profile); }, MAX_RECORD_MS);
}

// ===== Emoji picker =====
let selectedEmoji = null;

function openEmojiPicker() {
    selectedEmoji = null;
    $('emoji-input').value = '';
    const grid = $('emoji-grid');
    grid.innerHTML = '';
    EMOJI_CHOICES.forEach(em => {
        const b = document.createElement('button');
        b.textContent = em;
        b.addEventListener('click', () => {
            grid.querySelectorAll('button').forEach(x => x.classList.remove('selected'));
            b.classList.add('selected');
            selectedEmoji = em;
        });
        grid.appendChild(b);
    });
    $('emoji-modal').style.display = 'flex';
}

function setupEmojiPicker() {
    $('emoji-cancel').addEventListener('click', () => { $('emoji-modal').style.display = 'none'; });
    $('emoji-ok').addEventListener('click', () => {
        const typed = $('emoji-input').value.trim();
        const em = typed || selectedEmoji;
        if (em) {
            if (pickerTarget === 'board') {
                pendingBoardEmoji = em;
                pendingBoardImage = null;
                updateBoardIconPreview();
            } else {
                pendingEmoji = em;
                pendingImage = null;
                updateEditorPreview();
            }
        }
        $('emoji-modal').style.display = 'none';
    });
}

// ===== ARASAAC search =====
function setupArasaac() {
    $('arasaac-close').addEventListener('click', () => { $('arasaac-modal').style.display = 'none'; });
    $('arasaac-search').addEventListener('click', () => searchArasaac());
    $('arasaac-query').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchArasaac(); });
}

function renderArasaacRecent() {
    const wrap = $('arasaac-recent');
    if (!wrap) return;
    const recent = settings.arasaacRecent || [];
    wrap.innerHTML = '';
    if (recent.length === 0) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';
    const label = document.createElement('span');
    label.className = 'recent-label';
    label.textContent = '최근:';
    wrap.appendChild(label);
    recent.forEach(term => {
        const chip = document.createElement('button');
        chip.className = 'arasaac-chip';
        chip.textContent = term;
        chip.addEventListener('click', () => {
            $('arasaac-query').value = term;
            searchArasaac();
        });
        wrap.appendChild(chip);
    });
}

function pushArasaacRecent(q) {
    let recent = settings.arasaacRecent || [];
    recent = [q, ...recent.filter(t => t !== q)].slice(0, 8);
    saveSetting('arasaacRecent', recent);
    renderArasaacRecent();
}

// 인터넷이 느리거나 멈춘 가정용 Wi-Fi에서 검색이 무한정 기다리지 않도록
// 타임아웃을 둔다 — 시간이 지나면 평소 오류 안내(다시 시도)로 이어진다.
function fetchWithTimeout(url, ms = 10000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

async function searchArasaac(query) {
    const q = (query ?? $('arasaac-query').value).trim();
    if (!q) return;
    const results = $('arasaac-results');
    // 그림 검색은 인터넷이 필요한 유일한 기능 — 오프라인이면 타임아웃을 기다리지 않고 바로 안내한다
    if (!navigator.onLine) {
        results.innerHTML = '<div class="status">그림 검색은 인터넷이 필요해요. 연결한 뒤 다시 시도해 주세요. (직접 등록한 사진·이모지 카드는 인터넷 없이도 써요)</div>';
        return;
    }
    results.innerHTML = '<div class="status">🔍 그림을 찾는 중이에요…</div>';
    try {
        const res = await fetchWithTimeout(ARASAAC_SEARCH + encodeURIComponent(q));
        // ARASAAC는 일치하는 그림이 없으면 404를 돌려준다 → 빈 결과로 처리
        if (!res.ok && res.status !== 404) throw new Error(res.status);
        const list = res.status === 404 ? [] : await res.json();
        results.innerHTML = '';
        if (!Array.isArray(list) || list.length === 0) {
            results.innerHTML = '<div class="status">‘' + q + '’에 대한 그림이 없어요. 더 쉬운 단어(예: 물, 밥)로 검색해 보세요.</div>';
            return;
        }
        pushArasaacRecent(q);
        list.slice(0, 48).forEach(item => {
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.alt = q;
            img.src = ARASAAC_IMAGE(item._id);
            img.addEventListener('error', () => {
                // 그림 로드 실패(오프라인·404) 시 깨진 이미지 아이콘 대신 차분한 자리표시
                const ph = document.createElement('div');
                ph.className = 'arasaac-fail';
                ph.textContent = '🖼️';
                ph.title = '그림을 불러오지 못했어요';
                img.replaceWith(ph);
            });
            img.addEventListener('click', async () => {
                results.innerHTML = '<div class="status">그림을 저장하는 중이에요…</div>';
                try {
                    const r = await fetchWithTimeout(ARASAAC_IMAGE(item._id));
                    // 서버 오류·잘못된 응답일 때 그림이 아닌 내용이 카드로 저장되는 것을 막는다
                    if (!r.ok) throw new Error(r.status);
                    const blob = await r.blob();
                    if (!blob.type.startsWith('image/')) throw new Error('not an image');
                    if (pickerTarget === 'board') {
                        pendingBoardImage = blob;
                        pendingBoardEmoji = null;
                        updateBoardIconPreview();
                    } else {
                        pendingImage = blob;
                        pendingEmoji = null;
                        updateEditorPreview();
                    }
                    $('arasaac-modal').style.display = 'none';
                } catch {
                    results.innerHTML = '<div class="status">그림을 가져오지 못했어요. 다시 시도해 주세요.</div>';
                }
            });
            results.appendChild(img);
        });
    } catch {
        results.innerHTML = '';
        const status = document.createElement('div');
        status.className = 'status';
        status.textContent = '검색에 실패했어요. 인터넷 연결을 확인해 주세요. ';
        const retry = document.createElement('button');
        retry.className = 'btn small-btn';
        retry.textContent = '다시 시도';
        retry.addEventListener('click', () => searchArasaac(q));
        status.appendChild(retry);
        results.appendChild(status);
    }
}

// ===== Batch recording =====
let batchQueue = [];
let batchIndex = 0;
let batchProfile = 'mom';
let batchBlob = null;

function startBatch(profile) {
    batchProfile = profile;
    batchQueue = [...cells].sort((a, b) =>
        (boards.find(x => x.id === a.boardId)?.order ?? 0) - (boards.find(x => x.id === b.boardId)?.order ?? 0) || a.order - b.order);
    batchIndex = 0;
    if (batchQueue.length === 0) return;
    $('settings-modal').style.display = 'none';
    $('batch-title').textContent = profile === 'mom' ? '엄마 목소리 녹음' : '아빠 목소리 녹음';
    $('batch-modal').style.display = 'flex';
    showBatchCell();
}

function showBatchCell() {
    const cell = batchQueue[batchIndex];
    batchBlob = null;
    const done = cell.audio?.[batchProfile] ? ' · 이미 녹음됨 (다시 녹음하면 교체)' : '';
    $('batch-progress').textContent = `${batchIndex + 1} / ${batchQueue.length}${done}`;
    cellImageHtml(cell, $('batch-preview'));
    $('batch-word').textContent = `“${cell.label}”`;
    $('batch-play').disabled = true;
    $('batch-next').disabled = true;
    $('batch-rec').textContent = '● 녹음';
    $('batch-rec').classList.remove('recording');
}

function setupBatch() {
    $('batch-rec').addEventListener('click', async () => {
        const btn = $('batch-rec');
        if (mediaRecorder) {
            await stopBatchRecording();
            return;
        }
        try {
            await startRecording();
        } catch {
            alert('마이크를 사용할 수 없습니다. 마이크 권한을 허용해 주세요.');
            return;
        }
        btn.classList.add('recording');
        // 일괄 녹음도 편집기와 똑같이 30초면 자동 정지 — 깜빡 잊어도 마이크가 계속 켜지지 않게 한다
        btn.textContent = '■ 정지 (최대 30초)';
        recordTimer = setTimeout(() => { if (mediaRecorder) stopBatchRecording(); }, MAX_RECORD_MS);
    });

    $('batch-play').addEventListener('click', () => { if (batchBlob) playBlob(batchBlob); });

    $('batch-next').addEventListener('click', async () => {
        const cell = batchQueue[batchIndex];
        cell.audio = cell.audio || { mom: null, dad: null };
        const prev = cell.audio[batchProfile];
        cell.audio[batchProfile] = batchBlob;
        try {
            await dbPut('cells', cell);
        } catch {
            // 저장 공간 부족 등으로 녹음 저장이 실패하면 알리고 넘어가지 않는다(녹음 유실 방지)
            cell.audio[batchProfile] = prev;
            alert('녹음을 저장하지 못했어요. 저장 공간이 부족할 수 있어요. 오래된 사진·녹음을 정리한 뒤 다시 시도해 주세요.');
            return;
        }
        advanceBatch();
    });

    $('batch-skip').addEventListener('click', advanceBatch);

    $('batch-quit').addEventListener('click', async () => {
        clearTimeout(recordTimer);
        if (mediaRecorder) await stopRecording();
        $('batch-modal').style.display = 'none';
        cells = await dbGetAll('cells');
    });
}

async function stopBatchRecording() {
    clearTimeout(recordTimer);
    batchBlob = await stopRecording();
    const btn = $('batch-rec');
    btn.classList.remove('recording');
    btn.textContent = '● 다시 녹음';
    $('batch-play').disabled = false;
    $('batch-next').disabled = false;
}

async function advanceBatch() {
    clearTimeout(recordTimer);
    if (mediaRecorder) await stopRecording();
    batchIndex++;
    if (batchIndex >= batchQueue.length) {
        $('batch-modal').style.display = 'none';
        cells = await dbGetAll('cells');
        alert('녹음이 끝났습니다! 이제 설정에서 목소리를 선택하면 녹음한 목소리로 말해줘요.');
        return;
    }
    showBatchCell();
}

// ===== Backup (export / import) =====
function blobToDataUrl(blob) {
    if (!blob) return Promise.resolve(null);
    return new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.readAsDataURL(blob);
    });
}

async function dataUrlToBlob(dataUrl) {
    if (!dataUrl) return null;
    return (await fetch(dataUrl)).blob();
}

async function exportData() {
    const out = {
        version: 1,
        exportedAt: new Date().toISOString(),
        settings,
        boards,
        cells: await Promise.all(cells.map(async c => ({
            ...c,
            image: await blobToDataUrl(c.image),
            audio: {
                mom: await blobToDataUrl(c.audio?.mom),
                dad: await blobToDataUrl(c.audio?.dad),
            },
        }))),
    };
    const blob = new Blob([JSON.stringify(out)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aac-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    // 일부 태블릿 브라우저는 클릭 직후 바로 URL을 해제하면 다운로드가 취소된다.
    // 다운로드가 시작될 시간을 준 뒤 정리한다(메모리 누수 방지).
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    await saveSetting('lastBackupAt', Date.now());
    renderBackupStatus();
}

function renderBackupStatus() {
    const el = $('backup-status');
    if (!el) return;
    const ts = settings.lastBackupAt;
    if (!ts) {
        el.textContent = '아직 백업한 적이 없어요.';
        el.classList.add('never');
        return;
    }
    el.classList.remove('never');
    const days = Math.floor((Date.now() - ts) / 86400000);
    const when = days <= 0 ? '오늘' : days === 1 ? '어제' : `${days}일 전`;
    const date = new Date(ts).toLocaleDateString('ko-KR');
    // 모든 데이터는 기기 안에만 저장되므로, 오래 백업하지 않으면 기기 분실·초기화 때
    // 카드와 녹음이 사라질 수 있다. 30일이 지나면 조용히(팝업 없이) 백업을 권한다.
    const stale = days >= 30;
    el.classList.toggle('stale', stale);
    el.textContent = stale
        ? `마지막 백업: ${when} (${date}) · 가끔 백업해 두면 안심돼요`
        : `마지막 백업: ${when} (${date})`;
}

async function importData(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    let data;
    try {
        data = JSON.parse(await file.text());
    } catch {
        alert('파일을 읽지 못했습니다. 내보내기로 만든 백업 파일인지 확인해 주세요.');
        return;
    }
    // 구조 검증을 기존 데이터 삭제보다 먼저 한다 — 잘못된 파일로 카드가 지워지는 것을 막는다
    if (!Array.isArray(data.boards) || !Array.isArray(data.cells)) {
        alert('이 앱의 백업 파일이 아니에요. 설정의 "내보내기"로 만든 파일만 가져올 수 있어요.');
        return;
    }
    if (!confirm('가져오기를 하면 지금 카드가 모두 교체됩니다. 계속할까요?')) return;
    // 기존 데이터를 지우기 전에 새 카드를 먼저 모두 변환해 둔다 —
    // 변환 중 오류가 나도 지금 쓰던 카드가 사라지지 않게 한다.
    let preparedCells;
    try {
        preparedCells = await Promise.all(data.cells.map(async c => ({
            ...c,
            image: await dataUrlToBlob(c.image),
            audio: {
                mom: await dataUrlToBlob(c.audio?.mom),
                dad: await dataUrlToBlob(c.audio?.dad),
            },
        })));
    } catch {
        alert('파일을 읽지 못했습니다. 내보내기로 만든 백업 파일인지 확인해 주세요.');
        return; // 기존 데이터는 그대로 보존된다
    }
    try {
        await dbClear('boards');
        await dbClear('cells');
        for (const b of data.boards) await dbPut('boards', b);
        for (const c of preparedCells) await dbPut('cells', c);
        if (data.settings) {
            for (const [k, v] of Object.entries(data.settings)) await saveSetting(k, v);
        }
        boards = await dbGetAll('boards');
        cells = await dbGetAll('cells');
        activeBoardId = [...boards].sort((a, b) => a.order - b.order)[0]?.id || 'core';
        applyCardScale();
        applyLabelSize();
        applyAnimSetting();
        renderTabs();
        renderGrid();
        updateVoiceIndicator();
        // 가져오기는 설정 화면에서 실행되므로, 열려 있는 설정 폼(폴더 목록·토글·슬라이더)을
        // 가져온 값으로 다시 채워 화면과 실제 데이터가 어긋나지 않게 한다.
        openSettings();
        alert('가져오기가 완료되었습니다.');
    } catch {
        alert('파일을 읽지 못했습니다. 내보내기로 만든 백업 파일인지 확인해 주세요.');
    }
}

// Esc로 열린 모달 닫기 — 각 모달의 기존 취소/닫기 버튼을 눌러 정리 로직을 그대로 탄다.
// 가장 위에 겹쳐 뜬 모달(이모지·ARASAAC가 편집기 위)부터 닫는다.
function setupEscapeToClose() {
    const order = [
        ['emoji-modal', 'emoji-cancel'],
        ['arasaac-modal', 'arasaac-close'],
        ['batch-modal', 'batch-quit'],
        ['editor-modal', 'editor-cancel'],
        ['board-modal', 'board-cancel'],
        ['settings-modal', 'settings-close'],
        ['gate-modal', 'gate-cancel'],
    ];
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        for (const [modalId, closeId] of order) {
            const modal = $(modalId);
            if (modal && modal.style.display !== 'none') {
                $(closeId)?.click();
                break;
            }
        }
    });
}

// ===== 화면 꺼짐 방지 (의사소통 도중 태블릿이 잠들지 않게) =====
let wakeLock = null;
async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
        wakeLock = await navigator.wakeLock.request('screen');
    } catch (e) {
        // 배터리 절약 모드 등에서 거부될 수 있음 — 조용히 무시
    }
}

function setupWakeLock() {
    requestWakeLock();
    // 다른 화면에 갔다 돌아오면 잠금이 풀리므로 다시 요청한다
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        requestWakeLock();
        // 태블릿이 절전(화면 꺼짐) 후 깨어나면 일부 브라우저에서 음성 합성이
        // 멈춰 있어 첫 카드 탭에 소리가 안 난다. resume()로 깨워 둔다.
        try { speechSynthesis.resume(); } catch (e) {}
    });
}

// ===== 모달이 열리면 뒤쪽 카드/버튼을 비활성화 =====
// (키보드·스위치 사용 시 모달 뒤 카드로 Tab 이동하거나 눌리는 것을 막는다.
//  inert 미지원 브라우저에서는 속성이 무시되어 기존과 동일하게 동작한다.)
function setupModalInert() {
    const app = document.querySelector('.app');
    if (!app) return;
    const modals = [...document.querySelectorAll('.modal')];
    const isOpen = m => m.style.display && m.style.display !== 'none';
    let prevOpen = false;
    let lastFocused = null;
    const update = () => {
        const openModal = modals.find(isOpen);
        const anyOpen = !!openModal;
        if (anyOpen) app.setAttribute('inert', '');
        else app.removeAttribute('inert');
        // 모달이 열리는 순간: 뒤쪽이 inert가 되므로 포커스를 모달 안으로 옮긴다.
        // (글자 입력칸이 아니라 모달 상자에 포커스를 줘 태블릿 키보드가 튀어나오지 않게 한다.)
        if (anyOpen && !prevOpen) {
            lastFocused = document.activeElement;
            const box = openModal.querySelector('.modal-box') || openModal;
            box.setAttribute('tabindex', '-1');
            box.focus({ preventScroll: true });
        } else if (!anyOpen && prevOpen) {
            // 모달이 모두 닫히면 원래 누른 곳으로 포커스를 되돌린다.
            if (lastFocused && document.contains(lastFocused)) lastFocused.focus({ preventScroll: true });
            lastFocused = null;
        }
        prevOpen = anyOpen;
    };
    const mo = new MutationObserver(update);
    modals.forEach(m => mo.observe(m, { attributes: true, attributeFilter: ['style'] }));
    update();
}

// ===== Init =====
async function init() {
    db = await openDb();
    await loadSettings();
    await seedIfEmpty();
    await backfillBoardEmojis();
    await backfillFavoritesBoard();
    // 활성 폴더가 실제로 존재하는지 확인 — 없으면 첫 폴더로 맞춘다.
    // (예: 'core' 폴더가 없는 백업을 가져온 뒤 다시 열면 빈 화면이 뜨던 문제 방지)
    if (!boards.some(b => b.id === activeBoardId)) {
        activeBoardId = [...boards].sort((a, b) => a.order - b.order)[0]?.id || activeBoardId;
    }
    applyCardScale();
    applyLabelSize();
    applyAnimSetting();
    renderTabs();
    renderGrid();
    updateVoiceIndicator();
    setupGate();
    setupHidingMode();
    setupSettings();
    setupBoardEditor();
    setupHomeToggle();
    setupEditor();
    setupEmojiPicker();
    setupArasaac();
    setupBatch();
    setupEscapeToClose();
    setupModalInert();
    setupSpeakOverlay();
    setupWakeLock();

    // 안드로이드 크롬에서 voices가 늦게 로드되는 경우 대비
    if (ttsSupported) {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => { speechSynthesis.getVoices(); checkKoreanVoice(); };
    }

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}

function showFatalError() {
    const grid = document.getElementById('grid');
    if (!grid) return;
    grid.innerHTML = '';
    const box = document.createElement('div');
    box.className = 'grid-empty';
    box.textContent = '앱을 시작할 수 없어요. 태블릿을 다시 켠 뒤 열어 주세요. 같은 화면이 계속 나오면 브라우저의 사생활 보호(시크릿) 모드를 끄거나 저장공간이 충분한지 확인해 주세요.';
    grid.appendChild(box);
}

// IndexedDB를 못 여는 환경(사생활 보호 모드·저장공간 부족·손상 등)에서
// 빈 흰 화면 대신 차분한 안내를 보여준다.
init().catch(() => showFatalError());
