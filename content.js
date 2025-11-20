// --- GLOBAL VARIABLES ---
// 1. Load Buttons (Updated defaults)
let savedButtons = localStorage.getItem("my_button_words");
let buttonWords = savedButtons ? JSON.parse(savedButtons) : ["Nuhal", "And", "Sakib", "United"];

// 2. Load Removals
let savedRemovals = localStorage.getItem("my_removals");
let removalList = savedRemovals ? JSON.parse(savedRemovals) : ["bad", "ugly"];

// 3. Load Replacements
let savedReplacements = localStorage.getItem("my_replacements");
let replacementMap = savedReplacements ? JSON.parse(savedReplacements) : {"Nuhal": "G.O.A.T"};

let toolBar = null; 
let lastRange = null;

// --- TRACKING CURSOR ---
document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const activeEl = document.activeElement;
        if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.isContentEditable) {
            lastRange = selection.getRangeAt(0).cloneRange();
        }
    }
});

// --- KEYBOARD SHORTCUT LISTENER ---
document.addEventListener("keydown", (e) => {
    // 1. Handle Alt + Numbers (1-9)
    if (e.altKey && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (buttonWords[index]) {
            e.preventDefault();
            handlePasteLogic(buttonWords[index] + " ");
        }
    }
    
    // 2. Handle Function Keys (F1, F2, etc.) for buttons 10+
    // Note: F1 corresponds to index 9 (the 10th button)
    if (e.key.startsWith("F")) {
        const fNumber = parseInt(e.key.substring(1)); // Get the number after 'F'
        if (!isNaN(fNumber)) {
            const index = 9 + (fNumber - 1); // F1 is index 9, F2 is index 10...
            if (buttonWords[index]) {
                e.preventDefault();
                handlePasteLogic(buttonWords[index] + " ");
            }
        }
    }
});

// --- BUILD TOOLBAR ---
function createToolbar() {
    if (toolBar) toolBar.remove();

    toolBar = document.createElement("div");
    styleToolbar(toolBar);

    // Helper for Roman Numerals
    const romans = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];

    // Create Buttons
    buttonWords.forEach((word, index) => {
        const btn = document.createElement("button");
        styleButton(btn, "white", "black");

        // --- CREATE THE COLORED CIRCLE BADGE ---
        const badge = document.createElement("span");
        styleBadge(badge);

        // Logic for Numbering (1-9) vs Roman (i, ii...)
        if (index < 9) {
            badge.innerText = index + 1; // 1, 2, 3
        } else {
            // Use Roman numeral for 10th button onwards
            // (index 9 becomes roman[0] which is 'i')
            const romanIndex = index - 9;
            if (romans[romanIndex]) {
                badge.innerText = romans[romanIndex];
            } else {
                badge.innerText = "?"; // Fallback if you have > 20 buttons
            }
        }

        // --- CREATE THE TEXT SPAN ---
        const textSpan = document.createElement("span");
        textSpan.innerText = word;

        // Append Badge and Text to Button
        btn.appendChild(badge);
        btn.appendChild(textSpan);

        // Click Logic
        btn.addEventListener("mousedown", async function(e) {
            e.preventDefault();
            e.stopPropagation();
            await handlePasteLogic(word + " ");
        });

        toolBar.appendChild(btn);
    });

    // Settings Button
    const settingsBtn = document.createElement("button");
    settingsBtn.innerText = "⚙️"; 
    styleButton(settingsBtn, "#444", "white");
    settingsBtn.addEventListener("mousedown", (e) => { 
        e.stopPropagation(); 
        openSettingsModal(); 
    });
    toolBar.appendChild(settingsBtn);

    makeDraggable(toolBar);
    document.body.appendChild(toolBar);
}

