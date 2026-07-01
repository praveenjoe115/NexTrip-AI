/**
 * language.js — NexTrip AI Multi-Language Support
 * Handles language detection, switching, and UI translation.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- Supported Languages ---
    const LANGUAGES = [
        { code: 'en', name: 'English', native: 'English' },
        { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
        { code: 'es', name: 'Spanish', native: 'Español' },
        { code: 'fr', name: 'French', native: 'Français' },
        { code: 'de', name: 'German', native: 'Deutsch' },
        { code: 'ja', name: 'Japanese', native: '日本語' }
    ];

    // --- Translation Dictionary ---
    const TRANSLATIONS = {
        en: {
            // Navigation
            home: 'Home',
            planner: 'Planner',
            maps: 'Maps',
            nearby: 'Nearby',
            weather: 'Weather',
            hidden_gems: 'Hidden Gems',
            budget: 'Budget',
            journal: 'Journal',
            favorites: 'Favorites',
            analytics: 'Analytics',
            route_optimizer: 'Route Optimizer',
            emergency: 'Emergency',

            // Common
            welcome: 'Welcome',
            explore: 'Explore',
            search: 'Search',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            loading: 'Loading...',
            no_data: 'No data available',
            error: 'Error',
            success: 'Success',
            language: 'Language',
            settings: 'Settings',
            profile: 'Profile',
            logout: 'Logout',
            login: 'Login',
            signup: 'Sign Up',

            // Planner
            destination: 'Destination',
            days: 'Days',
            budget: 'Budget',
            travelers: 'Travelers',
            interests: 'Interests',
            generate_trip: 'Generate Trip',
            save_trip: 'Save Trip',
            download_pdf: 'Download PDF',

            // Weather
            weather_intelligence: 'Weather Intelligence',
            city: 'City',
            get_weather: 'Get Weather',
            temperature: 'Temperature',
            condition: 'Condition',
            humidity: 'Humidity',
            wind_speed: 'Wind Speed',
            forecast: 'Forecast',
            travel_suggestions: 'Travel Suggestions',
            weather_tips: 'Weather Tips',

            // Favorites
            saved_favorites: 'Saved Favorites',
            total_favorites: 'Total Favorites',
            saved_trips: 'Saved Trips',
            saved_gems: 'Saved Gems',
            clear_all: 'Clear All',
            export: 'Export',

            // Journal
            travel_journal: 'Travel Journal',
            title: 'Title',
            location: 'Location',
            content: 'Content',
            ai_story: 'AI Story',
            save_entry: 'Save Entry',
            export_pdf: 'Export PDF',
            journal_history: 'Journal History',
            no_entries: 'No entries yet',

            // Budget
            budget_planner: 'Budget Planner',
            total_budget: 'Total Budget',
            total_spent: 'Total Spent',
            remaining: 'Remaining',
            add_expense: 'Add Expense',
            expense_title: 'Expense Title',
            amount: 'Amount',
            category: 'Category',
            expense_list: 'Expense List',
            clear_expenses: 'Clear Expenses',
            export_report: 'Export Report',

            // Maps & Route
            maps_directions: 'Maps & Directions',
            current_location: 'Current Location',
            get_directions: 'Get Directions',
            nearby_places: 'Nearby Places',
            distance: 'Distance',
            duration: 'Duration',
            estimated_cost: 'Estimated Cost',
            route_information: 'Route Information',
            optimized_route: 'Optimized Route',
            add_stop: 'Add Stop',
            optimize_route: 'Optimize Route',

            // Emergency
            emergency_hub: 'Emergency Hub',
            emergency_number: 'Emergency Number',
            sos: 'SOS',
            safety_tips: 'Safety Tips',
            travel_alerts: 'Travel Alerts',

            // Analytics
            travel_analytics: 'Travel Analytics',
            total_trips: 'Total Trips',
            favorite_destination: 'Favorite Destination',
            insights: 'Insights',
            refresh: 'Refresh',

            // Voice
            voice_assistant: 'Voice Assistant',
            listening: 'Listening...',
            say_command: 'Say a command',
            start: 'Start',
            stop: 'Stop'
        },

        hi: {
            home: 'होम',
            planner: 'योजनाकार',
            maps: 'मानचित्र',
            nearby: 'आस-पास',
            weather: 'मौसम',
            hidden_gems: 'छिपे हुए रत्न',
            budget: 'बजट',
            journal: 'जर्नल',
            favorites: 'पसंदीदा',
            analytics: 'विश्लेषण',
            route_optimizer: 'मार्ग अनुकूलक',
            emergency: 'आपातकाल',

            welcome: 'स्वागत है',
            explore: 'अन्वेषण करें',
            search: 'खोजें',
            save: 'सहेजें',
            cancel: 'रद्द करें',
            delete: 'हटाएं',
            edit: 'संपादित करें',
            loading: 'लोड हो रहा है...',
            no_data: 'कोई डेटा उपलब्ध नहीं',
            error: 'त्रुटि',
            success: 'सफलता',
            language: 'भाषा',
            settings: 'सेटिंग्स',
            profile: 'प्रोफ़ाइल',
            logout: 'लॉगआउट',
            login: 'लॉगिन',
            signup: 'साइन अप',

            destination: 'गंतव्य',
            days: 'दिन',
            budget: 'बजट',
            travelers: 'यात्री',
            interests: 'रुचियाँ',
            generate_trip: 'यात्रा बनाएँ',
            save_trip: 'यात्रा सहेजें',
            download_pdf: 'पीडीएफ डाउनलोड करें',

            weather_intelligence: 'मौसम बुद्धिमत्ता',
            city: 'शहर',
            get_weather: 'मौसम जानें',
            temperature: 'तापमान',
            condition: 'स्थिति',
            humidity: 'आर्द्रता',
            wind_speed: 'हवा की गति',
            forecast: 'पूर्वानुमान',
            travel_suggestions: 'यात्रा सुझाव',
            weather_tips: 'मौसम टिप्स',

            saved_favorites: 'सहेजे गए पसंदीदा',
            total_favorites: 'कुल पसंदीदा',
            saved_trips: 'सहेजी गई यात्राएँ',
            saved_gems: 'सहेजे गए रत्न',
            clear_all: 'सभी हटाएँ',
            export: 'निर्यात करें',

            travel_journal: 'यात्रा जर्नल',
            title: 'शीर्षक',
            location: 'स्थान',
            content: 'सामग्री',
            ai_story: 'एआई कहानी',
            save_entry: 'प्रविष्टि सहेजें',
            export_pdf: 'पीडीएफ निर्यात करें',
            journal_history: 'जर्नल इतिहास',
            no_entries: 'अभी कोई प्रविष्टि नहीं',

            budget_planner: 'बजट योजनाकार',
            total_budget: 'कुल बजट',
            total_spent: 'कुल खर्च',
            remaining: 'शेष',
            add_expense: 'खर्च जोड़ें',
            expense_title: 'खर्च का शीर्षक',
            amount: 'राशि',
            category: 'श्रेणी',
            expense_list: 'खर्च सूची',
            clear_expenses: 'खर्च हटाएँ',
            export_report: 'रिपोर्ट निर्यात करें',

            maps_directions: 'मानचित्र और दिशाएँ',
            current_location: 'वर्तमान स्थान',
            get_directions: 'दिशाएँ प्राप्त करें',
            nearby_places: 'आस-पास के स्थान',
            distance: 'दूरी',
            duration: 'अवधि',
            estimated_cost: 'अनुमानित लागत',
            route_information: 'मार्ग जानकारी',
            optimized_route: 'अनुकूलित मार्ग',
            add_stop: 'पड़ाव जोड़ें',
            optimize_route: 'मार्ग अनुकूलित करें',

            emergency_hub: 'आपातकाल केंद्र',
            emergency_number: 'आपातकालीन संख्या',
            sos: 'एसओएस',
            safety_tips: 'सुरक्षा टिप्स',
            travel_alerts: 'यात्रा अलर्ट',

            travel_analytics: 'यात्रा विश्लेषण',
            total_trips: 'कुल यात्राएँ',
            favorite_destination: 'पसंदीदा गंतव्य',
            insights: 'अंतर्दृष्टि',
            refresh: 'ताज़ा करें',

            voice_assistant: 'आवाज सहायक',
            listening: 'सुन रहा है...',
            say_command: 'एक कमांड कहें',
            start: 'शुरू करें',
            stop: 'रोकें'
        },

        es: {
            home: 'Inicio',
            planner: 'Planificador',
            maps: 'Mapas',
            nearby: 'Cercano',
            weather: 'Clima',
            hidden_gems: 'Joyas ocultas',
            budget: 'Presupuesto',
            journal: 'Diario',
            favorites: 'Favoritos',
            analytics: 'Analítica',
            route_optimizer: 'Optimizador de ruta',
            emergency: 'Emergencia',

            welcome: 'Bienvenido',
            explore: 'Explorar',
            search: 'Buscar',
            save: 'Guardar',
            cancel: 'Cancelar',
            delete: 'Eliminar',
            edit: 'Editar',
            loading: 'Cargando...',
            no_data: 'Sin datos',
            error: 'Error',
            success: 'Éxito',
            language: 'Idioma',
            settings: 'Configuración',
            profile: 'Perfil',
            logout: 'Cerrar sesión',
            login: 'Iniciar sesión',
            signup: 'Registrarse',

            destination: 'Destino',
            days: 'Días',
            budget: 'Presupuesto',
            travelers: 'Viajeros',
            interests: 'Intereses',
            generate_trip: 'Generar viaje',
            save_trip: 'Guardar viaje',
            download_pdf: 'Descargar PDF',

            weather_intelligence: 'Inteligencia climática',
            city: 'Ciudad',
            get_weather: 'Obtener clima',
            temperature: 'Temperatura',
            condition: 'Condición',
            humidity: 'Humedad',
            wind_speed: 'Velocidad del viento',
            forecast: 'Pronóstico',
            travel_suggestions: 'Sugerencias de viaje',
            weather_tips: 'Consejos del clima',

            saved_favorites: 'Favoritos guardados',
            total_favorites: 'Total favoritos',
            saved_trips: 'Viajes guardados',
            saved_gems: 'Joyas guardadas',
            clear_all: 'Limpiar todo',
            export: 'Exportar',

            travel_journal: 'Diario de viaje',
            title: 'Título',
            location: 'Ubicación',
            content: 'Contenido',
            ai_story: 'Historia IA',
            save_entry: 'Guardar entrada',
            export_pdf: 'Exportar PDF',
            journal_history: 'Historial del diario',
            no_entries: 'Sin entradas',

            budget_planner: 'Planificador de presupuesto',
            total_budget: 'Presupuesto total',
            total_spent: 'Total gastado',
            remaining: 'Restante',
            add_expense: 'Agregar gasto',
            expense_title: 'Título del gasto',
            amount: 'Cantidad',
            category: 'Categoría',
            expense_list: 'Lista de gastos',
            clear_expenses: 'Limpiar gastos',
            export_report: 'Exportar informe',

            maps_directions: 'Mapas y direcciones',
            current_location: 'Ubicación actual',
            get_directions: 'Obtener direcciones',
            nearby_places: 'Lugares cercanos',
            distance: 'Distancia',
            duration: 'Duración',
            estimated_cost: 'Costo estimado',
            route_information: 'Información de ruta',
            optimized_route: 'Ruta optimizada',
            add_stop: 'Agregar parada',
            optimize_route: 'Optimizar ruta',

            emergency_hub: 'Centro de emergencia',
            emergency_number: 'Número de emergencia',
            sos: 'SOS',
            safety_tips: 'Consejos de seguridad',
            travel_alerts: 'Alertas de viaje',

            travel_analytics: 'Analítica de viajes',
            total_trips: 'Total de viajes',
            favorite_destination: 'Destino favorito',
            insights: 'Perspectivas',
            refresh: 'Actualizar',

            voice_assistant: 'Asistente de voz',
            listening: 'Escuchando...',
            say_command: 'Di un comando',
            start: 'Iniciar',
            stop: 'Detener'
        },

        fr: {
            home: 'Accueil',
            planner: 'Planificateur',
            maps: 'Cartes',
            nearby: 'À proximité',
            weather: 'Météo',
            hidden_gems: 'Trésors cachés',
            budget: 'Budget',
            journal: 'Journal',
            favorites: 'Favoris',
            analytics: 'Analyses',
            route_optimizer: 'Optimiseur d\'itinéraire',
            emergency: 'Urgence',

            welcome: 'Bienvenue',
            explore: 'Explorer',
            search: 'Rechercher',
            save: 'Enregistrer',
            cancel: 'Annuler',
            delete: 'Supprimer',
            edit: 'Modifier',
            loading: 'Chargement...',
            no_data: 'Aucune donnée',
            error: 'Erreur',
            success: 'Succès',
            language: 'Langue',
            settings: 'Paramètres',
            profile: 'Profil',
            logout: 'Déconnexion',
            login: 'Connexion',
            signup: 'S\'inscrire',

            destination: 'Destination',
            days: 'Jours',
            budget: 'Budget',
            travelers: 'Voyageurs',
            interests: 'Intérêts',
            generate_trip: 'Générer un voyage',
            save_trip: 'Enregistrer le voyage',
            download_pdf: 'Télécharger PDF',

            weather_intelligence: 'Intelligence météo',
            city: 'Ville',
            get_weather: 'Obtenir la météo',
            temperature: 'Température',
            condition: 'Condition',
            humidity: 'Humidité',
            wind_speed: 'Vitesse du vent',
            forecast: 'Prévisions',
            travel_suggestions: 'Suggestions de voyage',
            weather_tips: 'Conseils météo',

            saved_favorites: 'Favoris enregistrés',
            total_favorites: 'Total favoris',
            saved_trips: 'Voyages enregistrés',
            saved_gems: 'Trésors enregistrés',
            clear_all: 'Tout effacer',
            export: 'Exporter',

            travel_journal: 'Journal de voyage',
            title: 'Titre',
            location: 'Lieu',
            content: 'Contenu',
            ai_story: 'Histoire IA',
            save_entry: 'Enregistrer l\'entrée',
            export_pdf: 'Exporter PDF',
            journal_history: 'Historique du journal',
            no_entries: 'Aucune entrée',

            budget_planner: 'Planificateur de budget',
            total_budget: 'Budget total',
            total_spent: 'Dépensé total',
            remaining: 'Restant',
            add_expense: 'Ajouter une dépense',
            expense_title: 'Titre de la dépense',
            amount: 'Montant',
            category: 'Catégorie',
            expense_list: 'Liste des dépenses',
            clear_expenses: 'Effacer les dépenses',
            export_report: 'Exporter le rapport',

            maps_directions: 'Cartes et itinéraires',
            current_location: 'Position actuelle',
            get_directions: 'Obtenir l\'itinéraire',
            nearby_places: 'Lieux à proximité',
            distance: 'Distance',
            duration: 'Durée',
            estimated_cost: 'Coût estimé',
            route_information: 'Informations sur l\'itinéraire',
            optimized_route: 'Itinéraire optimisé',
            add_stop: 'Ajouter un arrêt',
            optimize_route: 'Optimiser l\'itinéraire',

            emergency_hub: 'Centre d\'urgence',
            emergency_number: 'Numéro d\'urgence',
            sos: 'SOS',
            safety_tips: 'Conseils de sécurité',
            travel_alerts: 'Alertes de voyage',

            travel_analytics: 'Analyses de voyage',
            total_trips: 'Total des voyages',
            favorite_destination: 'Destination favorite',
            insights: 'Aperçus',
            refresh: 'Actualiser',

            voice_assistant: 'Assistant vocal',
            listening: 'Écoute...',
            say_command: 'Dites une commande',
            start: 'Démarrer',
            stop: 'Arrêter'
        },

        de: {
            home: 'Startseite',
            planner: 'Planer',
            maps: 'Karten',
            nearby: 'In der Nähe',
            weather: 'Wetter',
            hidden_gems: 'Versteckte Juwelen',
            budget: 'Budget',
            journal: 'Tagebuch',
            favorites: 'Favoriten',
            analytics: 'Analysen',
            route_optimizer: 'Routenoptimierer',
            emergency: 'Notfall',

            welcome: 'Willkommen',
            explore: 'Entdecken',
            search: 'Suchen',
            save: 'Speichern',
            cancel: 'Abbrechen',
            delete: 'Löschen',
            edit: 'Bearbeiten',
            loading: 'Lädt...',
            no_data: 'Keine Daten',
            error: 'Fehler',
            success: 'Erfolg',
            language: 'Sprache',
            settings: 'Einstellungen',
            profile: 'Profil',
            logout: 'Abmelden',
            login: 'Anmelden',
            signup: 'Registrieren',

            destination: 'Reiseziel',
            days: 'Tage',
            budget: 'Budget',
            travelers: 'Reisende',
            interests: 'Interessen',
            generate_trip: 'Reise generieren',
            save_trip: 'Reise speichern',
            download_pdf: 'PDF herunterladen',

            weather_intelligence: 'Wetterintelligenz',
            city: 'Stadt',
            get_weather: 'Wetter abrufen',
            temperature: 'Temperatur',
            condition: 'Zustand',
            humidity: 'Luftfeuchtigkeit',
            wind_speed: 'Windgeschwindigkeit',
            forecast: 'Vorhersage',
            travel_suggestions: 'Reisevorschläge',
            weather_tips: 'Wettertipps',

            saved_favorites: 'Gespeicherte Favoriten',
            total_favorites: 'Gesamtzahl Favoriten',
            saved_trips: 'Gespeicherte Reisen',
            saved_gems: 'Gespeicherte Juwelen',
            clear_all: 'Alle löschen',
            export: 'Exportieren',

            travel_journal: 'Reisetagebuch',
            title: 'Titel',
            location: 'Ort',
            content: 'Inhalt',
            ai_story: 'KI-Geschichte',
            save_entry: 'Eintrag speichern',
            export_pdf: 'PDF exportieren',
            journal_history: 'Tagebuchverlauf',
            no_entries: 'Keine Einträge',

            budget_planner: 'Budgetplaner',
            total_budget: 'Gesamtbudget',
            total_spent: 'Ausgegeben',
            remaining: 'Verbleibend',
            add_expense: 'Ausgabe hinzufügen',
            expense_title: 'Ausgabentitel',
            amount: 'Betrag',
            category: 'Kategorie',
            expense_list: 'Ausgabenliste',
            clear_expenses: 'Ausgaben löschen',
            export_report: 'Bericht exportieren',

            maps_directions: 'Karten & Routen',
            current_location: 'Aktueller Standort',
            get_directions: 'Routenplanung',
            nearby_places: 'Orte in der Nähe',
            distance: 'Entfernung',
            duration: 'Dauer',
            estimated_cost: 'Geschätzte Kosten',
            route_information: 'Routeninformationen',
            optimized_route: 'Optimierte Route',
            add_stop: 'Haltestelle hinzufügen',
            optimize_route: 'Route optimieren',

            emergency_hub: 'Notfallzentrum',
            emergency_number: 'Notrufnummer',
            sos: 'SOS',
            safety_tips: 'Sicherheitstipps',
            travel_alerts: 'Reisealarme',

            travel_analytics: 'Reiseanalysen',
            total_trips: 'Gesamtreisen',
            favorite_destination: 'Lieblingsziel',
            insights: 'Einblicke',
            refresh: 'Aktualisieren',

            voice_assistant: 'Sprachassistent',
            listening: 'Hört zu...',
            say_command: 'Sagen Sie einen Befehl',
            start: 'Starten',
            stop: 'Stoppen'
        },

        ja: {
            home: 'ホーム',
            planner: 'プランナー',
            maps: '地図',
            nearby: '近く',
            weather: '天気',
            hidden_gems: '隠れた名所',
            budget: '予算',
            journal: 'ジャーナル',
            favorites: 'お気に入り',
            analytics: '分析',
            route_optimizer: 'ルート最適化',
            emergency: '緊急',

            welcome: 'ようこそ',
            explore: '探索',
            search: '検索',
            save: '保存',
            cancel: 'キャンセル',
            delete: '削除',
            edit: '編集',
            loading: '読み込み中...',
            no_data: 'データがありません',
            error: 'エラー',
            success: '成功',
            language: '言語',
            settings: '設定',
            profile: 'プロフィール',
            logout: 'ログアウト',
            login: 'ログイン',
            signup: 'サインアップ',

            destination: '目的地',
            days: '日数',
            budget: '予算',
            travelers: '旅行者',
            interests: '興味',
            generate_trip: '旅行を生成',
            save_trip: '旅行を保存',
            download_pdf: 'PDFをダウンロード',

            weather_intelligence: '天気インテリジェンス',
            city: '都市',
            get_weather: '天気を取得',
            temperature: '気温',
            condition: '状態',
            humidity: '湿度',
            wind_speed: '風速',
            forecast: '予報',
            travel_suggestions: '旅行の提案',
            weather_tips: '天気のヒント',

            saved_favorites: '保存されたお気に入り',
            total_favorites: '合計お気に入り',
            saved_trips: '保存された旅行',
            saved_gems: '保存された名所',
            clear_all: 'すべてクリア',
            export: 'エクスポート',

            travel_journal: '旅行ジャーナル',
            title: 'タイトル',
            location: '場所',
            content: '内容',
            ai_story: 'AIストーリー',
            save_entry: 'エントリを保存',
            export_pdf: 'PDFをエクスポート',
            journal_history: 'ジャーナル履歴',
            no_entries: 'エントリがありません',

            budget_planner: '予算プランナー',
            total_budget: '総予算',
            total_spent: '総支出',
            remaining: '残り',
            add_expense: '支出を追加',
            expense_title: '支出タイトル',
            amount: '金額',
            category: 'カテゴリ',
            expense_list: '支出リスト',
            clear_expenses: '支出をクリア',
            export_report: 'レポートをエクスポート',

            maps_directions: '地図と道順',
            current_location: '現在地',
            get_directions: '道順を取得',
            nearby_places: '近くの場所',
            distance: '距離',
            duration: '所要時間',
            estimated_cost: '推定費用',
            route_information: 'ルート情報',
            optimized_route: '最適化されたルート',
            add_stop: '停車地を追加',
            optimize_route: 'ルートを最適化',

            emergency_hub: '緊急ハブ',
            emergency_number: '緊急電話番号',
            sos: 'SOS',
            safety_tips: '安全のヒント',
            travel_alerts: '旅行アラート',

            travel_analytics: '旅行分析',
            total_trips: '総旅行数',
            favorite_destination: 'お気に入りの目的地',
            insights: '洞察',
            refresh: '更新',

            voice_assistant: '音声アシスタント',
            listening: 'リスニング...',
            say_command: 'コマンドを言う',
            start: '開始',
            stop: '停止'
        }
    };

    // --- DOM Reference ---
    let languageSelector = document.getElementById('language-selector');

    // --- State ---
    let currentLanguage = 'en';

    // --- Storage Key ---
    const STORAGE_KEY = 'nextrip_language';

    // --- Helper: Detect Browser Language ---
    function detectBrowserLanguage() {
        const lang = navigator.language || navigator.userLanguage || 'en';
        // Check if we support this language (e.g., 'en-US' -> 'en')
        const baseLang = lang.split('-')[0];
        if (LANGUAGES.some(l => l.code === baseLang)) {
            return baseLang;
        }
        return 'en';
    }

    // --- Load Saved Language ---
    function loadLanguage() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored && LANGUAGES.some(l => l.code === stored)) {
            return stored;
        }
        // Fallback to browser language
        return detectBrowserLanguage();
    }

    // --- Translate Element ---
    function translateElement(el, lang) {
        const key = el.getAttribute('data-translate');
        if (!key) return;
        const translation = TRANSLATIONS[lang]?.[key];
        if (translation !== undefined) {
            // Check if element has child nodes; if it's a text node, replace textContent
            // For input placeholders, etc.
            if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                el.setAttribute('placeholder', translation);
            } else if (el.tagName === 'OPTION') {
                el.textContent = translation;
            } else {
                el.textContent = translation;
            }
        } else {
            // Fallback to English
            const fallback = TRANSLATIONS.en?.[key];
            if (fallback !== undefined) {
                if (el.tagName === 'INPUT' && el.hasAttribute('placeholder')) {
                    el.setAttribute('placeholder', fallback);
                } else if (el.tagName === 'OPTION') {
                    el.textContent = fallback;
                } else {
                    el.textContent = fallback;
                }
            }
        }
    }

    // --- Translate All UI Elements ---
    function translateUI(lang) {
        const elements = document.querySelectorAll('[data-translate]');
        elements.forEach(el => {
            translateElement(el, lang);
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;

        // Update selector value
        if (languageSelector) {
            languageSelector.value = lang;
        }

        // Show toast
        const langName = LANGUAGES.find(l => l.code === lang)?.name || lang;
        window.showToast(`Language switched to ${langName}`, 'info');
    }

    // --- Set Language ---
    function setLanguage(lang) {
        if (!lang || !TRANSLATIONS[lang]) {
            lang = 'en';
        }
        currentLanguage = lang;
        localStorage.setItem(STORAGE_KEY, lang);
        translateUI(lang);
    }

    // --- Initialize Language Selector ---
    function initLanguageSelector() {
        if (!languageSelector) {
            // Create dropdown if not exists
            languageSelector = document.createElement('select');
            languageSelector.id = 'language-selector';
            // Append to a container or to body? We'll assume it's already in HTML.
            // If not, we can add it to the navbar or somewhere.
            // We'll just create it and append to a predefined container.
            const container = document.querySelector('.language-container');
            if (container) {
                container.appendChild(languageSelector);
            } else {
                // Try to find a good place: navbar or footer
                const navbar = document.querySelector('.navbar-glass');
                if (navbar) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'language-container';
                    wrapper.appendChild(languageSelector);
                    navbar.appendChild(wrapper);
                }
            }
        }

        if (languageSelector) {
            // Populate options
            LANGUAGES.forEach(lang => {
                const option = document.createElement('option');
                option.value = lang.code;
                option.textContent = lang.native;
                languageSelector.appendChild(option);
            });

            // Set current value
            languageSelector.value = currentLanguage;

            // Event listener
            languageSelector.addEventListener('change', function() {
                setLanguage(this.value);
            });

            // Style the selector
            languageSelector.style.cssText = `
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255,255,255,0.1);
                color: #e0e0ff;
                padding: 0.3rem 1rem;
                border-radius: 9999px;
                font-size: 0.85rem;
                cursor: pointer;
                outline: none;
                transition: border-color 0.3s;
            `;
            languageSelector.addEventListener('focus', () => {
                languageSelector.style.borderColor = 'rgba(0,240,255,0.5)';
            });
            languageSelector.addEventListener('blur', () => {
                languageSelector.style.borderColor = 'rgba(255,255,255,0.1)';
            });
        }
    }

    // --- Initialize ---
    function init() {
        // Load saved language
        const savedLang = loadLanguage();
        currentLanguage = savedLang;

        // Initialize selector
        initLanguageSelector();

        // Translate UI
        translateUI(currentLanguage);

        console.log(`Language initialized: ${currentLanguage}`);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // --- Expose public API ---
    window.LanguageManager = {
        getCurrentLanguage: () => currentLanguage,
        setLanguage: setLanguage,
        translateElement: translateElement,
        translateUI: translateUI,
        getSupportedLanguages: () => LANGUAGES,
        detectBrowserLanguage: detectBrowserLanguage
    };

})();