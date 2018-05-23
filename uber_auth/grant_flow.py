
from uber_rides.auth import AuthorizationCodeGrant
# Create your views here.

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
