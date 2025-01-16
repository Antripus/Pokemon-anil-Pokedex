// Rutas de los archivos JSON
const jsonPathPokemon = "./data/Opalo/pokemon.json";
const jsonPathEncuentros = "./data/Opalo/encounters.json";
const jsonPathCoordinates = "./data/Opalo/coordinates.json";

// Elementos del DOM
const zonaSelect = document.getElementById("zona-select");
const encountersList = document.getElementById("encounters-list");
const zoneMarker = document.getElementById("zone-marker");
const searchBar = document.getElementById("search-bar"); 

// Coordenadas del mapa (basadas en los números de las zonas)
let zoneCoordinates = {};

// Función para cargar el archivo `pokemon.json`
async function loadPokemon() {
    try {
        const response = await fetch(jsonPathPokemon);
        const pokemonData = await response.json();
        sessionStorage.setItem("pokemonData", JSON.stringify(pokemonData)); // Guarda en sessionStorage
    } catch (error) {
        console.error("Error loading Pokémon data:", error);
    }
}

// Función para cargar el archivo `encounters.json`
async function loadEncuentros() {
    try {
        const response = await fetch(jsonPathEncuentros);
        const encuentrosData = await response.json();
        sessionStorage.setItem("encuentrosData", JSON.stringify(encuentrosData)); // Guarda en sessionStorage
    } catch (error) {
        console.error("Error loading Encounters data:", error);
    }
}

// 1. Función para cargar coordenadas desde JSON
async function loadCoordinates() {
    try {
        const response = await fetch(jsonPathCoordinates);
        zoneCoordinates = await response.json();
    } catch (error) {
        console.error("Error loading coordinates data:", error);
    }
}

// 3. Función para poblar el `<select>` de zonas con los números de zona
function populateZonaSelect(encuentrosData, pokemonData) {
    zonaSelect.innerHTML = encuentrosData
        .map(
            (zona) =>
                `<option value="${zona.nro_zona}">${zona.nombre_zona} (NroZona: ${zona.nro_zona})</option>`
        )
        .join("");

    if (encuentrosData.length > 0) {
        const defaultZona = encuentrosData[0];
        displayEncounters(defaultZona, pokemonData);
        updateZoneMarker(defaultZona.nro_zona);
    }
}

// Función para filtrar las opciones de la barra de búsqueda
function filterZonaOptions(query, encuentrosData) {
    const filtered = encuentrosData.filter((zona) =>
        zona.nombre_zona.toLowerCase().includes(query.toLowerCase())
    );
    populateZonaSelect(filtered);
}

// Función para buscar un Pokémon por nombre en pokemonData
function findPokemonByName(name, pokemonData) {
    return pokemonData.find(pokemon => pokemon.internal_name.toLowerCase() === name.toLowerCase());
}

// 4. Función para mostrar los encuentros de una zona específica
function displayEncounters(zona, pokemonData) {
    const typeIcons = {
        Land: './images/land3.png',
        Water: './images/water2.png',
        OldRod: './images/rod2.png',
        SuperRod: './images/rod2.png',
    };
    const typeDefinition = {
        Land: 'Hierba / Cueva',
        Water: 'Agua',
        OldRod: 'Old Rod',
        SuperRod: 'Super Rod',
    };

    if (!zona.encounters) {
        console.error("No encounters found for the selected zone:", zona);
        return;
    }

    const encounterTypes = Object.keys(zona.encounters);

    encountersList.innerHTML = encounterTypes
        .map((type) => {
            const encounters = zona.encounters[type]
            .map((enc) => {
                // Buscar información del Pokémon usando findPokemonByName
                const pokemon = findPokemonByName(enc.pokemon, pokemonData);
                if (!pokemon) {
                    console.warn(`Pokémon ${enc.pokemon} not found in pokemonData.`);
                }

                const pokemonImage = pokemon
                    ? `./images/Opalo/pokemon/${pokemon.number000}.png`
                    : './images/Opalo/pokemon/000.png'; // Imagen predeterminada si no se encuentra el Pokémon

                return `
                <div class="encounter-card">
                    <h3>${pokemon.name}</h3>
                    
                    <a href="/Opalo-pokemon-details.html?name=${enc.pokemon.toLowerCase()}">
                        <img src="${pokemonImage}" alt="${enc.pokemon.toLowerCase()}">
                    </a>
                    
                    <p>Nivel: ${enc.min_level} - ${enc.max_level}</p>
                </div>
                `;
            })
            .join("");

            const icon = typeIcons[type] || '';
            const definition = typeDefinition[type] || '';

            return `
                <div class="encounter-group">
                    <div class="tipoEncuentro">
                        <h2><img src="${icon}" alt="${type}" class="icon">${definition}</h2>
                    </div>
                    <div class="encounters">${encounters}</div>
                </div>
            `;
        })
        .join("");
}

// 5. Función para actualizar el marcador en el mapa
function updateZoneMarker(zoneNumber) {
    console.log("Updating marker for zone:", zoneNumber);
    const zone = zoneCoordinates[zoneNumber];
    if (zone) {
        zoneMarker.style.left = `${zone.x}px`;
        zoneMarker.style.top = `${zone.y}px`;
        zoneMarker.style.display = "block";
    } else {
        console.warn(`No coordinates found for zone: ${zoneNumber}`);
        zoneMarker.style.display = "none";
    }
}

// 6. Función para inicializar el marcador y cargar datos iniciales
function initializeZoneMarker(encuentrosData, pokemonData) {
    populateZonaSelect(encuentrosData, pokemonData);

    const defaultZonaId = encuentrosData[0]?.nro_zona || Object.keys(zoneCoordinates)[0];
    if (defaultZonaId) {
        updateZoneMarker(defaultZonaId);
    } else {
        console.error("No default zone ID found to initialize the marker.");
    }
}

// 7. Función principal para inicializar la aplicación
async function init() {
    await loadPokemon();
    await loadEncuentros();
    await loadCoordinates();

    const encuentrosData = JSON.parse(sessionStorage.getItem("encuentrosData"));
    const pokemonData = JSON.parse(sessionStorage.getItem("pokemonData"));
    if (encuentrosData) {
        initializeZoneMarker(encuentrosData, pokemonData);

        // Conectar la barra de búsqueda
        searchBar.addEventListener("input", (e) => {
            const query = e.target.value;
            filterZonaOptions(query, encuentrosData);
        });
    } else {
        console.error("No encounters data found in sessionStorage.");
    }
}

// 8. Eventos
zonaSelect.addEventListener("change", () => {
    const selectedZonaNumber = zonaSelect.value;
    const encuentrosData = JSON.parse(sessionStorage.getItem("encuentrosData"));
    const pokemonData = JSON.parse(sessionStorage.getItem("pokemonData"));
    const selectedZona = encuentrosData.find(
        (zona) => zona.nro_zona === selectedZonaNumber
    );

    if (selectedZona) {
        displayEncounters(selectedZona, pokemonData);
        updateZoneMarker(selectedZonaNumber);
    } else {
        console.error("Selected zone not found:", selectedZonaNumber);
    }
});

document.addEventListener("DOMContentLoaded", init);