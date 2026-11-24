// =========================================================================
// MODUL GENERATOR LAPORAN LAKIP OTOMATIS + WORKFLOW REVIEW SPI, PUDIR II & DIREKTUR
// Hak Akses Penyusun: Tim Program / Evaluasi (Program) & Admin Sistem
// Font Standar: Arial | Penyajian Lengkap Sesuai Standar LAKIP PIPB (Permenperin 150/2011)
// =========================================================================
(function () {
    const PANEL_ID = 'kiJaroLakipEntryBanner';
    const WORKSPACE_ID = 'kiJaroLakipWorkspace';
    const LOGO_KEMENPERIN = './logo-kemenperin.png';
    const RENSTRA_YEARS = ['2025', '2026', '2027', '2028', '2029'];

    const DEFAULT_SATKERS_BPSDMI = [
        'Politeknik ATI Makassar',
        'Politeknik STMI Jakarta',
        'Politeknik AKA Bogor',
        'Politeknik Teknologi Kimia Industri Medan',
        'Politeknik APP Jakarta',
        'Politeknik STTT Bandung',
        'Politeknik ATI Padang',
        'Politeknik Industri Logam Morowali',
        'Politeknik Industri Furnitur dan Pengolahan Kayu Kendal',
        'Politeknik Industri Petrokimia Banten',
        'Politeknik ATK Yogyakarta',
        'Akademi Komunitas Industri Manufaktur Bantaeng',
        'Akademi Komunitas Industri Tekstil dan Produk Tekstil Surakarta'
    ];

    const SPI_CHECKLIST_ITEMS = [
        { id: 'fmt_1', group: 'Format', no: '1)', text: 'Laporan Kinerja (LKj) telah menampilkan data penting' },
        { id: 'fmt_2', group: 'Format', no: '2)', text: 'LKj telah menyajikan informasi target kinerja' },
        { id: 'fmt_3', group: 'Format', no: '3)', text: 'LKj telah menyajikan capaian kinerja yang memadai' },
        { id: 'fmt_4', group: 'Format', no: '4)', text: 'Telah menyajikan dengan lampiran' },
        { id: 'fmt_5', group: 'Format', no: '5)', text: 'Telah menyajikan upaya perbaikan ke depan' },
        { id: 'fmt_6', group: 'Format', no: '6)', text: 'Telah menyajikan akuntabilitas keuangan' },
        { id: 'mek_1', group: 'Mekanisme Penyusunan', no: '1)', text: 'LKj disusun oleh unit kerja yang memiliki tugas fungsi untuk itu' },
        { id: 'mek_2', group: 'Mekanisme Penyusunan', no: '2)', text: 'Informasi yang disampaikan dalam LKj telah didukung dengan data yang memadai' },
        { id: 'mek_3', group: 'Mekanisme Penyusunan', no: '3)', text: 'Telah terdapat mekanisme penyampaian data dan informasi dari unit kerja ke unit penyusun LKj' },
        { id: 'mek_4', group: 'Mekanisme Penyusunan', no: '4)', text: 'Telah ditetapkan penanggung jawab pengumpulan data/informasi di setiap unit' },
        { id: 'mek_5', group: 'Mekanisme Penyusunan', no: '5)', text: 'Data/informasi kinerja yang disampaikan dalam LKj telah diyakini keandalannya' },
        { id: 'mek_6', group: 'Mekanisme Penyusunan', no: '6)', text: 'Analisis/penjelasan dalam LKj telah diketahui oleh unit kerja terkait' },
        { id: 'mek_7', group: 'Mekanisme Penyusunan', no: '7)', text: 'LKj periode berjalan merupakan gabungan partisipasi dari unit di bawahnya' },
        { id: 'sub_1', group: 'Substansi', no: '1)', text: 'Tujuan/sasaran dalam LKj telah sesuai dengan tujuan/sasaran dalam perjanjian kinerja' },
        { id: 'sub_2', group: 'Substansi', no: '2)', text: 'Tujuan/sasaran dalam LKj telah selaras dengan rencana strategis' },
        { id: 'sub_3', group: 'Substansi', no: '3)', text: 'Jika butir 1 dan 2 jawabannya tidak, maka terdapat penjelasan yang memadai' },
        { id: 'sub_4', group: 'Substansi', no: '4)', text: 'Tujuan/sasaran dalam LKj telah sesuai dengan tujuan/sasaran dalam Indikator Kinerja' },
        { id: 'sub_5', group: 'Substansi', no: '5)', text: 'Tujuan/sasaran dalam LKj telah sesuai dengan tujuan/sasaran dalam Indikator Kinerja Utama' },
        { id: 'sub_6', group: 'Substansi', no: '6)', text: 'Jika butir 4 dan 5 jawabannya tidak, maka terdapat penjelasan yang memadai' },
        { id: 'sub_7', group: 'Substansi', no: '7)', text: 'Telah terdapat perbandingan data kinerja dengan tahun lalu, standar nasional dan sebagainya yang bermanfaat' },
        { id: 'sub_8', group: 'Substansi', no: '8)', text: 'IKU dan IK telah cukup mengukur tujuan/sasaran' },
        { id: 'sub_9', group: 'Substansi', no: '9)', text: 'Jika "tidak" telah terdapat penjelasan yang memadai' },
        { id: 'sub_10', group: 'Substansi', no: '10)', text: 'IKU dan IK telah SMART' }
    ];

    let _lakipYear = '2025';
    let _lakipActiveTab = 'sync';
    let _lakipSelectedIndIdx = 0;
    let _lakipAttachments = {};
    let _isProcessingWorkflow = false;

    function esc(str) {
        if (typeof sanitizeHTML === 'function') return sanitizeHTML(String(str ?? ''));
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function fmtNum(val, dec = 2) {
        if (val === '' || val === null || val === undefined) return '-';
        const n = Number(val);
        if (Number.isNaN(n)) return String(val);
        return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: dec });
    }

    function fmtRp(val) {
        const n = Number(val) || 0;
        return 'Rp ' + n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    function parseNum(v) {
        if (v === '' || v === null || v === undefined) return null;
        if (typeof v === 'number') return Number.isNaN(v) ? null : v;
        let s = String(v).trim();
        if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
            s = s.replace(/\./g, '');
        } else {
            s = s.replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
        }
        const n = parseFloat(s);
        return Number.isNaN(n) ? null : n;
    }

    function getCurrentUserObj() {
        if (typeof currentUser !== 'undefined' && currentUser) return currentUser;
        try {
            const raw = localStorage.getItem('kijaro_user') || sessionStorage.getItem('kijaro_user');
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return null;
    }

    function getUserRolesNormalized(user) {
        if (!user) return [];
        const rawRoles = [
            ...(Array.isArray(user.roles) ? user.roles : []),
            ...(Array.isArray(user.additionalRoles) ? user.additionalRoles : []),
            user.role,
            user.jabatan,
            user.unit
        ];
        return rawRoles.filter(Boolean).map(r => String(r).toLowerCase().trim());
    }

    function getLakipAccessRights() {
        const u = getCurrentUserObj();
        const roles = getUserRolesNormalized(u);
        const unitLower = String(u?.unit || u?.jabatan || '').toLowerCase();

        const isAdmin = roles.some(r => r === 'admin' || r === 'superadmin' || r.includes('admin sistem'));
        const isProgram = roles.some(r => r.includes('program') || r.includes('evaluasi') || r.includes('perencanaan')) ||
            unitLower.includes('program') || unitLower.includes('evaluasi');
        const isReviewer = roles.some(r => r === 'reviewer_lakip' || r.includes('reviewer') || r.includes('spi') || r.includes('pengawas')) ||
            unitLower.includes('spi') || unitLower.includes('pengawas');
        const isWadir2 = roles.some(r =>
            r.includes('wadir2') || r.includes('wadir 2') || r.includes('wadir ii') ||
            r.includes('pudir2') || r.includes('pudir 2') || r.includes('pudir ii') ||
            r.includes('pembantu direktur ii') || r.includes('pembantu direktur 2') ||
            r.includes('wakil direktur ii') || r.includes('wakil direktur 2')
        ) || unitLower.includes('pembantu direktur ii') || unitLower.includes('wakil direktur ii') || unitLower.includes('wadir ii') || unitLower.includes('pudir ii');

        const isDirektur = roles.some(r =>
            (r === 'direktur' || r.includes('direktur')) &&
            !r.includes('wakil') && !r.includes('pembantu') && !r.includes('wadir') && !r.includes('pudir')
        ) && !isWadir2;

        return {
            user: u,
            isAdmin,
            isProgram,
            canDraft: isAdmin || isProgram,
            isReviewer: isReviewer || isAdmin,
            isWadir2: isWadir2 || isAdmin,
            isDirektur: isDirektur || isAdmin,
            canViewPortal: isAdmin || isProgram || isReviewer || isWadir2 || isDirektur,
            displayName: u?.name || 'Pengguna Ki-Jaro',
            nip: u?.nip || '-'
        };
    }

    // =========================================================================
    // PERTAHANKAN KURSOR PENCARIAN DI PENGATURAN AKUN PEJABAT & MULTI-ROLE
    // =========================================================================
    function installAccountSearchFocusGuard() {
        if (window.__kijaroSearchGuardInstalled) return;
        window.__kijaroSearchGuardInstalled = true;

        let lastSearchState = null;

        document.addEventListener('input', function (e) {
            const el = e.target;
            if (!el || el.tagName !== 'INPUT') return;
            const ph = (el.placeholder || '').toLowerCase();
            const id = (el.id || '').toLowerCase();
            if (ph.includes('cari nama') || ph.includes('email') || id.includes('search') || id.includes('cari')) {
                lastSearchState = {
                    id: el.id,
                    placeholder: el.placeholder,
                    value: el.value,
                    selStart: el.selectionStart,
                    selEnd: el.selectionEnd,
                    ts: Date.now()
                };
            }
        }, true);

        const observer = new MutationObserver(() => {
            if (!lastSearchState || (Date.now() - lastSearchState.ts > 1500)) return;
            const active = document.activeElement;
            if (active && active.tagName === 'INPUT' && (active.id === lastSearchState.id || active.placeholder === lastSearchState.placeholder)) {
                return;
            }
            let targetInput = lastSearchState.id ? document.getElementById(lastSearchState.id) : null;
            if (!targetInput && lastSearchState.placeholder) {
                targetInput = Array.from(document.querySelectorAll('input')).find(inp => inp.placeholder === lastSearchState.placeholder);
            }
            if (targetInput && document.body.contains(targetInput)) {
                targetInput.focus();
                try {
                    const pos = lastSearchState.selStart ?? targetInput.value.length;
                    targetInput.setSelectionRange(pos, pos);
                } catch (_) {}
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function registerReviewerRoleOption() {
        if (typeof ROLE_LABELS === 'object' && ROLE_LABELS && !ROLE_LABELS['reviewer_lakip']) {
            ROLE_LABELS['reviewer_lakip'] = 'Reviewer LAKIP (SPI)';
        }
        document.querySelectorAll('select').forEach(sel => {
            if (sel.dataset.lakipRoleInjected === '1') return;
            const opts = Array.from(sel.options).map(o => o.value.toLowerCase());
            if ((opts.includes('direktur') || opts.includes('admin') || opts.includes('pegawai')) && !opts.includes('reviewer_lakip')) {
                const opt = document.createElement('option');
                opt.value = 'reviewer_lakip';
                opt.textContent = 'Reviewer LAKIP (SPI)';
                sel.appendChild(opt);
                sel.dataset.lakipRoleInjected = '1';
            }
        });
    }

    function getDirectorInfo() {
        const users = Array.isArray(DB?.users) ? DB.users : [];
        const dir = users.find(u => {
            const rs = getUserRolesNormalized(u);
            return rs.includes('direktur') && !rs.some(x => x.includes('wakil') || x.includes('pembantu') || x.includes('wadir') || x.includes('pudir'));
        });
        return {
            name: dir ? dir.name : 'Supardi',
            nip: dir?.nip || '197611052002121003'
        };
    }

    // =========================================================================
    // PEMINDAIAN AKURAT TIER 3 (TUJUAN/SASARAN) & TIER 4 (INDIKATOR 2025-2029)
    // =========================================================================
    function extractYearTargetFromRow(row, yr) {
        const y = String(yr);
        const directKeys = [`target${y}`, `target_${y}`, `t${y}`, `t_${y}`, `val${y}`, `nilai${y}`, `renstra${y}`];
        for (const k of directKeys) {
            if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
                const parsed = parseNum(row[k]);
                if (parsed !== null) return parsed;
            }
        }
        const nestedMaps = [row.targets, row.targetTahunan, row.targetRenstra, row.renstra, row.tahunTarget, row.dataTahun];
        for (const m of nestedMaps) {
            if (m && typeof m === 'object' && m[y] !== undefined && m[y] !== null) {
                if (typeof m[y] === 'object') {
                    const sub = parseNum(m[y].target ?? m[y].nilai ?? m[y].t ?? m[y].value);
                    if (sub !== null) return sub;
                } else {
                    const sub = parseNum(m[y]);
                    if (sub !== null) return sub;
                }
            }
        }
        return null;
    }

    function extractYearPaguFromRow(row, yr) {
        const y = String(yr);
        const directKeys = [`pagu${y}`, `pagu_${y}`, `p${y}`, `p_${y}`, `anggaran${y}`, `anggaran_${y}`, `alokasi${y}`];
        for (const k of directKeys) {
            if (row[k] !== undefined && row[k] !== null && row[k] !== '') {
                const parsed = parseNum(row[k]);
                if (parsed !== null) return parsed;
            }
        }
        const nestedMaps = [row.paguTahunan, row.anggaranTahunan, row.paguRenstra, row.targets, row.dataTahun];
        for (const m of nestedMaps) {
            if (m && typeof m === 'object' && m[y] !== undefined && m[y] !== null) {
                if (typeof m[y] === 'object') {
                    const sub = parseNum(m[y].pagu ?? m[y].anggaran ?? m[y].p);
                    if (sub !== null) return sub;
                }
            }
        }
        return null;
    }

    function extractIndicatorsFromDB(tahun) {
        const yr = String(tahun || '2025').trim();
        const prevYr = String(Number(yr) - 1);
        const dbObj = (typeof DB === 'object' && DB) ? DB : {};
        const items = [];
        const seen = new Set();

        const tier3Lookup = {};
        Object.keys(dbObj).forEach(k => {
            if (!Array.isArray(dbObj[k])) return;
            dbObj[k].forEach(r => {
                if (!r || typeof r !== 'object') return;
                const label = String(r.sasaranKinerja || r.sasaran || r.tujuan || r.namaSasaran || r.namaTujuan || r.uraian || '').trim();
                const code = String(r.kode || r.kodeSk || r.kodeTujuan || '').trim();
                if (r.id && label) tier3Lookup[String(r.id)] = code ? `${code} - ${label}` : label;
                if (code && label && !r.indikator && !r.namaIndikator) tier3Lookup[code] = `${code} - ${label}`;
            });
        });

        const capaianRecords = [];
        Object.keys(dbObj).forEach(k => {
            if (!Array.isArray(dbObj[k])) return;
            const kl = k.toLowerCase();
            if (kl.includes('capaian') || kl.includes('realisasi') || kl.includes('validasi') || kl.includes('monitoring') || kl.includes('triwulan') || kl.includes('tw')) {
                dbObj[k].forEach(rec => {
                    if (rec && typeof rec === 'object') capaianRecords.push(rec);
                });
            }
        });

        const excludedKeys = new Set(['users', 'auditlogs', 'logs', 'perjanjiankinerja', 'lakipconfigs', 'notifications', 'emails', 'risiko', 'petarisiko']);
        Object.keys(dbObj).forEach(key => {
            if (!Array.isArray(dbObj[key]) || excludedKeys.has(key.toLowerCase())) return;

            dbObj[key].forEach((row, idx) => {
                if (!row || typeof row !== 'object') return;
                const isIndividu = Boolean(row.pegawaiUsername || row.namaPegawai || row.username);
                const isSubLevel = row.level && Number(row.level) > 1;
                if ((isIndividu || isSubLevel) && key.toLowerCase().includes('cascad')) return;

                const ikName = String(
                    row.namaIndikator || row.indikator || row.indikatorKinerja || row.iku || row.namaIku || ''
                ).trim();
                if (!ikName) return;

                const normKey = ikName.toLowerCase();
                if (seen.has(normKey)) return;
                seen.add(normKey);

                const kodeIndikator = String(row.kode || row.kodeIk || row.kodeSk || row.kodeIndikator || `IK ${idx + 1}`).trim();
                const parentRef = String(row.sasaranId || row.tujuanId || row.parentId || row.tier3Id || '').trim();
                const sasaranTier3 = String(
                    row.sasaranKinerja || row.sasaranProgram || row.sasaranStrategis || row.tujuanSasaran ||
                    (parentRef && tier3Lookup[parentRef]) || row.sasaran || row.induk || '-'
                ).trim();

                const satuan = String(row.satuan || row.unitSatuan || '%').trim();
                const targetsByYear = {};
                const paguByYear = {};
                RENSTRA_YEARS.forEach(y => {
                    const tVal = extractYearTargetFromRow(row, y);
                    targetsByYear[y] = tVal !== null ? tVal : 0;
                    const pVal = extractYearPaguFromRow(row, y);
                    paguByYear[y] = pVal !== null ? pVal : 0;
                });

                const singleTarget = parseNum(row.targetVal ?? row.targetAngka ?? row.target);
                if (targetsByYear[yr] === 0 && singleTarget !== null) targetsByYear[yr] = singleTarget;
                const single2029 = parseNum(row.target2029 ?? row.targetRenstra2029 ?? row.targetAkhir);
                if (targetsByYear['2029'] === 0 && single2029 !== null) targetsByYear['2029'] = single2029;
                const singlePagu = parseNum(row.pagu ?? row.paguAnggaran ?? row.anggaran);
                if (paguByYear[yr] === 0 && singlePagu !== null) paguByYear[yr] = singlePagu;

                const matchedCap = capaianRecords.filter(c => {
                    const cYr = String(c.tahun || c.year || '').trim();
                    if (cYr && cYr !== yr) return false;
                    const cId = String(c.indikatorId || c.targetId || c.idIndikator || '').trim();
                    const cName = String(c.indikator || c.namaIndikator || c.indikatorKinerja || '').trim().toLowerCase();
                    return (row.id && cId === String(row.id)) || (cName && cName === normKey);
                });

                const twCandidates = [
                    parseNum(row.realisasiTw4 ?? row.tw4 ?? row.capaianTw4),
                    parseNum(row.realisasiTw3 ?? row.tw3 ?? row.capaianTw3),
                    parseNum(row.realisasiTw2 ?? row.tw2 ?? row.capaianTw2),
                    parseNum(row.realisasiTw1 ?? row.tw1 ?? row.capaianTw1),
                    parseNum(row.realisasi ?? row.capaian ?? row.nilaiRealisasi ?? row.hasil)
                ];

                matchedCap.forEach(mc => {
                    const twNum = Number(mc.triwulan || mc.tw || 0);
                    const val = parseNum(mc.realisasi ?? mc.capaian ?? mc.nilai ?? mc.hasil ?? mc.realisasiTw4);
                    if (val !== null) {
                        if (twNum === 4) twCandidates.unshift(val);
                        else twCandidates.push(val);
                    }
                });

                const validTw = twCandidates.filter(v => v !== null);
                const realisasiVal = validTw.length > 0 ? validTw[0] : 0;
                const prevYearVal = parseNum(row.realisasiTahunLalu ?? row.realisasiPrevYear ?? (row.realisasiPerTahun && row.realisasiPerTahun[prevYr])) ?? 0;

                const kendalaArr = [
                    row.kendalaTw1, row.kendalaTw2, row.kendalaTw3, row.kendalaTw4,
                    row.kendala, row.permasalahan, row.hambatan,
                    ...matchedCap.map(mc => mc.kendala || mc.permasalahan || mc.hambatan)
                ].map(x => String(x || '').trim()).filter(Boolean);

                const tlArr = [
                    row.tindakLanjutTw1, row.tindakLanjutTw2, row.tindakLanjutTw3, row.tindakLanjutTw4,
                    row.tindakLanjut, row.solusi, row.rencanaTindakLanjut,
                    ...matchedCap.map(mc => mc.tindakLanjut || mc.solusi)
                ].map(x => String(x || '').trim()).filter(Boolean);

                const paguTahunIni = paguByYear[yr] || 0;
                const realisasiAnggaran = parseNum(row.realisasiAnggaran ?? row.serapan ?? row.realisasiBiaya) ?? 0;

                items.push({
                    id: row.id || `ik_${yr}_${idx}`,
                    kodeSk: kodeIndikator,
                    sasaran: sasaranTier3,
                    indikator: ikName,
                    satuan,
                    targetsByYear,
                    paguByYear,
                    target: targetsByYear[yr] ?? 0,
                    realisasi: realisasiVal,
                    realisasiPrevYear: prevYearVal,
                    targetRenstra2029: targetsByYear['2029'] ?? (targetsByYear[yr] ?? 0),
                    paguAnggaran: paguTahunIni,
                    realisasiAnggaran,
                    kendalaResume: Array.from(new Set(kendalaArr)).join('; '),
                    tindakLanjutResume: Array.from(new Set(tlArr)).join('; '),
                    targetNasionalBpsdmi: parseNum(row.targetBpsdmi) ?? (targetsByYear[yr] ?? 0),
                    satkerBpsdmiData: DEFAULT_SATKERS_BPSDMI.map(s => ({
                        satker: s,
                        target: (s === 'Politeknik Industri Petrokimia Banten') ? (targetsByYear[yr] ?? 0) : (parseNum(row.targetBpsdmi) ?? (targetsByYear[yr] ?? 0)),
                        nilai: (s === 'Politeknik Industri Petrokimia Banten' && realisasiVal > 0) ? realisasiVal : ''
                    })),
                    pembandingLuar: '',
                    aiNarrative: ''
                });
            });
        });

        return items;
    }

    function extractBudgetSummaryFromDB(tahun, indicators) {
        const yr = String(tahun || '2025');
        const dbObj = (typeof DB === 'object' && DB) ? DB : {};
        let paguTotal = 0;
        let realisasiTotal = 0;

        Object.keys(dbObj).forEach(k => {
            if (!Array.isArray(dbObj[k])) return;
            const kl = k.toLowerCase();
            if (kl.includes('anggaran') || kl.includes('biaya') || kl.includes('dipa') || kl.includes('keuangan')) {
                dbObj[k].forEach(r => {
                    if (!r || typeof r !== 'object') return;
                    const rYr = String(r.tahun || r.year || '').trim();
                    if (rYr && rYr !== yr) return;
                    paguTotal += parseNum(r.pagu ?? r.anggaran ?? r.jumlahPagu) ?? 0;
                    realisasiTotal += parseNum(r.realisasi ?? r.serapan ?? r.jumlahRealisasi) ?? 0;
                });
            }
        });

        if (paguTotal === 0 && Array.isArray(indicators)) {
            paguTotal = indicators.reduce((s, x) => s + (Number(x.paguAnggaran) || 0), 0);
        }
        if (realisasiTotal === 0 && Array.isArray(indicators)) {
            realisasiTotal = indicators.reduce((s, x) => s + (Number(x.realisasiAnggaran) || 0), 0);
        }

        return { paguTotal, realisasiTotal };
    }

    function getDefaultRingkasanEksekutif(yr, indicators, avgCapaian, efektifCount, efisienCount, paguDipa, realisasiDipa, pctDipa) {
        return [
            `Penyelenggaraan kegiatan-kegiatan di Politeknik Industri Petrokimia Banten Tahun Anggaran ${yr} merupakan kegiatan pendukung utama terhadap pencapaian Visi Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian, yaitu "BPSDMI sebagai penggerak utama pembangunan SDM Industri kompeten berdaya saing global", serta 7 (tujuh) Misi BPSDMI dalam pengembangan pendidikan vokasi industri dual system, link and match dengan industri, sistem 3 in 1 (pelatihan, sertifikasi kompetensi, dan penempatan kerja), serta ekosistem SDM Industri 4.0.`,
            `Dalam rangka mewujudkan visi dan misi tersebut, Politeknik Industri Petrokimia Banten pada Tahun Anggaran ${yr} menyelenggarakan Tridharma Perguruan Tinggi sesuai standar nasional pendidikan tinggi dengan kurikulum berbasis kompetensi yang terintegrasi dengan industri petrokimia. Dari ${indicators.length} Indikator Kinerja yang ditetapkan pada Perjanjian Kinerja Tahun ${yr}, rata-rata capaian kinerja organisasi mencapai ${fmtNum(avgCapaian)}%, dengan ${efektifCount} dari ${indicators.length} indikator dinyatakan Efektif dan ${efisienCount} dari ${indicators.length} indikator dinyatakan Efisien. Adapun realisasi anggaran DIPA mencapai ${fmtRp(realisasiDipa)} dari total pagu sebesar ${fmtRp(paguDipa)} (${fmtNum(pctDipa)}%).`,
            `Dalam pelaksanaannya, Politeknik Industri Petrokimia Banten menghadapi tantangan terkait keterbatasan jumlah sumber daya manusia (SDM) sehingga memerlukan optimalisasi sumber daya internal dan perangkapan fungsi pada beberapa unit kerja. Upaya perbaikan berkelanjutan terus dilakukan melalui peningkatan kompetensi pegawai, penguatan sistem informasi terintegrasi, dan perluasan kemitraan industri demi mewujudkan Politeknik Industri Petrokimia Banten yang unggul dan profesional.`
        ].join('\n\n');
    }

    function getDefaultBab4Penutup(yr, avgCapaian, pctDipa) {
        return {
            kesimpulan: `Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${yr} merupakan wujud pertanggungjawaban atas pelaksanaan rencana strategis serta gambaran tingkat capaian pelaksanaan kegiatan, program, dan kebijakan dalam mewujudkan Visi, Misi, Tujuan, dan Sasaran yang telah ditetapkan. Berdasarkan hasil evaluasi atas seluruh program dan kegiatan Tahun ${yr}, diperoleh rata-rata capaian kinerja organisasi sebesar ${fmtNum(avgCapaian)}% dengan tingkat penyerapan anggaran DIPA sebesar ${fmtNum(pctDipa)}%.`,
            permasalahan: `Permasalahan dan kendala utama yang dihadapi selama Tahun ${yr} meliputi keterbatasan jumlah SDM (dosen maupun tenaga kependidikan) sehingga sebagian pegawai masih menjalankan tugas rangkap jabatan, belum adanya lulusan pada angkatan berjalan yang memengaruhi beberapa komponen penilaian indikator (seperti keterserapan lulusan dan beberapa sub-indikator TVET 4.0), serta perlunya penyesuaian alokasi anggaran operasional dan fasilitas laboratorium terhadap peningkatan target kinerja.`,
            saran: `1. Mengusulkan penambahan anggaran pada Program Pendidikan dan Pelatihan Industri (DL) serta Program Dukungan Manajemen (WA) untuk mendukung pemenuhan target kinerja Renstra 2025–2029.\n2. Mengusulkan pemenuhan kebutuhan SDM (dosen dan tenaga kependidikan teknis/IT/pengadaan/kearsipan) melalui formasi rekrutmen CPNS/PPPK Kementerian Perindustrian.\n3. Meningkatkan kualitas perencanaan kegiatan dan penarikan anggaran secara proporsional setiap triwulan guna menjaga nilai Indeks Kinerja Pelaksanaan Anggaran (IKPA).\n4. Melaksanakan pelatihan teknis (penyusunan LKPS/LED akreditasi, SAKIP, SPBE, pengelolaan keuangan, dan penulisan publikasi terapan) serta benchmarking ke satuan kerja pendidikan vokasi BPSDMI unggulan.\n5. Mengoptimalkan koordinasi lintas 15 unit kerja melalui sistem pemantauan kinerja terintegrasi Ki-Jaro secara berkala.`
        };
    }

    function getOrInitLakipConfig(tahun) {
        const yr = String(tahun || '2025');
        if (typeof DB !== 'object' || !DB) window.DB = {};
        if (!DB.lakipConfigs || typeof DB.lakipConfigs !== 'object') DB.lakipConfigs = {};
        if (!DB.lakipConfigs[yr]) {
            const extracted = extractIndicatorsFromDB(yr);
            const budget = extractBudgetSummaryFromDB(yr, extracted);
            const defaultChecklist = {};
            SPI_CHECKLIST_ITEMS.forEach(it => { defaultChecklist[it.id] = 'V'; });

            const metricsList = extracted.map(computeIndicatorMetrics);
            const avgCap = extracted.length > 0 ? metricsList.reduce((a, b) => a + b.pctCapaian, 0) / extracted.length : 0;
            const efkCount = metricsList.filter(m => m.isEfektif).length;
            const efsCount = metricsList.filter(m => m.isEfisien).length;
            const pctDipa = budget.paguTotal > 0 ? (budget.realisasiTotal / budget.paguTotal) * 100 : 0;
            const defBab4 = getDefaultBab4Penutup(yr, avgCap, pctDipa);

            DB.lakipConfigs[yr] = {
                tahun: yr,
                workflowStatus: 'DRAFT',
                nomorNotaDinas: `312/BPSDMI/PIPB/KU/I/${Number(yr) + 1}`,
                tanggalNotaDinas: `30 Januari ${Number(yr) + 1}`,
                tanggalPengesahan: `Serang, 31 Desember ${yr}`,
                paguDipaTotal: budget.paguTotal,
                blokirAnggaran: 0,
                realisasiAnggaranTotal: budget.realisasiTotal,
                paguProgramDL: 0,
                blokirProgramDL: 0,
                sisaProgramDL: 0,
                paguProgramWA: 0,
                blokirProgramWA: 0,
                sisaProgramWA: 0,
                kataPengantarText: '',
                ringkasanEksekutifText: getDefaultRingkasanEksekutif(yr, extracted, avgCap, efkCount, efsCount, budget.paguTotal, budget.realisasiTotal, pctDipa),
                bab33EvaluasiText: '',
                bab4KesimpulanText: defBab4.kesimpulan,
                bab4PermasalahanText: defBab4.permasalahan,
                bab4SaranText: defBab4.saran,
                bab4PenutupText: '',
                geminiApiKey: '',
                indicators: extracted,
                reviewData: {
                    pembuatName: '',
                    pembuatDate: '',
                    reviewerName: '',
                    reviewerDate: '',
                    reviewerNotes: '',
                    checklist: defaultChecklist,
                    wadir2Name: '',
                    wadir2Date: '',
                    wadir2Notes: '',
                    direkturName: '',
                    direkturDate: '',
                    direkturNotes: '',
                    revisionHistory: []
                }
            };
        }
        const c = DB.lakipConfigs[yr];
        if (!c.reviewData) c.reviewData = { revisionHistory: [], checklist: {} };
        if (!Array.isArray(c.reviewData.revisionHistory)) c.reviewData.revisionHistory = [];
        return c;
    }

    function computeIndicatorMetrics(ind) {
        const target = parseFloat(ind.target) || 0;
        const real = parseFloat(ind.realisasi) || 0;
        const prev = parseFloat(ind.realisasiPrevYear) || 0;
        const renstra2029 = parseFloat(ind.targetRenstra2029) || target;
        const targetBpsdmi = parseFloat(ind.targetNasionalBpsdmi) || target;

        const pctCapaian = target > 0 ? (real / target) * 100 : (real > 0 ? 100 : 0);
        const gapTarget = real - target;
        const yoyDiff = prev > 0 ? real - prev : 0;
        const yoyPct = prev > 0 ? ((real - prev) / prev) * 100 : 0;
        const pctRenstra2029 = renstra2029 > 0 ? (real / renstra2029) * 100 : 0;
        const kontribusiBpsdmi = targetBpsdmi > 0 ? (real / targetBpsdmi) * 100 : 0;

        const validSatkers = (ind.satkerBpsdmiData || [])
            .filter(s => s.nilai !== '' && s.nilai !== null && !Number.isNaN(parseFloat(s.nilai)))
            .map(s => {
                const stTarget = parseFloat(s.target) || target || 1;
                const stVal = parseFloat(s.nilai);
                const stPct = stTarget > 0 ? (stVal / stTarget) * 100 : 0;
                return { satker: s.satker, target: stTarget, nilai: stVal, pct: stPct };
            })
            .sort((a, b) => b.pct - a.pct);

        const rankIdx = validSatkers.findIndex(s => s.satker === 'Politeknik Industri Petrokimia Banten');
        const rankStr = validSatkers.length > 1 && rankIdx >= 0
            ? `peringkat ke-${rankIdx + 1} dari ${validSatkers.length} satuan kerja Poltek/Akom BPSDMI berdasarkan persentase realisasi`
            : 'belum dibandingkan secara menyeluruh dengan satuan kerja BPSDMI lainnya';

        const pagu = parseFloat(ind.paguAnggaran) || 0;
        const serapan = parseFloat(ind.realisasiAnggaran) || 0;
        const pctSerapan = pagu > 0 ? (serapan / pagu) * 100 : 0;
        const selisihEfisiensi = pctCapaian - pctSerapan;
        const sisaAnggaran = Math.max(0, pagu - serapan);

        const isEfektif = target > 0 ? (pctCapaian >= 100) : (real > 0);
        const isEfisien = pagu > 0 ? (pctCapaian >= pctSerapan && pctSerapan <= 100) : true;

        return {
            pctCapaian,
            gapTarget,
            yoyDiff,
            yoyPct,
            pctRenstra2029,
            kontribusiBpsdmi,
            validSatkers,
            rankStr,
            pagu,
            serapan,
            sisaAnggaran,
            pctSerapan,
            selisihEfisiensi,
            isEfektif,
            isEfisien
        };
    }

    function buildIndicatorComparisonChartSvg(ind, yr) {
        const prevYr = String(Number(yr) - 1);
        const bars = [
            { label: `Real. ${prevYr}`, val: Number(ind.realisasiPrevYear) || 0, color: '#64748b' },
            { label: `Target ${yr}`, val: Number(ind.target) || 0, color: '#2563eb' },
            { label: `Realisasi ${yr}`, val: Number(ind.realisasi) || 0, color: '#059669' },
            { label: 'Target BPSDMI', val: Number(ind.targetNasionalBpsdmi) || 0, color: '#d97706' },
            { label: 'Renstra 2029', val: Number(ind.targetRenstra2029) || 0, color: '#4f46e5' }
        ];
        const maxVal = Math.max(...bars.map(b => b.val), 1);
        const chartW = 640;
        const chartH = 145;
        const barW = 72;
        const gap = 42;
        const startX = 48;
        const baseY = 112;
        const maxBarH = 82;

        return `
        <div style="border:1px solid #cbd5e1; background:#f8fafc; padding:10px 12px; border-radius:4px; margin:8px 0;">
            <div style="font-size:9pt; font-weight:bold; color:#1e3a8a; margin-bottom:4px; text-align:center;">
                Grafik Komparasi Capaian Kinerja ${esc(ind.kodeSk)} (${esc(ind.satuan)})
            </div>
            <svg width="100%" viewBox="0 0 ${chartW} ${chartH}" style="display:block; max-height:150px; font-family:Arial, sans-serif;">
                <line x1="35" y1="${baseY}" x2="${chartW - 20}" y2="${baseY}" stroke="#94a3b8" stroke-width="1" />
                ${bars.map((b, i) => {
                    const x = startX + i * (barW + gap);
                    const h = Math.max(2, Math.round((b.val / maxVal) * maxBarH));
                    const y = baseY - h;
                    return `
                        <rect x="${x}" y="${y}" width="${barW}" height="${h}" rx="3" fill="${b.color}" />
                        <text x="${x + barW / 2}" y="${y - 4}" text-anchor="middle" font-size="9" font-weight="bold" fill="#0f172a">${fmtNum(b.val)}</text>
                        <text x="${x + barW / 2}" y="${baseY + 14}" text-anchor="middle" font-size="8.5" font-weight="bold" fill="#334155">${esc(b.label)}</text>
                    `;
                }).join('')}
            </svg>
        </div>
        `;
    }

    function buildStructureOrganizationSvg() {
        return `
        <div style="border:1px solid #94a3b8; background:#ffffff; padding:12px; margin:10px 0 14px 0; text-align:center;">
            <p style="font-size:9.5pt; font-weight:bold; color:#1e3a8a; margin:0 0 8px 0;">Gambar 1.1 Struktur Organisasi Politeknik Industri Petrokimia Banten (Permenperin No. 29 Tahun 2022)</p>
            <svg width="100%" viewBox="0 0 760 320" style="display:block; max-height:310px; margin:0 auto; font-family:Arial, sans-serif;">
                <defs>
                    <style>
                        .org-box { fill: #eff6ff; stroke: #1e3a8a; stroke-width: 1.4; }
                        .org-top { fill: #1e3a8a; stroke: #0f172a; stroke-width: 1.5; }
                        .org-sub { fill: #f8fafc; stroke: #475569; stroke-width: 1.2; }
                        .org-txt-w { fill: #ffffff; font-size: 10px; font-weight: bold; text-anchor: middle; }
                        .org-txt { fill: #0f172a; font-size: 9px; font-weight: bold; text-anchor: middle; }
                        .org-txt-sm { fill: #1e293b; font-size: 8px; text-anchor: middle; }
                        .org-line { stroke: #334155; stroke-width: 1.2; fill: none; }
                        .org-dash { stroke: #64748b; stroke-width: 1.1; stroke-dasharray: 4,3; fill: none; }
                    </style>
                </defs>
                <!-- Direktur -->
                <rect x="305" y="10" width="150" height="34" rx="4" class="org-top" />
                <text x="380" y="31" class="org-txt-w">DIREKTUR</text>

                <!-- Senat & Dewan Penyantun -->
                <rect x="65" y="12" width="140" height="30" rx="4" class="org-sub" />
                <text x="135" y="31" class="org-txt">SENAT</text>
                <line x1="205" y1="27" x2="305" y2="27" class="org-dash" />

                <rect x="555" y="12" width="140" height="30" rx="4" class="org-sub" />
                <text x="625" y="31" class="org-txt">DEWAN PENYANTUN</text>
                <line x1="455" y1="27" x2="555" y2="27" class="org-dash" />

                <!-- Vertical Spine -->
                <line x1="380" y1="44" x2="380" y2="225" class="org-line" />

                <!-- SPM & SPI -->
                <rect x="95" y="62" width="175" height="32" rx="4" class="org-box" />
                <text x="182" y="81" class="org-txt">Satuan Penjaminan Mutu (SPM)</text>
                <line x1="270" y1="78" x2="380" y2="78" class="org-line" />

                <rect x="490" y="62" width="175" height="32" rx="4" class="org-box" />
                <text x="577" y="81" class="org-txt">Satuan Pengawas Internal (SPI)</text>
                <line x1="380" y1="78" x2="490" y2="78" class="org-line" />

                <!-- Pembantu Direktur I, II, III -->
                <line x1="160" y1="112" x2="600" y2="112" class="org-line" />
                <line x1="160" y1="112" x2="160" y2="126" class="org-line" />
                <line x1="380" y1="112" x2="380" y2="126" class="org-line" />
                <line x1="600" y1="112" x2="600" y2="126" class="org-line" />

                <rect x="75" y="126" width="170" height="36" rx="4" class="org-box" />
                <text x="160" y="142" class="org-txt">Pembantu Direktur I</text>
                <text x="160" y="154" class="org-txt-sm">(Akademik, Penelitian &amp; PKM)</text>

                <rect x="295" y="126" width="170" height="36" rx="4" class="org-box" />
                <text x="380" y="142" class="org-txt">Pembantu Direktur II</text>
                <text x="380" y="154" class="org-txt-sm">(Keuangan, Umum &amp; Kepegawaian)</text>

                <rect x="515" y="126" width="170" height="36" rx="4" class="org-box" />
                <text x="600" y="142" class="org-txt">Pembantu Direktur III</text>
                <text x="600" y="154" class="org-txt-sm">(Kemahasiswaan &amp; Kerja Sama)</text>

                <!-- Subbagian -->
                <line x1="230" y1="182" x2="530" y2="182" class="org-line" />
                <line x1="230" y1="182" x2="230" y2="195" class="org-line" />
                <line x1="530" y1="182" x2="530" y2="195" class="org-line" />

                <rect x="115" y="195" width="230" height="36" rx="4" class="org-sub" />
                <text x="230" y="211" class="org-txt">Subbagian Administrasi Akademik,</text>
                <text x="230" y="223" class="org-txt-sm">Kemahasiswaan, dan Kerja Sama</text>

                <rect x="415" y="195" width="230" height="36" rx="4" class="org-sub" />
                <text x="530" y="211" class="org-txt">Subbagian Umum</text>
                <text x="530" y="223" class="org-txt-sm">dan Keuangan</text>

                <!-- Unit Pelaksana & Penunjang -->
                <line x1="72" y1="250" x2="688" y2="250" class="org-line" />
                <line x1="380" y1="231" x2="380" y2="250" class="org-line" />

                <rect x="15" y="264" width="114" height="42" rx="4" class="org-sub" />
                <text x="72" y="282" class="org-txt">Program Studi</text>
                <text x="72" y="294" class="org-txt-sm">(TPIP, TMIP, TIIP)</text>

                <rect x="139" y="264" width="114" height="42" rx="4" class="org-sub" />
                <text x="196" y="282" class="org-txt">Unit Penelitian &amp;</text>
                <text x="196" y="294" class="org-txt-sm">Pengabdian (UPPM)</text>

                <rect x="263" y="264" width="114" height="42" rx="4" class="org-sub" />
                <text x="320" y="282" class="org-txt">Inkubator Bisnis</text>
                <text x="320" y="294" class="org-txt-sm">&amp; Inovasi Teknologi</text>

                <rect x="387" y="264" width="114" height="42" rx="4" class="org-sub" />
                <text x="444" y="282" class="org-txt">Unit Teaching</text>
                <text x="444" y="294" class="org-txt-sm">Factory (TEFA)</text>

                <rect x="511" y="264" width="114" height="42" rx="4" class="org-sub" />
                <text x="568" y="282" class="org-txt">Unit Penunjang</text>
                <text x="568" y="294" class="org-txt-sm">(Lab, Perpus, IT, LSP)</text>

                <rect x="635" y="264" width="110" height="42" rx="4" class="org-sub" />
                <text x="690" y="282" class="org-txt">Kelompok Jabatan</text>
                <text x="690" y="294" class="org-txt-sm">Fungsional</text>
            </svg>
        </div>
        `;
    }

    function buildDeterministicQualitativeAnalysis(ind, tahun) {
        if (!ind || !ind.indikator) return '';
        const m = computeIndicatorMetrics(ind);
        const yr = String(tahun);
        const prevYr = String(Number(yr) - 1);
        const tMap = ind.targetsByYear || {};

        const statusCapaian = m.pctCapaian >= 100
            ? `melampaui target yang ditetapkan sebesar ${fmtNum(Math.abs(m.gapTarget))} ${ind.satuan} dengan tingkat capaian sebesar ${fmtNum(m.pctCapaian)}%`
            : `mencapai ${fmtNum(m.pctCapaian)}% dari target yang ditetapkan dengan deviasi sebesar ${fmtNum(Math.abs(m.gapTarget))} ${ind.satuan}`;

        const yoyNarasi = ind.realisasiPrevYear > 0
            ? (m.yoyDiff >= 0
                ? `Apabila dibandingkan dengan realisasi Tahun ${prevYr} sebesar ${fmtNum(ind.realisasiPrevYear)} ${ind.satuan}, terjadi peningkatan kinerja secara tahunan (Year-on-Year) sebesar ${fmtNum(m.yoyDiff)} ${ind.satuan} atau tumbuh positif sebesar ${fmtNum(m.yoyPct)}%.`
                : `Dibandingkan dengan realisasi Tahun ${prevYr} sebesar ${fmtNum(ind.realisasiPrevYear)} ${ind.satuan}, terdapat selisih penyesuaian sebesar ${fmtNum(Math.abs(m.yoyDiff))} ${ind.satuan} (${fmtNum(m.yoyPct)}%).`)
            : `Data realisasi Tahun ${prevYr} belum tercatat pada periode sebelumnya sehingga realisasi Tahun ${yr} ditetapkan sebagai baseline awal pengukuran kinerja.`;

        const trajectoryStr = RENSTRA_YEARS.map(y => `Tahun ${y} sebesar ${fmtNum(tMap[y] ?? 0)} ${ind.satuan}`).join(', ');
        const renstraNarasi = `Dalam peta jalan (roadmap) Rencana Strategis (Renstra) Tahun 2025–2029 yang ditetapkan secara bertahap (${trajectoryStr}), realisasi Tahun ${yr} sebesar ${fmtNum(ind.realisasi)} ${ind.satuan} telah berkontribusi mencapai ${fmtNum(m.pctRenstra2029)}% terhadap sasaran akhir Renstra Tahun 2029.`;

        const luarNarasi = ind.pembandingLuar && ind.pembandingLuar.trim()
            ? ` Selanjutnya, apabila dibandingkan dengan perguruan tinggi vokasi di luar Kementerian Perindustrian (${ind.pembandingLuar.trim()}), capaian Politeknik Industri Petrokimia Banten menunjukkan daya saing yang kuat dan relevan dengan kebutuhan industri petrokimia.`
            : '';

        const bpsdmiNarasi = `Terhadap target nasional Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian sebesar ${fmtNum(ind.targetNasionalBpsdmi)} ${ind.satuan}, capaian Politeknik Industri Petrokimia Banten berkontribusi langsung sebesar ${fmtNum(m.kontribusiBpsdmi)}%. Dalam pemetaan kinerja antar satuan kerja pendidikan vokasi di lingkungan BPSDMI, capaian ini menempati ${m.rankStr}.${luarNarasi}`;

        const kendalaText = ind.kendalaResume && ind.kendalaResume.trim()
            ? ind.kendalaResume.trim()
            : 'Keterbatasan jumlah SDM sehingga sebagian pegawai menjalankan tugas rangkap jabatan serta perlunya penguatan koordinasi teknis lintas unit kerja.';
        const tlText = ind.tindakLanjutResume && ind.tindakLanjutResume.trim()
            ? ind.tindakLanjutResume.trim()
            : 'Melaksanakan pemantauan berkala, pelatihan teknis SDM, optimalisasi sumber daya laboratorium dan dosen, serta koordinasi lintas unit kerja.';

        const efNarasi = m.pagu > 0
            ? `Dari aspek akuntabilitas keuangan, evaluasi efektivitas dan efisiensi pelaksanaan ${ind.kodeSk} menunjukkan bahwa alokasi pagu anggaran sebesar ${fmtRp(m.pagu)} telah terealisasi sebesar ${fmtRp(m.serapan)} (${fmtNum(m.pctSerapan)}%) dengan sisa anggaran sebesar ${fmtRp(m.sisaAnggaran)}. Dengan membandingkan persentase capaian kinerja sebesar ${fmtNum(m.pctCapaian)}% terhadap persentase penyerapan anggaran sebesar ${fmtNum(m.pctSerapan)}%, diperoleh selisih rasio efisiensi sebesar ${m.selisihEfisiensi >= 0 ? '+' : ''}${fmtNum(m.selisihEfisiensi)}%. Berdasarkan parameter evaluasi kinerja dan anggaran tersebut, pelaksanaan indikator ini dinyatakan <strong>${m.isEfektif ? 'EFEKTIF' : 'BELUM EFEKTIF'}</strong> (capaian kinerja ${m.isEfektif ? 'memenuhi/melampaui' : 'belum mencapai'} 100% target) serta <strong>${m.isEfisien ? 'EFISIEN' : 'TIDAK EFISIEN'}</strong>.`
            : `Dari aspek evaluasi efektivitas dan efisiensi pelaksanaan kegiatan, capaian kinerja sebesar ${fmtNum(m.pctCapaian)}% menunjukkan bahwa pelaksanaan program dinilai <strong>${m.isEfektif ? 'EFEKTIF' : 'BELUM EFEKTIF'}</strong> terhadap target yang ditetapkan dan dilaksanakan secara <strong>EFISIEN</strong> melalui optimalisasi sumber daya internal unit kerja.`;

        return [
            `Pada Sasaran Program/Kegiatan "${ind.sasaran}", Indikator Kinerja ${ind.kodeSk} "${ind.indikator}" ditetapkan dengan target Tahun ${yr} sebesar ${fmtNum(ind.target)} ${ind.satuan}. Hingga akhir Triwulan IV Tahun ${yr}, realisasi kinerja mencapai ${fmtNum(ind.realisasi)} ${ind.satuan}, sehingga berhasil ${statusCapaian}. ${yoyNarasi}`,
            `${renstraNarasi} ${bpsdmiNarasi}`,
            `Selama pelaksanaan Triwulan I hingga Triwulan IV Tahun ${yr}, permasalahan/kendala yang dihadapi meliputi: ${kendalaText} Adapun langkah tindak lanjut penyelesaian yang telah dilaksanakan adalah: ${tlText}`,
            `${efNarasi} Rincian data dukung dan rekapitulasi lengkap pelaksanaan indikator ini disajikan secara utuh pada bagian Lampiran laporan ini.`
        ].join('\n\n');
    }

    async function generateQualitativeWithAI(promptText, fallbackText, apiKey) {
        const cleanKey = String(apiKey || '').trim();
        if (!cleanKey) return fallbackText;
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(cleanKey)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }],
                    generationConfig: { temperature: 0.45, maxOutputTokens: 1000 }
                })
            });
            if (!resp.ok) return fallbackText;
            const json = await resp.json();
            const out = json?.candidates?.[0]?.content?.parts?.[0]?.text;
            return (out && out.trim().length > 40) ? out.trim() : fallbackText;
        } catch (_) {
            return fallbackText;
        }
    }

    // =========================================================================
    // WORKFLOW APPROVAL BERJENJANG (SPI -> PUDIR II -> DIREKTUR)
    // =========================================================================
    function formatDateIndoNow() {
        return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }

    async function persistLakipSafely() {
        try {
            if (typeof saveToMySQL === 'function') {
                await saveToMySQL();
            } else {
                localStorage.setItem('kijaro_lakip_backup', JSON.stringify(DB.lakipConfigs || {}));
            }
        } catch (err) {
            console.warn('Penyimpanan server tertunda, disimpan lokal sementara:', err);
            try { localStorage.setItem('kijaro_lakip_backup', JSON.stringify(DB.lakipConfigs || {})); } catch (_) {}
        }
    }

    window.submitLakipToReviewer = async function () {
        if (_isProcessingWorkflow) return;
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.indicators || cfg.indicators.length === 0) {
            if (typeof showToast === 'function') showToast('Data indikator masih kosong. Sinkronkan data dari Ki-Jaro terlebih dahulu.', 'error');
            return;
        }
        _isProcessingWorkflow = true;
        try {
            const rights = getLakipAccessRights();
            cfg.workflowStatus = 'PENDING_REVIEWER';
            cfg.reviewData.pembuatName = rights.displayName;
            cfg.reviewData.pembuatDate = formatDateIndoNow();
            await persistLakipSafely();
            _lakipActiveTab = 'review';
            window.renderLakipWorkspace();
            if (typeof showToast === 'function') showToast('Draf LAKIP berhasil diajukan ke Role Reviewer (SPI) untuk direviu!', 'success');
        } finally {
            _isProcessingWorkflow = false;
        }
    };

    window.processLakipWorkflowDecision = async function (stage, decision) {
        if (_isProcessingWorkflow) return;
        _isProcessingWorkflow = true;

        try {
            const cfg = getOrInitLakipConfig(_lakipYear);
            const rights = getLakipAccessRights();
            const rev = cfg.reviewData;
            const todayStr = formatDateIndoNow();

            const spiNoteEl = document.getElementById('lakipNoteReviewer');
            if (spiNoteEl) rev.reviewerNotes = spiNoteEl.value;
            const wadirNoteEl = document.getElementById('lakipNoteWadir2');
            if (wadirNoteEl) rev.wadir2Notes = wadirNoteEl.value;
            const dirNoteEl = document.getElementById('lakipNoteDirektur');
            if (dirNoteEl) rev.direkturNotes = dirNoteEl.value;

            if (stage === 'REVIEWER') {
                rev.reviewerName = rights.displayName;
                rev.reviewerDate = todayStr;
                if (decision === 'VALID') {
                    cfg.workflowStatus = 'PENDING_WADIR2';
                    if (typeof showToast === 'function') showToast('Hasil reviu dinyatakan VALID. Diteruskan ke Pembantu Direktur II.', 'success');
                } else {
                    cfg.workflowStatus = 'DRAFT';
                    rev.revisionHistory.unshift({
                        date: todayStr,
                        by: `${rights.displayName} (Reviewer / SPI)`,
                        note: rev.reviewerNotes || 'Diminta melakukan perbaikan sesuai Lembar Review & Checklist Reviu SPI.'
                    });
                    if (typeof showToast === 'function') showToast('Dokumen dikembalikan ke mode DRAF pada Tim Program / Penyusun untuk diperbaiki.', 'info');
                }
            } else if (stage === 'WADIR2') {
                rev.wadir2Name = rights.displayName;
                rev.wadir2Date = todayStr;
                if (decision === 'VALID') {
                    cfg.workflowStatus = 'PENDING_DIREKTUR';
                    if (typeof showToast === 'function') showToast('Disetujui Pembantu Direktur II. Diteruskan ke Direktur untuk pengesahan akhir.', 'success');
                } else {
                    cfg.workflowStatus = 'DRAFT';
                    rev.revisionHistory.unshift({
                        date: todayStr,
                        by: `${rights.displayName} (Pembantu Direktur II)`,
                        note: rev.wadir2Notes || 'Diminta melakukan perbaikan oleh Pembantu Direktur II.'
                    });
                    if (typeof showToast === 'function') showToast('Dokumen dikembalikan ke mode DRAF pada Tim Program / Penyusun untuk diperbaiki.', 'info');
                }
            } else if (stage === 'DIREKTUR') {
                rev.direkturName = rights.displayName;
                rev.direkturDate = todayStr;
                if (decision === 'VALID') {
                    cfg.workflowStatus = 'APPROVED';
                    if (typeof showToast === 'function') showToast('LAKIP telah DISAHKAN oleh Direktur! Fitur Cetak/Download PDF kini terbuka.', 'success');
                } else {
                    cfg.workflowStatus = 'DRAFT';
                    rev.revisionHistory.unshift({
                        date: todayStr,
                        by: `${rights.displayName} (Direktur)`,
                        note: rev.direkturNotes || 'Diminta melakukan perbaikan sesuai arahan Direktur.'
                    });
                    if (typeof showToast === 'function') showToast('Dokumen dikembalikan ke mode DRAF pada Tim Program / Penyusun untuk diperbaiki.', 'info');
                }
            }

            await persistLakipSafely();
            window.renderLakipWorkspace();
            const bannerStatusEl = document.getElementById('lakipBannerStatusText');
            if (bannerStatusEl) bannerStatusEl.textContent = cfg.workflowStatus;
        } finally {
            _isProcessingWorkflow = false;
        }
    };

    window.toggleSpiChecklistValue = async function (itemId, val) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.reviewData.checklist) cfg.reviewData.checklist = {};
        cfg.reviewData.checklist[itemId] = val;
        window.renderLakipWorkspace();
        await persistLakipSafely();
    };

    window.saveLakipReviewNote = async function (field, val) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        cfg.reviewData[field] = val;
        await persistLakipSafely();
    };

    window.switchLakipTab = function (tabName) {
        _lakipActiveTab = tabName;
        window.renderLakipWorkspace();
    };

    window.changeLakipYear = function (yr) {
        _lakipYear = yr;
        _lakipSelectedIndIdx = 0;
        window.renderLakipWorkspace();
    };

    window.selectLakipIndicator = function (idx) {
        _lakipSelectedIndIdx = Number(idx) || 0;
        window.renderLakipWorkspace();
    };

    window.runAiAnalyzeSingleIndicator = async function (idx) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        const ind = cfg.indicators[idx];
        if (!ind) return;

        const btn = document.getElementById('btnLakipAiSingle');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Menganalisis...'; }

        const m = computeIndicatorMetrics(ind);
        const fallback = buildDeterministicQualitativeAnalysis(ind, _lakipYear);
        const tMap = ind.targetsByYear || {};
        const stepStr = RENSTRA_YEARS.map(y => `${y}: ${tMap[y] ?? 0}`).join(', ');

        const prompt = `Anda adalah penyusun Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten, Kementerian Perindustrian (Permenperin No. 150/PER/12/2011).
Tulis analisis kinerja naratif-kualitatif formal berbahasa Indonesia baku (4 paragraf padat tanpa bullet point) untuk indikator berikut:
- Sasaran Program / Kegiatan (Tier 3): ${ind.sasaran}
- Indikator Kinerja (Tier 4): ${ind.kodeSk} — ${ind.indikator}
- Tahun: ${_lakipYear} | Target: ${ind.target} ${ind.satuan} | Realisasi: ${ind.realisasi} ${ind.satuan} (${fmtNum(m.pctCapaian)}%)
- Realisasi Tahun Lalu: ${ind.realisasiPrevYear} ${ind.satuan} (Perubahan YoY: ${fmtNum(m.yoyPct)}%)
- Target Bertahap Renstra 2025-2029: ${stepStr} (Progres ke 2029: ${fmtNum(m.pctRenstra2029)}%)
- Target Nasional BPSDMI: ${ind.targetNasionalBpsdmi} ${ind.satuan} (Kontribusi PIPB: ${fmtNum(m.kontribusiBpsdmi)}%)
- Peringkat Satker BPSDMI: ${m.rankStr}
- Pembanding Poltek Luar Kemenperin: ${ind.pembandingLuar || 'Tidak ada'}
- Kendala TW 1-4: ${ind.kendalaResume || 'Tidak ada'}
- Tindak Lanjut: ${ind.tindakLanjutResume || 'Tidak ada'}
- Evaluasi Efektivitas & Efisiensi Anggaran: Pagu ${fmtRp(m.pagu)}, Realisasi ${fmtRp(m.serapan)} (${fmtNum(m.pctSerapan)}%), Sisa ${fmtRp(m.sisaAnggaran)}, Selisih Rasio ${fmtNum(m.selisihEfisiensi)}%, Status: ${m.isEfektif ? 'EFEKTIF' : 'BELUM EFEKTIF'} dan ${m.isEfisien ? 'EFISIEN' : 'TIDAK EFISIEN'}.
Akhiri paragraf terakhir dengan kalimat yang menyatakan bahwa rincian data lebih lengkap terlampir pada Lampiran laporan.`;

        ind.aiNarrative = await generateQualitativeWithAI(prompt, fallback, cfg.geminiApiKey);
        await persistLakipSafely();
        window.renderLakipWorkspace();
        if (typeof showToast === 'function') showToast('Narasi kualitatif indikator berhasil diperbarui!', 'success');
    };

    window.runAiAnalyzeAllSections = async function () {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.indicators || cfg.indicators.length === 0) {
            if (typeof showToast === 'function') showToast('Data indikator di Ki-Jaro masih kosong. Sinkronkan data TW 4 terlebih dahulu.', 'error');
            return;
        }

        const btn = document.getElementById('btnLakipAiAll');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Menyusun Seluruh Narasi LAKIP...'; }

        for (let i = 0; i < cfg.indicators.length; i++) {
            const ind = cfg.indicators[i];
            const fallback = buildDeterministicQualitativeAnalysis(ind, _lakipYear);
            if (!cfg.geminiApiKey) {
                ind.aiNarrative = fallback;
            } else {
                const m = computeIndicatorMetrics(ind);
                const prompt = `Susun analisis kualitatif formal LAKIP Politeknik Industri Petrokimia Banten Tahun ${_lakipYear} (4 paragraf baku tanpa bullet) untuk Sasaran "${ind.sasaran}", Indikator ${ind.kodeSk} "${ind.indikator}", Target ${ind.target} ${ind.satuan}, Realisasi ${ind.realisasi} ${ind.satuan} (${fmtNum(m.pctCapaian)}%), YoY ${fmtNum(m.yoyPct)}%, Renstra 2025-2029 bertahap (${fmtNum(m.pctRenstra2029)}%), Kontribusi BPSDMI ${fmtNum(m.kontribusiBpsdmi)}%, ${m.rankStr}, Kendala: ${ind.kendalaResume || '-'}, Tindak Lanjut: ${ind.tindakLanjutResume || '-'}, Pagu ${fmtRp(m.pagu)}, Realisasi Anggaran ${fmtRp(m.serapan)} (${fmtNum(m.pctSerapan)}%), Efektivitas & Efisiensi: ${m.isEfektif ? 'Efektif' : 'Tidak Efektif'} & ${m.isEfisien ? 'Efisien' : 'Tidak Efisien'}. Tutup dengan rujukan ke Lampiran.`;
                ind.aiNarrative = await generateQualitativeWithAI(prompt, fallback, cfg.geminiApiKey);
            }
        }

        const metricsList = cfg.indicators.map(computeIndicatorMetrics);
        const avgCapaian = metricsList.reduce((a, b) => a + b.pctCapaian, 0) / (metricsList.length || 1);
        const efektifCount = metricsList.filter(m => m.isEfektif).length;
        const efisienCount = metricsList.filter(m => m.isEfisien).length;
        const pctDipa = cfg.paguDipaTotal > 0 ? (cfg.realisasiAnggaranTotal / cfg.paguDipaTotal) * 100 : 0;

        const fallbackRingkasan = getDefaultRingkasanEksekutif(_lakipYear, cfg.indicators, avgCapaian, efektifCount, efisienCount, cfg.paguDipaTotal, cfg.realisasiAnggaranTotal, pctDipa);
        const defBab4 = getDefaultBab4Penutup(_lakipYear, avgCapaian, pctDipa);

        const fallbackBab33 = `Berdasarkan rekapitulasi evaluasi seluruh ${cfg.indicators.length} Indikator Kinerja pada Tahun ${_lakipYear}, diperoleh rata-rata tingkat capaian kinerja sebesar ${fmtNum(avgCapaian)}% dengan tingkat penyerapan anggaran DIPA sebesar ${fmtNum(pctDipa)}%. Sebanyak ${efektifCount} indikator dinyatakan Efektif (capaian kinerja/output >= 100% terhadap target) dan ${efisienCount} indikator dinyatakan Efisien (persentase capaian kinerja lebih besar dibandingkan persentase serapan anggarannya). Evaluasi ini menjadi tolok ukur akuntabilitas kinerja dan keuangan Politeknik Industri Petrokimia Banten dalam mewujudkan tata kelola birokrasi yang efektif, efisien, dan akuntabel.`;

        cfg.ringkasanEksekutifText = await generateQualitativeWithAI(
            `Tulis Ringkasan Eksekutif LAKIP Politeknik Industri Petrokimia Banten Tahun ${_lakipYear} (3 paragraf formal baku mengacu Visi Misi BPSDMI dan capaian PIPB) dengan data: ${cfg.indicators.length} IKU, rata-rata capaian ${fmtNum(avgCapaian)}%, ${efektifCount} indikator efektif, ${efisienCount} indikator efisien, pagu DIPA ${fmtRp(cfg.paguDipaTotal)}, realisasi ${fmtRp(cfg.realisasiAnggaranTotal)} (${fmtNum(pctDipa)}%).`,
            fallbackRingkasan,
            cfg.geminiApiKey
        );
        cfg.bab33EvaluasiText = fallbackBab33;
        cfg.bab4KesimpulanText = defBab4.kesimpulan;
        cfg.bab4PermasalahanText = defBab4.permasalahan;
        cfg.bab4SaranText = defBab4.saran;

        await persistLakipSafely();
        window.renderLakipWorkspace();
        if (typeof showToast === 'function') showToast('Seluruh analisis kualitatif & struktur BAB I–IV LAKIP berhasil disusun!', 'success');
    };

    window.handleLakipFileUpload = function (indId, inputEl) {
        const files = Array.from(inputEl?.files || []);
        if (!files.length) return;
        if (!Array.isArray(_lakipAttachments[indId])) _lakipAttachments[indId] = [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function (ev) {
                _lakipAttachments[indId].push({
                    name: file.name,
                    type: file.type,
                    dataUrl: ev.target.result
                });
                window.renderLakipWorkspace();
            };
            reader.readAsDataURL(file);
        });
    };

    window.removeLakipAttachment = function (indId, fileIdx) {
        if (Array.isArray(_lakipAttachments[indId])) {
            _lakipAttachments[indId].splice(fileIdx, 1);
            window.renderLakipWorkspace();
        }
    };

    function buildFullLakipDocumentHtml(cfg) {
        const dir = getDirectorInfo();
        const yr = cfg.tahun;
        const nextYr = String(Number(yr) + 1);
        const indicators = cfg.indicators || [];
        const metricsList = indicators.map(computeIndicatorMetrics);
        const rev = cfg.reviewData || {};

        const avgCapaian = indicators.length > 0
            ? metricsList.reduce((a, b) => a + b.pctCapaian, 0) / indicators.length
            : 0;
        const avgSerapanIku = indicators.length > 0
            ? metricsList.reduce((a, b) => a + b.pctSerapan, 0) / indicators.length
            : 0;
        const efektifCount = metricsList.filter(m => m.isEfektif).length;
        const efisienCount = metricsList.filter(m => m.isEfisien).length;
        const pctDipa = cfg.paguDipaTotal > 0 ? (cfg.realisasiAnggaranTotal / cfg.paguDipaTotal) * 100 : 0;

        const tier3Groups = {};
        indicators.forEach(ind => {
            const grpKey = ind.sasaran || 'Sasaran Strategis';
            if (!tier3Groups[grpKey]) tier3Groups[grpKey] = [];
            tier3Groups[grpKey].push(ind);
        });

        const ringkasanSource = cfg.ringkasanEksekutifText || getDefaultRingkasanEksekutif(yr, indicators, avgCapaian, efektifCount, efisienCount, cfg.paguDipaTotal, cfg.realisasiAnggaranTotal, pctDipa);
        const ringkasanHtml = ringkasanSource
            .split(/\n+/).filter(Boolean).map(p => `<p style="text-align:justify; text-indent:28px; margin-bottom:10px;">${esc(p)}</p>`).join('');

        const bab33Html = (cfg.bab33EvaluasiText || '').split(/\n+/).filter(Boolean)
            .map(p => `<p style="text-align:justify; text-indent:28px; margin-bottom:10px;">${esc(p)}</p>`).join('');

        const defBab4 = getDefaultBab4Penutup(yr, avgCapaian, pctDipa);
        const kesimpulanHtml = (cfg.bab4KesimpulanText || defBab4.kesimpulan)
            .split(/\n+/).filter(Boolean).map(p => `<p style="text-align:justify; text-indent:28px; margin-bottom:10px;">${esc(p)}</p>`).join('');
        const permasalahanHtml = (cfg.bab4PermasalahanText || defBab4.permasalahan)
            .split(/\n+/).filter(Boolean).map(p => `<p style="text-align:justify; text-indent:28px; margin-bottom:10px;">${esc(p)}</p>`).join('');
        const saranLines = (cfg.bab4SaranText || defBab4.saran).split(/\n+/).filter(Boolean);
        const saranHtml = saranLines.map(line => `<p style="text-align:justify; margin-bottom:6px; padding-left:14px;">${esc(line)}</p>`).join('');

        const paguDL = Number(cfg.paguProgramDL) || 0;
        const blokirDL = Number(cfg.blokirProgramDL) || 0;
        const sisaDL = Number(cfg.sisaProgramDL) || 0;
        const realDL = Math.max(0, paguDL - blokirDL - sisaDL);

        const paguWA = Number(cfg.paguProgramWA) || 0;
        const blokirWA = Number(cfg.blokirProgramWA) || 0;
        const sisaWA = Number(cfg.sisaProgramWA) || 0;
        const realWA = Math.max(0, paguWA - blokirWA - sisaWA);

        const hasProgramBreakdown = (paguDL > 0 || paguWA > 0);
        const totalPaguProgram = hasProgramBreakdown ? (paguDL + paguWA) : (Number(cfg.paguDipaTotal) || 0);
        const totalBlokirProgram = hasProgramBreakdown ? (blokirDL + blokirWA) : (Number(cfg.blokirAnggaran) || 0);
        const totalRealProgram = hasProgramBreakdown ? (realDL + realWA) : (Number(cfg.realisasiAnggaranTotal) || 0);
        const totalSisaProgram = hasProgramBreakdown ? (sisaDL + sisaWA) : Math.max(0, totalPaguProgram - totalBlokirProgram - totalRealProgram);

        const tblStyle = 'width:100%; border-collapse:collapse; font-family:Arial, Helvetica, sans-serif; font-size:9.5pt; margin:8px 0 14px 0;';
        const thStyle = 'border:1px solid #1e3a8a; background-color:#1e3a8a; color:#ffffff; padding:7px 8px; font-weight:bold; text-align:center; vertical-align:middle;';
        const tdCenter = 'border:1px solid #94a3b8; padding:6px 8px; text-align:center; vertical-align:middle;';
        const tdLeft = 'border:1px solid #94a3b8; padding:6px 8px; text-align:left; vertical-align:top;';
        const tdRight = 'border:1px solid #94a3b8; padding:6px 8px; text-align:right; vertical-align:middle;';

        return `
        <div id="lakipPrintableFullSheet" style="font-family:Arial, Helvetica, sans-serif; font-size:10.5pt; line-height:1.55; color:#0f172a;">
            <style>
                #lakipPrintableFullSheet, #lakipPrintableFullSheet * {
                    font-family: Arial, Helvetica, sans-serif !important;
                }
                .lakip-page {
                    background: #ffffff;
                    border: 1px solid #cbd5e1;
                    padding: 28px 32px;
                    margin-bottom: 24px;
                }
                .lakip-zebra tbody tr:nth-child(even) {
                    background-color: #f8fafc;
                }
            </style>

            <!-- SAMPUL / COVER -->
            <div class="lakip-page" style="border:4px double #1e3a8a; min-height:265mm; display:flex; flex-direction:column; justify-content:space-between; text-align:center; page-break-after:always;">
                <div style="padding-top:18px;">
                    <p style="font-size:15pt; font-weight:bold; text-transform:uppercase; letter-spacing:1px; color:#1e3a8a; margin:0;">LAPORAN AKUNTABILITAS KINERJA</p>
                    <p style="font-size:15pt; font-weight:bold; text-transform:uppercase; letter-spacing:1px; color:#1e3a8a; margin:4px 0 0 0;">INSTANSI PEMERINTAH (LAKIP)</p>
                    <div style="display:inline-block; margin-top:12px; padding:6px 26px; background:#1e3a8a; color:#ffffff; font-size:12pt; font-weight:bold; letter-spacing:2px;">TAHUN ANGGARAN ${esc(yr)}</div>
                </div>

                <div style="margin:auto 0;">
                    <img src="${LOGO_KEMENPERIN}" onerror="this.style.display='none'" style="width:140px; height:140px; margin:0 auto 20px auto; object-fit:contain;" alt="Logo Kementerian Perindustrian">
                    <div style="width:120px; height:4px; background:#d97706; margin:0 auto 20px auto;"></div>
                    <h1 style="font-size:16pt; font-weight:bold; text-transform:uppercase; color:#1e3a8a; margin:0 0 6px 0;">POLITEKNIK INDUSTRI PETROKIMIA BANTEN</h1>
                    <h2 style="font-size:11.5pt; font-weight:bold; text-transform:uppercase; color:#1e293b; margin:0 0 4px 0;">BADAN PENGEMBANGAN SUMBER DAYA MANUSIA INDUSTRI</h2>
                    <h3 style="font-size:11.5pt; font-weight:bold; text-transform:uppercase; color:#1e293b; margin:0;">KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA</h3>
                </div>

                <div style="border-top:2px solid #1e3a8a; padding-top:14px; font-size:9.5pt; color:#1e293b;">
                    <p style="font-weight:bold; margin:0;">POLITEKNIK INDUSTRI PETROKIMIA BANTEN</p>
                    <p style="margin:2px 0;">Jalan Raya Karang Bolong, Desa Cikoneng, Kecamatan Anyar, Kabupaten Serang, Banten 42166</p>
                    <p style="font-weight:bold; color:#1e3a8a; margin:4px 0 0 0;">TAHUN ${esc(nextYr)}</p>
                </div>
            </div>

            <!-- NOTA DINAS -->
            <div class="lakip-page" style="page-break-after:always;">
                <div style="display:flex; align-items:center; gap:16px; border-bottom:3px solid #0f172a; padding-bottom:10px; margin-bottom:14px;">
                    <img src="${LOGO_KEMENPERIN}" onerror="this.style.display='none'" style="width:64px; height:64px; object-fit:contain;" alt="Logo">
                    <div style="text-align:center; flex:1;">
                        <p style="font-size:10pt; font-weight:bold; text-transform:uppercase; margin:0;">Kementerian Perindustrian Republik Indonesia</p>
                        <p style="font-size:10pt; font-weight:bold; text-transform:uppercase; margin:2px 0;">Badan Pengembangan Sumber Daya Manusia Industri</p>
                        <p style="font-size:12pt; font-weight:bold; text-transform:uppercase; margin:2px 0 0 0;">Politeknik Industri Petrokimia Banten</p>
                        <p style="font-size:8.5pt; margin:2px 0 0 0;">Jalan Raya Karang Bolong, Desa Cikoneng, Kecamatan Anyar, Kabupaten Serang, Banten 42166</p>
                    </div>
                </div>
                <h3 style="text-align:center; font-weight:bold; text-transform:uppercase; text-decoration:underline; margin:10px 0 4px 0;">NOTA DINAS</h3>
                <p style="text-align:center; font-size:10pt; margin:0 0 14px 0;">Nomor: ${esc(cfg.nomorNotaDinas || '-')}</p>
                <table style="width:100%; font-size:10pt; border-collapse:collapse; margin-bottom:12px;">
                    <tr><td style="width:100px; padding:3px 0;">Yth.</td><td style="width:16px;">:</td><td>Sekretaris Badan Pengembangan Sumber Daya Manusia Industri</td></tr>
                    <tr><td style="padding:3px 0;">Dari</td><td>:</td><td>Direktur Politeknik Industri Petrokimia Banten</td></tr>
                    <tr><td style="padding:3px 0;">Lampiran</td><td>:</td><td>1 (satu) Berkas</td></tr>
                    <tr><td style="padding:3px 0;">Hal</td><td>:</td><td style="font-weight:bold;">Penyampaian Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun Anggaran ${esc(yr)}</td></tr>
                    <tr><td style="padding:3px 0;">Tanggal</td><td>:</td><td>${esc(cfg.tanggalNotaDinas || `30 Januari ${nextYr}`)}</td></tr>
                </table>
                <hr style="border:1px solid #0f172a; margin-bottom:14px;">
                <p style="text-align:justify; text-indent:28px; margin-bottom:10px;">
                    Sehubungan dengan pelaksanaan kewajiban akuntabilitas kinerja instansi pemerintah di lingkungan Kementerian Perindustrian serta sebagai bentuk pertanggungjawaban atas pelaksanaan program dan kegiatan yang telah dilaksanakan sesuai dengan tugas dan fungsi satuan kerja pada Tahun Anggaran ${esc(yr)}, bersama ini kami sampaikan Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun Anggaran ${esc(yr)}.
                </p>
                <p style="text-align:justify; text-indent:28px; margin-bottom:24px;">
                    LAKIP tersebut disusun sebagai wujud transparansi dan akuntabilitas kinerja, serta sebagai bahan evaluasi dalam rangka peningkatan kinerja Politeknik Industri Petrokimia Banten di lingkungan Badan Pengembangan Sumber Daya Manusia Industri. Demikian hal ini kami sampaikan, atas perhatian dan arahan Bapak/Ibu kami ucapkan terima kasih.
                </p>
                <div style="display:flex; justify-content:flex-end; margin-top:24px;">
                    <div style="text-align:center; width:260px;">
                        <p style="font-weight:bold; margin:0;">Direktur,</p>
                        <div style="height:64px;"></div>
                        <p style="font-weight:bold; text-decoration:underline; margin:0;">${esc(dir.name)}</p>
                        <p style="margin:2px 0 0 0;">NIP. ${esc(dir.nip)}</p>
                    </div>
                </div>
            </div>

            <!-- KATA PENGANTAR & RINGKASAN EKSEKUTIF -->
            <div class="lakip-page" style="page-break-after:always;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 14px 0;">KATA PENGANTAR</h3>
                <p style="text-align:justify; text-indent:28px; margin-bottom:10px;">
                    Sehubungan dengan telah berakhirnya Tahun Anggaran ${esc(yr)}, maka disusun Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)} berdasarkan realisasi kegiatan operasional dan capaian indikator kinerja pada Perjanjian Kinerja Tahun ${esc(yr)}.
                </p>
                <p style="text-align:justify; text-indent:28px; margin-bottom:10px;">
                    Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) ini disusun untuk memenuhi ketentuan yang berlaku pada Kementerian Perindustrian Republik Indonesia dengan mengacu kepada Peraturan Presiden Nomor 29 Tahun 2014 tentang Sistem Akuntabilitas Kinerja Instansi Pemerintah serta Peraturan Menteri Perindustrian Nomor: 150/PER/12/2011 tentang Pedoman Penyusunan Dokumen Akuntabilitas Kinerja Instansi Pemerintah di Lingkungan Kementerian Perindustrian.
                </p>
                <p style="text-align:justify; text-indent:28px; margin-bottom:16px;">
                    Diharapkan LAKIP Politeknik Industri Petrokimia Banten Tahun ${esc(yr)} ini dapat memberikan gambaran/informasi yang berguna bagi semua pihak dan sebagai pertanggungjawaban atas tugas pokok Politeknik Industri Petrokimia Banten dalam Tahun ${esc(yr)}. Pada kesempatan ini kami ucapkan terima kasih kepada seluruh unit kerja di lingkungan Politeknik Industri Petrokimia Banten yang telah memberikan bahan dan masukan dalam penyusunan laporan ini.
                </p>
                <div style="display:flex; justify-content:flex-end; margin-bottom:20px;">
                    <div style="text-align:center; width:260px;">
                        <p style="margin:0;">${esc(cfg.tanggalPengesahan)}</p>
                        <p style="margin:2px 0 0 0;">Politeknik Industri Petrokimia Banten</p>
                        <p style="font-weight:bold; margin:2px 0 0 0;">Direktur,</p>
                        <div style="height:56px;"></div>
                        <p style="font-weight:bold; text-decoration:underline; margin:0;">${esc(dir.name)}</p>
                        <p style="margin:2px 0 0 0;">NIP. ${esc(dir.nip)}</p>
                    </div>
                </div>

                <hr style="border:1px solid #cbd5e1; margin:16px 0;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 12px 0;">RINGKASAN EKSEKUTIF</h3>
                <table style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle}">Total Indikator Kinerja</th>
                            <th style="${thStyle}">Rata-Rata Capaian Kinerja</th>
                            <th style="${thStyle}">Indikator Efektif</th>
                            <th style="${thStyle}">Indikator Efisien</th>
                            <th style="${thStyle}">Realisasi Anggaran DIPA</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="${tdCenter} font-weight:bold;">${indicators.length} Indikator</td>
                            <td style="${tdCenter} font-weight:bold;">${fmtNum(avgCapaian)}%</td>
                            <td style="${tdCenter} font-weight:bold;">${efektifCount} dari ${indicators.length}</td>
                            <td style="${tdCenter} font-weight:bold;">${efisienCount} dari ${indicators.length}</td>
                            <td style="${tdCenter} font-weight:bold;">${fmtNum(pctDipa)}%</td>
                        </tr>
                    </tbody>
                </table>
                ${ringkasanHtml}
            </div>

            <!-- DAFTAR ISI -->
            <div class="lakip-page" style="page-break-after:always;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 14px 0;">DAFTAR ISI</h3>
                <table style="width:100%; border-collapse:collapse; font-size:10pt;">
                    <tbody>
                        <tr><td style="padding:4px 0; font-weight:bold;">NOTA DINAS</td><td style="text-align:right;">i</td></tr>
                        <tr><td style="padding:4px 0; font-weight:bold;">KATA PENGANTAR</td><td style="text-align:right;">ii</td></tr>
                        <tr><td style="padding:4px 0; font-weight:bold;">RINGKASAN EKSEKUTIF</td><td style="text-align:right;">iii</td></tr>
                        <tr><td style="padding:4px 0; font-weight:bold;">DAFTAR ISI</td><td style="text-align:right;">iv</td></tr>
                        <tr><td style="padding:8px 0 4px 0; font-weight:bold;">BAB I. PENDAHULUAN</td><td style="text-align:right; font-weight:bold;">1</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">1.1. Tugas Pokok dan Fungsi</td><td style="text-align:right;">1</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">1.2. Struktur Organisasi</td><td style="text-align:right;">2</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">1.3. Peran Strategis Politeknik Industri Petrokimia Banten</td><td style="text-align:right;">4</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">1.4. Rencana Strategis Politeknik Industri Petrokimia Banten (1.4.1 Visi, 1.4.2 Misi, 1.4.3 Tujuan, 1.4.4 Sasaran Kinerja, 1.4.5 Arah Kebijakan dan Strategi)</td><td style="text-align:right;">5</td></tr>
                        <tr><td style="padding:8px 0 4px 0; font-weight:bold;">BAB II. PERENCANAAN DAN PERJANJIAN KERJA</td><td style="text-align:right; font-weight:bold;">10</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">2.1. Perencanaan Kinerja Tahun ${esc(yr)} &amp; Target Bertahap Renstra 2025–2029</td><td style="text-align:right;">10</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">2.2. Rencana Anggaran Tahun ${esc(yr)}</td><td style="text-align:right;">11</td></tr>
                        <tr><td style="padding:8px 0 4px 0; font-weight:bold;">BAB III. AKUNTABILITAS KINERJA</td><td style="text-align:right; font-weight:bold;">12</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">3.1. Analisis Capaian Kinerja Organisasi, Perbandingan BPSDMI, serta Efektivitas &amp; Efisiensi per Indikator</td><td style="text-align:right;">12</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">3.2. Realisasi Anggaran Tahun ${esc(yr)} (Per Program &amp; Per IKU)</td><td style="text-align:right;">26</td></tr>
                        <tr><td style="padding:2px 0 2px 18px;">3.3. Efektivitas dan Efisiensi Kinerja dan Anggaran</td><td style="text-align:right;">28</td></tr>
                        <tr><td style="padding:8px 0 4px 0; font-weight:bold;">BAB IV. PENUTUP (A. Kesimpulan, B. Permasalahan dan Kendala, C. Saran dan Rekomendasi)</td><td style="text-align:right; font-weight:bold;">31</td></tr>
                        <tr><td style="padding:8px 0 4px 0; font-weight:bold;">LEMBAR REVIEW &amp; CHECKLIST REVIU SPI</td><td style="text-align:right; font-weight:bold;">Terlampir</td></tr>
                        <tr><td style="padding:4px 0; font-weight:bold;">LAMPIRAN DATA DUKUNG CAPAIAN KINERJA</td><td style="text-align:right; font-weight:bold;">Terlampir</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- BAB I PENDAHULUAN -->
            <div class="lakip-page" style="page-break-after:always;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 14px 0;">BAB I.<br>PENDAHULUAN</h3>

                <h4 style="font-weight:bold; margin:12px 0 6px 0;">1.1. Tugas Pokok dan Fungsi</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:8px;">
                    Berdasarkan Peraturan Menteri Perindustrian Republik Indonesia Nomor 29 Tahun 2022 tentang Organisasi dan Tata Kerja Politeknik Industri Petrokimia Banten, Politeknik Industri Petrokimia Banten mempunyai tugas menyelenggarakan pendidikan vokasi di bidang Teknologi Industri Petrokimia dan dalam melaksanakan tugas tersebut menyelenggarakan fungsi:
                </p>
                <ol style="padding-left:28px; margin:0 0 12px 0; text-align:justify;">
                    <li>Penyusunan rencana dan program pendidikan vokasi di bidang Teknologi Industri Petrokimia;</li>
                    <li>Pelaksanaan dan pengembangan pendidikan vokasi di bidang Teknologi Industri Petrokimia;</li>
                    <li>Pelaksanaan penelitian dan pengabdian masyarakat;</li>
                    <li>Pelaksanaan pembinaan sivitas akademika dan hubungan alumni;</li>
                    <li>Pelaksanaan uji kompetensi dan sertifikasi;</li>
                    <li>Pengelolaan unit inovasi teknologi dan diversifikasi produk;</li>
                    <li>Pengelolaan pabrik dalam sekolah (<em>teaching factory</em>);</li>
                    <li>Pelaksanaan kerja sama dalam rangka pengembangan pendidikan, pemagangan, dan penempatan kerja;</li>
                    <li>Pengelolaan perpustakaan, laboratorium/workshop, serta sarana dan prasarana penunjang lainnya;</li>
                    <li>Pelaksanaan administrasi akademik, kemahasiswaan dan kerja sama;</li>
                    <li>Pengelolaan keuangan, administrasi umum, kerumahtanggaan dan kepegawaian;</li>
                    <li>Pelaksanaan pengembangan sistem penjaminan mutu pendidikan;</li>
                    <li>Pelaksanaan pengawasan internal;</li>
                    <li>Pelaksanaan evaluasi dan pelaporan; dan</li>
                    <li>Pelaksanaan fungsi lain yang diberikan oleh BPSDMI dan Kementerian Perindustrian.</li>
                </ol>

                <h4 style="font-weight:bold; margin:14px 0 6px 0;">1.2. Struktur Organisasi</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:8px;">
                    Dalam melaksanakan tugas pokok dan fungsi Politeknik Industri Petrokimia Banten sesuai dengan Peraturan Menteri Perindustrian Nomor 29 Tahun 2022, Politeknik Industri Petrokimia Banten dipimpin oleh Direktur yang dibantu oleh 3 (tiga) orang Pembantu Direktur serta unsur organisasi lainnya sebagai berikut:
                </p>
                <ul style="padding-left:26px; margin:0 0 10px 0; text-align:justify; font-size:9.5pt;">
                    <li><strong>Pembantu Direktur I:</strong> membantu Direktur dalam memimpin pelaksanaan pendidikan, penelitian, dan pengabdian masyarakat serta penjaminan mutu.</li>
                    <li><strong>Pembantu Direktur II:</strong> membantu Direktur dalam memimpin pelaksanaan kegiatan di bidang keuangan, administrasi umum, kerumahtanggaan, kepegawaian, dan pengawasan internal.</li>
                    <li><strong>Pembantu Direktur III:</strong> membantu Direktur dalam memimpin pelaksanaan kegiatan di bidang kemahasiswaan, hubungan alumni, dan kerja sama.</li>
                    <li><strong>Senat:</strong> memberikan pertimbangan pelaksanaan kebijakan akademik.</li>
                    <li><strong>Dewan Penyantun:</strong> memberikan pertimbangan non-akademik.</li>
                    <li><strong>Satuan Penjaminan Mutu (SPM):</strong> melaksanakan dokumentasi, pemeliharaan, pengendalian, dan pengembangan sistem penjaminan mutu pendidikan.</li>
                    <li><strong>Satuan Pengawas Internal (SPI):</strong> melaksanakan pengawasan non-akademik dan reviu akuntabilitas kinerja internal.</li>
                    <li><strong>Subbagian Administrasi Akademik, Kemahasiswaan, dan Kerja Sama:</strong> melakukan urusan administrasi akademik, kemahasiswaan, hubungan alumni, perencanaan, sistem informasi, dan kerja sama.</li>
                    <li><strong>Subbagian Umum dan Keuangan:</strong> melaksanakan urusan ketatausahaan, kerumahtanggaan, barang milik negara, ketatalaksanaan, hubungan masyarakat, kepegawaian, dan keuangan.</li>
                    <li><strong>Program Studi:</strong> melaksanakan pendidikan vokasi tertentu di bidang teknologi industri petrokimia (Teknologi Proses Industri Petrokimia, Teknologi Mesin Industri Petrokimia, dan Teknologi Instrumentasi Industri Petrokimia).</li>
                    <li><strong>Unit Penelitian dan Pengabdian Masyarakat (UPPM):</strong> mengorganisasikan kegiatan Tridharma Perguruan Tinggi di bidang penelitian dan pengabdian kepada masyarakat.</li>
                    <li><strong>Unit Inovasi Teknologi dan Diversifikasi Produk (Inkubator Bisnis):</strong> menyelenggarakan inkubator bisnis untuk wirausaha industri kecil dan menengah.</li>
                    <li><strong>Unit Teaching Factory:</strong> melaksanakan kegiatan akademik di bidang pembelajaran yang langsung dilaksanakan pada kegiatan produksi.</li>
                    <li><strong>Unit Penunjang:</strong> melaksanakan kegiatan penunjang pendidikan tinggi vokasi (laboratorium, perpustakaan, layanan TIK, dan sertifikasi profesi).</li>
                    <li><strong>Kelompok Jabatan Fungsional:</strong> melaksanakan kegiatan fungsional pada bidang ilmu masing-masing sesuai dengan peraturan perundang-undangan.</li>
                </ul>
                ${buildStructureOrganizationSvg()}

                <h4 style="font-weight:bold; margin:14px 0 6px 0;">1.3. Peran Strategis Politeknik Industri Petrokimia Banten</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:12px;">
                    Sebagaimana diamanatkan pada Peraturan Menteri Perindustrian Nomor 29 Tahun 2022 tentang Organisasi dan Tata Kerja Politeknik Industri Petrokimia Banten, Politeknik Industri Petrokimia Banten berperan dalam menciptakan sumber daya manusia siap kerja yang handal dan kompeten pada klaster industri kimia dan petrokimia di Banten dan nasional. Peran ini menegaskan bahwa Politeknik Industri Petrokimia Banten merupakan unit pendukung tugas fungsi Kementerian Perindustrian sebagai salah satu pemangku kepentingan pengembangan SDM industri di Indonesia sekaligus berada pada posisi <em>entry point</em> proses pengembangan dan peningkatan kualitas sumber daya manusia di bidang industri.
                </p>

                <h4 style="font-weight:bold; margin:14px 0 6px 0;">1.4. Rencana Strategis Politeknik Industri Petrokimia Banten</h4>
                <h5 style="font-weight:bold; margin:8px 0 4px 0;">1.4.1. Visi Politeknik Industri Petrokimia Banten</h5>
                <p style="text-align:justify; text-indent:28px; margin-bottom:8px;">
                    Visi Politeknik Industri Petrokimia Banten adalah: <strong>"Menjadi penyelenggara pendidikan vokasi industri yang excellence dan berdaya saing global di bidang industri Petrokimia tahun 2030"</strong>. Visi ini merupakan refleksi dari komitmen Politeknik Industri Petrokimia Banten untuk memberikan layanan pendidikan tinggi vokasi terbaik yang adaptif terhadap perkembangan teknologi industri nasional, regional, dan internasional.
                </p>

                <h5 style="font-weight:bold; margin:10px 0 4px 0;">1.4.2. Misi Politeknik Industri Petrokimia Banten</h5>
                <ol style="padding-left:28px; margin:0 0 10px 0; text-align:justify;">
                    <li>Menyelenggarakan pendidikan tinggi vokasi industri sistem ganda (<em>dual system</em>) dengan pembelajaran <em>Science, Technology, Engineering, and Mathematics</em> (STEM) berstandar global;</li>
                    <li>Melaksanakan penelitian terapan untuk pemecahan permasalahan di sektor industri prioritas;</li>
                    <li>Melaksanakan pengabdian masyarakat dalam pengembangan ekosistem industri kecil dan menengah;</li>
                    <li>Mengembangkan kompetensi transformasi digital "Industri 4.0" melalui pembangunan <em>Digital Capability Center</em> (DCC) sebagai satelit Pusat Industri Digital Indonesia (PIDI 4.0);</li>
                    <li>Membangun dan mengembangkan kelembagaan inkubator bisnis industri yang terintegrasi dengan pemangku kepentingan terkait;</li>
                    <li>Mengembangkan skema kompetensi dan uji kompetensi di Politeknik Industri Petrokimia Banten; dan</li>
                    <li>Mengembangkan kelas industri untuk memenuhi kebutuhan tenaga kerja industri (<em>tailor made</em>).</li>
                </ol>

                <h5 style="font-weight:bold; margin:10px 0 4px 0;">1.4.3. Tujuan Politeknik Industri Petrokimia Banten</h5>
                <p style="text-align:justify; text-indent:28px; margin-bottom:6px;">
                    Dalam mewujudkan visi dan melaksanakan misinya, Politeknik Industri Petrokimia Banten menetapkan tujuan sebagai penyedia sumber daya manusia industri yang kompeten untuk mengisi celah manajemen tingkat menengah di industri petrokimia melalui upaya:
                </p>
                <ul style="padding-left:28px; margin:0 0 10px 0; text-align:justify;">
                    <li>Menghasilkan lulusan diploma yang kompeten sesuai kebutuhan industri dengan menerapkan pembelajaran <em>Science, Technology, Engineering, and Mathematics</em> (STEM) berstandar global dan pendidikan sistem ganda;</li>
                    <li>Mendidik dan melatih mahasiswa untuk siap menempati posisi penyelia/kepala seksi di industri petrokimia; dan</li>
                    <li>Memperkuat kerja sama sektor privat di seluruh tingkatan serta melibatkan industri secara aktif ke dalam kegiatan pendidikan dan pelatihan.</li>
                </ul>

                <h5 style="font-weight:bold; margin:10px 0 4px 0;">1.4.4. Sasaran Politeknik Industri Petrokimia Banten (Target Bertahap Tahun 2025–2029)</h5>
                ${indicators.length === 0
                    ? `<p style="font-size:9.5pt; font-style:italic; color:#64748b; border:1px solid #cbd5e1; padding:10px;">Data Sasaran Politeknik Industri Petrokimia Banten belum tersedia di database Ki-Jaro.</p>`
                    : Object.entries(tier3Groups).map(([sasaranTier3, grpItems], gIdx) => `
                        <div style="margin-top:10px;">
                            <p style="font-weight:bold; font-size:9.5pt; color:#1e3a8a; margin:0 0 4px 0;">Tabel 1.${gIdx + 1} Sasaran Kinerja (Tier 3): ${esc(sasaranTier3)}</p>
                            <table class="lakip-zebra" style="${tblStyle}">
                                <thead>
                                    <tr>
                                        <th style="${thStyle} width:56px;">Kode</th>
                                        <th style="${thStyle}">Indikator Kinerja (Tier 4)</th>
                                        <th style="${thStyle} width:75px;">Satuan</th>
                                        ${RENSTRA_YEARS.map(y => `<th style="${thStyle} width:64px;">${y}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${grpItems.map(it => `
                                        <tr>
                                            <td style="${tdCenter} font-weight:bold;">${esc(it.kodeSk)}</td>
                                            <td style="${tdLeft}">${esc(it.indikator)}</td>
                                            <td style="${tdCenter}">${esc(it.satuan)}</td>
                                            ${RENSTRA_YEARS.map(y => `<td style="${tdCenter} ${y === yr ? 'font-weight:bold; background-color:#eff6ff;' : ''}">${fmtNum((it.targetsByYear && it.targetsByYear[y]) ?? 0)}</td>`).join('')}
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}

                <h5 style="font-weight:bold; margin:12px 0 4px 0;">1.4.5. Arah Kebijakan dan Strategi</h5>
                <p style="text-align:justify; text-indent:28px; margin-bottom:6px;">
                    Kebijakan strategis Politeknik Industri Petrokimia Banten periode 5 (lima) tahun (2025–2029) mengacu pada kebijakan strategis Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian yang mengamanatkan Politeknik Industri Petrokimia Banten sebagai lembaga pendidikan vokasi dengan spesialisasi pada bidang petrokimia, melalui 6 (enam) arah kebijakan strategis:
                </p>
                <ol style="padding-left:28px; margin:0 0 10px 0; text-align:justify;">
                    <li>Meningkatnya Daya Saing dan Kemandirian SDM Industri Pengolahan Nonmigas;</li>
                    <li>Penguatan Implementasi <em>Making Indonesia 4.0</em>;</li>
                    <li>Terselenggaranya Urusan Pemerintahan di Bidang Perindustrian yang Berdaya Saing dan Berkelanjutan;</li>
                    <li>Meningkatnya Pemanfaatan Industri Barang dan Jasa dalam Negeri;</li>
                    <li>Terwujudnya ASN Kementerian Perindustrian yang Profesional dan Berkepribadian; dan</li>
                    <li>Tercapainya Pengawasan Internal yang Efektif dan Efisien.</li>
                </ol>
            </div>

            <!-- BAB II PERENCANAAN DAN PERJANJIAN KERJA -->
            <div class="lakip-page" style="page-break-after:always;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 14px 0;">BAB II.<br>PERENCANAAN DAN PERJANJIAN KERJA</h3>
                <h4 style="font-weight:bold; margin:10px 0 6px 0;">2.1. Perencanaan Kinerja Tahun ${esc(yr)} dan Proyeksi Target Renstra 2025–2029</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:8px;">
                    Rencana kinerja Politeknik Industri Petrokimia Banten pada Tahun ${esc(yr)} mengacu pada tujuan dan sasaran strategis yang telah ditetapkan dalam Rencana Strategis Tahun 2025–2029 serta dituangkan dalam dokumen Perjanjian Kinerja Tahun ${esc(yr)} sebagaimana disajikan pada tabel berikut.
                </p>
                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:54px;">Kode</th>
                            <th style="${thStyle}">Sasaran Program / Kegiatan (Tier 3)</th>
                            <th style="${thStyle}">Indikator Kinerja (Tier 4)</th>
                            <th style="${thStyle} width:68px;">Satuan</th>
                            ${RENSTRA_YEARS.map(y => `<th style="${thStyle} width:56px;">${y}</th>`).join('')}
                            <th style="${thStyle} width:115px;">Alokasi Pagu ${esc(yr)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.length === 0
                            ? `<tr><td colspan="10" style="${tdCenter} font-style:italic; color:#64748b;">Belum ada data Perjanjian Kinerja pada database.</td></tr>`
                            : indicators.map(it => `
                            <tr>
                                <td style="${tdCenter} font-weight:bold;">${esc(it.kodeSk)}</td>
                                <td style="${tdLeft}">${esc(it.sasaran)}</td>
                                <td style="${tdLeft} font-weight:bold;">${esc(it.indikator)}</td>
                                <td style="${tdCenter}">${esc(it.satuan)}</td>
                                ${RENSTRA_YEARS.map(y => `<td style="${tdCenter} ${y === yr ? 'font-weight:bold; background-color:#eff6ff;' : ''}">${fmtNum((it.targetsByYear && it.targetsByYear[y]) ?? 0)}</td>`).join('')}
                                <td style="${tdRight} font-weight:bold;">${fmtRp(it.paguAnggaran)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h4 style="font-weight:bold; margin:14px 0 6px 0;">2.2. Rencana Anggaran Tahun ${esc(yr)}</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:8px;">
                    Untuk pelaksanaan dan mewujudkan seluruh Sasaran Kinerja Tahun ${esc(yr)}, Politeknik Industri Petrokimia Banten mendapat dukungan anggaran dari DIPA sebesar <strong>${fmtRp(totalPaguProgram)}</strong> dengan total blokir anggaran sebesar <strong>${fmtRp(totalBlokirProgram)}</strong>.
                </p>
                ${hasProgramBreakdown ? `
                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:75px;">Kode</th>
                            <th style="${thStyle}">Program</th>
                            <th style="${thStyle} width:150px;">Anggaran (Pagu)</th>
                            <th style="${thStyle} width:140px;">Blokir</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="${tdCenter} font-weight:bold;">WA</td>
                            <td style="${tdLeft}">Program Dukungan Manajemen</td>
                            <td style="${tdRight}">${fmtRp(paguWA)}</td>
                            <td style="${tdRight}">${fmtRp(blokirWA)}</td>
                        </tr>
                        <tr>
                            <td style="${tdCenter} font-weight:bold;">DL</td>
                            <td style="${tdLeft}">Program Pendidikan dan Pelatihan Industri</td>
                            <td style="${tdRight}">${fmtRp(paguDL)}</td>
                            <td style="${tdRight}">${fmtRp(blokirDL)}</td>
                        </tr>
                        <tr style="background-color:#e2e8f0; font-weight:bold;">
                            <td colspan="2" style="${tdRight}">TOTAL ANGGARAN DIPA TAHUN ${esc(yr)}</td>
                            <td style="${tdRight}">${fmtRp(totalPaguProgram)}</td>
                            <td style="${tdRight}">${fmtRp(totalBlokirProgram)}</td>
                        </tr>
                    </tbody>
                </table>
                ` : ''}
            </div>

            <!-- BAB III AKUNTABILITAS KINERJA -->
            <div class="lakip-page" style="page-break-after:always;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 14px 0;">BAB III.<br>AKUNTABILITAS KINERJA</h3>
                <p style="text-align:justify; text-indent:28px; margin-bottom:10px;">
                    Akuntabilitas kinerja bertujuan untuk mengetahui tingkat realisasi kegiatan yang telah dilaksanakan serta seberapa besar manfaat yang diperoleh Politeknik Industri Petrokimia Banten dalam menjalankan tugas pokok dan fungsinya pada Tahun Anggaran ${esc(yr)}.
                </p>

                <h4 style="font-weight:bold; margin:10px 0 8px 0;">3.1. Analisis Capaian Kinerja Organisasi, Komparasi BPSDMI, serta Efektivitas &amp; Efisiensi per Indikator</h4>
                ${indicators.length === 0
                    ? `<p style="font-size:9.5pt; font-style:italic; color:#64748b;">Data capaian indikator Tahun ${esc(yr)} belum tersedia di database Ki-Jaro.</p>`
                    : indicators.map((ind, i) => {
                        const m = computeIndicatorMetrics(ind);
                        const tMap = ind.targetsByYear || {};
                        const narasi = ind.aiNarrative || buildDeterministicQualitativeAnalysis(ind, yr);
                        const paras = narasi.split(/\n+/).filter(Boolean).map(p => `<p style="text-align:justify; text-indent:28px; margin-bottom:8px;">${p}</p>`).join('');
                        return `
                        <div style="margin-top:16px; padding-top:12px; border-top:2px solid #1e3a8a;">
                            <h5 style="font-weight:bold; font-size:10.5pt; color:#1e3a8a; margin:0 0 2px 0;">3.1.${i + 1}. ${esc(ind.kodeSk)} — ${esc(ind.indikator)}</h5>
                            <p style="font-size:9pt; color:#475569; margin:0 0 8px 0;"><strong>Sasaran Kinerja (Tier 3):</strong> ${esc(ind.sasaran)}</p>

                            <table class="lakip-zebra" style="${tblStyle}">
                                <thead>
                                    <tr>
                                        <th style="${thStyle}">Target ${esc(yr)}</th>
                                        <th style="${thStyle}">Realisasi ${esc(yr)}</th>
                                        <th style="${thStyle}">Gap Target</th>
                                        <th style="${thStyle}">% Capaian</th>
                                        <th style="${thStyle}">Real. ${Number(yr) - 1}</th>
                                        <th style="${thStyle}">Target BPSDMI</th>
                                        <th style="${thStyle}">Kontribusi BPSDMI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="${tdCenter} font-weight:bold;">${fmtNum(ind.target)} ${esc(ind.satuan)}</td>
                                        <td style="${tdCenter} font-weight:bold; color:#065f46;">${fmtNum(ind.realisasi)} ${esc(ind.satuan)}</td>
                                        <td style="${tdCenter}">${m.gapTarget >= 0 ? '+' : ''}${fmtNum(m.gapTarget)}</td>
                                        <td style="${tdCenter} font-weight:bold;">${fmtNum(m.pctCapaian)}%</td>
                                        <td style="${tdCenter}">${fmtNum(ind.realisasiPrevYear)} ${esc(ind.satuan)}</td>
                                        <td style="${tdCenter}">${fmtNum(ind.targetNasionalBpsdmi)} ${esc(ind.satuan)}</td>
                                        <td style="${tdCenter} font-weight:bold;">${fmtNum(m.kontribusiBpsdmi)}%</td>
                                    </tr>
                                </tbody>
                            </table>

                            <table style="${tblStyle}">
                                <thead>
                                    <tr>
                                        <th style="${thStyle} width:180px;">Target Bertahap Renstra</th>
                                        ${RENSTRA_YEARS.map(y => `<th style="${thStyle}">Tahun ${y}</th>`).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="${tdLeft} font-weight:bold;">Target (${esc(ind.satuan)})</td>
                                        ${RENSTRA_YEARS.map(y => `<td style="${tdCenter} ${y === yr ? 'font-weight:bold; background-color:#eff6ff;' : ''}">${fmtNum(tMap[y] ?? 0)}</td>`).join('')}
                                    </tr>
                                </tbody>
                            </table>

                            ${buildIndicatorComparisonChartSvg(ind, yr)}

                            ${m.validSatkers.length > 1 ? `
                            <p style="font-size:9pt; font-weight:bold; color:#1e3a8a; margin:8px 0 4px 0;">Perbandingan Realisasi Kinerja ${esc(ind.kodeSk)} Antar Satker Pendidikan Vokasi BPSDMI Tahun ${esc(yr)}:</p>
                            <table class="lakip-zebra" style="${tblStyle}">
                                <thead>
                                    <tr>
                                        <th style="${thStyle} width:45px;">No</th>
                                        <th style="${thStyle}">Politeknik / Akademi Komunitas</th>
                                        <th style="${thStyle} width:85px;">Target</th>
                                        <th style="${thStyle} width:85px;">Realisasi</th>
                                        <th style="${thStyle} width:95px;">% Realisasi</th>
                                        <th style="${thStyle} width:75px;">Urutan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${m.validSatkers.map((st, sIdx) => {
                                        const isPipb = st.satker === 'Politeknik Industri Petrokimia Banten';
                                        const hl = isPipb ? 'background-color:#dbeafe; font-weight:bold;' : '';
                                        return `
                                        <tr style="${hl}">
                                            <td style="${tdCenter}">${sIdx + 1}</td>
                                            <td style="${tdLeft}">${esc(st.satker)}</td>
                                            <td style="${tdCenter}">${fmtNum(st.target)}</td>
                                            <td style="${tdCenter}">${fmtNum(st.nilai)}</td>
                                            <td style="${tdCenter}">${fmtNum(st.pct)}%</td>
                                            <td style="${tdCenter}">${sIdx + 1}</td>
                                        </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                            ` : ''}

                            <table style="${tblStyle}">
                                <thead>
                                    <tr>
                                        <th style="${thStyle}">Alokasi Pagu ${esc(yr)}</th>
                                        <th style="${thStyle}">Realisasi Anggaran</th>
                                        <th style="${thStyle}">% Realisasi Anggaran</th>
                                        <th style="${thStyle}">% Realisasi Output</th>
                                        <th style="${thStyle}">% Gap</th>
                                        <th style="${thStyle}">Efektivitas</th>
                                        <th style="${thStyle}">Efisiensi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="${tdRight}">${fmtRp(m.pagu)}</td>
                                        <td style="${tdRight} font-weight:bold;">${fmtRp(m.serapan)}</td>
                                        <td style="${tdCenter}">${fmtNum(m.pctSerapan)}%</td>
                                        <td style="${tdCenter} font-weight:bold;">${fmtNum(m.pctCapaian)}%</td>
                                        <td style="${tdCenter}">${m.selisihEfisiensi >= 0 ? '+' : ''}${fmtNum(m.selisihEfisiensi)}%</td>
                                        <td style="${tdCenter} font-weight:bold; color:${m.isEfektif ? '#065f46' : '#991b1b'};">${m.isEfektif ? 'EFEKTIF' : 'TIDAK EFEKTIF'}</td>
                                        <td style="${tdCenter} font-weight:bold; color:${m.isEfisien ? '#065f46' : '#991b1b'};">${m.isEfisien ? 'EFISIEN' : 'TIDAK EFISIEN'}</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style="margin-top:8px;">${paras}</div>
                        </div>
                        `;
                    }).join('')}

                <h4 style="font-weight:bold; margin:18px 0 6px 0;">3.2. Realisasi Anggaran Tahun ${esc(yr)}</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:8px;">
                    Dalam mendukung pelaksanaan program dan kegiatan pada Tahun ${esc(yr)}, Politeknik Industri Petrokimia Banten mengelola alokasi anggaran DIPA sebesar <strong>${fmtRp(totalPaguProgram)}</strong> dengan realisasi anggaran sebesar <strong>${fmtRp(totalRealProgram)}</strong> (${fmtNum(pctDipa)}%) dan blokir anggaran sebesar <strong>${fmtRp(totalBlokirProgram)}</strong>.
                </p>
                ${hasProgramBreakdown ? `
                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:65px;">Kode</th>
                            <th style="${thStyle}">Program</th>
                            <th style="${thStyle} width:130px;">Anggaran</th>
                            <th style="${thStyle} width:120px;">Blokir</th>
                            <th style="${thStyle} width:130px;">Realisasi</th>
                            <th style="${thStyle} width:115px;">Sisa</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="${tdCenter} font-weight:bold;">DL</td>
                            <td style="${tdLeft}">Program Pendidikan dan Pelatihan Industri</td>
                            <td style="${tdRight}">${fmtRp(paguDL)}</td>
                            <td style="${tdRight}">${fmtRp(blokirDL)}</td>
                            <td style="${tdRight}">${fmtRp(realDL)}</td>
                            <td style="${tdRight}">${fmtRp(sisaDL)}</td>
                        </tr>
                        <tr>
                            <td style="${tdCenter} font-weight:bold;">WA</td>
                            <td style="${tdLeft}">Program Dukungan Manajemen</td>
                            <td style="${tdRight}">${fmtRp(paguWA)}</td>
                            <td style="${tdRight}">${fmtRp(blokirWA)}</td>
                            <td style="${tdRight}">${fmtRp(realWA)}</td>
                            <td style="${tdRight}">${fmtRp(sisaWA)}</td>
                        </tr>
                        <tr style="background-color:#e2e8f0; font-weight:bold;">
                            <td colspan="2" style="${tdRight}">TOTAL</td>
                            <td style="${tdRight}">${fmtRp(totalPaguProgram)}</td>
                            <td style="${tdRight}">${fmtRp(totalBlokirProgram)}</td>
                            <td style="${tdRight}">${fmtRp(totalRealProgram)}</td>
                            <td style="${tdRight}">${fmtRp(totalSisaProgram)}</td>
                        </tr>
                    </tbody>
                </table>
                ` : ''}

                <p style="font-size:9.5pt; font-weight:bold; margin:10px 0 4px 0;">Tabel Rekapitulasi Realisasi Anggaran per Indikator Kinerja Utama Tahun ${esc(yr)}:</p>
                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:42px;">No</th>
                            <th style="${thStyle}">Kode &amp; Indikator Kinerja Utama</th>
                            <th style="${thStyle} width:125px;">Alokasi Pagu</th>
                            <th style="${thStyle} width:125px;">Realisasi Anggaran</th>
                            <th style="${thStyle} width:125px;">Sisa Anggaran</th>
                            <th style="${thStyle} width:85px;">% Realisasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.map((ind, idx) => {
                            const m = computeIndicatorMetrics(ind);
                            return `
                            <tr>
                                <td style="${tdCenter}">${idx + 1}</td>
                                <td style="${tdLeft}"><strong>${esc(ind.kodeSk)}</strong> — ${esc(ind.indikator)}</td>
                                <td style="${tdRight}">${fmtRp(m.pagu)}</td>
                                <td style="${tdRight}">${fmtRp(m.serapan)}</td>
                                <td style="${tdRight}">${fmtRp(m.sisaAnggaran)}</td>
                                <td style="${tdCenter} font-weight:bold;">${fmtNum(m.pctSerapan)}%</td>
                            </tr>
                            `;
                        }).join('')}
                        <tr style="background-color:#e2e8f0; font-weight:bold;">
                            <td colspan="2" style="${tdRight}">TOTAL DIPA &amp; REALISASI ANGGARAN TAHUN ${esc(yr)}</td>
                            <td style="${tdRight}">${fmtRp(cfg.paguDipaTotal)}</td>
                            <td style="${tdRight}">${fmtRp(cfg.realisasiAnggaranTotal)}</td>
                            <td style="${tdRight}">${fmtRp(Math.max(0, cfg.paguDipaTotal - cfg.realisasiAnggaranTotal))}</td>
                            <td style="${tdCenter}">${fmtNum(pctDipa)}%</td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="font-weight:bold; margin:18px 0 6px 0;">3.3. Efektivitas dan Efisiensi Kinerja dan Anggaran</h4>
                ${bab33Html}
                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:40px;">No</th>
                            <th style="${thStyle}">Indikator Kinerja</th>
                            <th style="${thStyle} width:85px;">% Realisasi Kinerja</th>
                            <th style="${thStyle} width:115px;">Efektivitas</th>
                            <th style="${thStyle} width:85px;">% Realisasi Anggaran</th>
                            <th style="${thStyle} width:115px;">Efisiensi</th>
                            <th style="${thStyle} width:120px;">Kesimpulan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.map((ind, idx) => {
                            const m = computeIndicatorMetrics(ind);
                            const canMeasure = Number(ind.target) > 0 || Number(ind.realisasi) > 0;
                            const efkLabel = !canMeasure ? 'Tidak bisa diukur' : (m.isEfektif ? 'Capaian Kinerja/Output ≥ 100% (Efektif)' : 'Capaian Kinerja/Output < 100% (Tidak Efektif)');
                            const efsLabel = !canMeasure ? 'Tidak bisa diukur' : (m.pagu <= 0 ? 'Tidak bisa diukur' : (m.isEfisien ? `Capaian Output > Serapan Anggaran (${fmtNum(m.pctCapaian)}% > ${fmtNum(m.pctSerapan)}%) (Efisien)` : `Capaian Output < Serapan Anggaran (${fmtNum(m.pctCapaian)}% < ${fmtNum(m.pctSerapan)}%) (Tidak Efisien)`));
                            const kesimpulan = !canMeasure ? 'Tidak bisa diukur' : ((m.isEfektif && m.isEfisien) ? 'Efektif dan Efisien' : (!m.isEfektif && !m.isEfisien ? 'Tidak Efektif dan Tidak Efisien' : (m.isEfektif ? 'Efektif' : 'Efisien namun Belum Efektif')));
                            return `
                            <tr>
                                <td style="${tdCenter}">${idx + 1}</td>
                                <td style="${tdLeft}"><strong>${esc(ind.kodeSk)}</strong> — ${esc(ind.indikator)}</td>
                                <td style="${tdCenter} font-weight:bold;">${fmtNum(m.pctCapaian)}%</td>
                                <td style="${tdCenter} font-size:8.5pt;">${efkLabel}</td>
                                <td style="${tdCenter}">${fmtNum(m.pctSerapan)}%</td>
                                <td style="${tdCenter} font-size:8.5pt;">${efsLabel}</td>
                                <td style="${tdCenter} font-weight:bold; color:${(m.isEfektif && m.isEfisien) ? '#065f46' : '#991b1b'};">${kesimpulan}</td>
                            </tr>
                            `;
                        }).join('')}
                        <tr style="background-color:#e2e8f0; font-weight:bold;">
                            <td colspan="2" style="${tdRight}">RATA-RATA CAPAIAN KINERJA &amp; PENYERAPAN ANGGARAN</td>
                            <td style="${tdCenter}">${fmtNum(avgCapaian)}%</td>
                            <td style="${tdCenter}">-</td>
                            <td style="${tdCenter}">${fmtNum(avgSerapanIku)}%</td>
                            <td style="${tdCenter}">-</td>
                            <td style="${tdCenter}">${efektifCount}/${indicators.length} Efektif</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- BAB IV PENUTUP -->
            <div class="lakip-page" style="page-break-after:always;">
                <h3 style="text-align:center; font-size:12pt; font-weight:bold; text-transform:uppercase; margin:0 0 14px 0;">BAB IV.<br>PENUTUP</h3>

                <h4 style="font-weight:bold; margin:10px 0 6px 0;">A. Kesimpulan</h4>
                ${kesimpulanHtml}

                <h4 style="font-weight:bold; margin:14px 0 6px 0;">B. Permasalahan dan Kendala</h4>
                ${permasalahanHtml}

                <h4 style="font-weight:bold; margin:14px 0 6px 0;">C. Saran dan Rekomendasi</h4>
                <p style="text-align:justify; text-indent:28px; margin-bottom:6px;">
                    Langkah-langkah ke depan yang perlu dilakukan oleh Politeknik Industri Petrokimia Banten dalam upaya meningkatkan kinerja dan menghadapi tantangan tahun berikutnya adalah:
                </p>
                ${saranHtml}

                <div style="display:flex; justify-content:flex-end; margin-top:28px;">
                    <div style="text-align:center; width:260px;">
                        <p style="margin:0;">${esc(cfg.tanggalPengesahan)}</p>
                        <p style="font-weight:bold; margin:2px 0 0 0;">Direktur,</p>
                        <div style="height:64px;"></div>
                        <p style="font-weight:bold; text-decoration:underline; margin:0;">${esc(dir.name)}</p>
                        <p style="margin:2px 0 0 0;">NIP. ${esc(dir.nip)}</p>
                    </div>
                </div>
            </div>

            <!-- LEMBAR REVIEW & CHECKLIST REVIU SPI -->
            <div class="lakip-page">
                <div style="text-align:center; border-bottom:3px solid #1e3a8a; padding-bottom:8px; margin-bottom:12px;">
                    <p style="font-weight:bold; font-size:11pt; text-transform:uppercase; margin:0;">LEMBAR REVIEW</p>
                    <p style="font-weight:bold; font-size:10pt; text-transform:uppercase; margin:2px 0;">LAPORAN AKUNTABILITAS KINERJA INSTANSI PEMERINTAH TAHUN ${esc(yr)}</p>
                    <p style="font-weight:bold; font-size:10pt; text-transform:uppercase; margin:0;">SATUAN PENGAWAS INTERNAL — POLITEKNIK INDUSTRI PETROKIMIA BANTEN</p>
                </div>

                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:140px;">Proses</th>
                            <th style="${thStyle} width:180px;">Penanggung Jawab</th>
                            <th style="${thStyle}">Keterangan / Catatan</th>
                            <th style="${thStyle} width:115px;">Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="${tdLeft} font-weight:bold;">Pembuat (Tim Program)</td>
                            <td style="${tdLeft}">${esc(rev.pembuatName || '-')}</td>
                            <td style="${tdLeft}">Penyusunan Draf LAKIP Tahun ${esc(yr)}</td>
                            <td style="${tdCenter}">${esc(rev.pembuatDate || '-')}</td>
                        </tr>
                        <tr>
                            <td style="${tdLeft} font-weight:bold;">Reviewer (SPI)</td>
                            <td style="${tdLeft}">${esc(rev.reviewerName || '-')}</td>
                            <td style="${tdLeft}">${esc(rev.reviewerNotes || '-')}</td>
                            <td style="${tdCenter}">${esc(rev.reviewerDate || '-')}</td>
                        </tr>
                        <tr>
                            <td style="${tdLeft} font-weight:bold;">Pembantu Direktur II</td>
                            <td style="${tdLeft}">${esc(rev.wadir2Name || '-')}</td>
                            <td style="${tdLeft}">${esc(rev.wadir2Notes || '-')}</td>
                            <td style="${tdCenter}">${esc(rev.wadir2Date || '-')}</td>
                        </tr>
                        <tr>
                            <td style="${tdLeft} font-weight:bold;">Mengetahui / Pengesahan (Direktur)</td>
                            <td style="${tdLeft}">${esc(rev.direkturName || dir.name)}</td>
                            <td style="${tdLeft}">${esc(rev.direkturNotes || '-')}</td>
                            <td style="${tdCenter}">${esc(rev.direkturDate || '-')}</td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="font-weight:bold; font-size:10pt; text-transform:uppercase; margin:14px 0 6px 0;">CHECKLIST REVIU LAPORAN KINERJA (SPI)</h4>
                <table class="lakip-zebra" style="${tblStyle}">
                    <thead>
                        <tr>
                            <th style="${thStyle} width:165px;">Aspek</th>
                            <th style="${thStyle}">Pernyataan Indikator Penilaian</th>
                            <th style="${thStyle} width:85px;">Checklist</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${SPI_CHECKLIST_ITEMS.map(item => `
                            <tr>
                                <td style="${tdLeft} font-weight:bold;">${esc(item.group)}</td>
                                <td style="${tdLeft}">${esc(item.no)} ${esc(item.text)}</td>
                                <td style="${tdCenter} font-weight:bold;">${esc((rev.checklist && rev.checklist[item.id]) || 'V')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    window.generateAndPrintCompleteLakip = async function () {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (cfg.workflowStatus !== 'APPROVED') {
            if (typeof showToast === 'function') {
                showToast('Cetak/Download PDF LAKIP dikunci! Dokumen harus melalui Review SPI, Persetujuan Pembantu Direktur II, dan Pengesahan Direktur terlebih dahulu.', 'error');
            }
            return;
        }

        const sheetHtml = buildFullLakipDocumentHtml(cfg);
        const attachmentEntries = Object.entries(_lakipAttachments).filter(([, list]) => Array.isArray(list) && list.length > 0);

        const win = window.open('', '_blank', 'width=1024,height=800');
        win.document.write(`
            <html>
            <head>
                <title>LAKIP ${esc(cfg.tahun)} — Politeknik Industri Petrokimia Banten</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body, * { font-family: Arial, Helvetica, sans-serif !important; color: #0f172a; }
                </style>
            </head>
            <body style="padding:12px;">
                ${sheetHtml}
                ${attachmentEntries.length > 0 ? `
                <div style="page-break-before: always; padding:20px;">
                    <h2 style="text-align:center; font-size:13pt; font-weight:bold; text-transform:uppercase; text-decoration:underline; margin-bottom:16px;">LAMPIRAN BUKTI DUKUNG CAPAIAN KINERJA TAHUN ${esc(cfg.tahun)}</h2>
                    ${attachmentEntries.map(([indId, files]) => {
                        const indObj = cfg.indicators.find(x => x.id === indId);
                        return `
                        <div style="border:1px solid #94a3b8; padding:12px; margin-bottom:14px;">
                            <p style="font-weight:bold; font-size:10pt; margin:0 0 8px 0;">Lampiran Indikator: ${esc(indObj ? indObj.indikator : indId)}</p>
                            ${files.map(f => f.type.startsWith('image/')
                                ? `<div style="padding-top:6px;"><p style="font-size:9pt; font-weight:bold; margin:0 0 4px 0;">${esc(f.name)}</p><img src="${f.dataUrl}" style="max-height:210mm; display:block; margin:0 auto; border:1px solid #cbd5e1;"></div>`
                                : `<p style="font-size:9pt; color:#1e3a8a;">&bull; Dokumen PDF Terlampir: ${esc(f.name)}</p>`
                            ).join('')}
                        </div>
                        `;
                    }).join('')}
                </div>
                ` : ''}
            </body>
            </html>
        `);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 800);
    };

    window.saveLakipField = async function (field, value) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        cfg[field] = value;
        await persistLakipSafely();
    };

    window.saveLakipIndicatorField = async function (idx, field, value) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.indicators[idx]) return;
        cfg.indicators[idx][field] = value;
        if (field === 'target') {
            if (!cfg.indicators[idx].targetsByYear) cfg.indicators[idx].targetsByYear = {};
            cfg.indicators[idx].targetsByYear[_lakipYear] = value;
        }
        if (field === 'paguAnggaran') {
            if (!cfg.indicators[idx].paguByYear) cfg.indicators[idx].paguByYear = {};
            cfg.indicators[idx].paguByYear[_lakipYear] = value;
        }
        await persistLakipSafely();
    };

    window.saveLakipYearTargetField = async function (idx, targetYr, value) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        const ind = cfg.indicators[idx];
        if (!ind) return;
        if (!ind.targetsByYear) ind.targetsByYear = {};
        ind.targetsByYear[targetYr] = value;
        if (String(targetYr) === String(_lakipYear)) ind.target = value;
        if (String(targetYr) === '2029') ind.targetRenstra2029 = value;
        await persistLakipSafely();
    };

    window.saveLakipSatkerValue = async function (indIdx, satkerIdx, fieldOrVal, maybeVal) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        const ind = cfg.indicators[indIdx];
        if (!ind || !ind.satkerBpsdmiData[satkerIdx]) return;
        if (maybeVal === undefined) {
            ind.satkerBpsdmiData[satkerIdx].nilai = fieldOrVal;
        } else {
            ind.satkerBpsdmiData[satkerIdx][fieldOrVal] = maybeVal;
        }
        await persistLakipSafely();
    };

    window.resyncLakipFromKiJaro = async function () {
        const fresh = extractIndicatorsFromDB(_lakipYear);
        const budget = extractBudgetSummaryFromDB(_lakipYear, fresh);
        const cfg = getOrInitLakipConfig(_lakipYear);
        cfg.indicators = fresh;
        if (budget.paguTotal > 0) cfg.paguDipaTotal = budget.paguTotal;
        if (budget.realisasiTotal > 0) cfg.realisasiAnggaranTotal = budget.realisasiTotal;
        _lakipSelectedIndIdx = 0;
        await persistLakipSafely();
        window.renderLakipWorkspace();
        if (typeof showToast === 'function') {
            if (fresh.length === 0) {
                showToast(`Belum ada data indikator/capaian TW 4 Tahun ${_lakipYear} di database Ki-Jaro.`, 'info');
            } else {
                showToast(`Berhasil menyinkronkan ${fresh.length} indikator (Tier 3 & Tier 4) beserta target 2025–2029 & pagu dari Ki-Jaro.`, 'success');
            }
        }
    };

    window.openLakipGeneratorWorkspace = function () {
        const rights = getLakipAccessRights();
        if (!rights.canViewPortal) return;
        const ws = document.getElementById(WORKSPACE_ID);
        if (!ws) return;
        ws.classList.remove('hidden');
        if (!rights.canDraft) _lakipActiveTab = 'review';
        window.renderLakipWorkspace();
        ws.scrollIntoView({ behavior: 'smooth' });
    };

    function getWorkflowBadgeHtml(status) {
        const map = {
            DRAFT: { bg: 'bg-amber-100 text-amber-900 border-amber-300', label: '1. MODE DRAF (Penyusun: Tim Program / Admin)' },
            PENDING_REVIEWER: { bg: 'bg-purple-100 text-purple-900 border-purple-300', label: '2. MENUNGGU REVIEW SPI (Role Reviewer)' },
            PENDING_WADIR2: { bg: 'bg-sky-100 text-sky-900 border-sky-300', label: '3. MENUNGGU PERSETUJUAN PEMBANTU DIREKTUR II' },
            PENDING_DIREKTUR: { bg: 'bg-indigo-100 text-indigo-900 border-indigo-300', label: '4. MENUNGGU PENGESAHAN DIREKTUR' },
            APPROVED: { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: '5. SAH / DISETUJUI DIREKTUR (Siap Cetak PDF)' }
        };
        const st = map[status] || map.DRAFT;
        return `<span class="px-3 py-1 rounded-full text-[11px] font-extrabold border ${st.bg}">${st.label}</span>`;
    }

    window.renderLakipWorkspace = function () {
        const ws = document.getElementById(WORKSPACE_ID);
        if (!ws) return;
        const rights = getLakipAccessRights();
        if (!rights.canViewPortal) {
            ws.classList.add('hidden');
            return;
        }

        const cfg = getOrInitLakipConfig(_lakipYear);
        const indicators = cfg.indicators || [];
        const selInd = indicators[_lakipSelectedIndIdx] || indicators[0] || null;
        const status = cfg.workflowStatus || 'DRAFT';
        const isEditableDraft = rights.canDraft && status === 'DRAFT';
        const rev = cfg.reviewData || {};

        ws.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 space-y-5 mt-4" style="font-family: Arial, Helvetica, sans-serif;">
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-4">
                    <div class="space-y-1.5">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold uppercase">LAKIP PIPB (Permenperin 150/2011)</span>
                            ${getWorkflowBadgeHtml(status)}
                        </div>
                        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-blue-700"></i> Penyusunan, Reviu SPI &amp; Pengesahan Laporan LAKIP
                        </h3>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <select onchange="changeLakipYear(this.value)" class="p-2 bg-slate-50 border rounded-xl font-bold">
                            ${RENSTRA_YEARS.map(y => `<option value="${y}" ${_lakipYear === y ? 'selected' : ''}>Tahun ${y}</option>`).join('')}
                        </select>

                        ${isEditableDraft ? `
                            <button type="button" onclick="resyncLakipFromKiJaro()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-arrows-rotate mr-1"></i>Tarik Ulang Data Ki-Jaro
                            </button>
                            <button type="button" id="btnLakipAiAll" onclick="runAiAnalyzeAllSections()" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow cursor-pointer">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Generate AI Semua Bab
                            </button>
                            <button type="button" onclick="submitLakipToReviewer()" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow cursor-pointer">
                                <i class="fa-solid fa-paper-plane mr-1"></i>Ajukan Review ke SPI
                            </button>
                        ` : ''}

                        ${status === 'APPROVED' ? `
                            <button type="button" onclick="generateAndPrintCompleteLakip()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow cursor-pointer">
                                <i class="fa-solid fa-file-pdf mr-1"></i>Cetak / Download PDF LAKIP Sah
                            </button>
                        ` : `
                            <button type="button" disabled title="Terkunci sampai disahkan Direktur" class="px-3.5 py-2 bg-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed">
                                <i class="fa-solid fa-lock mr-1"></i>Cetak PDF (Menunggu Pengesahan)
                            </button>
                        `}
                    </div>
                </div>

                ${Array.isArray(rev.revisionHistory) && rev.revisionHistory.length > 0 && status === 'DRAFT' ? `
                <div class="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs space-y-1.5">
                    <p class="font-bold text-rose-900 flex items-center gap-1.5">
                        <i class="fa-solid fa-rotate-left"></i> Dokumen Dikembalikan ke Mode Draf untuk Perbaikan:
                    </p>
                    <ul class="list-disc pl-5 text-rose-800 space-y-1">
                        ${rev.revisionHistory.slice(0, 3).map(h => `<li><strong>[${esc(h.date)}] ${esc(h.by)}:</strong> ${esc(h.note)}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <div class="flex flex-wrap gap-2 border-b pb-3 text-xs font-bold">
                    <button type="button" onclick="switchLakipTab('sync')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'sync' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">1. Data Umum, Anggaran DIPA &amp; Target 2025–2029</button>
                    <button type="button" onclick="switchLakipTab('bench')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'bench' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">2. Input Pembanding BPSDMI &amp; Anggaran IKU</button>
                    <button type="button" onclick="switchLakipTab('ai')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'ai' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">3. Editor Narasi Bab I–IV &amp; AI</button>
                    <button type="button" onclick="switchLakipTab('lampiran')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'lampiran' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">4. Lampiran &amp; Pratinjau Lengkap</button>
                    <button type="button" onclick="switchLakipTab('review')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'review' ? 'bg-purple-700 text-white' : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'}">5. Lembar Reviu SPI &amp; Pengesahan Berjenjang</button>
                </div>

                ${_lakipActiveTab === 'sync' ? `
                <div class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Nomor Nota Dinas</label>
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(cfg.nomorNotaDinas)}" placeholder="Contoh: 312/BPSDMI/PIPB/KU/I/2026" onchange="saveLakipField('nomorNotaDinas', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Tanggal Nota Dinas</label>
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(cfg.tanggalNotaDinas || '')}" onchange="saveLakipField('tanggalNotaDinas', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Tanggal Pengesahan (Kata Pengantar &amp; Bab IV)</label>
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(cfg.tanggalPengesahan)}" onchange="saveLakipField('tanggalPengesahan', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Blokir Anggaran (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.blokirAnggaran || 0}" onchange="saveLakipField('blokirAnggaran', Number(this.value))" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Pagu DIPA (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.paguDipaTotal || 0}" onchange="saveLakipField('paguDipaTotal', Number(this.value))" class="w-full p-2 bg-white border rounded-lg font-bold">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Realisasi Anggaran DIPA (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.realisasiAnggaranTotal || 0}" onchange="saveLakipField('realisasiAnggaranTotal', Number(this.value))" class="w-full p-2 bg-white border rounded-lg font-bold">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Pagu Program Pendidikan (DL) (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.paguProgramDL || 0}" onchange="saveLakipField('paguProgramDL', Number(this.value))" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Pagu Program Dukungan Manajemen (WA) (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.paguProgramWA || 0}" onchange="saveLakipField('paguProgramWA', Number(this.value))" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                    </div>

                    <div class="overflow-x-auto border rounded-xl">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-blue-900 text-white font-bold border-b">
                                <tr>
                                    <th class="p-2.5 w-16 text-center">Kode</th>
                                    <th class="p-2.5">Sasaran Program/Kegiatan (Tier 3) &amp; Indikator (Tier 4)</th>
                                    <th class="p-2.5 w-20 text-center">Real. ${Number(_lakipYear) - 1}</th>
                                    <th class="p-2.5 w-20 text-center">Real. ${_lakipYear}</th>
                                    ${RENSTRA_YEARS.map(y => `<th class="p-2.5 w-20 text-center">T-${y}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${indicators.length === 0 ? `
                                    <tr>
                                        <td colspan="9" class="p-6 text-center text-slate-500">
                                            <p class="font-bold text-slate-700 mb-1">Belum ada data indikator / capaian Triwulan 4 Tahun ${esc(_lakipYear)} di database Ki-Jaro saat ini.</p>
                                            <p class="text-[11px]">Setelah data Perencanaan (Tier 3 &amp; Tier 4) dan Capaian Triwulan 4 tersedia, klik tombol <strong>Tarik Ulang Data Ki-Jaro</strong> di atas.</p>
                                        </td>
                                    </tr>
                                ` : indicators.map((it, idx) => `
                                    <tr class="hover:bg-slate-50">
                                        <td class="p-2 font-bold text-center text-blue-900">${esc(it.kodeSk)}</td>
                                        <td class="p-2">
                                            <div class="text-[10px] text-slate-500 mb-0.5">${esc(it.sasaran)}</div>
                                            <div class="font-bold text-slate-900">${esc(it.indikator)} <span class="text-[10px] font-normal text-slate-500">(${esc(it.satuan)})</span></div>
                                        </td>
                                        <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${it.realisasiPrevYear}" onchange="saveLakipIndicatorField(${idx}, 'realisasiPrevYear', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
                                        <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${it.realisasi}" onchange="saveLakipIndicatorField(${idx}, 'realisasi', parseFloat(this.value))" class="w-full p-1 border rounded text-center font-bold text-emerald-700"></td>
                                        ${RENSTRA_YEARS.map(y => `
                                            <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${(it.targetsByYear && it.targetsByYear[y]) ?? 0}" onchange="saveLakipYearTargetField(${idx}, '${y}', parseFloat(this.value))" class="w-full p-1 border rounded text-center ${y === _lakipYear ? 'bg-blue-50 font-bold' : ''}"></td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                ${_lakipActiveTab === 'bench' ? `
                <div class="space-y-4 text-xs">
                    ${!selInd ? `
                        <div class="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-900">
                            <strong>Belum ada indikator dari Ki-Jaro Tahun ${esc(_lakipYear)}.</strong> Silakan sinkronkan data dari Ki-Jaro terlebih dahulu pada Tab 1.
                        </div>
                    ` : `
                    <div class="flex flex-wrap items-center gap-3 bg-blue-50 p-3.5 rounded-xl border border-blue-200">
                        <label class="font-bold text-blue-950">Pilih Indikator Kinerja:</label>
                        <select onchange="selectLakipIndicator(this.value)" class="p-2 bg-white border rounded-lg font-bold flex-1">
                            ${indicators.map((it, i) => `<option value="${i}" ${_lakipSelectedIndIdx === i ? 'selected' : ''}>${esc(it.kodeSk)} — ${esc(it.indikator)}</option>`).join('')}
                        </select>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Target Nasional BPSDMI (${esc(selInd.satuan)})</label>
                            <input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${selInd.targetNasionalBpsdmi}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'targetNasionalBpsdmi', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg font-bold">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Pembanding Poltek Luar Kemenperin (Opsional)</label>
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(selInd.pembandingLuar || '')}" placeholder="Contoh: Politeknik KP Jembrana (84,5)" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'pembandingLuar', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Alokasi Pagu Anggaran IKU Ini (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${selInd.paguAnggaran}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'paguAnggaran', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Realisasi Anggaran IKU Ini (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${selInd.realisasiAnggaran}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'realisasiAnggaran', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                    </div>

                    <div class="border rounded-xl overflow-hidden">
                        <div class="bg-blue-900 text-white p-2.5 font-bold border-b flex justify-between">
                            <span>Input Target &amp; Nilai Capaian Satker Poltek / Akademi Komunitas di Bawah BPSDMI</span>
                            <span class="text-[11px] font-normal text-blue-100">Kolom Kiri: Target | Kolom Kanan: Realisasi</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                            ${(selInd.satkerBpsdmiData || []).map((s, sIdx) => `
                                <div class="flex items-center justify-between gap-2 p-2 border rounded-lg ${s.satker === 'Politeknik Industri Petrokimia Banten' ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white'}">
                                    <span class="truncate flex-1" title="${esc(s.satker)}">${esc(s.satker)}</span>
                                    <input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${esc(s.target ?? selInd.target)}" placeholder="Target" onchange="saveLakipSatkerValue(${_lakipSelectedIndIdx}, ${sIdx}, 'target', this.value)" class="w-20 p-1 border rounded text-center bg-slate-50" title="Target Satker">
                                    <input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${esc(s.nilai)}" placeholder="Real." onchange="saveLakipSatkerValue(${_lakipSelectedIndIdx}, ${sIdx}, 'nilai', this.value)" class="w-20 p-1 border rounded text-center" title="Realisasi Satker">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    `}
                </div>
                ` : ''}

                ${_lakipActiveTab === 'ai' ? `
                <div class="space-y-4 text-xs">
                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                            <p class="font-bold text-indigo-950">Mode AI Gratis (Google Gemini Free Tier + Smart Qualitative Fallback)</p>
                            <p class="text-[11px] text-indigo-800">Kosongkan API Key untuk menggunakan mesin analisis kualitatif bawaan (100% gratis tanpa batas), atau masukkan API Key gratis Google AI Studio.</p>
                        </div>
                        <input type="password" ${!isEditableDraft ? 'disabled' : ''} value="${esc(cfg.geminiApiKey || '')}" placeholder="Opsional: Gemini API Key Gratis..." onchange="saveLakipField('geminiApiKey', this.value)" class="p-2 bg-white border rounded-lg w-full md:w-64">
                    </div>

                    ${!selInd ? `
                        <div class="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center text-amber-900">
                            <strong>Belum ada indikator dari Ki-Jaro Tahun ${esc(_lakipYear)}.</strong> Silakan sinkronkan data dari Ki-Jaro terlebih dahulu pada Tab 1.
                        </div>
                    ` : `
                    <div class="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border">
                        <select onchange="selectLakipIndicator(this.value)" class="p-2 bg-white border rounded-lg font-bold flex-1">
                            ${indicators.map((it, i) => `<option value="${i}" ${_lakipSelectedIndIdx === i ? 'selected' : ''}>Bab 3.1.${i + 1}: ${esc(it.indikator)}</option>`).join('')}
                        </select>
                        ${isEditableDraft ? `
                        <button type="button" id="btnLakipAiSingle" onclick="runAiAnalyzeSingleIndicator(${_lakipSelectedIndIdx})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Generate Narasi Indikator Ini
                        </button>
                        ` : ''}
                    </div>

                    <div>
                        <label class="block font-bold text-slate-800 mb-1">Narasi Kualitatif Bab 3.1.${_lakipSelectedIndIdx + 1} (Capaian, YoY, Bertahap 2025–2029, BPSDMI, Kendala, Tindak Lanjut, Efektivitas &amp; Efisiensi)</label>
                        <textarea rows="8" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'aiNarrative', this.value)" class="w-full p-3 border rounded-xl leading-relaxed">${esc(selInd.aiNarrative || buildDeterministicQualitativeAnalysis(selInd, _lakipYear))}</textarea>
                    </div>
                    `}

                    <div>
                        <label class="block font-bold text-slate-800 mb-1">Narasi Ringkasan Eksekutif (Visi/Misi BPSDMI &amp; Capaian PIPB)</label>
                        <textarea rows="4" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipField('ringkasanEksekutifText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.ringkasanEksekutifText || '')}</textarea>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Bab IV — A. Kesimpulan</label>
                            <textarea rows="5" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipField('bab4KesimpulanText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.bab4KesimpulanText || '')}</textarea>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Bab IV — B. Permasalahan dan Kendala</label>
                            <textarea rows="5" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipField('bab4PermasalahanText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.bab4PermasalahanText || '')}</textarea>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Bab IV — C. Saran dan Rekomendasi</label>
                            <textarea rows="5" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipField('bab4SaranText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.bab4SaranText || '')}</textarea>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${_lakipActiveTab === 'lampiran' ? `
                <div class="space-y-4 text-xs">
                    ${isEditableDraft ? `
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                        <p class="font-bold text-emerald-950">Lampiran Bukti Dukung per Indikator (Digabung Otomatis di Akhir Laporan LAKIP)</p>
                        ${indicators.length === 0 ? `<p class="text-[11px] text-slate-500 italic">Belum ada indikator dari Ki-Jaro Tahun ${esc(_lakipYear)}.</p>` : indicators.map(ind => {
                            const files = _lakipAttachments[ind.id] || [];
                            return `
                            <div class="bg-white border rounded-xl p-3 space-y-2">
                                <div class="flex flex-wrap items-center justify-between gap-2">
                                    <span class="font-bold text-slate-800">${esc(ind.kodeSk)} — ${esc(ind.indikator)}</span>
                                    <label class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold cursor-pointer">
                                        <i class="fa-solid fa-paperclip mr-1"></i>Tambah Bukti Dukung (PDF/Gambar)
                                        <input type="file" multiple accept=".pdf,image/*" onchange="handleLakipFileUpload('${ind.id}', this)" class="hidden">
                                    </label>
                                </div>
                                ${files.length > 0 ? `
                                <div class="flex flex-wrap gap-2">
                                    ${files.map((f, fIdx) => `
                                        <span class="px-2.5 py-1 bg-slate-100 border rounded-lg flex items-center gap-2">
                                            <i class="fa-solid fa-file-lines text-blue-600"></i> ${esc(f.name)}
                                            <button type="button" onclick="removeLakipAttachment('${ind.id}', ${fIdx})" class="text-rose-600 font-bold cursor-pointer">&times;</button>
                                        </span>
                                    `).join('')}
                                </div>
                                ` : '<p class="text-[11px] text-slate-400 italic">Belum ada berkas bukti dukung ditambahkan untuk indikator ini.</p>'}
                            </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}

                    <div class="border rounded-2xl p-4 bg-slate-100 max-h-[650px] overflow-y-auto">
                        ${buildFullLakipDocumentHtml(cfg)}
                    </div>
                </div>
                ` : ''}

                ${_lakipActiveTab === 'review' ? `
                <div class="space-y-5 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div class="p-3 rounded-xl border ${status === 'DRAFT' ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'}">
                            <p class="font-extrabold text-[11px] uppercase text-slate-700">Tahap 1: Penyusun (Tim Program)</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rev.pembuatName || 'Belum diajukan')}</p>
                            <p class="text-[11px] text-slate-500">Tanggal: ${esc(rev.pembuatDate || '-')}</p>
                        </div>
                        <div class="p-3 rounded-xl border ${status === 'PENDING_REVIEWER' ? 'bg-purple-50 border-purple-400' : 'bg-slate-50 border-slate-200'}">
                            <p class="font-extrabold text-[11px] uppercase text-purple-900">Tahap 2: Reviewer (SPI)</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rev.reviewerName || 'Menunggu Reviu')}</p>
                            <p class="text-[11px] text-slate-500">Tanggal: ${esc(rev.reviewerDate || '-')}</p>
                        </div>
                        <div class="p-3 rounded-xl border ${status === 'PENDING_WADIR2' ? 'bg-sky-50 border-sky-400' : 'bg-slate-50 border-slate-200'}">
                            <p class="font-extrabold text-[11px] uppercase text-sky-900">Tahap 3: Pembantu Direktur II</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rev.wadir2Name || 'Menunggu Persetujuan')}</p>
                            <p class="text-[11px] text-slate-500">Tanggal: ${esc(rev.wadir2Date || '-')}</p>
                        </div>
                        <div class="p-3 rounded-xl border ${status === 'PENDING_DIREKTUR' || status === 'APPROVED' ? 'bg-emerald-50 border-emerald-400' : 'bg-slate-50 border-slate-200'}">
                            <p class="font-extrabold text-[11px] uppercase text-emerald-900">Tahap 4: Pengesahan Direktur</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rev.direkturName || 'Menunggu Pengesahan')}</p>
                            <p class="text-[11px] text-slate-500">Tanggal: ${esc(rev.direkturDate || '-')}</p>
                        </div>
                    </div>

                    ${status === 'PENDING_REVIEWER' && rights.isReviewer ? `
                    <div class="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 space-y-3">
                        <h4 class="font-bold text-purple-950 text-sm">Panel Keputusan Reviewer (Satuan Pengawas Internal)</h4>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Catatan Hasil Pemeriksaan / Reviu SPI</label>
                            <textarea id="lakipNoteReviewer" rows="3" oninput="saveLakipReviewNote('reviewerNotes', this.value)" placeholder="Tuliskan catatan pemeriksaan..." class="w-full p-2.5 bg-white border rounded-lg">${esc(rev.reviewerNotes || '')}</textarea>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="processLakipWorkflowDecision('REVIEWER', 'VALID')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-circle-check mr-1"></i>Valid (Teruskan ke Pembantu Direktur II)
                            </button>
                            <button type="button" onclick="processLakipWorkflowDecision('REVIEWER', 'REVISE')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-rotate-left mr-1"></i>Lakukan Perbaikan (Kembalikan ke Draf Penyusun)
                            </button>
                        </div>
                    </div>
                    ` : ''}

                    ${status === 'PENDING_WADIR2' && rights.isWadir2 ? `
                    <div class="bg-sky-50 border-2 border-sky-300 rounded-xl p-4 space-y-3">
                        <h4 class="font-bold text-sky-950 text-sm">Panel Persetujuan Pembantu Direktur II</h4>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Catatan / Arahan Pembantu Direktur II</label>
                            <textarea id="lakipNoteWadir2" rows="3" oninput="saveLakipReviewNote('wadir2Notes', this.value)" placeholder="Tuliskan catatan verifikasi..." class="w-full p-2.5 bg-white border rounded-lg">${esc(rev.wadir2Notes || '')}</textarea>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="processLakipWorkflowDecision('WADIR2', 'VALID')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-circle-check mr-1"></i>Valid (Teruskan ke Direktur)
                            </button>
                            <button type="button" onclick="processLakipWorkflowDecision('WADIR2', 'REVISE')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-rotate-left mr-1"></i>Lakukan Perbaikan (Kembalikan ke Draf Penyusun)
                            </button>
                        </div>
                    </div>
                    ` : ''}

                    ${status === 'PENDING_DIREKTUR' && rights.isDirektur ? `
                    <div class="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-4 space-y-3">
                        <h4 class="font-bold text-indigo-950 text-sm">Panel Pengesahan Akhir Direktur</h4>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Catatan / Disposisi Direktur</label>
                            <textarea id="lakipNoteDirektur" rows="3" oninput="saveLakipReviewNote('direkturNotes', this.value)" placeholder="Tuliskan arahan pengesahan akhir..." class="w-full p-2.5 bg-white border rounded-lg">${esc(rev.direkturNotes || '')}</textarea>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="processLakipWorkflowDecision('DIREKTUR', 'VALID')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-stamp mr-1"></i>Valid &amp; Sahkan LAKIP (Buka Cetak PDF)
                            </button>
                            <button type="button" onclick="processLakipWorkflowDecision('DIREKTUR', 'REVISE')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer">
                                <i class="fa-solid fa-rotate-left mr-1"></i>Lakukan Perbaikan (Kembalikan ke Draf Penyusun)
                            </button>
                        </div>
                    </div>
                    ` : ''}

                    <div class="border rounded-xl overflow-hidden">
                        <div class="bg-blue-900 text-white p-3 font-bold border-b flex items-center justify-between">
                            <span>Checklist Reviu Laporan Kinerja (23 Indikator Penilaian SPI)</span>
                            <span class="text-[11px] text-blue-100">V = Memenuhi / Sesuai &nbsp;|&nbsp; X = Belum Memenuhi / Perlu Perbaikan</span>
                        </div>
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-100 font-bold border-b">
                                <tr>
                                    <th class="p-2 w-40">Aspek</th>
                                    <th class="p-2">Pernyataan Penilaian</th>
                                    <th class="p-2 w-32 text-center">Checklist</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${SPI_CHECKLIST_ITEMS.map(item => {
                                    const val = (rev.checklist && rev.checklist[item.id]) || 'V';
                                    const canEditCheck = status === 'PENDING_REVIEWER' && rights.isReviewer;
                                    return `
                                    <tr>
                                        <td class="p-2 font-semibold text-slate-700">${esc(item.group)}</td>
                                        <td class="p-2">${esc(item.no)} ${esc(item.text)}</td>
                                        <td class="p-2 text-center">
                                            ${canEditCheck ? `
                                                <div class="inline-flex rounded-lg border overflow-hidden">
                                                    <button type="button" onclick="toggleSpiChecklistValue('${item.id}', 'V')" class="px-3 py-1 font-bold cursor-pointer ${val === 'V' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}">V</button>
                                                    <button type="button" onclick="toggleSpiChecklistValue('${item.id}', 'X')" class="px-3 py-1 font-bold cursor-pointer ${val === 'X' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600'}">X</button>
                                                </div>
                                            ` : `
                                                <span class="px-2.5 py-0.5 rounded font-bold ${val === 'V' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${esc(val)}</span>
                                            `}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    };

    // =========================================================================
    // ISOLASI BANNER HANYA DI MENU "DOKUMEN PENGUKURAN & PELAPORAN"
    // =========================================================================
    function isOnDokumenPengukuranPage() {
        const activeNav = document.querySelector('aside a.bg-white, aside button.bg-white, nav a.bg-white, nav button.bg-white, [aria-current="page"]');
        if (activeNav) {
            const navText = (activeNav.textContent || '').toLowerCase();
            return navText.includes('dokumen pengukuran') && navText.includes('pelaporan');
        }
        const headerTitle = document.querySelector('header h1, header h2');
        const titleText = (headerTitle?.textContent || '').toLowerCase();
        return titleText.includes('dokumen pengukuran') && titleText.includes('pelaporan');
    }

    function injectLakipEntryPoint() {
        installAccountSearchFocusGuard();
        registerReviewerRoleOption();

        const existingBanner = document.getElementById(PANEL_ID);
        const existingWs = document.getElementById(WORKSPACE_ID);

        if (!isOnDokumenPengukuranPage()) {
            if (existingBanner) existingBanner.remove();
            if (existingWs) existingWs.remove();
            return;
        }

        const rights = getLakipAccessRights();
        if (!rights.canViewPortal) {
            if (existingBanner) existingBanner.remove();
            if (existingWs) existingWs.remove();
            return;
        }

        const mainEl = document.getElementById('mainContent') || document.querySelector('main > div:last-child') || document.querySelector('main');
        if (!mainEl) return;

        if (!existingBanner) {
            const cfg = getOrInitLakipConfig(_lakipYear);
            const banner = document.createElement('div');
            banner.id = PANEL_ID;
            banner.className = 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 mb-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4';

            const badgeLabel = rights.canDraft
                ? 'Menu Penyusun LAKIP (Tim Program / Evaluasi & Admin Sistem)'
                : 'Portal Reviu & Pengesahan Berjenjang LAKIP';
            const btnLabel = rights.canDraft
                ? 'Buka Generator LAKIP'
                : 'Buka Lembar Reviu & Pengesahan LAKIP';

            banner.innerHTML = `
                <div class="space-y-1">
                    <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">${badgeLabel}</span>
                    <h3 class="text-base font-bold flex items-center gap-2">
                        <i class="fa-solid fa-file-shield text-amber-300"></i> Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP)
                    </h3>
                    <p class="text-xs text-blue-100">
                        Alur Terkendali: Penyusun (Tim Program) &rarr; Reviu SPI (23 Checklist) &rarr; Pembantu Direktur II &rarr; Pengesahan Direktur.
                        Status saat ini: <strong id="lakipBannerStatusText">${esc(cfg.workflowStatus || 'DRAFT')}</strong>.
                    </p>
                </div>
                <button type="button" onclick="openLakipGeneratorWorkspace()" class="px-5 py-2.5 bg-white text-blue-950 hover:bg-blue-50 rounded-xl font-bold text-xs shadow shrink-0 cursor-pointer">
                    <i class="fa-solid fa-folder-open mr-1.5"></i>${btnLabel}
                </button>
            `;
            mainEl.prepend(banner);
        }

        if (!document.getElementById(WORKSPACE_ID)) {
            const ws = document.createElement('div');
            ws.id = WORKSPACE_ID;
            ws.className = 'hidden mb-6';
            const banner = document.getElementById(PANEL_ID);
            if (banner && banner.parentNode) {
                banner.parentNode.insertBefore(ws, banner.nextSibling);
            }
        }
    }

    document.addEventListener('DOMContentLoaded', injectLakipEntryPoint);
    setInterval(injectLakipEntryPoint, 1000);
})();
