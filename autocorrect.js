// --- LISTENER: Alt + Backtick (`) ---
document.addEventListener("keydown", async function(e) {
    if (e.altKey && e.key === "`") {
        e.preventDefault(); 
        e.stopPropagation();
        await performAutoCorrect();
    }
}); 

// Comment

async function performAutoCorrect() {
    const activeElement = document.activeElement;
    
    // 1. SAFETY CHECKS
    if (!activeElement) return;
    const isInput = activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA";
    if (!isInput && !activeElement.isContentEditable) return;

    // 2. LOAD SETTINGS (Every time you press the key, so it's always fresh)
    
    // Load "Removals" (Default to empty if nothing saved)
    const savedRemovals = localStorage.getItem("my_removals");
    const removals = savedRemovals ? JSON.parse(savedRemovals) : [];

    // Load "Replacements" (Default to empty if nothing saved)
    const savedReplacements = localStorage.getItem("my_replacements");
    const replacements = savedReplacements ? JSON.parse(savedReplacements) : {"Nuhal": "G.O.A.T"};


    // 3. FLASH EFFECT
    const originalBg = activeElement.style.backgroundColor;
    activeElement.style.backgroundColor = "#fffacd"; 

    // 4. READ TEXT
    let currentText = "";
    if (isInput) {
        currentText = activeElement.value;
    } else {
        currentText = activeElement.innerText; 
    }

    let newText = currentText;
    let hasChanges = false;

    // 5. APPLY REMOVALS (Step A: Delete words)
    // We replace the word with an empty string ""
    removals.forEach(wordToRemove => {
        if (newText.includes(wordToRemove)) {
            // Split and Join removes all instances of the word
            newText = newText.split(wordToRemove).join("");
            hasChanges = true;
        }
    });

    // 6. APPLY REPLACEMENTS (Step B: Swap words)
    for (const [original, replacement] of Object.entries(replacements)) {
        if (newText.includes(original)) {
            newText = newText.split(original).join(replacement);
            hasChanges = true;
        }
    }

    // If no changes needed, stop
    if (!hasChanges) {
        setTimeout(() => activeElement.style.backgroundColor = originalBg, 200);
        return;
    }

    // 7. COPY NEW TEXT TO CLIPBOARD
    try {
        await navigator.clipboard.writeText(newText);
    } catch (err) {
        console.error("Clipboard Error:", err);
        activeElement.style.backgroundColor = originalBg;
        return;
    }

    // 8. SELECT ALL (Hard Selection)
    if (isInput) {
        activeElement.select();
    } else {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(activeElement);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    await new Promise(resolve => setTimeout(resolve, 10));

    // 9. PASTE
    const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer()
    });
    pasteEvent.clipboardData.setData('text/plain', newText);
    activeElement.dispatchEvent(pasteEvent);

    // 10. CLEANUP
    setTimeout(() => {
        activeElement.style.backgroundColor = originalBg;
    }, 200);
}