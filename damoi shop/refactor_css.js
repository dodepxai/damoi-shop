const fs = require('fs');
try {
    const html = fs.readFileSync('c:\\Users\\ADMIN\\OneDrive\\Máy tính\\damoi shop\\admin.html', 'utf8');
    const styleStart = html.indexOf('<style>');
    const styleEnd = html.indexOf('</style>', styleStart);
    
    if (styleStart !== -1 && styleEnd !== -1) {
        let css = html.substring(styleStart + 7, styleEnd).trim();
        // Cố tình ghi đè admin.css
        fs.writeFileSync('c:\\Users\\ADMIN\\OneDrive\\Máy tính\\damoi shop\\admin.css', css, 'utf8');
        console.log('Written ' + css.length + ' bytes to admin.css');
        
        const newHtml = html.substring(0, styleStart) + '<link rel="stylesheet" href="admin.css?v=2">' + html.substring(styleEnd + 8);
        fs.writeFileSync('c:\\Users\\ADMIN\\OneDrive\\Máy tính\\damoi shop\\admin.html', newHtml, 'utf8');
        console.log('Replaced <style> with <link> in admin.html');
    } else {
        console.log('Could not find <style> block.');
    }
} catch (e) {
    console.error(e);
}
