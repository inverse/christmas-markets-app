#!/usr/bin/env python3
import json
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import os

# GeoJSON URL
GEOJSON_URL = 'https://www.berlin.de/weihnachtsmarkt/suche/.x-feed/category.geojson?id=10135126&language=en_GB&_rnd=496605'

async def get_market_details(session, url, semaphore):
    async with semaphore:
        try:
            async with session.get(url) as response:
                text = await response.text()
                soup = BeautifulSoup(text, 'html.parser')
                
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

async def fetch_all_markets():
    async with aiohttp.ClientSession() as session:
        # Fetch the main list first
        async with session.get(GEOJSON_URL) as response:
            data = await response.json()
        
        semaphore = asyncio.Semaphore(5)  # Allow 5 concurrent requests
        tasks = []
        
        for feature in data['features']:
            props = feature['properties']
            coords = feature['geometry']['coordinates']
            tasks.append(process_market(session, semaphore, feature, props, coords))
            
        markets = await asyncio.gather(*tasks)
        return markets

async def process_market(session, semaphore, feature, props, coords):
    print(f"Fetching {props['title']}...")
    details = await get_market_details(session, props['url'], semaphore)
    
    # Construct absolute image URL if needed
    image_url = details["image"]
    if image_url and not image_url.startswith('http'):
            image_url = f"https://www.berlin.de{image_url}"
    
    return {
        "name": props['title'],
        "address": props['address'],
        "dates": details["dates"],
        "opening_times": details["opening_times"],
        "image_url": image_url or props.get('image', {}).get('url'),
        "coordinates": {
            "lng": coords[0],
            "lat": coords[1]
        },
        "url": props['url']
    }

async def main():
    markets = await fetch_all_markets()
    
    with open('data/markets.json', 'w') as f:
        json.dump(markets, f, indent=2)

if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    asyncio.run(main())
