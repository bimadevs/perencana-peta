/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Fix: Declare google to resolve 'Cannot find name 'google'' errors throughout the file.
declare const google: any;

import {FunctionDeclaration, GoogleGenAI, Type} from '@google/genai';

// Application state variables
let map; // Holds the Google Map instance
let points = []; // Array to store geographical points from responses
let markers = []; // Array to store map markers
let lines = []; // Array to store polylines representing routes/connections
let popUps = []; // Array to store custom popups for locations
let bounds; // Google Maps LatLngBounds object to fit map around points
let activeCardIndex = 0; // Index of the currently selected location card
let isPlannerMode = false; // Flag to indicate if Day Planner mode is active
let dayPlanItinerary = []; // Array to hold structured items for the day plan timeline
let mapLoaderCount = 0; // Counter for managing map loader visibility

// Google Maps API variables - will be initialized asynchronously
let Map, LatLngBounds, AdvancedMarkerElement;

// DOM Element references
const generateButton = document.querySelector('#generate');
const resetButton = document.querySelector('#reset');
const cardContainer = document.querySelector(
  '#card-container',
) as HTMLDivElement;
const carouselIndicators = document.querySelector(
  '#carousel-indicators',
) as HTMLDivElement;
const prevCardButton = document.querySelector(
  '#prev-card',
) as HTMLButtonElement;
const nextCardButton = document.querySelector(
  '#next-card',
) as HTMLButtonElement;
const cardCarousel = document.querySelector('.card-carousel') as HTMLDivElement;
const plannerModeToggle = document.querySelector(
  '#planner-mode-toggle',
) as HTMLInputElement;
const timelineContainer = document.querySelector(
  '#timeline-container',
) as HTMLDivElement;
const timeline = document.querySelector('#timeline') as HTMLDivElement;
const closeTimelineButton = document.querySelector(
  '#close-timeline',
) as HTMLButtonElement;
const exportPlanButton = document.querySelector(
  '#export-plan',
) as HTMLButtonElement;
const mapContainer = document.querySelector('#map-container');
const timelineToggle = document.querySelector('#timeline-toggle');
const mapOverlay = document.querySelector('#map-overlay');
const mapLoader = document.querySelector('#map-loader') as HTMLDivElement;
const errorMessage = document.querySelector('#error-message');

// --- Map Loader Functions ---
// Shows the map loader overlay. Uses a counter to handle multiple concurrent loading states.
function showMapLoader() {
  mapLoaderCount++;
  if (mapLoader) mapLoader.classList.remove('hidden');
}

// Hides the map loader overlay. Hides only when the counter reaches zero.
function hideMapLoader() {
  mapLoaderCount--;
  if (mapLoaderCount <= 0) {
    if (mapLoader) mapLoader.classList.add('hidden');
    mapLoaderCount = 0; // Reset in case it goes negative
  }
}
// --- End Map Loader Functions ---

// --- Tutorial Functions ---
const tutorialOverlay = document.querySelector('#tutorial-overlay') as HTMLDivElement;
const tutorialSteps = document.querySelectorAll('.tutorial-step');
const tutorialPrevBtn = document.querySelector('#tutorial-prev') as HTMLButtonElement;
const tutorialNextBtn = document.querySelector('#tutorial-next') as HTMLButtonElement;
const tutorialFinishBtn = document.querySelector('#tutorial-finish') as HTMLButtonElement;
const tutorialSkipBtn = document.querySelector('#tutorial-skip') as HTMLButtonElement;
const tutorialDotsContainer = document.querySelector('#tutorial-dots') as HTMLDivElement;
let currentTutorialStep = 0;
const totalTutorialSteps = tutorialSteps.length;

function setupTutorial() {
  // Check if tutorial has been completed
  if (localStorage.getItem('tutorialCompleted')) {
    return;
  }

  // Create dots
  for (let i = 0; i < totalTutorialSteps; i++) {
    const dot = document.createElement('div');
    dot.classList.add('tutorial-dot');
    dot.dataset.index = i.toString();
    tutorialDotsContainer.appendChild(dot);
  }

  tutorialNextBtn.addEventListener('click', () => navigateTutorial(1));
  tutorialPrevBtn.addEventListener('click', () => navigateTutorial(-1));
  tutorialFinishBtn.addEventListener('click', hideTutorial);
  tutorialSkipBtn.addEventListener('click', hideTutorial);

  showTutorial();
}