// --- SETTINGS MODAL ---
function openSettingsModal() {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, { position: "fixed", top: "0", left: "0", width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", zIndex: "20000", display: "flex", justifyContent: "center", alignItems: "center" });

    const box = document.createElement("div");
    Object.assign(box.style, { backgroundColor: "white", padding: "20px", borderRadius: "8px", width: "400px", maxHeight: "90vh", overflowY: "auto", fontFamily: "Arial", textAlign: "left" });

    const title = document.createElement("h3");
    title.innerText = "Extension Settings";
    title.style.textAlign = "center";
    title.style.marginTop = "0";
    box.appendChild(title);

    // INPUT 1: BUTTONS
    box.appendChild(createLabel("Toolbar Buttons (comma separated):"));
    const inputButtons = document.createElement("textarea");
    inputButtons.value = buttonWords.join(", ");
    styleInput(inputButtons);
    box.appendChild(inputButtons);

    // INPUT 2: REMOVALS
    box.appendChild(createLabel("Words to Delete (comma separated):"));
    const inputRemovals = document.createElement("textarea");
    inputRemovals.value = removalList.join(", ");
    inputRemovals.placeholder = "e.g. bad, ugly, error";
    styleInput(inputRemovals);
    box.appendChild(inputRemovals);

    // INPUT 3: REPLACEMENTS
    box.appendChild(createLabel("Replacements (Old=New, Old=New):"));
    const inputReplacements = document.createElement("textarea");
    let repString = [];
    for(let [key, val] of Object.entries(replacementMap)) {
        repString.push(`${key}=${val}`);
    }
    inputReplacements.value = repString.join(", ");
    inputReplacements.placeholder = "e.g. Nuhal=G.O.A.T, sad=happy";
    styleInput(inputReplacements);
    box.appendChild(inputReplacements);

    // SAVE BUTTON
    const saveBtn = document.createElement("button");
    saveBtn.innerText = "Save All & Reload";
    Object.assign(saveBtn.style, { marginTop: "15px", padding: "10px", width: "100%", backgroundColor: "green", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" });
    
    saveBtn.addEventListener("click", () => {
        buttonWords = inputButtons.value.split(",").map(w => w.trim()).filter(w => w.length > 0);
        localStorage.setItem("my_button_words", JSON.stringify(buttonWords));

        removalList = inputRemovals.value.split(",").map(w => w.trim()).filter(w => w.length > 0);
        localStorage.setItem("my_removals", JSON.stringify(removalList));

        replacementMap = {};
        const rawPairs = inputReplacements.value.split(",");
        rawPairs.forEach(pair => {
            if(pair.includes("=")) {
                const parts = pair.split("=");
                const oldWord = parts[0].trim();
                const newWord = parts[1].trim();
                if(oldWord && newWord) {
                    replacementMap[oldWord] = newWord;
                }
            }
        });
        localStorage.setItem("my_replacements", JSON.stringify(replacementMap));

        document.body.removeChild(overlay);
        createToolbar(); 
    });

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Cancel";
    Object.assign(closeBtn.style, { marginTop: "5px", padding: "5px", width: "100%", backgroundColor: "#ccc", border: "none", cursor: "pointer" });
    closeBtn.addEventListener("click", () => document.body.removeChild(overlay));

    box.appendChild(saveBtn);
    box.appendChild(closeBtn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

// --- HELPERS ---
async function handlePasteLogic(textToPaste) {
    const activeElement = document.activeElement;
    try { await navigator.clipboard.writeText(textToPaste); } catch (err) {}
    if (lastRange) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(lastRange);
    }
    if (activeElement) {
        const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
        pasteEvent.clipboardData.setData('text/plain', textToPaste);
        activeElement.dispatchEvent(pasteEvent);
        setTimeout(() => {
            const sel = window.getSelection();
            if (sel.rangeCount > 0) lastRange = sel.getRangeAt(0).cloneRange();
        }, 50);
    }
}

function styleToolbar(div) {
    Object.assign(div.style, { 
        position: "fixed", top: "50px", left: "50px", backgroundColor: "#222", 
        padding: "10px", borderRadius: "8px", display: "flex", gap: "8px", 
        zIndex: "10000", cursor: "move", userSelect: "none", 
        boxShadow: "0px 4px 10px rgba(0,0,0,0.5)" 
    });
}

function styleButton(btn, bg, color) {
    Object.assign(btn.style, { 
        padding: "6px 12px", cursor: "pointer", fontWeight: "bold", 
        border: "none", borderRadius: "4px", backgroundColor: bg, color: color, 
        fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: "8px"
    });
}

// New function to style the number circle
function styleBadge(span) {
    Object.assign(span.style, {
        display: "inline-flex",
        justifyContent: "center",
        alignItems: "center",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        backgroundColor: "#007bff", // Blue color
        color: "white",
        fontSize: "11px",
        fontWeight: "bold"
    });
}

function styleInput(el) {
    Object.assign(el.style, { width: "100%", height: "60px", marginBottom: "10px", marginTop: "5px", padding: "5px", boxSizing: "border-box" });
}

function createLabel(text) {
    const label = document.createElement("div");
    label.innerText = text;
    label.style.fontWeight = "bold";
    label.style.fontSize = "12px";
    return label;
}

function makeDraggable(element) {
    let isDragging = false, offsetX, offsetY;
    element.addEventListener("mousedown", (e) => {
        if(e.target === element) { isDragging = true; offsetX = e.clientX - element.getBoundingClientRect().left; offsetY = e.clientY - element.getBoundingClientRect().top; }
    });
    document.addEventListener("mousemove", (e) => {
        if (isDragging) { element.style.left = (e.clientX - offsetX) + "px"; element.style.top = (e.clientY - offsetY) + "px"; }
    });
    document.addEventListener("mouseup", () => { isDragging = false; });
}

createToolbar();