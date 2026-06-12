// ===== 그림으로 말해요 — 자폐 아동용 AAC (단일 상징 터치 → 음성 출력) =====

const ARASAAC_SEARCH = 'https://api.arasaac.org/api/pictograms/ko/search/';
const ARASAAC_IMAGE = (id) => `https://static.arasaac.org/pictograms/${id}/${id}_300.png`;

// Fitzgerald key 색상: 카테고리별 고정 색으로 위치·색 일관성 유지
const DEFAULT_BOARDS = [
    { id: 'core',   name: '핵심',  color: '#f2a7c3', order: 0 },
    { id: 'people', name: '사람',  color: '#f5d76e', order: 1 },
    { id: 'food',   name: '음식',  color: '#f5a96e', order: 2 },
    { id: 'feel',   name: '느낌',  color: '#8ec1f0', order: 3 },
    { id: 'act',    name: '활동',  color: '#9fd9a0', order: 4 },
];

const DEFAULT_CELLS = [
    { boardId: 'core', label: '주세요', emoji: '🙏' },
    { boardId: 'core', label: '더', emoji: '➕' },
    { boardId: 'core', label: '싫어요', emoji: '🙅' },
    { boardId: 'core', label: '좋아요', emoji: '👍' },
    { boardId: 'core', label: '도와주세요', emoji: '🆘' },
    { boardId: 'core', label: '그만', emoji: '✋' },
    { boardId: 'core', label: '네', emoji: '⭕' },
    { boardId: 'core', label: '아니요', emoji: '❌' },
    { boardId: 'people', label: '엄마', emoji: '👩' },
    { boardId: 'people', label: '아빠', emoji: '👨' },
    { boardId: 'people', label: '선생님', emoji: '🧑‍🏫' },
    { boardId: 'people', label: '친구', emoji: '🧒' },
    { boardId: 'food', label: '물', emoji: '💧' },
    { boardId: 'food', label: '우유', emoji: '🥛' },
    { boardId: 'food', label: '밥', emoji: '🍚' },
    { boardId: 'food', label: '간식', emoji: '🍪' },
    { boardId: 'food', label: '과일', emoji: '🍎' },
    { boardId: 'feel', label: '아파요', emoji: '🤕' },
    { boardId: 'feel', label: '졸려요', emoji: '😴' },
    { boardId: 'feel', label: '기뻐요', emoji: '😊' },
    { boardId: 'feel', label: '화나요', emoji: '😠' },
    { boardId: 'feel', label: '무서워요', emoji: '😨' },
    { boardId: 'act', label: '화장실', emoji: '🚽' },
    { boardId: 'act', label: '놀아요', emoji: '🧸' },
    { boardId: 'act', label: '밖에 가요', emoji: '🌳' },
    { boardId: 'act', label: '안아주세요', emoji: '🤗' },
    { boardId: 'act', label: '음악 들어요', emoji: '🎵' },
];

const EMOJI_CHOICES = [
    '🙏','➕','🙅','👍','👎','🆘','✋','⭕','❌','👩','👨','👵','👴','🧑‍🏫','🧒','👶',
    '💧','🥛','🍚','🍪','🍎','🍌','🍞','🍜','🍦','🧃','🍕','🍗',
    '🤕','😴','😊','😠','😨','😢','🤒','🥶','🥵','😋',
    '🚽','🧸','🌳','🤗','🎵','📺','📚','🚗','🛁','🛏️','⚽','🎨','✏️','🏫','🏠','🐶','🐱','☀️','🌙','🧩'
];

// ===== IndexedDB =====
let db;

function openDb() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('aac-db', 1);
        req.onupgradeneeded = () => {
            const d = req.result;
            d.createObjectStore('boards', { keyPath: 'id' });
            d.createObjectStore('cells', { keyPath: 'id' });
            d.createObjectStore('settings', { keyPath: 'key' });
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
let settings = { voice: 'tts', ttsRate: 0.9 };
let activeBoardId = 'core';
let editMode = false;
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

// ===== Rendering =====
const $ = (id) => document.getElementById(id);

function boardColor(boardId) {
    const b = boards.find(b => b.id === boardId);
    return b ? b.color : '#ddd';
}

function renderTabs() {
    const nav = $('board-tabs');
    nav.innerHTML = '';
    [...boards].sort((a, b) => a.order - b.order).forEach(b => {
        const btn = document.createElement('button');
        btn.className = 'board-tab' + (b.id === activeBoardId ? ' active' : '');
        btn.textContent = b.name;
        btn.style.background = b.color;
        btn.addEventListener('click', () => {
            activeBoardId = b.id;
            renderTabs();
            renderGrid();
        });
        nav.appendChild(btn);
    });
}

function cellImageHtml(cell, container) {
    container.innerHTML = '';
    if (cell.image) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(cell.image);
        img.onload = () => URL.revokeObjectURL(img.src);
        container.appendChild(img);
    } else {
        const span = document.createElement('span');
        span.className = 'emoji';
        span.textContent = cell.emoji || '🔲';
        container.appendChild(span);
    }
}

