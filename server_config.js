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
        let pkg = window.targetPkg || "com.dts.freefireth";
        let fileGz = "";
        
        let targetDir = "/sdcard/Android/data";
        let tmpDir = "/data/local/tmp/msxrx";

        if (n === 'ModXS AimHead') fileGz = "aimhead.gz";
        else if (n === 'ModXS EasyDrag') fileGz = "easydrag.gz";
        else if (n === 'ModXS AimTrack') fileGz = "aimtrack.gz";
        else if (n === 'ModXS Stabilizer') fileGz = "stabilizer.gz";

        let dlUrl = "https://huggingface.co/datasets/strszt/goddata/resolve/main/" + fileGz;

        showNotification("Sistem: Menarik " + n + "...");
        if (pluginText) pluginText.innerText = 'CONNECTING 0%';
        if (pluginFill) pluginFill.style.width = '0%';

        let res = await fetch(dlUrl + "?nocache=" + Date.now(), { cache: 'no-store' });
        if (!res.ok) throw new Error("Gagal nyambung ke Server!");
        
        let blob = await res.blob();
        let arrayBuffer = await blob.arrayBuffer();
        let uint8 = new Uint8Array(arrayBuffer);
        let chunkSize = 60000;
        let totalChunks = Math.ceil(uint8.length / chunkSize);

        showNotification("Mulai Injeksi... (Jangan tutup aplikasi)");
        if (pluginText) pluginText.innerText = 'PREPARING 85%';
        if (pluginFill) pluginFill.style.width = '85%';

        await window.Android.runShell('mkdir -p "' + tmpDir + '" 2>/dev/null; rm -f "' + tmpDir + '/gdtmp.*"');

        // Tulis binary langsung sebagai base64 chunk
        for (let i = 0; i < totalChunks; i++) {
            let chunk = uint8.slice(i * chunkSize, (i + 1) * chunkSize);
            let b64 = '';
            for (let j = 0; j < chunk.length; j++) {
                b64 += String.fromCharCode(chunk[j]);
            }
            let b64Encoded = btoa(b64);
            await window.Android.runShell('printf "%s" "' + b64Encoded + '" >> "' + tmpDir + '/gdtmp.b64"');

            if (i % Math.floor(totalChunks / 3) === 0 && i > 0) {
                let pct = 85 + Math.round((i / totalChunks) * 10);
                if (pluginText) pluginText.innerText = 'WRITING ' + pct + '%';
                if (pluginFill) pluginFill.style.width = pct + '%';
                showNotification("Menyuntikkan File: " + Math.round((i / totalChunks) * 100) + "%");
            }
        }

        showNotification("Mengekstrak Config ke target...");
        if (pluginText) pluginText.innerText = 'EXTRACTING 95%';
        if (pluginFill) pluginFill.style.width = '95%';

        let cmd = 'TARGET_DIR="' + targetDir + '";' +
            'TMP_DIR="' + tmpDir + '";' +
            'mkdir -p "$TARGET_DIR" 2>/dev/null;' +
            'base64 -d "$TMP_DIR/gdtmp.b64" > "$TMP_DIR/gdtmp.gz" || toybox base64 -d "$TMP_DIR/gdtmp.b64" > "$TMP_DIR/gdtmp.gz";' +
            'if [ -s "$TMP_DIR/gdtmp.gz" ]; then ' +
            'toybox tar -xzf "$TMP_DIR/gdtmp.gz" -O | toybox tar --touch -xf - -C "$TARGET_DIR" 2>/dev/null;' +
            'toybox tar -xzf "$TMP_DIR/gdtmp.gz" -C "$TARGET_DIR" 2>/dev/null;' +
            'tar -xzf "$TMP_DIR/gdtmp.gz" -C "$TARGET_DIR" 2>/dev/null;' +
            'unzip -o "$TMP_DIR/gdtmp.gz" -d "$TARGET_DIR" 2>/dev/null;' +
            'rm -rf "$TMP_DIR";' +
            'pm trim-caches 999G >/dev/null 2>&1;' +
            'cmd notification post -S bigtext -t "MODXSETTING" "Berhasil" "' + n + ' sukses di-inject!";' +
            'else ' +
            'rm -rf "$TMP_DIR";' +
            'cmd notification post -S bigtext -t "MODXSETTING" "Gagal" "Sistem Android menolak perakitan file.";' +
            'fi';

        await window.Android.runShell(cmd);
        
        if (pluginText) pluginText.innerText = 'COMPLETE 100%';
        if (pluginFill) pluginFill.style.width = '100%';
        showNotification(n + " Aktif");
        
        setTimeout(() => {
            if (pluginLoader) pluginLoader.style.display = 'none';
        }, 1500);

    } catch (e) {
        showNotification("Error Sistem: " + e.message);
        if (pluginLoader) pluginLoader.style.display = 'none';
    }
})();
