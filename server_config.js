// Tampilin overlay
const pluginLoader = document.getElementById('plugin-loader');
const pluginText = document.getElementById('plugin-text');
const pluginFill = document.getElementById('plugin-progress-fill');
if (pluginLoader) {
    pluginLoader.style.display = 'flex';
    pluginLoader.style.zIndex = '10001';
}

(async function() {
    try {
        let n = window.selectedConfig || "Config";
        
        // ========== MODXS INSTALLER (POP UP SERVER) ==========
        if (n === 'ModXS Installer') {
            let apiUrl = "https://huggingface.co/api/datasets/strszt/goddata";
            let res = await fetch(apiUrl + "?nocache=" + Date.now(), { cache: 'no-store' });
            let data = await res.json();
            let siblings = data.siblings || [];
            
            let frFiles = [];
            let shFiles = [];
            
            for (let i = 0; i < siblings.length; i++) {
                let fname = siblings[i].rfilename || '';
                if (fname.startsWith('FR-')) frFiles.push(fname);
                else if (fname.endsWith('.sh')) shFiles.push(fname);
            }
            
            if (pluginLoader) pluginLoader.style.display = 'none';
            
            let listContainer = document.getElementById('fr-file-list');
            listContainer.innerHTML = '';
            
            if (frFiles.length === 0 && shFiles.length === 0) {
                listContainer.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">Tidak ada file di server</div>';
            }
            
            if (frFiles.length > 0) {
                let frHeader = document.createElement('div');
                frHeader.style.cssText = 'color:#4ade80;font-size:11px;font-weight:700;margin-bottom:6px;';
                frHeader.textContent = 'FR PATCH';
                listContainer.appendChild(frHeader);
                
                for (let i = 0; i < frFiles.length; i++) {
                    let fileName = frFiles[i];
                    let displayName = fileName.replace('FR-', '').replace(/\.(gz|enc|zip)$/, '');
                    
                    let btn = document.createElement('button');
                    btn.style.cssText = 'width:100%;padding:12px;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.25);color:#fff;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;text-align:left;margin-bottom:6px;';
                    btn.innerHTML = 'FR: ' + displayName;
                    btn.onclick = function() {
                        document.getElementById('fr-modal').classList.remove('show');
                        downloadFromServer(fileName, 'fr');
                    };
                    listContainer.appendChild(btn);
                }
            }
            
            if (shFiles.length > 0) {
                let shHeader = document.createElement('div');
                shHeader.style.cssText = 'color:#5ce1e6;font-size:11px;font-weight:700;margin-bottom:6px;margin-top:8px;';
                shHeader.textContent = 'SH PATCH';
                listContainer.appendChild(shHeader);
                
                for (let i = 0; i < shFiles.length; i++) {
                    let fileName = shFiles[i];
                    let displayName = fileName.replace('.sh', '');
                    
                    let btn = document.createElement('button');
                    btn.style.cssText = 'width:100%;padding:12px;background:rgba(92,225,230,0.1);border:1px solid rgba(92,225,230,0.25);color:#fff;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;text-align:left;margin-bottom:6px;';
                    btn.innerHTML = 'SH: ' + displayName;
                    btn.onclick = function() {
                        document.getElementById('fr-modal').classList.remove('show');
                        downloadFromServer(fileName, 'sh');
                    };
                    listContainer.appendChild(btn);
                }
            }
            
            document.getElementById('fr-modal').classList.add('show');
            return;
        }
        
        // ========== MODXS AIMHEAD/AIMTRACK/EASYDRAG/STABILIZER ==========
        let pkg = window.targetPkg || "com.dts.freefireth";
        let fileGz = "";
        let targetDir = "/sdcard/Android/data";
        let tmpDir = "/data/local/tmp/msxrx";

        if (n === 'ModXS AimHead') fileGz = "aimhead.gz";
        else if (n === 'ModXS EasyDrag') fileGz = "easydrag.gz";
        else if (n === 'ModXS AimTrack') fileGz = "aimtrack.gz";
        else if (n === 'ModXS Stabilizer') fileGz = "stabilizer.gz";

        await processDownload(fileGz, 'fr', targetDir, tmpDir, pluginText, pluginFill, pluginLoader, n);

    } catch (e) {
        showNotification("Error Sistem: " + e.message);
        if (pluginLoader) pluginLoader.style.display = 'none';
    }
})();