function showTutorial() {
  tutorialOverlay.classList.remove('hidden');
  updateTutorialView();
}

function hideTutorial() {
  tutorialOverlay.classList.add('hidden');
  localStorage.setItem('tutorialCompleted', 'true');
}

function navigateTutorial(direction: number) {
  currentTutorialStep += direction;
  updateTutorialView();
}

function updateTutorialView() {
  tutorialSteps.forEach((step, index) => {
    step.classList.toggle('active', index === currentTutorialStep);
  });
  
  const dots = tutorialDotsContainer.querySelectorAll('.tutorial-dot');
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentTutorialStep);
  });

  tutorialPrevBtn.style.visibility = currentTutorialStep === 0 ? 'hidden' : 'visible';
  
  if (currentTutorialStep === totalTutorialSteps - 1) {
    tutorialNextBtn.classList.add('hidden');
    tutorialFinishBtn.classList.remove('hidden');
  } else {
    tutorialNextBtn.classList.remove('hidden');
    tutorialFinishBtn.classList.add('hidden');
  }
}
// --- End Tutorial Functions ---


// Initializes the Google Map instance and necessary libraries.
async function initMap() {
  showMapLoader();

  // Initialize Google Maps libraries asynchronously
  try {
    const mapsLibrary = await google.maps.importLibrary('maps');
    const coreLibrary = await google.maps.importLibrary('core');
    const markerLibrary = await google.maps.importLibrary('marker');

    // Assign to global variables for use throughout the app
    Map = mapsLibrary.Map;
    LatLngBounds = coreLibrary.LatLngBounds;
    AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement;

    bounds = new LatLngBounds();
  } catch (error) {
    console.error('Failed to load Google Maps libraries:', error);
    hideMapLoader();
    return;
  }

  map = new Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644}, // Default center
    zoom: 8, // Default zoom
    mapId: '4504f8b37365c3d0', // Custom map ID for styling
    gestureHandling: 'greedy', // Allows easy map interaction on all devices
    zoomControl: false,
    cameraControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
  });

  // Hide loader once map is ready
  const idleListener = map.addListener('idle', () => {
    hideMapLoader();
    google.maps.event.removeListener(idleListener);
  });

  // Define a custom Popup class extending Google Maps OverlayView.
  // This allows for custom HTML content near map markers.
  // Fix: Cast window to any to attach Popup property and solve 'Property 'Popup' does not exist on type 'Window & typeof globalThis'' error.
  (window as any).Popup = class Popup extends google.maps.OverlayView {
    position;
    containerDiv;
    constructor(position, content) {
      super();
      this.position = position;
      content.classList.add('popup-bubble');

      this.containerDiv = document.createElement('div');
      this.containerDiv.classList.add('popup-container');
      this.containerDiv.appendChild(content); // Append the actual content here
      // Prevent clicks inside the popup from propagating to the map.
      // Fix: Cast Popup to any to access static method from 'any' base class and solve 'Property 'preventMapHitsAndGesturesFrom' does not exist on type 'typeof Popup'' error.
      (Popup as any).preventMapHitsAndGesturesFrom(this.containerDiv);
    }

    /** Called when the popup is added to the map via setMap(). */
    onAdd() {
      // Fix: Cast this to any to access method from 'any' base class and solve 'Property 'getPanes' does not exist on type 'Popup'' error.
      (this as any).getPanes().floatPane.appendChild(this.containerDiv);
    }

    /** Called when the popup is removed from the map via setMap(null). */
    onRemove() {
      if (this.containerDiv.parentElement) {
        this.containerDiv.parentElement.removeChild(this.containerDiv);
      }
    }

    /** Called each frame when the popup needs to draw itself. */
    draw() {
      // Fix: Cast this to any to access method from 'any' base class and solve 'Property 'getProjection' does not exist on type 'Popup'' error.
      const divPosition = (this as any).getProjection().fromLatLngToDivPixel(
        this.position,
      );
      // Hide the popup when it is far out of view for performance.
      const display =
        Math.abs(divPosition.x) < 4000 && Math.abs(divPosition.y) < 4000
          ? 'block'
          : 'none';

      if (display === 'block') {
        this.containerDiv.style.left = divPosition.x + 'px';
        this.containerDiv.style.top = divPosition.y + 'px';
      }

      if (this.containerDiv.style.display !== display) {
        this.containerDiv.style.display = display;
      }
    }
  };
}

