// =========================================================================
// MODUL TERPADU KI-JARO:
// 1. Penyusunan, Reviu SPI, Pemeriksaan Pudir II, Pengesahan Direktur & Cetak PDF LAKIP
// 2. Import & Export Data CSV Terpadu (Tier 1-4, Cascading L1-3, RHK & IKI)
// 3. Perbaikan Fokus Kursor Pencarian Pejabat / Staf / Multi-Role
// =========================================================================
(function () {
    const LAKIP_NAV_BTN_ID = 'kiJaroLakipGeneratorNavBtn';
    const LAKIP_HEADER_BTN_ID = 'kiJaroLakipHeaderQuickBtn';
    const LAKIP_MODAL_ID = 'kiJaroLakipGeneratorModal';
    const CSV_MENU_BTN_ID = 'kiJaroCsvInjectNavBtn';
    const CSV_MODAL_ID = 'kiJaroCsvInjectModal';
    const YEARS = ['2025', '2026', '2027', '2028', '2029'];

    let _lakipYear = '2025';
    let _lakipTab = 5; // Default buka tab Reviu SPI & Pengesahan agar langsung siap dipakai

    // =====================================================================
    // 1. HELPER DATABASE & AUTENTIKASI
    // =====================================================================
    function esc(str) {
        if (typeof sanitizeHTML === 'function') return sanitizeHTML(String(str ?? ''));
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getRootDbObject() {
        if (typeof DB !== 'undefined' && DB && typeof DB === 'object') return DB;
        if (window.DB && typeof window.DB === 'object') return window.DB;
        if (window.db && typeof window.db === 'object') return window.db;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k) continue;
                const raw = localStorage.getItem(k);
                if (raw && raw.startsWith('{') && (raw.includes('sasaran') || raw.includes('indikator') || raw.includes('cascading') || raw.includes('users'))) {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object') {
                        window.DB = parsed;
                        return window.DB;
                    }
                }
            }
        } catch (_) {}
        window.DB = {};
        return window.DB;
    }

    function getCurrentActorInfo() {
        let u = (typeof currentUser !== 'undefined' && currentUser) ? currentUser : null;
        if (!u) {
            try {
                const raw = localStorage.getItem('kijaro_user') || sessionStorage.getItem('kijaro_user');
                if (raw) u = JSON.parse(raw);
            } catch (_) {}
        }
        return {
            name: u?.name || u?.nama || 'Administrator Sistem',
            username: u?.username || 'admin',
            nip: u?.nip || ''
        };
    }

    function getTodayFormatted() {
        return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    async function persistAllDbChanges() {
        try {
            const root = getRootDbObject();
            localStorage.setItem('kijaro_lakip_master_backup', JSON.stringify(root.lakipDataByYear || {}));
            if (typeof saveToMySQL === 'function') await saveToMySQL();
            if (typeof saveDB === 'function') saveDB();
        } catch (err) {
            console.warn('Sinkronisasi penyimpanan:', err);
        }
    }

    function resolveCollection(root, candidateKeys, itemTestFn, fallbackKey) {
        const existingKeys = Object.keys(root);
        for (const cand of candidateKeys) {
            const foundKey = existingKeys.find(k => k.toLowerCase() === cand.toLowerCase());
            if (foundKey && Array.isArray(root[foundKey])) {
                return { key: foundKey, list: root[foundKey] };
            }
        }
        for (const k of existingKeys) {
            const val = root[k];
            if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
                if (itemTestFn(val[0], k)) return { key: k, list: val };
            }
        }
        if (!Array.isArray(root[fallbackKey])) root[fallbackKey] = [];
        return { key: fallbackKey, list: root[fallbackKey] };
    }

    function getKiJaroCollections() {
        const root = getRootDbObject();
        return {
            root,
            tier1: resolveCollection(root, ['tier1Kemenperin', 'tier1', 'tujuanKemenperin', 'sasaranStrategis'], (item, k) => k.toLowerCase().includes('tier1') || k.toLowerCase().includes('kemenperin'), 'tier1Kemenperin'),
            tier2: resolveCollection(root, ['tier2Bpsdmi', 'tier2', 'sasaranProgram', 'bpsdmi'], (item, k) => k.toLowerCase().includes('tier2') || k.toLowerCase().includes('bpsdmi') || ('sasaranProgram' in item), 'tier2Bpsdmi'),
            tier3: resolveCollection(root, ['sasaranKinerja', 'sasaran', 'tujuanSasaran', 'tier3', 'skList'], (item, k) => (k.toLowerCase().includes('sasaran') || k.toLowerCase().includes('tier3')) && !('namaIndikator' in item || 'indikator' in item), 'sasaranKinerja'),
            tier4: resolveCollection(root, ['indikatorKinerja', 'indikator', 'iku', 'ikList', 'tier4'], (item, k) => (k.toLowerCase().includes('indikator') || k.toLowerCase().includes('iku') || k.toLowerCase().includes('tier4')) && ('namaIndikator' in item || 'indikator' in item || 'target2025' in item || 'targetsByYear' in item), 'indikatorKinerja'),
            cascading: resolveCollection(root, ['cascading', 'cascadingKinerja', 'matriksCascading', 'crosscutting'], (item, k) => k.toLowerCase().includes('cascading') || ('level' in item && ('pegawaiUsername' in item || 'username' in item)), 'cascading'),
            rhk: resolveCollection(root, ['rhkPegawai', 'rhk', 'skp', 'kinerjaIndividu', 'iki'], (item, k) => k.toLowerCase().includes('rhk') || k.toLowerCase().includes('skp') || ('rhk' in item), 'rhkPegawai'),
            users: resolveCollection(root, ['users', 'pegawai', 'employees', 'pejabat'], (item, k) => k.toLowerCase().includes('user') || k.toLowerCase().includes('pegawai'), 'users')
        };
    }

    // =====================================================================
    // 2. DATA & STATE PENYUSUNAN + REVIU + PENGESAHAN LAKIP
    // =====================================================================
    function getLakipYearData(year) {
        const root = getRootDbObject();
        if (!root.lakipDataByYear || typeof root.lakipDataByYear !== 'object') {
            root.lakipDataByYear = {};
            try {
                const saved = localStorage.getItem('kijaro_lakip_master_backup');
                if (saved) root.lakipDataByYear = JSON.parse(saved);
            } catch (_) {}
        }
        if (!root.lakipDataByYear[year]) {
            root.lakipDataByYear[year] = {
                tahun: year,
                namaSatker: 'Politeknik Industri Petrokimia Banten',
                kementerian: 'Kementerian Perindustrian RI — BPSDMI',
                kataPengantar: 'Laporan Kinerja Instansi Pemerintah (LAKIP) Politeknik Industri Petrokimia Banten disusun sebagai bentuk pertanggungjawaban atas pencapaian sasaran strategis dan indikator kinerja utama tahun berjalan.',
                ringkasanEksekutif: 'Secara keseluruhan capaian indikator kinerja utama menunjukkan tren positif sesuai target Rencana Strategis 2025–2029 serta efisiensi penyerapan anggaran.',
                analisisKendala: 'Kendala utama meliputi penyesuaian jadwal sertifikasi kompetensi industri dan sinkronisasi kalender akademik dengan mitra industri petrokimia.',
                rencanaTindakLanjut: 'Memperluas kerja sama tempat uji kompetensi (TUK) dan percepatan pengadaan sarana praktikum pada triwulan awal.',
                status: 'MENUNGGU_SPI', // DRAFT | MENUNGGU_SPI | MENUNGGU_PUDIR2 | MENUNGGU_DIREKTUR | DISAHKAN | REVISI
                tahap1: { status: 'Telah Diajukan', tanggal: getTodayFormatted(), oleh: 'Tim Program & Evaluasi', catatan: '' },
                tahap2: { status: 'Menunggu Reviu', tanggal: '-', oleh: '', catatan: '' },
                tahap3: { status: 'Menunggu Persetujuan', tanggal: '-', oleh: '', catatan: '' },
                tahap4: { status: 'Menunggu Pengesahan', tanggal: '-', oleh: '', catatan: '' }
            };
        }
        return root.lakipDataByYear[year];
    }

    window.changeLakipYear = function (yr) {
        _lakipYear = yr;
        window.renderLakipGeneratorModal();
    };

    window.switchLakipTab = function (tabIdx) {
        _lakipTab = tabIdx;
        window.renderLakipGeneratorModal();
    };

    window.saveLakipNarrativeFields = async function () {
        const rec = getLakipYearData(_lakipYear);
        const kp = document.getElementById('lakipFieldKataPengantar');
        const re = document.getElementById('lakipFieldRingkasan');
        const ak = document.getElementById('lakipFieldKendala');
        const tl = document.getElementById('lakipFieldTindakLanjut');
        if (kp) rec.kataPengantar = kp.value;
        if (re) rec.ringkasanEksekutif = re.value;
        if (ak) rec.analisisKendala = ak.value;
        if (tl) rec.rencanaTindakLanjut = tl.value;
        await persistAllDbChanges();
        if (typeof showToast === 'function') showToast('Narasi kualitatif LAKIP berhasil disimpan.', 'success');
    };

    window.handleLakipApprovalStep = async function (stage, decision) {
        const rec = getLakipYearData(_lakipYear);
        const actor = getCurrentActorInfo();
        const today = getTodayFormatted();

        const noteMap = {
            PENYUSUN: 'lakipNotePenyusun',
            SPI: 'lakipNoteSpi',
            PUDIR2: 'lakipNotePudir2',
            DIREKTUR: 'lakipNoteDirektur'
        };
        const noteEl = document.getElementById(noteMap[stage]);
        const note = noteEl ? noteEl.value.trim() : '';

        if (decision === 'REVISI' && !note) {
            if (typeof showToast === 'function') showToast('Harap isi catatan pemeriksaan / alasan perbaikan terlebih dahulu!', 'error');
            else alert('Harap isi catatan pemeriksaan / alasan perbaikan terlebih dahulu!');
            if (noteEl) noteEl.focus();
            return;
        }

        if (stage === 'PENYUSUN') {
            rec.status = 'MENUNGGU_SPI';
            rec.tahap1 = { status: 'Telah Diajukan ke SPI', tanggal: today, oleh: actor.name, catatan: note };
            rec.tahap2 = { status: 'Menunggu Reviu SPI', tanggal: '-', oleh: '', catatan: rec.tahap2.catatan || '' };
            if (typeof showToast === 'function') showToast('Draf LAKIP berhasil diajukan untuk Reviu SPI.', 'success');
        } else if (stage === 'SPI') {
            if (decision === 'APPROVE') {
                rec.status = 'MENUNGGU_PUDIR2';
                rec.tahap2 = { status: 'Valid / Direviu SPI', tanggal: today, oleh: actor.name, catatan: note || 'Telah direviu SPI dan dinyatakan valid.' };
                rec.tahap3 = { status: 'Menunggu Pemeriksaan Pudir II', tanggal: '-', oleh: '', catatan: rec.tahap3.catatan || '' };
                if (typeof showToast === 'function') showToast('Reviu SPI Valid! Diteruskan ke Pembantu Direktur II.', 'success');
            } else {
                rec.status = 'REVISI';
                rec.tahap2 = { status: 'Perlu Perbaikan (SPI)', tanggal: today, oleh: actor.name, catatan: note };
                if (typeof showToast === 'function') showToast('Dikembalikan ke Penyusun untuk perbaikan sesuai catatan SPI.', 'info');
            }
        } else if (stage === 'PUDIR2') {
            if (decision === 'APPROVE') {
                rec.status = 'MENUNGGU_DIREKTUR';
                rec.tahap3 = { status: 'Disetujui Pudir II', tanggal: today, oleh: actor.name, catatan: note || 'Diperiksa dan disetujui oleh Pembantu Direktur II.' };
                rec.tahap4 = { status: 'Menunggu Pengesahan Direktur', tanggal: '-', oleh: '', catatan: rec.tahap4.catatan || '' };
                if (typeof showToast === 'function') showToast('Disetujui Pembantu Direktur II! Diteruskan ke Direktur.', 'success');
            } else {
                rec.status = 'REVISI';
                rec.tahap3 = { status: 'Perlu Perbaikan (Pudir II)', tanggal: today, oleh: actor.name, catatan: note };
                if (typeof showToast === 'function') showToast('Dikembalikan oleh Pembantu Direktur II untuk perbaikan.', 'info');
            }
        } else if (stage === 'DIREKTUR') {
            if (decision === 'APPROVE') {
                rec.status = 'DISAHKAN';
                rec.tahap4 = { status: 'Disahkan Direktur', tanggal: today, oleh: actor.name, catatan: note || 'Disahkan secara resmi oleh Direktur.' };
                if (typeof showToast === 'function') showToast('LAKIP Resmi Disahkan Direktur! Tombol Cetak PDF kini aktif.', 'success');
            } else {
                rec.status = 'REVISI';
                rec.tahap4 = { status: 'Dikembalikan Direktur', tanggal: today, oleh: actor.name, catatan: note };
                if (typeof showToast === 'function') showToast('Dikembalikan oleh Direktur untuk revisi.', 'info');
            }
        }

        await persistAllDbChanges();
        window.renderLakipGeneratorModal();
    };

    window.printLakipOfficialPdf = function () {
        const rec = getLakipYearData(_lakipYear);
        const cols = getKiJaroCollections();
        const ikList = cols.tier4.list;

        const win = window.open('', '_blank');
        if (!win) {
            alert('Izinkan pop-up browser untuk mencetak PDF LAKIP.');
            return;
        }

        const rowsHtml = ikList.map((ik, idx) => {
            const tVal = (ik.targetsByYear && ik.targetsByYear[_lakipYear]) ?? ik[`target${_lakipYear}`] ?? ik.target ?? '-';
            const pVal = (ik.paguByYear && ik.paguByYear[_lakipYear]) ?? ik[`pagu${_lakipYear}`] ?? ik.pagu ?? 0;
            return `
                <tr>
                    <td style="text-align:center;">${idx + 1}</td>
                    <td>${esc(ik.kode || '-')}</td>
                    <td>${esc(ik.namaIndikator || ik.indikator || '-')}</td>
                    <td style="text-align:center;">${esc(ik.satuan || '%')}</td>
                    <td style="text-align:center;">${esc(tVal)}</td>
                    <td style="text-align:right;">Rp ${Number(pVal || 0).toLocaleString('id-ID')}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="6" style="text-align:center;">Belum ada data indikator kinerja pada database.</td></tr>';

        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>LAKIP ${_lakipYear} - ${esc(rec.namaSatker)}</title>
                <style>
                    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 28px; font-size: 12px; line-height: 1.5; }
                    h1, h2, h3 { color: #1e3a8a; margin-bottom: 6px; }
                    .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 12px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
                    th, td { border: 1px solid #cbd5e1; padding: 7px 8px; }
                    th { background: #eff6ff; color: #1e3a8a; }
                    .ttd-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-top: 32px; text-align: center; }
                    .ttd-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div style="font-weight:bold; font-size:13px;">${esc(rec.kementerian)}</div>
                    <h1 style="font-size:18px; margin:4px 0;">LAPORAN KINERJA INSTANSI PEMERINTAH (LAKIP) TAHUN ${_lakipYear}</h1>
                    <div style="font-size:13px; font-weight:bold;">${esc(rec.namaSatker)}</div>
                </div>

                <h3>I. Kata Pengantar</h3>
                <p>${esc(rec.kataPengantar)}</p>

                <h3>II. Ringkasan Eksekutif Capaian Kinerja</h3>
                <p>${esc(rec.ringkasanEksekutif)}</p>

                <h3>III. Matriks Target Kinerja & Alokasi Anggaran Tahun ${_lakipYear}</h3>
                <table>
                    <thead>
                        <tr>
                            <th style="width:36px;">No</th>
                            <th style="width:75px;">Kode</th>
                            <th>Indikator Kinerja</th>
                            <th style="width:70px;">Satuan</th>
                            <th style="width:80px;">Target</th>
                            <th style="width:130px;">Alokasi Pagu</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>

                <h3>IV. Analisis Kendala & Rencana Tindak Lanjut</h3>
                <p><strong>Kendala:</strong> ${esc(rec.analisisKendala)}</p>
                <p><strong>Tindak Lanjut:</strong> ${esc(rec.rencanaTindakLanjut)}</p>

                <h3>V. Lembar Reviu SPI & Pengesahan Berjenjang</h3>
                <div class="ttd-grid">
                    <div class="ttd-box">
                        <div>Direviu Oleh,<br><strong>Satuan Pengawas Internal (SPI)</strong></div>
                        <div style="margin:26px 0 6px; font-weight:bold; color:#047857;">[${esc(rec.tahap2.status)}]</div>
                        <div><strong>${esc(rec.tahap2.oleh || '-')}</strong></div>
                        <div style="font-size:11px; color:#475569;">Tanggal: ${esc(rec.tahap2.tanggal)}</div>
                    </div>
                    <div class="ttd-box">
                        <div>Diperiksa Oleh,<br><strong>Pembantu Direktur II</strong></div>
                        <div style="margin:26px 0 6px; font-weight:bold; color:#0369a1;">[${esc(rec.tahap3.status)}]</div>
                        <div><strong>${esc(rec.tahap3.oleh || '-')}</strong></div>
                        <div style="font-size:11px; color:#475569;">Tanggal: ${esc(rec.tahap3.tanggal)}</div>
                    </div>
                    <div class="ttd-box">
                        <div>Disahkan Oleh,<br><strong>Direktur</strong></div>
                        <div style="margin:26px 0 6px; font-weight:bold; color:#1e3a8a;">[${esc(rec.tahap4.status)}]</div>
                        <div><strong>${esc(rec.tahap4.oleh || '-')}</strong></div>
                        <div style="font-size:11px; color:#475569;">Tanggal: ${esc(rec.tahap4.tanggal)}</div>
                    </div>
                </div>
                <script>window.onload = function() { window.print(); };</script>
            </body>
            </html>
        `);
        win.document.close();
    };

    window.openLakipGeneratorModal = function (defaultTab) {
        if (typeof defaultTab === 'number') _lakipTab = defaultTab;
        let modal = document.getElementById(LAKIP_MODAL_ID);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = LAKIP_MODAL_ID;
            modal.className = 'fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 md:p-5 overflow-y-auto';
            document.body.appendChild(modal);
        }
        modal.classList.remove('hidden');
        window.renderLakipGeneratorModal();
    };

    window.closeLakipGeneratorModal = function () {
        const modal = document.getElementById(LAKIP_MODAL_ID);
        if (modal) modal.classList.add('hidden');
    };

    window.renderLakipGeneratorModal = function () {
        const modal = document.getElementById(LAKIP_MODAL_ID);
        if (!modal) return;
        const rec = getLakipYearData(_lakipYear);
        const cols = getKiJaroCollections();
        const isFinal = rec.status === 'DISAHKAN';

        const statusBadgeMap = {
            'DRAFT': { text: '1. DRAF PENYUSUNAN (Tim Program)', cls: 'bg-slate-100 text-slate-800 border-slate-300' },
            'MENUNGGU_SPI': { text: '2. MENUNGGU REVIEW SPI (Role Reviewer)', cls: 'bg-purple-100 text-purple-800 border-purple-300' },
            'MENUNGGU_PUDIR2': { text: '3. MENUNGGU PEMERIKSAAN PEMBANTU DIREKTUR II', cls: 'bg-sky-100 text-sky-800 border-sky-300' },
            'MENUNGGU_DIREKTUR': { text: '4. MENUNGGU PENGESAHAN DIREKTUR', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
            'DISAHKAN': { text: '5. TELAH DISAHKAN DIREKTUR (FINAL)', cls: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
            'REVISI': { text: 'PERLU PERBAIKAN — DIKEMBALIKAN KE PENYUSUN', cls: 'bg-rose-100 text-rose-800 border-rose-300' }
        };
        const badgeInfo = statusBadgeMap[rec.status] || statusBadgeMap['MENUNGGU_SPI'];

        const tabs = [
            { id: 1, label: '1. Data Umum, Anggaran & Target 2025–2029' },
            { id: 2, label: '2. Pembanding BPSDMI & Anggaran IKU' },
            { id: 3, label: '3. Editor Narasi Kualitatif' },
            { id: 4, label: '4. Pratinjau Matriks LAKIP' },
            { id: 5, label: '5. Lembar Reviu SPI & Pengesahan Berjenjang' }
        ];

        let tabContentHtml = '';
        if (_lakipTab === 1 || _lakipTab === 2 || _lakipTab === 4) {
            const ikList = cols.tier4.list;
            tabContentHtml = `
                <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div class="bg-slate-100 px-4 py-2.5 font-bold text-slate-800 flex items-center justify-between">
                        <span>Matriks Indikator Kinerja, Target & Alokasi Pagu (Tahun ${_lakipYear})</span>
                        <span class="text-[11px] text-blue-800">${ikList.length} Indikator Terdeteksi</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse text-xs">
                            <thead class="bg-blue-50 text-blue-950 border-b">
                                <tr>
                                    <th class="p-2.5">Kode</th>
                                    <th class="p-2.5">Sasaran Kinerja</th>
                                    <th class="p-2.5">Nama Indikator Kinerja</th>
                                    <th class="p-2.5 text-center">Satuan</th>
                                    <th class="p-2.5 text-center">Target ${_lakipYear}</th>
                                    <th class="p-2.5 text-right">Pagu ${_lakipYear}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${ikList.length === 0 ? `<tr><td colspan="6" class="p-4 text-center text-slate-500">Belum ada indikator kinerja di database. Silakan isi di menu Input & Manajemen Renstra.</td></tr>` : ikList.map(ik => {
                                    const tVal = (ik.targetsByYear && ik.targetsByYear[_lakipYear]) ?? ik[`target${_lakipYear}`] ?? ik.target ?? 0;
                                    const pVal = (ik.paguByYear && ik.paguByYear[_lakipYear]) ?? ik[`pagu${_lakipYear}`] ?? ik.pagu ?? 0;
                                    return `
                                        <tr>
                                            <td class="p-2.5 font-bold text-blue-800">${esc(ik.kode || '-')}</td>
                                            <td class="p-2.5 text-slate-700">${esc(ik.sasaranKinerja || '-')}</td>
                                            <td class="p-2.5 font-semibold text-slate-900">${esc(ik.namaIndikator || ik.indikator || '-')}</td>
                                            <td class="p-2.5 text-center">${esc(ik.satuan || '%')}</td>
                                            <td class="p-2.5 text-center font-bold">${esc(tVal)}</td>
                                            <td class="p-2.5 text-right font-semibold">Rp ${Number(pVal || 0).toLocaleString('id-ID')}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } else if (_lakipTab === 3) {
            tabContentHtml = `
                <div class="space-y-4 bg-white border border-slate-200 rounded-xl p-5">
                    <div>
                        <label class="block font-bold text-slate-800 mb-1">Kata Pengantar LAKIP</label>
                        <textarea id="lakipFieldKataPengantar" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">${esc(rec.kataPengantar)}</textarea>
                    </div>
                    <div>
                        <label class="block font-bold text-slate-800 mb-1">Ringkasan Eksekutif Capaian Kinerja</label>
                        <textarea id="lakipFieldRingkasan" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">${esc(rec.ringkasanEksekutif)}</textarea>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Analisis Kendala & Hambatan</label>
                            <textarea id="lakipFieldKendala" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">${esc(rec.analisisKendala)}</textarea>
                        </div>
                        <div>
                            <label class="block font-bold text-slate-800 mb-1">Rencana Tindak Lanjut</label>
                            <textarea id="lakipFieldTindakLanjut" rows="3" class="w-full p-3 border border-slate-300 rounded-xl">${esc(rec.rencanaTindakLanjut)}</textarea>
                        </div>
                    </div>
                    <div class="flex justify-end">
                        <button type="button" onclick="saveLakipNarrativeFields()" class="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow cursor-pointer">
                            <i class="fa-solid fa-floppy-disk mr-1.5"></i>Simpan Narasi LAKIP
                        </button>
                    </div>
                </div>
            `;
        } else {
            // TAB 5: LEMBAR REVIU SPI & PENGESAHAN BERJENJANG (PENYUSUN -> SPI -> PUDIR II -> DIREKTUR)
            tabContentHtml = `
                <div class="space-y-4">
                    <!-- 4 Kartu Alur Berjenjang -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div class="p-3.5 rounded-xl border ${rec.status === 'DRAFT' || rec.status === 'REVISI' ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-slate-50'}">
                            <p class="text-[10px] font-bold uppercase text-slate-500">TAHAP 1: PENYUSUN (TIM PROGRAM)</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rec.tahap1.status)}</p>
                            <p class="text-[11px] text-slate-600 mt-0.5">Tanggal: ${esc(rec.tahap1.tanggal)}</p>
                        </div>
                        <div class="p-3.5 rounded-xl border ${rec.status === 'MENUNGGU_SPI' ? 'border-purple-500 bg-purple-50/70' : 'border-slate-200 bg-slate-50'}">
                            <p class="text-[10px] font-bold uppercase text-purple-700">TAHAP 2: REVIEWER (SPI)</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rec.tahap2.status)}</p>
                            <p class="text-[11px] text-slate-600 mt-0.5">Tanggal: ${esc(rec.tahap2.tanggal)}${rec.tahap2.oleh ? ' • ' + esc(rec.tahap2.oleh) : ''}</p>
                        </div>
                        <div class="p-3.5 rounded-xl border ${rec.status === 'MENUNGGU_PUDIR2' ? 'border-sky-500 bg-sky-50/70' : 'border-slate-200 bg-slate-50'}">
                            <p class="text-[10px] font-bold uppercase text-sky-700">TAHAP 3: PEMBANTU DIREKTUR II</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rec.tahap3.status)}</p>
                            <p class="text-[11px] text-slate-600 mt-0.5">Tanggal: ${esc(rec.tahap3.tanggal)}${rec.tahap3.oleh ? ' • ' + esc(rec.tahap3.oleh) : ''}</p>
                        </div>
                        <div class="p-3.5 rounded-xl border ${rec.status === 'MENUNGGU_DIREKTUR' || rec.status === 'DISAHKAN' ? 'border-emerald-500 bg-emerald-50/70' : 'border-slate-200 bg-slate-50'}">
                            <p class="text-[10px] font-bold uppercase text-emerald-700">TAHAP 4: PENGESAHAN DIREKTUR</p>
                            <p class="font-bold text-slate-900 mt-1">${esc(rec.tahap4.status)}</p>
                            <p class="text-[11px] text-slate-600 mt-0.5">Tanggal: ${esc(rec.tahap4.tanggal)}${rec.tahap4.oleh ? ' • ' + esc(rec.tahap4.oleh) : ''}</p>
                        </div>
                    </div>

                    <!-- Panel Tahap 1: Penyusun -->
                    <div class="bg-slate-50 border border-slate-300 rounded-2xl p-4 space-y-2.5">
                        <div class="flex items-center justify-between">
                            <h4 class="font-bold text-slate-900 text-sm">Panel Penyusun Laporan (Tim Program & Evaluasi)</h4>
                            <button type="button" onclick="handleLakipApprovalStep('PENYUSUN', 'SUBMIT')" class="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-paper-plane mr-1.5"></i>Ajukan / Kirim Ulang ke SPI
                            </button>
                        </div>
                        <input id="lakipNotePenyusun" type="text" value="${esc(rec.tahap1.catatan)}" placeholder="Catatan pengajuan dari Tim Penyusun (opsional)..." class="w-full p-2.5 bg-white border border-slate-300 rounded-xl">
                    </div>

                    <!-- Panel Tahap 2: Reviewer SPI -->
                    <div class="bg-purple-50/70 border border-purple-300 rounded-2xl p-4 space-y-2.5">
                        <h4 class="font-bold text-purple-950 text-sm">Panel Keputusan Reviewer (Satuan Pengawas Internal)</h4>
                        <label class="block font-bold text-slate-700">Catatan Hasil Pemeriksaan / Reviu SPI</label>
                        <textarea id="lakipNoteSpi" rows="2" class="w-full p-2.5 bg-white border border-slate-300 rounded-xl" placeholder="Tuliskan catatan hasil reviu SPI...">${esc(rec.tahap2.catatan)}</textarea>
                        <div class="flex flex-wrap gap-2.5">
                            <button type="button" onclick="handleLakipApprovalStep('SPI', 'APPROVE')" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-circle-check mr-1.5"></i>Valid (Teruskan ke Pembantu Direktur II)
                            </button>
                            <button type="button" onclick="handleLakipApprovalStep('SPI', 'REVISI')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-rotate-left mr-1.5"></i>Lakukan Perbaikan (Kembalikan ke Draf Penyusun)
                            </button>
                        </div>
                    </div>

                    <!-- Panel Tahap 3: Pembantu Direktur II -->
                    <div class="bg-sky-50/70 border border-sky-300 rounded-2xl p-4 space-y-2.5">
                        <h4 class="font-bold text-sky-950 text-sm">Panel Pemeriksaan & Persetujuan Pembantu Direktur II (Tahap 3)</h4>
                        <label class="block font-bold text-slate-700">Catatan Pemeriksaan Pembantu Direktur II</label>
                        <textarea id="lakipNotePudir2" rows="2" class="w-full p-2.5 bg-white border border-slate-300 rounded-xl" placeholder="Tuliskan catatan pemeriksaan substansi anggaran & kinerja oleh Pembantu Direktur II...">${esc(rec.tahap3.catatan)}</textarea>
                        <div class="flex flex-wrap gap-2.5">
                            <button type="button" onclick="handleLakipApprovalStep('PUDIR2', 'APPROVE')" class="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-circle-check mr-1.5"></i>Setujui & Teruskan ke Direktur
                            </button>
                            <button type="button" onclick="handleLakipApprovalStep('PUDIR2', 'REVISI')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-rotate-left mr-1.5"></i>Kembalikan untuk Perbaikan
                            </button>
                        </div>
                    </div>

                    <!-- Panel Tahap 4: Pengesahan Direktur -->
                    <div class="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-4 space-y-2.5">
                        <h4 class="font-bold text-emerald-950 text-sm">Panel Pengesahan Akhir Laporan Kinerja — Direktur (Tahap 4)</h4>
                        <label class="block font-bold text-slate-700">Catatan / Arahan Pengesahan Direktur</label>
                        <textarea id="lakipNoteDirektur" rows="2" class="w-full p-2.5 bg-white border border-slate-300 rounded-xl" placeholder="Tuliskan catatan pengesahan Direktur...">${esc(rec.tahap4.catatan)}</textarea>
                        <div class="flex flex-wrap gap-2.5">
                            <button type="button" onclick="handleLakipApprovalStep('DIREKTUR', 'APPROVE')" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-stamp mr-1.5"></i>Sahkan Laporan Kinerja (LAKIP)
                            </button>
                            <button type="button" onclick="handleLakipApprovalStep('DIREKTUR', 'REVISI')" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs cursor-pointer">
                                <i class="fa-solid fa-rotate-left mr-1.5"></i>Tolak / Kembalikan untuk Revisi
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        modal.innerHTML = `
            <div class="bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden" style="font-family: Arial, Helvetica, sans-serif;">
                <div class="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                    <div class="space-y-1">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">LAKIP PIPB</span>
                            <span class="px-3 py-0.5 border rounded-full text-[10px] font-bold ${badgeInfo.cls}">${badgeInfo.text}</span>
                        </div>
                        <h3 class="text-base font-bold text-slate-900 flex items-center gap-2">
                            <i class="fa-solid fa-book-open text-blue-700"></i> Penyusunan, Reviu SPI & Pengesahan Laporan LAKIP
                        </h3>
                    </div>
                    <div class="flex items-center gap-2.5">
                        <select onchange="changeLakipYear(this.value)" class="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900">
                            ${YEARS.map(y => `<option value="${y}" ${_lakipYear === y ? 'selected' : ''}>Tahun ${y}</option>`).join('')}
                        </select>
                        <button type="button" onclick="printLakipOfficialPdf()" ${isFinal ? '' : 'disabled'} class="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${isFinal ? 'bg-blue-700 hover:bg-blue-800 text-white shadow cursor-pointer' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}">
                            <i class="fa-solid ${isFinal ? 'fa-file-pdf' : 'fa-lock'}"></i>
                            <span>${isFinal ? 'Cetak PDF LAKIP' : 'Cetak PDF (Menunggu Pengesahan)'}</span>
                        </button>
                        <button type="button" onclick="closeLakipGeneratorModal()" class="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-700 font-bold cursor-pointer">&times;</button>
                    </div>
                </div>

                <div class="px-6 pt-3 bg-white border-b border-slate-200 flex flex-wrap gap-2">
                    ${tabs.map(t => `
                        <button type="button" onclick="switchLakipTab(${t.id})" class="px-3.5 py-2 rounded-t-xl text-xs font-bold border-b-2 transition cursor-pointer ${_lakipTab === t.id ? 'bg-purple-700 text-white border-purple-700' : 'bg-slate-100 text-slate-700 border-transparent hover:bg-slate-200'}">
                            ${t.label}
                        </button>
                    `).join('')}
                </div>

                <div class="p-6 overflow-y-auto text-xs space-y-4">
                    ${tabContentHtml}
                </div>
            </div>
        `;
    };

    // =====================================================================
    // 3. PERBAIKAN FOKUS KURSOR PENCARIAN PEJABAT / STAF / MULTI-ROLE
    // =====================================================================
    let _lastUserSearchState = null;

    document.addEventListener('input', function (e) {
        const el = e.target;
        if (!el || el.tagName !== 'INPUT') return;
        const ph = (el.getAttribute('placeholder') || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        if (ph.includes('nama') || ph.includes('email') || ph.includes('nip') || id.includes('search') || id.includes('cari')) {
            _lastUserSearchState = {
                value: el.value,
                selectionEnd: el.selectionEnd ?? el.value.length,
                id: el.id || '',
                placeholder: el.getAttribute('placeholder') || '',
                timestamp: Date.now()
            };
        }
    }, true);

    function restoreSearchInputFocus() {
        if (!_lastUserSearchState) return;
        if (Date.now() - _lastUserSearchState.timestamp > 1500) {
            _lastUserSearchState = null;
            return;
        }
        const active = document.activeElement;
        if (active && active.tagName === 'INPUT') {
            const actPh = (active.getAttribute('placeholder') || '').toLowerCase();
            if (actPh.includes('nama') || actPh.includes('email') || actPh.includes('nip')) return;
        }
        const candidates = Array.from(document.querySelectorAll('input[type="text"], input[type="search"], input:not([type])'));
        const targetInput = candidates.find(inp =>
            (_lastUserSearchState.id && inp.id === _lastUserSearchState.id) ||
            (_lastUserSearchState.placeholder && inp.getAttribute('placeholder') === _lastUserSearchState.placeholder)
        );
        if (targetInput) {
            targetInput.focus({ preventScroll: true });
            if (targetInput.value !== _lastUserSearchState.value) targetInput.value = _lastUserSearchState.value;
            const pos = Math.min(_lastUserSearchState.selectionEnd, targetInput.value.length);
            try { targetInput.setSelectionRange(pos, pos); } catch (_) {}
        }
    }

    const searchFocusObserver = new MutationObserver(restoreSearchInputFocus);

    // =====================================================================
    // 4. IMPORT & EXPORT DATA CSV TERPADU (TIER 1-4, CASCADING, RHK & IKI)
    // =====================================================================
    const CSV_SCHEMAS = {
        perencanaan_terpadu: {
            label: '1. Perencanaan Strategis Lengkap (Tier 1, Tier 2, Tier 3, Tier 4 + Target & Pagu 2025-2029)',
            filename: 'template_1_perencanaan_tier1_sd_tier4_lengkap.csv',
            exportPrefix: 'export_1_perencanaan_tier1_sd_tier4',
            description: 'Cukup 1 file CSV untuk mengisi atau mengekspor Tier 1 (Kemenperin), Tier 2 (BPSDMI), Tier 3 (Tujuan/Sasaran), dan Tier 4 (Indikator + Target & Pagu 2025–2029) sekaligus.',
            headers: [
                'kode_tier1', 'uraian_tier1_kemenperin',
                'kode_tier2', 'sasaran_program_tier2_bpsdmi', 'indikator_tier2_bpsdmi',
                'kode_tier3', 'jenis_tier3', 'sasaran_kinerja_tier3',
                'kode_tier4', 'nama_indikator_tier4', 'satuan',
                'target_2025', 'pagu_2025', 'target_2026', 'pagu_2026',
                'target_2027', 'pagu_2027', 'target_2028', 'pagu_2028', 'target_2029', 'pagu_2029'
            ],
            sample: [[
                'TS-1', 'Meningkatnya Daya Saing Industri Nasional yang Berkelanjutan',
                'SP-1', 'Meningkatnya Ketersediaan SDM Industri yang Kompeten', 'Persentase SDM Industri yang kompeten',
                'TJ 1', 'Tujuan', 'Meningkatnya Peran SDM Industri dalam Perekonomian Nasional melalui unit pendidikan tinggi vokasi',
                'TJ 1', 'Persentase SDM Industri yang kompeten*', '%',
                '90', '0', '90.5', '0', '91', '0', '91.5', '0', '92', '0'
            ]]
        },
        cascading_terpadu: {
            label: '2. Cascading Kinerja Lengkap (Level 1 Ketua Tim, Level 2 Unit/Prodi, Level 3 Dosen/Tendik/Kalab/Koord)',
            filename: 'template_2_cascading_level1_sd_level3.csv',
            exportPrefix: 'export_2_cascading_level1_sd_level3',
            description: 'Cukup 1 file CSV untuk seluruh jenjang Cascading (Level 1 Ketua Tim Kerja, Level 2 Ketua Unit/Prodi/Subbag, dan Level 3 Dosen/Tendik/Sekretaris/Kalab/Koordinator).',
            headers: [
                'tahun', 'level_cascading', 'kode_indikator_induk', 'nama_unit_atau_tim',
                'username_pegawai', 'jabatan_peran', 'rencana_aksi_atau_rhk',
                'indikator_kinerja', 'satuan', 'target_tahunan', 'tw1', 'tw2', 'tw3', 'tw4'
            ],
            sample: [['2025', '1', 'IK 1.1', 'Tim Kerja Akademik & Kemahasiswaan', 'ketuatim1', 'Ketua Tim Kerja', 'Meningkatkan serapan lulusan bersertifikat kompetensi industri', 'Persentase lulusan terserap industri', '%', '90', '0', '0', '45', '90']]
        },
        rhk_iki: {
            label: '3. Rencana Hasil Kerja (RHK) & Indikator Kinerja Individu (IKI) Staf',
            filename: 'template_3_rhk_iki_staf.csv',
            exportPrefix: 'export_3_rhk_iki_staf',
            description: 'Untuk meng-inject atau mengekspor RHK (Utama/Tambahan) beserta Indikator Kinerja Individu (IKI) dan realisasi triwulanan staf.',
            headers: [
                'tahun', 'username_pegawai', 'kode_ik_atasan', 'jenis_rhk',
                'rencana_hasil_kerja', 'aspek', 'indikator_kinerja_individu',
                'satuan', 'target_tahunan', 'realisasi_tw1', 'realisasi_tw2', 'realisasi_tw3', 'realisasi_tw4'
            ],
            sample: [['2025', 'deni.saputra', 'IK 3.3', 'Utama', 'Terpublikasinya artikel penelitian terapan pada jurnal bereputasi', 'Kuantitas', 'Jumlah artikel ilmiah terpublikasi', 'Artikel', '2', '0', '1', '1', '2']]
        }
    };

    let _selectedSchemaKey = 'perencanaan_terpadu';
    let _importLogs = [];
    let _importSummary = null;

    function cleanNumber(val) {
        if (val === undefined || val === null) return 0;
        let s = String(val).trim();
        if (s === '' || s === '-') return 0;
        s = s.replace(/^rp\.?\s*/i, '').trim();
        if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
        else s = s.replace(/,/g, '.');
        if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
        return parseFloat(s);
    }

    function downloadCsvRows(filename, headers, rows) {
        const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))];
        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function parseCsvText(rawText) {
        const text = String(rawText || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = [];
        let curRow = [], curCell = '', inQuotes = false;
        const firstLine = text.split('\n')[0] || '';
        const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
        for (let i = 0; i < text.length; i++) {
            const ch = text[i], nextCh = text[i + 1];
            if (ch === '"') {
                if (inQuotes && nextCh === '"') { curCell += '"'; i++; } else inQuotes = !inQuotes;
            } else if (ch === delimiter && !inQuotes) {
                curRow.push(curCell.trim()); curCell = '';
            } else if (ch === '\n' && !inQuotes) {
                curRow.push(curCell.trim());
                if (curRow.some(c => c !== '')) lines.push(curRow);
                curRow = []; curCell = '';
            } else curCell += ch;
        }
        if (curCell.length > 0 || curRow.length > 0) {
            curRow.push(curCell.trim());
            if (curRow.some(c => c !== '')) lines.push(curRow);
        }
        if (lines.length === 0) return { headers: [], rows: [], delimiter };
        const headers = lines[0].map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
        const rows = lines.slice(1).map((cells, idx) => {
            const obj = {};
            headers.forEach((h, cIdx) => { obj[h] = cells[cIdx] !== undefined ? cells[cIdx].trim() : ''; });
            return { rowNumber: idx + 2, data: obj };
        });
        return { headers, rows, delimiter };
    }

    function upsertRecord(arr, matchFn, newRecord) {
        const idx = arr.findIndex(matchFn);
        if (idx >= 0) {
            const existingId = arr[idx].id;
            arr[idx] = { ...arr[idx], ...newRecord, id: existingId };
            return { status: 'UPDATED', id: existingId };
        }
        const newId = `imp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        arr.push({ id: newId, ...newRecord });
        return { status: 'INSERTED', id: newId };
    }

    function buildExportRowsForSchema(schemaKey) {
        const cols = getKiJaroCollections();
        if (schemaKey === 'perencanaan_terpadu') {
            const rows = [], ikList = cols.tier4.list, skList = cols.tier3.list, t2List = cols.tier2.list, t1List = cols.tier1.list;
            const findTier3 = (ik) => {
                if (ik.sasaranId) { const b = skList.find(s => String(s.id) === String(ik.sasaranId)); if (b) return b; }
                if (ik.kodeTier3) { const b = skList.find(s => String(s.kode || '').toLowerCase() === String(ik.kodeTier3).toLowerCase()); if (b) return b; }
                const prefix = String(ik.sasaranKinerja || ik.sasaran || '').split(' - ')[0].trim();
                return prefix ? (skList.find(s => String(s.kode || '').toLowerCase() === prefix.toLowerCase()) || null) : null;
            };
            const findTier2 = (t3) => !t3 ? (t2List[0] || null) : (t2List.find(t => String(t.id) === String(t3.tier2Id) || String(t.kode || '').toLowerCase() === String(t3.kodeTier2 || '').toLowerCase()) || t2List[0] || null);
            const findTier1 = (t2) => !t2 ? (t1List[0] || null) : (t1List.find(t => String(t.id) === String(t2.tier1Id) || String(t.kode || '').toLowerCase() === String(t2.kodeTier1 || '').toLowerCase()) || t1List[0] || null);

            const covered = new Set();
            ikList.forEach(ik => {
                const t3 = findTier3(ik);
                if (t3) covered.add(String(t3.id || t3.kode || ''));
                const t2 = findTier2(t3), t1 = findTier1(t2);
                const rawSk = String(ik.sasaranKinerja || ik.sasaran || '');
                const k3 = t3 ? (t3.kode || '') : (ik.kodeTier3 || (rawSk.includes(' - ') ? rawSk.split(' - ')[0].trim() : ''));
                const u3 = t3 ? (t3.sasaranKinerja || t3.sasaran || '') : (rawSk.includes(' - ') ? rawSk.split(' - ').slice(1).join(' - ').trim() : rawSk);
                const j3 = t3 ? (t3.jenis || (k3.toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja')) : (k3.toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja');
                const intervensiRaw = t3 ? String(t3.intervensi || t3.intervensiBpsdmi || '') : '';
                const tByYear = ik.targetsByYear || ik.targets || {}, pByYear = ik.paguByYear || ik.pagus || {};
                const getT = (y) => tByYear[y] ?? ik[`target${y}`] ?? ik[`target_${y}`] ?? (y === '2025' ? (ik.target ?? 0) : 0);
                const getP = (y) => pByYear[y] ?? ik[`pagu${y}`] ?? ik[`pagu_${y}`] ?? (y === '2025' ? (ik.pagu ?? 0) : 0);

                rows.push([
                    t1 ? (t1.kode || '') : '', t1 ? (t1.uraian || t1.tujuanSasaran || '') : '',
                    t2 ? (t2.kode || '') : (t3?.kodeTier2 || ''), t2 ? (t2.sasaranProgram || '') : intervensiRaw, t2 ? (t2.indikatorProgram || '') : '',
                    k3, j3, u3, ik.kode || '', ik.namaIndikator || ik.indikator || '', ik.satuan || '%',
                    getT('2025'), getP('2025'), getT('2026'), getP('2026'), getT('2027'), getP('2027'), getT('2028'), getP('2028'), getT('2029'), getP('2029')
                ]);
            });
            skList.forEach(t3 => {
                if (covered.has(String(t3.id || t3.kode || ''))) return;
                const t2 = findTier2(t3), t1 = findTier1(t2);
                rows.push([
                    t1 ? (t1.kode || '') : '', t1 ? (t1.uraian || t1.tujuanSasaran || '') : '',
                    t2 ? (t2.kode || '') : (t3.kodeTier2 || ''), t2 ? (t2.sasaranProgram || '') : String(t3.intervensi || ''), t2 ? (t2.indikatorProgram || '') : '',
                    t3.kode || '', t3.jenis || 'Sasaran Kinerja', t3.sasaranKinerja || t3.sasaran || '', '', '', '%',
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ]);
            });
            return rows;
        }
        if (schemaKey === 'cascading_terpadu') {
            return cols.cascading.list.map(c => [
                c.tahun || '2025', c.level || 1, c.kodeIndikatorInduk || '', c.unit || '',
                c.pegawaiUsername || c.username || '', c.jabatanPeran || '', c.rencanaAksi || '',
                c.indikator || '', c.satuan || '%', c.target ?? 0, c.targetTw1 ?? 0, c.targetTw2 ?? 0, c.targetTw3 ?? 0, c.targetTw4 ?? 0
            ]);
        }
        if (schemaKey === 'rhk_iki') {
            return cols.rhk.list.map(r => [
                r.tahun || '2025', r.pegawaiUsername || r.username || '', r.kodeIkAtasan || '', r.jenisRhk || 'Utama',
                r.rhk || '', r.aspek || 'Kuantitas', r.indikator || '', r.satuan || 'Dokumen', r.target ?? 0,
                r.realisasiTw1 ?? 0, r.realisasiTw2 ?? 0, r.realisasiTw3 ?? 0, r.realisasiTw4 ?? 0
            ]);
        }
        return [];
    }

    function validateAndInjectRows(schemaKey, parsed) {
        const cols = getKiJaroCollections();
        const schema = CSV_SCHEMAS[schemaKey];
        const logs = [];
        let successCount = 0, failCount = 0;

        const missingHeaders = schema.headers.filter(h => !parsed.headers.includes(h));
        if (missingHeaders.length > 0) {
            return { fatalError: `Header kolom CSV tidak sesuai template! Kolom hilang: [${missingHeaders.join(', ')}].`, logs: [], successCount: 0, failCount: parsed.rows.length };
        }

        const findUser = (id) => {
            const q = String(id || '').trim().toLowerCase();
            return cols.users.list.find(u => String(u.username || '').toLowerCase() === q || String(u.nip || '').toLowerCase() === q || String(u.name || u.nama || '').toLowerCase() === q) || null;
        };

        parsed.rows.forEach(({ rowNumber, data }) => {
            const errors = [], detailActions = [];
            let summaryLabel = '';

            if (schemaKey === 'perencanaan_terpadu') {
                if (!data.kode_tier3) errors.push('"kode_tier3" wajib diisi');
                if (!data.sasaran_kinerja_tier3) errors.push('"sasaran_kinerja_tier3" wajib diisi');
                const targetsByYear = {}, paguByYear = {};
                YEARS.forEach(y => {
                    const tVal = cleanNumber(data[`target_${y}`]), pVal = cleanNumber(data[`pagu_${y}`]);
                    if (Number.isNaN(tVal)) errors.push(`"target_${y}" tidak valid`); else targetsByYear[y] = tVal;
                    if (Number.isNaN(pVal)) errors.push(`"pagu_${y}" tidak valid`); else paguByYear[y] = pVal;
                });
                summaryLabel = `${data.kode_tier4 || data.kode_tier3 || '-'} — ${data.nama_indikator_tier4 || data.sasaran_kinerja_tier3 || '(Kosong)'}`;

                if (errors.length === 0) {
                    let t1Id = '', t2Id = '';
                    if (data.kode_tier1 || data.uraian_tier1_kemenperin) {
                        const k1 = data.kode_tier1 || 'TS-1', u1 = data.uraian_tier1_kemenperin || k1;
                        const r1 = upsertRecord(cols.tier1.list, r => String(r.kode || '').toLowerCase() === k1.toLowerCase(), { tier: 1, kode: k1, uraian: u1, tujuanSasaran: u1 });
                        t1Id = r1.id; detailActions.push(`Tier 1 (${k1}: ${r1.status})`);
                    }
                    if (data.kode_tier2 || data.sasaran_program_tier2_bpsdmi) {
                        const k2 = data.kode_tier2 || 'SP-1', sp2 = data.sasaran_program_tier2_bpsdmi || k2, ik2 = data.indikator_tier2_bpsdmi || sp2;
                        const r2 = upsertRecord(cols.tier2.list, r => String(r.kode || '').toLowerCase() === k2.toLowerCase(), { tier: 2, tier1Id: t1Id, kodeTier1: data.kode_tier1 || '', kode: k2, sasaranProgram: sp2, indikatorProgram: ik2, satuan: data.satuan || '%' });
                        t2Id = r2.id; detailActions.push(`Tier 2 (${k2}: ${r2.status})`);
                    }
                    const k3 = data.kode_tier3, s3 = data.sasaran_kinerja_tier3;
                    const r3 = upsertRecord(cols.tier3.list, r => String(r.kode || '').toLowerCase() === k3.toLowerCase(), { tier: 3, tier2Id: t2Id, kodeTier2: data.kode_tier2 || '', intervensi: data.sasaran_program_tier2_bpsdmi || '', kode: k3, jenis: data.jenis_tier3 || 'Sasaran Kinerja', sasaranKinerja: s3, sasaran: s3 });
                    detailActions.push(`Tier 3 (${k3}: ${r3.status})`);

                    if (data.kode_tier4 && data.nama_indikator_tier4) {
                        const r4 = upsertRecord(cols.tier4.list, r => String(r.kode || '').toLowerCase() === data.kode_tier4.toLowerCase(), {
                            tier: 4, sasaranId: r3.id, kodeTier3: k3, sasaranKinerja: `${k3} - ${s3}`,
                            kode: data.kode_tier4, namaIndikator: data.nama_indikator_tier4, indikator: data.nama_indikator_tier4,
                            satuan: data.satuan || '%', targetsByYear, paguByYear,
                            target2025: targetsByYear['2025'], pagu2025: paguByYear['2025'],
                            target2026: targetsByYear['2026'], pagu2026: paguByYear['2026'],
                            target2027: targetsByYear['2027'], pagu2027: paguByYear['2027'],
                            target2028: targetsByYear['2028'], pagu2028: paguByYear['2028'],
                            target2029: targetsByYear['2029'], pagu2029: paguByYear['2029'],
                            target: targetsByYear['2025'], pagu: paguByYear['2025']
                        });
                        detailActions.push(`Tier 4 (${data.kode_tier4}: ${r4.status})`);
                    }
                }
            } else if (schemaKey === 'cascading_terpadu') {
                const yr = data.tahun || '2025', lvl = parseInt(data.level_cascading, 10);
                if (!/^\d{4}$/.test(yr)) errors.push('"tahun" harus 4 digit');
                if (![1, 2, 3].includes(lvl)) errors.push('"level_cascading" harus 1, 2, atau 3');
                if (!data.kode_indikator_induk || !data.username_pegawai || !data.indikator_kinerja) errors.push('Kolom wajib belum lengkap');
                const matchedUser = findUser(data.username_pegawai);
                const tTahunan = cleanNumber(data.target_tahunan), tw1 = cleanNumber(data.tw1), tw2 = cleanNumber(data.tw2), tw3 = cleanNumber(data.tw3), tw4 = cleanNumber(data.tw4);
                if ([tTahunan, tw1, tw2, tw3, tw4].some(v => Number.isNaN(v))) errors.push('Angka target tidak valid');
                summaryLabel = `Level ${lvl || '?'} | ${data.username_pegawai} — ${data.indikator_kinerja}`;
                if (errors.length === 0) {
                    const res = upsertRecord(cols.cascading.list, r => Number(r.level) === lvl && String(r.tahun) === yr && String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : data.username_pegawai).toLowerCase() && String(r.indikator || '').toLowerCase() === data.indikator_kinerja.toLowerCase(), {
                        level: lvl, tahun: yr, kodeIndikatorInduk: data.kode_indikator_induk, unit: data.nama_unit_atau_tim || (matchedUser?.unit || ''),
                        jabatanPeran: data.jabatan_peran || '', pegawaiUsername: matchedUser ? matchedUser.username : data.username_pegawai,
                        namaPegawai: matchedUser ? (matchedUser.name || matchedUser.nama) : data.username_pegawai,
                        rencanaAksi: data.rencana_aksi_atau_rhk || '', indikator: data.indikator_kinerja, satuan: data.satuan || '%',
                        target: tTahunan, targetTw1: tw1, targetTw2: tw2, targetTw3: tw3, targetTw4: tw4
                    });
                    detailActions.push(`Cascading Level ${lvl}: ${res.status}`);
                }
            } else if (schemaKey === 'rhk_iki') {
                const yr = data.tahun || '2025';
                if (!/^\d{4}$/.test(yr) || !data.username_pegawai || !data.rencana_hasil_kerja || !data.indikator_kinerja_individu) errors.push('Kolom wajib belum lengkap');
                const matchedUser = findUser(data.username_pegawai);
                const tTahunan = cleanNumber(data.target_tahunan), rTw1 = cleanNumber(data.realisasi_tw1), rTw2 = cleanNumber(data.realisasi_tw2), rTw3 = cleanNumber(data.realisasi_tw3), rTw4 = cleanNumber(data.realisasi_tw4);
                if ([tTahunan, rTw1, rTw2, rTw3, rTw4].some(v => Number.isNaN(v))) errors.push('Angka target/realisasi tidak valid');
                summaryLabel = `${data.username_pegawai} — ${data.indikator_kinerja_individu}`;
                if (errors.length === 0) {
                    const res = upsertRecord(cols.rhk.list, r => String(r.tahun) === yr && String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : data.username_pegawai).toLowerCase() && String(r.indikator || '').toLowerCase() === data.indikator_kinerja_individu.toLowerCase(), {
                        tahun: yr, pegawaiUsername: matchedUser ? matchedUser.username : data.username_pegawai, namaPegawai: matchedUser ? (matchedUser.name || matchedUser.nama) : data.username_pegawai,
                        unit: matchedUser ? (matchedUser.unit || '') : '', kodeIkAtasan: data.kode_ik_atasan || '', jenisRhk: data.jenis_rhk || 'Utama',
                        rhk: data.rencana_hasil_kerja, aspek: data.aspek || 'Kuantitas', indikator: data.indikator_kinerja_individu,
                        satuan: data.satuan || 'Dokumen', target: tTahunan, realisasiTw1: rTw1, realisasiTw2: rTw2, realisasiTw3: rTw3, realisasiTw4: rTw4
                    });
                    detailActions.push(`RHK & IKI: ${res.status}`);
                }
            }

            if (errors.length > 0) {
                failCount++; logs.push({ rowNumber, status: 'GAGAL', summary: summaryLabel, detail: errors.join('; ') });
            } else {
                successCount++; logs.push({ rowNumber, status: 'BERHASIL', summary: summaryLabel, detail: detailActions.join(' | ') });
            }
        });
        return { fatalError: null, logs, successCount, failCount };
    }

    window.changeCsvInjectorSchema = function (key) { _selectedSchemaKey = key; _importLogs = []; _importSummary = null; window.renderCsvInjectorModalBody(); };
    window.exportSelectedSchemaToCsv = function () {
        const schema = CSV_SCHEMAS[_selectedSchemaKey]; if (!schema) return;
        const rows = buildExportRowsForSchema(_selectedSchemaKey);
        if (rows.length === 0) { if (typeof showToast === 'function') showToast('Belum ada data di database untuk kelompok ini.', 'info'); return; }
        downloadCsvRows(`${schema.exportPrefix}_${new Date().toISOString().slice(0, 10)}.csv`, schema.headers, rows);
    };
    window.downloadSelectedCsvTemplate = function () { const s = CSV_SCHEMAS[_selectedSchemaKey]; if (s) downloadCsvRows(s.filename, s.headers, s.sample); };
    window.downloadImportExecutionLog = function () { if (_importLogs.length) downloadCsvRows(`log_import_${_selectedSchemaKey}_${Date.now()}.csv`, ['Baris', 'Status', 'Ringkasan', 'Keterangan'], _importLogs.map(l => [l.rowNumber, l.status, l.summary, l.detail])); };

    window.processUploadedCsvFile = function (inputEl) {
        const file = inputEl?.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (ev) {
            const parsed = parseCsvText(ev.target.result);
            const result = validateAndInjectRows(_selectedSchemaKey, parsed);
            _importLogs = result.logs;
            _importSummary = { fatalError: result.fatalError, fileName: file.name, total: parsed.rows.length, success: result.successCount, fail: result.failCount };
            if (!result.fatalError && result.successCount > 0) {
                await persistAllDbChanges();
                if (typeof renderCurrentView === 'function') renderCurrentView();
            }
            window.renderCsvInjectorModalBody();
            inputEl.value = '';
        };
        reader.readAsText(file, 'UTF-8');
    };

    window.openCsvInjectorModal = function () {
        let modal = document.getElementById(CSV_MODAL_ID);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = CSV_MODAL_ID;
            modal.className = 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto';
            document.body.appendChild(modal);
        }
        modal.classList.remove('hidden');
        window.renderCsvInjectorModalBody();
    };
    window.closeCsvInjectorModal = function () { const m = document.getElementById(CSV_MODAL_ID); if (m) m.classList.add('hidden'); };

    window.renderCsvInjectorModalBody = function () {
        const modal = document.getElementById(CSV_MODAL_ID); if (!modal) return;
        const schema = CSV_SCHEMAS[_selectedSchemaKey];
        const existingCount = buildExportRowsForSchema(_selectedSchemaKey).length;
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" style="font-family: Arial, Helvetica, sans-serif;">
                <div class="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Bulk CSV Import & Export</span>
                        <h3 class="text-base font-bold mt-1 flex items-center gap-2"><i class="fa-solid fa-file-csv text-emerald-300"></i> Import & Export Data Kinerja / Cascading via CSV</h3>
                    </div>
                    <button type="button" onclick="closeCsvInjectorModal()" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white font-bold">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto space-y-5 text-xs">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <label class="block font-bold text-slate-800 text-sm">1. Pilih Paket Data CSV</label>
                        <div class="flex flex-col lg:flex-row gap-2.5">
                            <select onchange="changeCsvInjectorSchema(this.value)" class="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900">
                                ${Object.entries(CSV_SCHEMAS).map(([k, v]) => `<option value="${k}" ${_selectedSchemaKey === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}
                            </select>
                            <button type="button" onclick="exportSelectedSchemaToCsv()" class="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow shrink-0 cursor-pointer">
                                <i class="fa-solid fa-file-export mr-1.5"></i>Export Data (.CSV) <span class="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">${existingCount} Baris</span>
                            </button>
                            <button type="button" onclick="downloadSelectedCsvTemplate()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow shrink-0 cursor-pointer">
                                <i class="fa-solid fa-download mr-1.5"></i>Template Kosong
                            </button>
                        </div>
                        <p class="text-[11px] text-slate-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">${esc(schema.description)}</p>
                    </div>
                    <div class="bg-blue-50/70 border-2 border-dashed border-blue-300 rounded-xl p-5 text-center space-y-2">
                        <p class="font-bold text-slate-900 text-sm">2. Unggah File CSV untuk Di-inject & Divalidasi</p>
                        <label class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-bold cursor-pointer shadow">
                            <i class="fa-solid fa-upload"></i> Pilih File .CSV & Inject Data
                            <input type="file" accept=".csv,text/csv" onchange="processUploadedCsvFile(this)" class="hidden">
                        </label>
                    </div>
                    ${_importSummary ? `
                        <div class="border border-slate-300 rounded-xl overflow-hidden">
                            <div class="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
                                <span class="font-bold">Hasil: ${_importSummary.success} Berhasil, ${_importSummary.fail} Gagal</span>
                                <button type="button" onclick="downloadImportExecutionLog()" class="px-3 py-1 bg-white/15 rounded-lg text-[11px] font-bold">Unduh Log (.CSV)</button>
                            </div>
                            <div class="max-h-60 overflow-y-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead class="bg-slate-100 border-b font-bold"><tr><th class="p-2">Baris</th><th class="p-2">Status</th><th class="p-2">Ringkasan</th><th class="p-2">Keterangan</th></tr></thead>
                                    <tbody class="divide-y">${_importLogs.map(l => `<tr><td class="p-2">Baris ${l.rowNumber}</td><td class="p-2 font-bold">${l.status}</td><td class="p-2">${esc(l.summary)}</td><td class="p-2">${esc(l.detail)}</td></tr>`).join('')}</tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    };

    // =====================================================================
    // 5. PENYUNTIKAN MENU SIDEBAR & HEADER (LAKIP GENERATOR + CSV)
    // =====================================================================
    function injectNavigationButtons() {
        const sidebarNav = document.querySelector('aside nav, #sidebarNav, aside ul');
        if (sidebarNav) {
            if (!document.getElementById(LAKIP_NAV_BTN_ID)) {
                const lakipBtn = document.createElement('button');
                lakipBtn.id = LAKIP_NAV_BTN_ID;
                lakipBtn.type = 'button';
                lakipBtn.onclick = function () { window.openLakipGeneratorModal(5); };
                lakipBtn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 mt-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition cursor-pointer';
                lakipBtn.innerHTML = `<i class="fa-solid fa-book-open w-4 text-center"></i><span>Penyusunan & Reviu LAKIP</span>`;
                sidebarNav.appendChild(lakipBtn);
            }

            if (!document.getElementById(CSV_MENU_BTN_ID)) {
                const csvBtn = document.createElement('button');
                csvBtn.id = CSV_MENU_BTN_ID;
                csvBtn.type = 'button';
                csvBtn.onclick = window.openCsvInjectorModal;
                csvBtn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 mt-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer';
                csvBtn.innerHTML = `<i class="fa-solid fa-file-csv w-4 text-center"></i><span>Import / Export CSV</span>`;
                sidebarNav.appendChild(csvBtn);
            }
        }

        // Tambahkan juga tombol pintas di header atas agar selalu terlihat dari halaman mana pun
        const headerActions = document.querySelector('header .flex.items-center.gap-2, header > div:last-child');
        if (headerActions && !document.getElementById(LAKIP_HEADER_BTN_ID)) {
            const hLakip = document.createElement('button');
            hLakip.id = LAKIP_HEADER_BTN_ID;
            hLakip.type = 'button';
            hLakip.onclick = function () { window.openLakipGeneratorModal(5); };
            hLakip.className = 'px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer';
            hLakip.innerHTML = `<i class="fa-solid fa-book-open"></i><span>LAKIP & Reviu SPI</span>`;
            headerActions.prepend(hLakip);
        }
    }

    function bootModule() {
        if (document.body) {
            searchFocusObserver.observe(document.body, { childList: true, subtree: true });
        }
        injectNavigationButtons();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootModule);
    } else {
        bootModule();
    }
    setInterval(injectNavigationButtons, 1000);
})();
