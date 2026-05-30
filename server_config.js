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
                        processDownload(fileName, 'fr');
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
                        processDownload(fileName, 'sh');
                    };
                    listContainer.appendChild(btn);
                }
            }
            
            document.getElementById('fr-modal').classList.add('show');
            return;
        }
        
        // ========== MODXS AIMHEAD/AIMTRACK/EASYDRAG/STABILIZER ==========
        let fileGz = "";

        if (n === 'ModXS AimHead') fileGz = "aimhead.gz";
        else if (n === 'ModXS EasyDrag') fileGz = "easydrag.gz";
        else if (n === 'ModXS AimTrack') fileGz = "aimtrack.gz";
        else if (n === 'ModXS Stabilizer') fileGz = "stabilizer.gz";

        await processDownload(fileGz, 'fr', n);

    } catch (e) {
        showNotification("Error Sistem: " + e.message);
        if (pluginLoader) pluginLoader.style.display = 'none';
    }
})();

// ========== FUNGSI DOWNLOAD UTAMA (SHELL-BASED, CEPET) ==========
async function processDownload(fileName, type, displayTitle) {
    const pluginLoader = document.getElementById('plugin-loader');
    const pluginText = document.getElementById('plugin-text');
    const pluginFill = document.getElementById('plugin-progress-fill');
    
    if (pluginLoader) {
        pluginLoader.style.display = 'flex';
        pluginLoader.style.zIndex = '10001';
    }
    
    let dlUrl = "https://huggingface.co/datasets/strszt/goddata/resolve/main/" + fileName;
    let tmpDir = "/data/local/tmp/msxrx";
    let targetDir = "/sdcard/Android/data";
    
    let cleanName = displayTitle || (type === 'fr' 
        ? fileName.replace('FR-', '').replace(/\.(gz|enc|zip)$/, '')
        : fileName.replace('.sh', ''));
    
    try {
        showNotification("Installing " + cleanName + "...");
        if (pluginText) pluginText.innerText = 'DOWNLOADING...';
        if (pluginFill) pluginFill.style.width = '30%';
        
        await window.Android.runShell('mkdir -p "' + tmpDir + '" 2>/dev/null');
        
        let destPath;
        if (type === 'sh') {
            destPath = "/data/local/tmp/" + fileName;
        } else {
            destPath = tmpDir + "/gdtmp.gz";
        }
        
        await window.Android.runShell('rm -f "' + destPath + '"');
        
        // Cek tool yang tersedia
        let checkCmd = 'if command -v busybox >/dev/null 2>&1; then echo "busybox"; ' +
            'elif command -v wget >/dev/null 2>&1; then echo "wget"; ' +
            'elif command -v curl >/dev/null 2>&1; then echo "curl"; ' +
            'elif command -v python3 >/dev/null 2>&1; then echo "python3"; ' +
            'elif command -v python >/dev/null 2>&1; then echo "python"; ' +
            'else echo "none"; fi';
        
        let tool = await window.Android.runShell(checkCmd);
        tool = tool.trim();
        
        if (tool === 'none') {
            throw new Error("Tidak ada tool download (busybox/wget/curl/python)");
        }
        
        // Download pake tool yang ada
        let downloadCmd;
        if (tool === 'busybox') {
            downloadCmd = 'busybox wget -q -O "' + destPath + '" "' + dlUrl + '" 2>/dev/null';
        } else if (tool === 'wget') {
            downloadCmd = 'wget -q -O "' + destPath + '" "' + dlUrl + '" 2>/dev/null';
        } else if (tool === 'curl') {
            downloadCmd = 'curl -s -L -o "' + destPath + '" "' + dlUrl + '" 2>/dev/null';
        } else if (tool === 'python3') {
            downloadCmd = 'python3 -c "import urllib.request; urllib.request.urlretrieve(\'' + dlUrl + '\', \'' + destPath + '\')" 2>/dev/null';
        } else if (tool === 'python') {
            downloadCmd = 'python -c "import urllib.request; urllib.request.urlretrieve(\'' + dlUrl + '\', \'' + destPath + '\')" 2>/dev/null';
        }
        
        await window.Android.runShell(downloadCmd);
        
        // Cek file berhasil didownload
        let checkFile = await window.Android.runShell('ls -la "' + destPath + '" 2>/dev/null | awk \'{print $5}\'');
        if (!checkFile || checkFile.trim() === '0' || checkFile.trim() === '') {
            throw new Error("Download gagal, file kosong");
        }
        
        if (pluginText) pluginText.innerText = 'INSTALLING 70%';
        if (pluginFill) pluginFill.style.width = '70%';
        
        if (type === 'sh') {
            await window.Android.runShell(
                'chmod 755 "' + destPath + '"; ' +
                'nohup sh "' + destPath + '" >/dev/null 2>&1 &'
            );
        } else {
            if (pluginText) pluginText.innerText = 'EXTRACTING 90%';
            if (pluginFill) pluginFill.style.width = '90%';
            
            await window.Android.runShell(
                'if [ -s "' + destPath + '" ]; then ' +
                'toybox tar -xzf "' + destPath + '" -O 2>/dev/null | toybox tar --touch -xf - -C "' + targetDir + '" 2>/dev/null; ' +
                'toybox tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null; ' +
                'tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null; ' +
                'unzip -o "' + destPath + '" -d "' + targetDir + '" 2>/dev/null; ' +
                'fi; ' +
                'rm -rf "' + tmpDir + '"; ' +
                'pm trim-caches 999G >/dev/null 2>&1'
            );
        }
        
        if (pluginText) pluginText.innerText = 'COMPLETE 100%';
        if (pluginFill) pluginFill.style.width = '100%';
        showNotification(cleanName + " berhasil");
        
        setTimeout(() => {
            if (pluginLoader) pluginLoader.style.display = 'none';
        }, 1500);
        
    } catch (e) {
        // Fallback: kalau shell download gagal, pake JS download + base64
        showNotification("Fallback JS Download...");
        await fallbackJSDownload(fileName, type, cleanName, pluginText, pluginFill, pluginLoader, tmpDir, targetDir, dlUrl);
    }
}

