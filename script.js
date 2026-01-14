/**
 * MODULE: CONFIGURATION
 * Centralized settings for colors and files.
 */
const CONFIG = {
    csvFile: '2025_favourites.csv',
    colors: {
        "Alyssa Shaver": "#E1EAD1", // Sage
        "Khamil Alhade": "#F4E1E1",        // Rose
        "Callum Summers": "#E1E7F0",        // Steel
        "Reid McLaughlin": "#F9F1D0",          // Gold
        "Alex Sutherland": "#E8E1F4",          // Lavender
        "Sisley Comish": "#FCEAD5",        // Peach
        "Patrick Chin": "#DDF2EB",  // Mint
        "Gabby Bzorek": "#F2D8C9",  // Terracotta
        "Angela Tollis": "#D6EAF8", // Sky
        "Luciano Abbott": "#E5E7E9",// Slate
        "Avery Cole": "#F5E8C7",    // Dusty Gold
        "Ryan Kasor": "#D9E3D0"     // Zen Green
    },
    defaultColor: "#eee"
};

/**
 * MODULE: INITIALIZATION
 * Main entry point.
 */
document.addEventListener('DOMContentLoaded', () => {
    Papa.parse(CONFIG.csvFile, {
        download: true,
        header: false,
        skipEmptyLines: true,
        complete: handleDataLoad,
        error: (err) => console.error("Error parsing CSV:", err)
    });
});

function handleDataLoad(results) {
    const loader = document.getElementById('loading');
    if (loader) loader.style.display = 'none';

    const rawRows = results.data;

    // 1. Calculate and Render Community Highlights
    const topPicks = getTopFavorites(rawRows);
    renderHighlights(topPicks);

    // 2. Group and Render Main Feed
    const groupedData = groupDataByName(rawRows);
    renderMainFeed(groupedData);
}

/**
 * MODULE: DATA PROCESSING
 * Functions that manipulate raw data but don't touch the DOM.
 */

// Transforms raw CSV rows into an Object grouped by Name -> Category
function groupDataByName(rows) {
    const grouped = {};

    rows.forEach(row => {
        // CSV: [0] Name, [1] Category, [2] Title, [3] Note
        const [name, category, title, note] = row;

        if (!name || name === "Name" || !title) return;

        if (!grouped[name]) grouped[name] = {};
        if (!grouped[name][category]) grouped[name][category] = [];

        grouped[name][category].push({ title, note: note || "" });
    });

    return grouped;
}

// Calculates the most frequently mentioned titles
function getTopFavorites(rows) {
    const counts = {};

    rows.forEach(row => {
        const [_, category, title] = row;
        if (!title || title === "Item" || title === "Name") return;

        // Normalize title (remove "Season 1", lowercase, etc)
        const cleanTitle = title.toLowerCase()
            .split(' s')[0]
            .split(' season')[0]
            .trim();

        if (!counts[cleanTitle]) {
            counts[cleanTitle] = { 
                displayTitle: title, 
                count: 0, 
                category: category 
            };
        }
        counts[cleanTitle].count++;
    });

    return Object.values(counts)
        .filter(item => item.count > 1)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3); // Top 4 only
}

/**
 * MODULE: UI RENDERING
 * Functions that generate HTML and update the DOM.
 */

// Renders the leaderboard cards
function renderHighlights(items) {
    const container = document.getElementById('highlight-cards');
    
    // IMAGE MAPPING: Associates titles with filenames
    // Note: The keys must match the "clean" title logic (lowercase, no season info)
    const imageMap = {
        "weapons": "images/weapons.jpg",
        "andor": "images/andor.jpg",
        "the pitt": "images/pitt.jpg"
    };

    container.innerHTML = items.map(item => {
        // Find the image based on the cleaned title (from getTopFavorites)
        // If we can't find one, we use a gray placeholder.
        const cleanKey = item.displayTitle.toLowerCase().split(' s')[0].trim();
        const imageFile = imageMap[cleanKey];
        
        const imageHtml = imageFile 
            ? `<img src="${imageFile}" class="card-image" alt="${item.displayTitle}">`
            : `<div class="card-image" style="display:flex;align-items:center;justify-content:center;color:#ccc;">No Image</div>`;

        return `
        <div class="highlight-card">
            <div class="card-image-container">
                ${imageHtml}
            </div>
            <div class="card-content">
                <span class="title">${item.displayTitle}</span>
                <div>${createCategoryBadge(item.category)}</div>
            </div>
        </div>
        `;
    }).join('');
}

