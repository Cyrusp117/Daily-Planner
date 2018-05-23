from django.shortcuts import render

from django.conf import settings
from django.contrib import auth
from django.contrib import sessions
from django.contrib.auth import authenticate
from django.http import HttpResponse
from django.http import QueryDict
from django.shortcuts import redirect
from django.utils import timezone
from yaml import safe_dump

from uber_rides.auth import AuthorizationCodeGrant
from uber_rides.client import UberRidesClient
from uber_auth import utils
from uber_auth.utils import import_app_credentials
from uber_auth.utils import import_oauth2_credentials
from uber_auth.utils import create_uber_client
from uber_auth.utils import request_ufp_ride
from uber_auth.utils import paragraph_print
from uber_auth.utils import response_print
from uber_auth.utils import success_print
from collections import OrderedDict, Counter
import os
# Create your views here.

filename = os.path.join(os.path.dirname(__file__), 'config.rider.yaml')
storage_filename = os.path.join(os.path.dirname(__file__), 'oauth_rider_session_store.yaml')
#print('My settings', open(filename).readlines())
credentials = import_app_credentials(filename)
auth_flow = AuthorizationCodeGrant(
    credentials.get('client_id'),
    credentials.get('scopes'),
    credentials.get('client_secret'),
    credentials.get('redirect_url'),
)

def login_uber(request):
    '''query = QueryDict(mutable=True)
                query.update({
                    'client_id': settings.UBER_CLIENT_ID,
                    'response_type': 'code',
                    'scope': 'profile history ride_widgets',
                    # TODO: Default redirect to /
                    #'state': request.GET.get('next', '/accounts/hello')
                })'''

    print(auth_flow.get_authorization_url(),"=====================")
    return redirect(auth_flow.get_authorization_url())

def connect(request):
    """Connect controller to handle token exchange and query Uber API."""

    # Exchange authorization code for acceess token and create session
    #current_url = request.get_full_path()
    #print(current_url,"=====================")
    session = auth_flow.get_session(request.get_full_path())
    credential = session.oauth2credential
    credential_data = {
        'client_id': credential.client_id,
        'redirect_url': credential.redirect_url,
        'access_token': credential.access_token,
        'expires_in_seconds': credential.expires_in_seconds,
        'scopes': list(credential.scopes),
        'grant_type': credential.grant_type,
        'client_secret': credential.client_secret,
        'refresh_token': credential.refresh_token,
    }
    with open(storage_filename, 'w') as yaml_file:
        yaml_file.write(safe_dump(credential_data, default_flow_style=False))

    oauth_credentials = import_oauth2_credentials()

    client = create_uber_client(oauth_credentials)
    #client = UberRidesClient(session, sandbox_mode=True)

    # Fetch profile for rider
    profile = client.get_rider_profile().json
    #print(profile,"=====================")

    #products = client.get_products().json1
    #print(products,"=====products================")
    #paragraph_print("Request a ride with upfront pricing product.")
    #ride_id = request_ufp_ride(client)

    context = {
        'profile': profile,
    }

    return render(request,'rider_dashboard.html', context)

def request_uber(request):
    #current_url = request.get_full_path()
    #print(current_url,"=====================")
    

    oauth_credentials = import_oauth2_credentials()

    client = create_uber_client(oauth_credentials)
    #client = UberRidesClient(session, sandbox_mode=True)

    # Fetch profile for rider
    profile = client.get_rider_profile().json
    print(profile,"=========Cyrus============")
    picklat = request.POST.get('picklat')
    print(picklat,"=========picklat============")
    #products = client.get_products
    #paragraph_print("Request a ride with upfront pricing product.")
    #ride_id = request_ufp_ride(client)

    context = {
    }

    return render(request,'schedule.html', context)



"""def connect(request):
    #Connect controller to handle token exchange and query Uber API.

    # Exchange authorization code for acceess token and create session
    #current_url = request.get_full_path()
    #print(current_url,"=====================")
    session = auth_flow.get_session(request.get_full_path())
    client = UberRidesClient(session, sandbox_mode=True)

    # Fetch profile for rider
    profile = client.get_rider_profile().json

    # Fetch all trips from history endpoint
    trips = []
    i = 0
    while True:
        try:
            response = client.get_rider_trips(
                limit=50,
                offset=i)
            i += 50
            if len(response.json['history']) > 0:
                trips += response.json['history']
            else:
                break
        except:
            break
            pass

    # Compute trip stats for # of rides and distance
    total_rides = 0
    total_distance_traveled = 0

    # Compute ranked list of # trips per city
    cities = list()
    for ride in trips:
        cities.append(ride['start_city']['display_name'])

        # only parse actually completed trips
        if ride['distance'] > 0:
            total_rides += 1
            total_distance_traveled += int(ride['distance'])

    total_cities = 0
    locations_counter = Counter(cities)
    locations = OrderedDict()
    cities_by_frequency = sorted(cities, key=lambda x: -locations_counter[x])
    for city in list(cities_by_frequency):
        if city not in locations:
            total_cities += 1
            locations[city] = cities.count(city)

    print(profile,"=====================")
    print(trips,"=====================")
    print(locations,"=====================")
    print(total_cities,"=====================")

    context = {
        'profile': profile,
        'trips': trips,
        'locations': locations,
        'total_rides': total_rides,
        'total_cities': total_cities,
        'total_distance_traveled': total_distance_traveled
    }

    return render(request,'rider_dashboard.html', context)"""