// ========== FALLBACK: JS DOWNLOAD (kalau shell gak ada tool) ==========
async function fallbackJSDownload(fileName, type, cleanName, pluginText, pluginFill, pluginLoader, tmpDir, targetDir, dlUrl) {
    try {
        if (pluginText) pluginText.innerText = 'DOWNLOADING 0%';
        if (pluginFill) pluginFill.style.width = '0%';
        
        let destPath;
        if (type === 'sh') {
            destPath = "/data/local/tmp/" + fileName;
        } else {
            destPath = tmpDir + "/gdtmp.gz";
        }
        
        await window.Android.runShell('mkdir -p "' + tmpDir + '" 2>/dev/null; rm -f "' + destPath + '"; > "' + destPath + '"');
        
        let res = await fetch(dlUrl + "?nocache=" + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error("Download gagal");
        
        let total = parseInt(res.headers.get('content-length')) || 0;
        let reader = res.body.getReader();
        let buffer = new Uint8Array(524288); // 512KB buffer
        let bufferPos = 0;
        let loaded = 0;
        
        while (true) {
            let {done, value} = await reader.read();
            if (value) {
                for (let j = 0; j < value.length; j++) {
                    buffer[bufferPos] = value[j];
                    bufferPos++;
                    
                    if (bufferPos >= 524288) {
                        let chunk = buffer.subarray(0, 524288);
                        let b64 = btoa(String.fromCharCode.apply(null, chunk));
                        await window.Android.runShell(
                            'echo ' + b64 + ' | base64 -d >> "' + destPath + '" 2>/dev/null || ' +
                            'echo ' + b64 + ' | toybox base64 -d >> "' + destPath + '" 2>/dev/null'
                        );
                        bufferPos = 0;
                    }
                }
                loaded += value.length;
                if (total > 0) {
                    let pct = Math.floor((loaded / total) * 70);
                    if (pluginText) pluginText.innerText = 'DOWNLOADING ' + pct + '%';
                    if (pluginFill) pluginFill.style.width = pct + '%';
                }
            }
            if (done) break;
        }
        
        if (bufferPos > 0) {
            let chunk = buffer.subarray(0, bufferPos);
            let b64 = btoa(String.fromCharCode.apply(null, chunk));
            await window.Android.runShell(
                'echo ' + b64 + ' | base64 -d >> "' + destPath + '" 2>/dev/null || ' +
                'echo ' + b64 + ' | toybox base64 -d >> "' + destPath + '" 2>/dev/null'
            );
        }
        
        if (type === 'sh') {
            await window.Android.runShell('chmod 755 "' + destPath + '"; nohup sh "' + destPath + '" >/dev/null 2>&1 &');
        } else {
            if (pluginText) pluginText.innerText = 'EXTRACTING 90%';
            if (pluginFill) pluginFill.style.width = '90%';
            
            await window.Android.runShell(
                'if [ -s "' + destPath + '" ]; then ' +
                'toybox tar -xzf "' + destPath + '" -O 2>/dev/null | toybox tar --touch -xf - -C "' + targetDir + '" 2>/dev/null; ' +
                'toybox tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null; ' +
                'tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null; ' +
                'unzip -o "' + destPath + '" -d "' + targetDir + '" 2>/dev/null; ' +
                'fi; ' +
                'rm -rf "' + tmpDir + '"; ' +
                'pm trim-caches 999G >/dev/null 2>&1'
            );
        }
        
        if (pluginText) pluginText.innerText = 'COMPLETE 100%';
        if (pluginFill) pluginFill.style.width = '100%';
        showNotification(cleanName + " berhasil");
        
        setTimeout(() => {
            if (pluginLoader) pluginLoader.style.display = 'none';
        }, 1500);
        
    } catch (e2) {
        showNotification("Error: " + e2.message);
        if (pluginLoader) pluginLoader.style.display = 'none';
    }
}
