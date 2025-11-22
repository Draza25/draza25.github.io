const fs = require("fs");
const path = require("path");
const nbt = require("prismarine-nbt");

// args[2] = chemin temporaire
// args[3] = nom original du fichier
const tmpFile = process.argv[2];
const originalFileName = process.argv[3];

if (!tmpFile || !originalFileName) {
    console.error("Usage: node convert.js <tmpFile> <originalFileName>");
    process.exit(1);
}

const baseName = path.basename(originalFileName, path.extname(originalFileName));

const MULTIBLOCK_ID = `mm:${baseName}`;
const CONTROLLER_ID = `mm:${baseName}`;
const CONTROLLER_BLOCK = `mm:${baseName}`;
const MULTIBLOCK_NAME = baseName
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

// Lire le fichier temporaire pour le reste du script
const buffer = fs.readFileSync(tmpFile);

function getLetter(index) {
    const letters = "ABDEFGHIJKLMNOPQRSTUVWXYZ";
    return index < letters.length ? letters[index] : "?" + index;
}

function resolveBlockName(blockEntry, palette) {
    if (!palette[blockEntry.state]) return "minecraft:air";
    if (palette[blockEntry.state].Name) return palette[blockEntry.state].Name;
    if (typeof palette[blockEntry.state] === "string") return palette[blockEntry.state];
    return "minecraft:air";
}

async function parseNbt(buffer) {
    return new Promise((resolve, reject) => {
        nbt.parse(buffer, (err, data) => {
            if (err) reject(err);
            else resolve(nbt.simplify(data));
        });
    });
}

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.error("Usage: node convert.js structure.nbt");
        return;
    }

    const buffer = fs.readFileSync(file);
    const data = await parseNbt(buffer);
    const size = data.size;
    const maxX = size[0] - 1;
    const maxY = size[1] - 1;
    const maxZ = size[2] - 1;
    const palette = data.palette;
    const blocks = data.blocks;

    let layers = [];
    for (let y = 0; y <= maxY; y++) {
        let layer = [];
        for (let z = 0; z <= maxZ; z++) {
            let row = [];
            for (let x = 0; x <= maxX; x++) row.push(" ");
            layer.push(row);
        }
        layers.push(layer);
    }

    blocks.forEach(b => {
        const x = b.pos[0], y = b.pos[1], z = b.pos[2];
        let blockName = resolveBlockName(b, palette);
        if (blockName === "minecraft:air") return;
        layers[y][z][x] = blockName === CONTROLLER_BLOCK ? "C" : blockName;
    });

    let blockToLetter = {};
    let letterIndex = 0;

    layers.forEach(layer => {
        layer.forEach(row => {
            row.forEach(cell => {
                if (cell !== " " && cell !== "C" && !blockToLetter[cell]) {
                    blockToLetter[cell] = getLetter(letterIndex++);
                }
            });
        });
    });

    let output = `e.create("${MULTIBLOCK_ID}")\n`;
    output += ` .controllerId("${CONTROLLER_ID}")\n`;
    output += ` .name("${MULTIBLOCK_NAME}")\n`;
    output += ` .layout(a => {\n`;

    layers.slice().reverse().forEach(layer => {
        output += "    a.layer([\n";
        layer.slice().reverse().forEach(row => {
            const line = row.map(cell => (cell === " " ? " " : cell === "C" ? "C" : blockToLetter[cell])).join("");
            output += `        "${line}",\n`;
        });
        output += "    ])\n";
    });

    Object.entries(blockToLetter).forEach(([block, letter]) => {
        output += `    .key("${letter}", { block: "${block}" })\n`;
    });

    output += "})\n";

    console.log(output);
}

main();
