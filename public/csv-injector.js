// =========================================================================
// MODUL INJECT / IMPORT DATA CSV TERPADU + LOG DETAIL PER BARIS (KI-JARO)
// 1. Gabungan Perencanaan Strategis (Tier 1, Tier 2, Tier 3, Tier 4 + Target & Pagu 2025-2029)
// 2. Gabungan Cascading Kinerja (Level 1 Ketua Tim, Level 2 Unit/Prodi, Level 3 Staf/Dosen/Tendik)
// 3. Rencana Hasil Kerja (RHK) & Indikator Kinerja Individu (IKI) Staf
// =========================================================================
(function () {
    const MENU_BTN_ID = 'kiJaroCsvInjectNavBtn';
    const MODAL_ID = 'kiJaroCsvInjectModal';
    const YEARS = ['2025', '2026', '2027', '2028', '2029'];

    const CSV_SCHEMAS = {
        perencanaan_terpadu: {
            label: '1. Perencanaan Strategis Lengkap (Tier 1, Tier 2, Tier 3, Tier 4 + Target & Pagu 2025-2029)',
            filename: 'template_1_perencanaan_tier1_sd_tier4_lengkap.csv',
            description: 'Cukup 1 file CSV untuk mengisi Tier 1 (Kemenperin), Tier 2 (BPSDMI), Tier 3 (Tujuan/Sasaran), dan Tier 4 (Indikator + Target & Pagu 2025–2029) sekaligus. Baris dengan kode Tier 1/2/3 yang sama otomatis digabung tanpa duplikat.',
            headers: [
                'kode_tier1', 'uraian_tier1_kemenperin',
                'kode_tier2', 'sasaran_program_tier2_bpsdmi', 'indikator_tier2_bpsdmi',
                'kode_tier3', 'jenis_tier3', 'sasaran_kinerja_tier3',
                'kode_tier4', 'nama_indikator_tier4', 'satuan',
                'target_2025', 'pagu_2025',
                'target_2026', 'pagu_2026',
                'target_2027', 'pagu_2027',
                'target_2028', 'pagu_2028',
                'target_2029', 'pagu_2029'
            ],
            sample: [
                [
                    'TS-1', 'Meningkatnya Daya Saing Industri Nasional yang Berkelanjutan',
                    'SP-1', 'Meningkatnya Ketersediaan SDM Industri yang Kompeten', 'Persentase SDM Industri yang kompeten',
                    'TJ 1', 'Tujuan', 'Meningkatnya Peran SDM Industri dalam Perekonomian Nasional melalui unit pendidikan tinggi vokasi',
                    'TJ 1', 'Persentase SDM Industri yang kompeten*', '%',
                    '90', '0', '90.5', '0', '91', '0', '91.5', '0', '92', '0'
                ],
                [
                    'TS-1', 'Meningkatnya Daya Saing Industri Nasional yang Berkelanjutan',
                    'SP-1', 'Meningkatnya Ketersediaan SDM Industri yang Kompeten', 'Persentase SDM Industri yang kompeten',
                    'SK 1', 'Sasaran Kinerja', 'Terfasilitasinya peningkatan kompetensi sumber daya manusia industri dalam mendukung penumbuhan sektor industri melalui unit pendidikan tinggi vokasi',
                    'IK 1.1', 'Persentase lulusan peserta didik yang bekerja dan mempunyai kompetensi bidang industri*', '%',
                    '0', '795584000', '90', '0', '90.5', '0', '91', '0', '91.5', '0'
                ],
                [
                    'TS-1', 'Meningkatnya Daya Saing Industri Nasional yang Berkelanjutan',
                    'SP-1', 'Meningkatnya Ketersediaan SDM Industri yang Kompeten', 'Persentase SDM Industri yang kompeten',
                    'TJ 1', 'Tujuan', 'Meningkatnya Peran SDM Industri dalam Perekonomian Nasional melalui unit pendidikan tinggi vokasi',
                    'IK 1.2', 'Wirausaha baru hasil inkubator bisnis industri yang tumbuh', 'Tenant',
                    '1', '7200000', '1', '0', '1', '60000', '2', '0', '2', '0'
                ]
            ]
        },
        cascading_terpadu: {
            label: '2. Cascading Kinerja Lengkap (Level 1 Ketua Tim, Level 2 Unit/Prodi, Level 3 Dosen/Tendik/Kalab/Koord)',
            filename: 'template_2_cascading_level1_sd_level3.csv',
            description: 'Cukup 1 file CSV untuk seluruh jenjang Cascading. Isi kolom "level_cascading" dengan angka 1 (Ketua Tim Kerja), 2 (Ketua Unit/Prodi/Subbag), atau 3 (Dosen/Tendik/Sekretaris/Kalab/Koordinator).',
            headers: [
                'tahun', 'level_cascading', 'kode_indikator_induk', 'nama_unit_atau_tim',
                'username_pegawai', 'jabatan_peran', 'rencana_aksi_atau_rhk',
                'indikator_kinerja', 'satuan', 'target_tahunan', 'tw1', 'tw2', 'tw3', 'tw4'
            ],
            sample: [
                ['2025', '1', 'IK 1.1', 'Tim Kerja Akademik & Kemahasiswaan', 'ketuatim1', 'Ketua Tim Kerja', 'Meningkatkan serapan lulusan bersertifikat kompetensi industri', 'Persentase lulusan terserap industri', '%', '90', '0', '0', '45', '90'],
                ['2025', '2', 'IK 1.1', 'Prodi D3 Teknologi Proses Industri Petrokimia', 'kaprodi_tpip', 'Ketua Prodi', 'Pelaksanaan uji kompetensi LSP & rekrutmen industri mitra', 'Persentase lulusan TPIP terserap industri', '%', '92', '0', '0', '50', '92'],
                ['2025', '3', 'IK 1.1', 'Prodi D3 Teknologi Proses Industri Petrokimia', 'deni.saputra', 'Dosen', 'Membimbing tugas akhir mahasiswa berbasis kasus nyata industri petrokimia', 'Jumlah mahasiswa bimbingan lulus tepat waktu dan tersertifikasi', 'Mahasiswa', '12', '3', '6', '9', '12']
            ]
        },
        rhk_iki: {
            label: '3. Rencana Hasil Kerja (RHK) & Indikator Kinerja Individu (IKI) Staf',
            filename: 'template_3_rhk_iki_staf.csv',
            description: 'Untuk meng-inject RHK (Utama/Tambahan) beserta Indikator Kinerja Individu (IKI) dan realisasi triwulanan staf.',
            headers: [
                'tahun', 'username_pegawai', 'kode_ik_atasan', 'jenis_rhk',
                'rencana_hasil_kerja', 'aspek', 'indikator_kinerja_individu',
                'satuan', 'target_tahunan', 'realisasi_tw1', 'realisasi_tw2', 'realisasi_tw3', 'realisasi_tw4'
            ],
            sample: [
                ['2025', 'deni.saputra', 'IK 3.3', 'Utama', 'Terpublikasinya artikel penelitian terapan bidang teknik industri / petrokimia pada jurnal bereputasi', 'Kuantitas', 'Jumlah artikel ilmiah terpublikasi pada jurnal Sinta 2 / Internasional', 'Artikel', '2', '0', '1', '1', '2']
            ]
        }
    };

    let _selectedSchemaKey = 'perencanaan_terpadu';
    let _importLogs = [];
    let _importSummary = null;

    function esc(str) {
        if (typeof sanitizeHTML === 'function') return sanitizeHTML(String(str ?? ''));
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function canAccessCsvInjector() {
        let u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
        if (!u) {
            try {
                const raw = localStorage.getItem('kijaro_user') || sessionStorage.getItem('kijaro_user');
                if (raw) u = JSON.parse(raw);
            } catch (_) {}
        }
        if (!u) return true;
        const roles = (Array.isArray(u.roles) ? u.roles : [u.role, u.jabatan, u.unit])
            .filter(Boolean).map(r => String(r).toLowerCase());
        return roles.some(r =>
            r.includes('admin') || r.includes('program') || r.includes('evaluasi') ||
            r.includes('perencanaan') || r.includes('direktur') || r.includes('ketua')
        );
    }

    function cleanNumber(val) {
        if (val === undefined || val === null) return 0;
        let s = String(val).trim();
        if (s === '' || s === '-') return 0;
        s = s.replace(/^rp\.?\s*/i, '').trim();
        if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
            s = s.replace(/\./g, '');
        } else {
            s = s.replace(/,/g, '.');
        }
        if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
        return parseFloat(s);
    }

    function parseCsvText(rawText) {
        const text = String(rawText || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = [];
        let curRow = [];
        let curCell = '';
        let inQuotes = false;

        const firstLine = text.split('\n')[0] || '';
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semiCount = (firstLine.match(/;/g) || []).length;
        const delimiter = semiCount > commaCount ? ';' : ',';

        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const nextCh = text[i + 1];

            if (ch === '"') {
                if (inQuotes && nextCh === '"') {
                    curCell += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === delimiter && !inQuotes) {
                curRow.push(curCell.trim());
                curCell = '';
            } else if (ch === '\n' && !inQuotes) {
                curRow.push(curCell.trim());
                if (curRow.some(c => c !== '')) lines.push(curRow);
                curRow = [];
                curCell = '';
            } else {
                curCell += ch;
            }
        }
        if (curCell.length > 0 || curRow.length > 0) {
            curRow.push(curCell.trim());
            if (curRow.some(c => c !== '')) lines.push(curRow);
        }

        if (lines.length === 0) return { headers: [], rows: [], delimiter };
        const headers = lines[0].map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
        const rows = lines.slice(1).map((cells, idx) => {
            const obj = {};
            headers.forEach((h, cIdx) => {
                obj[h] = cells[cIdx] !== undefined ? cells[cIdx].trim() : '';
            });
            return { rowNumber: idx + 2, rawCells: cells, data: obj };
        });

        return { headers, rows, delimiter };
    }

    function ensureDbCollections() {
        if (typeof DB !== 'object' || !DB) window.DB = {};
        if (!Array.isArray(DB.tier1Kemenperin)) DB.tier1Kemenperin = [];
        if (!Array.isArray(DB.tier2Bpsdmi)) DB.tier2Bpsdmi = [];
        if (!Array.isArray(DB.sasaranKinerja)) DB.sasaranKinerja = [];
        if (!Array.isArray(DB.indikatorKinerja)) DB.indikatorKinerja = [];
        if (!Array.isArray(DB.cascading)) DB.cascading = [];
        if (!Array.isArray(DB.rhkPegawai)) DB.rhkPegawai = [];
        if (!Array.isArray(DB.users)) DB.users = [];
    }

    function findUserByUsernameOrName(identifier) {
        const q = String(identifier || '').trim().toLowerCase();
        if (!q) return null;
        return (DB.users || []).find(u =>
            String(u.username || '').toLowerCase() === q ||
            String(u.nip || '').toLowerCase() === q ||
            String(u.name || '').toLowerCase() === q
        ) || null;
    }

    function upsertRecord(arr, matchFn, newRecord) {
        const existingIdx = arr.findIndex(matchFn);
        if (existingIdx >= 0) {
            const existingId = arr[existingIdx].id;
            arr[existingIdx] = { ...arr[existingIdx], ...newRecord, id: existingId };
            return { status: 'UPDATED', id: existingId };
        } else {
            const newId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            arr.push({ id: newId, ...newRecord });
            return { status: 'INSERTED', id: newId };
        }
    }

    // =========================================================================
    // VALIDATOR & INJECTOR TERPADU
    // =========================================================================
    function validateAndInjectRows(schemaKey, parsed) {
        ensureDbCollections();
        const schema = CSV_SCHEMAS[schemaKey];
        const logs = [];
        let successCount = 0;
        let failCount = 0;

        const missingHeaders = schema.headers.filter(h => !parsed.headers.includes(h));
        if (missingHeaders.length > 0) {
            return {
                fatalError: `Header kolom CSV tidak sesuai template! Kolom yang hilang: [${missingHeaders.join(', ')}]. Silakan unduh template CSV terbaru.`,
                logs: [],
                successCount: 0,
                failCount: parsed.rows.length
            };
        }

        parsed.rows.forEach(({ rowNumber, data }) => {
            const errors = [];
            let detailActions = [];
            let summaryLabel = '';

            if (schemaKey === 'perencanaan_terpadu') {
                // Validasi kolom utama Tier 3 & Tier 4 (wajib), sementara Tier 1 & Tier 2 opsional jika baris kosong
                if (!data.kode_tier3) errors.push('Kolom "kode_tier3" wajib diisi (contoh: TJ 1 atau SK 1)');
                if (!data.sasaran_kinerja_tier3) errors.push('Kolom "sasaran_kinerja_tier3" wajib diisi');
                if (!data.kode_tier4) errors.push('Kolom "kode_tier4" wajib diisi (contoh: IK 1.1)');
                if (!data.nama_indikator_tier4) errors.push('Kolom "nama_indikator_tier4" wajib diisi');
                if (!data.satuan) errors.push('Kolom "satuan" wajib diisi');

                const targetsByYear = {};
                const paguByYear = {};
                YEARS.forEach(y => {
                    const tVal = cleanNumber(data[`target_${y}`]);
                    const pVal = cleanNumber(data[`pagu_${y}`]);
                    if (Number.isNaN(tVal)) errors.push(`Kolom "target_${y}" bukan angka valid ("${data[`target_${y}`]}")`);
                    else targetsByYear[y] = tVal;

                    if (Number.isNaN(pVal)) errors.push(`Kolom "pagu_${y}" bukan angka rupiah valid ("${data[`pagu_${y}`]}")`);
                    else paguByYear[y] = pVal;
                });

                summaryLabel = `${data.kode_tier4 || '-'} — ${data.nama_indikator_tier4 || '(Kosong)'}`;

                if (errors.length === 0) {
                    // 1A. Upsert Tier 1 (jika diisi)
                    let t1Id = '';
                    if (data.kode_tier1 || data.uraian_tier1_kemenperin) {
                        const k1 = data.kode_tier1 || 'TS-1';
                        const u1 = data.uraian_tier1_kemenperin || k1;
                        const res1 = upsertRecord(
                            DB.tier1Kemenperin,
                            r => String(r.kode || '').toLowerCase() === k1.toLowerCase(),
                            { tier: 1, kode: k1, uraian: u1, tujuanSasaran: u1, tahunAwal: '2025', tahunAkhir: '2029' }
                        );
                        t1Id = res1.id;
                        detailActions.push(`Tier 1 (${k1}: ${res1.status})`);
                    }

                    // 1B. Upsert Tier 2 (jika diisi)
                    let t2Id = '';
                    if (data.kode_tier2 || data.sasaran_program_tier2_bpsdmi || data.indikator_tier2_bpsdmi) {
                        const k2 = data.kode_tier2 || 'SP-1';
                        const sp2 = data.sasaran_program_tier2_bpsdmi || k2;
                        const ik2 = data.indikator_tier2_bpsdmi || sp2;
                        const res2 = upsertRecord(
                            DB.tier2Bpsdmi,
                            r => String(r.kode || '').toLowerCase() === k2.toLowerCase() &&
                                 String(r.indikatorProgram || '').toLowerCase() === ik2.toLowerCase(),
                            {
                                tier: 2,
                                tier1Id: t1Id,
                                kodeTier1: data.kode_tier1 || '',
                                kode: k2,
                                sasaranProgram: sp2,
                                indikatorProgram: ik2,
                                satuan: data.satuan
                            }
                        );
                        t2Id = res2.id;
                        detailActions.push(`Tier 2 (${k2}: ${res2.status})`);
                    }

                    // 1C. Upsert Tier 3 (Tujuan / Sasaran Kinerja)
                    const k3 = data.kode_tier3;
                    const s3 = data.sasaran_kinerja_tier3;
                    const j3 = data.jenis_tier3 || (k3.toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja');
                    const res3 = upsertRecord(
                        DB.sasaranKinerja,
                        r => String(r.kode || '').toLowerCase() === k3.toLowerCase(),
                        {
                            tier: 3,
                            tier2Id: t2Id,
                            kodeTier2: data.kode_tier2 || '',
                            kode: k3,
                            jenis: j3,
                            sasaranKinerja: s3,
                            sasaran: s3
                        }
                    );
                    detailActions.push(`Tier 3 (${k3}: ${res3.status})`);

                    // 1D. Upsert Tier 4 (Indikator Kinerja + Target 5 Tahun & Pagu)
                    const sasaranLabel = `${k3} - ${s3}`;
                    const res4 = upsertRecord(
                        DB.indikatorKinerja,
                        r => String(r.kode || '').toLowerCase() === data.kode_tier4.toLowerCase() &&
                             String(r.namaIndikator || r.indikator || '').toLowerCase() === data.nama_indikator_tier4.toLowerCase(),
                        {
                            tier: 4,
                            sasaranId: res3.id,
                            kodeTier3: k3,
                            sasaranKinerja: sasaranLabel,
                            kode: data.kode_tier4,
                            namaIndikator: data.nama_indikator_tier4,
                            indikator: data.nama_indikator_tier4,
                            satuan: data.satuan,
                            targetsByYear,
                            paguByYear,
                            target2025: targetsByYear['2025'],
                            pagu2025: paguByYear['2025'],
                            target2026: targetsByYear['2026'],
                            pagu2026: paguByYear['2026'],
                            target2027: targetsByYear['2027'],
                            pagu2027: paguByYear['2027'],
                            target2028: targetsByYear['2028'],
                            pagu2028: paguByYear['2028'],
                            target2029: targetsByYear['2029'],
                            pagu2029: paguByYear['2029'],
                            target: targetsByYear['2025'],
                            pagu: paguByYear['2025']
                        }
                    );
                    detailActions.push(`Tier 4 (${data.kode_tier4}: ${res4.status})`);
                }
            } else if (schemaKey === 'cascading_terpadu') {
                const yr = data.tahun || '2025';
                if (!/^\d{4}$/.test(yr)) errors.push(`Kolom "tahun" harus 4 digit (nilai: "${yr}")`);

                const lvl = parseInt(data.level_cascading, 10);
                if (![1, 2, 3].includes(lvl)) {
                    errors.push(`Kolom "level_cascading" harus diisi angka 1, 2, atau 3 (nilai: "${data.level_cascading}")`);
                }

                if (!data.kode_indikator_induk) errors.push('Kolom "kode_indikator_induk" wajib diisi');
                if (!data.username_pegawai) errors.push('Kolom "username_pegawai" wajib diisi');

                const matchedUser = findUserByUsernameOrName(data.username_pegawai);
                if (data.username_pegawai && (DB.users || []).length > 0 && !matchedUser) {
                    errors.push(`Username/NIP/Nama "${data.username_pegawai}" tidak terdaftar di master Pegawai Ki-Jaro`);
                }

                if (!data.indikator_kinerja) errors.push('Kolom "indikator_kinerja" wajib diisi');

                const tTahunan = cleanNumber(data.target_tahunan);
                const tw1 = cleanNumber(data.tw1);
                const tw2 = cleanNumber(data.tw2);
                const tw3 = cleanNumber(data.tw3);
                const tw4 = cleanNumber(data.tw4);
                if (Number.isNaN(tTahunan)) errors.push(`"target_tahunan" harus berupa angka ("${data.target_tahunan}")`);
                if ([tw1, tw2, tw3, tw4].some(v => Number.isNaN(v))) errors.push('Target TW1 s.d. TW4 harus berupa angka valid');

                summaryLabel = `Level ${lvl || '?'} | ${data.username_pegawai || '-'} — ${data.indikator_kinerja || '(Kosong)'}`;
                if (errors.length === 0) {
                    const defaultRole = lvl === 1 ? 'Ketua Tim Kerja' : (lvl === 2 ? 'Ketua Unit / Prodi / Subbag' : 'Dosen / Tendik / Kalab / Koordinator');
                    const res = upsertRecord(
                        DB.cascading,
                        r => Number(r.level) === lvl &&
                             String(r.tahun) === yr &&
                             String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : data.username_pegawai).toLowerCase() &&
                             String(r.indikator || '').toLowerCase() === data.indikator_kinerja.toLowerCase(),
                        {
                            level: lvl,
                            tahun: yr,
                            kodeIndikatorInduk: data.kode_indikator_induk,
                            unit: data.nama_unit_atau_tim || (matchedUser?.unit || ''),
                            jabatanPeran: data.jabatan_peran || defaultRole,
                            pegawaiUsername: matchedUser ? matchedUser.username : data.username_pegawai,
                            namaPegawai: matchedUser ? matchedUser.name : data.username_pegawai,
                            rencanaAksi: data.rencana_aksi_atau_rhk || '',
                            indikator: data.indikator_kinerja,
                            satuan: data.satuan || '%',
                            target: tTahunan,
                            targetTw1: tw1,
                            targetTw2: tw2,
                            targetTw3: tw3,
                            targetTw4: tw4
                        }
                    );
                    detailActions.push(`Cascading Level ${lvl}: ${res.status}`);
                }
            } else if (schemaKey === 'rhk_iki') {
                const yr = data.tahun || '2025';
                if (!/^\d{4}$/.test(yr)) errors.push(`Kolom "tahun" harus 4 digit (nilai: "${yr}")`);
                if (!data.username_pegawai) errors.push('Kolom "username_pegawai" wajib diisi');

                const matchedUser = findUserByUsernameOrName(data.username_pegawai);
                if (data.username_pegawai && (DB.users || []).length > 0 && !matchedUser) {
                    errors.push(`Pegawai "${data.username_pegawai}" tidak ditemukan di master Pegawai Ki-Jaro`);
                }

                if (!data.rencana_hasil_kerja) errors.push('Kolom "rencana_hasil_kerja" wajib diisi');
                if (!data.indikator_kinerja_individu) errors.push('Kolom "indikator_kinerja_individu" wajib diisi');

                const tTahunan = cleanNumber(data.target_tahunan);
                const rTw1 = cleanNumber(data.realisasi_tw1);
                const rTw2 = cleanNumber(data.realisasi_tw2);
                const rTw3 = cleanNumber(data.realisasi_tw3);
                const rTw4 = cleanNumber(data.realisasi_tw4);
                if (Number.isNaN(tTahunan)) errors.push(`"target_tahunan" harus berupa angka ("${data.target_tahunan}")`);
                if ([rTw1, rTw2, rTw3, rTw4].some(v => Number.isNaN(v))) errors.push('Realisasi TW1 s.d. TW4 harus berupa angka valid');

                summaryLabel = `${data.username_pegawai || '-'} — ${data.indikator_kinerja_individu || '(Kosong)'}`;
                if (errors.length === 0) {
                    const res = upsertRecord(
                        DB.rhkPegawai,
                        r => String(r.tahun) === yr &&
                             String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : data.username_pegawai).toLowerCase() &&
                             String(r.indikator || '').toLowerCase() === data.indikator_kinerja_individu.toLowerCase(),
                        {
                            tahun: yr,
                            pegawaiUsername: matchedUser ? matchedUser.username : data.username_pegawai,
                            namaPegawai: matchedUser ? matchedUser.name : data.username_pegawai,
                            unit: matchedUser ? (matchedUser.unit || '') : '',
                            kodeIkAtasan: data.kode_ik_atasan || '',
                            jenisRhk: data.jenis_rhk || 'Utama',
                            rhk: data.rencana_hasil_kerja,
                            aspek: data.aspek || 'Kuantitas',
                            indikator: data.indikator_kinerja_individu,
                            satuan: data.satuan || 'Dokumen',
                            target: tTahunan,
                            realisasiTw1: rTw1,
                            realisasiTw2: rTw2,
                            realisasiTw3: rTw3,
                            realisasiTw4: rTw4
                        }
                    );
                    detailActions.push(`RHK & IKI Staf: ${res.status}`);
                }
            }

            if (errors.length > 0) {
                failCount++;
                logs.push({
                    rowNumber,
                    status: 'GAGAL',
                    summary: summaryLabel,
                    detail: errors.join('; ')
                });
            } else {
                successCount++;
                logs.push({
                    rowNumber,
                    status: 'BERHASIL',
                    summary: summaryLabel,
                    detail: `Berhasil diproses: ${detailActions.join(' | ')}`
                });
            }
        });

        return { fatalError: null, logs, successCount, failCount };
    }

    // =========================================================================
    // AKSI UI: DOWNLOAD TEMPLATE, PROSES UPLOAD CSV, EXPORT LOG CSV
    // =========================================================================
    window.changeCsvInjectorSchema = function (key) {
        _selectedSchemaKey = key;
        _importLogs = [];
        _importSummary = null;
        window.renderCsvInjectorModalBody();
    };

    window.downloadSelectedCsvTemplate = function () {
        const schema = CSV_SCHEMAS[_selectedSchemaKey];
        if (!schema) return;
        const lines = [
            schema.headers.join(','),
            ...schema.sample.map(row =>
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            )
        ];
        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = schema.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast(`Template ${schema.filename} berhasil diunduh.`, 'success');
    };

    window.downloadImportExecutionLog = function () {
        if (!_importLogs || _importLogs.length === 0) return;
        const lines = [
            'Baris_CSV,Status,Ringkasan_Data,Keterangan_atau_Letak_Kesalahan',
            ..._importLogs.map(l =>
                [l.rowNumber, l.status, l.summary, l.detail]
                    .map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
            )
        ];
        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `log_import_${_selectedSchemaKey}_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    window.processUploadedCsvFile = function (inputEl) {
        const file = inputEl?.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async function (ev) {
            const rawText = ev.target.result;
            const parsed = parseCsvText(rawText);

            if (parsed.rows.length === 0) {
                _importSummary = {
                    fatalError: 'File CSV kosong atau tidak memiliki baris data di bawah baris header.',
                    total: 0,
                    success: 0,
                    fail: 0
                };
                _importLogs = [];
                window.renderCsvInjectorModalBody();
                if (typeof showToast === 'function') showToast('File CSV kosong atau tidak memiliki baris data!', 'error');
                return;
            }

            const result = validateAndInjectRows(_selectedSchemaKey, parsed);
            _importLogs = result.logs;
            _importSummary = {
                fatalError: result.fatalError,
                fileName: file.name,
                delimiter: parsed.delimiter,
                total: parsed.rows.length,
                success: result.successCount,
                fail: result.failCount
            };

            if (!result.fatalError && result.successCount > 0) {
                if (typeof saveToMySQL === 'function') await saveToMySQL();
                if (typeof renderCurrentView === 'function') renderCurrentView();
            }

            window.renderCsvInjectorModalBody();

            if (typeof showToast === 'function') {
                if (result.fatalError) {
                    showToast('Import CSV Gagal: Struktur kolom tidak sesuai template.', 'error');
                } else if (result.failCount === 0) {
                    showToast(`Sukses 100%! ${result.successCount} baris data berhasil di-inject ke Ki-Jaro.`, 'success');
                } else if (result.successCount > 0) {
                    showToast(`Selesai sebagian: ${result.successCount} berhasil, ${result.failCount} gagal. Cek tabel log di bawah!`, 'info');
                } else {
                    showToast(`Semua data (${result.failCount} baris) gagal divalidasi. Cek detail kesalahan pada tabel log!`, 'error');
                }
            }
            inputEl.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    };

    window.openCsvInjectorModal = function () {
        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = MODAL_ID;
            modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';
            document.body.appendChild(modal);
        }
        modal.classList.remove('hidden');
        window.renderCsvInjectorModalBody();
    };

    window.closeCsvInjectorModal = function () {
        const modal = document.getElementById(MODAL_ID);
        if (modal) modal.classList.add('hidden');
    };

    window.renderCsvInjectorModalBody = function () {
        const modal = document.getElementById(MODAL_ID);
        if (!modal) return;
        const schema = CSV_SCHEMAS[_selectedSchemaKey];

        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" style="font-family: Arial, Helvetica, sans-serif;">
                <div class="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Bulk Data Injector</span>
                        <h3 class="text-base font-bold mt-1 flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-emerald-300"></i> Inject / Import Data Kinerja & Cascading via CSV
                        </h3>
                    </div>
                    <button type="button" onclick="closeCsvInjectorModal()" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white font-bold">&times;</button>
                </div>

                <div class="p-6 overflow-y-auto space-y-5 text-xs">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <label class="block font-bold text-slate-800 text-sm">1. Pilih Paket Data CSV yang Akan Di-inject</label>
                        <div class="flex flex-col md:flex-row gap-3">
                            <select onchange="changeCsvInjectorSchema(this.value)" class="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900">
                                ${Object.entries(CSV_SCHEMAS).map(([k, v]) => `
                                    <option value="${k}" ${_selectedSchemaKey === k ? 'selected' : ''}>${esc(v.label)}</option>
                                `).join('')}
                            </select>
                            <button type="button" onclick="downloadSelectedCsvTemplate()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow shrink-0">
                                <i class="fa-solid fa-download mr-1.5"></i>Unduh Template CSV
                            </button>
                        </div>

                        <p class="text-[11px] text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                            <i class="fa-solid fa-circle-info text-amber-600 mr-1"></i> ${esc(schema.description)}
                        </p>

                        <div class="bg-white border border-blue-100 rounded-lg p-3">
                            <p class="font-bold text-blue-900 mb-1.5">Susunan Kolom Header CSV (${schema.headers.length} Kolom):</p>
                            <div class="flex flex-wrap gap-1.5">
                                ${schema.headers.map(h => `<code class="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-mono text-[11px]">${esc(h)}</code>`).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="bg-blue-50/70 border-2 border-dashed border-blue-300 rounded-xl p-5 text-center space-y-2">
                        <i class="fa-solid fa-cloud-arrow-up text-2xl text-blue-700"></i>
                        <p class="font-bold text-slate-900 text-sm">2. Unggah File CSV untuk Diproses & Divalidasi</p>
                        <p class="text-[11px] text-slate-600">Mendukung pemisah koma (<code>,</code>) maupun titik koma (<code>;</code>) dari Excel / Google Sheets. Setiap baris divalidasi otomatis.</p>
                        <div class="pt-1">
                            <label class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer shadow">
                                <i class="fa-solid fa-upload"></i> Pilih File .CSV & Inject Data
                                <input type="file" accept=".csv,text/csv" onchange="processUploadedCsvFile(this)" class="hidden">
                            </label>
                        </div>
                    </div>

                    ${_importSummary ? `
                    <div class="space-y-3">
                        ${_importSummary.fatalError ? `
                            <div class="bg-rose-50 border-2 border-rose-400 rounded-xl p-4 text-rose-900 space-y-1">
                                <p class="font-bold text-sm flex items-center gap-2">
                                    <i class="fa-solid fa-circle-xmark text-rose-600"></i> Import Dibatalkan — Struktur CSV Tidak Valid
                                </p>
                                <p>${esc(_importSummary.fatalError)}</p>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div class="p-3 bg-slate-100 border rounded-xl">
                                    <p class="text-[11px] text-slate-600">File Diproses</p>
                                    <p class="font-bold text-slate-900 truncate">${esc(_importSummary.fileName)}</p>
                                </div>
                                <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                    <p class="text-[11px] text-blue-800">Total Baris Data</p>
                                    <p class="font-extrabold text-base text-blue-950">${_importSummary.total} Baris</p>
                                </div>
                                <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl">
                                    <p class="text-[11px] text-emerald-800">Berhasil Masuk Database</p>
                                    <p class="font-extrabold text-base text-emerald-700">${_importSummary.success} Baris</p>
                                </div>
                                <div class="p-3 bg-rose-50 border border-rose-300 rounded-xl">
                                    <p class="text-[11px] text-rose-800">Gagal / Perlu Perbaikan</p>
                                    <p class="font-extrabold text-base text-rose-700">${_importSummary.fail} Baris</p>
                                </div>
                            </div>

                            <div class="border border-slate-300 rounded-xl overflow-hidden">
                                <div class="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
                                    <span class="font-bold">Log Status & Audit Validasi per Baris CSV</span>
                                    <button type="button" onclick="downloadImportExecutionLog()" class="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[11px] font-bold">
                                        <i class="fa-solid fa-file-export mr-1"></i>Unduh Log Hasil (.CSV)
                                    </button>
                                </div>
                                <div class="max-h-72 overflow-y-auto">
                                    <table class="w-full text-left border-collapse">
                                        <thead class="bg-slate-100 border-b font-bold sticky top-0">
                                            <tr>
                                                <th class="p-2.5 w-20 text-center">Baris CSV</th>
                                                <th class="p-2.5 w-28 text-center">Status</th>
                                                <th class="p-2.5 w-1/3">Data yang Dimasukkan</th>
                                                <th class="p-2.5">Keterangan / Letak Kesalahan</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y">
                                            ${_importLogs.map(log => `
                                                <tr class="${log.status === 'GAGAL' ? 'bg-rose-50/70' : 'bg-white'}">
                                                    <td class="p-2.5 text-center font-bold">Baris ${log.rowNumber}</td>
                                                    <td class="p-2.5 text-center">
                                                        ${log.status === 'BERHASIL'
                                                            ? '<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px]">BERHASIL</span>'
                                                            : '<span class="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full font-bold text-[10px]">GAGAL</span>'}
                                                    </td>
                                                    <td class="p-2.5 font-semibold text-slate-800">${esc(log.summary)}</td>
                                                    <td class="p-2.5 ${log.status === 'GAGAL' ? 'text-rose-800 font-semibold' : 'text-slate-600'}">${esc(log.detail)}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    function injectCsvMenuButton() {
        if (!canAccessCsvInjector()) return;

        const sidebarNav = document.querySelector('aside nav, #sidebarNav, aside ul');
        if (sidebarNav && !document.getElementById(MENU_BTN_ID)) {
            const btn = document.createElement('button');
            btn.id = MENU_BTN_ID;
            btn.type = 'button';
            btn.onclick = window.openCsvInjectorModal;
            btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 mt-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer';
            btn.innerHTML = `<i class="fa-solid fa-file-csv w-4 text-center"></i><span>Inject Data CSV</span>`;
            sidebarNav.appendChild(btn);
        }

        const headerActions = document.querySelector('header .flex.items-center.gap-2, header > div:last-child');
        if (headerActions && !document.getElementById('kiJaroCsvHeaderQuickBtn')) {
            const quickBtn = document.createElement('button');
            quickBtn.id = 'kiJaroCsvHeaderQuickBtn';
            quickBtn.type = 'button';
            quickBtn.onclick = window.openCsvInjectorModal;
            quickBtn.className = 'px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer';
            quickBtn.innerHTML = `<i class="fa-solid fa-file-csv"></i><span>Import CSV</span>`;
            headerActions.prepend(quickBtn);
        }
    }

    document.addEventListener('DOMContentLoaded', injectCsvMenuButton);
    setInterval(injectCsvMenuButton, 1200);
})();
