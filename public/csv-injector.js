// =========================================================================
// MODUL INJECT / IMPORT DATA CSV TERVALIDASI + LOG DETAIL PER BARIS (KI-JARO)
// Mendukung:
// 1. Tier 1 (Kemenperin), Tier 2 (BPSDMI), Tier 3 (Tujuan/Sasaran), Tier 4 (IK + Target & Pagu 2025-2029)
// 2. Cascading Level 1 (Direktur -> Ketua Tim), Level 2 (Ketua Tim -> Unit), Level 3 (Unit -> Staf/Dosen/Tendik)
// 3. Rencana Hasil Kerja (RHK) & Indikator Kinerja Individu (IKI) Staf
// =========================================================================
(function () {
    const MENU_BTN_ID = 'kiJaroCsvInjectNavBtn';
    const MODAL_ID = 'kiJaroCsvInjectModal';
    const YEARS = ['2025', '2026', '2027', '2028', '2029'];

    const CSV_SCHEMAS = {
        tier1: {
            group: '1. Perencanaan Strategis (Tier 1 - Tier 4)',
            label: '1A. Tujuan / Sasaran Strategis Kementerian Perindustrian (Tier 1)',
            filename: 'template_1A_tier1_kemenperin.csv',
            headers: ['kode', 'uraian_tujuan_sasaran', 'tahun_awal', 'tahun_akhir', 'keterangan'],
            sample: [
                ['TS-1', 'Meningkatnya Daya Saing Industri Nasional yang Berkelanjutan', '2025', '2029', 'Renstra Kemenperin 2025-2029']
            ]
        },
        tier2: {
            group: '1. Perencanaan Strategis (Tier 1 - Tier 4)',
            label: '1B. Sasaran Program dan Indikator BPSDMI (Tier 2)',
            filename: 'template_1B_tier2_bpsdmi.csv',
            headers: ['kode_tier1', 'kode', 'sasaran_program', 'indikator_program', 'satuan', 'target_2025', 'target_2026', 'target_2027', 'target_2028', 'target_2029'],
            sample: [
                ['TS-1', 'SP-1', 'Meningkatnya Ketersediaan SDM Industri yang Kompeten', 'Persentase SDM Industri yang kompeten', '%', '90', '90.5', '91', '91.5', '92']
            ]
        },
        tier3: {
            group: '1. Perencanaan Strategis (Tier 1 - Tier 4)',
            label: '1C. Tujuan / Sasaran Kinerja Institusi (Tier 3)',
            filename: 'template_1C_tier3_sasaran_kinerja.csv',
            headers: ['kode_tier2', 'kode', 'jenis', 'sasaran_kinerja', 'keterangan'],
            sample: [
                ['SP-1', 'TJ 1', 'Tujuan', 'Meningkatnya Peran SDM Industri dalam Perekonomian Nasional melalui unit pendidikan tinggi vokasi', 'Tier 3 Direktur'],
                ['SP-1', 'SK 1', 'Sasaran Kinerja', 'Terfasilitasinya peningkatan kompetensi sumber daya manusia industri dalam mendukung penumbuhan sektor industri melalui unit pendidikan tinggi vokasi', 'Tier 3 Direktur']
            ]
        },
        tier4: {
            group: '1. Perencanaan Strategis (Tier 1 - Tier 4)',
            label: '1D. Indikator Kinerja (Tier 4), Target 5 Tahun (2025-2029) & Alokasi Anggaran Pagu',
            filename: 'template_1D_tier4_indikator_target_pagu.csv',
            headers: [
                'kode_tier3', 'kode', 'nama_indikator', 'satuan',
                'target_2025', 'pagu_2025',
                'target_2026', 'pagu_2026',
                'target_2027', 'pagu_2027',
                'target_2028', 'pagu_2028',
                'target_2029', 'pagu_2029'
            ],
            sample: [
                ['TJ 1', 'TJ 1', 'Persentase SDM Industri yang kompeten*', '%', '90', '0', '90.5', '0', '91', '0', '91.5', '0', '92', '0'],
                ['SK 1', 'IK 1.1', 'Persentase lulusan peserta didik yang bekerja dan mempunyai kompetensi bidang industri*', '%', '0', '795584000', '90', '0', '90.5', '0', '91', '0', '91.5', '0'],
                ['TJ 1', 'IK 1.2', 'Wirausaha baru hasil inkubator bisnis industri yang tumbuh', 'Tenant', '1', '7200000', '1', '0', '1', '60000', '2', '0', '2', '0']
            ]
        },
        cascading1: {
            group: '2. Cascading Kinerja (Level 1 - Level 3)',
            label: '2.1. Cascading Direktur ke Ketua Tim Kerja (Level 1)',
            filename: 'template_2_1_cascading_level1_ketua_tim.csv',
            headers: ['tahun', 'kode_indikator_tier4', 'username_ketua_tim', 'nama_tim_kerja', 'rencana_aksi_tim', 'indikator_tim', 'satuan', 'target_tahunan', 'tw1', 'tw2', 'tw3', 'tw4'],
            sample: [
                ['2025', 'IK 1.1', 'ketuatim1', 'Tim Kerja Akademik & Kemahasiswaan', 'Meningkatkan serapan lulusan bersertifikat kompetensi industri', 'Persentase lulusan terserap industri', '%', '90', '0', '0', '45', '90']
            ]
        },
        cascading2: {
            group: '2. Cascading Kinerja (Level 1 - Level 3)',
            label: '2.2. Cascading Ketua Tim Kerja ke Unit / Prodi / Subbag (Level 2)',
            filename: 'template_2_2_cascading_level2_unit_prodi.csv',
            headers: ['tahun', 'kode_indikator_induk', 'nama_unit', 'username_ka_unit', 'rencana_aksi_unit', 'indikator_unit', 'satuan', 'target_tahunan', 'tw1', 'tw2', 'tw3', 'tw4'],
            sample: [
                ['2025', 'IK 1.1', 'Prodi D3 Teknologi Proses Industri Petrokimia', 'kaprodi_tpip', 'Pelaksanaan uji kompetensi LSP & rekrutmen industri mitra', 'Persentase lulusan TPIP terserap industri', '%', '92', '0', '0', '50', '92']
            ]
        },
        cascading3: {
            group: '2. Cascading Kinerja (Level 1 - Level 3)',
            label: '2.3. Cascading Ketua Unit / Prodi / Subbag ke Dosen / Tendik / Sekretaris / Kalab / Koordinator (Level 3)',
            filename: 'template_2_3_cascading_level3_staf.csv',
            headers: ['tahun', 'kode_indikator_unit', 'nama_unit', 'username_pegawai', 'jabatan_peran', 'rencana_hasil_kerja', 'indikator_individu', 'satuan', 'target_tahunan', 'tw1', 'tw2', 'tw3', 'tw4'],
            sample: [
                ['2025', 'IK 1.1', 'Prodi D3 Teknologi Proses Industri Petrokimia', 'deni.saputra', 'Dosen', 'Membimbing tugas akhir mahasiswa berbasis kasus nyata industri petrokimia', 'Jumlah mahasiswa bimbingan lulus tepat waktu dan tersertifikasi', 'Mahasiswa', '12', '3', '6', '9', '12']
            ]
        },
        rhk_iki: {
            group: '3. RHK & Indikator Kinerja Individu (Staf)',
            label: '3.4. Rencana Hasil Kerja (RHK) & Indikator Kinerja Individu Staf',
            filename: 'template_3_4_rhk_iki_staf.csv',
            headers: ['tahun', 'username_pegawai', 'kode_ik_atasan', 'jenis_rhk', 'rencana_hasil_kerja', 'aspek', 'indikator_kinerja_individu', 'satuan', 'target_tahunan', 'realisasi_tw1', 'realisasi_tw2', 'realisasi_tw3', 'realisasi_tw4'],
            sample: [
                ['2025', 'deni.saputra', 'IK 3.3', 'Utama', 'Terpublikasinya artikel penelitian terapan bidang teknik industri / petrokimia pada jurnal bereputasi', 'Kuantitas', 'Jumlah artikel ilmiah terpublikasi pada jurnal Sinta 2 / Internasional', 'Artikel', '2', '0', '1', '1', '2']
            ]
        }
    };

    let _selectedSchemaKey = 'tier4';
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
        if (!u) return true; // Tetap tampil jika sesi belum terikat ketat
        const roles = (Array.isArray(u.roles) ? u.roles : [u.role, u.jabatan, u.unit])
            .filter(Boolean).map(r => String(r).toLowerCase());
        return roles.some(r =>
            r.includes('admin') || r.includes('program') || r.includes('evaluasi') ||
            r.includes('perencanaan') || r.includes('direktur') || r.includes('ketua')
        );
    }

    function cleanNumber(val) {
        if (val === undefined || val === null) return null;
        let s = String(val).trim();
        if (s === '' || s === '-') return 0;
        s = s.replace(/^rp\.?\s*/i, '').trim();
        // Format ribuan titik Indonesia (contoh: 795.584.000)
        if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) {
            s = s.replace(/\./g, '');
        } else {
            s = s.replace(/,/g, '.');
        }
        if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
        return parseFloat(s);
    }

    // Parser CSV tangguh: mendukung koma (,) maupun titik koma (;), serta tanda kutip ganda ("...")
    function parseCsvText(rawText) {
        const text = String(rawText || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = [];
        let curRow = [];
        let curCell = '';
        let inQuotes = false;

        // Deteksi pemisah kolom otomatis dari baris pertama (, atau ;)
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

    function upsertByCodeOrKey(arr, matchFn, newRecord) {
        const existingIdx = arr.findIndex(matchFn);
        if (existingIdx >= 0) {
            arr[existingIdx] = { ...arr[existingIdx], ...newRecord, id: arr[existingIdx].id };
            return 'UPDATED';
        } else {
            arr.push({ id: `imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ...newRecord });
            return 'INSERTED';
        }
    }

    // =========================================================================
    // VALIDATOR & INJECTOR PER JENIS DATA CSV
    // =========================================================================
    function validateAndInjectRows(schemaKey, parsed) {
        ensureDbCollections();
        const schema = CSV_SCHEMAS[schemaKey];
        const logs = [];
        let successCount = 0;
        let failCount = 0;

        // Cek kelengkapan header wajib
        const missingHeaders = schema.headers.filter(h => !parsed.headers.includes(h));
        if (missingHeaders.length > 0) {
            return {
                fatalError: `Header kolom CSV tidak sesuai template! Kolom yang hilang: [${missingHeaders.join(', ')}]. Silakan unduh template CSV yang sesuai terlebih dahulu.`,
                logs: [],
                successCount: 0,
                failCount: parsed.rows.length
            };
        }

        parsed.rows.forEach(({ rowNumber, data }) => {
            const errors = [];
            let actionType = '';
            let summaryLabel = '';

            if (schemaKey === 'tier1') {
                if (!data.kode) errors.push('Kolom "kode" wajib diisi (contoh: TS-1)');
                if (!data.uraian_tujuan_sasaran) errors.push('Kolom "uraian_tujuan_sasaran" wajib diisi');
                summaryLabel = `${data.kode || '-'} — ${data.uraian_tujuan_sasaran || '(Kosong)'}`;

                if (errors.length === 0) {
                    actionType = upsertByCodeOrKey(
                        DB.tier1Kemenperin,
                        r => String(r.kode || '').toLowerCase() === data.kode.toLowerCase(),
                        {
                            tier: 1,
                            kode: data.kode,
                            uraian: data.uraian_tujuan_sasaran,
                            tujuanSasaran: data.uraian_tujuan_sasaran,
                            tahunAwal: data.tahun_awal || '2025',
                            tahunAkhir: data.tahun_akhir || '2029',
                            keterangan: data.keterangan || ''
                        }
                    );
                }
            } else if (schemaKey === 'tier2') {
                if (!data.kode) errors.push('Kolom "kode" wajib diisi (contoh: SP-1)');
                if (!data.sasaran_program) errors.push('Kolom "sasaran_program" wajib diisi');
                if (!data.indikator_program) errors.push('Kolom "indikator_program" wajib diisi');
                if (!data.satuan) errors.push('Kolom "satuan" wajib diisi');

                const targetsByYear = {};
                YEARS.forEach(y => {
                    const num = cleanNumber(data[`target_${y}`]);
                    if (Number.isNaN(num)) errors.push(`Kolom "target_${y}" harus berupa angka valid (nilai: "${data[`target_${y}`]}")`);
                    else targetsByYear[y] = num;
                });

                summaryLabel = `${data.kode || '-'} — ${data.indikator_program || '(Kosong)'}`;
                if (errors.length === 0) {
                    actionType = upsertByCodeOrKey(
                        DB.tier2Bpsdmi,
                        r => String(r.kode || '').toLowerCase() === data.kode.toLowerCase() &&
                             String(r.indikatorProgram || '').toLowerCase() === data.indikator_program.toLowerCase(),
                        {
                            tier: 2,
                            kodeTier1: data.kode_tier1 || '',
                            kode: data.kode,
                            sasaranProgram: data.sasaran_program,
                            indikatorProgram: data.indikator_program,
                            satuan: data.satuan,
                            targetsByYear,
                            target2025: targetsByYear['2025'],
                            target2026: targetsByYear['2026'],
                            target2027: targetsByYear['2027'],
                            target2028: targetsByYear['2028'],
                            target2029: targetsByYear['2029']
                        }
                    );
                }
            } else if (schemaKey === 'tier3') {
                if (!data.kode) errors.push('Kolom "kode" wajib diisi (contoh: TJ 1 atau SK 1)');
                if (!data.sasaran_kinerja) errors.push('Kolom "sasaran_kinerja" wajib diisi');
                summaryLabel = `${data.kode || '-'} — ${data.sasaran_kinerja || '(Kosong)'}`;

                if (errors.length === 0) {
                    actionType = upsertByCodeOrKey(
                        DB.sasaranKinerja,
                        r => String(r.kode || '').toLowerCase() === data.kode.toLowerCase(),
                        {
                            tier: 3,
                            kodeTier2: data.kode_tier2 || '',
                            kode: data.kode,
                            jenis: data.jenis || 'Sasaran Kinerja',
                            sasaranKinerja: data.sasaran_kinerja,
                            sasaran: data.sasaran_kinerja,
                            keterangan: data.keterangan || ''
                        }
                    );
                }
            } else if (schemaKey === 'tier4') {
                if (!data.kode_tier3) errors.push('Kolom "kode_tier3" wajib diisi (contoh: TJ 1 atau SK 1)');
                if (!data.kode) errors.push('Kolom "kode" wajib diisi (contoh: IK 1.1)');
                if (!data.nama_indikator) errors.push('Kolom "nama_indikator" wajib diisi');
                if (!data.satuan) errors.push('Kolom "satuan" wajib diisi');

                const parentTier3 = (DB.sasaranKinerja || []).find(
                    s => String(s.kode || '').toLowerCase() === String(data.kode_tier3 || '').toLowerCase()
                );

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

                summaryLabel = `${data.kode || '-'} — ${data.nama_indikator || '(Kosong)'}`;
                if (errors.length === 0) {
                    const sasaranText = parentTier3
                        ? `${parentTier3.kode} - ${parentTier3.sasaranKinerja}`
                        : data.kode_tier3;

                    actionType = upsertByCodeOrKey(
                        DB.indikatorKinerja,
                        r => String(r.kode || '').toLowerCase() === data.kode.toLowerCase() &&
                             String(r.namaIndikator || r.indikator || '').toLowerCase() === data.nama_indikator.toLowerCase(),
                        {
                            tier: 4,
                            kodeTier3: data.kode_tier3,
                            sasaranId: parentTier3 ? parentTier3.id : '',
                            sasaranKinerja: sasaranText,
                            kode: data.kode,
                            namaIndikator: data.nama_indikator,
                            indikator: data.nama_indikator,
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
                }
            } else if (schemaKey === 'cascading1' || schemaKey === 'cascading2' || schemaKey === 'cascading3') {
                const levelNum = schemaKey === 'cascading1' ? 1 : (schemaKey === 'cascading2' ? 2 : 3);
                const yr = data.tahun || '2025';
                if (!/^\d{4}$/.test(yr)) errors.push(`Kolom "tahun" harus 4 digit (nilai: "${yr}")`);

                const kodeInduk = data.kode_indikator_tier4 || data.kode_indikator_induk || data.kode_indikator_unit || '';
                if (!kodeInduk) errors.push('Kode indikator induk wajib diisi');

                const userRef = data.username_ketua_tim || data.username_ka_unit || data.username_pegawai || '';
                if (!userRef) errors.push('Username penanggung jawab / pegawai wajib diisi');

                const matchedUser = findUserByUsernameOrName(userRef);
                if (userRef && (DB.users || []).length > 0 && !matchedUser) {
                    errors.push(`Username/NIP/Nama "${userRef}" tidak ditemukan di master data Pegawai Ki-Jaro`);
                }

                const ikText = data.indikator_tim || data.indikator_unit || data.indikator_individu || '';
                if (!ikText) errors.push('Nama indikator kinerja cascading wajib diisi');

                const tTahunan = cleanNumber(data.target_tahunan);
                const tw1 = cleanNumber(data.tw1);
                const tw2 = cleanNumber(data.tw2);
                const tw3 = cleanNumber(data.tw3);
                const tw4 = cleanNumber(data.tw4);
                if (Number.isNaN(tTahunan)) errors.push(`"target_tahunan" harus berupa angka ("${data.target_tahunan}")`);
                if ([tw1, tw2, tw3, tw4].some(v => Number.isNaN(v))) errors.push('Target TW1 s.d. TW4 harus berupa angka valid');

                summaryLabel = `Level ${levelNum} | ${userRef || '-'} — ${ikText || '(Kosong)'}`;
                if (errors.length === 0) {
                    actionType = upsertByCodeOrKey(
                        DB.cascading,
                        r => Number(r.level) === levelNum &&
                             String(r.tahun) === yr &&
                             String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : userRef).toLowerCase() &&
                             String(r.indikator || '').toLowerCase() === ikText.toLowerCase(),
                        {
                            level: levelNum,
                            tahun: yr,
                            kodeIndikatorInduk: kodeInduk,
                            unit: data.nama_tim_kerja || data.nama_unit || (matchedUser?.unit || ''),
                            jabatanPeran: data.jabatan_peran || (levelNum === 1 ? 'Ketua Tim Kerja' : (levelNum === 2 ? 'Ketua Unit/Prodi/Subbag' : 'Staf/Dosen/Tendik')),
                            pegawaiUsername: matchedUser ? matchedUser.username : userRef,
                            namaPegawai: matchedUser ? matchedUser.name : userRef,
                            rencanaAksi: data.rencana_aksi_tim || data.rencana_aksi_unit || data.rencana_hasil_kerja || '',
                            indikator: ikText,
                            satuan: data.satuan || '%',
                            target: tTahunan,
                            targetTw1: tw1,
                            targetTw2: tw2,
                            targetTw3: tw3,
                            targetTw4: tw4
                        }
                    );
                }
            } else if (schemaKey === 'rhk_iki') {
                const yr = data.tahun || '2025';
                if (!/^\d{4}$/.test(yr)) errors.push(`Kolom "tahun" harus 4 digit (nilai: "${yr}")`);
                if (!data.username_pegawai) errors.push('Kolom "username_pegawai" wajib diisi');

                const matchedUser = findUserByUsernameOrName(data.username_pegawai);
                if (data.username_pegawai && (DB.users || []).length > 0 && !matchedUser) {
                    errors.push(`Pegawai "${data.username_pegawai}" tidak terdaftar di master Pegawai Ki-Jaro`);
                }

                if (!data.rencana_hasil_kerja) errors.push('Kolom "rencana_hasil_kerja" wajib diisi');
                if (!data.indikator_kinerja_individu) errors.push('Kolom "indikator_kinerja_individu" wajib diisi');

                const tTahunan = cleanNumber(data.target_tahunan);
                const rTw1 = cleanNumber(data.realisasi_tw1);
                const rTw2 = cleanNumber(data.realisasi_tw2);
                const rTw3 = cleanNumber(data.realisasi_tw3);
                const rTw4 = cleanNumber(data.realisasi_tw4);
                if (Number.isNaN(tTahunan)) errors.push(`"target_tahunan" harus angka ("${data.target_tahunan}")`);
                if ([rTw1, rTw2, rTw3, rTw4].some(v => Number.isNaN(v))) errors.push('Realisasi TW1 s.d. TW4 harus angka valid');

                summaryLabel = `${data.username_pegawai || '-'} — ${data.indikator_kinerja_individu || '(Kosong)'}`;
                if (errors.length === 0) {
                    actionType = upsertByCodeOrKey(
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
                    detail: actionType === 'UPDATED'
                        ? 'Data sudah ada sebelumnya dan berhasil diperbarui (Update).'
                        : 'Data baru berhasil ditambahkan (Insert).'
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

            // Notifikasi Toast sesuai hasil eksekusi
            if (typeof showToast === 'function') {
                if (result.fatalError) {
                    showToast('Import CSV Gagal: Struktur kolom tidak sesuai template.', 'error');
                } else if (result.failCount === 0) {
                    showToast(`Sukses 100%! ${result.successCount} baris data berhasil di-inject ke Ki-Jaro.`, 'success');
                } else if (result.successCount > 0) {
                    showToast(`Selesai sebagian: ${result.successCount} berhasil, ${result.failCount} gagal. Periksa tabel log di bawah!`, 'info');
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

        // Kelompokkan opsi dropdown berdasarkan grup
        const groups = {};
        Object.entries(CSV_SCHEMAS).forEach(([k, v]) => {
            if (!groups[v.group]) groups[v.group] = [];
            groups[v.group].push({ key: k, ...v });
        });

        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" style="font-family: Arial, Helvetica, sans-serif;">
                <!-- Header Modal -->
                <div class="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Bulk Data Injector</span>
                        <h3 class="text-base font-bold mt-1 flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-emerald-300"></i> Inject / Import Data Kinerja & Cascading via CSV
                        </h3>
                    </div>
                    <button type="button" onclick="closeCsvInjectorModal()" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white font-bold">&times;</button>
                </div>

                <!-- Konten Modal -->
                <div class="p-6 overflow-y-auto space-y-5 text-xs">
                    <!-- Langkah 1: Pilih Jenis Data & Unduh Template -->
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <label class="block font-bold text-slate-800 text-sm">1. Pilih Jenis Data yang Akan Di-inject (Tier 1–4, Cascading Level 1–3, atau RHK & IKI Staf)</label>
                        <div class="flex flex-col md:flex-row gap-3">
                            <select onchange="changeCsvInjectorSchema(this.value)" class="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900">
                                ${Object.entries(groups).map(([grpName, items]) => `
                                    <optgroup label="${esc(grpName)}">
                                        ${items.map(it => `<option value="${it.key}" ${_selectedSchemaKey === it.key ? 'selected' : ''}>${esc(it.label)}</option>`).join('')}
                                    </optgroup>
                                `).join('')}
                            </select>
                            <button type="button" onclick="downloadSelectedCsvTemplate()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow shrink-0">
                                <i class="fa-solid fa-download mr-1.5"></i>Unduh Template CSV
                            </button>
                        </div>

                        <div class="bg-white border border-blue-100 rounded-lg p-3">
                            <p class="font-bold text-blue-900 mb-1">Format Kolom Wajib pada CSV ini:</p>
                            <div class="flex flex-wrap gap-1.5">
                                ${schema.headers.map(h => `<code class="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded font-mono text-[11px]">${esc(h)}</code>`).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Langkah 2: Upload File CSV -->
                    <div class="bg-blue-50/70 border-2 border-dashed border-blue-300 rounded-xl p-5 text-center space-y-2">
                        <i class="fa-solid fa-cloud-arrow-up text-2xl text-blue-700"></i>
                        <p class="font-bold text-slate-900 text-sm">2. Pilih File CSV untuk Diproses & Divalidasi</p>
                        <p class="text-[11px] text-slate-600">Mendukung pemisah koma (<code>,</code>) maupun titik koma (<code>;</code>) dari Microsoft Excel / Google Sheets. Setiap baris akan divalidasi otomatis.</p>
                        <div class="pt-1">
                            <label class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer shadow">
                                <i class="fa-solid fa-upload"></i> Pilih File .CSV & Inject Data
                                <input type="file" accept=".csv,text/csv" onchange="processUploadedCsvFile(this)" class="hidden">
                            </label>
                        </div>
                    </div>

                    <!-- Langkah 3: Banner Notifikasi Hasil & Tabel Log Berhasil / Gagal per Baris -->
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

    // =========================================================================
    // SUNTIK TOMBOL MENU KE SIDEBAR & HEADER HALAMAN PERENCANAAN / CASCADING
    // =========================================================================
    function injectCsvMenuButton() {
        if (!canAccessCsvInjector()) return;

        // 1. Tambahkan tombol menu di Sidebar navigasi utama
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

        // 2. Tambahkan tombol cepat di area header/toolbar halaman Perencanaan, Cascading, atau SKP/RHK
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