// Initialize the map as soon as the script loads.
initMap();
// Setup and potentially show the tutorial
setupTutorial();

// Function declaration for extracting location data using Google AI.
const locationFunctionDeclaration: FunctionDeclaration = {
  name: 'location',
  parameters: {
    type: Type.OBJECT,
    description: 'Geographic coordinates of a location.',
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the location.',
      },
      description: {
        type: Type.STRING,
        description:
          'Description of the location: why is it relevant, details to know.',
      },
      lat: {
        type: Type.STRING,
        description: 'Latitude of the location.',
      },
      lng: {
        type: Type.STRING,
        description: 'Longitude of the location.',
      },
      // Properties specific to Day Planner mode
      time: {
        type: Type.STRING,
        description:
          'Time of day to visit this location (e.g., "09:00", "14:30").',
      },
      duration: {
        type: Type.STRING,
        description:
          'Suggested duration of stay at this location (e.g., "1 hour", "45 minutes").',
      },
      sequence: {
        type: Type.NUMBER,
        description: 'Order in the day itinerary (1 = first stop of the day).',
      },
    },
    required: ['name', 'description', 'lat', 'lng'],
  },
};

// Function declaration for extracting route/line data using Google AI.
const lineFunctionDeclaration: FunctionDeclaration = {
  name: 'line',
  parameters: {
    type: Type.OBJECT,
    description: 'Connection between a start location and an end location.',
    properties: {
      name: {
        type: Type.STRING,
        description: 'Name of the route or connection',
      },
      start: {
        type: Type.OBJECT,
        description: 'Start location of the route',
        properties: {
          lat: {
            type: Type.STRING,
            description: 'Latitude of the start location.',
          },
          lng: {
            type: Type.STRING,
            description: 'Longitude of the start location.',
          },
        },
      },
      end: {
        type: Type.OBJECT,
        description: 'End location of the route',
        properties: {
          lat: {
            type: Type.STRING,
            description: 'Latitude of the end location.',
          },
          lng: {
            type: Type.STRING,
            description: 'Longitude of the end location.',
          },
        },
      },
      // Properties specific to Day Planner mode
      transport: {
        type: Type.STRING,
        description:
          'Mode of transportation between locations (e.g., "walking", "driving", "public transit").',
      },
      travelTime: {
        type: Type.STRING,
        description:
          'Estimated travel time between locations (e.g., "15 minutes", "1 hour").',
      },
    },
    required: ['name', 'start', 'end'],
  },
};

