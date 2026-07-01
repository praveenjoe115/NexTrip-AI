import os
import random
import requests
import json
import math
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# API Keys
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY')
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

print("Gemini Loaded:", bool(GEMINI_API_KEY))
print("OpenWeather Loaded:", bool(OPENWEATHER_API_KEY))
print("Google Maps Loaded:", bool(GOOGLE_MAPS_API_KEY))
print("Google Places Loaded:", bool(GOOGLE_PLACES_API_KEY))

# Configure Gemini if key exists
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# -------------------- PAGE ROUTES --------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/planner')
def planner():
    return render_template('planner.html')

@app.route('/maps')
def maps():
    return render_template('maps.html')

@app.route('/nearby')
def nearby():
    return render_template('nearby.html')

@app.route('/weather')
def weather():
    return render_template('weather.html')

@app.route('/hidden-gems')
def hidden_gems():
    return render_template('hidden_gems.html')

@app.route('/budget')
def budget():
    return render_template('budget.html')

@app.route('/journal')
def journal():
    return render_template('journal.html')

@app.route('/favorites')
def favorites():
    return render_template('favorites.html')

@app.route('/analytics')
def analytics():
    return render_template('analytics.html')

@app.route('/route-optimizer')
def route_optimizer():
    return render_template('route_optimizer.html')

@app.route('/emergency')
def emergency():
    return render_template('emergency.html')

# -------------------- API ROUTES --------------------

