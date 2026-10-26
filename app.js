// Importation de Firebase depuis les CDN officiels de Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// --- CONFIGURATION FIREBASE (À REMPLACER PAR VOS CLÉS) ---
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhcFvis5NVPD8kDzSM3MfDdPU_OlDqjs0",
  authDomain: "recettes-app-b07b7.firebaseapp.com",
  projectId: "recettes-app-b07b7",
  storageBucket: "recettes-app-b07b7.firebasestorage.app",
  messagingSenderId: "282945330606",
  appId: "1:282945330606:web:ab8c03d29f885a3f23fc3f",
  measurementId: "G-J87FFL7YK9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialisation Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const recipesCollection = collection(db, "recipes");

const BACKEND_URL = "https://recettes-app-q6xl.onrender.com/api/scrape";
let recipes = []; // Stockage local synchronisé avec le cloud

// --- UI / Modales ---
function openSheet(id) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
}
window.closeAllSheets = function() { // Rendu global pour les onclick HTML
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('active'));
}

document.getElementById('fab-add').addEventListener('click', () => openSheet('sheet-add-menu'));
document.getElementById('btn-close-menu').addEventListener('click', closeAllSheets);
document.getElementById('btn-show-url').addEventListener('click', () => { closeAllSheets(); setTimeout(() => openSheet('sheet-url'), 300); });
document.getElementById('btn-converter').addEventListener('click', () => openSheet('sheet-converter'));
document.getElementById('overlay').addEventListener('click', closeAllSheets);

// --- Rendu des recettes ---
function renderRecipes(filter = 'Toutes') {
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';
    const filtered = filter === 'Toutes' ? recipes : recipes.filter(r => r.category === filter);
    
    filtered.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${r.image || 'https://via.placeholder.com/300x200?text=Pas+d%27image'}" alt="${r.title}" loading="lazy">
            <div class="info">
                <h3>${r.title}</h3>
                <p>${r.category || 'Non classé'}</p>
            </div>
        `;
        card.addEventListener('click', () => showRecipeDetail(r));
        list.appendChild(card);
    });
}

function showRecipeDetail(recipe) {
    const content = document.getElementById('recipe-detail-content');
    content.innerHTML = `
        <div class="recipe-header">
            <img src="${recipe.image || 'https://via.placeholder.com/300x200'}" alt="">
            <h2>${recipe.title}</h2>
        </div>
        <div class="recipe-section">
            <h3>Ingrédients</h3>
            <ul>${recipe.ingredients.map(i => `<li>${i}</li>`).join('')}</ul>
        </div>
        <div class="recipe-section">
            <h3>Préparation</h3>
            <ol>${recipe.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        </div>
    `;
    openSheet('sheet-detail');
}

// --- Écouteur en temps réel de Firebase ---
onSnapshot(recipesCollection, (snapshot) => {
    recipes = [];
    snapshot.forEach((doc) => {
        recipes.push({ id: doc.id, ...doc.data() });
    });
    // On garde le filtre actif lors d'une mise à jour
    const activeFilter = document.querySelector('.filter-btn.active')?.dataset.category || 'Toutes';
    renderRecipes(activeFilter);
});

// --- Filtres ---
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderRecipes(e.target.dataset.category);
    });
});

// --- Import IA depuis Backend ---
document.getElementById('btn-import').addEventListener('click', async () => {
    const url = document.getElementById('import-url').value;
    if(!url) return alert("Veuillez entrer une URL");
    
    document.getElementById('import-loader').style.display = 'block';
    
    try {
        const res = await fetch(BACKEND_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        if(!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        
        // Ajout à Firebase (le onSnapshot mettra l'UI à jour automatiquement)
        data.category = "Plats"; // Catégorie par défaut
        data.createdAt = new Date().toISOString();
        await addDoc(recipesCollection, data);
        
        closeAllSheets();
        document.getElementById('import-url').value = '';
        
    } catch (err) {
        alert("Erreur lors de l'extraction de la recette. La vidéo est peut-être privée.");
        console.error(err);
    } finally {
        document.getElementById('import-loader').style.display = 'none';
    }
});

// --- Convertisseur de mesures ---
document.getElementById('conv-input').addEventListener('input', updateConv);
document.getElementById('conv-from').addEventListener('change', updateConv);

function updateConv() {
    const val = parseFloat(document.getElementById('conv-input').value) || 0;
    const from = document.getElementById('conv-from').value;
    let res = "";
    if(from === 'cup') res = (val * 240) + " ml (ou g)";
    if(from === 'oz') res = (val * 28.35).toFixed(1) + " g";
    if(from === 'tbsp') res = (val * 15) + " ml/g";
    document.getElementById('conv-result').innerText = res;
}