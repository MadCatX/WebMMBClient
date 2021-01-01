function td(v) {
    return v < 10 ? `0${v}` : v;
}

function makeDateString() {
    const now = new Date(Date.now());

    return `${now.getUTCFullYear()}-${td(now.getUTCMonth()+1)}-${td(now.getUTCDate())} ${td(now.getUTCHours())}:${td(now.getUTCMinutes())}:${td(now.getUTCSeconds())}`;
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