// Renders the main list of friends
function renderMainFeed(groupedData) {
    const container = document.getElementById('main-feed');
    
    const html = Object.keys(groupedData).map(name => {
        const categoriesObj = groupedData[name];
        
        // FIX: Fuzzy match the name to find the color
        // (Finds "Callum" color even if CSV says "Callum Summers")
        let headerColor = CONFIG.defaultColor;
        const configName = Object.keys(CONFIG.colors).find(key => name.includes(key));
        if (configName) {
            headerColor = CONFIG.colors[configName];
        }

        return `
            <div class="friend-section">
                <div class="friend-header" style="background-color: ${headerColor};">
                    ${name}
                </div>
                <div class="friend-body">
                    ${renderCategoryList(categoriesObj)}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
}

function getCategoryIcon(category) {
    const c = category.toLowerCase();
    if (c.includes('movie')) return '🎬';
    if (c.includes('tv')) return '📺';
    if (c.includes('book')) return '📚';
    if (c.includes('song') || c.includes('music')) return '🎵';
    if (c.includes('album')) return '💿';
    if (c.includes('artist')) return '🎤';
    if (c.includes('game')) return '🎮';
    if (c.includes('photo')) return '📸';
    return '🔹';
}

function getCategoryColor(category) {
    const c = category.toLowerCase();
    // Returns: [Background, Text, Border/Hover]
    if (c.includes("movie")) return ["#E3F2FD", "#1565C0", "#90CAF9"]; 
    if (c.includes("tv")) return ["#E8F5E9", "#2E7D32", "#A5D6A7"];
    if (c.includes("book")) return ["#FFF3E0", "#EF6C00", "#FFCC80"];
    if (c.includes("song") || c.includes("music") || c.includes("artist") || c.includes("album")) return ["#F3E5F5", "#7B1FA2", "#CE93D8"];
    if (c.includes("game")) return ["#ECEFF1", "#455A64", "#B0BEC5"];
    if (c.includes("photo")) return ["#FFE0B2", "#E65100", "#FFCC80"];
    
    // Default (Grey)
    return ["#F5F5F5", "#444", "#E0E0E0"];
}

// UPDATED: Renders content split by Type (Simple vs Detailed) rather than Category
function renderCategoryList(categoriesObj) {
    let allSimpleItems = [];
    let allDetailedItems = [];

    // 1. Flatten the data
    Object.keys(categoriesObj).forEach(category => {
        const items = categoriesObj[category];
        items.forEach(item => {
            const itemWithCat = { ...item, category };
            if (!item.note || item.note.trim() === "") {
                allSimpleItems.push(itemWithCat);
            } else {
                allDetailedItems.push(itemWithCat);
            }
        });
    });

    let html = "";

    // 2. RENDER THE UNIFIED CLOUD (Colored & Bigger)
    if (allSimpleItems.length > 0) {
        const pills = allSimpleItems.map(item => {
            const icon = getCategoryIcon(item.category);
            const [bg, text, border] = getCategoryColor(item.category);
            
            // Inject colors directly into the span
            return `<span class="simple-pill" 
                          title="${item.category}" 
                          style="background-color: ${bg}; color: ${text}; border-color: ${border};">
                <span class="pill-icon">${icon}</span> ${item.title}
            </span>`;
        }).join('');
        
        html += `<div class="pill-cloud">${pills}</div>`;
    }

    // 3. RENDER THE DETAILED ROWS
    if (allDetailedItems.length > 0) {
        const rows = allDetailedItems.map(item => {
            const icon = getCategoryIcon(item.category);
            return `
                <div class="item-row detailed">
                    <div class="row-icon">${icon}</div>
                    <div class="row-content">
                        <div class="title">${item.title}</div>
                        <div class="note">"${item.note}"</div>
                    </div>
                </div>
            `;
        }).join('');
        
        const borderClass = allSimpleItems.length > 0 ? "border-top" : "";
        html += `<div class="detailed-list ${borderClass}">${rows}</div>`;
    }

    return html;
}

// Helper for the colored category pills
function createCategoryBadge(category) {
    const c = category ? category.toLowerCase() : "";
    let bg = "#eee", text = "#555";

    if (c.includes("movie")) { bg = "#E3F2FD"; text = "#1565C0"; }
    else if (c.includes("tv")) { bg = "#E8F5E9"; text = "#2E7D32"; }
    else if (c.includes("book")) { bg = "#FFF3E0"; text = "#EF6C00"; }
    else if (c.includes("song") || c.includes("album") || c.includes("artist")) { bg = "#F3E5F5"; text = "#7B1FA2"; }
    else if (c.includes("game")) { bg = "#ECEFF1"; text = "#455A64"; }
    else if (c.includes("photo")) { bg = "#FFE0B2"; text = "#E65100"; }

    return `<span class="pill" style="background:${bg}; color:${text};">${category}</span>`;
}