// Instruksi sistem yang diberikan kepada model Google AI untuk memandu responsnya.
const systemInstructions = `## Instruksi Sistem untuk Penjelajah Peta Interaktif

**Persona Model:** Anda adalah asisten yang berpengetahuan luas dan sadar geografis yang menyediakan informasi visual melalui peta.
Tujuan utama Anda adalah menjawab setiap pertanyaan terkait lokasi secara komprehensif, menggunakan visualisasi berbasis peta.
Anda dapat memproses informasi tentang hampir semua tempat, nyata atau fiksi, masa lalu, sekarang, atau masa depan.

**Kemampuan Inti:**

1.  **Pengetahuan Geografis:** Anda memiliki pengetahuan luas tentang:
    *   Lokasi global, tengara, dan atraksi
    *   Situs bersejarah dan signifikansinya
    *   Keajaiban alam dan geografi
    *   Tempat-tempat menarik budaya
    *   Rute perjalanan dan pilihan transportasi

2.  **Dua Mode Operasi:**

    **A. Mode Penjelajah Umum** (Default saat DAY_PLANNER_MODE adalah false):
    *   Menanggapi setiap pertanyaan dengan mengidentifikasi lokasi geografis yang relevan
    *   Menampilkan beberapa tempat menarik yang terkait dengan kueri
    *   Memberikan deskripsi yang kaya untuk setiap lokasi
    *   Menghubungkan lokasi terkait dengan jalur yang sesuai
    *   Fokus pada penyampaian informasi daripada penjadwalan

    **B. Mode Perencana Harian** (Saat DAY_PLANNER_MODE adalah true):
    *   Membuat rencana perjalanan harian yang terperinci dengan:
        *   Urutan lokasi yang logis untuk dikunjungi sepanjang hari (biasanya 4-6 perhentian utama)
        *   Waktu spesifik dan durasi realistis untuk setiap kunjungan lokasi
        *   Rute perjalanan antar lokasi dengan metode transportasi yang sesuai
        *   Jadwal yang seimbang dengan mempertimbangkan waktu perjalanan, istirahat makan, dan durasi kunjungan
        *   Setiap lokasi harus menyertakan properti 'time' (misalnya, "09:00") dan 'duration'
        *   Setiap lokasi harus menyertakan nomor 'sequence' (1, 2, 3, dst.) untuk menunjukkan urutan
        *   Setiap garis yang menghubungkan lokasi harus menyertakan properti 'transport' dan 'travelTime'

**Format Keluaran:**

1.  **Mode Penjelajah Umum:**
    *   Gunakan fungsi "location" untuk setiap tempat menarik yang relevan dengan nama, deskripsi, lat, lng
    *   Gunakan fungsi "line" untuk menghubungkan lokasi terkait jika sesuai
    *   Sediakan lokasi menarik sebanyak mungkin (4-8 adalah ideal)
    *   Pastikan setiap lokasi memiliki deskripsi yang bermakna

2.  **Mode Perencana Harian:**
    *   Gunakan fungsi "location" untuk setiap perhentian dengan properti waktu, durasi, dan urutan yang diperlukan
    *   Gunakan fungsi "line" untuk menghubungkan perhentian dengan properti transportasi dan waktu perjalanan
    *   Susun hari dalam urutan logis dengan waktu yang realistis
    *   Sertakan detail spesifik tentang apa yang harus dilakukan di setiap lokasi

**Pedoman Penting:**
*   Untuk Kueri APAPUN, selalu berikan data geografis melalui fungsi lokasi
*   Jika tidak yakin tentang lokasi tertentu, gunakan penilaian terbaik Anda untuk memberikan koordinat
*   Jangan pernah membalas hanya dengan pertanyaan atau permintaan klarifikasi
*   Selalu berusaha untuk memetakan informasi secara visual, bahkan untuk kueri yang kompleks atau abstrak
*   Untuk rencana harian, buat jadwal realistis yang dimulai tidak lebih awal dari jam 8:00 pagi dan berakhir pada jam 9:00 malam

Ingat: Dalam mode default, tanggapi Kueri APAPUN dengan menemukan lokasi yang relevan untuk ditampilkan di peta, bahkan jika tidak secara eksplisit tentang perjalanan atau geografi. Dalam mode perencana harian, buat rencana perjalanan harian yang terstruktur.`;

// Initialize the Google AI client.
const ai = new GoogleGenAI({
  vertexai: false,
  apiKey: process.env.GEMINI_API_KEY,
});

// Functions to control the visibility of the timeline panel.
function showTimeline() {
  if (timelineContainer) {
    timelineContainer.style.display = 'block';

    // Delay adding 'visible' class for CSS transition effect.
    setTimeout(() => {
      timelineContainer.classList.add('visible');

      if (window.innerWidth > 768) {
        // Desktop view
        mapContainer.classList.add('map-container-shifted');
        adjustInterfaceForTimeline(true);
        window.dispatchEvent(new Event('resize')); // Force map redraw
      } else {
        // Mobile view
        mapOverlay.classList.add('visible');
      }
    }, 10);
  }
}

function hideTimeline() {
  if (timelineContainer) {
    timelineContainer.classList.remove('visible');
    mapContainer.classList.remove('map-container-shifted');
    mapOverlay.classList.remove('visible');
    adjustInterfaceForTimeline(false);

    // Wait for transition before setting display to none.
    setTimeout(() => {
      timelineContainer.style.display = 'none';
      window.dispatchEvent(new Event('resize'));
    }, 300);
  }
}

// Adjusts map bounds when the timeline visibility changes.
function adjustInterfaceForTimeline(isTimelineVisible) {
  if (bounds && map) {
    setTimeout(() => {
      showMapLoader();
      map.fitBounds(bounds);
      const idleListener = google.maps.event.addListenerOnce(map, 'idle', () => {
        hideMapLoader();
      });
    }, 350); // Delay to allow layout adjustments
  }
}

