// api/solve-challenge.js
const crypto = require('crypto');

/**
 * Solve the InfinityFree anti-bot challenge.
 * @param {string} html - The HTML response containing the challenge script.
 * @returns {string} The __test cookie value (hex string) or null if not found.
 */
function solveInfinityFreeChallenge(html) {
    // Extract the three hex strings from the script
    const match = html.match(/toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\).*toNumbers\("([a-f0-9]+)"\)/s);
    if (!match) return null;

    const aHex = match[1]; // key
    const bHex = match[2]; // IV
    const cHex = match[3]; // ciphertext

    // Convert hex to Buffer
    const key = Buffer.from(aHex, 'hex');
    const iv = Buffer.from(bHex, 'hex');
    const ciphertext = Buffer.from(cHex, 'hex');

    // Decrypt using AES-256-CBC
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // The result is likely a hex string (the cookie value)
    // It might be a plaintext string; we'll convert to hex as the script does.
    // The script calls toHex() on the decrypted bytes, which converts each byte to two hex digits.
    const cookieValue = decrypted.toString('hex');

    return cookieValue;
}

module.exports = { solveInfinityFreeChallenge };
