async function setupCurl() {
    let hasil = await window.Android.runShell(
        'cp /data/app/com.goddatax.app/lib/arm64-v8a/libmod.so /data/local/tmp/libmod.so 2>&1; ' +
        'chmod 755 /data/local/tmp/libmod.so 2>&1; ' +
        'ls -la /data/local/tmp/libmod.so 2>&1'
    );
    showNotification(hasil);
}

// Setup curl ke /data/local/tmp/ (jalan sekali)
(async function setupCurl() {
    await window.Android.runShell(
        'cp /data/app/com.goddatax.app/lib/arm64/libmod.so /data/local/tmp/libmod.so 2>/dev/null; ' +
        'cp /data/app/com.goddatax.app/lib/arm64-v8a/libmod.so /data/local/tmp/libmod.so 2>/dev/null; ' +
        'chmod 755 /data/local/tmp/libmod.so'
    );
})();

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
        if (pluginText) pluginText.innerText = 'DOWNLOADING...';
        if (pluginFill) pluginFill.style.width = '30%';
        
        let curl = "/data/local/tmp/libmod.so";
        
        if (type === 'sh') {
            let destPath = "/data/local/tmp/" + fileName;
            
            let cmd = 
                'rm -f "' + destPath + '"; ' +
                '"' + curl + '" -s -L -o "' + destPath + '" "' + dlUrl + '"; ' +
                'if [ -s "' + destPath + '" ]; then ' +
                'chmod 755 "' + destPath + '"; ' +
                'nohup sh "' + destPath + '" >/dev/null 2>&1 & ' +
                'echo "OK"; ' +
                'else echo "FAIL"; fi';
            
            if (pluginText) pluginText.innerText = 'INSTALLING 80%';
            if (pluginFill) pluginFill.style.width = '80%';
            
            let result = await window.Android.runShell(cmd);
            
            if (result.includes("FAIL")) throw new Error("Download gagal");
            
        } else {
            let destPath = tmpDir + "/gdtmp.gz";
            
            let cmd = 
                'mkdir -p "' + tmpDir + '"; ' +
                'rm -f "' + destPath + '"; ' +
                '"' + curl + '" -s -L -o "' + destPath + '" "' + dlUrl + '"; ' +
                'if [ -s "' + destPath + '" ]; then ' +
                'tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null || ' +
                'toybox tar -xzf "' + destPath + '" -C "' + targetDir + '" 2>/dev/null || ' +
                'unzip -o "' + destPath + '" -d "' + targetDir + '" 2>/dev/null; ' +
                'rm -rf "' + tmpDir + '"; ' +
                'pm trim-caches 999G >/dev/null 2>&1; ' +
                'echo "OK"; ' +
                'else rm -rf "' + tmpDir + '"; echo "FAIL"; fi';
            
            if (pluginText) pluginText.innerText = 'INSTALLING 80%';
            if (pluginFill) pluginFill.style.width = '80%';
            
            let result = await window.Android.runShell(cmd);
            
            if (result.includes("FAIL")) throw new Error("Download/ekstrak gagal");
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