// Event Listeners for UI elements.
const promptInput = document.querySelector(
  '#prompt-input',
) as HTMLTextAreaElement;
promptInput.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.code === 'Enter' && !e.shiftKey) {
    // Allow shift+enter for new lines
    const buttonEl = document.getElementById('generate') as HTMLButtonElement;
    buttonEl.classList.add('loading');
    e.preventDefault();
    e.stopPropagation();

    setTimeout(() => {
      sendText(promptInput.value);
      promptInput.value = '';
    }, 10); // Delay to show loading state
  }
});

generateButton.addEventListener('click', (e) => {
  const buttonEl = e.currentTarget as HTMLButtonElement;
  buttonEl.classList.add('loading');

  setTimeout(() => {
    sendText(promptInput.value);
  }, 10);
});

resetButton.addEventListener('click', (e) => {
  restart();
});

if (prevCardButton) {
  prevCardButton.addEventListener('click', () => {
    navigateCards(-1);
  });
}

if (nextCardButton) {
  nextCardButton.addEventListener('click', () => {
    navigateCards(1);
  });
}

if (plannerModeToggle) {
  plannerModeToggle.addEventListener('change', () => {
    isPlannerMode = plannerModeToggle.checked;
    promptInput.placeholder = isPlannerMode
      ? "Buat rencana harian di... (mis. 'Rencanakan sehari menjelajahi Monas' atau 'Satu hari di Bali')"
      : 'Jelajahi tempat, sejarah, acara, atau tanyakan tentang lokasi apa pun...';

    if (!isPlannerMode && timelineContainer) {
      hideTimeline();
    }
  });
}

if (closeTimelineButton) {
  closeTimelineButton.addEventListener('click', () => {
    hideTimeline();
  });
}

if (timelineToggle) {
  timelineToggle.addEventListener('click', () => {
    showTimeline();
  });
}

if (mapOverlay) {
  mapOverlay.addEventListener('click', () => {
    hideTimeline();
  });
}

if (exportPlanButton) {
  exportPlanButton.addEventListener('click', () => {
    exportDayPlan();
  });
}

// Resets the map and application state to initial conditions.
function restart() {
  points = [];
  bounds = new google.maps.LatLngBounds();
  dayPlanItinerary = [];

  markers.forEach((marker) => marker.setMap(null));
  markers = [];

  lines.forEach((line) => {
    line.poly.setMap(null);
    line.geodesicPoly.setMap(null);
  });
  lines = [];

  popUps.forEach((popup) => {
    popup.popup.setMap(null);
    if (popup.content && popup.content.remove) popup.content.remove();
  });
  popUps = [];

  if (cardContainer) cardContainer.innerHTML = '';
  if (carouselIndicators) carouselIndicators.innerHTML = '';
  if (cardCarousel) cardCarousel.style.display = 'none';
  if (timeline) timeline.innerHTML = '';
  if (timelineContainer) hideTimeline();
}

// Sends the user's prompt to the Google AI and processes the response.
async function sendText(prompt: string) {
  showMapLoader();
  errorMessage.innerHTML = '';
  restart();
  const buttonEl = document.getElementById('generate') as HTMLButtonElement;

  try {
    let finalPrompt = prompt;
    if (isPlannerMode) {
      finalPrompt = prompt + ' perjalanan sehari';
    }

    const updatedInstructions = isPlannerMode
      ? systemInstructions.replace('DAY_PLANNER_MODE', 'true')
      : systemInstructions.replace('DAY_PLANNER_MODE', 'false');

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction: updatedInstructions,
        temperature: 1,
        tools: [
          {
            functionDeclarations: [
              locationFunctionDeclaration,
              lineFunctionDeclaration,
            ],
          },
        ],
      },
    });

    let text = '';
    let results = false;
    for await (const chunk of response) {
      const fns = chunk.functionCalls ?? [];
      for (const fn of fns) {
        if (fn.name === 'location') {
          await setPin(fn.args);
          results = true;
        }
        if (fn.name === 'line') {
          await setLeg(fn.args);
          results = true;
        }
      }

      if (
        chunk.candidates &&
        chunk.candidates.length > 0 &&
        chunk.candidates[0].content &&
        chunk.candidates[0].content.parts
      ) {
        chunk.candidates[0].content.parts.forEach((part) => {
          if (part.text) text += part.text;
        });
      } else if (chunk.text) {
        text += chunk.text;
      }
    }

    if (!results) {
      throw new Error(
        'Tidak dapat menghasilkan hasil apa pun. Coba lagi, atau coba permintaan yang berbeda.',
      );
    }

    if (isPlannerMode && dayPlanItinerary.length > 0) {
      dayPlanItinerary.sort(
        (a, b) =>
          (a.sequence || Infinity) - (b.sequence || Infinity) ||
          (a.time || '').localeCompare(b.time || ''),
      );
      createTimeline();
      showTimeline();
    }

    createLocationCards();
  } catch (e) {
    errorMessage.innerHTML = e.message;
    console.error('Error generating content:', e);
  } finally {
    buttonEl.classList.remove('loading');
    hideMapLoader();
  }
}

