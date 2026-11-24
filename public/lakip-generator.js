// =========================================================================
// MODUL GENERATOR LAPORAN LAKIP OTOMATIS + WORKFLOW REVIEW SPI, WADIR II & DIREKTUR
// Hak Akses Penyusun: Tim Program / Evaluasi (Program) & Admin Sistem
// =========================================================================
(function () {
    const PANEL_ID = 'kiJaroLakipEntryBanner';
    const WORKSPACE_ID = 'kiJaroLakipWorkspace';
    const LOGO_KEMENPERIN = './logo-kemenperin.png';

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

    // 23 Indikator Checklist Reviu SPI sesuai Lembar Review Dokumen LAKIP PIPB
    const SPI_CHECKLIST_ITEMS = [
        // Format (6 butir)
        { id: 'fmt_1', group: 'Format', no: '1)', text: 'Laporan Kinerja (LKj) telah menampilkan data penting' },
        { id: 'fmt_2', group: 'Format', no: '2)', text: 'LKj telah menyajikan informasi target kinerja' },
        { id: 'fmt_3', group: 'Format', no: '3)', text: 'LKj telah menyajikan capaian kinerja yang memadai' },
        { id: 'fmt_4', group: 'Format', no: '4)', text: 'Telah menyajikan dengan lampiran' },
        { id: 'fmt_5', group: 'Format', no: '5)', text: 'Telah menyajikan upaya perbaikan ke depan' },
        { id: 'fmt_6', group: 'Format', no: '6)', text: 'Telah menyajikan akuntabilitas keuangan' },
        // Mekanisme Penyusunan (7 butir)
        { id: 'mek_1', group: 'Mekanisme Penyusunan', no: '1)', text: 'LKj disusun oleh unit kerja yang memiliki tugas fungsi untuk itu' },
        { id: 'mek_2', group: 'Mekanisme Penyusunan', no: '2)', text: 'Informasi yang disampaikan dalam LKj telah didukung dengan data yang memadai' },
        { id: 'mek_3', group: 'Mekanisme Penyusunan', no: '3)', text: 'Telah terdapat mekanisme penyampaian data dan informasi dari unit kerja ke unit penyusun LKj' },
        { id: 'mek_4', group: 'Mekanisme Penyusunan', no: '4)', text: 'Telah ditetapkan penanggung jawab pengumpulan data/informasi di setiap unit' },
        { id: 'mek_5', group: 'Mekanisme Penyusunan', no: '5)', text: 'Data/informasi kinerja yang disampaikan dalam LKj telah diyakini keandalannya' },
        { id: 'mek_6', group: 'Mekanisme Penyusunan', no: '6)', text: 'Analisis/penjelasan dalam LKj telah diketahui oleh unit kerja terkait' },
        { id: 'mek_7', group: 'Mekanisme Penyusunan', no: '7)', text: 'LKj periode berjalan merupakan gabungan partisipasi dari unit di bawahnya' },
        // Substansi (10 butir)
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
    let _lakipAttachments = {}; // { [indId]: [{ name, type, dataUrl }] }

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
        const cleaned = String(v).replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
        const n = parseFloat(cleaned);
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
        const rawRoles = Array.isArray(user.roles) ? user.roles : [user.role, user.jabatan, user.unit];
        return rawRoles.filter(Boolean).map(r => String(r).toLowerCase().trim());
    }

    // Cek hak akses:
    // - Penyusun (Tim Program / Evaluasi & Admin Sistem) -> dapat membuka Generator LAKIP
    // - Reviewer SPI, Pembantu Direktur II, Direktur -> dapat membuka Antrean Review & Pengesahan LAKIP
    function getLakipAccessRights() {
        const u = getCurrentUserObj();
        const roles = getUserRolesNormalized(u);
        const nameLower = String(u?.name || '').toLowerCase();
        const unitLower = String(u?.unit || u?.jabatan || '').toLowerCase();

        const isAdmin = roles.some(r => r.includes('admin') || r === 'superadmin');
        const isProgram = roles.some(r => r.includes('program') || r.includes('evaluasi') || r.includes('perencanaan')) ||
            unitLower.includes('program') || unitLower.includes('evaluasi');
        const isReviewer = roles.some(r => r.includes('reviewer') || r.includes('spi') || r.includes('pengawas')) ||
            unitLower.includes('spi') || unitLower.includes('pengawas');
        const isWadir2 = roles.some(r => r.includes('wadir2') || r.includes('wadir 2') || r.includes('wadir ii') || r.includes('pembantu direktur ii') || r.includes('wakil direktur ii')) ||
            unitLower.includes('pembantu direktur ii') || unitLower.includes('wakil direktur ii') || unitLower.includes('wadir ii');
        const isDirektur = roles.some(r => r === 'direktur' || r.includes('direktur')) && !isWadir2 && !roles.some(r => r.includes('wakil') || r.includes('pembantu'));

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

    // Daftarkan role baru "Reviewer LAKIP (SPI)" pada dropdown role manajemen user Ki-Jaro jika ada
    function registerReviewerRoleOption() {
        if (typeof ROLE_LABELS === 'object' && ROLE_LABELS && !ROLE_LABELS['reviewer_lakip']) {
            ROLE_LABELS['reviewer_lakip'] = 'Reviewer LAKIP (SPI)';
        }
        document.querySelectorAll('select').forEach(sel => {
            const opts = Array.from(sel.options).map(o => o.value.toLowerCase());
            if ((opts.includes('direktur') || opts.includes('admin') || opts.includes('pegawai')) && !opts.includes('reviewer_lakip')) {
                const opt = document.createElement('option');
                opt.value = 'reviewer_lakip';
                opt.textContent = 'Reviewer LAKIP (SPI)';
                sel.appendChild(opt);
            }
        });
    }

    function getDirectorInfo() {
        const users = Array.isArray(DB?.users) ? DB.users : [];
        const dir = users.find(u => {
            const rs = getUserRolesNormalized(u);
            return rs.includes('direktur') && !rs.some(x => x.includes('wakil') || x.includes('pembantu') || x.includes('wadir'));
        });
        return {
            name: dir ? dir.name : 'Supardi',
            nip: dir?.nip || '-'
        };
    }

    // Pemindaian data asli dari database Ki-Jaro (Zero-Dummy)
    function extractIndicatorsFromDB(tahun) {
        const yr = String(tahun || '2025').trim();
        const prevYr = String(Number(yr) - 1);
        const dbObj = (typeof DB === 'object' && DB) ? DB : {};
        const items = [];
        const seen = new Set();

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

                const rowYr = String(row.tahun || row.year || row.tahunKinerja || '').trim();
                if (rowYr && rowYr !== yr) return;

                const ikName = String(
                    row.indikator || row.namaIndikator || row.indikatorKinerja || row.iku || row.namaIku || ''
                ).trim();
                if (!ikName) return;

                const normKey = ikName.toLowerCase();
                if (seen.has(normKey)) return;
                seen.add(normKey);

                const kodeSk = String(row.kodeSk || row.kodeSasaran || row.kode || row.skKode || `SK ${Math.min(4, Math.floor(items.length / 4) + 1)}`).trim();
                const sasaran = String(row.sasaranProgram || row.sasaranStrategis || row.sasaranKinerja || row.sasaran || row.induk || '-').trim();
                const satuan = String(row.satuan || row.unitSatuan || '%').trim();

                let targetVal = parseNum(row.targetVal ?? row.targetAngka ?? row.target);
                if (targetVal === null && row.targets && typeof row.targets === 'object') targetVal = parseNum(row.targets[yr]);

                let target2029 = parseNum(row.target2029 ?? row.targetRenstra2029 ?? row.targetAkhir);
                if (target2029 === null && row.targets && typeof row.targets === 'object') target2029 = parseNum(row.targets['2029']);

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
                const realisasiVal = validTw.length > 0 ? validTw[0] : null;
                const prevYearVal = parseNum(row.realisasiTahunLalu ?? row.realisasiPrevYear ?? (row.realisasiPerTahun && row.realisasiPerTahun[prevYr]));

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

                const paguAnggaran = parseNum(row.pagu ?? row.paguAnggaran ?? row.anggaran) ?? 0;
                const realisasiAnggaran = parseNum(row.realisasiAnggaran ?? row.serapan ?? row.realisasiBiaya) ?? 0;

                items.push({
                    id: row.id || `ik_${yr}_${idx}`,
                    kodeSk,
                    sasaran,
                    indikator: ikName,
                    satuan,
                    target: targetVal ?? 0,
                    realisasi: realisasiVal ?? 0,
                    realisasiPrevYear: prevYearVal ?? 0,
                    targetRenstra2029: target2029 ?? (targetVal ?? 0),
                    paguAnggaran,
                    realisasiAnggaran,
                    kendalaResume: Array.from(new Set(kendalaArr)).join('; '),
                    tindakLanjutResume: Array.from(new Set(tlArr)).join('; '),
                    targetNasionalBpsdmi: parseNum(row.targetBpsdmi) ?? (targetVal ?? 0),
                    satkerBpsdmiData: DEFAULT_SATKERS_BPSDMI.map(s => ({
                        satker: s,
                        nilai: (s === 'Politeknik Industri Petrokimia Banten' && realisasiVal !== null) ? realisasiVal : ''
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
            realisasiTotal = indicators.reduce((s, x) => s + (Number(x.realisasiAnggaran) || 0), 0);
        }

        return { paguTotal, realisasiTotal };
    }

    function getOrInitLakipConfig(tahun) {
        const yr = String(tahun || '2025');
        if (!DB.lakipConfigs || typeof DB.lakipConfigs !== 'object') DB.lakipConfigs = {};
        if (!DB.lakipConfigs[yr]) {
            const extracted = extractIndicatorsFromDB(yr);
            const budget = extractBudgetSummaryFromDB(yr, extracted);
            const defaultChecklist = {};
            SPI_CHECKLIST_ITEMS.forEach(it => { defaultChecklist[it.id] = 'V'; });

            DB.lakipConfigs[yr] = {
                tahun: yr,
                workflowStatus: 'DRAFT', // DRAFT | PENDING_REVIEWER | PENDING_WADIR2 | PENDING_DIREKTUR | APPROVED
                nomorNotaDinas: '',
                tanggalPengesahan: `Serang, 30 Januari ${Number(yr) + 1}`,
                paguDipaTotal: budget.paguTotal,
                blokirAnggaran: 0,
                realisasiAnggaranTotal: budget.realisasiTotal,
                kataPengantarText: '',
                ringkasanEksekutifText: '',
                bab33EvaluasiText: '',
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
        if (!DB.lakipConfigs[yr].workflowStatus) DB.lakipConfigs[yr].workflowStatus = 'DRAFT';
        if (!DB.lakipConfigs[yr].reviewData) {
            const defaultChecklist = {};
            SPI_CHECKLIST_ITEMS.forEach(it => { defaultChecklist[it.id] = 'V'; });
            DB.lakipConfigs[yr].reviewData = { checklist: defaultChecklist, revisionHistory: [] };
        }
        return DB.lakipConfigs[yr];
    }

    function computeIndicatorMetrics(ind) {
        const target = parseFloat(ind.target) || 0;
        const real = parseFloat(ind.realisasi) || 0;
        const prev = parseFloat(ind.realisasiPrevYear) || 0;
        const renstra2029 = parseFloat(ind.targetRenstra2029) || target;
        const targetBpsdmi = parseFloat(ind.targetNasionalBpsdmi) || target;

        const pctCapaian = target > 0 ? (real / target) * 100 : 0;
        const gapTarget = real - target;
        const yoyDiff = prev > 0 ? real - prev : 0;
        const yoyPct = prev > 0 ? ((real - prev) / prev) * 100 : 0;
        const pctRenstra2029 = renstra2029 > 0 ? (real / renstra2029) * 100 : 0;
        const kontribusiBpsdmi = targetBpsdmi > 0 ? (real / targetBpsdmi) * 100 : 0;

        const validSatkers = (ind.satkerBpsdmiData || [])
            .filter(s => s.nilai !== '' && s.nilai !== null && !Number.isNaN(parseFloat(s.nilai)))
            .map(s => ({ satker: s.satker, nilai: parseFloat(s.nilai) }))
            .sort((a, b) => b.nilai - a.nilai);

        const rankIdx = validSatkers.findIndex(s => s.satker === 'Politeknik Industri Petrokimia Banten');
        const rankStr = validSatkers.length > 1 && rankIdx >= 0
            ? `peringkat ke-${rankIdx + 1} dari ${validSatkers.length} satuan kerja Poltek/Akom BPSDMI yang terdata`
            : 'belum dibandingkan secara menyeluruh dengan satuan kerja BPSDMI lainnya';

        const pagu = parseFloat(ind.paguAnggaran) || 0;
        const serapan = parseFloat(ind.realisasiAnggaran) || 0;
        const pctSerapan = pagu > 0 ? (serapan / pagu) * 100 : 0;
        const selisihEfisiensi = pctCapaian - pctSerapan;

        const isEfektif = target > 0 ? (pctCapaian >= 100) : false;
        const isEfisien = pagu > 0 ? (pctCapaian >= pctSerapan) : true;

        return {
            pctCapaian,
            gapTarget,
            yoyDiff,
            yoyPct,
            pctRenstra2029,
            kontribusiBpsdmi,
            validSatkers,
            rankStr,
            pctSerapan,
            selisihEfisiensi,
            isEfektif,
            isEfisien
        };
    }

    function buildDeterministicQualitativeAnalysis(ind, tahun) {
        if (!ind || !ind.indikator) return '';
        const m = computeIndicatorMetrics(ind);
        const yr = String(tahun);
        const prevYr = String(Number(yr) - 1);

        const statusCapaian = m.pctCapaian >= 100
            ? `melampaui target yang ditetapkan sebesar ${fmtNum(Math.abs(m.gapTarget))} ${ind.satuan} (capaian ${fmtNum(m.pctCapaian)}%)`
            : `mencapai ${fmtNum(m.pctCapaian)}% dari target dengan deviasi sebesar ${fmtNum(Math.abs(m.gapTarget))} ${ind.satuan}`;

        const yoyNarasi = ind.realisasiPrevYear > 0
            ? (m.yoyDiff >= 0
                ? `Apabila dibandingkan dengan realisasi Tahun ${prevYr} sebesar ${fmtNum(ind.realisasiPrevYear)} ${ind.satuan}, terjadi peningkatan kinerja (Year-on-Year) sebesar ${fmtNum(m.yoyDiff)} ${ind.satuan} atau tumbuh ${fmtNum(m.yoyPct)}%.`
                : `Dibandingkan dengan realisasi Tahun ${prevYr} sebesar ${fmtNum(ind.realisasiPrevYear)} ${ind.satuan}, terdapat penyesuaian sebesar ${fmtNum(Math.abs(m.yoyDiff))} ${ind.satuan} (${fmtNum(m.yoyPct)}%).`)
            : `Data historis Tahun ${prevYr} belum tercatat sehingga capaian Tahun ${yr} menjadi baseline awal pada periode perencanaan strategis.`;

        const luarNarasi = ind.pembandingLuar && ind.pembandingLuar.trim()
            ? ` Selain itu, dibandingkan dengan perguruan tinggi vokasi di luar Kementerian Perindustrian (${ind.pembandingLuar.trim()}), capaian Politeknik Industri Petrokimia Banten tetap kompetitif dan selaras dengan kebutuhan industri petrokimia.`
            : '';

        const kendalaText = ind.kendalaResume && ind.kendalaResume.trim()
            ? ind.kendalaResume.trim()
            : 'Belum terdapat catatan kendala khusus yang diinput pada capaian Triwulan I–IV di sistem Ki-Jaro.';
        const tlText = ind.tindakLanjutResume && ind.tindakLanjutResume.trim()
            ? ind.tindakLanjutResume.trim()
            : 'Melakukan pemantauan rutin dan koordinasi lintas unit kerja sesuai jadwal operasional.';

        const efNarasi = ind.paguAnggaran > 0
            ? `Dari aspek pengelolaan anggaran, alokasi pagu sebesar ${fmtRp(ind.paguAnggaran)} terealisasi sebesar ${fmtRp(ind.realisasiAnggaran)} (${fmtNum(m.pctSerapan)}%). Dengan capaian kinerja sebesar ${fmtNum(m.pctCapaian)}% dibandingkan serapan anggaran ${fmtNum(m.pctSerapan)}%, pelaksanaan indikator ini dinilai <strong>${m.isEfektif ? 'EFEKTIF' : 'BELUM EFEKTIF'}</strong> dan <strong>${m.isEfisien ? 'EFISIEN' : 'PERLU OPTIMALISASI EFISIENSI'}</strong> (selisih rasio kinerja terhadap anggaran sebesar ${m.selisihEfisiensi >= 0 ? '+' : ''}${fmtNum(m.selisihEfisiensi)}%).`
            : `Dari aspek pelaksanaan kegiatan, capaian kinerja sebesar ${fmtNum(m.pctCapaian)}% menunjukkan bahwa pelaksanaan program dinilai <strong>${m.isEfektif ? 'EFEKTIF' : 'BELUM EFEKTIF'}</strong> terhadap target yang ditetapkan.`;

        return [
            `Pada ${ind.kodeSk} (${ind.sasaran}), Indikator Kinerja "${ind.indikator}" ditetapkan dengan target Tahun ${yr} sebesar ${fmtNum(ind.target)} ${ind.satuan}. Hingga akhir Triwulan IV Tahun ${yr}, realisasi kinerja mencapai ${fmtNum(ind.realisasi)} ${ind.satuan}, sehingga berhasil ${statusCapaian}.`,
            `${yoyNarasi} Dalam kerangka target jangka menengah Renstra 2025–2029 sebesar ${fmtNum(ind.targetRenstra2029)} ${ind.satuan}, realisasi Tahun ${yr} ini telah berkontribusi mencapai ${fmtNum(m.pctRenstra2029)}% dari sasaran akhir periode Renstra.`,
            `Terhadap target nasional Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian sebesar ${fmtNum(ind.targetNasionalBpsdmi)} ${ind.satuan}, capaian Politeknik Industri Petrokimia Banten memberikan kontribusi langsung sebesar ${fmtNum(m.kontribusiBpsdmi)}%. Dalam pemetaan kinerja antar satuan kerja pendidikan vokasi di bawah BPSDMI, capaian ini menempati ${m.rankStr}.${luarNarasi}`,
            `Selama pelaksanaan Triwulan I hingga Triwulan IV Tahun ${yr}, permasalahan yang dihadapi meliputi: ${kendalaText} Adapun langkah tindak lanjut penyelesaian yang telah dilaksanakan adalah: ${tlText}`,
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
                    generationConfig: { temperature: 0.45, maxOutputTokens: 900 }
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
    // WORKFLOW APPROVAL BERJENJANG:
    // DRAFT (Tim Program/Admin) -> PENDING_REVIEWER (SPI) -> PENDING_WADIR2 -> PENDING_DIREKTUR -> APPROVED
    // Jika diminta "Lakukan Perbaikan" di level manapun -> kembali ke DRAFT di penyusun
    // =========================================================================
    function formatDateIndoNow() {
        return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: '2-digit' });
    }

    window.submitLakipToReviewer = async function () {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.indicators || cfg.indicators.length === 0) {
            if (typeof showToast === 'function') showToast('Data indikator masih kosong. Sinkronkan data dari Ki-Jaro terlebih dahulu.', 'error');
            return;
        }
        const rights = getLakipAccessRights();
        cfg.workflowStatus = 'PENDING_REVIEWER';
        cfg.reviewData.pembuatName = rights.displayName;
        cfg.reviewData.pembuatDate = formatDateIndoNow();
        if (typeof saveToMySQL === 'function') await saveToMySQL();
        window.renderLakipWorkspace();
        if (typeof showToast === 'function') showToast('Draf LAKIP berhasil diajukan ke Role Reviewer (SPI) untuk direviu!', 'success');
    };

    window.processLakipWorkflowDecision = async function (stage, decision) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        const rights = getLakipAccessRights();
        const rev = cfg.reviewData;
        const todayStr = formatDateIndoNow();

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

        if (typeof saveToMySQL === 'function') await saveToMySQL();
        window.renderLakipWorkspace();
    };

    window.toggleSpiChecklistValue = async function (itemId, val) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.reviewData.checklist) cfg.reviewData.checklist = {};
        cfg.reviewData.checklist[itemId] = val;
        if (typeof saveToMySQL === 'function') await saveToMySQL();
        window.renderLakipWorkspace();
    };

    window.saveLakipReviewNote = async function (field, val) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        cfg.reviewData[field] = val;
        if (typeof saveToMySQL === 'function') await saveToMySQL();
    };

    // =========================================================================
    // NAVIGASI TAB & HANDLER INPUT
    // =========================================================================
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
        const prompt = `Anda adalah penyusun Laporan Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten, Kementerian Perindustrian.
Tulis analisis kinerja naratif-kualitatif formal berbahasa Indonesia baku (5 paragraf padat tanpa bullet point) untuk indikator berikut:
- Sasaran Kinerja: ${ind.kodeSk} — ${ind.sasaran}
- Indikator Kinerja: ${ind.indikator}
- Tahun: ${_lakipYear} | Target: ${ind.target} ${ind.satuan} | Realisasi: ${ind.realisasi} ${ind.satuan} (${fmtNum(m.pctCapaian)}%)
- Realisasi Tahun Lalu: ${ind.realisasiPrevYear} ${ind.satuan} (Perubahan YoY: ${fmtNum(m.yoyPct)}%)
- Target Renstra 2025-2029: ${ind.targetRenstra2029} ${ind.satuan} (Progres: ${fmtNum(m.pctRenstra2029)}%)
- Target Nasional BPSDMI: ${ind.targetNasionalBpsdmi} ${ind.satuan} (Kontribusi PIPB: ${fmtNum(m.kontribusiBpsdmi)}%)
- Peringkat Satker BPSDMI: ${m.rankStr}
- Pembanding Poltek Luar Kemenperin: ${ind.pembandingLuar || 'Tidak ada'}
- Kendala TW 1-4: ${ind.kendalaResume || 'Tidak ada'}
- Tindak Lanjut: ${ind.tindakLanjutResume || 'Tidak ada'}
- Anggaran: Pagu ${fmtRp(ind.paguAnggaran)}, Realisasi ${fmtRp(ind.realisasiAnggaran)} (${fmtNum(m.pctSerapan)}%), Status: ${m.isEfektif ? 'Efektif' : 'Belum Efektif'} dan ${m.isEfisien ? 'Efisien' : 'Perlu Optimalisasi'}.
Akhiri paragraf terakhir dengan kalimat yang menyatakan bahwa rincian data lebih lengkap terlampir pada Lampiran laporan.`;

        ind.aiNarrative = await generateQualitativeWithAI(prompt, fallback, cfg.geminiApiKey);
        if (typeof saveToMySQL === 'function') await saveToMySQL();
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
                const prompt = `Susun analisis kualitatif formal LAKIP Politeknik Industri Petrokimia Banten Tahun ${_lakipYear} (5 paragraf baku tanpa bullet) untuk ${ind.kodeSk}: "${ind.indikator}", Target ${ind.target} ${ind.satuan}, Realisasi ${ind.realisasi} ${ind.satuan} (${fmtNum(m.pctCapaian)}%), YoY ${fmtNum(m.yoyPct)}%, Renstra 2025-2029 (${fmtNum(m.pctRenstra2029)}%), Kontribusi BPSDMI ${fmtNum(m.kontribusiBpsdmi)}%, ${m.rankStr}, Kendala: ${ind.kendalaResume || '-'}, Tindak Lanjut: ${ind.tindakLanjutResume || '-'}, Efektivitas/Efisiensi: ${m.isEfektif ? 'Efektif' : 'Belum Efektif'} & ${m.isEfisien ? 'Efisien' : 'Belum Efisien'}. Tutup dengan rujukan ke Lampiran.`;
                ind.aiNarrative = await generateQualitativeWithAI(prompt, fallback, cfg.geminiApiKey);
            }
        }

        const metricsList = cfg.indicators.map(computeIndicatorMetrics);
        const avgCapaian = metricsList.reduce((a, b) => a + b.pctCapaian, 0) / (metricsList.length || 1);
        const efektifCount = metricsList.filter(m => m.isEfektif).length;
        const efisienCount = metricsList.filter(m => m.isEfisien).length;
        const pctDipa = cfg.paguDipaTotal > 0 ? (cfg.realisasiAnggaranTotal / cfg.paguDipaTotal) * 100 : 0;

        const fallbackRingkasan = `Laporan Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${_lakipYear} merupakan wujud pertanggungjawaban akuntabilitas kinerja atas pelaksanaan Perjanjian Kinerja dan Rencana Strategis Tahun 2025–2029. Dari ${cfg.indicators.length} Indikator Kinerja yang ditetapkan, rata-rata capaian kinerja institusi mencapai ${fmtNum(avgCapaian)}%, dengan ${efektifCount} dari ${cfg.indicators.length} indikator (${fmtNum((efektifCount / (cfg.indicators.length || 1)) * 100)}%) berstatus Efektif karena memenuhi atau melampaui target tahunan.\n\nDari sisi pengelolaan keuangan, realisasi anggaran Tahun ${_lakipYear} mencapai ${fmtRp(cfg.realisasiAnggaranTotal)} dari total pagu DIPA sebesar ${fmtRp(cfg.paguDipaTotal)} atau sebesar ${fmtNum(pctDipa)}%, dengan ${efisienCount} indikator menunjukkan rasio efisiensi anggaran yang optimal.`;

        const fallbackBab33 = `Berdasarkan rekapitulasi evaluasi seluruh ${cfg.indicators.length} Indikator Kinerja pada Tahun ${_lakipYear}, diperoleh rata-rata tingkat capaian kinerja sebesar ${fmtNum(avgCapaian)}% dengan rata-rata penyerapan anggaran sebesar ${fmtNum(pctDipa)}%. Sebanyak ${efektifCount} indikator dinyatakan Efektif (capaian >= 100%) dan ${efisienCount} indikator dinyatakan Efisien (persentase capaian kinerja lebih tinggi atau seimbang dengan persentase serapan anggaran).`;

        const fallbackBab4 = `Secara keseluruhan, kinerja Politeknik Industri Petrokimia Banten Tahun ${_lakipYear} mencatat rata-rata capaian kinerja sebesar ${fmtNum(avgCapaian)}% dan realisasi anggaran sebesar ${fmtNum(pctDipa)}%. Evaluasi permasalahan triwulanan serta tindak lanjut penyelesaiannya menjadi dasar penguatan perencanaan dan pelaksanaan program kerja pada tahun berikutnya.`;

        cfg.ringkasanEksekutifText = await generateQualitativeWithAI(
            `Tulis Ringkasan Eksekutif LAKIP Politeknik Industri Petrokimia Banten Tahun ${_lakipYear} (2 paragraf formal baku) dengan data: ${cfg.indicators.length} IKU, rata-rata capaian ${fmtNum(avgCapaian)}%, ${efektifCount} indikator efektif, ${efisienCount} indikator efisien, pagu DIPA ${fmtRp(cfg.paguDipaTotal)}, realisasi ${fmtRp(cfg.realisasiAnggaranTotal)} (${fmtNum(pctDipa)}%).`,
            fallbackRingkasan,
            cfg.geminiApiKey
        );
        cfg.bab33EvaluasiText = fallbackBab33;
        cfg.bab4PenutupText = fallbackBab4;

        if (typeof saveToMySQL === 'function') await saveToMySQL();
        window.renderLakipWorkspace();
        if (typeof showToast === 'function') showToast('Seluruh analisis kualitatif LAKIP berhasil disusun!', 'success');
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

    // =========================================================================
    // GENERATOR DOKUMEN LENGKAP LAKIP (COVER BAKU + BAB I UTUH + BAB II-IV + LEMBAR REVIEW SPI)
    // =========================================================================
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
        const efektifCount = metricsList.filter(m => m.isEfektif).length;
        const pctDipa = cfg.paguDipaTotal > 0 ? (cfg.realisasiAnggaranTotal / cfg.paguDipaTotal) * 100 : 0;

        // Kelompokkan indikator per Kode SK untuk Bab 1.4.4 (Sasaran Politeknik Industri Petrokimia Banten)
        const skGroups = {};
        indicators.forEach(ind => {
            if (!skGroups[ind.kodeSk]) skGroups[ind.kodeSk] = { sasaran: ind.sasaran, items: [] };
            skGroups[ind.kodeSk].items.push(ind);
        });

        const ringkasanHtml = (cfg.ringkasanEksekutifText || '')
            .split(/\n+/).filter(Boolean).map(p => `<p class="text-justify indent-8 mb-3">${esc(p)}</p>`).join('');
        const bab33Html = (cfg.bab33EvaluasiText || '').split(/\n+/).filter(Boolean)
            .map(p => `<p class="text-justify indent-8 mb-3">${esc(p)}</p>`).join('');
        const bab4Html = (cfg.bab4PenutupText || '').split(/\n+/).filter(Boolean)
            .map(p => `<p class="text-justify indent-8 mb-3">${esc(p)}</p>`).join('');

        return `
        <div id="lakipPrintableFullSheet" class="text-slate-900 font-serif text-[11pt] leading-relaxed space-y-8">
            <!-- 1. COVER RESMI SESUAI CONTOH LAKIP PIPB -->
            <div class="border-4 border-double border-blue-950 p-10 bg-gradient-to-b from-slate-50 via-white to-blue-50/40 flex flex-col justify-between min-h-[268mm] text-center" style="page-break-after: always;">
                <div class="space-y-2 pt-4">
                    <p class="text-base font-extrabold uppercase tracking-wider text-blue-950">LAPORAN AKUNTABILITAS KINERJA</p>
                    <p class="text-base font-extrabold uppercase tracking-wider text-blue-950">INSTANSI PEMERINTAH (LAKIP)</p>
                    <div class="inline-block mt-2 px-6 py-1 bg-blue-950 text-white text-sm font-bold tracking-widest">TAHUN ${esc(yr)}</div>
                </div>

                <div class="my-auto space-y-6">
                    <img src="${LOGO_KEMENPERIN}" onerror="this.style.display='none'" class="w-36 h-36 mx-auto object-contain" alt="Logo Kementerian Perindustrian">
                    <div class="w-32 h-1 bg-amber-500 mx-auto"></div>
                    <div class="space-y-1.5">
                        <h1 class="text-xl font-extrabold uppercase tracking-wide text-blue-950">POLITEKNIK INDUSTRI PETROKIMIA BANTEN</h1>
                        <h2 class="text-sm font-bold uppercase tracking-wide text-slate-800">BADAN PENGEMBANGAN SUMBER DAYA MANUSIA INDUSTRI</h2>
                        <h3 class="text-sm font-bold uppercase tracking-wide text-slate-800">KEMENTERIAN PERINDUSTRIAN REPUBLIK INDONESIA</h3>
                    </div>
                </div>

                <div class="space-y-1 text-xs font-bold text-slate-800 border-t-2 border-blue-950 pt-4">
                    <p>POLITEKNIK INDUSTRI PETROKIMIA BANTEN</p>
                    <p class="font-normal">Jl. Raya Karang Bolong, Kp. Cibomo, Desa Umbul Tanjung, Kec. Cinangka, Kab. Serang - Banten 42167</p>
                    <p class="pt-1 text-blue-950">TAHUN ${esc(nextYr)}</p>
                </div>
            </div>

            <!-- 2. NOTA DINAS -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <div class="flex items-center gap-4 border-b-2 border-slate-900 pb-3">
                    <img src="${LOGO_KEMENPERIN}" onerror="this.style.display='none'" class="w-16 h-16 object-contain" alt="Logo">
                    <div class="text-center flex-1">
                        <p class="text-xs font-bold uppercase">Kementerian Perindustrian Republik Indonesia</p>
                        <p class="text-xs font-bold uppercase">Badan Pengembangan Sumber Daya Manusia Industri</p>
                        <p class="text-sm font-extrabold uppercase">Politeknik Industri Petrokimia Banten</p>
                    </div>
                </div>
                <h3 class="text-center font-bold uppercase underline pt-2">NOTA DINAS</h3>
                <p class="text-center text-xs">Nomor: ${esc(cfg.nomorNotaDinas || '-')}</p>
                <table class="w-full text-xs">
                    <tr><td class="w-28 py-1">Yth.</td><td class="w-4">:</td><td>Kepala Badan Pengembangan Sumber Daya Manusia Industri</td></tr>
                    <tr><td class="py-1">Dari</td><td>:</td><td>Direktur Politeknik Industri Petrokimia Banten</td></tr>
                    <tr><td class="py-1">Hal</td><td>:</td><td class="font-bold">Penyampaian Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)}</td></tr>
                    <tr><td class="py-1">Tanggal</td><td>:</td><td>${esc(cfg.tanggalPengesahan)}</td></tr>
                </table>
                <hr class="border-slate-800">
                <p class="text-justify indent-8">
                    Sehubungan dengan pelaksanaan Sistem Akuntabilitas Kinerja Instansi Pemerintah (SAKIP) di lingkungan Kementerian Perindustrian serta sebagai bentuk pertanggungjawaban atas pencapaian target Perjanjian Kinerja Tahun ${esc(yr)}, bersama ini kami sampaikan Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)}.
                </p>
                <p class="text-justify indent-8">
                    Laporan ini memuat capaian Indikator Kinerja Utama, analisis komparasi kinerja tahunan dan kontribusi terhadap target nasional BPSDMI, evaluasi efektivitas serta efisiensi penggunaan anggaran, serta rencana tindak lanjut perbaikan kinerja pada tahun berikutnya. Demikian disampaikan, atas perhatian dan arahan Bapak/Ibu kami ucapkan terima kasih.
                </p>
                <div class="pt-8 flex justify-end">
                    <div class="text-center w-64">
                        <p class="font-bold">Direktur,</p>
                        <div class="h-16"></div>
                        <p class="font-bold underline">${esc(dir.name)}</p>
                        <p>NIP. ${esc(dir.nip)}</p>
                    </div>
                </div>
            </div>

            <!-- 3. KATA PENGANTAR & RINGKASAN EKSEKUTIF -->
            <div class="p-8 bg-white border border-slate-200 space-y-5" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">KATA PENGANTAR</h3>
                <p class="text-justify indent-8">
                    Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya Laporan Akuntabilitas Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)}. Penyusunan dokumen ini mengacu pada Peraturan Presiden Nomor 29 Tahun 2014 tentang Sistem Akuntabilitas Kinerja Instansi Pemerintah serta Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 53 Tahun 2014.
                </p>
                <p class="text-justify indent-8">
                    LAKIP Tahun ${esc(yr)} ini menyajikan gambaran komprehensif mengenai tingkat keberhasilan pencapaian sasaran strategis pendidikan tinggi vokasi industri petrokimia, perbandingan kinerja antar tahun serta kontribusi terhadap sasaran program BPSDMI Kementerian Perindustrian, dan akuntabilitas pengelolaan anggaran.
                </p>
                <div class="flex justify-end pb-4">
                    <div class="text-center w-64">
                        <p>${esc(cfg.tanggalPengesahan)}</p>
                        <p class="font-bold">Direktur,</p>
                        <div class="h-14"></div>
                        <p class="font-bold underline">${esc(dir.name)}</p>
                    </div>
                </div>

                <hr class="border-slate-300">
                <h3 class="text-center text-base font-bold uppercase pt-2">RINGKASAN EKSEKUTIF</h3>
                <div class="grid grid-cols-4 gap-2 text-center text-xs my-3">
                    <div class="p-2.5 border border-slate-400 bg-slate-50"><strong>${indicators.length} IKU</strong><br>Total Indikator</div>
                    <div class="p-2.5 border border-slate-400 bg-slate-50"><strong>${fmtNum(avgCapaian)}%</strong><br>Rata-rata Capaian</div>
                    <div class="p-2.5 border border-slate-400 bg-slate-50"><strong>${efektifCount} / ${indicators.length}</strong><br>Indikator Efektif</div>
                    <div class="p-2.5 border border-slate-400 bg-slate-50"><strong>${fmtNum(pctDipa)}%</strong><br>Realisasi Anggaran</div>
                </div>
                ${ringkasanHtml || '<p class="text-xs italic text-slate-400">Klik tombol "Generate Analisis AI Semua Bab" untuk menyusun ringkasan eksekutif dari data Ki-Jaro.</p>'}
            </div>

            <!-- 4. DAFTAR ISI -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">DAFTAR ISI</h3>
                <table class="w-full text-xs">
                    <tbody>
                        <tr><td class="py-1 font-bold">NOTA DINAS</td><td class="text-right">ii</td></tr>
                        <tr><td class="py-1 font-bold">KATA PENGANTAR</td><td class="text-right">iii</td></tr>
                        <tr><td class="py-1 font-bold">RINGKASAN EKSEKUTIF</td><td class="text-right">iv</td></tr>
                        <tr><td class="py-1 font-bold">DAFTAR ISI</td><td class="text-right">v</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB I PENDAHULUAN</td><td class="text-right font-bold pt-2">1</td></tr>
                        <tr><td class="py-0.5 pl-4">1.1 Tugas Pokok dan Fungsi</td><td class="text-right">1</td></tr>
                        <tr><td class="py-0.5 pl-4">1.2 Struktur Organisasi</td><td class="text-right">2</td></tr>
                        <tr><td class="py-0.5 pl-4">1.3 Peran Strategis</td><td class="text-right">3</td></tr>
                        <tr><td class="py-0.5 pl-4">1.4 Rencana Strategis (1.4.1 Visi, 1.4.2 Misi, 1.4.3 Tujuan, 1.4.4 Sasaran, 1.4.5 Arah Kebijakan & Strategi)</td><td class="text-right">4</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB II PERENCANAAN KINERJA</td><td class="text-right font-bold pt-2">9</td></tr>
                        <tr><td class="py-0.5 pl-4">2.1 Perjanjian Kinerja Tahun ${esc(yr)}</td><td class="text-right">9</td></tr>
                        <tr><td class="py-0.5 pl-4">2.2 Perencanaan Anggaran Tahun ${esc(yr)}</td><td class="text-right">11</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB III AKUNTABILITAS KINERJA</td><td class="text-right font-bold pt-2">13</td></tr>
                        <tr><td class="py-0.5 pl-4">3.1 Capaian Kinerja Organisasi per Indikator (${indicators.length} IKU)</td><td class="text-right">13</td></tr>
                        <tr><td class="py-0.5 pl-4">3.2 Realisasi Anggaran Tahun ${esc(yr)}</td><td class="text-right">27</td></tr>
                        <tr><td class="py-0.5 pl-4">3.3 Evaluasi Efektivitas, Efisiensi dan Pencapaian Kinerja</td><td class="text-right">28</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB IV PENUTUP</td><td class="text-right font-bold pt-2">30</td></tr>
                        <tr><td class="py-1 font-bold pt-2">LEMBAR REVIEW & CHECKLIST REVIU SPI</td><td class="text-right font-bold pt-2">Terlampir</td></tr>
                        <tr><td class="py-1 font-bold pt-1">LAMPIRAN DATA DUKUNG CAPAIAN KINERJA</td><td class="text-right font-bold pt-1">Terlampir</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- 5. BAB I PENDAHULUAN (STANDAR BAKU UTUH SESUAI LAKIP PIPB; HANYA 1.4.4 DINAMIS DARI KI-JARO) -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">BAB I<br>PENDAHULUAN</h3>

                <h4 class="font-bold">1.1 Tugas Pokok dan Fungsi</h4>
                <p class="text-justify indent-8">
                    Politeknik Industri Petrokimia Banten merupakan unit pelaksana teknis pendidikan tinggi vokasi di bawah dan bertanggung jawab kepada Kepala Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian Republik Indonesia yang didirikan berdasarkan Peraturan Menteri Perindustrian Nomor 29 Tahun 2022 tentang Organisasi dan Tata Kerja Politeknik Industri Petrokimia Banten. Berdasarkan peraturan tersebut, Politeknik Industri Petrokimia Banten mempunyai tugas menyelenggarakan pendidikan vokasi di bidang industri petrokimia dan dapat menyelenggarakan pendidikan profesi sesuai dengan ketentuan peraturan perundang-undangan.
                </p>
                <p class="text-justify indent-8">
                    Dalam melaksanakan tugas pokok tersebut, Politeknik Industri Petrokimia Banten menyelenggarakan 15 (lima belas) fungsi utama sebagai berikut:
                </p>
                <ol class="list-decimal pl-8 space-y-1 text-justify">
                    <li>Penyusunan rencana dan program kerja pendidikan vokasi di bidang industri petrokimia;</li>
                    <li>Pelaksanaan pendidikan dan pengajaran vokasi berbasis kompetensi industri petrokimia;</li>
                    <li>Pelaksanaan penelitian terapan dan pengembangan teknologi di bidang industri petrokimia;</li>
                    <li>Pelaksanaan pengabdian kepada masyarakat di bidang industri petrokimia;</li>
                    <li>Pelaksanaan pembinaan sivitas akademika dan hubungan dengan lingkungan;</li>
                    <li>Pelaksanaan kerja sama pendidikan, penelitian, dan pemagangan dengan industri dan pemangku kepentingan;</li>
                    <li>Pelaksanaan penjaminan mutu pendidikan tinggi vokasi;</li>
                    <li>Pelaksanaan pengelolaan perpustakaan dan sarana sumber belajar;</li>
                    <li>Pelaksanaan pengelolaan laboratorium, bengkel kerja (workshop), dan unit produksi/teaching factory;</li>
                    <li>Pelaksanaan pembinaan kegiatan kemahasiswaan, kealumnian, dan layanan bimbingan karier;</li>
                    <li>Pelaksanaan sertifikasi kompetensi mahasiswa dan sumber daya manusia industri;</li>
                    <li>Pelaksanaan inkubasi bisnis dan kewirausahaan industri;</li>
                    <li>Pelaksanaan sistem informasi manajemen, kehumasan, dan transformasi digital kampus;</li>
                    <li>Pelaksanaan urusan perencanaan, keuangan, kepegawaian, ketatausahaan, kerumahtanggaan, dan pengelolaan barang milik negara; dan</li>
                    <li>Pelaksanaan pemantauan, evaluasi, dan pelaporan kinerja Politeknik Industri Petrokimia Banten.</li>
                </ol>

                <h4 class="font-bold pt-2">1.2 Struktur Organisasi</h4>
                <p class="text-justify indent-8">
                    Susunan organisasi Politeknik Industri Petrokimia Banten berdasarkan Peraturan Menteri Perindustrian Nomor 29 Tahun 2022 terdiri atas unsur pimpinan, unsur pelaksana akademik, unsur pelaksana administrasi, unsur penjaminan mutu, serta unsur penunjang akademik yang mencakup 15 (lima belas) satuan organisasi/unit kerja, yaitu: (1) Direktur; (2) Wakil Direktur I Bidang Akademik; (3) Wakil Direktur II Bidang Administrasi Umum dan Keuangan; (4) Wakil Direktur III Bidang Kemahasiswaan dan Kerja Sama; (5) Senat Politeknik; (6) Dewan Penyantun; (7) Satuan Pengawas Internal (SPI); (8) Subbagian Administrasi Akademik, Kemahasiswaan, dan Kerja Sama; (9) Subbagian Umum dan Keuangan; (10) Program Studi Diploma III Teknologi Proses Industri Petrokimia; (11) Program Studi Diploma III Teknologi Mesin Industri Petrokimia; (12) Program Studi Diploma III Teknologi Instrumentasi Industri Petrokimia; (13) Unit Penelitian dan Pengabdian kepada Masyarakat (UPPM); (14) Satuan Penjaminan Mutu (SPM); serta (15) Unit Penunjang (Perpustakaan, Laboratorium dan Workshop, Pengembangan Karakter & Kewirausahaan, Sertifikasi Kompetensi/LSP, dan Transformasi Digital/IT).
                </p>

                <h4 class="font-bold pt-2">1.3 Peran Strategis</h4>
                <p class="text-justify indent-8">
                    Politeknik Industri Petrokimia Banten berlokasi di Kawasan Industri Kimia dan Petrokimia Cilegon–Serang, Provinsi Banten, yang merupakan klaster industri petrokimia hulu hingga hilir terbesar di Indonesia. Keberadaan institusi ini memiliki peran strategis dalam menjembatani kesenjangan kompetensi (<em>skill gap</em>) tenaga kerja teknis industri melalui penyelenggaraan pendidikan vokasi sistem ganda (<em>dual system</em>), penyediaan tenaga kerja tersertifikasi kompetensi yang siap kerja langsung di pabrik petrokimia, serta akselerasi riset terapan dan adopsi teknologi Industri 4.0 untuk mendukung kemandirian industri kimia nasional.
                </p>

                <h4 class="font-bold pt-2">1.4 Rencana Strategis</h4>
                <h5 class="font-bold">1.4.1 Visi</h5>
                <p class="text-justify indent-8">
                    Visi Politeknik Industri Petrokimia Banten Tahun 2025–2030 adalah: <strong>"Menjadi Politeknik Unggul dan Berdaya Saing Global dalam Pengembangan Sumber Daya Manusia Industri Petrokimia"</strong>.
                </p>

                <h5 class="font-bold pt-1">1.4.2 Misi</h5>
                <p class="text-justify indent-8">
                    Untuk mewujudkan visi tersebut, ditetapkan 7 (tujuh) misi Politeknik Industri Petrokimia Banten sebagai berikut:
                </p>
                <ol class="list-decimal pl-8 space-y-1 text-justify">
                    <li>Menyelenggarakan pendidikan tinggi vokasi di bidang industri petrokimia yang bermutu, adaptif, dan berstandar internasional berbasis kebutuhan industri (<em>link and match</em>);</li>
                    <li>Mengembangkan kurikulum dan metode pembelajaran sistem ganda (<em>dual system</em>) serta pemanfaatan teknologi informasi menuju pendidikan vokasi Industri 4.0;</li>
                    <li>Melaksanakan penelitian terapan yang inovatif dan solutif untuk meningkatkan produktivitas serta daya saing sektor industri petrokimia nasional;</li>
                    <li>Melaksanakan pengabdian kepada masyarakat melalui diseminasi teknologi tepat guna, pendampingan industri kecil dan menengah (IKM), serta pemberdayaan masyarakat sekitar kawasan industri;</li>
                    <li>Memperkuat kemitraan strategis dengan industri petrokimia nasional dan multinasional, asosiasi profesi, serta lembaga pendidikan dan sertifikasi dalam dan luar negeri;</li>
                    <li>Mengembangkan ekosistem kewirausahaan industri dan inkubasi bisnis berbasis teknologi proses, mesin, dan instrumentasi industri; dan</li>
                    <li>Mewujudkan tata kelola perguruan tinggi vokasi yang profesional, transparan, akuntabel, efektif, dan efisien berorientasi pada pelayanan prima.</li>
                </ol>

                <h5 class="font-bold pt-1">1.4.3 Tujuan</h5>
                <p class="text-justify indent-8">
                    Tujuan strategis yang ingin dicapai Politeknik Industri Petrokimia Banten meliputi:
                </p>
                <ol class="list-decimal pl-8 space-y-1 text-justify">
                    <li>Menghasilkan lulusan pendidikan tinggi vokasi industri petrokimia yang kompeten, berkarakter industri, tersertifikasi kompetensi, dan terserap secara optimal di sektor industri nasional maupun global;</li>
                    <li>Menghasilkan karya penelitian terapan dan pengabdian kepada masyarakat yang berkualitas, terpublikasi, dan memberikan dampak nyata bagi pengembangan teknologi serta efisiensi proses industri petrokimia; dan</li>
                    <li>Mewujudkan tata kelola kelembagaan yang akuntabel, modern, berbasis digital, serta didukung sumber daya manusia dan infrastruktur laboratorium berstandar industri.</li>
                </ol>

                <h5 class="font-bold pt-2">1.4.4 Sasaran Politeknik Industri Petrokimia Banten (Sumber Data: Ki-Jaro Tahun ${esc(yr)})</h5>
                <p class="text-justify indent-8">
                    Sasaran strategis dan indikator kinerja Politeknik Industri Petrokimia Banten Tahun ${esc(yr)} yang ditetapkan untuk mengukur keberhasilan pencapaian tujuan institusi tercantum pada tabel berikut:
                </p>
                ${indicators.length === 0
                    ? `<p class="text-xs italic text-slate-500 border p-3">Data Sasaran Politeknik Industri Petrokimia Banten Tahun ${esc(yr)} belum tersedia di database Ki-Jaro.</p>`
                    : Object.entries(skGroups).map(([kode, grp], gIdx) => `
                        <div class="space-y-1.5 pt-2">
                            <p class="font-bold text-xs">Tabel 1.${gIdx + 1} Sasaran Kinerja ${esc(kode)}: ${esc(grp.sasaran)}</p>
                            <table class="w-full border-collapse border border-slate-800 text-[10pt]">
                                <thead>
                                    <tr class="bg-slate-100 font-bold text-center">
                                        <th class="border border-slate-800 p-1.5 w-12">No</th>
                                        <th class="border border-slate-800 p-1.5">Indikator Kinerja</th>
                                        <th class="border border-slate-800 p-1.5 w-24">Satuan</th>
                                        <th class="border border-slate-800 p-1.5 w-24">Target ${esc(yr)}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${grp.items.map((it, idx) => `
                                        <tr>
                                            <td class="border border-slate-800 p-1.5 text-center">${idx + 1}</td>
                                            <td class="border border-slate-800 p-1.5">${esc(it.indikator)}</td>
                                            <td class="border border-slate-800 p-1.5 text-center">${esc(it.satuan)}</td>
                                            <td class="border border-slate-800 p-1.5 text-center font-semibold">${fmtNum(it.target)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}

                <h5 class="font-bold pt-2">1.4.5 Arah Kebijakan dan Strategi</h5>
                <p class="text-justify indent-8">
                    Dalam rangka menjawab tantangan pengembangan pendidikan tinggi vokasi di sektor industri petrokimia serta mengatasi permasalahan pemenuhan rasio dosen praktisi/industri, penguatan sarana laboratorium proses berstandar Industri 4.0, dan hilirisasi riset terapan, Politeknik Industri Petrokimia Banten menetapkan 6 (enam) arah kebijakan dan strategi utama sebagai berikut:
                </p>
                <ol class="list-decimal pl-8 space-y-1 text-justify">
                    <li><strong>Penguatan Kurikulum Link and Match dan Sistem Ganda (Dual System):</strong> Penyelarasan berkelanjutan kurikulum berbasis Standar Kompetensi Kerja Nasional Indonesia (SKKNI) dan kebutuhan spesifik industri petrokimia bersama mitra industri melalui skema pembelajaran di kampus dan praktik kerja industri terstruktur;</li>
                    <li><strong>Peningkatan Kapabilitas SDM Dosen dan Tenaga Kependidikan:</strong> Akselerasi sertifikasi kompetensi teknis dan metodologi bagi dosen/instruktur, pemagangan dosen di industri petrokimia, serta pelibatan praktisi industri sebagai dosen tamu dan pembimbing proyek akhir mahasiswa;</li>
                    <li><strong>Modernisasi Infrastruktur Laboratorium dan Transformasi TVET 4.0:</strong> Pengembangan dan pemeliharaan fasilitas laboratorium proses, mesin, dan instrumentasi industri petrokimia yang terintegrasi dengan otomasi, simulasi proses, dan sistem pemantauan berbasis digital/IoT;</li>
                    <li><strong>Akselerasi Penelitian Terapan, Publikasi Ilmiah, dan Pengabdian Masyarakat:</strong> Peningkatan kualitas dan kuantitas riset terapan sektor industri prioritas yang terpublikasi pada jurnal nasional terakreditasi maupun internasional bereputasi serta penguatan peran Unit Penelitian dan Pengabdian kepada Masyarakat (UPPM);</li>
                    <li><strong>Perluasan Kemitraan Strategis, Penempatan Lulusan, dan Inkubasi Wirausaha:</strong> Optimalisasi kerja sama rekrutmen lulusan sebelum kelulusan, pelaksanaan uji kompetensi melalui Lembaga Sertifikasi Profesi (LSP), serta pembinaan inkubator bisnis untuk menumbuhkan wirausaha baru berbasis industri; dan</li>
                    <li><strong>Penguatan Tata Kelola Reformasi Birokrasi dan Digitalisasi SAKIP:</strong> Peningkatan kualitas perencanaan, penganggaran berbasis kinerja, pengendalian intern oleh Satuan Pengawas Internal (SPI), serta penerapan sistem manajemen kinerja digital terintegrasi (Ki-Jaro) untuk mewujudkan layanan pendidikan vokasi yang prima, efektif, efisien, dan akuntabel.</li>
                </ol>
            </div>

            <!-- 6. BAB II PERENCANAAN KINERJA -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">BAB II<br>PERENCANAAN KINERJA</h3>
                <h4 class="font-bold">2.1 Perjanjian Kinerja Tahun ${esc(yr)}</h4>
                <p class="text-justify indent-8">
                    Perjanjian Kinerja Politeknik Industri Petrokimia Banten Tahun ${esc(yr)} merupakan komitmen kinerja Direktur kepada Kepala Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian dengan rincian sasaran, indikator kinerja, dan alokasi anggaran sebagai berikut:
                </p>
                <table class="w-full border-collapse border border-slate-800 text-[10pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5 w-14">Kode</th>
                            <th class="border border-slate-800 p-1.5">Sasaran Program / Kegiatan</th>
                            <th class="border border-slate-800 p-1.5">Indikator Kinerja</th>
                            <th class="border border-slate-800 p-1.5 w-20">Target</th>
                            <th class="border border-slate-800 p-1.5 w-20">Satuan</th>
                            <th class="border border-slate-800 p-1.5 w-32">Alokasi Anggaran</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.length === 0
                            ? `<tr><td colspan="6" class="border border-slate-800 p-3 text-center italic text-slate-500">Belum ada data Perjanjian Kinerja pada database.</td></tr>`
                            : indicators.map(it => `
                            <tr>
                                <td class="border border-slate-800 p-1.5 text-center font-bold">${esc(it.kodeSk)}</td>
                                <td class="border border-slate-800 p-1.5">${esc(it.sasaran)}</td>
                                <td class="border border-slate-800 p-1.5">${esc(it.indikator)}</td>
                                <td class="border border-slate-800 p-1.5 text-center font-semibold">${fmtNum(it.target)}</td>
                                <td class="border border-slate-800 p-1.5 text-center">${esc(it.satuan)}</td>
                                <td class="border border-slate-800 p-1.5 text-right">${fmtRp(it.paguAnggaran)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h4 class="font-bold pt-2">2.2 Perencanaan Anggaran Tahun ${esc(yr)}</h4>
                <p class="text-justify indent-8">
                    Untuk mendukung pencapaian target Perjanjian Kinerja Tahun ${esc(yr)}, Politeknik Industri Petrokimia Banten mengelola pagu anggaran DIPA sebesar <strong>${fmtRp(cfg.paguDipaTotal)}</strong> (blokir anggaran: ${fmtRp(cfg.blokirAnggaran)}).
                </p>
            </div>

            <!-- 7. BAB III AKUNTABILITAS KINERJA -->
            <div class="p-8 bg-white border border-slate-200 space-y-6" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">BAB III<br>AKUNTABILITAS KINERJA</h3>
                <h4 class="font-bold">3.1 Capaian Kinerja Organisasi per Indikator</h4>

                ${indicators.length === 0
                    ? `<p class="text-xs italic text-slate-500">Data capaian indikator Tahun ${esc(yr)} belum tersedia di database Ki-Jaro.</p>`
                    : indicators.map((ind, i) => {
                        const m = computeIndicatorMetrics(ind);
                        const narasi = ind.aiNarrative || buildDeterministicQualitativeAnalysis(ind, yr);
                        const paras = narasi.split(/\n+/).filter(Boolean).map(p => `<p class="text-justify indent-8 mb-2.5">${p}</p>`).join('');
                        return `
                        <div class="space-y-3 pt-2 border-t border-slate-300">
                            <h5 class="font-bold text-blue-950">3.1.${i + 1} ${esc(ind.kodeSk)} — ${esc(ind.indikator)}</h5>
                            <table class="w-full border-collapse border border-slate-800 text-[9.5pt]">
                                <thead>
                                    <tr class="bg-slate-100 font-bold text-center">
                                        <th class="border border-slate-800 p-1.5">Target ${esc(yr)}</th>
                                        <th class="border border-slate-800 p-1.5">Realisasi ${esc(yr)}</th>
                                        <th class="border border-slate-800 p-1.5">% Capaian</th>
                                        <th class="border border-slate-800 p-1.5">Realisasi ${Number(yr) - 1}</th>
                                        <th class="border border-slate-800 p-1.5">Target Renstra 2029</th>
                                        <th class="border border-slate-800 p-1.5">Target BPSDMI</th>
                                        <th class="border border-slate-800 p-1.5">Kontribusi BPSDMI</th>
                                    </tr>
                                </thead>
                                <tbody class="text-center">
                                    <tr>
                                        <td class="border border-slate-800 p-1.5 font-semibold">${fmtNum(ind.target)} ${esc(ind.satuan)}</td>
                                        <td class="border border-slate-800 p-1.5 font-bold">${fmtNum(ind.realisasi)} ${esc(ind.satuan)}</td>
                                        <td class="border border-slate-800 p-1.5 font-bold">${fmtNum(m.pctCapaian)}%</td>
                                        <td class="border border-slate-800 p-1.5">${fmtNum(ind.realisasiPrevYear)} ${esc(ind.satuan)}</td>
                                        <td class="border border-slate-800 p-1.5">${fmtNum(ind.targetRenstra2029)} ${esc(ind.satuan)}</td>
                                        <td class="border border-slate-800 p-1.5">${fmtNum(ind.targetNasionalBpsdmi)} ${esc(ind.satuan)}</td>
                                        <td class="border border-slate-800 p-1.5 font-semibold">${fmtNum(m.kontribusiBpsdmi)}%</td>
                                    </tr>
                                </tbody>
                            </table>

                            ${m.validSatkers.length > 1 ? `
                            <table class="w-full border-collapse border border-slate-700 text-[9pt]">
                                <thead>
                                    <tr class="bg-slate-50 font-bold">
                                        <th class="border border-slate-700 p-1 w-10 text-center">Rank</th>
                                        <th class="border border-slate-700 p-1">Satuan Kerja Poltek / Akademi Komunitas BPSDMI</th>
                                        <th class="border border-slate-700 p-1 w-28 text-center">Capaian (${esc(ind.satuan)})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${m.validSatkers.map((s, rIdx) => `
                                        <tr class="${s.satker === 'Politeknik Industri Petrokimia Banten' ? 'bg-blue-50 font-bold' : ''}">
                                            <td class="border border-slate-700 p-1 text-center">${rIdx + 1}</td>
                                            <td class="border border-slate-700 p-1">${esc(s.satker)}</td>
                                            <td class="border border-slate-700 p-1 text-center">${fmtNum(s.nilai)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                            ` : ''}

                            <div class="text-[10.5pt]">${paras}</div>
                        </div>
                        `;
                    }).join('')}

                <h4 class="font-bold pt-4">3.2 Realisasi Anggaran Tahun ${esc(yr)} (Per IKU dan Total DIPA)</h4>
                <table class="w-full border-collapse border border-slate-800 text-[9.5pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5 w-10">No</th>
                            <th class="border border-slate-800 p-1.5">Indikator Kinerja Utama / Uraian Anggaran</th>
                            <th class="border border-slate-800 p-1.5 w-32">Alokasi Pagu</th>
                            <th class="border border-slate-800 p-1.5 w-32">Realisasi Anggaran</th>
                            <th class="border border-slate-800 p-1.5 w-20">% Serapan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.map((ind, idx) => {
                            const m = computeIndicatorMetrics(ind);
                            return `
                            <tr>
                                <td class="border border-slate-800 p-1.5 text-center">${idx + 1}</td>
                                <td class="border border-slate-800 p-1.5">${esc(ind.kodeSk)} — ${esc(ind.indikator)}</td>
                                <td class="border border-slate-800 p-1.5 text-right">${fmtRp(ind.paguAnggaran)}</td>
                                <td class="border border-slate-800 p-1.5 text-right">${fmtRp(ind.realisasiAnggaran)}</td>
                                <td class="border border-slate-800 p-1.5 text-center font-semibold">${fmtNum(m.pctSerapan)}%</td>
                            </tr>
                            `;
                        }).join('')}
                        <tr class="bg-slate-100 font-bold">
                            <td colspan="2" class="border border-slate-800 p-1.5 text-right">TOTAL DIPA & REALISASI ANGGARAN TAHUN ${esc(yr)}</td>
                            <td class="border border-slate-800 p-1.5 text-right">${fmtRp(cfg.paguDipaTotal)}</td>
                            <td class="border border-slate-800 p-1.5 text-right">${fmtRp(cfg.realisasiAnggaranTotal)}</td>
                            <td class="border border-slate-800 p-1.5 text-center">${fmtNum(pctDipa)}%</td>
                        </tr>
                    </tbody>
                </table>

                <h4 class="font-bold pt-4">3.3 Evaluasi Efektivitas, Efisiensi dan Pencapaian Kinerja</h4>
                ${bab33Html}
                <table class="w-full border-collapse border border-slate-800 text-[9.5pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5 w-10">No</th>
                            <th class="border border-slate-800 p-1.5">Indikator Kinerja</th>
                            <th class="border border-slate-800 p-1.5 w-24">% Capaian Kinerja</th>
                            <th class="border border-slate-800 p-1.5 w-24">% Serapan Anggaran</th>
                            <th class="border border-slate-800 p-1.5 w-24">Efektivitas</th>
                            <th class="border border-slate-800 p-1.5 w-24">Efisiensi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.length === 0
                            ? `<tr><td colspan="6" class="border border-slate-800 p-3 text-center italic text-slate-500">Belum ada data indikator untuk dievaluasi.</td></tr>`
                            : indicators.map((ind, idx) => {
                                const m = computeIndicatorMetrics(ind);
                                return `
                                <tr>
                                    <td class="border border-slate-800 p-1.5 text-center">${idx + 1}</td>
                                    <td class="border border-slate-800 p-1.5">${esc(ind.indikator)}</td>
                                    <td class="border border-slate-800 p-1.5 text-center font-bold">${fmtNum(m.pctCapaian)}%</td>
                                    <td class="border border-slate-800 p-1.5 text-center">${fmtNum(m.pctSerapan)}%</td>
                                    <td class="border border-slate-800 p-1.5 text-center font-bold">${m.isEfektif ? 'Efektif' : 'Belum Efektif'}</td>
                                    <td class="border border-slate-800 p-1.5 text-center font-bold">${m.isEfisien ? 'Efisien' : 'Belum Efisien'}</td>
                                </tr>
                                `;
                            }).join('')}
                    </tbody>
                </table>
            </div>

            <!-- 8. BAB IV PENUTUP -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">BAB IV<br>PENUTUP</h3>
                ${bab4Html}
                <div class="pt-8 flex justify-end">
                    <div class="text-center w-64">
                        <p>${esc(cfg.tanggalPengesahan)}</p>
                        <p class="font-bold">Direktur,</p>
                        <div class="h-16"></div>
                        <p class="font-bold underline">${esc(dir.name)}</p>
                        <p>NIP. ${esc(dir.nip)}</p>
                    </div>
                </div>
            </div>

            <!-- 9. LEMBAR REVIEW & CHECKLIST REVIU SATUAN PENGAWAS INTERNAL (SPI) -->
            <div class="p-8 bg-white border border-slate-200 space-y-4">
                <div class="text-center border-b-2 border-slate-900 pb-2">
                    <p class="font-bold text-sm uppercase">LEMBAR REVIEW</p>
                    <p class="font-bold text-xs uppercase">LAPORAN AKUNTABILITAS KINERJA INSTANSI PEMERINTAH TAHUN ${esc(yr)}</p>
                    <p class="font-bold text-xs uppercase">SATUAN PENGAWAS INTERNAL — POLITEKNIK INDUSTRI PETROKIMIA BANTEN</p>
                </div>

                <table class="w-full border-collapse border border-slate-800 text-[9.5pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5 w-28">Proses</th>
                            <th class="border border-slate-800 p-1.5 w-44">Penanggung Jawab</th>
                            <th class="border border-slate-800 p-1.5">Keterangan / Catatan</th>
                            <th class="border border-slate-800 p-1.5 w-32">Status & Tanggal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-slate-800 p-1.5 font-bold">Pembuat (Tim Program)</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.pembuatName || '-')}</td>
                            <td class="border border-slate-800 p-1.5">Penyusunan Draf LAKIP Tahun ${esc(yr)}</td>
                            <td class="border border-slate-800 p-1.5 text-center">${esc(rev.pembuatDate || '-')}</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-800 p-1.5 font-bold">Reviewer (SPI)</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.reviewerName || '-')}</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.reviewerNotes || '-')}</td>
                            <td class="border border-slate-800 p-1.5 text-center">${esc(rev.reviewerDate || '-')}</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-800 p-1.5 font-bold">Pembantu Direktur II</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.wadir2Name || '-')}</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.wadir2Notes || '-')}</td>
                            <td class="border border-slate-800 p-1.5 text-center">${esc(rev.wadir2Date || '-')}</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-800 p-1.5 font-bold">Mengetahui / Pengesahan (Direktur)</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.direkturName || dir.name)}</td>
                            <td class="border border-slate-800 p-1.5">${esc(rev.direkturNotes || '-')}</td>
                            <td class="border border-slate-800 p-1.5 text-center">${esc(rev.direkturDate || '-')}</td>
                        </tr>
                    </tbody>
                </table>

                <h4 class="font-bold text-xs uppercase pt-2">CHECKLIST REVIU LAPORAN KINERJA (SPI)</h4>
                <table class="w-full border-collapse border border-slate-800 text-[9pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1 w-36">Aspek</th>
                            <th class="border border-slate-800 p-1">Pernyataan Indikator Penilaian</th>
                            <th class="border border-slate-800 p-1 w-20">Checklist</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${SPI_CHECKLIST_ITEMS.map(item => `
                            <tr>
                                <td class="border border-slate-800 p-1 font-semibold">${esc(item.group)}</td>
                                <td class="border border-slate-800 p-1">${esc(item.no)} ${esc(item.text)}</td>
                                <td class="border border-slate-800 p-1 text-center font-bold">${esc((rev.checklist && rev.checklist[item.id]) || 'V')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        `;
    }

    // Ekspor/Cetak PDF hanya dapat dilakukan setelah dokumen DISAHKAN oleh Direktur (workflowStatus === 'APPROVED')
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
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body { font-family: 'Times New Roman', serif; color: #000; }
                </style>
            </head>
            <body class="p-4">
                ${sheetHtml}
                ${attachmentEntries.length > 0 ? `
                <div style="page-break-before: always;" class="p-8 space-y-6">
                    <h2 class="text-center text-lg font-bold uppercase underline">LAMPIRAN BUKTI DUKUNG CAPAIAN KINERJA TAHUN ${esc(cfg.tahun)}</h2>
                    ${attachmentEntries.map(([indId, files]) => {
                        const indObj = cfg.indicators.find(x => x.id === indId);
                        return `
                        <div class="border border-slate-400 p-4 rounded space-y-2">
                            <p class="font-bold text-sm">Lampiran Indikator: ${esc(indObj ? indObj.indikator : indId)}</p>
                            ${files.map(f => f.type.startsWith('image/')
                                ? `<div class="pt-2"><p class="text-xs font-semibold mb-1">${esc(f.name)}</p><img src="${f.dataUrl}" class="max-h-[210mm] mx-auto border"></div>`
                                : `<p class="text-xs text-blue-900 font-mono">&bull; Dokumen PDF Terlampir: ${esc(f.name)}</p>`
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
        if (typeof saveToMySQL === 'function') await saveToMySQL();
    };

    window.saveLakipIndicatorField = async function (idx, field, value) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        if (!cfg.indicators[idx]) return;
        cfg.indicators[idx][field] = value;
        if (typeof saveToMySQL === 'function') await saveToMySQL();
    };

    window.saveLakipSatkerValue = async function (indIdx, satkerIdx, value) {
        const cfg = getOrInitLakipConfig(_lakipYear);
        const ind = cfg.indicators[indIdx];
        if (!ind || !ind.satkerBpsdmiData[satkerIdx]) return;
        ind.satkerBpsdmiData[satkerIdx].nilai = value;
        if (typeof saveToMySQL === 'function') await saveToMySQL();
    };

    window.resyncLakipFromKiJaro = async function () {
        const fresh = extractIndicatorsFromDB(_lakipYear);
        const budget = extractBudgetSummaryFromDB(_lakipYear, fresh);
        const cfg = getOrInitLakipConfig(_lakipYear);
        cfg.indicators = fresh;
        if (budget.paguTotal > 0) cfg.paguDipaTotal = budget.paguTotal;
        if (budget.realisasiTotal > 0) cfg.realisasiAnggaranTotal = budget.realisasiTotal;
        _lakipSelectedIndIdx = 0;
        if (typeof saveToMySQL === 'function') await saveToMySQL();
        window.renderLakipWorkspace();
        if (typeof showToast === 'function') {
            if (fresh.length === 0) {
                showToast(`Belum ada data indikator/capaian TW 4 Tahun ${_lakipYear} di database Ki-Jaro.`, 'info');
            } else {
                showToast(`Berhasil menyinkronkan ${fresh.length} indikator terkini dari Ki-Jaro Tahun ${_lakipYear}.`, 'success');
            }
        }
    };

    window.openLakipGeneratorWorkspace = function () {
        const rights = getLakipAccessRights();
        if (!rights.canViewPortal) return;
        const ws = document.getElementById(WORKSPACE_ID);
        if (!ws) return;
        ws.classList.remove('hidden');
        // Jika pengguna membuka sebagai Reviewer/Wadir2/Direktur dan bukan penyusun, langsung arahkan ke tab Review & Pengesahan
        if (!rights.canDraft) {
            _lakipActiveTab = 'review';
        }
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
            <div class="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 space-y-5 mt-4">
                <!-- Header & Status Alur Persetujuan -->
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b pb-4">
                    <div class="space-y-1.5">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold uppercase">LAKIP PIPB</span>
                            ${getWorkflowBadgeHtml(status)}
                        </div>
                        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-blue-700"></i> Penyusunan, Reviu SPI & Pengesahan Laporan LAKIP
                        </h3>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <select onchange="changeLakipYear(this.value)" class="p-2 bg-slate-50 border rounded-xl font-bold">
                            ${['2025', '2026', '2027', '2028', '2029'].map(y => `<option value="${y}" ${_lakipYear === y ? 'selected' : ''}>Tahun ${y}</option>`).join('')}
                        </select>

                        ${isEditableDraft ? `
                            <button type="button" onclick="resyncLakipFromKiJaro()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold">
                                <i class="fa-solid fa-arrows-rotate mr-1"></i>Tarik Ulang Data Ki-Jaro
                            </button>
                            <button type="button" id="btnLakipAiAll" onclick="runAiAnalyzeAllSections()" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow">
                                <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Generate AI Semua Bab
                            </button>
                            <button type="button" onclick="submitLakipToReviewer()" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow">
                                <i class="fa-solid fa-paper-plane mr-1"></i>Ajukan Review ke SPI
                            </button>
                        ` : ''}

                        ${status === 'APPROVED' ? `
                            <button type="button" onclick="generateAndPrintCompleteLakip()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow">
                                <i class="fa-solid fa-file-pdf mr-1"></i>Cetak / Download PDF LAKIP Sah
                            </button>
                        ` : `
                            <button type="button" disabled title="Terkunci sampai disahkan Direktur" class="px-3.5 py-2 bg-slate-200 text-slate-500 rounded-xl font-bold cursor-not-allowed">
                                <i class="fa-solid fa-lock mr-1"></i>Cetak PDF (Menunggu Pengesahan)
                            </button>
                        `}
                    </div>
                </div>

                <!-- Notifikasi Riwayat Permintaan Perbaikan Jika Dikembalikan ke Draf -->
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

                <!-- Navigasi 5 Tab -->
                <div class="flex flex-wrap gap-2 border-b pb-3 text-xs font-bold">
                    <button type="button" onclick="switchLakipTab('sync')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'sync' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">1. Data Umum, Anggaran & IKU Ki-Jaro</button>
                    <button type="button" onclick="switchLakipTab('bench')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'bench' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">2. Input Pembanding BPSDMI & Satker</button>
                    <button type="button" onclick="switchLakipTab('ai')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'ai' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">3. Editor Narasi Kualitatif & AI</button>
                    <button type="button" onclick="switchLakipTab('lampiran')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'lampiran' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">4. Lampiran & Pratinjau Lengkap</button>
                    <button type="button" onclick="switchLakipTab('review')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'review' ? 'bg-purple-700 text-white' : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200'}">5. Lembar Reviu SPI & Pengesahan Berjenjang</button>
                </div>

                <!-- TAB 1: DATA UMUM, ANGGARAN & IKU KI-JARO -->
                ${_lakipActiveTab === 'sync' ? `
                <div class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Nomor Nota Dinas</label>
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(cfg.nomorNotaDinas)}" placeholder="Contoh: B/12/BPSDMI/PIPB/..." onchange="saveLakipField('nomorNotaDinas', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Tanggal Pengesahan</label>
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(cfg.tanggalPengesahan)}" onchange="saveLakipField('tanggalPengesahan', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Pagu DIPA (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.paguDipaTotal || 0}" onchange="saveLakipField('paguDipaTotal', Number(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Realisasi Anggaran (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${cfg.realisasiAnggaranTotal || 0}" onchange="saveLakipField('realisasiAnggaranTotal', Number(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                    </div>

                    <div class="overflow-x-auto border rounded-xl">
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-100 font-bold text-slate-700 border-b">
                                <tr>
                                    <th class="p-2 w-16">SK</th>
                                    <th class="p-2">Indikator Kinerja (Otomatis dari Ki-Jaro TW 4 / Terkini)</th>
                                    <th class="p-2 w-24 text-center">Target ${esc(_lakipYear)}</th>
                                    <th class="p-2 w-24 text-center">Realisasi</th>
                                    <th class="p-2 w-24 text-center">Real. ${Number(_lakipYear) - 1}</th>
                                    <th class="p-2 w-28 text-center">Renstra 2029</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${indicators.length === 0 ? `
                                    <tr>
                                        <td colspan="6" class="p-6 text-center text-slate-500">
                                            <p class="font-bold text-slate-700 mb-1">Belum ada data indikator / capaian Triwulan 4 Tahun ${esc(_lakipYear)} di database Ki-Jaro saat ini.</p>
                                            <p class="text-[11px]">Setelah data Perencanaan dan Capaian Triwulan 4 tersedia pada database, klik tombol <strong>Tarik Ulang Data Ki-Jaro</strong> di atas.</p>
                                        </td>
                                    </tr>
                                ` : indicators.map((it, idx) => `
                                    <tr>
                                        <td class="p-2 font-bold">${esc(it.kodeSk)}</td>
                                        <td class="p-2 font-semibold text-slate-800">${esc(it.indikator)} <span class="text-[10px] text-slate-500">(${esc(it.satuan)})</span></td>
                                        <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${it.target}" onchange="saveLakipIndicatorField(${idx}, 'target', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
                                        <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${it.realisasi}" onchange="saveLakipIndicatorField(${idx}, 'realisasi', parseFloat(this.value))" class="w-full p-1 border rounded text-center font-bold"></td>
                                        <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${it.realisasiPrevYear}" onchange="saveLakipIndicatorField(${idx}, 'realisasiPrevYear', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
                                        <td class="p-2"><input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${it.targetRenstra2029}" onchange="saveLakipIndicatorField(${idx}, 'targetRenstra2029', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <!-- TAB 2: INPUT PEMBANDING BPSDMI & ANGGARAN PER IKU -->
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
                            <input type="text" ${!isEditableDraft ? 'disabled' : ''} value="${esc(selInd.pembandingLuar || '')}" placeholder="Contoh: Politeknik KP Jembrana (88,5%)" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'pembandingLuar', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Alokasi Pagu Anggaran IKU Ini (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${selInd.paguAnggaran}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'paguAnggaran', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Realisasi Anggaran IKU Ini (Rp)</label>
                            <input type="number" ${!isEditableDraft ? 'disabled' : ''} value="${selInd.realisasiAnggaran}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'realisasiAnggaran', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                    </div>

                    <div class="border rounded-xl overflow-hidden">
                        <div class="bg-slate-100 p-2.5 font-bold text-slate-800 border-b">Input Nilai Capaian Satker Poltek / Akademi Komunitas di Bawah BPSDMI</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                            ${(selInd.satkerBpsdmiData || []).map((s, sIdx) => `
                                <div class="flex items-center justify-between gap-2 p-2 border rounded-lg ${s.satker === 'Politeknik Industri Petrokimia Banten' ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white'}">
                                    <span class="truncate">${esc(s.satker)}</span>
                                    <input type="number" step="any" ${!isEditableDraft ? 'disabled' : ''} value="${esc(s.nilai)}" placeholder="-" onchange="saveLakipSatkerValue(${_lakipSelectedIndIdx}, ${sIdx}, this.value)" class="w-24 p-1 border rounded text-center">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    `}
                </div>
                ` : ''}

                <!-- TAB 3: EDITOR NARASI KUALITATIF & AI -->
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
                        <button type="button" id="btnLakipAiSingle" onclick="runAiAnalyzeSingleIndicator(${_lakipSelectedIndIdx})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Generate Narasi Indikator Ini
                        </button>
                        ` : ''}
                    </div>

                    <div>
                        <label class="block font-bold text-slate-800 mb-1">Narasi Kualitatif Bab 3.1.${_lakipSelectedIndIdx + 1}</label>
                        <textarea rows="9" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'aiNarrative', this.value)" class="w-full p-3 border rounded-xl leading-relaxed">${esc(selInd.aiNarrative || buildDeterministicQualitativeAnalysis(selInd, _lakipYear))}</textarea>
                    </div>
                    `}

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Narasi Ringkasan Eksekutif</label>
                            <textarea rows="5" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipField('ringkasanEksekutifText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.ringkasanEksekutifText || '')}</textarea>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Narasi Bab IV Penutup (Kesimpulan & Saran)</label>
                            <textarea rows="5" ${!isEditableDraft ? 'disabled' : ''} onchange="saveLakipField('bab4PenutupText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.bab4PenutupText || '')}</textarea>
                        </div>
                    </div>
                </div>
                ` : ''}

                <!-- TAB 4: LAMPIRAN & PRATINJAU LENGKAP -->
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
                                            <button type="button" onclick="removeLakipAttachment('${ind.id}', ${fIdx})" class="text-rose-600 font-bold">&times;</button>
                                        </span>
                                    `).join('')}
                                </div>
                                ` : '<p class="text-[11px] text-slate-400 italic">Belum ada berkas bukti dukung ditambahkan untuk indikator ini.</p>'}
                            </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}

                    <div class="border rounded-2xl p-4 bg-slate-50 max-h-[600px] overflow-y-auto">
                        ${buildFullLakipDocumentHtml(cfg)}
                    </div>
                </div>
                ` : ''}

                <!-- TAB 5: LEMBAR REVIU SPI & PERSETUJUAN BERJENJANG (REVIEWER -> PEMBANTU DIREKTUR II -> DIREKTUR) -->
                ${_lakipActiveTab === 'review' ? `
                <div class="space-y-5 text-xs">
                    <!-- Stepper Alur Persetujuan -->
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

                    <!-- Panel Keputusan Aktif Sesuai Role -->
                    ${status === 'PENDING_REVIEWER' && rights.isReviewer ? `
                    <div class="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 space-y-3">
                        <h4 class="font-bold text-purple-950 text-sm">Panel Keputusan Reviewer (Satuan Pengawas Internal)</h4>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Catatan Hasil Pemeriksaan / Reviu SPI</label>
                            <textarea rows="3" onchange="saveLakipReviewNote('reviewerNotes', this.value)" placeholder="Tuliskan catatan pemeriksaan kesesuaian tabel realisasi, efektivitas/efisiensi anggaran, dan kelengkapan lampiran..." class="w-full p-2.5 bg-white border rounded-lg">${esc(rev.reviewerNotes || '')}</textarea>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="processLakipWorkflowDecision('REVIEWER', 'VALID')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                                <i class="fa-solid fa-circle-check mr-1"></i>Valid (Teruskan ke Pembantu Direktur II)
                            </button>
                            <button type="button" onclick="processLakipWorkflowDecision('REVIEWER', 'REVISE')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
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
                            <textarea rows="3" onchange="saveLakipReviewNote('wadir2Notes', this.value)" placeholder="Tuliskan catatan verifikasi anggaran dan akuntabilitas kinerja..." class="w-full p-2.5 bg-white border rounded-lg">${esc(rev.wadir2Notes || '')}</textarea>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="processLakipWorkflowDecision('WADIR2', 'VALID')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                                <i class="fa-solid fa-circle-check mr-1"></i>Valid (Teruskan ke Direktur)
                            </button>
                            <button type="button" onclick="processLakipWorkflowDecision('WADIR2', 'REVISE')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
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
                            <textarea rows="3" onchange="saveLakipReviewNote('direkturNotes', this.value)" placeholder="Tuliskan arahan pengesahan akhir laporan LAKIP..." class="w-full p-2.5 bg-white border rounded-lg">${esc(rev.direkturNotes || '')}</textarea>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button type="button" onclick="processLakipWorkflowDecision('DIREKTUR', 'VALID')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold">
                                <i class="fa-solid fa-stamp mr-1"></i>Valid & Sahkan LAKIP (Buka Cetak PDF)
                            </button>
                            <button type="button" onclick="processLakipWorkflowDecision('DIREKTUR', 'REVISE')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold">
                                <i class="fa-solid fa-rotate-left mr-1"></i>Lakukan Perbaikan (Kembalikan ke Draf Penyusun)
                            </button>
                        </div>
                    </div>
                    ` : ''}

                    <!-- Tabel 23 Indikator Checklist Reviu SPI -->
                    <div class="border rounded-xl overflow-hidden">
                        <div class="bg-slate-100 p-3 font-bold text-slate-900 border-b flex items-center justify-between">
                            <span>Checklist Reviu Laporan Kinerja (23 Indikator Penilaian SPI)</span>
                            <span class="text-[11px] text-slate-600">V = Memenuhi / Sesuai &nbsp;|&nbsp; X = Belum Memenuhi / Perlu Perbaikan</span>
                        </div>
                        <table class="w-full text-left border-collapse">
                            <thead class="bg-slate-50 font-bold border-b">
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
                                                    <button type="button" onclick="toggleSpiChecklistValue('${item.id}', 'V')" class="px-3 py-1 font-bold ${val === 'V' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600'}">V</button>
                                                    <button type="button" onclick="toggleSpiChecklistValue('${item.id}', 'X')" class="px-3 py-1 font-bold ${val === 'X' ? 'bg-rose-600 text-white' : 'bg-white text-slate-600'}">X</button>
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

    // Sisipkan banner Generator / Review LAKIP hanya untuk Role yang berhak
    function injectLakipEntryPoint() {
        registerReviewerRoleOption();

        const headerTitle = document.querySelector('header h1, header h2');
        const mainEl = document.getElementById('mainContent') || document.querySelector('main > div:last-child') || document.querySelector('main');
        if (!headerTitle || !mainEl) return;

        const titleText = (headerTitle.textContent || '').toLowerCase();
        const isPengukuranPage = titleText.includes('dokumen pengukuran') || titleText.includes('pelaporan');
        if (!isPengukuranPage) return;

        const rights = getLakipAccessRights();
        const existingBanner = document.getElementById(PANEL_ID);

        // Jika bukan Tim Program / Admin Sistem / Reviewer / Wadir II / Direktur, sembunyikan menu LAKIP
        if (!rights.canViewPortal) {
            if (existingBanner) existingBanner.remove();
            return;
        }

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
                        Status saat ini: <strong>${esc(cfg.workflowStatus || 'DRAFT')}</strong>.
                    </p>
                </div>
                <button type="button" onclick="openLakipGeneratorWorkspace()" class="px-5 py-2.5 bg-white text-blue-950 hover:bg-blue-50 rounded-xl font-bold text-xs shadow shrink-0">
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
