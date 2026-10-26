// Importation de Firebase depuis les CDN officiels de Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// --- CONFIGURATION FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyBhcFvis5NVPD8kDzSM3MfDdPU_OlDqjs0",
  authDomain: "recettes-app-b07b7.firebaseapp.com",
  projectId: "recettes-app-b07b7",
  storageBucket: "recettes-app-b07b7.firebasestorage.app",
  messagingSenderId: "282945330606",
  appId: "1:282945330606:web:ab8c03d29f885a3f23fc3f",
  measurementId: "G-J87FFL7YK9"
};

// Initialisation Firebase (utilisation de 'app' pour éviter le conflit de nom)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const recipesCollection = collection(db, "recipes");

// --- CONFIGURATION BACKEND RENDER ---
const BACKEND_URL = "https://recettes-app-q6xl.onrender.com/api/scrape";
let recipes = []; // Stockage local synchronisé avec le cloud

// --- UI / Modales (exposées globalement pour éviter les erreurs de scope) ---
window.openSheet = function(id) {
    document.getElementById('overlay').classList.add('active');
    document.getElementById(id).classList.add('active');
}

window.closeAllSheets = function() {
    document.getElementById('overlay').classList.remove('active');
    document.querySelectorAll('.bottom-sheet').forEach(sheet => sheet.classList.remove('active'));
}

// --- GESTION DES ÉVÉNEMENTS DOM ---
document.addEventListener('DOMContentLoaded', () => {
    // Bouton FAB (+) -> Ouvre le menu d'ajout
    const fabAdd = document.getElementById('fab-add');
    if (fabAdd) {
        fabAdd.addEventListener('click', () => window.openSheet('sheet-add-menu'));
    }

    // Bouton Fermer le menu d'ajout
    const btnCloseMenu = document.getElementById('btn-close-menu');
    if (btnCloseMenu) {
        btnCloseMenu.addEventListener('click', () => window.closeAllSheets());
    }

    // Bouton Overlay -> Ferme tout
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.addEventListener('click', () => window.closeAllSheets());
    }

    // Bouton Afficher la modale URL
    const btnShowUrl = document.getElementById('btn-show-url');
    if (btnShowUrl) {
        btnShowUrl.addEventListener('click', () => {
            window.closeAllSheets();
            window.openSheet('sheet-url');
        });
    }

    // Bouton Convertisseur
    const btnConverter = document.getElementById('btn-converter');
    if (btnConverter) {
        btnConverter.addEventListener('click', () => window.openSheet('sheet-converter'));
    }

    // Importation via URL (Backend Render + Gemini)
    const btnImport = document.getElementById('btn-import');
    if (btnImport) {
        btnImport.addEventListener('click', async () => {
            const urlInput = document.getElementById('import-url');
            const loader = document.getElementById('import-loader');
            const url = urlInput.value.trim();

            if (!url) {
                alert("Veuillez entrer une URL valide.");
                return;
            }

            if (loader) loader.style.display = 'block';

            try {
                const response = await fetch(BACKEND_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                if (!response.ok) throw new Error("Erreur lors de l'extraction par le serveur.");

                const recipeData = await response.json();

                // Sauvegarde dans Firebase Firestore
                await addDoc(recipesCollection, {
                    ...recipeData,
                    createdAt: new Date()
                });

                alert("Recette importée et sauvegardée avec succès !");
                urlInput.value = '';
                window.closeAllSheets();
            } catch (error) {
                console.error("Erreur d'import :", error);
                alert("Impossible d'extraire la recette. Vérifiez l'URL.");
            } finally {
                if (loader) loader.style.display = 'none';
            }
        });
    }
});

// --- SYNCHRONISATION EN TEMPS RÉEL (FIREBASE FIRESTORE) ---
onSnapshot(recipesCollection, (snapshot) => {
    recipes = [];
    snapshot.forEach((doc) => {
        recipes.push({ id: doc.id, ...doc.data() });
    });
    renderRecipes(recipes);
});

// --- AFFICHAGE DES RECETTES ---
function renderRecipes(recipesArray) {
    const recipeList = document.getElementById('recipe-list');
    if (!recipeList) return;

    recipeList.innerHTML = '';

    if (recipesArray.length === 0) {
        recipeList.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: #888;">Aucune recette pour le moment. Cliquez sur le + pour en ajouter !</p>';
        return;
    }

    recipesArray.forEach((recipe) => {
        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${recipe.image || 'https://via.placeholder.com/300'}" alt="${recipe.title || 'Recette'}">
            <div class="recipe-info">
                <h3>${recipe.title || 'Sans titre'}</h3>
                <p>⏱️ ${recipe.time || 'N/C'} | 🍽️ ${recipe.servings || 'N/C'}</p>
            </div>
        `;
        recipeList.appendChild(card);
    });
}
