// =========================================================================
// MODUL DIALOG KINERJA, PERJANJIAN KINERJA & PAKTA INTEGRITAS (BERJENJANG)
// =========================================================================
(function () {
    const MENU_ID = 'menu-perjanjian-kinerja';
    const LOGO_KEMENPERIN_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Logo_Kementerian_Perindustrian_Republik_Indonesia.png/240px-Logo_Kementerian_Perindustrian_Republik_Indonesia.png';
    const JABATAN_OPTIONS = [
        'Dosen',
        'Tenaga Kependidikan',
        'Direktur',
        'Kasubbag Administrasi Akademik Kemahasiswaan dan Kerjasama',
        'Kasubbag Umum dan Keuangan'
    ];

    let _pkSigModePengusul = 'qr';
    let _pkSigHasStrokePengusul = false;
    let _pkSigModeDir = 'qr';
    let _pkSigHasStrokeDir = false;
    let _pkEditingId = null;
    let _pkMonitorFilterYear = '2025';
    let _pkMonitorFilterTim = 'ALL';
    let _pkMonitorFilterStatus = 'ALL';

    function esc(str) {
        if (typeof sanitizeHTML === 'function') return sanitizeHTML(String(str ?? ''));
        return String(str ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getRoles(u) {
        if (!u) return [];
        if (typeof getUserRoles === 'function') return getUserRoles(u);
        return Array.isArray(u.roles) ? u.roles : [u.role];
    }

    function getDirectorInfo() {
        const users = Array.isArray(DB.users) ? DB.users : [];
        const dir = users.find(u => getRoles(u).includes('direktur'));
        return {
            name: dir ? dir.name : 'Dr. Supardi S.Pd., M.Pd',
            nip: dir && dir.nip ? dir.nip : '197504122001121002',
            pangkat: dir && dir.pangkat ? dir.pangkat : 'Pembina Tk. I, IV/b',
            jabatan: 'Direktur',
            unit: 'Politeknik Industri Petrokimia Banten'
        };
    }

    function formatSkPengangkatanFull(rawInput) {
        const clean = String(rawInput || '').trim();
        if (!clean) return 'Keputusan Menteri Perindustrian Nomor ... Tahun ...';
        if (/^keputusan\s+menteri\s+perindustrian/i.test(clean)) return clean;
        const withoutNomorPrefix = clean.replace(/^nomor\s+/i, '');
        return `Keputusan Menteri Perindustrian Nomor ${withoutNomorPrefix}`;
    }

    function setSidebarMenuActive(isActive) {
        const btn = document.getElementById(MENU_ID);
        if (!btn) return;
        if (isActive) {
            btn.classList.add('bg-white', 'text-blue-700', 'font-bold', 'shadow');
            btn.classList.remove('text-blue-100', 'text-white', 'hover:bg-blue-700/50', 'hover:bg-white/10');
        } else {
            btn.classList.remove('bg-white', 'text-blue-700', 'text-indigo-700', 'font-bold', 'shadow');
            btn.classList.add('text-blue-100', 'hover:bg-white/10');
        }
    }

    function injectSidebarMenu() {
        if (document.getElementById(MENU_ID)) return;
        const buttons = Array.from(document.querySelectorAll('aside button, nav button, aside a, nav a'));
        const petaBtn = buttons.find(el => (el.textContent || '').trim().toLowerCase().includes('peta risiko'));
        if (!petaBtn) return;

        const clone = petaBtn.cloneNode(true);
        clone.id = MENU_ID;
        clone.removeAttribute('onclick');
        setSidebarMenuActive(false);

        const icon = clone.querySelector('i');
        if (icon) {
            icon.className = 'fa-solid fa-file-contract w-5 text-center';
        }
        let replacedText = false;
        clone.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                node.textContent = ' Dialog & Perjanjian Kinerja';
                replacedText = true;
            }
        });
        if (!replacedText) {
            const span = clone.querySelector('span');
            if (span) span.textContent = 'Dialog & Perjanjian Kinerja';
        }

        clone.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            openPerjanjianKinerjaView();
        });

        petaBtn.parentNode.insertBefore(clone, petaBtn);
    }

    document.addEventListener('click', function (e) {
        const clickedSidebarBtn = e.target.closest('aside button, nav button, aside a, nav a');
        if (clickedSidebarBtn && clickedSidebarBtn.id !== MENU_ID) {
            setSidebarMenuActive(false);
        }
    }, true);

    // Pemindaian menyeluruh data RHK & IKI dari seluruh struktur Cascading di DB (Level 1, Level 2, Level 3)
    function collectUserRhkIki(user, tahun) {
        const yr = String(tahun || '2025').trim();
        const roles = getRoles(user);
        const isKetuaTim = roles.includes('tim_kerja');
        const isKetuaUnit = roles.includes('ketua_unit');
        const userTimNorm = String(user.timKey || user.tim || '').trim().toLowerCase();
        const userUnitNorm = String(user.unit || '').trim().toLowerCase();
        const userNameNorm = String(user.name || '').trim().toLowerCase();
        const userEmailNorm = String(user.username || '').trim().toLowerCase();

        const rows = [];
        const seenKeys = new Set();

        const pushUniqueRow = (row) => {
            const rName = String(row.rhk || '').trim();
            const iName = String(row.iki || '').trim();
            if (!rName && !iName) return;
            const key = `${rName.toLowerCase()}|${iName.toLowerCase()}`;
            if (seenKeys.has(key)) return;
            seenKeys.add(key);
            rows.push({
                kategori: row.kategori === 'TAMBAHAN' ? 'TAMBAHAN' : 'UTAMA',
                rhkPimpinan: row.rhkPimpinan || '-',
                rhk: rName || iName,
                aspek: row.aspek || 'Kuantitas',
                iki: iName || rName,
                target: row.target || '100 (%)'
            });
        };

        const dbObj = typeof DB === 'object' && DB ? DB : {};
        const arrayKeys = Object.keys(dbObj).filter(k =>
            Array.isArray(dbObj[k]) && k.toLowerCase().includes('cascad')
        );

        arrayKeys.forEach(arrKey => {
            const list = dbObj[arrKey];
            list.forEach(item => {
                if (!item || typeof item !== 'object') return;
                const itemYr = String(item.tahun || item.year || '').trim();
                if (itemYr && itemYr !== yr) return;

                const itemTim = String(item.timKey || item.tim || item.timKerja || item.pelaksanaTim || '').trim().toLowerCase();
                const itemUnit = String(item.unit || item.unitKerja || item.prodi || item.subbag || item.unitTujuan || '').trim().toLowerCase();
                const itemUser = String(item.username || item.email || item.pegawaiUsername || '').trim().toLowerCase();
                const itemPegawai = String(item.pegawaiName || item.namaPegawai || item.pelaksana || item.nama || '').trim().toLowerCase();

                let matched = false;
                if (isKetuaTim && userTimNorm && itemTim && (itemTim === userTimNorm || itemTim.includes(userTimNorm) || userTimNorm.includes(itemTim))) {
                    if (!itemPegawai && !itemUser) matched = true;
                }
                if (isKetuaUnit && userUnitNorm && itemUnit && (itemUnit === userUnitNorm || itemUnit.includes(userUnitNorm) || userUnitNorm.includes(itemUnit))) {
                    if (!itemPegawai && !itemUser) matched = true;
                }
                if ((itemUser && itemUser === userEmailNorm) || (itemPegawai && itemPegawai === userNameNorm)) {
                    matched = true;
                }

                if (!matched && isKetuaUnit && Array.isArray(item.units)) {
                    const foundU = item.units.find(uObj => {
                        const uStr = typeof uObj === 'string' ? uObj : (uObj.unit || uObj.nama || '');
                        return String(uStr).trim().toLowerCase() === userUnitNorm;
                    });
                    if (foundU) matched = true;
                }
                if (!matched && Array.isArray(item.pelaksanaList)) {
                    const foundP = item.pelaksanaList.find(pObj => {
                        const pStr = typeof pObj === 'string' ? pObj : (pObj.username || pObj.name || pObj.nama || '');
                        const pNorm = String(pStr).trim().toLowerCase();
                        return pNorm === userEmailNorm || pNorm === userNameNorm;
                    });
                    if (foundP) matched = true;
                }

                if (matched) {
                    const targetStr = item.targetText
                        || (item.targetVal !== undefined && item.targetVal !== '' ? `${item.targetVal} (${item.satuan || '%'})` : '')
                        || item.targetFormatted
                        || '100 (%)';

                    pushUniqueRow({
                        kategori: String(item.kategori || item.jenis || 'UTAMA').toUpperCase(),
                        rhkPimpinan: item.induk || item.targetDirektur || item.sasaranDirektur || item.indikatorRujukan || item.targetTim || item.targetUnit || item.rhkPimpinan || '-',
                        rhk: item.rhk || item.rencanaHasilKerja || item.target || item.sasaran || item.indikator || '-',
                        aspek: item.aspek || 'Kuantitas',
                        iki: item.iki || item.indikatorIndividu || item.indikator || item.target || '-',
                        target: targetStr
                    });
                }
            });
        });

        return rows;
    }

    function determineWorkflowChain(user) {
        const roles = getRoles(user);
        if (roles.includes('direktur')) {
            return {
                tierLabel: 'Direktur',
                steps: ['direktur'],
                initialStatus: 'Disetujui Direktur',
                currentStage: 'selesai'
            };
        }
        if (roles.includes('tim_kerja')) {
            return {
                tierLabel: 'Ketua Tim Kerja',
                steps: ['direktur'],
                initialStatus: 'Menunggu Approval Direktur',
                currentStage: 'direktur'
            };
        }
        if (roles.includes('ketua_unit')) {
            return {
                tierLabel: 'Ketua Prodi / Subbag / Unit',
                steps: ['tim_kerja', 'direktur'],
                initialStatus: 'Menunggu Verifikasi Ketua Tim Kerja',
                currentStage: 'tim_kerja'
            };
        }
        return {
            tierLabel: 'Dosen / Tendik / Kalab / Anggota Unit',
            steps: ['ketua_unit', 'tim_kerja', 'direktur'],
            initialStatus: 'Menunggu Verifikasi Ketua Unit/Prodi/Subbag',
            currentStage: 'ketua_unit'
        };
    }

    function initCanvas(canvasId, flagSetter) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || canvas.dataset.bound === '1') return;
        canvas.dataset.bound = '1';
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        let drawing = false;

        const pos = (ev) => {
            const rect = canvas.getBoundingClientRect();
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
            return {
                x: (cx - rect.left) * (canvas.width / rect.width),
                y: (cy - rect.top) * (canvas.height / rect.height)
            };
        };

        const start = (ev) => {
            drawing = true;
            flagSetter(true);
            const p = pos(ev);
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
        };
        const move = (ev) => {
            if (!drawing) return;
            if (ev.cancelable) ev.preventDefault();
            const p = pos(ev);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
        };
        const end = () => { drawing = false; };

        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);
    }

    window.clearPkCanvas = function (canvasId, who) {
        const c = document.getElementById(canvasId);
        if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
        if (who === 'pengusul') _pkSigHasStrokePengusul = false;
        if (who === 'dir') _pkSigHasStrokeDir = false;
    };

    window.setPkSigMode = function (who, mode) {
        if (who === 'pengusul') {
            _pkSigModePengusul = mode;
            const box = document.getElementById('pkPengusulCanvasBox');
            if (box) box.classList.toggle('hidden', mode !== 'manual');
        } else {
            _pkSigModeDir = mode;
            const box = document.getElementById('pkDirCanvasBox');
            if (box) box.classList.toggle('hidden', mode !== 'manual');
        }
    };

    window.addPkRhkRow = function (data = {}) {
        const tbody = document.getElementById('pkRhkRowsBody');
        if (!tbody) return;
        const tr = document.createElement('tr');
        tr.className = 'border-b hover:bg-slate-50';
        tr.innerHTML = `
            <td class="p-1.5">
                <select class="pk-in-kat w-full p-1.5 border rounded bg-white text-[11px] font-bold">
                    <option value="UTAMA" ${data.kategori !== 'TAMBAHAN' ? 'selected' : ''}>Utama</option>
                    <option value="TAMBAHAN" ${data.kategori === 'TAMBAHAN' ? 'selected' : ''}>Tambahan</option>
                </select>
            </td>
            <td class="p-1.5"><input type="text" class="pk-in-pimpinan w-full p-1.5 border rounded text-[11px]" value="${esc(data.rhkPimpinan || '')}" placeholder="RHK Pimpinan yang diintervensi..."></td>
            <td class="p-1.5"><input type="text" class="pk-in-rhk w-full p-1.5 border rounded text-[11px] font-semibold" value="${esc(data.rhk || '')}" placeholder="Rencana Hasil Kerja..." required></td>
            <td class="p-1.5">
                <select class="pk-in-aspek w-full p-1.5 border rounded bg-white text-[11px]">
                    <option value="Kuantitas" ${(data.aspek || 'Kuantitas') === 'Kuantitas' ? 'selected' : ''}>Kuantitas</option>
                    <option value="Kualitas" ${data.aspek === 'Kualitas' ? 'selected' : ''}>Kualitas</option>
                    <option value="Waktu" ${data.aspek === 'Waktu' ? 'selected' : ''}>Waktu</option>
                </select>
            </td>
            <td class="p-1.5"><input type="text" class="pk-in-iki w-full p-1.5 border rounded text-[11px]" value="${esc(data.iki || '')}" placeholder="Indikator Kinerja Individu..." required></td>
            <td class="p-1.5"><input type="text" class="pk-in-target w-full p-1.5 border rounded text-[11px] font-semibold" value="${esc(data.target || '')}" placeholder="Contoh: 1 (Dokumen)" required></td>
            <td class="p-1.5 text-center">
                <button type="button" onclick="this.closest('tr').remove()" class="px-2 py-1 bg-rose-100 text-rose-700 rounded text-[10px] font-bold"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    };

    window.loadCascadingToPkForm = function (silent = false) {
        const yr = document.getElementById('pkFormTahun')?.value || '2025';
        const periodeInput = document.getElementById('pkFormPeriode');
        const tanggalInput = document.getElementById('pkFormTanggal');
        if (periodeInput) periodeInput.value = `Januari s.d. Desember ${yr}`;
        if (tanggalInput) tanggalInput.value = `Serang, 02 Januari ${yr}`;

        const tbody = document.getElementById('pkRhkRowsBody');
        if (!tbody) return;
        const rows = collectUserRhkIki(currentUser, yr);
        tbody.innerHTML = '';
        if (rows.length === 0) {
            addPkRhkRow({});
            if (!silent && typeof showToast === 'function') {
                showToast(`Data cascading Tahun ${yr} belum ditemukan untuk akun Anda. Silakan lengkapi RHK & IKI pada tabel di bawah.`, 'info');
            }
        } else {
            rows.forEach(r => addPkRhkRow(r));
            if (!silent && typeof showToast === 'function') {
                showToast(`${rows.length} indikator RHK & IKI dari Cascading Tahun ${yr} berhasil disinkronkan.`, 'success');
            }
        }
    };

    window.submitPerjanjianKinerjaForm = async function (e) {
        if (e) e.preventDefault();
        if (!Array.isArray(DB.perjanjianKinerja)) DB.perjanjianKinerja = [];

        const tahun = document.getElementById('pkFormTahun').value;
        const periode = document.getElementById('pkFormPeriode').value.trim();
        const tanggalStr = document.getElementById('pkFormTanggal').value.trim();
        const skNomorRaw = document.getElementById('pkFormSkNomor').value.trim();
        const pangkat = document.getElementById('pkFormPangkat').value.trim();
        const jabatan = document.getElementById('pkFormJabatan').value.trim();
        const unitKerja = 'Politeknik Industri Petrokimia Banten';
        const nip = document.getElementById('pkFormNip').value.trim();

        const trList = Array.from(document.querySelectorAll('#pkRhkRowsBody tr'));
        const rhkItems = trList.map(tr => ({
            kategori: tr.querySelector('.pk-in-kat')?.value || 'UTAMA',
            rhkPimpinan: tr.querySelector('.pk-in-pimpinan')?.value.trim() || '-',
            rhk: tr.querySelector('.pk-in-rhk')?.value.trim() || '',
            aspek: tr.querySelector('.pk-in-aspek')?.value || 'Kuantitas',
            iki: tr.querySelector('.pk-in-iki')?.value.trim() || '',
            target: tr.querySelector('.pk-in-target')?.value.trim() || '-'
        })).filter(x => x.rhk && x.iki);

        if (rhkItems.length === 0) {
            showToast('Minimal harus ada 1 baris RHK dan Indikator Kinerja Individu (IKI) yang terisi!', 'error');
            return;
        }

        let sigPengusulData = '';
        const hashPengusul = typeof generateSimpleDocHash === 'function'
            ? generateSimpleDocHash(`PK-PI-USER|${currentUser.username}|${tahun}|${Date.now()}`)
            : 'PK-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        if (_pkSigModePengusul === 'manual') {
            if (!_pkSigHasStrokePengusul) {
                showToast('Silakan goreskan tanda tangan manual Anda terlebih dahulu atau pilih mode QR Code!', 'error');
                return;
            }
            const c = document.getElementById('pkPengusulCanvas');
            sigPengusulData = c ? c.toDataURL('image/png') : '';
        }

        const wf = determineWorkflowChain(currentUser);
        const dirInfo = getDirectorInfo();

        const record = {
            id: _pkEditingId || ('pk_' + Date.now()),
            tahun,
            periode,
            tanggalStr,
            skNomorRaw,
            skPengangkatan: formatSkPengangkatanFull(skNomorRaw),
            pemohonUsername: currentUser.username,
            pemohonName: currentUser.name,
            pemohonNip: nip,
            pemohonPangkat: pangkat,
            pemohonJabatan: jabatan,
            pemohonUnit: unitKerja,
            pemohonUnitInternal: currentUser.unit || '',
            pemohonTimKey: currentUser.timKey || '',
            pemohonRoles: getRoles(currentUser),
            tierLabel: wf.tierLabel,
            pejabatPenilaiName: dirInfo.name,
            pejabatPenilaiNip: dirInfo.nip,
            pejabatPenilaiPangkat: dirInfo.pangkat,
            pejabatPenilaiJabatan: dirInfo.jabatan,
            rhkItems,
            sigPengusulMode: _pkSigModePengusul,
            sigPengusulManual: sigPengusulData,
            sigPengusulHash: hashPengusul,
            sigDirMode: '',
            sigDirManual: '',
            sigDirHash: '',
            steps: wf.steps,
            currentStage: wf.currentStage,
            status: wf.initialStatus,
            catatanRevisi: '',
            history: [
                {
                    waktu: new Date().toLocaleString('id-ID'),
                    aktor: currentUser.name,
                    aksi: _pkEditingId ? 'Mengajukan Ulang (Revisi)' : 'Mengajukan PK & Pakta Integritas',
                    status: wf.initialStatus
                }
            ],
            updatedAt: new Date().toISOString()
        };

        if (_pkEditingId) {
            const idx = DB.perjanjianKinerja.findIndex(x => x.id === _pkEditingId);
            if (idx >= 0) DB.perjanjianKinerja[idx] = record;
            else DB.perjanjianKinerja.push(record);
            _pkEditingId = null;
        } else {
            DB.perjanjianKinerja.push(record);
        }

        if (typeof recordAuditLog === 'function') {
            recordAuditLog('Pengajuan PK & Pakta Integritas', 'Dialog & Perjanjian Kinerja', `${currentUser.name} mengajukan PK & Pakta Integritas Tahun ${tahun}.`);
        }
        if (typeof saveToMySQL === 'function') await saveToMySQL();

        if (typeof sendKijaroEmail === 'function' && typeof getEmailsByCriteria === 'function') {
            let targetEmails = [];
            if (wf.currentStage === 'ketua_unit') targetEmails = getEmailsByCriteria({ role: 'ketua_unit', unit: currentUser.unit });
            else if (wf.currentStage === 'tim_kerja') targetEmails = getEmailsByCriteria({ role: 'tim_kerja', timKey: currentUser.timKey });
            else if (wf.currentStage === 'direktur') targetEmails = getEmailsByCriteria({ role: 'direktur' });

            if (targetEmails.length > 0) {
                sendKijaroEmail(
                    targetEmails,
                    `Approval Perjanjian Kinerja & Pakta Integritas (${tahun}) — ${currentUser.name}`,
                    `<p>Yth. Bapak/Ibu Pimpinan,</p>
                     <p>Terdapat pengajuan <strong>Dialog Kinerja, Perjanjian Kinerja & Pakta Integritas</strong> yang memerlukan tindakan Anda:</p>
                     <ul>
                       <li><strong>Nama Pegawai:</strong> ${esc(currentUser.name)} (NIP. ${esc(nip)})</li>
                       <li><strong>Jabatan:</strong> ${esc(jabatan)} — Politeknik Industri Petrokimia Banten</li>
                       <li><strong>Status Tahapan:</strong> ${esc(wf.initialStatus)}</li>
                     </ul>`
                );
            }
        }

        showToast('Perjanjian Kinerja & Pakta Integritas berhasil diajukan!', 'success');
        openPerjanjianKinerjaView();
    };

    window.editPerjanjianKinerja = function (id) {
        const item = (DB.perjanjianKinerja || []).find(x => x.id === id);
        if (!item) return;
        _pkEditingId = item.id;
        openPerjanjianKinerjaView(item);
        showToast('Mode Edit aktif. Silakan perbaiki data lalu klik Ajukan Ulang.', 'info');
    };

    window.deletePerjanjianKinerja = async function (id) {
        if (!confirm('Hapus pengajuan Perjanjian Kinerja & Pakta Integritas ini?')) return;
        DB.perjanjianKinerja = (DB.perjanjianKinerja || []).filter(x => x.id !== id);
        if (typeof saveToMySQL === 'function') await saveToMySQL();
        showToast('Pengajuan berhasil dihapus.', 'info');
        openPerjanjianKinerjaView();
    };

    window.applyPkMonitorFilters = function () {
        const yEl = document.getElementById('pkMonitorYearFilter');
        const tEl = document.getElementById('pkMonitorTimFilter');
        const sEl = document.getElementById('pkMonitorStatusFilter');
        if (yEl) _pkMonitorFilterYear = yEl.value;
        if (tEl) _pkMonitorFilterTim = tEl.value;
        if (sEl) _pkMonitorFilterStatus = sEl.value;
        renderPkMonitoringTableBody();
    };

    function renderPkMonitoringTableBody() {
        const tbody = document.getElementById('pkMonitorTableBody');
        const subtitleEl = document.getElementById('pkMonitorSubtitle');
        if (!tbody || !currentUser) return;

        const roles = getRoles(currentUser);
        const isAdmin = roles.includes('admin');
        const isDir = roles.includes('direktur');
        const isTim = roles.includes('tim_kerja');
        const isUnit = roles.includes('ketua_unit');

        const allUsers = (Array.isArray(DB.users) ? DB.users : []).filter(u => !getRoles(u).includes('admin'));
        let monitoredUsers = [];
        if (isAdmin || isDir) {
            monitoredUsers = allUsers;
        } else if (isTim) {
            monitoredUsers = allUsers.filter(u => String(u.timKey || '').toLowerCase() === String(currentUser.timKey || '').toLowerCase());
        } else if (isUnit) {
            monitoredUsers = allUsers.filter(u => String(u.unit || '').trim().toLowerCase() === String(currentUser.unit || '').trim().toLowerCase());
        } else {
            monitoredUsers = [currentUser];
        }

        const filteredRows = monitoredUsers.map(u => {
            const found = (DB.perjanjianKinerja || []).slice().reverse().find(x =>
                String(x.pemohonUsername).toLowerCase() === String(u.username).toLowerCase() &&
                (_pkMonitorFilterYear === 'ALL' || String(x.tahun) === String(_pkMonitorFilterYear))
            );
            return { user: u, submission: found };
        }).filter(row => {
            if (_pkMonitorFilterTim !== 'ALL') {
                if (String(row.user.timKey || '').toLowerCase() !== _pkMonitorFilterTim.toLowerCase()) return false;
            }
            if (_pkMonitorFilterStatus === 'SUDAH' && !row.submission) return false;
            if (_pkMonitorFilterStatus === 'BELUM' && row.submission) return false;
            return true;
        });

        const sudahCount = filteredRows.filter(r => !!r.submission).length;
        const belumCount = filteredRows.length - sudahCount;

        if (subtitleEl) {
            const yrLabel = _pkMonitorFilterYear === 'ALL' ? 'Semua Tahun' : `Tahun ${_pkMonitorFilterYear}`;
            subtitleEl.innerHTML = `Menampilkan <strong>${filteredRows.length}</strong> pegawai (${yrLabel}) &bull; <span class="text-emerald-700 font-bold">Sudah: ${sudahCount}</span> &bull; <span class="text-rose-700 font-bold">Belum: ${belumCount}</span>`;
        }

        if (filteredRows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 italic">Tidak ada data pegawai yang sesuai filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = filteredRows.map(({ user: u, submission: found }) => `
            <tr class="hover:bg-slate-50">
                <td class="p-2.5 font-semibold text-slate-800">${esc(u.name)}</td>
                <td class="p-2.5">${esc(u.unit || '-')}</td>
                <td class="p-2.5">${esc(u.timKey || '-')}</td>
                <td class="p-2.5 text-center">
                    ${found
                        ? `<span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px]">Sudah (${esc(found.tahun)})</span>`
                        : '<span class="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-bold text-[10px]">Belum Mengajukan</span>'}
                </td>
                <td class="p-2.5 text-center text-[11px] font-semibold text-slate-700">${found ? esc(found.status) : '-'}</td>
                <td class="p-2.5 text-center">
                    ${found ? `<button type="button" onclick="previewMergedPkDocument('${found.id}')" class="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded font-bold text-[10px]"><i class="fa-solid fa-eye mr-1"></i>Lihat</button>` : '-'}
                </td>
            </tr>
        `).join('');
    }

    window.openPkApprovalModal = function (id) {
        const item = (DB.perjanjianKinerja || []).find(x => x.id === id);
        if (!item) return;
        const isDirStage = item.currentStage === 'direktur';
        _pkSigModeDir = 'qr';
        _pkSigHasStrokeDir = false;

        const existing = document.getElementById('pkApprovalModalOverlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'pkApprovalModalOverlay';
        modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl border max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div class="flex items-center justify-between border-b pb-3">
                    <div>
                        <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">${esc(item.status)}</span>
                        <h3 class="font-bold text-slate-900 text-base mt-1">Verifikasi & Persetujuan Perjanjian Kinerja</h3>
                    </div>
                    <button type="button" onclick="document.getElementById('pkApprovalModalOverlay').remove()" class="text-slate-400 hover:text-slate-700 text-lg"><i class="fa-solid fa-xmark"></i></button>
                </div>

                <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border text-xs">
                    <div><span class="text-slate-500 block">Nama Pegawai</span><strong>${esc(item.pemohonName)}</strong></div>
                    <div><span class="text-slate-500 block">NIP / Pangkat</span><strong>${esc(item.pemohonNip)} / ${esc(item.pemohonPangkat)}</strong></div>
                    <div><span class="text-slate-500 block">Jabatan</span><strong>${esc(item.pemohonJabatan)}</strong></div>
                    <div><span class="text-slate-500 block">Unit Kerja</span><strong>Politeknik Industri Petrokimia Banten</strong></div>
                </div>

                <div class="border rounded-xl overflow-hidden">
                    <table class="w-full text-left text-[11px] border-collapse">
                        <thead class="bg-slate-100 font-bold text-slate-700 border-b">
                            <tr>
                                <th class="p-2">RHK Pimpinan Diintervensi</th>
                                <th class="p-2">Rencana Hasil Kerja (RHK)</th>
                                <th class="p-2">IKI & Target</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${(item.rhkItems || []).map(r => `
                                <tr>
                                    <td class="p-2 text-slate-600">${esc(r.rhkPimpinan)}</td>
                                    <td class="p-2 font-semibold text-slate-800">${esc(r.rhk)}</td>
                                    <td class="p-2">${esc(r.iki)} — <strong>${esc(r.target)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${isDirStage ? `
                <div class="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-3 text-xs">
                    <p class="font-bold text-emerald-900"><i class="fa-solid fa-signature mr-1"></i> Tanda Tangan Persetujuan Akhir Direktur</p>
                    <div class="flex gap-4">
                        <label class="flex items-center gap-1.5 font-semibold cursor-pointer">
                            <input type="radio" name="pkDirSigChoice" value="qr" checked onchange="setPkSigMode('dir','qr')"> QR Code Digital Hash
                        </label>
                        <label class="flex items-center gap-1.5 font-semibold cursor-pointer">
                            <input type="radio" name="pkDirSigChoice" value="manual" onchange="setPkSigMode('dir','manual')"> Tanda Tangan Manual (Tulis)
                        </label>
                    </div>
                    <div id="pkDirCanvasBox" class="hidden space-y-1.5">
                        <div class="flex justify-between items-center">
                            <span class="text-[11px] text-slate-600">Goreskan tanda tangan Direktur:</span>
                            <button type="button" onclick="clearPkCanvas('pkDirCanvas','dir')" class="px-2 py-0.5 bg-white border border-rose-200 text-rose-600 rounded text-[10px] font-bold">Hapus Goresan</button>
                        </div>
                        <canvas id="pkDirCanvas" width="480" height="110" class="w-full h-24 bg-white border-2 border-dashed border-emerald-400 rounded-lg touch-none cursor-crosshair"></canvas>
                    </div>
                </div>
                ` : ''}

                <div class="text-xs">
                    <label class="block font-bold text-slate-700 mb-1">Catatan Verifikasi / Alasan Penolakan (Wajib jika ditolak)</label>
                    <textarea id="pkApprovalNote" rows="2" class="w-full p-2.5 border rounded-xl" placeholder="Tulis catatan verifikasi atau arahan perbaikan jika dikembalikan..."></textarea>
                </div>

                <div class="flex justify-end gap-2 pt-2 border-t">
                    <button type="button" onclick="processPkApproval('${item.id}', 'reject')" class="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-bold text-xs">
                        <i class="fa-solid fa-rotate-left mr-1"></i>Tolak / Kembalikan untuk Revisi
                    </button>
                    <button type="button" onclick="processPkApproval('${item.id}', 'approve')" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow">
                        <i class="fa-solid fa-check-circle mr-1"></i>${isDirStage ? 'Setujui Final & Terbitkan Dokumen' : 'Verifikasi & Teruskan ke Tahap Berikutnya'}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        if (isDirStage) {
            initCanvas('pkDirCanvas', (val) => { _pkSigHasStrokeDir = val; });
        }
    };

    window.processPkApproval = async function (id, decision) {
        const item = (DB.perjanjianKinerja || []).find(x => x.id === id);
        if (!item) return;
        const note = document.getElementById('pkApprovalNote')?.value.trim() || '';

        if (decision === 'reject') {
            if (!note) {
                showToast('Tuliskan alasan penolakan/revisi terlebih dahulu!', 'error');
                return;
            }
            item.status = `Ditolak (${currentUser.name})`;
            item.currentStage = 'ditolak';
            item.catatanRevisi = note;
            item.history.push({
                waktu: new Date().toLocaleString('id-ID'),
                aktor: currentUser.name,
                aksi: 'Ditolak / Dikembalikan: ' + note,
                status: item.status
            });

            if (typeof sendKijaroEmail === 'function') {
                sendKijaroEmail(
                    [item.pemohonUsername],
                    `Perjanjian Kinerja & Pakta Integritas Dikembalikan (${item.tahun})`,
                    `<p>Yth. <strong>${esc(item.pemohonName)}</strong>,</p>
                     <p>Pengajuan Perjanjian Kinerja & Pakta Integritas Anda dikembalikan oleh <strong>${esc(currentUser.name)}</strong> dengan catatan:</p>
                     <blockquote style="border-left: 3px solid #e11d48; padding-left: 12px; color: #9f1239;">${esc(note)}</blockquote>
                     <p>Silakan buka menu <strong>Dialog & Perjanjian Kinerja</strong> untuk mengedit atau mengajukan ulang.</p>`
                );
            }
        } else {
            if (item.currentStage === 'ketua_unit') {
                item.currentStage = 'tim_kerja';
                item.status = 'Menunggu Verifikasi Ketua Tim Kerja';
                item.history.push({
                    waktu: new Date().toLocaleString('id-ID'),
                    aktor: currentUser.name,
                    aksi: 'Diverifikasi Ketua Unit/Prodi/Subbag',
                    status: item.status
                });
                if (typeof sendKijaroEmail === 'function' && typeof getEmailsByCriteria === 'function') {
                    const timEmails = getEmailsByCriteria({ role: 'tim_kerja', timKey: item.pemohonTimKey });
                    sendKijaroEmail(timEmails, `Verifikasi Perjanjian Kinerja (${item.tahun}) — ${item.pemohonName}`,
                        `<p>Pengajuan Perjanjian Kinerja atas nama <strong>${esc(item.pemohonName)}</strong> telah diverifikasi Ketua Unit dan menunggu verifikasi Ketua Tim Kerja.</p>`);
                }
            } else if (item.currentStage === 'tim_kerja') {
                item.currentStage = 'direktur';
                item.status = 'Menunggu Approval Direktur';
                item.history.push({
                    waktu: new Date().toLocaleString('id-ID'),
                    aktor: currentUser.name,
                    aksi: 'Diverifikasi Ketua Tim Kerja',
                    status: item.status
                });
                if (typeof sendKijaroEmail === 'function' && typeof getEmailsByCriteria === 'function') {
                    const dirEmails = getEmailsByCriteria({ role: 'direktur' });
                    sendKijaroEmail(dirEmails, `Persetujuan Final Perjanjian Kinerja (${item.tahun}) — ${item.pemohonName}`,
                        `<p>Pengajuan Perjanjian Kinerja atas nama <strong>${esc(item.pemohonName)}</strong> telah diverifikasi Ketua Tim Kerja dan menunggu persetujuan akhir Direktur.</p>`);
                }
            } else if (item.currentStage === 'direktur') {
                let sigDirManual = '';
                const hashDir = typeof generateSimpleDocHash === 'function'
                    ? generateSimpleDocHash(`PK-PI-DIR|${currentUser.username}|${item.id}|${Date.now()}`)
                    : 'DIR-' + Math.random().toString(36).substring(2, 10).toUpperCase();

                if (_pkSigModeDir === 'manual') {
                    if (!_pkSigHasStrokeDir) {
                        showToast('Silakan goreskan tanda tangan manual Direktur atau pilih QR Code!', 'error');
                        return;
                    }
                    const c = document.getElementById('pkDirCanvas');
                    sigDirManual = c ? c.toDataURL('image/png') : '';
                }

                item.sigDirMode = _pkSigModeDir;
                item.sigDirManual = sigDirManual;
                item.sigDirHash = hashDir;
                item.currentStage = 'selesai';
                item.status = 'Disetujui Direktur';
                item.history.push({
                    waktu: new Date().toLocaleString('id-ID'),
                    aktor: currentUser.name,
                    aksi: 'Disetujui Final oleh Direktur',
                    status: item.status
                });

                if (typeof sendKijaroEmail === 'function') {
                    sendKijaroEmail(
                        [item.pemohonUsername],
                        `Disetujui: Perjanjian Kinerja & Pakta Integritas (${item.tahun})`,
                        `<p>Yth. <strong>${esc(item.pemohonName)}</strong>,</p>
                         <p>Selamat, pengajuan <strong>Perjanjian Kinerja & Pakta Integritas Tahun ${esc(item.tahun)}</strong> Anda telah <strong>Disetujui Final oleh Direktur</strong> dan siap dicetak melalui menu <strong>Dialog & Perjanjian Kinerja</strong>.</p>`
                    );
                }
            }
        }

        if (typeof saveToMySQL === 'function') await saveToMySQL();
        document.getElementById('pkApprovalModalOverlay')?.remove();
        showToast(decision === 'reject' ? 'Pengajuan dikembalikan ke pemohon.' : 'Proses persetujuan berhasil disimpan!', 'success');
        openPerjanjianKinerjaView();
    };

    // Pratinjau & Cetak Dokumen Gabungan (Halaman 1: Pakta Integritas, Halaman 2+: Sasaran Kinerja Pegawai / PK)
    window.previewMergedPkDocument = function (id) {
        const item = (DB.perjanjianKinerja || []).find(x => x.id === id);
        if (!item) return;
        const area = document.getElementById('pkMergedPreviewArea');
        if (!area) return;

        const utamaRows = (item.rhkItems || []).filter(r => r.kategori !== 'TAMBAHAN');
        const tambahanRows = (item.rhkItems || []).filter(r => r.kategori === 'TAMBAHAN');
        const skTextFormatted = formatSkPengangkatanFull(item.skNomorRaw || item.skPengangkatan);

        const perilakuBerakhlak = [
            { no: '1.', judul: 'Berorientasi Layanan', poin: ['Memahami dan memenuhi kebutuhan masyarakat', 'Ramah, cekatan, solutif, dan dapat diandalkan', 'Melakukan perbaikan tiada henti'] },
            { no: '2.', judul: 'Akuntabel', poin: ['Melaksanakan tugas dengan jujur, bertanggung jawab, cermat, disiplin, dan berintegritas tinggi', 'Menggunakan kekayaan dan barang milik negara secara bertanggung jawab, efektif, dan efisien', 'Tidak menyalahgunakan kewenangan jabatan'] },
            { no: '3.', judul: 'Kompeten', poin: ['Meningkatkan kompetensi diri untuk menjawab tantangan yang selalu berubah', 'Membantu orang lain belajar', 'Melaksanakan tugas dengan kualitas terbaik'] },
            { no: '4.', judul: 'Harmonis', poin: ['Menghargai setiap orang apapun latar belakangnya', 'Suka menolong orang lain', 'Membangun lingkungan kerja yang kondusif'] },
            { no: '5.', judul: 'Loyal', poin: ['Memegang teguh ideologi Pancasila, Undang-Undang Dasar Negara Republik Indonesia Tahun 1945, setia pada NKRI, serta pemerintahan yang sah', 'Menjaga nama baik sesama ASN, Pimpinan, Instansi, dan Negara', 'Menjaga rahasia jabatan dan negara'] },
            { no: '6.', judul: 'Adaptif', poin: ['Cepat menyesuaikan diri menghadapi perubahan', 'Terus berinovasi dan mengembangkan kreativitas', 'Bertindak proaktif'] },
            { no: '7.', judul: 'Kolaboratif', poin: ['Memberi kesempatan kepada berbagai pihak untuk berkontribusi', 'Terbuka dalam bekerja sama untuk menghasilkan nilai tambah', 'Menggerakkan pemanfaatan berbagai sumberdaya untuk tujuan bersama'] }
        ];

        const renderSigPegawai = (qrElemId) => {
            if (item.sigPengusulMode === 'manual' && item.sigPengusulManual) {
                return `<img src="${item.sigPengusulManual}" class="h-16 mx-auto my-1 object-contain" alt="TTD Pegawai">`;
            }
            return `<div id="${qrElemId}" class="my-1 flex justify-center"></div><div class="text-[8px] font-mono text-slate-500">${esc(item.sigPengusulHash)}</div>`;
        };

        const renderSigDirektur = (qrElemId) => {
            if (item.currentStage !== 'selesai') {
                return `<div class="h-16 flex items-center justify-center text-[10px] italic text-slate-400">(Menunggu Persetujuan Direktur)</div>`;
            }
            if (item.sigDirMode === 'manual' && item.sigDirManual) {
                return `<img src="${item.sigDirManual}" class="h-16 mx-auto my-1 object-contain" alt="TTD Direktur">`;
            }
            return `<div id="${qrElemId}" class="my-1 flex justify-center"></div><div class="text-[8px] font-mono text-slate-500">${esc(item.sigDirHash)}</div>`;
        };

        area.classList.remove('hidden');
        area.innerHTML = `
            <div class="bg-white rounded-2xl shadow-sm border-2 border-emerald-200 p-6 space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b pb-3 no-print">
                    <span class="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                        <i class="fa-solid fa-file-pdf mr-1"></i> Dokumen Gabungan (Halaman 1: Pakta Integritas &bull; Halaman 2: Sasaran Kinerja Pegawai)
                    </span>
                    <button type="button" onclick="printMergedPkOnly()" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2">
                        <i class="fa-solid fa-print"></i><span>Cetak / Download PDF Gabungan</span>
                    </button>
                </div>

                <div id="pkMergedPrintableSheet" class="space-y-8 text-slate-900 font-serif text-xs leading-relaxed">
                    <!-- HALAMAN 1: PAKTA INTEGRITAS -->
                    <div class="p-6 sm:p-8 border border-slate-200 rounded-xl bg-white space-y-5" style="page-break-after: always;">
                        <div class="flex items-center justify-center gap-4 border-b-2 border-slate-900 pb-3">
                            <img src="${LOGO_KEMENPERIN_URL}" onerror="this.style.display='none'" class="w-14 h-14 object-contain" alt="Logo Kemenperin">
                            <div class="text-center">
                                <p class="text-sm font-bold uppercase tracking-wider">Kementerian Perindustrian</p>
                                <p class="text-xs font-bold uppercase tracking-widest">REPUBLIK INDONESIA</p>
                                <p class="text-[11px] font-bold uppercase mt-0.5">Politeknik Industri Petrokimia Banten</p>
                            </div>
                        </div>

                        <h2 class="text-center text-base font-bold uppercase underline tracking-wide pt-1">PAKTA INTEGRITAS</h2>

                        <p>Saya yang bertanda tangan di bawah ini:</p>
                        <table class="w-full text-xs">
                            <tbody>
                                <tr><td class="py-1 w-40">Nama Pegawai</td><td class="py-1 w-4">:</td><td class="py-1 font-bold">${esc(item.pemohonName)}</td></tr>
                                <tr><td class="py-1">NIP</td><td class="py-1">:</td><td class="py-1">${esc(item.pemohonNip)}</td></tr>
                                <tr><td class="py-1">Pangkat/Gol.</td><td class="py-1">:</td><td class="py-1">${esc(item.pemohonPangkat)}</td></tr>
                                <tr><td class="py-1">Jabatan</td><td class="py-1">:</td><td class="py-1">${esc(item.pemohonJabatan)}</td></tr>
                                <tr><td class="py-1">Unit Kerja</td><td class="py-1">:</td><td class="py-1 font-semibold">Politeknik Industri Petrokimia Banten</td></tr>
                            </tbody>
                        </table>

                        <p>yang diangkat berdasarkan <strong>${esc(skTextFormatted)}</strong> menyatakan bahwa saya:</p>
                        <ol class="list-decimal pl-6 space-y-1.5">
                            <li>Bersedia menjalankan tugas dengan sebaik-baiknya sesuai dengan peraturan perundang-undangan;</li>
                            <li>Bersedia mematuhi perintah kedinasan yang ditugaskan oleh pimpinan;</li>
                            <li>Bersedia mewujudkan target kinerja yang telah ditetapkan;</li>
                            <li>Bersedia berperan aktif dalam upaya pencegahan, pemberantasan, dan tidak melibatkan diri dalam perbuatan Korupsi, Kolusi dan Nepotisme (KKN);</li>
                            <li>Bersedia bersikap transparan, jujur, objektif, dan akuntabel dalam melaksanakan tugas; dan</li>
                            <li>Bersedia menghindari pertentangan kepentingan (<em>conflict of interest</em>) dalam pelaksanaan tugas.</li>
                        </ol>

                        <p>Apabila saya melanggar pakta integritas ini, saya bersedia menerima konsekuensinya berupa pembebasan dari jabatan.</p>

                        <div class="pt-6 grid grid-cols-2 gap-8 text-center">
                            <div class="flex flex-col items-center">
                                <p>Menyaksikan :</p>
                                <p class="font-bold">Pimpinan Unit Kerja</p>
                                <p class="font-bold mb-1">Direktur</p>
                                ${renderSigDirektur('qrPkPiDir')}
                                <p class="font-bold underline">(${esc(item.pejabatPenilaiName)})</p>
                                <p>NIP. ${esc(item.pejabatPenilaiNip)}</p>
                            </div>
                            <div class="flex flex-col items-center">
                                <p>${esc(item.tanggalStr)}</p>
                                <p class="font-bold mb-1">Pembuat Pernyataan</p>
                                ${renderSigPegawai('qrPkPiUser')}
                                <p class="font-bold underline">(${esc(item.pemohonName)})</p>
                                <p>NIP. ${esc(item.pemohonNip)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- HALAMAN 2 DST: SASARAN KINERJA PEGAWAI / PERJANJIAN KINERJA -->
                    <div class="p-6 sm:p-8 border border-slate-200 rounded-xl bg-white space-y-4">
                        <div class="flex items-center justify-center gap-3 border-b border-slate-800 pb-2.5">
                            <img src="${LOGO_KEMENPERIN_URL}" onerror="this.style.display='none'" class="w-11 h-11 object-contain" alt="Logo Kemenperin">
                            <div class="text-center space-y-0.5">
                                <h2 class="text-base font-bold uppercase">SASARAN KINERJA PEGAWAI</h2>
                                <p class="text-xs font-bold uppercase">PENDEKATAN HASIL KERJA KUANTITATIF</p>
                            </div>
                        </div>

                        <div class="flex justify-between text-[11px] font-bold border-b pb-1">
                            <span>Kementerian Perindustrian</span>
                            <span>Periode Penilaian: ${esc(item.periode)}</span>
                        </div>

                        <table class="w-full border-collapse border border-slate-800 text-[11px]">
                            <thead>
                                <tr class="bg-slate-100 font-bold">
                                    <th class="border border-slate-800 p-1.5 w-8 text-center">NO.</th>
                                    <th class="border border-slate-800 p-1.5" colspan="2">PEGAWAI YANG DINILAI</th>
                                    <th class="border border-slate-800 p-1.5 w-8 text-center">NO.</th>
                                    <th class="border border-slate-800 p-1.5" colspan="2">PEJABAT PENILAI KINERJA</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td class="border border-slate-800 p-1.5 text-center">1</td>
                                    <td class="border border-slate-800 p-1.5 w-32">Nama</td>
                                    <td class="border border-slate-800 p-1.5 font-bold">${esc(item.pemohonName)}</td>
                                    <td class="border border-slate-800 p-1.5 text-center">1</td>
                                    <td class="border border-slate-800 p-1.5 w-32">Nama</td>
                                    <td class="border border-slate-800 p-1.5 font-bold">${esc(item.pejabatPenilaiName)}</td>
                                </tr>
                                <tr>
                                    <td class="border border-slate-800 p-1.5 text-center">2</td>
                                    <td class="border border-slate-800 p-1.5">NIP</td>
                                    <td class="border border-slate-800 p-1.5">${esc(item.pemohonNip)}</td>
                                    <td class="border border-slate-800 p-1.5 text-center">2</td>
                                    <td class="border border-slate-800 p-1.5">NIP</td>
                                    <td class="border border-slate-800 p-1.5">${esc(item.pejabatPenilaiNip)}</td>
                                </tr>
                                <tr>
                                    <td class="border border-slate-800 p-1.5 text-center">3</td>
                                    <td class="border border-slate-800 p-1.5">Pangkat/Golongan</td>
                                    <td class="border border-slate-800 p-1.5">${esc(item.pemohonPangkat)}</td>
                                    <td class="border border-slate-800 p-1.5 text-center">3</td>
                                    <td class="border border-slate-800 p-1.5">Pangkat/Golongan</td>
                                    <td class="border border-slate-800 p-1.5">${esc(item.pejabatPenilaiPangkat)}</td>
                                </tr>
                                <tr>
                                    <td class="border border-slate-800 p-1.5 text-center">4</td>
                                    <td class="border border-slate-800 p-1.5">Jabatan</td>
                                    <td class="border border-slate-800 p-1.5">${esc(item.pemohonJabatan)}</td>
                                    <td class="border border-slate-800 p-1.5 text-center">4</td>
                                    <td class="border border-slate-800 p-1.5">Jabatan</td>
                                    <td class="border border-slate-800 p-1.5">${esc(item.pejabatPenilaiJabatan)}</td>
                                </tr>
                                <tr>
                                    <td class="border border-slate-800 p-1.5 text-center">5</td>
                                    <td class="border border-slate-800 p-1.5">Unit Kerja</td>
                                    <td class="border border-slate-800 p-1.5">Politeknik Industri Petrokimia Banten</td>
                                    <td class="border border-slate-800 p-1.5 text-center">5</td>
                                    <td class="border border-slate-800 p-1.5">Unit Kerja</td>
                                    <td class="border border-slate-800 p-1.5">Politeknik Industri Petrokimia Banten</td>
                                </tr>
                            </tbody>
                        </table>

                        <table class="w-full border-collapse border border-slate-800 text-[11px]">
                            <thead>
                                <tr class="bg-slate-100 font-bold text-center">
                                    <th class="border border-slate-800 p-1.5" colspan="6">HASIL KERJA</th>
                                </tr>
                                <tr class="bg-slate-50 font-bold text-center">
                                    <th class="border border-slate-800 p-1.5 w-8">NO.<br>(1)</th>
                                    <th class="border border-slate-800 p-1.5">RENCANA HASIL KERJA PIMPINAN YANG DIINTERVENSI<br>(2)</th>
                                    <th class="border border-slate-800 p-1.5">RENCANA HASIL KERJA<br>(3)</th>
                                    <th class="border border-slate-800 p-1.5 w-20">ASPEK<br>(4)</th>
                                    <th class="border border-slate-800 p-1.5">INDIKATOR KINERJA INDIVIDU<br>(5)</th>
                                    <th class="border border-slate-800 p-1.5 w-28">TARGET<br>(6)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="bg-slate-50 font-bold"><td class="border border-slate-800 p-1.5" colspan="6">A. UTAMA</td></tr>
                                ${utamaRows.map((r, i) => `
                                    <tr>
                                        <td class="border border-slate-800 p-1.5 text-center align-top">${i + 1}.</td>
                                        <td class="border border-slate-800 p-1.5 align-top">${esc(r.rhkPimpinan)}</td>
                                        <td class="border border-slate-800 p-1.5 align-top font-semibold">${esc(r.rhk)}</td>
                                        <td class="border border-slate-800 p-1.5 text-center align-top">${esc(r.aspek)}</td>
                                        <td class="border border-slate-800 p-1.5 align-top">${esc(r.iki)}</td>
                                        <td class="border border-slate-800 p-1.5 text-center align-top font-semibold">${esc(r.target)}</td>
                                    </tr>
                                `).join('')}
                                <tr class="bg-slate-50 font-bold"><td class="border border-slate-800 p-1.5" colspan="6">B. TAMBAHAN</td></tr>
                                ${tambahanRows.length === 0 ? `<tr><td class="border border-slate-800 p-1.5 text-center text-slate-500" colspan="6">-</td></tr>` : tambahanRows.map((r, i) => `
                                    <tr>
                                        <td class="border border-slate-800 p-1.5 text-center align-top">${i + 1}.</td>
                                        <td class="border border-slate-800 p-1.5 align-top">${esc(r.rhkPimpinan)}</td>
                                        <td class="border border-slate-800 p-1.5 align-top font-semibold">${esc(r.rhk)}</td>
                                        <td class="border border-slate-800 p-1.5 text-center align-top">${esc(r.aspek)}</td>
                                        <td class="border border-slate-800 p-1.5 align-top">${esc(r.iki)}</td>
                                        <td class="border border-slate-800 p-1.5 text-center align-top font-semibold">${esc(r.target)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <table class="w-full border-collapse border border-slate-800 text-[11px]">
                            <thead>
                                <tr class="bg-slate-100 font-bold text-center">
                                    <th class="border border-slate-800 p-1.5" colspan="3">PERILAKU KERJA</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${perilakuBerakhlak.map(b => `
                                    <tr>
                                        <td class="border border-slate-800 p-1.5 w-8 text-center align-top font-bold">${b.no}</td>
                                        <td class="border border-slate-800 p-1.5 align-top">
                                            <strong class="block">${b.judul}</strong>
                                            <ul class="list-disc pl-4 mt-0.5">
                                                ${b.poin.map(p => `<li>${p}</li>`).join('')}
                                            </ul>
                                        </td>
                                        <td class="border border-slate-800 p-1.5 w-64 align-top">
                                            <strong>Ekspektasi Khusus Pimpinan:</strong><br>
                                            Sesuai arahan dan ekspektasi pimpinan unit kerja.
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>

                        <div class="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
                            <div class="flex flex-col items-center">
                                <p>&nbsp;</p>
                                <p class="font-bold mb-1">Pegawai yang Dinilai,</p>
                                ${renderSigPegawai('qrPkSkpUser')}
                                <p class="font-bold underline">${esc(item.pemohonName)}</p>
                                <p>NIP. ${esc(item.pemohonNip)}</p>
                            </div>
                            <div class="flex flex-col items-center">
                                <p>${esc(item.tanggalStr)}</p>
                                <p class="font-bold mb-1">Pejabat Penilai Kinerja,</p>
                                ${renderSigDirektur('qrPkSkpDir')}
                                <p class="font-bold underline">${esc(item.pejabatPenilaiName)}</p>
                                <p>NIP. ${esc(item.pejabatPenilaiNip)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            if (typeof QRCode !== 'undefined') {
                if (item.sigPengusulMode === 'qr') {
                    ['qrPkPiUser', 'qrPkSkpUser'].forEach(elId => {
                        const el = document.getElementById(elId);
                        if (el) new QRCode(el, { text: `PEGAWAI: ${item.pemohonName} | NIP: ${item.pemohonNip} | Hash: ${item.sigPengusulHash}`, width: 68, height: 68, correctLevel: QRCode.CorrectLevel.L });
                    });
                }
                if (item.currentStage === 'selesai' && item.sigDirMode === 'qr') {
                    ['qrPkPiDir', 'qrPkSkpDir'].forEach(elId => {
                        const el = document.getElementById(elId);
                        if (el) new QRCode(el, { text: `DIREKTUR: ${item.pejabatPenilaiName} | NIP: ${item.pejabatPenilaiNip} | Hash: ${item.sigDirHash}`, width: 68, height: 68, correctLevel: QRCode.CorrectLevel.L });
                    });
                }
            }
        }, 80);

        area.scrollIntoView({ behavior: 'smooth' });
    };

    window.printMergedPkOnly = function () {
        const sheet = document.getElementById('pkMergedPrintableSheet');
        if (!sheet) return;
        const win = window.open('', '_blank', 'width=950,height=750');
        win.document.write(`
            <html>
            <head>
                <title>Cetak Perjanjian Kinerja & Pakta Integritas</title>
                <script src="https://cdn.tailwindcss.com"><\/script>
                <style>
                    @page { size: A4 portrait; margin: 12mm; }
                    body { font-family: 'Times New Roman', serif; color: #000; }
                </style>
            </head>
            <body class="p-2">${sheet.innerHTML}</body>
            </html>
        `);
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 600);
    };

    window.openPerjanjianKinerjaView = function (editData = null) {
        if (!Array.isArray(DB.perjanjianKinerja)) DB.perjanjianKinerja = [];
        const mainContainer = document.getElementById('mainContent') || document.querySelector('main > div:last-child') || document.querySelector('main');
        if (!mainContainer || !currentUser) return;

        document.querySelectorAll('aside button, nav button, aside a, nav a').forEach(b => {
            if (b.id !== MENU_ID) {
                b.classList.remove('bg-white', 'text-blue-700', 'font-bold', 'shadow');
            }
        });
        setSidebarMenuActive(true);

        const pageTitleEl = document.querySelector('header h1, header h2');
        if (pageTitleEl) pageTitleEl.textContent = 'Dialog Kinerja, Perjanjian Kinerja & Pakta Integritas';

        const roles = getRoles(currentUser);
        const isAdmin = roles.includes('admin');
        const isDir = roles.includes('direktur');
        const isTim = roles.includes('tim_kerja');
        const isUnit = roles.includes('ketua_unit');

        const selectedYear = editData ? editData.tahun : '2025';
        _pkMonitorFilterYear = selectedYear;
        const initialRhkRows = editData ? editData.rhkItems : collectUserRhkIki(currentUser, selectedYear);

        const currentJabatanVal = editData
            ? editData.pemohonJabatan
            : (JABATAN_OPTIONS.includes(currentUser.jabatan) ? currentUser.jabatan : (isDir ? 'Direktur' : 'Dosen'));

        const currentSkVal = editData
            ? (editData.skNomorRaw || String(editData.skPengangkatan || '').replace(/^Keputusan Menteri Perindustrian Nomor\s*/i, ''))
            : '';

        const inboxApprovals = DB.perjanjianKinerja.filter(item => {
            if (isAdmin) return item.currentStage !== 'selesai' && item.currentStage !== 'ditolak';
            if (isDir && item.currentStage === 'direktur') return true;
            if (isTim && item.currentStage === 'tim_kerja' && String(item.pemohonTimKey || '').toLowerCase() === String(currentUser.timKey || '').toLowerCase()) return true;
            if (isUnit && item.currentStage === 'ketua_unit' && String(item.pemohonUnitInternal || item.pemohonUnit || '').trim().toLowerCase() === String(currentUser.unit || '').trim().toLowerCase()) return true;
            return false;
        });

        let monitorTitle = 'Monitoring Status Pengajuan Perjanjian Kinerja';
        if (isAdmin || isDir) {
            monitorTitle = 'Monitoring Seluruh Pegawai Institusi (Direktur & Admin)';
        } else if (isTim) {
            monitorTitle = `Monitoring Seluruh Unit & Anggota Tim Kerja (${currentUser.timKey || '-'})`;
        } else if (isUnit) {
            monitorTitle = `Monitoring Anggota Unit / Prodi / Subbag (${currentUser.unit || '-'})`;
        } else {
            monitorTitle = 'Status Pengajuan Perjanjian Kinerja & Pakta Integritas Saya';
        }

        const uniqueTimList = Array.from(new Set(
            (Array.isArray(DB.users) ? DB.users : [])
                .map(u => String(u.timKey || '').trim())
                .filter(Boolean)
        ));

        const mySubmissions = DB.perjanjianKinerja.filter(x => String(x.pemohonUsername).toLowerCase() === String(currentUser.username).toLowerCase());

        _pkSigModePengusul = 'qr';
        _pkSigHasStrokePengusul = false;

        mainContainer.innerHTML = `
            <div class="space-y-6 animate-fadeIn">
                <!-- BAGIAN 1: ANTREAN APPROVAL BERJENJANG -->
                ${inboxApprovals.length > 0 ? `
                <div class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 space-y-3">
                    <div class="flex items-center justify-between">
                        <h3 class="font-bold text-amber-950 text-sm flex items-center gap-2">
                            <i class="fa-solid fa-bell text-amber-600"></i> Menunggu Verifikasi / Persetujuan Anda (${inboxApprovals.length})
                        </h3>
                    </div>
                    <div class="overflow-x-auto bg-white rounded-xl border border-amber-200">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead class="bg-amber-100/70 text-amber-950 font-bold border-b">
                                <tr>
                                    <th class="p-2.5">Pegawai Pengusul</th>
                                    <th class="p-2.5">Jabatan / Tim Kerja</th>
                                    <th class="p-2.5">Tahun & RHK</th>
                                    <th class="p-2.5">Status Tahapan</th>
                                    <th class="p-2.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${inboxApprovals.map(it => `
                                    <tr class="hover:bg-amber-50/40">
                                        <td class="p-2.5"><strong>${esc(it.pemohonName)}</strong><br><span class="text-[10px] text-slate-500">NIP. ${esc(it.pemohonNip)}</span></td>
                                        <td class="p-2.5">${esc(it.pemohonJabatan)}<br><span class="text-[10px] text-indigo-700 font-semibold">${esc(it.pemohonTimKey || '-')}</span></td>
                                        <td class="p-2.5">Tahun ${esc(it.tahun)} (${(it.rhkItems || []).length} RHK)</td>
                                        <td class="p-2.5"><span class="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">${esc(it.status)}</span></td>
                                        <td class="p-2.5 text-center space-x-1">
                                            <button type="button" onclick="previewMergedPkDocument('${it.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px]"><i class="fa-solid fa-eye mr-1"></i>Pratinjau</button>
                                            <button type="button" onclick="openPkApprovalModal('${it.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] shadow"><i class="fa-solid fa-check-double mr-1"></i>Proses Approval</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                ` : ''}

                <!-- BAGIAN 2: FORM PENGAJUAN DIALOG KINERJA, PERJANJIAN KINERJA & PAKTA INTEGRITAS -->
                <div class="bg-white rounded-2xl shadow-sm border-2 border-indigo-200 p-6 space-y-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3.5">
                        <div>
                            <span class="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-extrabold uppercase">1x Pengajuan Gabungan (PK + Pakta Integritas)</span>
                            <h3 class="font-bold text-slate-900 text-base mt-1 flex items-center gap-2">
                                <i class="fa-solid fa-file-signature text-indigo-600"></i> ${editData ? 'Edit & Ajukan Ulang Perjanjian Kinerja' : 'Pengajuan Dialog Kinerja, Perjanjian Kinerja & Pakta Integritas'}
                            </h3>
                            <p class="text-xs text-slate-500">Alur Persetujuan Anda: <strong class="text-indigo-700">${esc(determineWorkflowChain(currentUser).initialStatus)}</strong></p>
                        </div>
                        <button type="button" onclick="loadCascadingToPkForm(false)" class="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs flex items-center gap-1.5">
                            <i class="fa-solid fa-arrows-rotate"></i><span>Sinkronkan RHK & IKI dari Cascading</span>
                        </button>
                    </div>

                    <form onsubmit="submitPerjanjianKinerjaForm(event)" class="space-y-4 text-xs">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border">
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">Tahun Kinerja</label>
                                <select id="pkFormTahun" onchange="loadCascadingToPkForm(false)" class="w-full p-2 bg-white border rounded-lg font-bold">
                                    ${['2025', '2026', '2027', '2028', '2029'].map(y => `<option value="${y}" ${selectedYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">Periode Penilaian</label>
                                <input type="text" id="pkFormPeriode" value="${esc(editData ? editData.periode : 'Januari s.d. Desember ' + selectedYear)}" required class="w-full p-2 bg-white border rounded-lg">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">Tempat & Tanggal Dokumen</label>
                                <input type="text" id="pkFormTanggal" value="${esc(editData ? editData.tanggalStr : 'Serang, 02 Januari ' + selectedYear)}" required class="w-full p-2 bg-white border rounded-lg">
                            </div>

                            <div>
                                <label class="block font-bold text-slate-700 mb-1">NIP Pegawai</label>
                                <input type="text" id="pkFormNip" value="${esc(editData ? editData.pemohonNip : (currentUser.nip || '-'))}" required class="w-full p-2 bg-white border rounded-lg font-mono">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">Pangkat / Golongan</label>
                                <input type="text" id="pkFormPangkat" value="${esc(editData ? editData.pemohonPangkat : (currentUser.pangkat || 'Penata / III/c'))}" required class="w-full p-2 bg-white border rounded-lg">
                            </div>
                            <div>
                                <label class="block font-bold text-slate-700 mb-1">Jabatan</label>
                                <select id="pkFormJabatan" required class="w-full p-2 bg-white border rounded-lg font-semibold">
                                    ${JABATAN_OPTIONS.map(j => `<option value="${esc(j)}" ${currentJabatanVal === j ? 'selected' : ''}>${esc(j)}</option>`).join('')}
                                </select>
                            </div>

                            <div class="md:col-span-3">
                                <label class="block font-bold text-slate-700 mb-1">Nomor SK Pengangkatan CPNS/PPPK (beserta tahunnya)</label>
                                <div class="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <span class="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] shrink-0">Keputusan Menteri Perindustrian Nomor</span>
                                    <input type="text" id="pkFormSkNomor" value="${esc(currentSkVal)}" placeholder="Contoh: 2293 Tahun 2019" required class="w-full p-2 bg-white border rounded-lg font-semibold">
                                </div>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="font-bold text-slate-800">Daftar Rencana Hasil Kerja (RHK) & Indikator Kinerja Individu (IKI) — Otomatis dari Cascading</label>
                                <button type="button" onclick="addPkRhkRow({})" class="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg font-bold text-[11px]">
                                    <i class="fa-solid fa-plus mr-1"></i>Tambah Baris Tambahan
                                </button>
                            </div>
                            <div class="overflow-x-auto border rounded-xl">
                                <table class="w-full text-left border-collapse">
                                    <thead class="bg-slate-100 text-slate-700 font-bold text-[11px] border-b">
                                        <tr>
                                            <th class="p-2 w-24">Kategori</th>
                                            <th class="p-2">RHK Pimpinan Diintervensi</th>
                                            <th class="p-2">Rencana Hasil Kerja (RHK)</th>
                                            <th class="p-2 w-24">Aspek</th>
                                            <th class="p-2">Indikator Kinerja Individu (IKI)</th>
                                            <th class="p-2 w-32">Target</th>
                                            <th class="p-2 w-10 text-center">Hapus</th>
                                        </tr>
                                    </thead>
                                    <tbody id="pkRhkRowsBody"></tbody>
                                </table>
                            </div>
                        </div>

                        <div class="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-2.5">
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <span class="font-bold text-indigo-950"><i class="fa-solid fa-pen-nib mr-1"></i> Tanda Tangan Pengusul (Wajib Sebelum Mengajukan)</span>
                                <div class="flex gap-4">
                                    <label class="flex items-center gap-1.5 font-bold cursor-pointer">
                                        <input type="radio" name="pkPengusulSigChoice" value="qr" checked onchange="setPkSigMode('pengusul','qr')"> QR Code Digital Hash
                                    </label>
                                    <label class="flex items-center gap-1.5 font-bold cursor-pointer">
                                        <input type="radio" name="pkPengusulSigChoice" value="manual" onchange="setPkSigMode('pengusul','manual')"> Tanda Tangan Manual (Tulis)
                                    </label>
                                </div>
                            </div>
                            <div id="pkPengusulCanvasBox" class="hidden space-y-1.5">
                                <div class="flex justify-between items-center">
                                    <span class="text-[11px] text-slate-600">Goreskan tanda tangan Anda pada kotak di bawah:</span>
                                    <button type="button" onclick="clearPkCanvas('pkPengusulCanvas','pengusul')" class="px-2 py-0.5 bg-white border border-rose-200 text-rose-600 rounded text-[10px] font-bold">Hapus Goresan</button>
                                </div>
                                <canvas id="pkPengusulCanvas" width="520" height="110" class="w-full h-24 bg-white border-2 border-dashed border-indigo-300 rounded-lg touch-none cursor-crosshair"></canvas>
                            </div>
                        </div>

                        <div class="flex justify-end gap-2">
                            ${editData ? `<button type="button" onclick="_pkEditingId=null; openPerjanjianKinerjaView();" class="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl font-bold">Batal Edit</button>` : ''}
                            <button type="submit" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow flex items-center gap-2">
                                <i class="fa-solid fa-paper-plane"></i><span>${editData ? 'Simpan & Ajukan Ulang PK + Pakta Integritas' : 'Ajukan Perjanjian Kinerja & Pakta Integritas'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                <!-- BAGIAN 3: RIWAYAT PENGAJUAN SAYA -->
                <div class="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
                    <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <i class="fa-solid fa-folder-open text-blue-600"></i> Pengajuan Perjanjian Kinerja & Pakta Integritas Saya (${mySubmissions.length})
                    </h3>
                    <div class="overflow-x-auto border rounded-xl">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead class="bg-slate-50 font-bold text-slate-700 border-b">
                                <tr>
                                    <th class="p-2.5">Tahun & Periode</th>
                                    <th class="p-2.5">Jumlah RHK/IKI</th>
                                    <th class="p-2.5">Status Persetujuan</th>
                                    <th class="p-2.5">Catatan</th>
                                    <th class="p-2.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y">
                                ${mySubmissions.length === 0 ? `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Anda belum mengajukan Perjanjian Kinerja & Pakta Integritas.</td></tr>` : mySubmissions.slice().reverse().map(sub => `
                                    <tr class="hover:bg-slate-50">
                                        <td class="p-2.5 font-bold">Tahun ${esc(sub.tahun)}<br><span class="text-[10px] font-normal text-slate-500">${esc(sub.periode)}</span></td>
                                        <td class="p-2.5">${(sub.rhkItems || []).length} Indikator</td>
                                        <td class="p-2.5">
                                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sub.currentStage === 'selesai' ? 'bg-emerald-100 text-emerald-700' : sub.currentStage === 'ditolak' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'}">
                                                ${esc(sub.status)}
                                            </span>
                                        </td>
                                        <td class="p-2.5 text-[11px] text-rose-700">${esc(sub.catatanRevisi || '-')}</td>
                                        <td class="p-2.5 text-center space-x-1 whitespace-nowrap">
                                            <button type="button" onclick="previewMergedPkDocument('${sub.id}')" class="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-[11px]"><i class="fa-solid fa-print mr-1"></i>Pratinjau / Cetak Gabungan</button>
                                            ${sub.currentStage !== 'selesai' ? `
                                                <button type="button" onclick="editPerjanjianKinerja('${sub.id}')" class="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-bold text-[11px]"><i class="fa-solid fa-pen"></i> Edit</button>
                                                <button type="button" onclick="deletePerjanjianKinerja('${sub.id}')" class="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg font-bold text-[11px]"><i class="fa-solid fa-trash"></i></button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- BAGIAN 4: TABEL MONITORING HIRARKI DENGAN FILTER TAHUN, TIM KERJA & STATUS -->
                <div class="bg-white rounded-2xl shadow-sm border p-6 space-y-3">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                            <h3 class="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <i class="fa-solid fa-users-viewfinder text-emerald-600"></i> ${esc(monitorTitle)}
                            </h3>
                            <p id="pkMonitorSubtitle" class="text-[11px] text-slate-500 mt-0.5"></p>
                        </div>
                        <div class="flex flex-wrap items-center gap-2 text-xs">
                            <select id="pkMonitorYearFilter" onchange="applyPkMonitorFilters()" class="p-2 bg-slate-50 border rounded-xl font-bold text-slate-700">
                                <option value="ALL">Semua Tahun</option>
                                ${['2025', '2026', '2027', '2028', '2029'].map(y => `<option value="${y}" ${_pkMonitorFilterYear === y ? 'selected' : ''}>Tahun ${y}</option>`).join('')}
                            </select>
                            ${(isAdmin || isDir) ? `
                            <select id="pkMonitorTimFilter" onchange="applyPkMonitorFilters()" class="p-2 bg-slate-50 border rounded-xl font-bold text-slate-700">
                                <option value="ALL">Semua Tim Kerja</option>
                                ${uniqueTimList.map(t => `<option value="${esc(t)}" ${_pkMonitorFilterTim === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
                            </select>
                            ` : ''}
                            <select id="pkMonitorStatusFilter" onchange="applyPkMonitorFilters()" class="p-2 bg-slate-50 border rounded-xl font-bold text-slate-700">
                                <option value="ALL">Semua Status</option>
                                <option value="SUDAH">Sudah Mengajukan</option>
                                <option value="BELUM">Belum Mengajukan</option>
                            </select>
                        </div>
                    </div>
                    <div class="overflow-x-auto max-h-80 overflow-y-auto border rounded-xl">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead class="bg-slate-50 font-bold text-slate-700 border-b sticky top-0">
                                <tr>
                                    <th class="p-2.5">Nama Pegawai</th>
                                    <th class="p-2.5">Unit / Prodi / Subbag</th>
                                    <th class="p-2.5">Tim Kerja</th>
                                    <th class="p-2.5 text-center">Status Pengajuan</th>
                                    <th class="p-2.5 text-center">Tahapan Saat Ini</th>
                                    <th class="p-2.5 text-center">Dokumen</th>
                                </tr>
                            </thead>
                            <tbody id="pkMonitorTableBody" class="divide-y"></tbody>
                        </table>
                    </div>
                </div>

                <div id="pkMergedPreviewArea" class="hidden"></div>
            </div>
        `;

        const tbody = document.getElementById('pkRhkRowsBody');
        if (tbody) {
            tbody.innerHTML = '';
            if (initialRhkRows && initialRhkRows.length > 0) {
                initialRhkRows.forEach(r => addPkRhkRow(r));
            } else {
                addPkRhkRow({});
            }
        }
        initCanvas('pkPengusulCanvas', (val) => { _pkSigHasStrokePengusul = val; });
        renderPkMonitoringTableBody();
    };

    document.addEventListener('DOMContentLoaded', injectSidebarMenu);
    setInterval(injectSidebarMenu, 1200);
})();
