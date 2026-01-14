// CONFIGURATION
const csvFile = '2025_favourites.csv'; 

// The Palette
const colorMap = {
    "Alyssa Shaver": "#E1EAD1", // Sage
    "Khamil": "#F4E1E1",        // Rose
    "Callum": "#E1E7F0",        // Steel
    "Reid": "#F9F1D0",          // Gold
    "Alex": "#E8E1F4",          // Lavender
    "Sisley": "#FCEAD5",        // Peach
    "Patrick Chin": "#DDF2EB",  // Mint
    "Gabby Bzorek": "#F2D8C9",  // Terracotta
    "Angela Tollis": "#D6EAF8", // Sky
    "Luciano Abbott": "#E5E7E9",// Slate
    "Avery Cole": "#F5E8C7",    // Dusty Gold
    "Ryan Kasor": "#D9E3D0"     // Zen Green
};

// INITIALIZATION
// We use PapaParse to fetch and read the CSV file
Papa.parse(csvFile, {
    download: true,
    header: false,
    skipEmptyLines: true,
    complete: function(results) {
        // Hide loading spinner
        const loader = document.getElementById('loading');
        if(loader) loader.style.display = 'none';
        
        // Start processing
        processData(results.data);
    },
    error: function(err) {
        console.error("Error parsing CSV:", err);
        document.getElementById('loading').textContent = "Error loading data. Check console.";
    }
});

function processData(rows) {
    const groupedData = {};

    rows.forEach(row => {
        // CSV Structure: [0] Name, [1] Category, [2] Title, [3] Note
        const name = row[0];
        const category = row[1];
        const title = row[2];
        const note = row[3] || "";

        // Skip header row if it exists or invalid rows
        if (!name || name === "Name") return;

        // Create array for person if not exists
        if (!groupedData[name]) groupedData[name] = [];
        
        // Add item
        groupedData[name].push({ category, title, note });
    });

    renderPage(groupedData);
}

function renderPage(data) {
    const container = document.getElementById('main-feed');
    
    // Iterate through each friend in the data object
    Object.keys(data).forEach(name => {
        const items = data[name];
        const headerColor = colorMap[name] || "#eee"; // Fallback color

        // Generate HTML for the list items
        const itemsHtml = items.map(item => `
            <div class="item-row">
                <div>${getPill(item.category)}</div>
                <div class="title">${item.title}</div>
                <div class="note">${item.note}</div>
            </div>
        `).join('');

        // Create the Friend Card Section
        const section = document.createElement('div');
        section.className = 'friend-section';
        section.innerHTML = `
            <div class="friend-header" style="background-color: ${headerColor};">
                ${name}
            </div>
            <div>${itemsHtml}</div>
        `;
        
        // Append to page
        container.appendChild(section);
    });
}

function getPill(cat) {
    // Styling logic for the pills
    let bg = "#eee", text = "#555";
    
    // Normalize category string
    const c = cat ? cat.toLowerCase() : "";

    if (c.includes("movie")) { bg = "#E3F2FD"; text = "#1565C0"; }
    else if (c.includes("tv")) { bg = "#E8F5E9"; text = "#2E7D32"; }
    else if (c.includes("book")) { bg = "#FFF3E0"; text = "#EF6C00"; }
    else if (c.includes("song") || c.includes("album") || c.includes("artist")) { bg = "#F3E5F5"; text = "#7B1FA2"; }
    else if (c.includes("game")) { bg = "#ECEFF1"; text = "#455A64"; }
    else if (c.includes("photo")) { bg = "#FFE0B2"; text = "#E65100"; }

    return `<span class="pill" style="background:${bg}; color:${text};">${cat}</span>`;
}