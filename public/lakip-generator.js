// =========================================================================
// INTEGRASI TERPADU DI DALAM LAKIP-GENERATOR.JS:
// 1. Perbaikan Reviu SPI, Pemeriksaan Pudir II & Pengesahan Direktur (LAKIP)
// 2. Perbaikan Fokus Kursor Pencarian Pejabat / Staf / Multi-Role
// 3. Import & Export Data CSV Terpadu (Tier 1-4, Cascading L1-3, RHK & IKI)
// =========================================================================
(function () {
    // =====================================================================
    // BAGIAN A: PERBAIKAN FOKUS KURSOR PENCARIAN PEJABAT / STAF / MULTI-ROLE
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
                selectionStart: el.selectionStart ?? el.value.length,
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
        const targetInput = candidates.find(inp => {
            if (_lastUserSearchState.id && inp.id === _lastUserSearchState.id) return true;
            if (_lastUserSearchState.placeholder && inp.getAttribute('placeholder') === _lastUserSearchState.placeholder) return true;
            return false;
        });

        if (targetInput) {
            targetInput.focus({ preventScroll: true });
            if (targetInput.value !== _lastUserSearchState.value) {
                targetInput.value = _lastUserSearchState.value;
            }
            const pos = Math.min(_lastUserSearchState.selectionEnd, targetInput.value.length);
            try { targetInput.setSelectionRange(pos, pos); } catch (_) {}
        }
    }

    const searchFocusObserver = new MutationObserver(restoreSearchInputFocus);

    // =====================================================================
    // BAGIAN B: REVIU SPI, PEMERIKSAAN PUDIR II & PENGESAHAN DIREKTUR (LAKIP)
    // =====================================================================
    function getActiveLakipYear() {
        const selects = Array.from(document.querySelectorAll('select'));
        for (const sel of selects) {
            const txt = sel.options[sel.selectedIndex]?.text || sel.value || '';
            const m = txt.match(/20\d{2}/);
            if (m) return m[0];
        }
        return '2025';
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
            name: u?.name || u?.nama || 'Pejabat Pemeriksa',
            username: u?.username || 'system'
        };
    }

    function getTodayFormatted() {
        return new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function getOrInitLakipApprovalRecord(year) {
        const root = getRootDbObject();
        if (!root.lakipApproval || typeof root.lakipApproval !== 'object') root.lakipApproval = {};
        if (!root.lakipApproval[year]) {
            root.lakipApproval[year] = {
                tahun: year,
                status: 'MENUNGGU_SPI',
                tahap1: { status: 'Diajukan ke SPI', tanggal: getTodayFormatted(), oleh: 'Tim Program & Evaluasi' },
                tahap2: { status: 'Menunggu Reviu', tanggal: '-', catatan: '', oleh: '' },
                tahap3: { status: 'Menunggu Persetujuan', tanggal: '-', catatan: '', oleh: '' },
                tahap4: { status: 'Menunggu Pengesahan', tanggal: '-', catatan: '', oleh: '' }
            };
        }
        return root.lakipApproval[year];
    }

    async function persistAllDbChanges() {
        try {
            if (typeof saveToMySQL === 'function') await saveToMySQL();
            if (typeof saveDB === 'function') saveDB();
            const root = getRootDbObject();
            localStorage.setItem('kijaro_lakip_approval_backup', JSON.stringify(root.lakipApproval || {}));
        } catch (err) {
            console.warn('Gagal sinkronisasi penyimpanan:', err);
        }
    }

    async function executeLakipDecision(stage, decision, panelEl) {
        const year = getActiveLakipYear();
        const rec = getOrInitLakipApprovalRecord(year);
        const actor = getCurrentActorInfo();
        const today = getTodayFormatted();
        const ta = panelEl ? panelEl.querySelector('textarea, input[type="text"]') : null;
        const note = ta ? ta.value.trim() : '';

        if (decision === 'REVISI' && !note) {
            if (typeof showToast === 'function') {
                showToast('Harap isi Catatan Hasil Pemeriksaan / Alasan Perbaikan terlebih dahulu!', 'error');
            } else {
                alert('Harap isi Catatan Hasil Pemeriksaan / Alasan Perbaikan terlebih dahulu!');
            }
            if (ta) ta.focus();
            return;
        }

        if (stage === 'SPI') {
            if (decision === 'APPROVE') {
                rec.status = 'MENUNGGU_PUDIR2';
                rec.tahap1 = { status: 'Telah Diajukan', tanggal: rec.tahap1.tanggal !== '-' ? rec.tahap1.tanggal : today, oleh: rec.tahap1.oleh };
                rec.tahap2 = { status: 'Valid / Direviu SPI', tanggal: today, catatan: note || 'Dokumen LAKIP telah direviu dan dinyatakan valid oleh SPI.', oleh: actor.name };
                rec.tahap3 = { status: 'Menunggu Pemeriksaan Pudir II', tanggal: '-', catatan: rec.tahap3.catatan || '', oleh: '' };
                if (typeof showToast === 'function') showToast('Reviu SPI Valid! Diteruskan ke Pembantu Direktur II.', 'success');
            } else {
                rec.status = 'REVISI';
                rec.tahap2 = { status: 'Dikembalikan (Perlu Perbaikan)', tanggal: today, catatan: note, oleh: actor.name };
                if (typeof showToast === 'function') showToast('Dokumen LAKIP dikembalikan ke Penyusun untuk perbaikan.', 'info');
            }
        } else if (stage === 'PUDIR2') {
            if (decision === 'APPROVE') {
                rec.status = 'MENUNGGU_DIREKTUR';
                rec.tahap3 = { status: 'Disetujui Pembantu Direktur II', tanggal: today, catatan: note || 'Telah diperiksa dan disetujui oleh Pembantu Direktur II.', oleh: actor.name };
                rec.tahap4 = { status: 'Menunggu Pengesahan Direktur', tanggal: '-', catatan: rec.tahap4.catatan || '', oleh: '' };
                if (typeof showToast === 'function') showToast('Persetujuan Pembantu Direktur II tersimpan! Diteruskan ke Direktur.', 'success');
            } else {
                rec.status = 'REVISI';
                rec.tahap3 = { status: 'Dikembalikan oleh Pudir II', tanggal: today, catatan: note, oleh: actor.name };
                if (typeof showToast === 'function') showToast('Dokumen LAKIP dikembalikan oleh Pembantu Direktur II untuk perbaikan.', 'info');
            }
        } else if (stage === 'DIREKTUR') {
            if (decision === 'APPROVE') {
                rec.status = 'DISAHKAN';
                rec.tahap4 = { status: 'Disahkan oleh Direktur', tanggal: today, catatan: note || 'Laporan Kinerja (LAKIP) resmi disahkan oleh Direktur.', oleh: actor.name };
                if (typeof showToast === 'function') showToast('LAKIP Resmi Disahkan oleh Direktur! Tombol Cetak PDF kini aktif.', 'success');
            } else {
                rec.status = 'REVISI';
                rec.tahap4 = { status: 'Dikembalikan oleh Direktur', tanggal: today, catatan: note, oleh: actor.name };
                if (typeof showToast === 'function') showToast('Dokumen LAKIP dikembalikan oleh Direktur untuk perbaikan.', 'info');
            }
        }

        await persistAllDbChanges();
        syncLakipApprovalUi();
    }

    function syncLakipApprovalUi() {
        const pageHeading = Array.from(document.querySelectorAll('h1, h2, h3, div'))
            .find(el => el.textContent && el.textContent.includes('Penyusunan, Reviu SPI & Pengesahan Laporan LAKIP'));
        if (!pageHeading) return;

        const year = getActiveLakipYear();
        const rec = getOrInitLakipApprovalRecord(year);

        const topBadge = Array.from(document.querySelectorAll('span, div'))
            .find(el => el.children.length === 0 && /MENUNGGU REVIEW SPI|MENUNGGU PEMERIKSAAN|MENUNGGU PENGESAHAN|TELAH DISAHKAN|REVISI/i.test(el.textContent));
        if (topBadge) {
            const mapBadge = {
                'MENUNGGU_SPI': '2. MENUNGGU REVIEW SPI (Role Reviewer)',
                'MENUNGGU_PUDIR2': '3. MENUNGGU PEMERIKSAAN PEMBANTU DIREKTUR II',
                'MENUNGGU_DIREKTUR': '4. MENUNGGU PENGESAHAN DIREKTUR',
                'DISAHKAN': '5. TELAH DISAHKAN DIREKTUR (FINAL)',
                'REVISI': 'REVISI — DIKEMBALIKAN KE PENYUSUN'
            };
            topBadge.textContent = mapBadge[rec.status] || topBadge.textContent;
        }

        const stageCards = Array.from(document.querySelectorAll('div'))
            .filter(d => d.children.length >= 2 && /TAHAP [1-4]:/i.test(d.textContent) && d.textContent.length < 220);

        stageCards.forEach(card => {
            const txt = card.textContent;
            let info = null;
            if (txt.includes('TAHAP 1:')) info = rec.tahap1;
            else if (txt.includes('TAHAP 2:')) info = rec.tahap2;
            else if (txt.includes('TAHAP 3:')) info = rec.tahap3;
            else if (txt.includes('TAHAP 4:')) info = rec.tahap4;

            if (info) {
                const lines = Array.from(card.querySelectorAll('p, div, span')).filter(el => el.children.length === 0);
                if (lines[1]) lines[1].textContent = info.status;
                if (lines[2]) lines[2].textContent = `Tanggal: ${info.tanggal}${info.oleh ? ' (' + info.oleh + ')' : ''}`;
            }
        });

        const pdfBtn = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent && b.textContent.includes('Cetak PDF'));
        if (pdfBtn && rec.status === 'DISAHKAN') {
            pdfBtn.disabled = false;
            pdfBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-slate-200', 'text-slate-500');
            pdfBtn.classList.add('bg-blue-700', 'hover:bg-blue-800', 'text-white', 'cursor-pointer');
            pdfBtn.innerHTML = `<i class="fa-solid fa-file-pdf mr-1.5"></i> Cetak PDF LAKIP (Disahkan)`;
        }

        const spiPanel = Array.from(document.querySelectorAll('div'))
            .find(d => d.textContent && d.textContent.includes('Panel Keputusan Reviewer (Satuan Pengawas Internal)') && d.querySelector('textarea'));

        if (spiPanel && !document.getElementById('kiJaroLakipExtendedPanels')) {
            const container = document.createElement('div');
            container.id = 'kiJaroLakipExtendedPanels';
            container.className = 'space-y-4 mt-4';
            container.innerHTML = `
                <div id="panelLakipPudir2" class="bg-sky-50/70 border border-sky-300 rounded-2xl p-5 space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <h4 class="font-bold text-sky-950 text-sm">Panel Pemeriksaan & Persetujuan Pembantu Direktur II (Tahap 3)</h4>
                        <span id="badgeLakipPudir2" class="px-2.5 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 rounded-full text-[11px] font-bold">Status: ${rec.tahap3.status}</span>
                    </div>
                    <label class="block text-xs font-bold text-slate-700">Catatan Pemeriksaan Pembantu Direktur II</label>
                    <textarea rows="2" class="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900" placeholder="Tuliskan catatan pemeriksaan substansi anggaran & capaian kinerja oleh Pembantu Direktur II...">${rec.tahap3.catatan || ''}</textarea>
                    <div class="flex flex-wrap gap-2.5">
                        <button type="button" data-lakip-stage="PUDIR2" data-lakip-action="APPROVE" class="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5">
                            <i class="fa-solid fa-circle-check"></i> Setujui & Teruskan ke Direktur
                        </button>
                        <button type="button" data-lakip-stage="PUDIR2" data-lakip-action="REVISI" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5">
                            <i class="fa-solid fa-rotate-left"></i> Kembalikan untuk Perbaikan
                        </button>
                    </div>
                </div>

                <div id="panelLakipDirektur" class="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                        <h4 class="font-bold text-emerald-950 text-sm">Panel Pengesahan Akhir Laporan Kinerja — Direktur (Tahap 4)</h4>
                        <span id="badgeLakipDirektur" class="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-[11px] font-bold">Status: ${rec.tahap4.status}</span>
                    </div>
                    <label class="block text-xs font-bold text-slate-700">Catatan / Arahan Pengesahan Direktur</label>
                    <textarea rows="2" class="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs text-slate-900" placeholder="Tuliskan arahan atau catatan pengesahan Direktur...">${rec.tahap4.catatan || ''}</textarea>
                    <div class="flex flex-wrap gap-2.5">
                        <button type="button" data-lakip-stage="DIREKTUR" data-lakip-action="APPROVE" class="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5">
                            <i class="fa-solid fa-stamp"></i> Sahkan Laporan Kinerja (LAKIP)
                        </button>
                        <button type="button" data-lakip-stage="DIREKTUR" data-lakip-action="REVISI" class="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5">
                            <i class="fa-solid fa-rotate-left"></i> Tolak / Kembalikan untuk Revisi
                        </button>
                    </div>
                </div>
            `;
            spiPanel.parentElement.insertBefore(container, spiPanel.nextSibling);
        } else {
            const b3 = document.getElementById('badgeLakipPudir2');
            const b4 = document.getElementById('badgeLakipDirektur');
            if (b3) b3.textContent = `Status: ${rec.tahap3.status}`;
            if (b4) b4.textContent = `Status: ${rec.tahap4.status}`;
        }
    }

    document.addEventListener('click', function (e) {
        const btn = e.target.closest('button');
        if (!btn) return;

        const customStage = btn.getAttribute('data-lakip-stage');
        const customAction = btn.getAttribute('data-lakip-action');
        if (customStage && customAction) {
            e.preventDefault();
            e.stopPropagation();
            executeLakipDecision(customStage, customAction, btn.closest('div[id^="panelLakip"]'));
            return;
        }

        const label = (btn.textContent || '').trim();
        if (label.includes('Valid (Teruskan ke Pembantu Direktur II)')) {
            e.preventDefault();
            e.stopPropagation();
            executeLakipDecision('SPI', 'APPROVE', btn.closest('div.rounded-2xl, div.border') || btn.parentElement?.parentElement);
        } else if (label.includes('Lakukan Perbaikan (Kembalikan ke Draf Penyusun)')) {
            e.preventDefault();
            e.stopPropagation();
            executeLakipDecision('SPI', 'REVISI', btn.closest('div.rounded-2xl, div.border') || btn.parentElement?.parentElement);
        }
    }, true);

    // =====================================================================
    // BAGIAN C: IMPORT & EXPORT DATA CSV TERPADU (TIER 1-4, CASCADING, RHK)
    // =====================================================================
    const MENU_BTN_ID = 'kiJaroCsvInjectNavBtn';
    const MODAL_ID = 'kiJaroCsvInjectModal';
    const YEARS = ['2025', '2026', '2027', '2028', '2029'];

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
                ]
            ]
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
            sample: [
                ['2025', '1', 'IK 1.1', 'Tim Kerja Akademik & Kemahasiswaan', 'ketuatim1', 'Ketua Tim Kerja', 'Meningkatkan serapan lulusan bersertifikat kompetensi industri', 'Persentase lulusan terserap industri', '%', '90', '0', '0', '45', '90'],
                ['2025', '2', 'IK 1.1', 'Prodi D3 Teknologi Proses Industri Petrokimia', 'kaprodi_tpip', 'Ketua Prodi', 'Pelaksanaan uji kompetensi LSP & rekrutmen industri mitra', 'Persentase lulusan TPIP terserap industri', '%', '92', '0', '0', '50', '92'],
                ['2025', '3', 'IK 1.1', 'Prodi D3 Teknologi Proses Industri Petrokimia', 'deni.saputra', 'Dosen', 'Membimbing tugas akhir mahasiswa berbasis kasus nyata industri petrokimia', 'Jumlah mahasiswa bimbingan lulus tepat waktu dan tersertifikasi', 'Mahasiswa', '12', '3', '6', '9', '12']
            ]
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

    function getRootDbObject() {
        if (typeof DB !== 'undefined' && DB && typeof DB === 'object') return DB;
        if (window.DB && typeof window.DB === 'object') return window.DB;
        if (window.db && typeof window.db === 'object') return window.db;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (!k) continue;
                const raw = localStorage.getItem(k);
                if (raw && raw.startsWith('{') && (raw.includes('sasaran') || raw.includes('indikator') || raw.includes('cascading'))) {
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
        const lines = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        ];
        const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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
                if (inQuotes && nextCh === '"') { curCell += '"'; i++; }
                else inQuotes = !inQuotes;
            } else if (ch === delimiter && !inQuotes) {
                curRow.push(curCell.trim()); curCell = '';
            } else if (ch === '\n' && !inQuotes) {
                curRow.push(curCell.trim());
                if (curRow.some(c => c !== '')) lines.push(curRow);
                curRow = []; curCell = '';
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
            const rows = [];
            const ikList = cols.tier4.list;
            const skList = cols.tier3.list;
            const t2List = cols.tier2.list;
            const t1List = cols.tier1.list;

            const findTier3 = (ik) => {
                if (ik.sasaranId) {
                    const byId = skList.find(s => String(s.id) === String(ik.sasaranId));
                    if (byId) return byId;
                }
                if (ik.kodeTier3) {
                    const byKode = skList.find(s => String(s.kode || '').toLowerCase() === String(ik.kodeTier3).toLowerCase());
                    if (byKode) return byKode;
                }
                const prefix = String(ik.sasaranKinerja || ik.sasaran || '').split(' - ')[0].trim();
                return prefix ? (skList.find(s => String(s.kode || '').toLowerCase() === prefix.toLowerCase()) || null) : null;
            };

            const findTier2 = (t3) => {
                if (!t3) return t2List[0] || null;
                if (t3.tier2Id) return t2List.find(t => String(t.id) === String(t3.tier2Id)) || t2List[0] || null;
                if (t3.kodeTier2) return t2List.find(t => String(t.kode || '').toLowerCase() === String(t3.kodeTier2).toLowerCase()) || t2List[0] || null;
                return t2List[0] || null;
            };

            const findTier1 = (t2) => {
                if (!t2) return t1List[0] || null;
                if (t2.tier1Id) return t1List.find(t => String(t.id) === String(t2.tier1Id)) || t1List[0] || null;
                if (t2.kodeTier1) return t1List.find(t => String(t.kode || '').toLowerCase() === String(t2.kodeTier1).toLowerCase()) || t1List[0] || null;
                return t1List[0] || null;
            };

            const coveredTier3Keys = new Set();
            ikList.forEach(ik => {
                const t3 = findTier3(ik);
                if (t3) coveredTier3Keys.add(String(t3.id || t3.kode || ''));
                const t2 = findTier2(t3);
                const t1 = findTier1(t2);

                const rawSk = String(ik.sasaranKinerja || ik.sasaran || '');
                const parsedKode3 = t3 ? (t3.kode || '') : (ik.kodeTier3 || (rawSk.includes(' - ') ? rawSk.split(' - ')[0].trim() : ''));
                const parsedUraian3 = t3 ? (t3.sasaranKinerja || t3.sasaran || '') : (rawSk.includes(' - ') ? rawSk.split(' - ').slice(1).join(' - ').trim() : rawSk);
                const parsedJenis3 = t3 ? (t3.jenis || (parsedKode3.toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja')) : (parsedKode3.toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja');
                const intervensiRaw = t3 ? String(t3.intervensi || t3.intervensiBpsdmi || '') : '';

                const tByYear = ik.targetsByYear || ik.targets || {};
                const pByYear = ik.paguByYear || ik.pagus || {};
                const getTarget = (y) => tByYear[y] ?? ik[`target${y}`] ?? ik[`target_${y}`] ?? (y === '2025' ? (ik.target ?? 0) : 0);
                const getPagu = (y) => pByYear[y] ?? ik[`pagu${y}`] ?? ik[`pagu_${y}`] ?? (y === '2025' ? (ik.pagu ?? 0) : 0);

                rows.push([
                    t1 ? (t1.kode || '') : (t2?.kodeTier1 || ''),
                    t1 ? (t1.uraian || t1.tujuanSasaran || '') : '',
                    t2 ? (t2.kode || '') : (t3?.kodeTier2 || (intervensiRaw.includes(' - ') ? intervensiRaw.split(' - ')[0].trim() : '')),
                    t2 ? (t2.sasaranProgram || '') : intervensiRaw,
                    t2 ? (t2.indikatorProgram || '') : '',
                    parsedKode3,
                    parsedJenis3,
                    parsedUraian3,
                    ik.kode || '',
                    ik.namaIndikator || ik.indikator || '',
                    ik.satuan || '%',
                    getTarget('2025'), getPagu('2025'),
                    getTarget('2026'), getPagu('2026'),
                    getTarget('2027'), getPagu('2027'),
                    getTarget('2028'), getPagu('2028'),
                    getTarget('2029'), getPagu('2029')
                ]);
            });

            skList.forEach(t3 => {
                const key = String(t3.id || t3.kode || '');
                if (coveredTier3Keys.has(key)) return;
                const t2 = findTier2(t3);
                const t1 = findTier1(t2);
                const intervensiRaw = String(t3.intervensi || t3.intervensiBpsdmi || '');
                rows.push([
                    t1 ? (t1.kode || '') : (t2?.kodeTier1 || ''),
                    t1 ? (t1.uraian || t1.tujuanSasaran || '') : '',
                    t2 ? (t2.kode || '') : (t3.kodeTier2 || ''),
                    t2 ? (t2.sasaranProgram || '') : intervensiRaw,
                    t2 ? (t2.indikatorProgram || '') : '',
                    t3.kode || '',
                    t3.jenis || (String(t3.kode || '').toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja'),
                    t3.sasaranKinerja || t3.sasaran || '',
                    '', '', '%',
                    0, 0, 0, 0, 0, 0, 0, 0, 0, 0
                ]);
            });
            return rows;
        }

        if (schemaKey === 'cascading_terpadu') {
            return cols.cascading.list.map(c => [
                c.tahun || '2025', c.level || 1, c.kodeIndikatorInduk || c.kodeIk || '', c.unit || c.timKerja || '',
                c.pegawaiUsername || c.username || '', c.jabatanPeran || c.jabatan || '', c.rencanaAksi || c.rhk || '',
                c.indikator || c.namaIndikator || '', c.satuan || '%', c.target ?? 0,
                c.targetTw1 ?? c.tw1 ?? 0, c.targetTw2 ?? c.tw2 ?? 0, c.targetTw3 ?? c.tw3 ?? 0, c.targetTw4 ?? c.tw4 ?? 0
            ]);
        }

        if (schemaKey === 'rhk_iki') {
            return cols.rhk.list.map(r => [
                r.tahun || '2025', r.pegawaiUsername || r.username || '', r.kodeIkAtasan || '', r.jenisRhk || r.jenis || 'Utama',
                r.rhk || r.rencanaHasilKerja || '', r.aspek || 'Kuantitas', r.indikator || r.iki || '',
                r.satuan || 'Dokumen', r.target ?? 0,
                r.realisasiTw1 ?? r.tw1 ?? 0, r.realisasiTw2 ?? r.tw2 ?? 0, r.realisasiTw3 ?? r.tw3 ?? 0, r.realisasiTw4 ?? r.tw4 ?? 0
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
            return {
                fatalError: `Header kolom CSV tidak sesuai template! Kolom yang hilang: [${missingHeaders.join(', ')}].`,
                logs: [], successCount: 0, failCount: parsed.rows.length
            };
        }

        const findUser = (id) => {
            const q = String(id || '').trim().toLowerCase();
            return cols.users.list.find(u =>
                String(u.username || '').toLowerCase() === q ||
                String(u.nip || '').toLowerCase() === q ||
                String(u.name || u.nama || '').toLowerCase() === q
            ) || null;
        };

        parsed.rows.forEach(({ rowNumber, data }) => {
            const errors = [], detailActions = [];
            let summaryLabel = '';

            if (schemaKey === 'perencanaan_terpadu') {
                if (!data.kode_tier3) errors.push('Kolom "kode_tier3" wajib diisi');
                if (!data.sasaran_kinerja_tier3) errors.push('Kolom "sasaran_kinerja_tier3" wajib diisi');

                const targetsByYear = {}, paguByYear = {};
                YEARS.forEach(y => {
                    const tVal = cleanNumber(data[`target_${y}`]);
                    const pVal = cleanNumber(data[`pagu_${y}`]);
                    if (Number.isNaN(tVal)) errors.push(`"target_${y}" bukan angka valid ("${data[`target_${y}`]}")`);
                    else targetsByYear[y] = tVal;
                    if (Number.isNaN(pVal)) errors.push(`"pagu_${y}" bukan angka rupiah valid ("${data[`pagu_${y}`]}")`);
                    else paguByYear[y] = pVal;
                });

                summaryLabel = `${data.kode_tier4 || data.kode_tier3 || '-'} — ${data.nama_indikator_tier4 || data.sasaran_kinerja_tier3 || '(Kosong)'}`;

                if (errors.length === 0) {
                    let t1Id = '', t2Id = '';
                    if (data.kode_tier1 || data.uraian_tier1_kemenperin) {
                        const k1 = data.kode_tier1 || 'TS-1', u1 = data.uraian_tier1_kemenperin || k1;
                        const res1 = upsertRecord(cols.tier1.list, r => String(r.kode || '').toLowerCase() === k1.toLowerCase(),
                            { tier: 1, kode: k1, uraian: u1, tujuanSasaran: u1, tahunAwal: '2025', tahunAkhir: '2029' });
                        t1Id = res1.id; detailActions.push(`Tier 1 (${k1}: ${res1.status})`);
                    }
                    if (data.kode_tier2 || data.sasaran_program_tier2_bpsdmi || data.indikator_tier2_bpsdmi) {
                        const k2 = data.kode_tier2 || 'SP-1', sp2 = data.sasaran_program_tier2_bpsdmi || k2, ik2 = data.indikator_tier2_bpsdmi || sp2;
                        const res2 = upsertRecord(cols.tier2.list, r => String(r.kode || '').toLowerCase() === k2.toLowerCase() && String(r.indikatorProgram || '').toLowerCase() === ik2.toLowerCase(),
                            { tier: 2, tier1Id: t1Id, kodeTier1: data.kode_tier1 || '', kode: k2, sasaranProgram: sp2, indikatorProgram: ik2, satuan: data.satuan || '%' });
                        t2Id = res2.id; detailActions.push(`Tier 2 (${k2}: ${res2.status})`);
                    }
                    const k3 = data.kode_tier3, s3 = data.sasaran_kinerja_tier3;
                    const j3 = data.jenis_tier3 || (k3.toUpperCase().startsWith('TJ') ? 'Tujuan' : 'Sasaran Kinerja');
                    const res3 = upsertRecord(cols.tier3.list, r => String(r.kode || '').toLowerCase() === k3.toLowerCase(),
                        { tier: 3, tier2Id: t2Id, kodeTier2: data.kode_tier2 || '', intervensi: data.sasaran_program_tier2_bpsdmi || '', kode: k3, jenis: j3, sasaranKinerja: s3, sasaran: s3 });
                    detailActions.push(`Tier 3 (${k3}: ${res3.status})`);

                    if (data.kode_tier4 && data.nama_indikator_tier4) {
                        const res4 = upsertRecord(cols.tier4.list, r => String(r.kode || '').toLowerCase() === data.kode_tier4.toLowerCase() && String(r.namaIndikator || r.indikator || '').toLowerCase() === data.nama_indikator_tier4.toLowerCase(),
                            {
                                tier: 4, sasaranId: res3.id, kodeTier3: k3, sasaranKinerja: `${k3} - ${s3}`,
                                kode: data.kode_tier4, namaIndikator: data.nama_indikator_tier4, indikator: data.nama_indikator_tier4,
                                satuan: data.satuan || '%', targetsByYear, paguByYear,
                                target2025: targetsByYear['2025'], pagu2025: paguByYear['2025'],
                                target2026: targetsByYear['2026'], pagu2026: paguByYear['2026'],
                                target2027: targetsByYear['2027'], pagu2027: paguByYear['2027'],
                                target2028: targetsByYear['2028'], pagu2028: paguByYear['2028'],
                                target2029: targetsByYear['2029'], pagu2029: paguByYear['2029'],
                                target: targetsByYear['2025'], pagu: paguByYear['2025']
                            });
                        detailActions.push(`Tier 4 (${data.kode_tier4}: ${res4.status})`);
                    }
                }
            } else if (schemaKey === 'cascading_terpadu') {
                const yr = data.tahun || '2025';
                const lvl = parseInt(data.level_cascading, 10);
                if (!/^\d{4}$/.test(yr)) errors.push(`"tahun" harus 4 digit ("${yr}")`);
                if (![1, 2, 3].includes(lvl)) errors.push(`"level_cascading" harus 1, 2, atau 3 ("${data.level_cascading}")`);
                if (!data.kode_indikator_induk) errors.push('"kode_indikator_induk" wajib diisi');
                if (!data.username_pegawai) errors.push('"username_pegawai" wajib diisi');
                const matchedUser = findUser(data.username_pegawai);
                if (data.username_pegawai && cols.users.list.length > 0 && !matchedUser) {
                    errors.push(`Pegawai "${data.username_pegawai}" tidak ditemukan di master Pegawai Ki-Jaro`);
                }
                if (!data.indikator_kinerja) errors.push('"indikator_kinerja" wajib diisi');
                const tTahunan = cleanNumber(data.target_tahunan), tw1 = cleanNumber(data.tw1), tw2 = cleanNumber(data.tw2), tw3 = cleanNumber(data.tw3), tw4 = cleanNumber(data.tw4);
                if ([tTahunan, tw1, tw2, tw3, tw4].some(v => Number.isNaN(v))) errors.push('Target tahunan dan TW1–TW4 harus angka valid');

                summaryLabel = `Level ${lvl || '?'} | ${data.username_pegawai || '-'} — ${data.indikator_kinerja || '(Kosong)'}`;
                if (errors.length === 0) {
                    const res = upsertRecord(cols.cascading.list,
                        r => Number(r.level) === lvl && String(r.tahun) === yr && String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : data.username_pegawai).toLowerCase() && String(r.indikator || '').toLowerCase() === data.indikator_kinerja.toLowerCase(),
                        {
                            level: lvl, tahun: yr, kodeIndikatorInduk: data.kode_indikator_induk,
                            unit: data.nama_unit_atau_tim || (matchedUser?.unit || ''),
                            jabatanPeran: data.jabatan_peran || (lvl === 1 ? 'Ketua Tim Kerja' : (lvl === 2 ? 'Ketua Unit/Prodi/Subbag' : 'Dosen/Tendik')),
                            pegawaiUsername: matchedUser ? matchedUser.username : data.username_pegawai,
                            namaPegawai: matchedUser ? (matchedUser.name || matchedUser.nama) : data.username_pegawai,
                            rencanaAksi: data.rencana_aksi_atau_rhk || '', indikator: data.indikator_kinerja,
                            satuan: data.satuan || '%', target: tTahunan, targetTw1: tw1, targetTw2: tw2, targetTw3: tw3, targetTw4: tw4
                        });
                    detailActions.push(`Cascading Level ${lvl}: ${res.status}`);
                }
            } else if (schemaKey === 'rhk_iki') {
                const yr = data.tahun || '2025';
                if (!/^\d{4}$/.test(yr)) errors.push(`"tahun" harus 4 digit ("${yr}")`);
                if (!data.username_pegawai) errors.push('"username_pegawai" wajib diisi');
                const matchedUser = findUser(data.username_pegawai);
                if (data.username_pegawai && cols.users.list.length > 0 && !matchedUser) {
                    errors.push(`Pegawai "${data.username_pegawai}" tidak ditemukan di master Pegawai Ki-Jaro`);
                }
                if (!data.rencana_hasil_kerja) errors.push('"rencana_hasil_kerja" wajib diisi');
                if (!data.indikator_kinerja_individu) errors.push('"indikator_kinerja_individu" wajib diisi');
                const tTahunan = cleanNumber(data.target_tahunan), rTw1 = cleanNumber(data.realisasi_tw1), rTw2 = cleanNumber(data.realisasi_tw2), rTw3 = cleanNumber(data.realisasi_tw3), rTw4 = cleanNumber(data.realisasi_tw4);
                if ([tTahunan, rTw1, rTw2, rTw3, rTw4].some(v => Number.isNaN(v))) errors.push('Target dan Realisasi TW1–TW4 harus angka valid');

                summaryLabel = `${data.username_pegawai || '-'} — ${data.indikator_kinerja_individu || '(Kosong)'}`;
                if (errors.length === 0) {
                    const res = upsertRecord(cols.rhk.list,
                        r => String(r.tahun) === yr && String(r.pegawaiUsername || '').toLowerCase() === (matchedUser ? matchedUser.username : data.username_pegawai).toLowerCase() && String(r.indikator || '').toLowerCase() === data.indikator_kinerja_individu.toLowerCase(),
                        {
                            tahun: yr, pegawaiUsername: matchedUser ? matchedUser.username : data.username_pegawai,
                            namaPegawai: matchedUser ? (matchedUser.name || matchedUser.nama) : data.username_pegawai,
                            unit: matchedUser ? (matchedUser.unit || '') : '', kodeIkAtasan: data.kode_ik_atasan || '',
                            jenisRhk: data.jenis_rhk || 'Utama', rhk: data.rencana_hasil_kerja, aspek: data.aspek || 'Kuantitas',
                            indikator: data.indikator_kinerja_individu, satuan: data.satuan || 'Dokumen',
                            target: tTahunan, realisasiTw1: rTw1, realisasiTw2: rTw2, realisasiTw3: rTw3, realisasiTw4: rTw4
                        });
                    detailActions.push(`RHK & IKI Staf: ${res.status}`);
                }
            }

            if (errors.length > 0) {
                failCount++;
                logs.push({ rowNumber, status: 'GAGAL', summary: summaryLabel, detail: errors.join('; ') });
            } else {
                successCount++;
                logs.push({ rowNumber, status: 'BERHASIL', summary: summaryLabel, detail: `Berhasil diproses: ${detailActions.join(' | ')}` });
            }
        });

        return { fatalError: null, logs, successCount, failCount };
    }

    window.changeCsvInjectorSchema = function (key) {
        _selectedSchemaKey = key; _importLogs = []; _importSummary = null;
        window.renderCsvInjectorModalBody();
    };

    window.exportSelectedSchemaToCsv = function () {
        const schema = CSV_SCHEMAS[_selectedSchemaKey];
        if (!schema) return;
        const rows = buildExportRowsForSchema(_selectedSchemaKey);
        if (rows.length === 0) {
            if (typeof showToast === 'function') showToast('Belum ada data di database untuk kelompok ini. Unduh Template Kosong terlebih dahulu.', 'info');
            return;
        }
        const filename = `${schema.exportPrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
        downloadCsvRows(filename, schema.headers, rows);
        if (typeof showToast === 'function') showToast(`Berhasil mengekspor ${rows.length} baris data ke ${filename}.`, 'success');
    };

    window.downloadSelectedCsvTemplate = function () {
        const schema = CSV_SCHEMAS[_selectedSchemaKey];
        if (!schema) return;
        downloadCsvRows(schema.filename, schema.headers, schema.sample);
        if (typeof showToast === 'function') showToast(`Template ${schema.filename} berhasil diunduh.`, 'success');
    };

    window.downloadImportExecutionLog = function () {
        if (!_importLogs || _importLogs.length === 0) return;
        downloadCsvRows(
            `log_import_${_selectedSchemaKey}_${Date.now()}.csv`,
            ['Baris_CSV', 'Status', 'Ringkasan_Data', 'Keterangan_atau_Letak_Kesalahan'],
            _importLogs.map(l => [l.rowNumber, l.status, l.summary, l.detail])
        );
    };

    window.processUploadedCsvFile = function (inputEl) {
        const file = inputEl?.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (ev) {
            const parsed = parseCsvText(ev.target.result);
            if (parsed.rows.length === 0) {
                _importSummary = { fatalError: 'File CSV kosong atau tidak memiliki baris data di bawah baris header.', total: 0, success: 0, fail: 0 };
                _importLogs = [];
                window.renderCsvInjectorModalBody();
                return;
            }
            const result = validateAndInjectRows(_selectedSchemaKey, parsed);
            _importLogs = result.logs;
            _importSummary = { fatalError: result.fatalError, fileName: file.name, total: parsed.rows.length, success: result.successCount, fail: result.failCount };

            if (!result.fatalError && result.successCount > 0) {
                await persistAllDbChanges();
                if (typeof renderCurrentView === 'function') renderCurrentView();
            }
            window.renderCsvInjectorModalBody();

            if (typeof showToast === 'function') {
                if (result.fatalError) showToast('Import CSV Gagal: Struktur kolom tidak sesuai template.', 'error');
                else if (result.failCount === 0) showToast(`Sukses 100%! ${result.successCount} baris data berhasil di-inject.`, 'success');
                else if (result.successCount > 0) showToast(`Selesai sebagian: ${result.successCount} berhasil, ${result.failCount} gagal. Cek tabel log!`, 'info');
                else showToast(`Semua data (${result.failCount} baris) gagal divalidasi. Cek tabel log!`, 'error');
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
        const existingCount = buildExportRowsForSchema(_selectedSchemaKey).length;

        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden" style="font-family: Arial, Helvetica, sans-serif;">
                <div class="bg-gradient-to-r from-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <span class="px-2.5 py-0.5 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-wider">Bulk CSV Import & Export</span>
                        <h3 class="text-base font-bold mt-1 flex items-center gap-2">
                            <i class="fa-solid fa-file-csv text-emerald-300"></i> Import & Export Data Kinerja / Cascading via CSV
                        </h3>
                    </div>
                    <button type="button" onclick="closeCsvInjectorModal()" class="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white font-bold">&times;</button>
                </div>

                <div class="p-6 overflow-y-auto space-y-5 text-xs">
                    <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                        <label class="block font-bold text-slate-800 text-sm">1. Pilih Paket Data CSV (untuk Export Data Eksisting maupun Import Data Baru)</label>
                        <div class="flex flex-col lg:flex-row gap-2.5">
                            <select onchange="changeCsvInjectorSchema(this.value)" class="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-900">
                                ${Object.entries(CSV_SCHEMAS).map(([k, v]) => `<option value="${k}" ${_selectedSchemaKey === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}
                            </select>
                            <button type="button" onclick="exportSelectedSchemaToCsv()" class="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow shrink-0 flex items-center justify-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-file-export"></i>Export Data (.CSV) <span class="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">${existingCount} Baris</span>
                            </button>
                            <button type="button" onclick="downloadSelectedCsvTemplate()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow shrink-0 flex items-center justify-center gap-1.5 cursor-pointer">
                                <i class="fa-solid fa-download"></i>Template Kosong
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
                        <p class="font-bold text-slate-900 text-sm">2. Unggah File CSV untuk Di-inject & Divalidasi</p>
                        <p class="text-[11px] text-slate-600">Mendukung pemisah koma (<code>,</code>) maupun titik koma (<code>;</code>) dari Excel / Google Sheets.</p>
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
                                <p class="font-bold text-sm flex items-center gap-2"><i class="fa-solid fa-circle-xmark text-rose-600"></i> Import Dibatalkan</p>
                                <p>${esc(_importSummary.fatalError)}</p>
                            </div>
                        ` : `
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div class="p-3 bg-slate-100 border rounded-xl"><p class="text-[11px] text-slate-600">File Diproses</p><p class="font-bold text-slate-900 truncate">${esc(_importSummary.fileName)}</p></div>
                                <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl"><p class="text-[11px] text-blue-800">Total Baris Data</p><p class="font-extrabold text-base text-blue-950">${_importSummary.total} Baris</p></div>
                                <div class="p-3 bg-emerald-50 border border-emerald-300 rounded-xl"><p class="text-[11px] text-emerald-800">Berhasil Masuk Database</p><p class="font-extrabold text-base text-emerald-700">${_importSummary.success} Baris</p></div>
                                <div class="p-3 bg-rose-50 border border-rose-300 rounded-xl"><p class="text-[11px] text-rose-800">Gagal / Perlu Perbaikan</p><p class="font-extrabold text-base text-rose-700">${_importSummary.fail} Baris</p></div>
                            </div>
                            <div class="border border-slate-300 rounded-xl overflow-hidden">
                                <div class="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between">
                                    <span class="font-bold">Log Status & Audit Validasi per Baris CSV</span>
                                    <button type="button" onclick="downloadImportExecutionLog()" class="px-3 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-[11px] font-bold"><i class="fa-solid fa-file-export mr-1"></i>Unduh Log Hasil (.CSV)</button>
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
                                                    <td class="p-2.5 text-center">${log.status === 'BERHASIL' ? '<span class="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-bold text-[10px]">BERHASIL</span>' : '<span class="px-2.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full font-bold text-[10px]">GAGAL</span>'}</td>
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
        const sidebarNav = document.querySelector('aside nav, #sidebarNav, aside ul');
        if (sidebarNav && !document.getElementById(MENU_BTN_ID)) {
            const btn = document.createElement('button');
            btn.id = MENU_BTN_ID;
            btn.type = 'button';
            btn.onclick = window.openCsvInjectorModal;
            btn.className = 'w-full flex items-center gap-3 px-3.5 py-2.5 mt-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition cursor-pointer';
            btn.innerHTML = `<i class="fa-solid fa-file-csv w-4 text-center"></i><span>Import / Export CSV</span>`;
            sidebarNav.appendChild(btn);
        }
    }

    function initIntegratedModules() {
        try {
            const saved = localStorage.getItem('kijaro_lakip_approval_backup');
            if (saved) {
                const root = getRootDbObject();
                root.lakipApproval = { ...(root.lakipApproval || {}), ...JSON.parse(saved) };
            }
        } catch (_) {}

        if (document.body) {
            searchFocusObserver.observe(document.body, { childList: true, subtree: true });
        }
        injectCsvMenuButton();
        syncLakipApprovalUi();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initIntegratedModules);
    } else {
        initIntegratedModules();
    }
    setInterval(function () {
        injectCsvMenuButton();
        syncLakipApprovalUi();
    }, 1000);
})();