// Adds a pin (marker and popup) to the map for a given location.
async function setPin(args) {
  const point = {lat: Number(args.lat), lng: Number(args.lng)};
  points.push(point);
  bounds.extend(point);

  const marker = new AdvancedMarkerElement({
    map,
    position: point,
    title: args.name,
  });
  markers.push(marker);
  map.panTo(point);
  map.fitBounds(bounds);

  const content = document.createElement('div');
  let timeInfo = '';
  if (args.time) {
    timeInfo = `<div style="margin-top: 4px; font-size: 12px; color: #2196F3;">
                  <i class="fas fa-clock"></i> ${args.time}
                  ${args.duration ? ` • ${args.duration}` : ''}
                </div>`;
  }
  content.innerHTML = `<b>${args.name}</b><br/>${args.description}${timeInfo}`;

  // Fix: Cast window to any to access Popup property and solve 'Property 'Popup' does not exist on type 'Window & typeof globalThis'' error.
  const popup = new (window as any).Popup(new google.maps.LatLng(point), content);

  if (!isPlannerMode) {
    popup.setMap(map);
  }

  const locationInfo = {
    name: args.name,
    description: args.description,
    position: new google.maps.LatLng(point),
    popup,
    content,
    time: args.time,
    duration: args.duration,
    sequence: args.sequence,
  };

  popUps.push(locationInfo);

  if (isPlannerMode && args.time) {
    dayPlanItinerary.push(locationInfo);
  }
}

// Adds a line (route) between two locations on the map.
async function setLeg(args) {
  const start = {
    lat: Number(args.start.lat),
    lng: Number(args.start.lng),
  };
  const end = {lat: Number(args.end.lat), lng: Number(args.end.lng)};
  points.push(start);
  points.push(end);
  bounds.extend(start);
  bounds.extend(end);
  map.fitBounds(bounds);

  const polyOptions = {
    strokeOpacity: 0.0, // Invisible base line
    strokeWeight: 3,
    map,
  };

  const geodesicPolyOptions = {
    strokeColor: isPlannerMode ? '#2196F3' : '#CC0099',
    strokeOpacity: 1.0,
    strokeWeight: isPlannerMode ? 4 : 3,
    map,
  };

  if (isPlannerMode) {
    geodesicPolyOptions['icons'] = [
      {
        icon: {path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3},
        offset: '0',
        repeat: '15px',
      },
    ];
  }

  const poly = new google.maps.Polyline(polyOptions);
  const geodesicPoly = new google.maps.Polyline(geodesicPolyOptions);

  const path = [start, end];
  poly.setPath(path);
  geodesicPoly.setPath(path);

  lines.push({
    poly,
    geodesicPoly,
    name: args.name,
    transport: args.transport,
    travelTime: args.travelTime,
  });
}

