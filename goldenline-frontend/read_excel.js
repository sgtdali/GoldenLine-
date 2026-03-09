const XLSX = require('xlsx');
try {
    const workbook = XLSX.readFile('c:/Users/tvural.REPKON/Desktop/GoldenLine/HF903 SEVKÄ°YAT LÄ°STESÄ° V1.xlsx');
    const sheetName = 'HFP405';
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
        console.error(`Sheet "${sheetName}" not found. Available sheets:`, workbook.SheetNames);
    } else {
        const data = XLSX.utils.sheet_to_json(sheet);
        console.log('--- EXCEL CONTENT (HFP405) START ---');
        console.log(JSON.stringify(data.slice(0, 15), null, 2));
        console.log('--- EXCEL CONTENT (HFP405) END ---');
    }
} catch (e) {
    console.error('Error reading excel:', e.message);
}

