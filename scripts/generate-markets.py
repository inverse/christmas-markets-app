import json
import requests
from bs4 import BeautifulSoup
import time

# GeoJSON URL
GEOJSON_URL = 'https://www.berlin.de/weihnachtsmarkt/suche/.x-feed/category.geojson?id=10135126&language=en_GB&_rnd=496605'

def get_opening_hours(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the dl element with class 'info-container-list'
        dl = soup.find('dl', class_='info-container-list')
        if not dl:
            return "Not found"
            
        # Find the dt that contains 'Opening Hours'
        dt = dl.find('dt', string='Opening Hours')
        if dt:
            dd = dt.find_next_sibling('dd')
            if dd:
                return dd.text.strip()
        
        return "Not found"
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return "Error"

def main():
    response = requests.get(GEOJSON_URL)
    data = response.json()
    
    markets = []
    
    for feature in data['features']:
        props = feature['properties']
        coords = feature['geometry']['coordinates']
        
        print(f"Fetching {props['title']}...")
        opening_hours = get_opening_hours(props['url'])
        
        markets.append({
            "name": props['title'],
            "address": props['address'],
            "opening_times": opening_hours,
            "coordinates": {
                "lng": coords[0],
                "lat": coords[1]
            },
            "url": props['url']
        })
        time.sleep(1) # Be polite
    
    with open('data/markets.json', 'w') as f:
        json.dump(markets, f, indent=2)

if __name__ == '__main__':
    import os
    os.makedirs('data', exist_ok=True)
    main()
