# Copyright (c) 2017 Uber Technologies, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in
# all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
# THE SOFTWARE.

"""General utilities for command line examples."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function
from __future__ import unicode_literals

from collections import namedtuple
from yaml import safe_load

from uber_rides.client import UberRidesClient
from uber_rides.session import OAuth2Credential
from uber_rides.session import Session
from uber_rides.client import SurgeError
from uber_rides.errors import ClientError
from uber_rides.errors import ServerError
import os

# set your app credentials here
CREDENTIALS_FILENAME = os.path.join(os.path.dirname(__file__), 'config.rider.yaml')

# where your OAuth 2.0 credentials are stored
STORAGE_FILENAME = os.path.join(os.path.dirname(__file__), 'oauth_rider_session_store.yaml')

DEFAULT_CONFIG_VALUES = frozenset([
    'INSERT_CLIENT_ID_HERE',
    'INSERT_CLIENT_SECRET_HERE',
    'INSERT_REDIRECT_URL_HERE',
])

Colors = namedtuple('Colors', 'response, success, fail, end')
COLORS = Colors(
    response='\033[94m',
    success='\033[92m',
    fail='\033[91m',
    end='\033[0m',
)


def success_print(message):
    """Print a message in green text.

    Parameters
        message (str)
            Message to print.
    """
    print(COLORS.success, message, COLORS.end)


def response_print(message):
    """Print a message in blue text.

    Parameters
        message (str)
            Message to print.
    """
    print(COLORS.response, message, COLORS.end)


def fail_print(error):
    """Print an error in red text.

    Parameters
        error (HTTPError)
            Error object to print.
    """
    print(COLORS.fail, error.message, COLORS.end)


def paragraph_print(message):
    """Print message with padded newlines.

    Parameters
        message (str)
            Message to print.
    """
    paragraph = '\n{}\n'
    print(paragraph.format(message))


def import_app_credentials(filename=CREDENTIALS_FILENAME):
    """Import app credentials from configuration file.

    Parameters
        filename (str)
            Name of configuration file.

    Returns
        credentials (dict)
            All your app credentials and information
            imported from the configuration file.
    """
    with open(filename, 'r') as config_file:
        config = safe_load(config_file)

    client_id = config['client_id']
    client_secret = config['client_secret']
    redirect_url = config['redirect_url']

    config_values = [client_id, client_secret, redirect_url]

    for value in config_values:
        if value in DEFAULT_CONFIG_VALUES:
            exit('Missing credentials in {}'.format(filename))

    credentials = {
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_url': redirect_url,
        'scopes': set(config['scopes']),
    }

    return credentials


def import_oauth2_credentials(filename=STORAGE_FILENAME):
    """Import OAuth 2.0 session credentials from storage file.

    Parameters
        filename (str)
            Name of storage file.

    Returns
        credentials (dict)
            All your app credentials and information
            imported from the configuration file.
    """
    with open(filename, 'r') as storage_file:
        storage = safe_load(storage_file)

    # depending on OAuth 2.0 grant_type, these values may not exist
    client_secret = storage.get('client_secret')
    redirect_url = storage.get('redirect_url')
    refresh_token = storage.get('refresh_token')

    credentials = {
        'access_token': storage['access_token'],
        'client_id': storage['client_id'],
        'client_secret': client_secret,
        'expires_in_seconds': storage['expires_in_seconds'],
        'grant_type': storage['grant_type'],
        'redirect_url': redirect_url,
        'refresh_token': refresh_token,
        'scopes': storage['scopes'],
    }

    return credentials

def authorization_code_grant_flow(credentials, storage_filename):
    """Get an access token through Authorization Code Grant.
    Parameters
        credentials (dict)
            All your app credentials and information
            imported from the configuration file.
        storage_filename (str)
            Filename to store OAuth 2.0 Credentials.
    Returns
        (UberRidesClient)
            An UberRidesClient with OAuth 2.0 Credentials.
    """
    auth_flow = AuthorizationCodeGrant(
        credentials.get('client_id'),
        credentials.get('scopes'),
        credentials.get('client_secret'),
        credentials.get('redirect_url'),
    )

    auth_url = auth_flow.get_authorization_url()
    login_message = 'Login as a rider and grant access by going to:\n\n{}\n'
    login_message = login_message.format(auth_url)
    response_print(login_message)

    redirect_url = 'Copy the URL you are redirected to and paste here: \n\n'
    result = input(redirect_url).strip()

    try:
        session = auth_flow.get_session(result)

    except (ClientError, UberIllegalState) as error:
        fail_print(error)
        return

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

    return UberRidesClient(session, sandbox_mode=True)

def create_uber_client(credentials):
    """Create an UberRidesClient from OAuth 2.0 credentials.

    Parameters
        credentials (dict)
            Dictionary of OAuth 2.0 credentials.

    Returns
        (UberRidesClient)
            An authorized UberRidesClient to access API resources.
    """
    oauth2credential = OAuth2Credential(
        client_id=credentials.get('client_id'),
        access_token=credentials.get('access_token'),
        expires_in_seconds=credentials.get('expires_in_seconds'),
        scopes=credentials.get('scopes'),
        grant_type=credentials.get('grant_type'),
        redirect_url=credentials.get('redirect_url'),
        client_secret=credentials.get('client_secret'),
        refresh_token=credentials.get('refresh_token'),
    )
    session = Session(oauth2credential=oauth2credential)
    return UberRidesClient(session, sandbox_mode=True)


def estimate_ride(api_client):
    """Use an UberRidesClient to fetch a ride estimate and print the results.
    Parameters
        api_client (UberRidesClient)
            An authorized UberRidesClient with 'request' scope.
    """
    try:
        estimate = api_client.estimate_ride(
            product_id=SURGE_PRODUCT_ID,
            start_latitude=START_LAT,
            start_longitude=START_LNG,
            end_latitude=END_LAT,
            end_longitude=END_LNG,
            seat_count=2
        )

    except (ClientError, ServerError) as error:
        fail_print(error)

    else:
        success_print(estimate.json)


def update_surge(api_client, surge_multiplier):
    """Use an UberRidesClient to update surge and print the results.
    Parameters
        api_client (UberRidesClient)
            An authorized UberRidesClient with 'request' scope.
        surge_mutliplier (float)
            The surge multiple for a sandbox product. A multiplier greater than
            or equal to 2.0 will require the two stage confirmation screen.
    """
    try:
        update_surge = api_client.update_sandbox_product(
            SURGE_PRODUCT_ID,
            surge_multiplier=surge_multiplier,
        )

    except (ClientError, ServerError) as error:
        fail_print(error)

    else:
        success_print(update_surge.status_code)


def update_ride(api_client, ride_status, ride_id):
    """Use an UberRidesClient to update ride status and print the results.
    Parameters
        api_client (UberRidesClient)
            An authorized UberRidesClient with 'request' scope.
        ride_status (str)
            New ride status to update to.
        ride_id (str)
            Unique identifier for ride to update.
    """
    try:
        update_product = api_client.update_sandbox_ride(ride_id, ride_status)

    except (ClientError, ServerError) as error:
        fail_print(error)

    else:
        message = '{} New status: {}'
        message = message.format(update_product.status_code, ride_status)
        success_print(message)


def request_ufp_ride(api_client):
    """Use an UberRidesClient to request a ride and print the results.
    Parameters
        api_client (UberRidesClient)
            An authorized UberRidesClient with 'request' scope.
    Returns
        The unique ID of the requested ride.
    """
    try:

        estimate = api_client.estimate_ride(
            product_id=UFP_PRODUCT_ID,
            start_latitude=START_LAT,
            start_longitude=START_LNG,
            end_latitude=END_LAT,
            end_longitude=END_LNG,
            seat_count=2
        )
        fare = estimate.json.get('fare')

        request = api_client.request_ride(
            product_id=UFP_PRODUCT_ID,
            start_latitude=START_LAT,
            start_longitude=START_LNG,
            end_latitude=END_LAT,
            end_longitude=END_LNG,
            seat_count=2,
            fare_id=fare['fare_id']
        )

    except (ClientError, ServerError) as error:
        fail_print(error)
        return

    else:
        success_print(estimate.json)
        success_print(request.json)
        return request.json.get('request_id')


def request_surge_ride(api_client, surge_confirmation_id=None):
    """Use an UberRidesClient to request a ride and print the results.
    If the product has a surge_multiple greater than or equal to 2.0,
    a SurgeError is raised. Confirm surge by visiting the
    surge_confirmation_url and automatically try the request again.
    Parameters
        api_client (UberRidesClient)
            An authorized UberRidesClient with 'request' scope.
        surge_confirmation_id (string)
            Unique identifer received after confirming surge.
    Returns
        The unique ID of the requested ride.
    """
    try:
        request = api_client.request_ride(
            product_id=SURGE_PRODUCT_ID,
            start_latitude=START_LAT,
            start_longitude=START_LNG,
            end_latitude=END_LAT,
            end_longitude=END_LNG,
            surge_confirmation_id=surge_confirmation_id,
            seat_count=2
        )

    except SurgeError as e:
        surge_message = 'Confirm surge by visiting: \n{}\n'
        surge_message = surge_message.format(e.surge_confirmation_href)
        response_print(surge_message)

        confirm_url = 'Copy the URL you are redirected to and paste here: \n'
        result = input(confirm_url).strip()

        querystring = urlparse(result).query
        query_params = parse_qs(querystring)
        surge_id = query_params.get('surge_confirmation_id')[0]

        # automatically try request again
        return request_surge_ride(api_client, surge_id)

    except (ClientError, ServerError) as error:
        fail_print(error)
        return

    else:
        success_print(request.json)
        return request.json.get('request_id')


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











