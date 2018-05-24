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
from uber_auth.utils import fail_print
from collections import OrderedDict, Counter
from uber_rides.client import SurgeError
from uber_rides.errors import ClientError
from uber_rides.errors import ServerError
import os
import re
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
    print(profile,"=========profile============")

    #print(request.POST)
    #picklat = request.POST.get('picklat', False)
    #picklng = request.POST.get('picklng', False)
    #destlat = request.POST.get('destlat', False)
    #destlng = request.POST.get('destlng', False)
    #print(picklat,"=========picklat============")
    #print(picklat,"=========picklng============")
    #destlat = round(float(destlat),7)
    #destlng = round(float(destlng),7)
    #print(destlat,"=========destlat============")
    #print(destlng,"=========destlng============")
    destlat = -33.8735656
    destlng = 151.2070837
    picklat = -33.9061325
    picklng = 151.2348343

    UFP_PRODUCT_ID = '52bc2818-85d4-4231-be7e-86b8af2c6c2f'

    #products = client.get_products(picklat,picklng)

    #current = client.get_current_ride_details()
    #pretty(current.json)

    product = client.get_product(product_id=UFP_PRODUCT_ID)
    #success_print(product.json)
    paragraph_print("Request a ride with upfront pricing product.")
    ride_id = request_ufp_ride(client,picklat,picklng,destlat,destlng,UFP_PRODUCT_ID)
    paragraph_print("Update ride status to accepted.")
    update_ride(client, 'accepted', ride_id)
    paragraph_print("Updated ride details.")
    get_ride_details(client, ride_id)
    paragraph_print("Update ride status to completed.")
    update_ride(client, 'completed', ride_id)
    paragraph_print("Updated ride details.")
    get_ride_details(client, ride_id)
    """estimate = client.estimate_ride(
                 product_id=UFP_PRODUCT_ID,
                 start_latitude=picklat,
                 start_longitude=picklng,
                 end_latitude=destlat,
                 end_longitude=destlng,
             )"""
    #pretty(estimate.json)
    """fare = estimate.json.get('fare')
                requestuber = client.request_ride(
                    product_id=UFP_PRODUCT_ID,
                    start_latitude=picklat,
                    start_longitude=picklng,
                    end_latitude=destlat,
                    end_longitude=destlng,
                    fare_id=fare['fare_id']    
                )
                ride_id = requestuber.json.get('request_id')"""
    #paragraph_print("Update ride status to accepted.")
    #update_ride(client, 'accepted', ride_id)
    #success_print(estimate.json)
    """estimate_price = client.get_price_estimates(
                    start_latitude=picklat,
                    start_longitude=picklng,
                    end_latitude=destlat,
                    end_longitude=destlng,
                )"""
    #print(estimate_price.json['prices'][0])
    #for i in estimate_price.json['prices']:
    #    print(i['localized_display_name'])
    #    print(i['distance'])
    #    print(i['estimate'])
    #    print(i['product_id'])
    #    print("=======================")
    #products = client.get_products
    #paragraph_print("Request a ride with upfront pricing product.")
    #ride_id = request_ufp_ride(client)
    #get_map = client.get_ride_map() 
    context = {
    }

    return render(request,'schedule.html', context)


def update_ride(api_client, ride_status, ride_id):
    try:
        update_product = api_client.update_sandbox_ride(ride_id, ride_status)

    except (ClientError, ServerError) as error:
        fail_print(error)

    else:
        message = '{} New status: {}'
        message = message.format(update_product.status_code, ride_status)
        success_print(message)

def get_ride_details(api_client, ride_id):
    """Use an UberRidesClient to get ride details and print the results.
    Parameters
        api_client (UberRidesClient)
            An authorized UberRidesClient with 'request' scope.
        ride_id (str)
            Unique ride identifier.
    """
    try:
        ride_details = api_client.get_ride_details(ride_id)

    except (ClientError, ServerError) as error:
        fail_print(error)

    else:
        success_print(ride_details.json)

def pretty(d, indent=0):
   for key, value in d.items():
      print('\t' * indent + str(key))
      if isinstance(value, dict):
         pretty(value, indent+1)
      else:
         print('\t' * (indent+1) + str(value))