// Creates and populates the timeline view for the day plan.
function createTimeline() {
  if (!timeline || dayPlanItinerary.length === 0) return;
  timeline.innerHTML = '';

  dayPlanItinerary.forEach((item, index) => {
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    const timeDisplay = item.time || 'Fleksibel';

    timelineItem.innerHTML = `
      <div class="timeline-time">${timeDisplay}</div>
      <div class="timeline-connector">
        <div class="timeline-dot"></div>
        <div class="timeline-line"></div>
      </div>
      <div class="timeline-content" data-index="${index}">
        <div class="timeline-title">${item.name}</div>
        <div class="timeline-description">${item.description}</div>
        ${item.duration ? `<div class="timeline-duration">${item.duration}</div>` : ''}
      </div>
    `;

    const timelineContent = timelineItem.querySelector('.timeline-content');
    if (timelineContent) {
      timelineContent.addEventListener('click', () => {
        const popupIndex = popUps.findIndex((p) => p.name === item.name);
        if (popupIndex !== -1) {
          highlightCard(popupIndex);
          map.panTo(popUps[popupIndex].position);
        }
      });
    }
    timeline.appendChild(timelineItem);
  });

  if (lines.length > 0 && isPlannerMode) {
    const timelineItems = timeline.querySelectorAll('.timeline-item');
    for (let i = 0; i < timelineItems.length - 1; i++) {
      const currentItem = dayPlanItinerary[i];
      const nextItem = dayPlanItinerary[i + 1];
      const connectingLine = lines.find(
        (line) =>
          line.name.includes(currentItem.name) ||
          line.name.includes(nextItem.name),
      );

      if (
        connectingLine &&
        (connectingLine.transport || connectingLine.travelTime)
      ) {
        const transportItem = document.createElement('div');
        transportItem.className = 'timeline-item transport-item';
        transportItem.innerHTML = `
          <div class="timeline-time"></div>
          <div class="timeline-connector">
            <div class="timeline-dot" style="background-color: #999;"></div>
            <div class="timeline-line"></div>
          </div>
          <div class="timeline-content transport">
            <div class="timeline-title">
              <i class="fas fa-${getTransportIcon(connectingLine.transport || 'travel')}"></i>
              ${connectingLine.transport || 'Perjalanan'}
            </div>
            <div class="timeline-description">${connectingLine.name}</div>
            ${connectingLine.travelTime ? `<div class="timeline-duration">${connectingLine.travelTime}</div>` : ''}
          </div>
        `;
        timelineItems[i].after(transportItem);
      }
    }
  }
}

// Returns an appropriate Font Awesome icon class based on transport type.
function getTransportIcon(transportType: string): string {
  const type = (transportType || '').toLowerCase();
  if (type.includes('walk') || type.includes('jalan kaki')) {
    return 'walking';
  }
  if (type.includes('car') || type.includes('driv') || type.includes('mobil') || type.includes('mengemudi')) {
    return 'car-side';
  }
  if (
    type.includes('bus') ||
    type.includes('transit') ||
    type.includes('public') ||
    type.includes('bis') ||
    type.includes('angkutan umum')
  ) {
    return 'bus-alt';
  }
  if (
    type.includes('train') ||
    type.includes('subway') ||
    type.includes('metro') ||
    type.includes('kereta')
  ) {
    return 'train';
  }
  if (type.includes('bike') || type.includes('cycl') || type.includes('sepeda')) {
    return 'bicycle';
  }
  if (type.includes('taxi') || type.includes('cab') || type.includes('taksi')) {
    return 'taxi';
  }
  if (type.includes('boat') || type.includes('ferry') || type.includes('perahu') || type.includes('feri')) {
    return 'ship';
  }
  if (type.includes('plane') || type.includes('fly') || type.includes('pesawat') || type.includes('terbang')) {
    return 'plane-departure';
  }
  {
    return 'route';
  } // Default icon
}