function renderGrid() {
    const grid = $('grid');
    grid.innerHTML = '';
    const list = cells.filter(c => c.boardId === activeBoardId).sort((a, b) => a.order - b.order);

    list.forEach(cell => {
        const div = document.createElement('div');
        div.className = 'cell';
        div.style.setProperty('--cell-color', boardColor(cell.boardId));

        const imgBox = document.createElement('div');
        imgBox.className = 'cell-image';
        cellImageHtml(cell, imgBox);

        const label = document.createElement('div');
        label.className = 'cell-label';
        label.textContent = cell.label;

        div.appendChild(imgBox);
        div.appendChild(label);

        if (editMode) {
            const badge = document.createElement('div');
            badge.className = 'edit-badge';
            badge.textContent = '✏️';
            div.appendChild(badge);
            div.addEventListener('click', () => openEditor(cell));
        } else {
            div.addEventListener('click', () => speakCell(cell, div));
        }
        grid.appendChild(div);
    });

    if (editMode) {
        const add = document.createElement('div');
        add.className = 'cell add-cell';
        add.textContent = '+';
        add.addEventListener('click', () => openEditor(null));
        grid.appendChild(add);
    }
}

function updateVoiceIndicator() {
    const names = { mom: '엄마 목소리', dad: '아빠 목소리', tts: '기계 음성' };
    $('voice-indicator').textContent = names[settings.voice] || '';
}

// ===== Speech =====
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    speechSynthesis.cancel();
}

function playBlob(blob) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudio = audio;
        audio.onended = audio.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
        };
        audio.play().catch(resolve);
    });
}

function speakTts(text) {
    return new Promise((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'ko-KR';
        u.rate = settings.ttsRate;
        const voice = speechSynthesis.getVoices().find(v => v.lang.startsWith('ko'));
        if (voice) u.voice = voice;
        u.onend = u.onerror = resolve;
        speechSynthesis.speak(u);
    });
}

async function speakCell(cell, cellEl) {
    stopCurrentAudio();
    if (cellEl) cellEl.classList.add('speaking');
    showSpeakOverlay(cell);

    const pref = settings.voice;
    let blob = null;
    if (pref === 'mom') blob = cell.audio?.mom || cell.audio?.dad;
    else if (pref === 'dad') blob = cell.audio?.dad || cell.audio?.mom;

    if (blob) await playBlob(blob);
    else await speakTts(cell.label);

    if (cellEl) cellEl.classList.remove('speaking');
    hideSpeakOverlay();
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
        }, 1600);
    };
    const cancel = () => {
        gear.classList.remove('holding');
        clearTimeout(holdTimer);
    };
    gear.addEventListener('pointerdown', start);
    gear.addEventListener('pointerup', cancel);
    gear.addEventListener('pointerleave', cancel);

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
    }
}

// ===== Settings =====
function openSettings() {
    document.querySelectorAll('input[name="voice"]').forEach(r => {
        r.checked = r.value === settings.voice;
    });
    $('tts-rate').value = settings.ttsRate;
    $('tts-rate-value').textContent = `${settings.ttsRate}배`;
    $('settings-modal').style.display = 'flex';
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
    });
    $('btn-tts-test').addEventListener('click', () => speakTts('안녕하세요, 반가워요'));

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
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen().catch(() => {});
    });
}

// ===== Cell editor =====
let editingCell = null;       // null이면 새 카드
let pendingImage = undefined; // undefined = 변경 없음, null = 제거, Blob = 새 이미지
let pendingEmoji = undefined;
let pendingAudio = { mom: undefined, dad: undefined };

function openEditor(cell) {
    editingCell = cell;
    pendingImage = undefined;
    pendingEmoji = undefined;
    pendingAudio = { mom: undefined, dad: undefined };

    $('editor-title').textContent = cell ? '카드 편집' : '새 카드 만들기';
    $('editor-label').value = cell ? cell.label : '';
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
    $('editor-cancel').addEventListener('click', () => { $('editor-modal').style.display = 'none'; });

    $('editor-save').addEventListener('click', async () => {
        const label = $('editor-label').value.trim();
        if (!label) { $('editor-label').placeholder = '단어를 입력해 주세요'; return; }

        const cell = editingCell || {
            id: crypto.randomUUID(),
            audio: { mom: null, dad: null },
            image: null, emoji: null,
            order: Math.max(0, ...cells.map(c => c.order)) + 1,
        };
        cell.label = label;
        cell.boardId = $('editor-board').value;
        if (pendingImage !== undefined) cell.image = pendingImage;
        if (pendingEmoji !== undefined) cell.emoji = pendingEmoji;
        if (pendingAudio.mom !== undefined) cell.audio.mom = pendingAudio.mom;
        if (pendingAudio.dad !== undefined) cell.audio.dad = pendingAudio.dad;

        await dbPut('cells', cell);
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
        pendingImage = await resizeImage(file, 512);
        pendingEmoji = null;
        updateEditorPreview();
    });

    // 이모지 선택
    $('btn-pick-emoji').addEventListener('click', openEmojiPicker);

    // ARASAAC 검색
    $('btn-pick-arasaac').addEventListener('click', () => {
        $('arasaac-query').value = $('editor-label').value.trim();
        $('arasaac-results').innerHTML = '';
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
    const bitmap = await createImageBitmap(file);
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

async function toggleRecord(btn, profile) {
    if (mediaRecorder) {
        const blob = await stopRecording();
        document.querySelectorAll('.rec-btn').forEach(b => {
            b.classList.remove('recording');
            b.textContent = '● 녹음';
            b.disabled = false;
        });
        pendingAudio[profile] = blob;
        updateRecRows();
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
    btn.textContent = '■ 정지';
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
            pendingEmoji = em;
            pendingImage = null;
            updateEditorPreview();
        }
        $('emoji-modal').style.display = 'none';
    });
}

// ===== ARASAAC search =====
function setupArasaac() {
    $('arasaac-close').addEventListener('click', () => { $('arasaac-modal').style.display = 'none'; });
    $('arasaac-search').addEventListener('click', searchArasaac);
    $('arasaac-query').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchArasaac(); });
}

