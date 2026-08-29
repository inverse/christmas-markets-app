#!/usr/bin/env python3
import json
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import os

# GeoJSON URL
GEOJSON_URL = 'https://www.berlin.de/weihnachtsmarkt/suche/.x-feed/category.geojson?id=10135126&language=en_GB&_rnd=496605'

def get_dd_by_dt_label(dl, label):
    dt = dl.find('dt', string=label)
    return dt.find_next_sibling('dd') if dt else None

async def get_market_details(session, url, semaphore):
    async def fetch():
        async with semaphore, session.get(url) as response:
            text = await response.text()
            soup = BeautifulSoup(text, 'html.parser')
            dl = soup.find('dl', class_='info-container-list')
            
            details = {
                "dates": "Not found",
                "opening_times": "Not found",
                "admission": "Not found",
                "image": None
            }

            if dl:
                for key, label in [("dates", "Dates"), ("opening_times", "Opening Hours"), ("admission", "Admission")]:
                    dd = get_dd_by_dt_label(dl, label)
                    if dd:
                        details[key] = dd.text.strip()

            details["image"] = get_image(soup)
            return details

    try:
        return await fetch()
    except Exception:
        return {"dates": "Error", "opening_times": "Error", "admission": "Error", "image": None}
def get_image(soup):
    # Try og:image
    og_img = soup.find('meta', property='og:image')
    if og_img:
        return og_img.get('content')
    
    # Fallback to swiper
    swiper = soup.find('div', class_='swiper-wrapper')
    if swiper and (img := swiper.find('img')):
        return img.get('src')

    # Fallback to article
    article_img = soup.find('img', class_='js-imageblur')
    return article_img.get('src') if article_img else None

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
        "admission": details["admission"],
        "description": props.get('description', ''),
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
