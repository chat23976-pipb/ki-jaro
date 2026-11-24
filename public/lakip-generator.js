// =========================================================================
// MODUL GENERATOR LAPORAN LAKIP OTOMATIS + ANALISIS KUALITATIF AI + MERGE PDF
// Terintegrasi pada Menu: Dokumen Pengukuran & Pelaporan (Zero-Dummy)
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

    function getDirectorInfo() {
        const users = Array.isArray(DB?.users) ? DB.users : [];
        const dir = users.find(u => (Array.isArray(u.roles) ? u.roles : [u.role]).includes('direktur'));
        return {
            name: dir ? dir.name : 'Supardi',
            nip: dir?.nip || '-'
        };
    }

    function parseNum(v) {
        if (v === '' || v === null || v === undefined) return null;
        const cleaned = String(v).replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
        const n = parseFloat(cleaned);
        return Number.isNaN(n) ? null : n;
    }

    // Pemindaian menyeluruh data asli dari seluruh koleksi di DB Ki-Jaro (Renstra, Target Direktur, Cascading, Capaian TW 1-4)
    function extractIndicatorsFromDB(tahun) {
        const yr = String(tahun || '2025').trim();
        const prevYr = String(Number(yr) - 1);
        const dbObj = (typeof DB === 'object' && DB) ? DB : {};
        const items = [];
        const seen = new Set();

        // Kumpulkan semua catatan capaian/realisasi/monitoring triwulanan di DB untuk dicocokkan dengan indikator
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

        // Telusuri seluruh array di DB yang memuat sasaran / indikator tingkat Direktur / Institusi
        const excludedKeys = new Set(['users', 'auditlogs', 'logs', 'perjanjiankinerja', 'lakipconfigs', 'notifications', 'emails', 'risiko', 'petarisiko']);
        Object.keys(dbObj).forEach(key => {
            if (!Array.isArray(dbObj[key])) return;
            if (excludedKeys.has(key.toLowerCase())) return;

            dbObj[key].forEach((row, idx) => {
                if (!row || typeof row !== 'object') return;

                // Abaikan baris yang murni level pegawai individu / anggota unit bila berada di tabel cascading
                const isIndividu = Boolean(row.pegawaiUsername || row.namaPegawai || row.username);
                const isSubLevel = row.level && Number(row.level) > 1;
                if ((isIndividu || isSubLevel) && key.toLowerCase().includes('cascad')) return;

                // Cek kecocokan tahun jika properti tahun tersedia pada baris data
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

                // Target tahun berjalan
                let targetVal = parseNum(row.targetVal ?? row.targetAngka ?? row.target);
                if (targetVal === null && row.targets && typeof row.targets === 'object') {
                    targetVal = parseNum(row.targets[yr]);
                }

                // Target Renstra 2029
                let target2029 = parseNum(row.target2029 ?? row.targetRenstra2029 ?? row.targetAkhir);
                if (target2029 === null && row.targets && typeof row.targets === 'object') {
                    target2029 = parseNum(row.targets['2029']);
                }

                // Cari realisasi dari baris ini maupun dari koleksi capaian/realisasi TW 1-4
                const matchedCap = capaianRecords.filter(c => {
                    const cYr = String(c.tahun || c.year || '').trim();
                    if (cYr && cYr !== yr) return false;
                    const cId = String(c.indikatorId || c.targetId || c.idIndikator || '').trim();
                    const cName = String(c.indikator || c.namaIndikator || c.indikatorKinerja || '').trim().toLowerCase();
                    return (row.id && cId === String(row.id)) || (cName && cName === normKey);
                });

                // Ambil realisasi TW 4 (atau triwulan tertinggi yang sudah diinput di Ki-Jaro)
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

                // Realisasi tahun lalu (YoY)
                const prevYearVal = parseNum(row.realisasiTahunLalu ?? row.realisasiPrevYear ?? (row.realisasiPerTahun && row.realisasiPerTahun[prevYr]));

                // Kumpulkan kendala & tindak lanjut aktual dari TW 1-4
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

                const uniqueKendala = Array.from(new Set(kendalaArr));
                const uniqueTl = Array.from(new Set(tlArr));

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
                    kendalaResume: uniqueKendala.join('; '),
                    tindakLanjutResume: uniqueTl.join('; '),
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

        // Tidak ada fallback dummy: jika DB masih kosong, kembalikan array kosong []
        return items;
    }

    // Hitung total pagu & realisasi anggaran dari data Ki-Jaro bila tersedia
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
            DB.lakipConfigs[yr] = {
                tahun: yr,
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
                indicators: extracted
            };
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
            : 'belum dibandingkan dengan satuan kerja BPSDMI lainnya';

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
                : `Dibandingkan dengan realisasi Tahun ${prevYr} sebesar ${fmtNum(ind.realisasiPrevYear)} ${ind.satuan}, terdapat penyesuaian/penurunan sebesar ${fmtNum(Math.abs(m.yoyDiff))} ${ind.satuan} (${fmtNum(m.yoyPct)}%).`)
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
            ? `Dari aspek pengelolaan anggaran, pagu sebesar ${fmtRp(ind.paguAnggaran)} terealisasi sebesar ${fmtRp(ind.realisasiAnggaran)} (${fmtNum(m.pctSerapan)}%). Dengan capaian kinerja sebesar ${fmtNum(m.pctCapaian)}% dibandingkan serapan anggaran ${fmtNum(m.pctSerapan)}%, pelaksanaan indikator ini dinilai <strong>${m.isEfektif ? 'EFEKTIF' : 'BELUM EFEKTIF'}</strong> dan <strong>${m.isEfisien ? 'EFISIEN' : 'PERLU OPTIMALISASI EFISIENSI'}</strong> (selisih rasio kinerja terhadap anggaran sebesar ${m.selisihEfisiensi >= 0 ? '+' : ''}${fmtNum(m.selisihEfisiensi)}%).`
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

    // Ekspos seluruh handler ke window agar dapat diklik dari tombol HTML di mana saja
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
        if (!ind) {
            if (typeof showToast === 'function') showToast('Belum ada data indikator untuk dianalisis.', 'error');
            return;
        }

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
            if (typeof showToast === 'function') showToast('Data indikator di Ki-Jaro masih kosong. Isi atau sinkronkan data TW 4 terlebih dahulu.', 'error');
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

    function buildFullLakipDocumentHtml(cfg) {
        const dir = getDirectorInfo();
        const yr = cfg.tahun;
        const nextYr = String(Number(yr) + 1);
        const indicators = cfg.indicators || [];
        const metricsList = indicators.map(computeIndicatorMetrics);

        const avgCapaian = indicators.length > 0
            ? metricsList.reduce((a, b) => a + b.pctCapaian, 0) / indicators.length
            : 0;
        const efektifCount = metricsList.filter(m => m.isEfektif).length;
        const pctDipa = cfg.paguDipaTotal > 0 ? (cfg.realisasiAnggaranTotal / cfg.paguDipaTotal) * 100 : 0;

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
            <!-- 1. COVER -->
            <div class="border-2 border-slate-300 p-10 bg-white flex flex-col justify-between min-h-[265mm] text-center" style="page-break-after: always;">
                <div class="space-y-4 pt-6">
                    <img src="${LOGO_KEMENPERIN}" onerror="this.style.display='none'" class="w-28 h-28 mx-auto object-contain" alt="Logo Kemenperin">
                    <p class="text-sm font-bold uppercase tracking-widest">Kementerian Perindustrian Republik Indonesia</p>
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-700">Badan Pengembangan Sumber Daya Manusia Industri</p>
                </div>

                <div class="space-y-4 my-auto">
                    <div class="inline-block px-5 py-1.5 bg-blue-900 text-white text-xs font-bold uppercase tracking-widest rounded">Akuntabilitas Kinerja Instansi Pemerintah</div>
                    <h1 class="text-3xl font-extrabold uppercase tracking-wide text-blue-950 leading-snug">
                        LAPORAN KINERJA<br>(LAKIP)<br>TAHUN ${esc(yr)}
                    </h1>
                    <div class="w-24 h-1 bg-amber-500 mx-auto my-4"></div>
                    <h2 class="text-lg font-bold uppercase text-slate-800">POLITEKNIK INDUSTRI PETROKIMIA BANTEN</h2>
                </div>

                <div class="space-y-1 text-xs font-semibold text-slate-700 pb-4">
                    <p>Jalan Raya Karang Bolong, Desa Umbul Tanjung, Kec. Cinangka</p>
                    <p>Kabupaten Serang, Provinsi Banten — 42167</p>
                    <p class="font-bold text-blue-950 pt-2">TAHUN ${esc(nextYr)}</p>
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
                    <tr><td class="py-1">Hal</td><td>:</td><td class="font-bold">Penyampaian Laporan Kinerja (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)}</td></tr>
                    <tr><td class="py-1">Tanggal</td><td>:</td><td>${esc(cfg.tanggalPengesahan)}</td></tr>
                </table>
                <hr class="border-slate-800">
                <p class="text-justify indent-8">
                    Sehubungan dengan pelaksanaan Sistem Akuntabilitas Kinerja Instansi Pemerintah (SAKIP) di lingkungan Kementerian Perindustrian serta sebagai bentuk pertanggungjawaban atas pencapaian target Perjanjian Kinerja Tahun ${esc(yr)}, bersama ini kami sampaikan Laporan Kinerja (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)}.
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
                    Puji syukur ke hadirat Tuhan Yang Maha Esa atas tersusunnya Laporan Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten Tahun ${esc(yr)}. Penyusunan dokumen ini mengacu pada Peraturan Presiden Nomor 29 Tahun 2014 tentang Sistem Akuntabilitas Kinerja Instansi Pemerintah serta Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Nomor 53 Tahun 2014.
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
                        <tr><td class="py-0.5 pl-4">1.1 Latar Belakang</td><td class="text-right">1</td></tr>
                        <tr><td class="py-0.5 pl-4">1.2 Tugas Pokok dan Fungsi</td><td class="text-right">2</td></tr>
                        <tr><td class="py-0.5 pl-4">1.3 Struktur Organisasi</td><td class="text-right">3</td></tr>
                        <tr><td class="py-0.5 pl-4">1.4 Visi, Misi, Tujuan, Sasaran Kinerja (1.4.4) & Isu Strategis (1.4.5)</td><td class="text-right">4</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB II PERENCANAAN KINERJA</td><td class="text-right font-bold pt-2">7</td></tr>
                        <tr><td class="py-0.5 pl-4">2.1 Perjanjian Kinerja Tahun ${esc(yr)}</td><td class="text-right">7</td></tr>
                        <tr><td class="py-0.5 pl-4">2.2 Perencanaan Anggaran Tahun ${esc(yr)}</td><td class="text-right">9</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB III AKUNTABILITAS KINERJA</td><td class="text-right font-bold pt-2">11</td></tr>
                        <tr><td class="py-0.5 pl-4">3.1 Capaian Kinerja Organisasi per Indikator (${indicators.length} IKU)</td><td class="text-right">11</td></tr>
                        <tr><td class="py-0.5 pl-4">3.2 Realisasi Anggaran Tahun ${esc(yr)}</td><td class="text-right">25</td></tr>
                        <tr><td class="py-0.5 pl-4">3.3 Evaluasi Efektivitas, Efisiensi dan Pencapaian Kinerja</td><td class="text-right">26</td></tr>
                        <tr><td class="py-1 font-bold pt-2">BAB IV PENUTUP</td><td class="text-right font-bold pt-2">28</td></tr>
                        <tr><td class="py-1 font-bold pt-2">LAMPIRAN DATA DUKUNG CAPAIAN KINERJA</td><td class="text-right font-bold pt-2">Terlampir</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- 5. BAB I PENDAHULUAN -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">BAB I<br>PENDAHULUAN</h3>
                <h4 class="font-bold">1.1 Latar Belakang</h4>
                <p class="text-justify indent-8">
                    Politeknik Industri Petrokimia Banten merupakan unit pelaksana teknis pendidikan tinggi vokasi di bawah Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian yang didirikan berdasarkan Peraturan Menteri Perindustrian Nomor 29 Tahun 2022 untuk menyiapkan tenaga kerja industri kompeten di sektor petrokimia dan industri berbasis proses.
                </p>
                <h4 class="font-bold">1.2 Tugas Pokok dan Fungsi</h4>
                <p class="text-justify indent-8">
                    Politeknik Industri Petrokimia Banten mempunyai tugas menyelenggarakan pendidikan vokasi di bidang industri petrokimia dan dapat menyelenggarakan pendidikan profesi sesuai ketentuan peraturan perundang-undangan, dengan fungsi penyusunan rencana program, pelaksanaan tridharma perguruan tinggi, pembinaan sivitas akademika, serta pengelolaan tata usaha dan rumah tangga.
                </p>
                <h4 class="font-bold">1.3 Struktur Organisasi</h4>
                <p class="text-justify indent-8">
                    Organisasi Politeknik Industri Petrokimia Banten dipimpin oleh Direktur yang membawahi Wakil Direktur, Subbagian Administrasi Akademik Kemahasiswaan dan Kerja Sama, Subbagian Umum dan Keuangan, Program Studi (Teknologi Proses Industri Petrokimia, Teknologi Mesin Industri Petrokimia, Teknologi Instrumentasi Industri Petrokimia), serta Unit Penunjang (UPPM, SPM, Perpustakaan, dan Laboratorium).
                </p>
                <h4 class="font-bold">1.4 Visi, Misi, Tujuan, Sasaran Kinerja (1.4.4) dan Permasalahan Strategis (1.4.5)</h4>
                <p class="text-justify indent-8">
                    <strong>Visi 2030:</strong> Menjadi Politeknik Unggul dan Berdaya Saing Global dalam Pengembangan Sumber Daya Manusia Industri Petrokimia.
                </p>
                <h4 class="font-bold pt-1">1.4.4 Sasaran Kinerja Tahun ${esc(yr)} (Sumber Data: Ki-Jaro)</h4>
                <table class="w-full border-collapse border border-slate-800 text-[10pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5 w-16">Kode</th>
                            <th class="border border-slate-800 p-1.5">Sasaran Kinerja</th>
                            <th class="border border-slate-800 p-1.5">Indikator Kinerja</th>
                            <th class="border border-slate-800 p-1.5 w-24">Target ${esc(yr)}</th>
                            <th class="border border-slate-800 p-1.5 w-24">Satuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.length === 0
                            ? `<tr><td colspan="5" class="border border-slate-800 p-3 text-center italic text-slate-500">Data Sasaran Kinerja Tahun ${esc(yr)} belum tersedia di Ki-Jaro.</td></tr>`
                            : Object.entries(skGroups).map(([kode, grp]) => grp.items.map((it, idx) => `
                            <tr>
                                ${idx === 0 ? `<td class="border border-slate-800 p-1.5 text-center font-bold align-top" rowspan="${grp.items.length}">${esc(kode)}</td>` : ''}
                                ${idx === 0 ? `<td class="border border-slate-800 p-1.5 align-top" rowspan="${grp.items.length}">${esc(grp.sasaran)}</td>` : ''}
                                <td class="border border-slate-800 p-1.5">${esc(it.indikator)}</td>
                                <td class="border border-slate-800 p-1.5 text-center font-semibold">${fmtNum(it.target)}</td>
                                <td class="border border-slate-800 p-1.5 text-center">${esc(it.satuan)}</td>
                            </tr>
                        `).join('')).join('')}
                    </tbody>
                </table>

                <h4 class="font-bold pt-2">1.4.5 Permasalahan Utama dan Kebijakan Strategis</h4>
                <p class="text-justify indent-8">
                    Permasalahan strategis yang dihadapi meliputi pemenuhan rasio dosen berkualifikasi industri, penguatan fasilitas laboratorium proses petrokimia berstandar industri 4.0, serta akselerasi hilirisasi riset terapan dan inkubasi wirausaha industri. Enam kebijakan strategis ditempuh melalui penguatan link and match kurikulum dual system, sertifikasi kompetensi LSP P1, digitalisasi layanan SAKIP Ki-Jaro, dan perluasan kemitraan industri nasional maupun multinasional.
                </p>
            </div>

            <!-- 6. BAB II PERENCANAAN KINERJA -->
            <div class="p-8 bg-white border border-slate-200 space-y-4" style="page-break-after: always;">
                <h3 class="text-center text-base font-bold uppercase">BAB II<br>PERENCANAAN KINERJA</h3>
                <h4 class="font-bold">2.1 Perjanjian Kinerja Tahun ${esc(yr)}</h4>
                <p class="text-justify indent-8">
                    Perjanjian Kinerja Politeknik Industri Petrokimia Banten Tahun ${esc(yr)} merupakan komitmen kinerja Direktur kepada Kepala Badan Pengembangan Sumber Daya Manusia Industri (BPSDMI) Kementerian Perindustrian dengan rincian sasaran dan indikator kinerja sebagai berikut:
                </p>
                <table class="w-full border-collapse border border-slate-800 text-[10pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5 w-14">Kode</th>
                            <th class="border border-slate-800 p-1.5">Sasaran Program / Kegiatan</th>
                            <th class="border border-slate-800 p-1.5">Indikator Kinerja</th>
                            <th class="border border-slate-800 p-1.5 w-24">Target</th>
                            <th class="border border-slate-800 p-1.5 w-24">Satuan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${indicators.length === 0
                            ? `<tr><td colspan="5" class="border border-slate-800 p-3 text-center italic text-slate-500">Belum ada data Perjanjian Kinerja pada database.</td></tr>`
                            : indicators.map(it => `
                            <tr>
                                <td class="border border-slate-800 p-1.5 text-center font-bold">${esc(it.kodeSk)}</td>
                                <td class="border border-slate-800 p-1.5">${esc(it.sasaran)}</td>
                                <td class="border border-slate-800 p-1.5">${esc(it.indikator)}</td>
                                <td class="border border-slate-800 p-1.5 text-center font-semibold">${fmtNum(it.target)}</td>
                                <td class="border border-slate-800 p-1.5 text-center">${esc(it.satuan)}</td>
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

                <h4 class="font-bold pt-4">3.2 Realisasi Anggaran Tahun ${esc(yr)}</h4>
                <table class="w-full border-collapse border border-slate-800 text-[10pt]">
                    <thead>
                        <tr class="bg-slate-100 font-bold text-center">
                            <th class="border border-slate-800 p-1.5">Uraian Anggaran</th>
                            <th class="border border-slate-800 p-1.5">Pagu DIPA</th>
                            <th class="border border-slate-800 p-1.5">Realisasi</th>
                            <th class="border border-slate-800 p-1.5">Sisa Anggaran</th>
                            <th class="border border-slate-800 p-1.5">% Serapan</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-slate-800 p-1.5 font-semibold">Total Anggaran Politeknik Industri Petrokimia Banten</td>
                            <td class="border border-slate-800 p-1.5 text-right">${fmtRp(cfg.paguDipaTotal)}</td>
                            <td class="border border-slate-800 p-1.5 text-right font-bold">${fmtRp(cfg.realisasiAnggaranTotal)}</td>
                            <td class="border border-slate-800 p-1.5 text-right">${fmtRp(Math.max(0, cfg.paguDipaTotal - cfg.realisasiAnggaranTotal))}</td>
                            <td class="border border-slate-800 p-1.5 text-center font-bold">${fmtNum(pctDipa)}%</td>
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
            <div class="p-8 bg-white border border-slate-200 space-y-4">
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
        </div>
        `;
    }

    window.generateAndPrintCompleteLakip = async function () {
        const cfg = getOrInitLakipConfig(_lakipYear);
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
        const ws = document.getElementById(WORKSPACE_ID);
        if (!ws) return;
        ws.classList.remove('hidden');
        window.renderLakipWorkspace();
        ws.scrollIntoView({ behavior: 'smooth' });
    };

    window.renderLakipWorkspace = function () {
        const ws = document.getElementById(WORKSPACE_ID);
        if (!ws) return;
        const cfg = getOrInitLakipConfig(_lakipYear);
        const indicators = cfg.indicators || [];
        const selInd = indicators[_lakipSelectedIndIdx] || indicators[0] || null;

        ws.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 space-y-5 mt-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-4">
                    <div>
                        <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold uppercase">Generator Laporan Kinerja Instansi Pemerintah (LAKIP)</span>
                        <h3 class="text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-blue-700"></i> Penyusunan LAKIP Otomatis + Analisis Kualitatif AI
                        </h3>
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        <select onchange="changeLakipYear(this.value)" class="p-2 bg-slate-50 border rounded-xl font-bold">
                            ${['2025', '2026', '2027', '2028', '2029'].map(y => `<option value="${y}" ${_lakipYear === y ? 'selected' : ''}>Tahun ${y}</option>`).join('')}
                        </select>
                        <button type="button" onclick="resyncLakipFromKiJaro()" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold">
                            <i class="fa-solid fa-arrows-rotate mr-1"></i>Tarik Ulang Data Ki-Jaro
                        </button>
                        <button type="button" id="btnLakipAiAll" onclick="runAiAnalyzeAllSections()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Generate Analisis AI Semua Bab
                        </button>
                        <button type="button" onclick="generateAndPrintCompleteLakip()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow">
                            <i class="fa-solid fa-file-pdf mr-1"></i>Cetak / Download PDF LAKIP Utuh
                        </button>
                    </div>
                </div>

                <!-- Navigasi 4 Tahap Penyusunan LAKIP -->
                <div class="flex flex-wrap gap-2 border-b pb-3 text-xs font-bold">
                    <button type="button" onclick="switchLakipTab('sync')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'sync' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">1. Data Umum, Anggaran & IKU Ki-Jaro</button>
                    <button type="button" onclick="switchLakipTab('bench')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'bench' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">2. Input Pembanding BPSDMI & Satker</button>
                    <button type="button" onclick="switchLakipTab('ai')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'ai' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">3. Editor Narasi Kualitatif & AI</button>
                    <button type="button" onclick="switchLakipTab('lampiran')" class="px-3.5 py-2 rounded-xl cursor-pointer ${_lakipActiveTab === 'lampiran' ? 'bg-blue-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}">4. Lampiran Bukti Dukung & Pratinjau</button>
                </div>

                ${_lakipActiveTab === 'sync' ? `
                <div class="space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border">
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Nomor Nota Dinas</label>
                            <input type="text" value="${esc(cfg.nomorNotaDinas)}" placeholder="Contoh: B/12/BPSDMI/PIPB/..." onchange="saveLakipField('nomorNotaDinas', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Tanggal Pengesahan</label>
                            <input type="text" value="${esc(cfg.tanggalPengesahan)}" onchange="saveLakipField('tanggalPengesahan', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Pagu DIPA (Rp)</label>
                            <input type="number" value="${cfg.paguDipaTotal || 0}" onchange="saveLakipField('paguDipaTotal', Number(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Total Realisasi Anggaran (Rp)</label>
                            <input type="number" value="${cfg.realisasiAnggaranTotal || 0}" onchange="saveLakipField('realisasiAnggaranTotal', Number(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
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
                                            <p class="text-[11px]">Setelah data Perencanaan dan Capaian Triwulan 4 diinput pada database utama (atau setelah merge ke <code>main</code>), klik tombol <strong>Tarik Ulang Data Ki-Jaro</strong> di atas untuk memuat seluruh data secara otomatis.</p>
                                        </td>
                                    </tr>
                                ` : indicators.map((it, idx) => `
                                    <tr>
                                        <td class="p-2 font-bold">${esc(it.kodeSk)}</td>
                                        <td class="p-2 font-semibold text-slate-800">${esc(it.indikator)} <span class="text-[10px] text-slate-500">(${esc(it.satuan)})</span></td>
                                        <td class="p-2"><input type="number" step="any" value="${it.target}" onchange="saveLakipIndicatorField(${idx}, 'target', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
                                        <td class="p-2"><input type="number" step="any" value="${it.realisasi}" onchange="saveLakipIndicatorField(${idx}, 'realisasi', parseFloat(this.value))" class="w-full p-1 border rounded text-center font-bold"></td>
                                        <td class="p-2"><input type="number" step="any" value="${it.realisasiPrevYear}" onchange="saveLakipIndicatorField(${idx}, 'realisasiPrevYear', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
                                        <td class="p-2"><input type="number" step="any" value="${it.targetRenstra2029}" onchange="saveLakipIndicatorField(${idx}, 'targetRenstra2029', parseFloat(this.value))" class="w-full p-1 border rounded text-center"></td>
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
                            <input type="number" step="any" value="${selInd.targetNasionalBpsdmi}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'targetNasionalBpsdmi', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg font-bold">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Pembanding Poltek Luar Kemenperin (Opsional)</label>
                            <input type="text" value="${esc(selInd.pembandingLuar || '')}" placeholder="Contoh: Politeknik KP Jembrana (88,5%)" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'pembandingLuar', this.value)" class="w-full p-2 bg-white border rounded-lg">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Pagu Anggaran Indikator (Rp)</label>
                            <input type="number" value="${selInd.paguAnggaran}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'paguAnggaran', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                        <div>
                            <label class="block font-bold text-slate-700 mb-1">Realisasi Anggaran Indikator (Rp)</label>
                            <input type="number" value="${selInd.realisasiAnggaran}" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'realisasiAnggaran', parseFloat(this.value))" class="w-full p-2 bg-white border rounded-lg font-mono">
                        </div>
                    </div>

                    <div class="border rounded-xl overflow-hidden">
                        <div class="bg-slate-100 p-2.5 font-bold text-slate-800 border-b">Input Nilai Capaian Satker Poltek / Akademi Komunitas di Bawah BPSDMI</div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                            ${(selInd.satkerBpsdmiData || []).map((s, sIdx) => `
                                <div class="flex items-center justify-between gap-2 p-2 border rounded-lg ${s.satker === 'Politeknik Industri Petrokimia Banten' ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white'}">
                                    <span class="truncate">${esc(s.satker)}</span>
                                    <input type="number" step="any" value="${esc(s.nilai)}" placeholder="-" onchange="saveLakipSatkerValue(${_lakipSelectedIndIdx}, ${sIdx}, this.value)" class="w-24 p-1 border rounded text-center">
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
                        <input type="password" value="${esc(cfg.geminiApiKey || '')}" placeholder="Opsional: Gemini API Key Gratis..." onchange="saveLakipField('geminiApiKey', this.value)" class="p-2 bg-white border rounded-lg w-full md:w-64">
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
                        <button type="button" id="btnLakipAiSingle" onclick="runAiAnalyzeSingleIndicator(${_lakipSelectedIndIdx})" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                            <i class="fa-solid fa-wand-magic-sparkles mr-1"></i>Generate Narasi Indikator Ini
                        </button>
                    </div>

                    <div>
                        <label class="block font-bold text-slate-800 mb-1">Narasi Kualitatif Bab 3.1.${_lakipSelectedIndIdx + 1} (Dapat Diedit Manual Sebelum Cetak)</label>
                        <textarea rows="9" onchange="saveLakipIndicatorField(${_lakipSelectedIndIdx}, 'aiNarrative', this.value)" class="w-full p-3 border rounded-xl leading-relaxed">${esc(selInd.aiNarrative || buildDeterministicQualitativeAnalysis(selInd, _lakipYear))}</textarea>
                    </div>
                    `}

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Narasi Ringkasan Eksekutif</label>
                            <textarea rows="5" onchange="saveLakipField('ringkasanEksekutifText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.ringkasanEksekutifText || '')}</textarea>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Narasi Bab IV Penutup (Kesimpulan & Saran)</label>
                            <textarea rows="5" onchange="saveLakipField('bab4PenutupText', this.value)" class="w-full p-2.5 border rounded-xl">${esc(cfg.bab4PenutupText || '')}</textarea>
                        </div>
                    </div>
                </div>
                ` : ''}

                ${_lakipActiveTab === 'lampiran' ? `
                <div class="space-y-4 text-xs">
                    <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                        <p class="font-bold text-emerald-950">Lampiran Bukti Dukung per Indikator (Akan Digabung Otomatis di Akhir Laporan LAKIP)</p>
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

                    <div class="border rounded-2xl p-4 bg-slate-50 max-h-[520px] overflow-y-auto">
                        ${buildFullLakipDocumentHtml(cfg)}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    };

    function injectLakipEntryPoint() {
        const headerTitle = document.querySelector('header h1, header h2');
        const mainEl = document.getElementById('mainContent') || document.querySelector('main > div:last-child') || document.querySelector('main');
        if (!headerTitle || !mainEl) return;

        const titleText = (headerTitle.textContent || '').toLowerCase();
        const isPengukuranPage = titleText.includes('dokumen pengukuran') || titleText.includes('pelaporan');
        if (!isPengukuranPage) return;

        if (!document.getElementById(PANEL_ID)) {
            const banner = document.createElement('div');
            banner.id = PANEL_ID;
            banner.className = 'bg-gradient-to-r from-blue-800 to-indigo-800 text-white rounded-2xl p-5 mb-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4';
            banner.innerHTML = `
                <div class="space-y-1">
                    <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Fitur Otomatis Terintegrasi Ki-Jaro</span>
                    <h3 class="text-base font-bold flex items-center gap-2">
                        <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i> Generator Laporan LAKIP (Cover s.d. Bab IV + Analisis AI + Merge Lampiran)
                    </h3>
                    <p class="text-xs text-blue-100">Susun dokumen LAKIP Politeknik Industri Petrokimia Banten langsung dari data capaian triwulanan Ki-Jaro, lengkap dengan analisis kualitatif AI, komparasi target BPSDMI, dan penggabungan lampiran.</p>
                </div>
                <button type="button" onclick="openLakipGeneratorWorkspace()" class="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-bold text-xs shadow shrink-0">
                    <i class="fa-solid fa-file-export mr-1.5"></i>Buka Generator LAKIP
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
