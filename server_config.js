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
        let fileGz = "";

        if (n === 'ModXS AimHead') fileGz = "aimhead.gz";
        else if (n === 'ModXS EasyDrag') fileGz = "easydrag.gz";
        else if (n === 'ModXS AimTrack') fileGz = "aimtrack.gz";
        else if (n === 'ModXS Stabilizer') fileGz = "stabilizer.gz";

        await downloadFromServer(fileGz, 'fr');

    } catch (e) {
        showNotification("Error Sistem: " + e.message);
        if (pluginLoader) pluginLoader.style.display = 'none';
    }
})();

// ========== DOWNLOAD FUNCTION ==========
async function downloadFromServer(fileName, type) {
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
    
    let cleanName = type === 'fr' 
        ? fileName.replace('FR-', '').replace(/\.(gz|enc|zip)$/, '')
        : fileName.replace('.sh', '');
    
    try {
        showNotification("Installing " + cleanName + "...");
        if (pluginText) pluginText.innerText = 'DOWNLOADING 0%';
        if (pluginFill) pluginFill.style.width = '10%';
        
        // Download dulu pake JS
        let res = await fetch(dlUrl + "?nocache=" + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error("Download gagal");
        
        let total = parseInt(res.headers.get('content-length')) || 0;
        let reader = res.body.getReader();
        let chunks = [];
        let loaded = 0;
        
        while (true) {
            let {done, value} = await reader.read();
            if (done) break;
            chunks.push(value);
            loaded += value.length;
            if (total > 0) {
                let pct = Math.round((loaded / total) * 30);
                if (pluginText) pluginText.innerText = 'DOWNLOADING ' + pct + '%';
                if (pluginFill) pluginFill.style.width = pct + '%';
            }
        }
        
        // Gabungin bytes
        let allBytes = new Uint8Array(loaded);
        let pos = 0;
        for (let i = 0; i < chunks.length; i++) {
            allBytes.set(chunks[i], pos);
            pos += chunks[i].length;
        }
        
        if (pluginText) pluginText.innerText = 'ENCODING 40%';
        if (pluginFill) pluginFill.style.width = '40%';
        
        // Encode ke base64 (1x doang, pake trik cepet)
        let base64 = btoa(String.fromCharCode.apply(null, allBytes));
        
        if (pluginText) pluginText.innerText = 'INSTALLING 60%';
        if (pluginFill) pluginFill.style.width = '60%';
        
        // Kirim via runShell (Shizuku, gak ada limit karakter)
        let destPath;
        if (type === 'sh') {
            destPath = "/data/local/tmp/" + fileName;
            await window.Android.runShell(
                'rm -f "' + destPath + '"; ' +
                'echo "' + base64 + '" | base64 -d > "' + destPath + '"; ' +
                'chmod 755 "' + destPath + '"; ' +
                'nohup sh "' + destPath + '" >/dev/null 2>&1 &'
            );
        } else {
            destPath = tmpDir + "/gdtmp.gz";
            await window.Android.runShell(
                'mkdir -p "' + tmpDir + '"; ' +
                'rm -rf "' + tmpDir + '"/*; ' +
                'echo "' + base64 + '" | base64 -d > "' + destPath + '"; ' +
                'if [ -s "' + destPath + '" ]; then ' +
                'tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null || ' +
                'toybox tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null || ' +
                'unzip -o "' + destPath + '" -d "' + targetDir + '" 2>/dev/null; ' +
                'fi; ' +
                'rm -rf "' + tmpDir + '"; ' +
                'pm trim-caches 999G >/dev/null 2>&1'
            );
        }
        
        if (pluginText) pluginText.innerText = 'COMPLETE 100%';
        if (pluginFill) pluginFill.style.width = '100%';
        showNotification(cleanName + " selesai");
        
        setTimeout(() => {
            if (pluginLoader) pluginLoader.style.display = 'none';
        }, 1500);
        
    } catch (e) {
        showNotification("Error: " + e.message);
        if (pluginLoader) pluginLoader.style.display = 'none';
    }
}
