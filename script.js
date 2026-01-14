/**
 * MODULE: CONFIGURATION
 * Centralized settings for colors and files.
 */

let RAW_DATA = [];
let CURRENT_VIEW = 'person'; // 'person' or 'category'

const CONFIG = {
    csvFile: '2025_favourites.csv',
colors: {
        // MOONLIT PASTELS (Desaturated & Soft)
        "Alyssa Shaver": "#C8E6C9", // Tea Green
        "Khamil": "#F8BBD0",        // Soft Pink
        "Callum": "#D1C4E9",        // Muted Violet
        "Reid": "#FFF9C4",          // Pale Cream
        "Alex": "#BBDEFB",          // Pale Blue
        "Sisley": "#B2EBF2",        // Soft Cyan
        "Patrick Chin": "#B2DFDB",  // Muted Teal
        "Gabby Bzorek": "#FFCCBC",  // Deep Peach
        "Angela Tollis": "#E1F5FE", // Ice Blue
        "Luciano Abbott": "#CFD8DC",// Blue Grey
        "Avery Cole": "#F0F4C3",    // Lime Cream
        "David Wesley-James": "#F0F4C3",    // Lime Cream
        "Ryan Kasor": "#DCEDC8"     // Moss Mist
    },
    defaultColor: "#eee"
};

/**
 * MODULE: INITIALIZATION
 * Main entry point.
 */
document.addEventListener('DOMContentLoaded', () => {
    Papa.parse(CONFIG.csvFile, {
        download: true, header: false, skipEmptyLines: true,
        complete: handleDataLoad
    });
});

function handleDataLoad(results) {
    RAW_DATA = results.data; // Save data globally

    // 1. Render Hall of Fame (Always visible)
    const topPicks = getTopFavorites(RAW_DATA);
    renderHighlights(topPicks);

    // 2. Render Initial View (Person)
    switchView('person');
}

window.switchView = function(viewType) {
    CURRENT_VIEW = viewType;

    // Update Buttons
    document.getElementById('btn-person').className = viewType === 'person' ? 'toggle-btn active' : 'toggle-btn';
    document.getElementById('btn-category').className = viewType === 'category' ? 'toggle-btn active' : 'toggle-btn';

    // Render appropriate view
    if (viewType === 'person') {
        const grouped = groupDataByName(RAW_DATA);
        renderMainFeed(grouped);
    } else {
        const grouped = groupDataByCategory(RAW_DATA);
        renderCategoryFeed(grouped);
    }
}

function groupDataByCategory(rows) {
    const grouped = {};
    rows.forEach(row => {
        const [name, category, title, note] = row;
        if (!name || name === "Name" || !title) return;

        if (!grouped[category]) grouped[category] = [];
        grouped[category].push({ title, note: note || "", who: name });
    });
    return grouped;
}

