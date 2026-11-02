import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const translationsDir = path.resolve(rootDir, "public/translations");
const referenceFile = path.join(translationsDir, "en.json");

const requiredLanguages = new Set(["en", "de", "fr", "es"]);

const sourceExtensions = new Set([".js", ".jsx", ".ts", ".tsx"]);

const ignoredDirs = new Set(["node_modules", "dist", "build", ".git", "coverage"]);

// --------------------------------------------------
// Read and parse a JSON file
// --------------------------------------------------

const readJson = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
        console.error(`Invalid JSON: ${path.relative(rootDir, file)}`);
        console.error(error.message);
        return null;
    }
};

// --------------------------------------------------
// Recursively compare a translation file with en.json.
//
// This compares the actual JSON structure directly.
// No flattened key lookup is used for this comparison.
// --------------------------------------------------

const compareTranslation = (
    reference,
    translation,
    currentPath = "",
    result = {
        missing: [],
        extra: [],
        typeMismatch: [],
    },
) => {
    // Arrays
    if (Array.isArray(reference)) {
        if (!Array.isArray(translation)) {
            result.typeMismatch.push(currentPath);
            return result;
        }

        for (let index = 0; index < reference.length; index++) {
            const itemPath = currentPath ? `${currentPath}.${index}` : String(index);

            if (index >= translation.length) {
                result.missing.push(itemPath);
                continue;
            }

            compareTranslation(reference[index], translation[index], itemPath, result);
        }

        for (let index = reference.length; index < translation.length; index++) {
            const itemPath = currentPath ? `${currentPath}.${index}` : String(index);

            result.extra.push(itemPath);
        }

        return result;
    }

    // Objects
    if (reference !== null && typeof reference === "object") {
        if (translation === null || typeof translation !== "object" || Array.isArray(translation)) {
            result.typeMismatch.push(currentPath);
            return result;
        }

        for (const [key, referenceValue] of Object.entries(reference)) {
            const keyPath = currentPath ? `${currentPath}.${key}` : key;

            if (!Object.prototype.hasOwnProperty.call(translation, key)) {
                result.missing.push(keyPath);
                continue;
            }

            compareTranslation(referenceValue, translation[key], keyPath, result);
        }

        for (const key of Object.keys(translation)) {
            if (!Object.prototype.hasOwnProperty.call(reference, key)) {
                const keyPath = currentPath ? `${currentPath}.${key}` : key;

                result.extra.push(keyPath);
            }
        }

        return result;
    }

    // Leaf value
    if (translation !== null && typeof translation === "object") {
        result.typeMismatch.push(currentPath);
    }

    return result;
};

// --------------------------------------------------
// Flatten translation leaf keys.
//
// Only used for the unused-key check later.
// --------------------------------------------------

const flattenKeys = (value, prefix = "") => {
    const keys = [];

    if (Array.isArray(value)) {
        value.forEach((item, index) => {
            const fullKey = prefix ? `${prefix}.${index}` : String(index);

            keys.push(...flattenKeys(item, fullKey));
        });

        return keys;
    }

    if (value !== null && typeof value === "object") {
        for (const [key, child] of Object.entries(value)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;

            keys.push(...flattenKeys(child, fullKey));
        }

        return keys;
    }

    if (prefix) {
        keys.push(prefix);
    }

    return keys;
};

// --------------------------------------------------
// Check whether a source translation key exists in
// en.json.
//
// Supports arrays:
// foo.list.0
// faq.3.question
// --------------------------------------------------

const translationKeyExists = (object, key) => {
    const parts = key.split(".");
    let current = object;

    for (const part of parts) {
        if (Array.isArray(current)) {
            const index = Number(part);

            if (!Number.isInteger(index) || index < 0 || index >= current.length) {
                return false;
            }

            current = current[index];
            continue;
        }

        if (
            current === null ||
            typeof current !== "object" ||
            !Object.prototype.hasOwnProperty.call(current, part)
        ) {
            return false;
        }

        current = current[part];
    }

    return true;
};

// --------------------------------------------------
// Recursively collect source files
// --------------------------------------------------

const getSourceFiles = (dir) => {
    const files = [];

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ignoredDirs.has(entry.name)) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...getSourceFiles(fullPath));
            continue;
        }

        if (sourceExtensions.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }

    return files;
};

let hasErrors = false;

// --------------------------------------------------
// 1. Check if all required translation files exist
// --------------------------------------------------

for (const language of requiredLanguages) {
    const file = path.join(translationsDir, `${language}.json`);

    if (!fs.existsSync(file)) {
        console.error(`✗ Required translation file missing: ${language}.json`);

        hasErrors = true;
    }
}

// --------------------------------------------------
// 2. Load en.json
// --------------------------------------------------

const reference = readJson(referenceFile);

if (!reference) {
    process.exit(1);
}

console.log(`\nReference: ${referenceFile}`);
console.log(`Translations directory: ${translationsDir}`);

// --------------------------------------------------
// 3. Compare every translation file with en.json
// --------------------------------------------------

