import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not key:
    print('Missing Supabase credentials')
    exit(1)

supabase = create_client(url, key)

# First get facilities
facilities = supabase.table('facilities').select('*').execute()
print('Facilities:')
for f in facilities.data:
    print(f'  - {f["name"]} (ID: {f["id"]})')

# Then get buildings
buildings = supabase.table('buildings').select('*').execute()
print(f'\nTotal buildings in database: {len(buildings.data)}')
for b in buildings.data:
    print(f'  - {b["name"]} (ID: {b["id"]}, Facility: {b["facility_id"]})')

# Check if there are any buildings for Kabul facility
kabul_facilities = [f for f in facilities.data if 'Kabul' in f['name']]
if kabul_facilities:
    kabul_id = kabul_facilities[0]['id']
    kabul_buildings = [b for b in buildings.data if b['facility_id'] == kabul_id]
    print(f'\nBuildings for Kabul facility ({kabul_id}): {len(kabul_buildings)}')
    for b in kabul_buildings:
        print(f'  - {b["name"]} (ID: {b["id"]})') 