// Generates a placeholder SVG image for location cards.
function getPlaceholderImage(locationName: string): string {
  let hash = 0;
  for (let i = 0; i < locationName.length; i++) {
    hash = locationName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  const saturation = 60 + (hash % 30);
  const lightness = 50 + (hash % 20);
  const letter = locationName.charAt(0).toUpperCase() || '?';

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="180" viewBox="0 0 300 180">
      <rect width="300" height="180" fill="hsl(${hue}, ${saturation}%, ${lightness}%)" />
      <text x="150" y="95" font-family="Arial, sans-serif" font-size="72" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text>
    </svg>
  `)}`;
}

// Creates and displays location cards in the carousel.
function createLocationCards() {
  if (!cardContainer || !carouselIndicators || popUps.length === 0) return;
  cardContainer.innerHTML = '';
  carouselIndicators.innerHTML = '';
  cardCarousel.style.display = 'block';

  popUps.forEach((location, index) => {
    const card = document.createElement('div');
    card.className = 'location-card';
    if (isPlannerMode) card.classList.add('day-planner-card');
    if (index === 0) card.classList.add('card-active');

    const imageUrl = getPlaceholderImage(location.name);
    let cardContent = `<div class="card-image" style="background-image: url('${imageUrl}')"></div>`;

    if (isPlannerMode) {
      if (location.sequence) {
        cardContent += `<div class="card-sequence-badge">${location.sequence}</div>`;
      }
      if (location.time) {
        cardContent += `<div class="card-time-badge">${location.time}</div>`;
      }
    }

    cardContent += `
      <div class="card-content">
        <h3 class="card-title">${location.name}</h3>
        <p class="card-description">${location.description}</p>
        ${isPlannerMode && location.duration ? `<div class="card-duration">${location.duration}</div>` : ''}
        <div class="card-coordinates">
          ${location.position.lat().toFixed(5)}, ${location.position.lng().toFixed(5)}
        </div>
      </div>
    `;
    card.innerHTML = cardContent;

    card.addEventListener('click', () => {
      highlightCard(index);
      map.panTo(location.position);
      if (isPlannerMode && timeline) highlightTimelineItem(index);
    });

    cardContainer.appendChild(card);

    const dot = document.createElement('div');
    dot.className = 'carousel-dot';
    if (index === 0) dot.classList.add('active');
    carouselIndicators.appendChild(dot);
  });

  if (cardCarousel && popUps.length > 0) {
    cardCarousel.style.display = 'block';
  }
}

// Highlights the selected card and corresponding elements.
function highlightCard(index: number) {
  activeCardIndex = index;
  const cards = cardContainer?.querySelectorAll('.location-card');
  if (!cards) return;

  cards.forEach((card) => card.classList.remove('card-active'));
  if (cards[index]) {
    cards[index].classList.add('card-active');
    // Fix: Cast Element to HTMLElement to access offsetWidth and solve 'Property 'offsetWidth' does not exist on type 'Element'' error.
    const cardWidth = (cards[index] as HTMLElement).offsetWidth;
    const containerWidth = cardContainer.offsetWidth;
    const scrollPosition =
      // Fix: Cast Element to HTMLElement to access offsetLeft and solve 'Property 'offsetLeft' does not exist on type 'Element'' error.
      (cards[index] as HTMLElement).offsetLeft -
      containerWidth / 2 +
      cardWidth / 2;
    cardContainer.scrollTo({left: scrollPosition, behavior: 'smooth'});
  }

  const dots = carouselIndicators?.querySelectorAll('.carousel-dot');
  if (dots) {
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
  }

  popUps.forEach((popup, i) => {
    popup.popup.setMap(isPlannerMode ? (i === index ? map : null) : map);
    if (popup.content) {
      popup.content.classList.toggle('popup-active', i === index);
    }
  });

  if (isPlannerMode) highlightTimelineItem(index);
}

// Highlights the timeline item corresponding to the selected card.
function highlightTimelineItem(cardIndex: number) {
  if (!timeline) return;
  const timelineItems = timeline.querySelectorAll(
    '.timeline-content:not(.transport)',
  );
  timelineItems.forEach((item) => item.classList.remove('active'));

  const location = popUps[cardIndex];
  for (const item of timelineItems) {
    const title = item.querySelector('.timeline-title');
    if (title && title.textContent === location.name) {
      item.classList.add('active');
      item.scrollIntoView({behavior: 'smooth', block: 'nearest'});
      break;
    }
  }
}

// Allows navigation through cards using arrow buttons.
function navigateCards(direction: number) {
  const newIndex = activeCardIndex + direction;
  if (newIndex >= 0 && newIndex < popUps.length) {
    highlightCard(newIndex);
    map.panTo(popUps[newIndex].position);
  }
}

// Exports the current day plan as a simple text file.
function exportDayPlan() {
  if (!dayPlanItinerary.length) return;
  let content = '# Rencana Harian Anda\n\n';

  dayPlanItinerary.forEach((item, index) => {
    content += `## ${index + 1}. ${item.name}\n`;
    content += `Waktu: ${item.time || 'Fleksibel'}\n`;
    if (item.duration) content += `Durasi: ${item.duration}\n`;
    content += `\n${item.description}\n\n`;

    if (index < dayPlanItinerary.length - 1) {
      const nextItem = dayPlanItinerary[index + 1];
      const connectingLine = lines.find(
        (line) =>
          line.name.includes(item.name) || line.name.includes(nextItem.name),
      );
      if (connectingLine) {
        content += `### Perjalanan ke ${nextItem.name}\n`;
        content += `Metode: ${connectingLine.transport || 'Tidak ditentukan'}\n`;
        if (connectingLine.travelTime) {
          content += `Waktu: ${connectingLine.travelTime}\n`;
        }
        content += `\n`;
      }
    }
  });

  const blob = new Blob([content], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rencana-harian.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
