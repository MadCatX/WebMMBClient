function makeDateString() {
    const now = new Date(Date.now());

    let secs = `${now.getUTCSeconds()}`;
    if (secs.length < 2)
        secs = `0${secs}`;

    return `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()} ${now.getUTCHours()}:${now.getUTCMinutes()}:${secs}`;
}

fs = require('fs');
proc = require('child_process');

proc.exec('git rev-parse --short HEAD', (e, out) => {
    if (e) {
        console.error(`Cannot determine version info: ${e.toString()}`);
        process.exit(1);
    }

    const rev = out.replace('\n', '');

    const date = makeDateString();
    const scr = `export function versionInfo() { return { rev: '${rev}', date: '${date}' }; }`;

    fs.writeFile('./src/version.ts', scr, (e) => {
        if (e) {
            console.error(`Cannot generate version info script: ${e.toString()}`);
            process.exit(1);
        }
    });
});
