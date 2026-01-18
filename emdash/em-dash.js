const editor = document.getElementById("editor");
let isApplying = false;

const inlineRules = [
    { pattern: /\*\*\*([^*]+)\*\*\*/g, replacement: "<strong><em>$1</em></strong>" },
    { pattern: /\*\*([^*]+)\*\*/g, replacement: "<strong>$1</strong>" },
    { pattern: /\*([^*]+)\*/g, replacement: "<em>$1</em>" },
    { pattern: /_([^_]+)_/g, replacement: "<em>$1</em>" }
];

editor.addEventListener("input", (event) => {
    if (isApplying) {
        return;
    }

    if (event.data === " ") {
        if (applyBlockFormatting()) {
            return;
        }
    }

    isApplying = true;
    const marker = insertCaretMarker();
    applyInlineFormatting();
    restoreCaret(marker);
    isApplying = false;
});

function applyBlockFormatting() {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        return false;
    }

    const anchor = selection.anchorNode;
    const block = findBlockElement(anchor);
    if (!block || block === editor) {
        return false;
    }

    const rawText = block.textContent.replace(/\u200B/g, "");
    const headingMatch = rawText.match(/^(#{1,3})\s/);
    const blockquoteMatch = rawText.match(/^>\s/);
    const unorderedMatch = rawText.match(/^-\s/);
    const orderedMatch = rawText.match(/^(\d+)\.\s/);

    if (headingMatch) {
        const level = headingMatch[1].length;
        const content = rawText.slice(level + 1);
        replaceBlock(block, `h${level}`, content);
        return true;
    }

    if (blockquoteMatch) {
        const content = rawText.slice(2);
        replaceBlock(block, "blockquote", content);
        return true;
    }

    if (unorderedMatch) {
        const content = rawText.slice(2);
        replaceWithList(block, "ul", content);
        return true;
    }

    if (orderedMatch) {
        const content = rawText.slice(orderedMatch[0].length);
        replaceWithList(block, "ol", content);
        return true;
    }

    return false;
}

function applyInlineFormatting() {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            if (!node.nodeValue || !node.nodeValue.trim()) {
                return NodeFilter.FILTER_SKIP;
            }
            if (node.parentElement && node.parentElement.closest("strong, em, [data-caret]")) {
                return NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    const textNodes = [];
    while (walker.nextNode()) {
        textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
        const escaped = escapeHtml(node.nodeValue);
        let formatted = escaped;
        inlineRules.forEach((rule) => {
            formatted = formatted.replace(rule.pattern, rule.replacement);
        });

        if (formatted !== escaped) {
            const wrapper = document.createElement("span");
            wrapper.innerHTML = formatted;
            const fragment = document.createDocumentFragment();
            while (wrapper.firstChild) {
                fragment.appendChild(wrapper.firstChild);
            }
            node.replaceWith(fragment);
        }
    });
}

function findBlockElement(node) {
    let current = node;
    while (current && current !== editor) {
        if (current.nodeType === Node.ELEMENT_NODE) {
            const tag = current.tagName.toLowerCase();
            if (["div", "p", "h1", "h2", "h3", "blockquote", "li"].includes(tag)) {
                return current;
            }
        }
        current = current.parentNode;
    }
    return null;
}

function replaceBlock(block, tag, content) {
    const element = document.createElement(tag);
    element.textContent = content;
    block.replaceWith(element);
    placeCaretAtEnd(element);
}

function replaceWithList(block, listTag, content) {
    const parentList = block.parentElement;
    if (block.tagName && block.tagName.toLowerCase() === "li" && parentList && parentList.tagName.toLowerCase() === listTag) {
        block.textContent = content;
        placeCaretAtEnd(block);
        return;
    }

    const list = document.createElement(listTag);
    const item = document.createElement("li");
    item.textContent = content;
    list.appendChild(item);
    block.replaceWith(list);
    placeCaretAtEnd(item);
}

function insertCaretMarker() {
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        return null;
    }
    const range = selection.getRangeAt(0);
    const marker = document.createElement("span");
    marker.setAttribute("data-caret", "true");
    marker.appendChild(document.createTextNode("\u200B"));
    range.insertNode(marker);
    return marker;
}

function restoreCaret(marker) {
    if (!marker || !marker.parentNode) {
        return;
    }
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(marker.firstChild, 1);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    marker.remove();
}

function placeCaretAtEnd(element) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