# POST /api/plan - Generate travel plan via Gemini or fallback
@app.route('/api/plan', methods=['POST'])
def api_plan():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400

        destination = data.get('destination', '').strip()
        days = data.get('days', 3)
        budget = data.get('budget', 'standard')
        travelers = data.get('travelers', 1)
        interests = data.get('interests', [])

        if not destination:
            return jsonify({'error': 'Destination is required'}), 400

        prompt = f"""
Create a detailed travel plan for {destination} for {days} days.
Budget level: {budget}. Travelers: {travelers}.
Interests: {', '.join(interests) if interests else 'general'}.
Include:
- Day-by-day itinerary
- Recommended hotels
- Food suggestions
- Top attractions
- Budget breakdown

Format with clear headings and bullet points.
"""

        if GEMINI_API_KEY:
            try:
                model = genai.GenerativeModel("gemini-2.0-flash")
                response = model.generate_content(prompt)
                plan = response.text
                return jsonify({'plan': plan, 'source': 'gemini'})
            except Exception as e:
                print(f'Gemini plan error: {e}')
                # Fall through to demo

        # Demo fallback
        demo_plan = generate_demo_plan(destination, days, budget, travelers, interests)
        return jsonify({'plan': demo_plan, 'source': 'demo'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST /api/weather - Get weather via OpenWeather or fallback (supports GET and POST)
@app.route('/api/weather', methods=['GET', 'POST'])
def api_weather():
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            city = data.get('city', '').strip()
        else:
            city = request.args.get('city', '').strip()

        if not city:
            return jsonify({'error': 'City is required'}), 400

        if OPENWEATHER_API_KEY:
            try:
                url = f'http://api.openweathermap.org/data/2.5/weather?q={city}&appid={OPENWEATHER_API_KEY}&units=metric'
                resp = requests.get(url, timeout=5)
                print("Requested City:", city)
                print("OpenWeather Status:", resp.status_code)
                print("OpenWeather Response:", resp.text[:500])

                if resp.status_code == 200:
                    w = resp.json()
                    weather = {
                        'city': w.get('name'),
                        'country': w.get('sys', {}).get('country'),
                        'temp': w.get('main', {}).get('temp'),
                        'feels_like': w.get('main', {}).get('feels_like'),
                        'humidity': w.get('main', {}).get('humidity'),
                        'description': w.get('weather', [{}])[0].get('description'),
                        'icon': w.get('weather', [{}])[0].get('icon'),
                        'wind_speed': w.get('wind', {}).get('speed'),
                        'forecast': generate_demo_forecast(w.get('main', {}).get('temp', 22))
                    }
                    return jsonify({'weather': weather, 'source': 'openweather'})
            except Exception as e:
                print(f'Weather API error: {e}')

        # Fallback to demo weather
        return jsonify({'weather': generate_demo_weather(city), 'source': 'demo'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST /api/hidden-gems - Generate hidden gems via Gemini or demo
@app.route('/api/hidden-gems', methods=['POST'])
def api_hidden_gems():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400

        location = data.get('location', '').strip()
        if not location:
            return jsonify({'error': 'Location is required'}), 400

        if GEMINI_API_KEY:
            prompt = f"List 6 hidden gem attractions in {location} that are off the beaten path. For each, provide name, a brief description, and a rating out of 5. Return as JSON array of objects with fields: name, description, rating."
            try:
                model = genai.GenerativeModel("gemini-2.0-flash")
                response = model.generate_content(prompt)
                text = response.text
                # Extract JSON array from markdown if needed
                if '```json' in text:
                    text = text.split('```json')[1].split('```')[0].strip()
                elif '```' in text:
                    text = text.split('```')[1].split('```')[0].strip()
                gems = json.loads(text)
                return jsonify({'gems': gems, 'source': 'gemini'})
            except Exception as e:
                print(f'Gemini hidden gems error: {e}')

        # Demo fallback
        gems = generate_demo_hidden_gems(location)
        return jsonify({'gems': gems, 'source': 'demo'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST /api/journal - Generate an AI story based on journal entry
@app.route('/api/journal', methods=['POST'])
def api_journal():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400

        title = data.get('title', 'Untitled')
        location = data.get('location', 'Unknown')
        content = data.get('content', '')

        if not content:
            # If no content, generate a story based on title/location
            prompt = f"Write a short, engaging travel story about a trip to {location} with the title '{title}'. Make it vivid and personal, around 150-200 words."
            story = generate_ai_story(prompt)
        else:
            # Enhance the existing journal entry
            prompt = f"Given the following journal entry, expand it into a captivating travel story with rich details, emotions, and descriptive language:\n\nTitle: {title}\nLocation: {location}\nEntry: {content}\n\nStory:"
            story = generate_ai_story(prompt)

        return jsonify({'story': story, 'source': 'ai'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST /api/route-optimize - Simulate route optimization
@app.route('/api/route-optimize', methods=['POST'])
def api_route_optimize():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Missing JSON payload'}), 400

        start = data.get('start', '').strip()
        stops = data.get('stops', [])
        if not start:
            return jsonify({'error': 'Start location is required'}), 400
        if not stops or len(stops) < 1:
            return jsonify({'error': 'At least one stop is required'}), 400

        # Simulate route optimization: sort stops alphabetically to appear deterministic
        optimized_stops = sorted(stops)
        points = [start] + optimized_stops

        # Generate random distances and durations between consecutive points
        total_distance = 0
        total_duration = 0
        segments = []
        for i in range(len(points) - 1):
            dist = round(random.uniform(10, 80), 1)
            dur = round(dist * 1.5 + random.uniform(0, 15), 0)
            total_distance += dist
            total_duration += dur
            segments.append({
                'from': points[i],
                'to': points[i+1],
                'distance': dist,
                'duration': dur
            })

        estimated_cost = round(total_distance * 0.15, 2)

        result = {
            'optimized_route': points,
            'segments': segments,
            'total_distance': round(total_distance, 1),
            'total_duration': int(total_duration),
            'estimated_cost': estimated_cost,
            'source': 'simulation'
        }
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST /api/places - Get nearby places using Google Places API or fallback
@app.route('/api/places', methods=['POST', 'GET'])
def api_places():
    try:
        if request.method == 'POST':
            data = request.get_json() or {}
            location = data.get('location', '').strip()
            category = data.get('category', 'tourist_attraction')
        else:
            location = request.args.get('location', '').strip()
            category = request.args.get('type', 'tourist_attraction')

        if not location:
            return jsonify({'error': 'Location is required'}), 400

        # Try to use Google Places API if both keys are available
        if GOOGLE_PLACES_API_KEY and GOOGLE_MAPS_API_KEY:
            try:
                # 1. Geocode the location to get lat/lng
                geocode_url = f'https://maps.googleapis.com/maps/api/geocode/json?address={location}&key={GOOGLE_MAPS_API_KEY}'
                geocode_resp = requests.get(geocode_url, timeout=5)
                geocode_data = geocode_resp.json()
                if geocode_data.get('status') != 'OK' or not geocode_data.get('results'):
                    raise Exception('Geocoding failed')

                lat = geocode_data['results'][0]['geometry']['location']['lat']
                lng = geocode_data['results'][0]['geometry']['location']['lng']

                # 2. Call Places Nearby Search
                places_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
                params = {
                    'location': f'{lat},{lng}',
                    'radius': 5000,
                    'type': category,
                    'key': GOOGLE_PLACES_API_KEY
                }
                places_resp = requests.get(places_url, params=params, timeout=5)
                print("Google Places Status:", places_resp.status_code)
                print("Google Places Response:", places_resp.text[:300])

                if places_resp.status_code == 200:
                    places_data = places_resp.json()
                    if places_data.get('status') == 'OK':
                        results = places_data.get('results', [])
                        places = []
                        for place in results[:20]:  # limit to 20
                            # Compute distance from center
                            place_lat = place.get('geometry', {}).get('location', {}).get('lat')
                            place_lng = place.get('geometry', {}).get('location', {}).get('lng')
                            distance = None
                            if place_lat and place_lng:
                                # Approximate distance in km using haversine
                                R = 6371
                                dlat = math.radians(place_lat - lat)
                                dlng = math.radians(place_lng - lng)
                                a = math.sin(dlat/2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(place_lat)) * math.sin(dlng/2)**2
                                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                                distance = round(R * c, 1)
                            places.append({
                                'name': place.get('name', 'Unnamed'),
                                'vicinity': place.get('vicinity', 'Address not available'),
                                'rating': place.get('rating', 0),
                                'distance': distance if distance is not None else 'N/A',
                                'open_now': place.get('opening_hours', {}).get('open_now', None)
                            })
                        return jsonify({'places': places, 'source': 'google_places'})
                    else:
                        print('Places API status not OK:', places_data.get('status'))
            except Exception as e:
                print(f'Google Places API error: {e}')

        # Fallback to demo places
        places = generate_demo_places(location, category)
        return jsonify({'places': places, 'source': 'demo'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# -------------------- HELPER FUNCTIONS --------------------

def generate_demo_plan(destination, days, budget, travelers, interests):
    interests_str = ', '.join(interests) if interests else 'general'
    return f"""
## 🌍 Demo Travel Plan for {destination}
- **Duration:** {days} days
- **Budget:** {budget}
- **Travelers:** {travelers}
- **Interests:** {interests_str}

**Day 1:** Arrive and check-in. Afternoon explore the city center and local markets. Evening dinner at a traditional restaurant.
**Day 2:** Visit the main attractions: museums, landmarks, and historical sites. Lunch at a local café. Evening cultural performance.
**Day 3:** Day trip to nearby nature spot or heritage village. Return for a farewell dinner.
{f'**Day {days}:** Additional day for leisure, shopping, or exploring hidden gems.' if days > 3 else ''}

**Hotels:** Recommended mid-range hotel in the city center (~$150/night).
**Food:** Try local specialties: street food, regional dishes, and dessert specialties.
**Budget Breakdown:**
- Accommodation: ${150 * days}
- Food: ${50 * days}
- Activities: ${80 * days}
- Transport: ${30 * days}
- Total: ~${(150+50+80+30) * days}

*This is a demo plan. For a personalized plan, add your Gemini API key.*
"""

def generate_demo_weather(city):
    return {
        'city': city,
        'country': 'Demo',
        'temp': 22.5,
        'feels_like': 20.0,
        'humidity': 65,
        'description': 'Partly cloudy',
        'icon': '04d',
        'wind_speed': 3.6,
        'forecast': [
            {'day': 'Tomorrow', 'temp': 24, 'condition': 'Sunny'},
            {'day': 'Day 2', 'temp': 19, 'condition': 'Rain'},
            {'day': 'Day 3', 'temp': 21, 'condition': 'Cloudy'},
            {'day': 'Day 4', 'temp': 23, 'condition': 'Clear'},
            {'day': 'Day 5', 'temp': 20, 'condition': 'Partly cloudy'}
        ]
    }

def generate_demo_forecast(base_temp):
    conditions = ['Sunny', 'Cloudy', 'Rain', 'Clear', 'Partly cloudy', 'Windy']
    forecast = []
    for i in range(1, 6):
        temp = round(base_temp + random.uniform(-5, 5), 1)
        condition = random.choice(conditions)
        forecast.append({
            'day': f'Day {i}',
            'temp': temp,
            'condition': condition
        })
    return forecast

def generate_demo_hidden_gems(location):
    return [
        {
            'name': f'Secret Garden of {location}',
            'description': f'A lush hidden garden tucked away behind old buildings in {location}. Peaceful and perfect for a quiet afternoon.',
            'rating': 4.8
        },
        {
            'name': f'Underground Art Alley',
            'description': f'An alley filled with vibrant street art and small galleries, often overlooked by tourists in {location}.',
            'rating': 4.5
        },
        {
            'name': f'Local Food Market',
            'description': f'A bustling market where locals shop for fresh produce and authentic street food in {location}.',
            'rating': 4.7
        },
        {
            'name': f'Hidden Rooftop Viewpoint',
            'description': f'A secret rooftop offering panoramic views of {location}, perfect for sunset photography.',
            'rating': 4.9
        },
        {
            'name': f'Historic Bookstore Café',
            'description': f'A charming bookstore with a hidden café, a favorite among locals in {location}.',
            'rating': 4.4
        },
        {
            'name': f'Nature Trail to Waterfall',
            'description': f'A serene trail leading to a small waterfall, just outside {location}, ideal for nature lovers.',
            'rating': 4.6
        }
    ]

def generate_demo_places(location, category):
    # Demo places based on category
    names_map = {
        'restaurant': ['The Gourmet Kitchen', 'Spice Garden', 'Urban Bites', 'Seafood Shack', 'Vegan Delight'],
        'hotel': ['Grand Plaza Hotel', 'Sunset Inn', 'City Lodge', 'Heritage Palace', 'Budget Stay'],
        'hospital': ['City General Hospital', 'St. Mary\'s Medical', 'HealthPlus Clinic', 'Emergency Center'],
        'atm': ['Bank of America ATM', 'Chase ATM', 'Wells Fargo ATM', 'Citibank ATM'],
        'shopping_mall': ['City Center Mall', 'Fashion Avenue', 'Market Square', 'Outlet Village'],
        'tourist_attraction': ['Historic Museum', 'Botanical Gardens', 'Art Gallery', 'Sunset Point', 'Ancient Temple']
    }
    names = names_map.get(category, names_map['tourist_attraction'])
    places = []
    for name in names:
        places.append({
            'name': f'{name} - {location}',
            'vicinity': f'123 Main St, {location}',
            'rating': round(random.uniform(3.0, 4.9), 1),
            'distance': round(random.uniform(0.5, 5.0), 1)
        })
    return places

def generate_ai_story(prompt):
    if GEMINI_API_KEY:
        try:
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f'Gemini story error: {e}')
    # Fallback demo story
    return "A magical journey through unknown lands, where every turn revealed a new adventure. The vibrant culture, friendly locals, and breathtaking scenery made it an unforgettable experience. This trip reminded me that the best stories are written by those who dare to explore."


# -------------------- MAIN --------------------
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)