async function searchArasaac() {
    const q = $('arasaac-query').value.trim();
    if (!q) return;
    const results = $('arasaac-results');
    results.innerHTML = '<div class="status">검색 중...</div>';
    try {
        const res = await fetch(ARASAAC_SEARCH + encodeURIComponent(q));
        if (!res.ok) throw new Error(res.status);
        const list = await res.json();
        results.innerHTML = '';
        if (list.length === 0) {
            results.innerHTML = '<div class="status">결과가 없습니다. 다른 단어로 검색해 보세요.</div>';
            return;
        }
        list.slice(0, 24).forEach(item => {
            const img = document.createElement('img');
            img.loading = 'lazy';
            img.src = ARASAAC_IMAGE(item._id);
            img.addEventListener('click', async () => {
                results.innerHTML = '<div class="status">그림을 저장하는 중...</div>';
                try {
                    const blob = await (await fetch(ARASAAC_IMAGE(item._id))).blob();
                    pendingImage = blob;
                    pendingEmoji = null;
                    updateEditorPreview();
                    $('arasaac-modal').style.display = 'none';
                } catch {
                    results.innerHTML = '<div class="status">그림을 가져오지 못했습니다. 다시 시도해 주세요.</div>';
                }
            });
            results.appendChild(img);
        });
    } catch {
        results.innerHTML = '<div class="status">검색에 실패했습니다. 인터넷 연결을 확인해 주세요.</div>';
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
            batchBlob = await stopRecording();
            btn.classList.remove('recording');
            btn.textContent = '● 다시 녹음';
            $('batch-play').disabled = false;
            $('batch-next').disabled = false;
            return;
        }
        try {
            await startRecording();
        } catch {
            alert('마이크를 사용할 수 없습니다. 마이크 권한을 허용해 주세요.');
            return;
        }
        btn.classList.add('recording');
        btn.textContent = '■ 정지';
    });

    $('batch-play').addEventListener('click', () => { if (batchBlob) playBlob(batchBlob); });

    $('batch-next').addEventListener('click', async () => {
        const cell = batchQueue[batchIndex];
        cell.audio = cell.audio || { mom: null, dad: null };
        cell.audio[batchProfile] = batchBlob;
        await dbPut('cells', cell);
        advanceBatch();
    });

    $('batch-skip').addEventListener('click', advanceBatch);

    $('batch-quit').addEventListener('click', async () => {
        if (mediaRecorder) await stopRecording();
        $('batch-modal').style.display = 'none';
        cells = await dbGetAll('cells');
    });
}

async function advanceBatch() {
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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `aac-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
}

async function importData(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('가져오기를 하면 지금 카드가 모두 교체됩니다. 계속할까요?')) return;
    try {
        const data = JSON.parse(await file.text());
        await dbClear('boards');
        await dbClear('cells');
        for (const b of data.boards) await dbPut('boards', b);
        for (const c of data.cells) {
            await dbPut('cells', {
                ...c,
                image: await dataUrlToBlob(c.image),
                audio: {
                    mom: await dataUrlToBlob(c.audio?.mom),
                    dad: await dataUrlToBlob(c.audio?.dad),
                },
            });
        }
        if (data.settings) {
            for (const [k, v] of Object.entries(data.settings)) await saveSetting(k, v);
        }
        boards = await dbGetAll('boards');
        cells = await dbGetAll('cells');
        activeBoardId = boards[0]?.id || 'core';
        renderTabs();
        renderGrid();
        updateVoiceIndicator();
        alert('가져오기가 완료되었습니다.');
    } catch {
        alert('파일을 읽지 못했습니다. 내보내기로 만든 백업 파일인지 확인해 주세요.');
    }
}

// ===== Init =====
async function init() {
    db = await openDb();
    await loadSettings();
    await seedIfEmpty();
    renderTabs();
    renderGrid();
    updateVoiceIndicator();
    setupGate();
    setupSettings();
    setupEditor();
    setupEmojiPicker();
    setupArasaac();
    setupBatch();

    // 안드로이드 크롬에서 voices가 늦게 로드되는 경우 대비
    speechSynthesis.getVoices();
    speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();

    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}

init();