// ========== FUNGSI UTAMA PROSES DOWNLOAD ==========
async function processDownload(fileName, type, targetDir, tmpDir, pluginText, pluginFill, pluginLoader, displayName) {
    let dlUrl = "https://huggingface.co/datasets/strszt/goddata/resolve/main/" + fileName;
    
    if (!displayName) {
        displayName = type === 'fr' 
            ? fileName.replace('FR-', '').replace(/\.(gz|enc|zip)$/, '')
            : fileName.replace('.sh', '');
    }
    
    showNotification("Installing " + displayName + "...");
    if (pluginText) pluginText.innerText = 'DOWNLOADING 0%';
    if (pluginFill) pluginFill.style.width = '0%';
    
    let res = await fetch(dlUrl + "?nocache=" + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error("Download gagal");
    
    let destPath;
    if (type === 'sh') {
        destPath = "/data/local/tmp/" + fileName;
    } else {
        destPath = tmpDir + '/gdtmp.gz';
    }
    
    await window.Android.runShell('mkdir -p "' + tmpDir + '" 2>/dev/null; rm -f "' + destPath + '"; > "' + destPath + '"');
    
    let total = parseInt(res.headers.get('content-length')) || 0;
    let reader = res.body.getReader();
    let allChunks = [];
    let loaded = 0;
    
    // Download dulu semua, simpan di array
    while (true) {
        let {done, value} = await reader.read();
        if (done) break;
        allChunks.push(value);
        loaded += value.length;
        if (total > 0) {
            let pct = Math.floor((loaded / total) * 70);
            if (pluginText) pluginText.innerText = 'DOWNLOADING ' + pct + '%';
            if (pluginFill) pluginFill.style.width = pct + '%';
        }
    }
    
    // Gabungin semua bytes
    let allBytes = new Uint8Array(loaded);
    let pos = 0;
    for (let chunk of allChunks) {
        allBytes.set(chunk, pos);
        pos += chunk.length;
    }
    allChunks = null; // Free memory
    
    if (pluginText) pluginText.innerText = 'PROCESSING 70%';
    if (pluginFill) pluginFill.style.width = '70%';
    
    // Kirim per 1MB ke shell (jauh lebih dikit call)
    let chunkSize = 1048576; // 1MB
    let totalChunks = Math.ceil(allBytes.length / chunkSize);
    
    for (let i = 0; i < allBytes.length; i += chunkSize) {
        let end = Math.min(i + chunkSize, allBytes.length);
        let chunk = allBytes.subarray(i, end);
        let b64 = btoa(String.fromCharCode.apply(null, chunk));
        
        let pct = 70 + Math.floor((i / allBytes.length) * 25);
        if (pluginText) pluginText.innerText = 'PROCESSING ' + pct + '%';
        if (pluginFill) pluginFill.style.width = pct + '%';
        
        await window.Android.runShell(
            'echo ' + b64 + ' | base64 -d >> "' + destPath + '" 2>/dev/null || ' +
            'echo ' + b64 + ' | toybox base64 -d >> "' + destPath + '" 2>/dev/null'
        );
    }
    
    if (type === 'sh') {
        if (pluginText) pluginText.innerText = 'RUNNING 95%';
        if (pluginFill) pluginFill.style.width = '95%';
        
        await window.Android.runShell(
            'chmod 755 "' + destPath + '";' +
            'nohup sh "' + destPath + '" >/dev/null 2>&1 &'
        );
    } else {
        if (pluginText) pluginText.innerText = 'EXTRACTING 95%';
        if (pluginFill) pluginFill.style.width = '95%';
        
        let cmd = 'TARGET_DIR="' + targetDir + '";' +
            'TMP_DIR="' + tmpDir + '";' +
            'if [ -s "' + destPath + '" ]; then ' +
            'toybox tar -xzf "' + destPath + '" -O 2>/dev/null | toybox tar --touch -xf - -C "$TARGET_DIR" 2>/dev/null;' +
            'toybox tar -xzf "' + destPath + '" -C "$TARGET_DIR" 2>/dev/null;' +
            'tar -xzf "' + destPath + '" -C "$TARGET_DIR" 2>/dev/null;' +
            'unzip -o "' + destPath + '" -d "$TARGET_DIR" 2>/dev/null;' +
            'fi;' +
            'rm -rf "$TMP_DIR";' +
            'pm trim-caches 999G >/dev/null 2>&1';
        
        await window.Android.runShell(cmd);
    }
    
    if (pluginText) pluginText.innerText = 'COMPLETE 100%';
    if (pluginFill) pluginFill.style.width = '100%';
    showNotification(displayName + " selesai");
    
    setTimeout(() => {
        if (pluginLoader) pluginLoader.style.display = 'none';
    }, 1500);
}

// ========== DOWNLOAD FUNCTION (buat Installer) ==========
async function downloadFromServer(fileName, type) {
    const pluginLoader = document.getElementById('plugin-loader');
    const pluginText = document.getElementById('plugin-text');
    const pluginFill = document.getElementById('plugin-progress-fill');
    
    if (pluginLoader) {
        pluginLoader.style.display = 'flex';
        pluginLoader.style.zIndex = '10001';
    }
    
    let tmpDir = "/data/local/tmp/msxrx";
    let targetDir = "/sdcard/Android/data";
    
    await processDownload(fileName, type, targetDir, tmpDir, pluginText, pluginFill, pluginLoader, null);
}