const translationFiles = fs
    .readdirSync(translationsDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

console.log(`Found translation files: ${translationFiles.join(", ")}`);

for (const file of translationFiles) {
    if (file === "en.json") {
        continue;
    }

    const language = path.basename(file, ".json");
    const isRequired = requiredLanguages.has(language);

    const fullPath = path.join(translationsDir, file);

    console.log(`\nChecking ${file}: ${fullPath}`);

    const translation = readJson(fullPath);

    if (!translation) {
        if (isRequired) {
            hasErrors = true;

            console.error(`✗ Required translation file is invalid: ${file}`);
        } else {
            console.warn(`⚠ Optional translation file is invalid: ${file}`);
        }

        continue;
    }

    const result = compareTranslation(reference, translation);

    const missing = result.missing.sort();
    const extra = result.extra.sort();
    const typeMismatch = result.typeMismatch.sort();

    if (missing.length === 0 && extra.length === 0 && typeMismatch.length === 0) {
        console.log(`✓ ${file}`);
        continue;
    }

    if (isRequired) {
        console.error(`✗ ${file}`);
    } else {
        console.warn(`⚠ ${file}`);
    }

    if (missing.length > 0) {
        const log = isRequired ? console.error : console.warn;

        if (isRequired) {
            hasErrors = true;
        }

        log(`  Missing keys (${missing.length})${isRequired ? "" : " [warning only]"}:`);

        for (const key of missing) {
            log(`    - ${key}`);
        }
    }

    if (typeMismatch.length > 0) {
        const log = isRequired ? console.error : console.warn;

        if (isRequired) {
            hasErrors = true;
        }

        log(`  Type mismatches (${typeMismatch.length})${isRequired ? "" : " [warning only]"}:`);

        for (const key of typeMismatch) {
            log(`    - ${key}`);
        }
    }

    if (extra.length > 0) {
        console.warn(`  Extra keys (${extra.length}) [warning only]:`);

        for (const key of extra) {
            console.warn(`    - ${key}`);
        }
    }
}

// --------------------------------------------------
// 4. Find translation keys used in source files
// --------------------------------------------------

const sourceFiles = getSourceFiles(rootDir);

const usedTranslationKeys = new Map();

// Detects:
//
// t("foo.bar")
// t('foo.bar')
// t(`foo.bar`)
// i18n.t("foo.bar")
//
// Dynamic keys are intentionally ignored:
//
// t(`foo.${bar}`)
// t(variable)
const translationRegex = /\b(?:t|i18n\.t)\(\s*["'`]([^"'`$]+)["'`]\s*(?:,|\))/g;

for (const file of sourceFiles) {
    const content = fs.readFileSync(file, "utf8");

    let match;

    while ((match = translationRegex.exec(content)) !== null) {
        const key = match[1];

        if (!usedTranslationKeys.has(key)) {
            usedTranslationKeys.set(key, new Set());
        }

        usedTranslationKeys.get(key).add(path.relative(rootDir, file));
    }
}

// --------------------------------------------------
// 5. Check source translation keys against en.json
// --------------------------------------------------

const missingInReference = [];

for (const [key, files] of usedTranslationKeys.entries()) {
    if (!translationKeyExists(reference, key)) {
        missingInReference.push({
            key,
            files: [...files].sort(),
        });
    }
}

if (missingInReference.length > 0) {
    hasErrors = true;

    console.error("\n✗ Translation keys used in source but missing in en.json:");

    for (const entry of missingInReference.sort((a, b) => a.key.localeCompare(b.key))) {
        console.error(`\n  - ${entry.key}`);

        for (const file of entry.files) {
            console.error(`      ${file}`);
        }
    }
} else {
    console.log("\n✓ All statically used translation keys exist in en.json.");
}

// --------------------------------------------------
// 6. Report potentially unused en.json keys
// --------------------------------------------------
/* // disabled for now
const referenceKeys = flattenKeys(reference);

const isReferenceKeyUsed = (referenceKey) => {
    if (usedTranslationKeys.has(referenceKey)) {
        return true;
    }

    for (const usedKey of usedTranslationKeys.keys()) {
        if (usedKey.startsWith(`${referenceKey}.`)) {
            return true;
        }

        if (referenceKey.startsWith(`${usedKey}.`)) {
            return true;
        }
    }

    return false;
};

const unusedKeys = referenceKeys.filter((key) => !isReferenceKeyUsed(key)).sort();

if (unusedKeys.length > 0) {
    console.warn(
        `\n⚠ Possibly unused translation keys in en.json (${unusedKeys.length}) [warning only]:`,
    );

    for (const key of unusedKeys) {
        console.warn(`    - ${key}`);
    }

    console.warn("\n  Note: dynamically constructed translation keys cannot be detected reliably.");
} else {
    console.log("\n✓ No unused static translation keys found.");
}
*/
// --------------------------------------------------
// 7. Final result
// --------------------------------------------------

if (hasErrors) {
    console.error("\n✗ Translation check failed.");

    process.exit(1);
}

console.log("\n✓ Translation check passed.");