// NEW: Render the Category View (With Photo Support)
function renderCategoryFeed(groupedData) {
    const container = document.getElementById('main-feed');

    // 1. Sort categories by weight
    const sortedCategories = Object.keys(groupedData).sort((a, b) => {
        return getCategoryWeight(a) - getCategoryWeight(b);
    });

    const html = sortedCategories.map(category => {
        const rawItems = groupedData[category];
        const [bg, text, border] = getCategoryColorDark(category);
        const icon = getCategoryIcon(category);
        const isPhotoCategory = category.toLowerCase().includes('photo');

        // 2. CONSOLIDATE DUPLICATES (Same logic as before)
        const consolidatedMap = {};
        rawItems.forEach(item => {
            const key = item.title.trim().toLowerCase();
            if (!consolidatedMap[key]) {
                consolidatedMap[key] = {
                    displayTitle: item.title,
                    pickers: [],
                    notes: []
                };
            }
            consolidatedMap[key].pickers.push(item.who);
            if (item.note && item.note.trim() !== "") {
                consolidatedMap[key].notes.push({ who: item.who, text: item.note });
            }
        });
        const items = Object.values(consolidatedMap);

        // 3. SORT ITEMS
        items.sort((a, b) => {
            // Photos: Sort Alphabetical (Filename/Title)
            if (isPhotoCategory) return a.displayTitle.localeCompare(b.displayTitle);
            
            // Standard: Notes Bottom, Popularity Top
            const aHasNotes = a.notes.length > 0;
            const bHasNotes = b.notes.length > 0;
            if (aHasNotes && !bHasNotes) return 1;
            if (!aHasNotes && bHasNotes) return -1;
            if (a.pickers.length !== b.pickers.length) return b.pickers.length - a.pickers.length;
            return a.displayTitle.localeCompare(b.displayTitle);
        });

        // 4. GENERATE HTML
        let contentHtml = "";

        if (isPhotoCategory) {
            // --- RENDER AS PHOTO GALLERY ---
            const photos = items.map(item => {
                const isImageFile = item.displayTitle.match(/\.(jpeg|jpg|gif|png)$/i);
                
                // 1. Generate Tags (Who submitted this?)
                const tagsHtml = item.pickers.map(personName => {
                    let pickerColor = CONFIG.defaultColor;
                    const configName = Object.keys(CONFIG.colors).find(key => personName.includes(key));
                    if (configName) pickerColor = CONFIG.colors[configName];
                    return `<span class="picker-tag" style="background:${pickerColor};">${personName}</span>`;
                }).join('');

                // 2. Generate Caption (Notes + Tags)
                const notesHtml = item.notes.map(n => `<div>"${n.text}"</div>`).join('');
                const captionHtml = `
                    <div class="photo-caption">
                        <div style="margin-bottom:10px;">${tagsHtml}</div>
                        ${notesHtml ? `<div style="margin-bottom:5px;">${notesHtml}</div>` : ''}
                        ${!isImageFile ? `<div>${item.displayTitle}</div>` : ''} 
                    </div>`;

                // 3. Render Image
                const visualContent = isImageFile 
                    ? `<img src="photos/${item.displayTitle}" alt="Photo" class="photo-img" onclick="openLightbox(this.src)">`
                    : `<div class="photo-placeholder"><span>${item.displayTitle}</span></div>`;

                return `
                    <div class="photo-card">
                        <div class="photo-frame">
                            ${visualContent}
                        </div>
                        ${captionHtml}
                    </div>
                `;
            }).join('');
            
            // Wrap in the photo grid container
            contentHtml = `<div class="photo-section" style="border:none;"><div class="photo-grid">${photos}</div></div>`;

        } else {
            // --- RENDER AS STANDARD LIST ---
            contentHtml = `<div class="detailed-list">` + items.map(item => {
                const tagsHtml = item.pickers.map(personName => {
                    let pickerColor = CONFIG.defaultColor;
                    const configName = Object.keys(CONFIG.colors).find(key => personName.includes(key));
                    if (configName) pickerColor = CONFIG.colors[configName];
                    return `<span class="picker-tag" style="background:${pickerColor};">${personName}</span>`;
                }).join('');

                const notesHtml = item.notes.map(noteObj => 
                    `<div class="note" style="margin-top:8px;">
                        <strong>${noteObj.who}:</strong> "${noteObj.text}"
                    </div>`
                ).join('');

                return `
                <div class="item-row ${item.notes.length > 0 ? 'detailed' : ''}">
                    <div class="row-content">
                        <div class="title" style="line-height: 1.8;">
                            ${item.displayTitle} 
                            ${tagsHtml}
                        </div>
                        ${notesHtml}
                    </div>
                </div>`;
            }).join('') + `</div>`;
        }

        return `
            <div class="friend-section">
                <div class="friend-header" style="background-color: ${bg}; color: #000;">
                    ${icon} &nbsp; ${category}
                </div>
                <div class="friend-body">
                    ${contentHtml}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = html;
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
// Renders the main list of friends, SORTED by content density
function renderMainFeed(groupedData) {
    const container = document.getElementById('main-feed');
    
    // 1. Convert Object to Array so we can sort it
    const friendsList = Object.keys(groupedData).map(name => {
        const categoriesObj = groupedData[name];
        
        // Calculate stats for sorting
        let totalCount = 0;
        let noteCount = 0;
        
        Object.values(categoriesObj).forEach(items => {
            totalCount += items.length;
            items.forEach(item => {
                if (item.note && item.note.trim() !== "") {
                    noteCount++;
                }
            });
        });

        return { name, categoriesObj, totalCount, noteCount };
    });

    // 2. SORTING LOGIC
    // Primary: Fewest notes first
    // Secondary: Fewest total items first
    friendsList.sort((a, b) => {
        if (a.noteCount !== b.noteCount) {
            return a.noteCount - b.noteCount; 
        }
        return a.totalCount - b.totalCount;
    });

    // 3. RENDER
    const html = friendsList.map(friend => {
        const { name, categoriesObj } = friend;
        
        // Fuzzy match for color
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

function getCategoryWeight(category) {
    const c = category.toLowerCase();
    if (c.includes('movie')) return 1;
    if (c.includes('tv') || c.includes('show') || c.includes('anime')) return 2;
    if (c.includes('book')) return 3;
    if (c.includes('album')) return 5;
    if (c.includes('song')) return 6;
    if (c.includes('artist')) return 7;
    if (c.includes('concert')) return 8;
    if (c.includes('game')) return 9;
    if (c.includes('photo')) return 11;
    return 99; // Everything else (e.g. "Other") goes to the end
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
    if (c.includes('concert')) return '🏟️';
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

function getCategoryColorDark(category) {
    const c = category.toLowerCase();
    
    // MOONLIT SATURATION (Level 200 Pastels)
    // [Background, Text, Border]
    
    // Concerts/Live: Soft Rose
    if (c.includes('concert') || c.includes('live')) 
        return ["#F48FB1", "#880E4F", "#F06292"]; 
    
    // Bands: Deep Lavender
    if (c.includes('band')) 
        return ["#B39DDB", "#4527A0", "#9575CD"]; 

    // Movies: Sky Blue (Fixed: No longer too light)
    if (c.includes("movie")) 
        return ["#81D4FA", "#01579B", "#4FC3F7"]; 
    
    // TV: Sage Green
    if (c.includes("tv")) 
        return ["#A5D6A7", "#1B5E20", "#81C784"];    
    
    // Books: Sunset Orange
    if (c.includes("book")) 
        return ["#FFCC80", "#E65100", "#FFB74D"];   
    
    // Music: Orchid Purple
    if (c.includes("song") || c.includes("music")) 
        return ["#CE93D8", "#4A148C", "#BA68C8"]; 
    
    // Games: Blue-Grey Stone
    if (c.includes("game")) 
        return ["#B0BEC5", "#263238", "#90A4AE"];   
    
    // Photos: Coral
    if (c.includes("photo")) 
        return ["#FFAB91", "#BF360C", "#FF8A65"];  
    
    // Default: Neutral Grey
    return ["#EEEEEE", "#212121", "#BDBDBD"];
}
// UPDATED: Renders content split by Type (Simple vs Detailed) rather than Category
function renderCategoryList(categoriesObj) {
    let allSimpleItems = [];
    let allDetailedItems = [];
    let allPhotoItems = [];

    // 1. Flatten and Split Data
    Object.keys(categoriesObj).forEach(category => {
        const items = categoriesObj[category];
        
        items.forEach(item => {
            const itemWithCat = { ...item, category };
            const isPhoto = category.toLowerCase().includes('photo');

            if (isPhoto) {
                // PHOTOS: Always go to the special photo array
                allPhotoItems.push(itemWithCat);
            } else if (!item.note || item.note.trim() === "") {
                // SIMPLE: No note, not a photo
                allSimpleItems.push(itemWithCat);
            } else {
                // DETAILED: Has note, not a photo
                allDetailedItems.push(itemWithCat);
            }
        });
    });

    // 2. SORTING (Apply the same sort logic as before)
    const sortFn = (a, b) => {
        const wA = getCategoryWeight(a.category);
        const wB = getCategoryWeight(b.category);
        if (wA !== wB) return wA - wB;
        return a.title.localeCompare(b.title);
    };

    allSimpleItems.sort(sortFn);
    allDetailedItems.sort(sortFn);
    // Photos don't need category sort usually, but we can sort by title
    allPhotoItems.sort((a, b) => a.title.localeCompare(b.title));

    let html = "";

    // 3. RENDER PILL CLOUD
    if (allSimpleItems.length > 0) {
        const pills = allSimpleItems.map(item => {
            const icon = getCategoryIcon(item.category);
            const [bg, text, border] = getCategoryColor(item.category);
            
            return `<span class="simple-pill" 
                          title="${item.category}" 
                          style="background-color: ${bg}; color: ${text}; border-color: ${border};">
                <span class="pill-icon">${icon}</span> ${item.title}
            </span>`;
        }).join('');
        
        html += `<div class="pill-cloud">${pills}</div>`;
    }

    // 4. RENDER DETAILED ROWS
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

    // 5. RENDER PHOTO CARDS (New Section)
    if (allPhotoItems.length > 0) {
        const photos = allPhotoItems.map(item => {
            // Check if title looks like a file path
            const isImageFile = item.title.match(/\.(jpeg|jpg|gif|png)$/i);
            
            // Render Image or Text Placeholder
            const visualContent = isImageFile 
                ? `<img src="photos/${item.title}" alt="Photo" class="photo-img" onclick="openLightbox(this.src)">`
                : `<div class="photo-placeholder"><span>${item.title}</span></div>`;
            
            const noteHtml = item.note ? `<div class="photo-caption">${item.note}</div>` : '';            return `
                <div class="photo-card">
                    <div class="photo-frame">
                        ${visualContent}
                    </div>
                    ${noteHtml}
                </div>
            `;
        }).join('');

        // Add a header/divider for the photos
        html += `
            <div class="photo-section">
                <div class="photo-grid">${photos}</div>
            </div>
        `;
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