import json
import requests
from bs4 import BeautifulSoup
import time

# GeoJSON URL
GEOJSON_URL = 'https://www.berlin.de/weihnachtsmarkt/suche/.x-feed/category.geojson?id=10135126&language=en_GB&_rnd=496605'

def get_market_details(url):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        details = {
            "dates": "Not found",
            "opening_times": "Not found",
            "image": None
        }
        
        # Find Dates
        dl = soup.find('dl', class_='info-container-list')
        if dl:
            dt = dl.find('dt', string='Dates')
            if dt:
                dd = dt.find_next_sibling('dd')
                if dd:
                    details["dates"] = dd.text.strip()

        # Find Opening Hours
        if dl:
            dt = dl.find('dt', string='Opening Hours')
            if dt:
                dd = dt.find_next_sibling('dd')
                if dd:
                    details["opening_times"] = dd.text.strip()
        # Find Image - More robust lookup
        # Try finding the swiper container first
        # Try finding the OG image
        og_img = soup.find('meta', property='og:image')
        if og_img:
            details["image"] = og_img.get('content')
        
        # Fallback to swiper
        if not details["image"]:
            swiper = soup.find('div', class_='swiper-wrapper')
            if swiper:
                img = swiper.find('img')
                if img:
                    details["image"] = img.get('src')

        # Fallback to article if swiper fails
        if not details["image"]:
             article_img = soup.find('img', class_='js-imageblur')
             if article_img:
                details["image"] = article_img.get('src')
        
        return details
    except Exception as e:
        return {"dates": "Error", "opening_times": "Error", "image": None}

def main():
    response = requests.get(GEOJSON_URL)
    data = response.json()
    
    markets = []
    
    for feature in data['features']:
        props = feature['properties']
        coords = feature['geometry']['coordinates']
        
        print(f"Fetching {props['title']}...")
        details = get_market_details(props['url'])
        
        # Construct absolute image URL if needed
        image_url = details["image"]
        if image_url and not image_url.startswith('http'):
             image_url = f"https://www.berlin.de{image_url}"
        
        markets.append({
            "name": props['title'],
            "address": props['address'],
            "dates": details["dates"],
            "opening_times": details["opening_times"],
            "image_url": image_url or props['image']['url'],
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
